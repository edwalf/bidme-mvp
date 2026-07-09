import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAutomaticInvitations } from "@/lib/matching";
import { getSession } from "@/lib/session";
import { z } from "zod";

const inviteSchema = z.object({
  supplierOrgIds: z.array(z.string()).min(1, "Selecciona al menos un proveedor"),
});

// POST /api/rfqs/:id/matching/invite
// Crea las invitaciones automáticas para los proveedores seleccionados
// y publica el RFQ. Dispara las notificaciones por correo.
export async function POST(
  req: NextRequest,
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
    if (rfq.status !== "MATCHING") {
      return NextResponse.json(
        { error: "Este RFQ no está en fase de matching" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Selecciona al menos un proveedor" }, { status: 400 });
    }

    const result = await createAutomaticInvitations(id, parsed.data.supplierOrgIds);

    return NextResponse.json({
      message: `Invitaciones enviadas a ${result.invitedCount} proveedores`,
      invitedCount: result.invitedCount,
    });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Error creando invitaciones" }, { status: 500 });
  }
}
