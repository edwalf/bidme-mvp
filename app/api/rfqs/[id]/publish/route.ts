import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeMatching } from "@/lib/matching";
import { getSession } from "@/lib/session";

// POST /api/rfqs/:id/publish
// Ejecuta el Smart Matching Engine: calcula scores para todos los
// proveedores compatibles y deja el RFQ en estado MATCHING.
// Las invitaciones se crean después, cuando el comprador confirma
// en la pantalla de resultados (/api/rfqs/:id/matching/invite).
export async function POST(
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
    if (!rfq) {
      return NextResponse.json({ error: "RFQ no encontrado" }, { status: 404 });
    }
    if (rfq.buyerOrgId !== session.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (rfq.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Solo se puede publicar un RFQ en estado borrador" },
        { status: 400 }
      );
    }

    const { counts } = await executeMatching(id);

    return NextResponse.json({
      message: `Smart Matching encontró ${counts.total} proveedores compatibles`,
      counts,
      redirectTo: `/buyer/requests/${id}/matching`,
    });
  } catch (err) {
    console.error("Publish/matching error:", err);
    return NextResponse.json(
      { error: "Error ejecutando el matching. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
