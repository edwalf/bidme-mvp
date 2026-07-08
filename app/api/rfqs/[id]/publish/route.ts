import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runMatchingEngine } from "@/lib/matching";
import { getSession } from "@/lib/session";

// POST /api/rfqs/:id/publish
// Este endpoint dispara el motor de matching automáticamente.
// No recibe ni acepta una lista de proveedores en el body:
// esa decisión es exclusiva del algoritmo.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  await prisma.rfq.update({ where: { id: rfq.id }, data: { status: "MATCHING" } });

  const result = await runMatchingEngine(rfq.id);

  return NextResponse.json({
    message: `Solicitud enviada a ${result.invitedCount} proveedores calificados`,
    invitedCount: result.invitedCount,
  });
}
