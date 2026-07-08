import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/invitations -> invitaciones DEL PROVEEDOR EN SESIÓN, únicamente.
// Nunca se listan invitaciones de otros proveedores para el mismo RFQ.
export async function GET() {
  const session = await getSession();
  if (!session || (session.orgType !== "SUPPLIER" && session.orgType !== "BOTH")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { supplierOrgId: session.orgId },
    include: {
      rfq: { select: { id: true, title: true, category: true, city: true, deadline: true, description: true } },
      proposal: true,
    },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json(invitations);
}
