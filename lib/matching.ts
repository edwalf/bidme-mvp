import { prisma } from "./prisma";

/**
 * Motor de Matching de BidMe.
 *
 * Regla de negocio central: el comprador NUNCA elige proveedores.
 * Esta función corre automáticamente al publicar un RFQ y decide,
 * mediante un score ponderado, a qué proveedores invitar.
 *
 * Esta es una versión MVP con reglas explícitas (sin ML todavía).
 * Cada peso puede ajustarse por categoría más adelante sin cambiar
 * la interfaz pública de la función.
 */

const WEIGHTS = {
  categoryMatch: 0.35,
  cityMatch: 0.2,
  verified: 0.15,
  responseHistory: 0.15, // placeholder MVP: usa un valor fijo hasta tener historial real
  participationRate: 0.15, // placeholder MVP
};

const MAX_INVITATIONS = 6;
const MIN_SCORE_THRESHOLD = 0.35; // por debajo de esto, no vale la pena invitar

export interface ScoredSupplier {
  supplierOrgId: string;
  score: number;
  breakdown: Record<string, number>;
}

export async function runMatchingEngine(rfqId: string) {
  const rfq = await prisma.rfq.findUniqueOrThrow({ where: { id: rfqId } });

  const candidateSuppliers = await prisma.organization.findMany({
    where: {
      type: { in: ["SUPPLIER", "BOTH"] },
    },
  });

  const scored: ScoredSupplier[] = candidateSuppliers.map((supplier) => {
    const categoryMatch = supplier.categories.includes(rfq.category) ? 1 : 0;
    const cityMatch = supplier.city === rfq.city ? 1 : 0.3; // 0.3 = cobertura parcial/remota
    const verified = supplier.verified ? 1 : 0;

    // MVP: valores fijos razonables hasta que exista historial real por proveedor.
    // En V2 estos se calculan desde Invitation/Proposal históricas del supplier.
    const responseHistory = 0.7;
    const participationRate = 0.7;

    const breakdown = {
      categoryMatch: categoryMatch * WEIGHTS.categoryMatch,
      cityMatch: cityMatch * WEIGHTS.cityMatch,
      verified: verified * WEIGHTS.verified,
      responseHistory: responseHistory * WEIGHTS.responseHistory,
      participationRate: participationRate * WEIGHTS.participationRate,
    };

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { supplierOrgId: supplier.id, score, breakdown };
  });

  const selected = scored
    .filter((s) => s.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_INVITATIONS);

  // Persistir todos los scores calculados (para auditoría interna / mejora futura),
  // pero solo se generan invitaciones para los seleccionados.
  await prisma.$transaction([
    ...scored.map((s) =>
      prisma.matchScore.create({
        data: {
          rfqId,
          supplierOrgId: s.supplierOrgId,
          score: s.score,
          breakdown: s.breakdown,
        },
      })
    ),
    ...selected.map((s) =>
      prisma.invitation.create({
        data: {
          rfqId,
          supplierOrgId: s.supplierOrgId,
          status: "PENDING",
        },
      })
    ),
    prisma.rfq.update({
      where: { id: rfqId },
      data: { status: "PUBLISHED" },
    }),
  ]);

  return { invitedCount: selected.length, evaluatedCount: scored.length };
}
