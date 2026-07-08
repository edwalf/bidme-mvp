import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const registerSchema = z.object({
  orgName: z.string().min(2),
  orgType: z.enum(["BUYER", "SUPPLIER"]),
  city: z.string().optional(),
  categories: z.array(z.string()).optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const org = await prisma.organization.create({
    data: {
      name: data.orgName,
      type: data.orgType,
      city: data.city,
      categories: data.categories ?? [],
      verified: data.orgType === "BUYER", // los proveedores requieren verificación manual de admin
      users: {
        create: { email: data.email, name: data.name, passwordHash },
      },
    },
    include: { users: true },
  });

  const user = org.users[0];
  const token = await createSessionToken({
    userId: user.id,
    orgId: org.id,
    orgType: org.type,
    email: user.email,
  });

  const res = NextResponse.json({
    orgId: org.id,
    orgType: org.type,
    redirectTo: org.type === "BUYER" ? "/buyer/dashboard" : "/supplier/dashboard",
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
