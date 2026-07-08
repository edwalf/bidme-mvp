import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const createRfqSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  city: z.string(),
  deadline: z.string(), // ISO date
  budget: z.number().optional(),
  requirements: z.string().optional(),
});

// GET /api/rfqs -> lista de solicitudes DEL COMPRADOR EN SESIÓN
export async function GET() {
  const session = await getSession();
  if (!session || session.orgType !== "BUYER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rfqs = await prisma.rfq.findMany({
    where: { buyerOrgId: session.orgId },
    include: { invitations: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rfqs);
}

// POST /api/rfqs -> crea el RFQ en estado DRAFT para la organización en sesión.
// Nota: intencionalmente NO recibe lista de proveedores. Eso lo decide
// el motor de matching al momento de publicar (ver /api/rfqs/[id]/publish).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.orgType !== "BUYER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRfqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rfq = await prisma.rfq.create({
    data: {
      ...parsed.data,
      deadline: new Date(parsed.data.deadline),
      buyerOrgId: session.orgId,
      status: "DRAFT",
    },
  });

  return NextResponse.json(rfq, { status: 201 });
}
