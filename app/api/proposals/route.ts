import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyProposalReceived } from "@/lib/email";
import { z } from "zod";

const createProposalSchema = z.object({
  invitationId: z.string(),
  price: z.number().positive(),
  deliveryTime: z.string(),
  warranty: z.string(),
  comments: z.string().optional(),
});

// POST /api/proposals
// Crea una propuesta privada asociada a una invitación aceptada,
// exclusivamente para el proveedor dueño de esa invitación.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.orgType !== "SUPPLIER" && session.orgType !== "BOTH")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: parsed.data.invitationId },
    include: {
      rfq: { include: { buyerOrg: { include: { users: { take: 1 } } } } },
      supplierOrg: true,
    },
  });
  if (!invitation || invitation.supplierOrgId !== session.orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (invitation.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "La invitación debe estar aceptada antes de enviar una propuesta" },
      { status: 400 }
    );
  }

  const proposal = await prisma.proposal.create({
    data: {
      invitationId: parsed.data.invitationId,
      supplierOrgId: session.orgId,
      price: parsed.data.price,
      deliveryTime: parsed.data.deliveryTime,
      warranty: parsed.data.warranty,
      comments: parsed.data.comments,
    },
  });

  const buyerUser = invitation.rfq.buyerOrg.users[0];
  if (buyerUser) {
    await notifyProposalReceived({
      buyerEmail: buyerUser.email,
      rfqTitle: invitation.rfq.title,
      supplierOrgName: invitation.supplierOrg.name,
      rfqId: invitation.rfqId,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });
  }

  return NextResponse.json(proposal, { status: 201 });
}
