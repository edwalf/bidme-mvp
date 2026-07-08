import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
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
  return NextResponse.json(proposal, { status: 201 });
}
