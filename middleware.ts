import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-in-production"
);

// Middleware corre en Edge runtime: no puede usar Prisma ni bcrypt,
// solo verificar el JWT de sesión. La lógica de negocio y las
// validaciones de orgId viven en los route handlers (Node runtime).
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("bidme_session")?.value;
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/buyer") || pathname.startsWith("/supplier");

  if (!isProtected) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (pathname.startsWith("/buyer") && payload.orgType === "SUPPLIER") {
      return NextResponse.redirect(new URL("/supplier/dashboard", req.url));
    }
    if (pathname.startsWith("/supplier") && payload.orgType === "BUYER") {
      return NextResponse.redirect(new URL("/buyer/dashboard", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/supplier/:path*"],
};
