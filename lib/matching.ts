import { prisma } from "./prisma";
import { notifyNewInvitation } from "./email";
import type { Organization, Rfq } from "@prisma/client";

/**
 * ============================================================
 * BidMe — Smart Matching Engine (v1)
 * ============================================================
 * El corazón del producto: cuando un comprador publica un RFQ,
 * este módulo identifica automáticamente a los proveedores más
 * relevantes, calcula un Match Score (0-100) y prepara las
 * invitaciones — sin que el comprador tenga que buscar a nadie.
 *
 * Arquitectura:
 *   calculateSupplierScore()     — score puro de un proveedor vs un RFQ
 *   findBestSuppliers()          — evalúa candidatos y clasifica por tier
 *   executeMatching()            — orquesta: corre el matching y persiste scores
 *   createAutomaticInvitations() — genera invitaciones + notificaciones
 *
 * Toda la lógica vive aquí. Los componentes React solo consumen resultados.
 * ============================================================
 */

export const MATCHING_VERSION = "v1";

// --- Pesos configurables (suman 100) -------------------------------------
export const WEIGHTS = {
  CATEGORY_WEIGHT: 35,     // categoría exacta es la señal más fuerte
  SUBCATEGORY_WEIGHT: 15,  // afinar dentro de la categoría
  LOCATION_WEIGHT: 20,     // misma ciudad > departamento > nacional
  RATING_WEIGHT: 10,       // historial de calificaciones (cuando exista)
  PREMIUM_WEIGHT: 10,
  VERIFIED_WEIGHT: 10,
} as const;

// Umbrales de clasificación por tier
export const TIERS = {
  HIGH: 70,   // score >= 70 → coincidencia alta
  MEDIUM: 40, // score >= 40 → coincidencia media; debajo → baja
} as const;

export type MatchTier = "HIGH" | "MEDIUM" | "LOW";

export interface ScoredSupplier {
  supplier: Organization;
  score: number;
  tier: MatchTier;
  reasons: string[];
  breakdown: Record<string, number>;
}

// --------------------------------------------------------------------------
// 1. Score puro — sin efectos secundarios, fácil de testear
// --------------------------------------------------------------------------
export function calculateSupplierScore(supplier: Organization, rfq: Rfq): {
  score: number;
  reasons: string[];
  breakdown: Record<string, number>;
} {
  const reasons: string[] = [];
  const breakdown: Record<string, number> = {};

  // Categoría (compatibilidad: revisa mainCategory nuevo y categories[] legado)
  const categoryMatches =
    supplier.mainCategory === rfq.category || supplier.categories.includes(rfq.category);
  breakdown.category = categoryMatches ? WEIGHTS.CATEGORY_WEIGHT : 0;
  if (categoryMatches) reasons.push("Categoría exacta");

  // Subcategoría (solo suma si además coincide la categoría)
  const subMatches =
    categoryMatches && rfq.subCategory && supplier.subCategory === rfq.subCategory;
  breakdown.subCategory = subMatches ? WEIGHTS.SUBCATEGORY_WEIGHT : 0;
  if (subMatches) reasons.push("Subcategoría exacta");

  // Cobertura geográfica: ciudad > departamento > nacional
  let locationScore = 0;
  if (supplier.coverageCity === rfq.city || supplier.city === rfq.city) {
    locationScore = WEIGHTS.LOCATION_WEIGHT;
    reasons.push("Misma ciudad");
  } else if (supplier.coverageDepartment) {
    locationScore = WEIGHTS.LOCATION_WEIGHT * 0.6;
    reasons.push("Mismo departamento");
  } else if (supplier.coverageNational) {
    locationScore = WEIGHTS.LOCATION_WEIGHT * 0.4;
    reasons.push("Cobertura nacional");
  }
  breakdown.location = locationScore;

  // Rating histórico (0-5). Si aún no hay datos, aporta un neutro 50% del peso
  // para no castigar a proveedores nuevos.
  breakdown.rating =
    supplier.rating != null
      ? (supplier.rating / 5) * WEIGHTS.RATING_WEIGHT
      : WEIGHTS.RATING_WEIGHT * 0.5;
  if (supplier.rating != null && supplier.rating >= 4) reasons.push("Alta calificación");

  // Premium y Verificado
  breakdown.premium = supplier.isPremium ? WEIGHTS.PREMIUM_WEIGHT : 0;
  if (supplier.isPremium) reasons.push("Premium");
  breakdown.verified = supplier.verified ? WEIGHTS.VERIFIED_WEIGHT : 0;
  if (supplier.verified) reasons.push("Verificado");

  const score = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { score, reasons, breakdown };
}

