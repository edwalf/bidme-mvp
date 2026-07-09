import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findBestSuppliers } from "@/lib/matching";
import { getSession } from "@/lib/session";

// GET /api/rfqs/:id/matching
// Devuelve los resultados del Smart Matching para la pantalla de revisión.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.orgType !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rfq = await prisma.rfq.findUnique({ where: { id } });
    if (!rfq || rfq.buyerOrgId !== session.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const scored = await findBestSuppliers(rfq);

    return NextResponse.json({
      rfq: { id: rfq.id, title: rfq.title, category: rfq.category, city: rfq.city, status: rfq.status },
      counts: {
        total: scored.length,
        high: scored.filter((s) => s.tier === "HIGH").length,
        medium: scored.filter((s) => s.tier === "MEDIUM").length,
        low: scored.filter((s) => s.tier === "LOW").length,
      },
      suppliers: scored.map((s) => ({
        id: s.supplier.id,
        name: s.supplier.name,
        category: s.supplier.mainCategory || s.supplier.categories[0] || "—",
        city: s.supplier.city || s.supplier.coverageCity || "—",
        score: s.score,
        tier: s.tier,
        reasons: s.reasons,
        isPremium: s.supplier.isPremium,
        verified: s.supplier.verified,
        coverageNational: s.supplier.coverageNational,
        coverageDepartment: s.supplier.coverageDepartment,
      })),
    });
  } catch (err) {
    console.error("Matching results error:", err);
    return NextResponse.json({ error: "Error obteniendo resultados" }, { status: 500 });
  }
}
