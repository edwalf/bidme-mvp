import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-gray-100 text-gray-400 border-gray-200",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente de respuesta",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
};

export default async function SupplierInvitationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const invitations = await prisma.invitation.findMany({
    where: { supplierOrgId: session.orgId },
    include: { rfq: true, proposal: true },
    orderBy: { invitedAt: "desc" },
  });

  return (
    <div>
      <div className="px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">Invitaciones</h1>
      </div>
      <div className="px-8 py-6 space-y-3">
        {invitations.length === 0 && (
          <div className="text-[13px] text-gray-400 text-center py-10">
            Aún no has recibido invitaciones. Te notificaremos en cuanto BidMe identifique una solicitud compatible con tu perfil.
          </div>
        )}
        {invitations.map((inv) => {
          const badge =
            inv.result === "WON"
              ? { style: "bg-[#C9A227]/10 text-[#0F1B2E] border-[#C9A227]/40", label: "🏆 Ganaste" }
              : inv.result === "LOST"
              ? { style: "bg-gray-100 text-gray-400 border-gray-200", label: "Proceso finalizado" }
              : { style: STATUS_STYLES[inv.status], label: STATUS_LABELS[inv.status] };
          return (
            <Link
              key={inv.id}
              href={`/supplier/invitations/${inv.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 text-[13.5px]">{inv.rfq.title}</div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.style}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[12px] text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={11} /> {inv.rfq.city}</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(inv.rfq.deadline).toLocaleDateString("es-GT")}</span>
                <span>{inv.rfq.category}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
