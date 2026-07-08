import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/rfqs/:id/proposals
// Devuelve el tablero comparativo, solo para el comprador dueño del RFQ.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.orgType !== "BUYER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rfq = await prisma.rfq.findUnique({ where: { id } });
  if (!rfq || rfq.buyerOrgId !== session.orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { rfqId: id },
    include: {
      supplierOrg: { select: { id: true, name: true, verified: true } },
      proposal: true,
    },
  });

  const board = invitations
    .filter((inv) => inv.proposal)
    .map((inv) => ({
      supplierOrgId: inv.supplierOrg.id,
      supplierName: inv.supplierOrg.name,
      verified: inv.supplierOrg.verified,
      price: inv.proposal!.price,
      deliveryTime: inv.proposal!.deliveryTime,
      warranty: inv.proposal!.warranty,
      comments: inv.proposal!.comments,
    }));

  return NextResponse.json(board);
}
