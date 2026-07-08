import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SupplierDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const invitations = await prisma.invitation.findMany({
    where: { supplierOrgId: session.orgId },
    include: { proposal: true },
  });

  const pending = invitations.filter((i) => i.status === "PENDING").length;
  const accepted = invitations.filter((i) => i.status === "ACCEPTED").length;
  const sent = invitations.filter((i) => i.proposal).length;

  return (
    <div>
      <div className="px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">Dashboard</h1>
      </div>
      <div className="px-8 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[12px] text-gray-500">Invitaciones pendientes</div>
            <div className="text-[24px] font-semibold text-gray-900 mt-1">{pending}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[12px] text-gray-500">Aceptadas</div>
            <div className="text-[24px] font-semibold text-gray-900 mt-1">{accepted}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[12px] text-gray-500">Propuestas enviadas</div>
            <div className="text-[24px] font-semibold text-gray-900 mt-1">{sent}</div>
          </div>
        </div>
        <Link href="/supplier/invitations" className="text-[#C9A227] text-[13px] font-medium">
          Ver todas mis invitaciones →
        </Link>
        <p className="text-[11.5px] text-gray-400 mt-4 max-w-md">
          Estas invitaciones te llegaron automáticamente porque BidMe identificó que tu perfil coincide con lo que el comprador necesita. No existe un directorio donde los compradores te busquen manualmente: el algoritmo decide.
        </p>
      </div>
    </div>
  );
}
