import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Plus, MapPin } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-500 border-gray-200",
  MATCHING: "bg-amber-50 text-amber-700 border-amber-200",
  PUBLISHED: "bg-blue-50 text-blue-700 border-blue-200",
  CLOSED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-gray-100 text-gray-400 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  MATCHING: "Buscando proveedores",
  PUBLISHED: "Activa",
  CLOSED: "Finalizada",
  CANCELLED: "Cancelada",
};

export default async function BuyerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rfqs = await prisma.rfq.findMany({
    where: { buyerOrgId: session.orgId },
    include: { invitations: { include: { proposal: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = rfqs.filter((r) => r.status === "PUBLISHED").length;
  const totalProposals = rfqs.reduce((sum, r) => sum + r.invitations.filter((i) => i.proposal).length, 0);
  const totalInvited = rfqs.reduce((sum, r) => sum + r.invitations.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">Dashboard</h1>
        <Link href="/buyer/requests/new" className="flex items-center gap-1.5 bg-[#C9A227] text-[#0F1B2E] text-[12.5px] font-medium px-3 py-1.5 rounded-lg hover:bg-[#B8911F] transition-colors duration-150">
          <Plus size={14} /> Nueva Solicitud
        </Link>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[12px] text-gray-500">Solicitudes activas</div>
            <div className="text-[24px] font-semibold text-gray-900 mt-1">{activeCount}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[12px] text-gray-500">Cotizaciones recibidas</div>
            <div className="text-[24px] font-semibold text-gray-900 mt-1">{totalProposals}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[12px] text-gray-500">Proveedores invitados (total)</div>
            <div className="text-[24px] font-semibold text-gray-900 mt-1">{totalInvited}</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 text-[13px] font-medium text-gray-700">
            Tus solicitudes
          </div>
          {rfqs.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-gray-400">
              Aún no tienes solicitudes. Crea la primera en menos de 2 minutos.
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-gray-400 text-[11.5px] uppercase tracking-wide">
                  <th className="px-5 py-2.5 font-medium">Título</th>
                  <th className="px-5 py-2.5 font-medium">Categoría</th>
                  <th className="px-5 py-2.5 font-medium">Ciudad</th>
                  <th className="px-5 py-2.5 font-medium">Cotizaciones</th>
                  <th className="px-5 py-2.5 font-medium">Estado</th>
                  <th className="px-5 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors duration-150">
                    <td className="px-5 py-3 text-gray-900 font-medium">{r.title}</td>
                    <td className="px-5 py-3 text-gray-500">{r.category}</td>
                    <td className="px-5 py-3 text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {r.city}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {r.invitations.filter((i) => i.proposal).length}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.status === "DRAFT" ? (
                        <Link href="/buyer/requests/new" className="text-[#C9A227] font-medium text-[12.5px]">
                          Continuar
                        </Link>
                      ) : (
                        <Link href={`/buyer/requests/${r.id}/compare`} className="text-[#C9A227] font-medium text-[12.5px]">
                          Ver comparador
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
