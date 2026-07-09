import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyAwardWinner, notifyAwardNotWinner } from "@/lib/email";
import { z } from "zod";

const awardSchema = z.object({
  invitationId: z.string(),
});

// POST /api/rfqs/:id/award
// El comprador elige un ganador entre las propuestas recibidas.
// Efectos: cierra el RFQ, marca la invitación ganadora como WON y el resto
// como LOST, y notifica a todos los proveedores invitados — a los que no
// ganaron solo se les dice que el proceso finalizó, nunca el precio ganador.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rfqId } = await params;
  const session = await getSession();
  if (!session || session.orgType !== "BUYER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = awardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
  if (!rfq || rfq.buyerOrgId !== session.orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (rfq.status === "CLOSED") {
    return NextResponse.json({ error: "Esta solicitud ya fue adjudicada" }, { status: 400 });
  }

  const winningInvitation = await prisma.invitation.findUnique({
    where: { id: parsed.data.invitationId },
    include: { proposal: true },
  });
  if (!winningInvitation || winningInvitation.rfqId !== rfqId || !winningInvitation.proposal) {
    return NextResponse.json(
      { error: "La invitación ganadora debe pertenecer a este RFQ y tener una propuesta" },
      { status: 400 }
    );
  }

  const allInvitations = await prisma.invitation.findMany({
    where: { rfqId },
    include: { supplierOrg: { include: { users: { take: 1 } } } },
  });

  const losers = allInvitations.filter((inv) => inv.id !== winningInvitation.id);

  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: winningInvitation.id },
      data: { result: "WON" },
    }),
    ...losers.map((inv) =>
      prisma.invitation.update({
        where: { id: inv.id },
        data: { result: "LOST" },
      })
    ),
    prisma.rfq.update({ where: { id: rfqId }, data: { status: "CLOSED" } }),
  ]);

  // Notificaciones — el ganador se entera que ganó, los demás solo que
  // el proceso terminó. Nunca se revela el precio ganador a nadie más.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const winnerOrg = allInvitations.find((inv) => inv.id === winningInvitation.id)?.supplierOrg;

  await Promise.allSettled([
    winnerOrg?.users[0]
      ? notifyAwardWinner({ supplierEmail: winnerOrg.users[0].email, rfqTitle: rfq.title, appUrl })
      : Promise.resolve(),
    ...losers
      .filter((inv) => inv.supplierOrg.users[0])
      .map((inv) =>
        notifyAwardNotWinner({ supplierEmail: inv.supplierOrg.users[0].email, rfqTitle: rfq.title })
      ),
  ]);

  return NextResponse.json({ message: "Solicitud adjudicada correctamente" });
}
