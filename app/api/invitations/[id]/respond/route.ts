import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const respondSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

// POST /api/invitations/:id/respond
// El proveedor solo puede ver y responder SU PROPIA invitación.
// Nunca se expone aquí ni en ningún otro endpoint la lista de
// otros proveedores invitados al mismo RFQ.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || (session.orgType !== "SUPPLIER" && session.orgType !== "BOTH")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }
  if (invitation.supplierOrgId !== session.orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const updated = await prisma.invitation.update({
    where: { id },
    data: { status: parsed.data.action === "ACCEPT" ? "ACCEPTED" : "REJECTED" },
  });

  return NextResponse.json(updated);
}