function tierOf(score: number): MatchTier {
  if (score >= TIERS.HIGH) return "HIGH";
  if (score >= TIERS.MEDIUM) return "MEDIUM";
  return "LOW";
}

// --------------------------------------------------------------------------
// 2. Encontrar y clasificar candidatos
// --------------------------------------------------------------------------
export async function findBestSuppliers(rfq: Rfq): Promise<ScoredSupplier[]> {
  // Solo proveedores ACTIVOS. El filtro por categoría se hace en memoria
  // porque combina campo nuevo (mainCategory) y legado (categories[]);
  // con decenas de miles de proveedores, mover esto a un WHERE indexado.
  const candidates = await prisma.organization.findMany({
    where: {
      type: { in: ["SUPPLIER", "BOTH"] },
      active: true,
    },
  });

  // Regla: no volver a invitar a quien ya tiene invitación para este RFQ.
  const alreadyInvited = await prisma.invitation.findMany({
    where: { rfqId: rfq.id },
    select: { supplierOrgId: true },
  });
  const invitedIds = new Set(alreadyInvited.map((i) => i.supplierOrgId));

  return candidates
    .filter((s) => !invitedIds.has(s.id))
    .map((supplier) => {
      const { score, reasons, breakdown } = calculateSupplierScore(supplier, rfq);
      return { supplier, score, tier: tierOf(score), reasons, breakdown };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

// --------------------------------------------------------------------------
// 3. Ejecutar matching: calcula, persiste scores y metadata del RFQ.
//    NO crea invitaciones — eso ocurre cuando el comprador confirma.
// --------------------------------------------------------------------------
export async function executeMatching(rfqId: string) {
  const rfq = await prisma.rfq.findUniqueOrThrow({ where: { id: rfqId } });
  const scored = await findBestSuppliers(rfq);

  await prisma.$transaction([
    // upsert para permitir re-ejecutar el matching sin duplicar
    ...scored.map((s) =>
      prisma.matchScore.upsert({
        where: { rfqId_supplierOrgId: { rfqId, supplierOrgId: s.supplier.id } },
        create: { rfqId, supplierOrgId: s.supplier.id, score: s.score, breakdown: s.breakdown },
        update: { score: s.score, breakdown: s.breakdown },
      })
    ),
    prisma.rfq.update({
      where: { id: rfqId },
      data: {
        status: "MATCHING",
        matchedSuppliers: scored.length,
        matchingExecutedAt: new Date(),
        matchingVersion: MATCHING_VERSION,
      },
    }),
  ]);

  const counts = {
    total: scored.length,
    high: scored.filter((s) => s.tier === "HIGH").length,
    medium: scored.filter((s) => s.tier === "MEDIUM").length,
    low: scored.filter((s) => s.tier === "LOW").length,
  };

  return { scored, counts };
}

// --------------------------------------------------------------------------
// 4. Crear invitaciones automáticas para los proveedores seleccionados
// --------------------------------------------------------------------------
export async function createAutomaticInvitations(rfqId: string, supplierOrgIds: string[]) {
  const rfq = await prisma.rfq.findUniqueOrThrow({ where: { id: rfqId } });

  // Recalcular score/razones para guardar en cada invitación (trazabilidad)
  const suppliers = await prisma.organization.findMany({
    where: { id: { in: supplierOrgIds } },
    include: { users: { take: 1 } },
  });

  const invitationData = suppliers.map((supplier) => {
    const { score, reasons } = calculateSupplierScore(supplier, rfq);
    return {
      rfqId,
      supplierOrgId: supplier.id,
      matchScore: score,
      matchReason: reasons.join(" · "),
      invitedAutomatically: true,
    };
  });

  await prisma.$transaction([
    ...invitationData.map((data) =>
      prisma.invitation.upsert({
        where: { rfqId_supplierOrgId: { rfqId, supplierOrgId: data.supplierOrgId } },
        create: data,
        update: {}, // ya invitado: no duplicar ni modificar
      })
    ),
    prisma.rfq.update({ where: { id: rfqId }, data: { status: "PUBLISHED" } }),
  ]);

  // Notificaciones por correo (estructura lista; no bloquea si Resend no está configurado)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await Promise.allSettled(
    suppliers
      .filter((org) => org.users[0])
      .map((org) =>
        notifyNewInvitation({
          supplierEmail: org.users[0].email,
          supplierOrgName: org.name,
          rfqTitle: rfq.title,
          rfqCategory: rfq.category,
          rfqCity: rfq.city,
          appUrl,
        })
      )
  );

  return { invitedCount: suppliers.length };
}
