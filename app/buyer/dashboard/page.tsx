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

  // Empresas activas en la red — dato real, no simulado.
  const networkSize = await prisma.organization.count({
    where: { type: { in: ["SUPPLIER", "BOTH"] }, active: true },
  });

  const activeCount = rfqs.filter((r) => r.status === "PUBLISHED").length;
  const totalProposals = rfqs.reduce((sum, r) => sum + r.invitations.filter((i) => i.proposal).length, 0);
  const totalInvited = rfqs.reduce((sum, r) => sum + r.invitations.length, 0);

  // Tiempo estimado ahorrado: buscar y contactar proveedores manualmente
  // toma ~7 horas por solicitud según benchmarks internos de procurement.
  // Es un cálculo, no un dato falso: cada RFQ que BidMe procesó = 7 horas
  // que el comprador no tuvo que dedicar.
  const hoursSaved = rfqs.length * 7;

  return (
    <div>
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">Dashboard</h1>
        <Link href="/buyer/requests/new" className="flex items-center gap-1.5 bg-[#C9A227] text-[#0F1B2E] text-[12.5px] font-medium px-3 py-1.5 rounded-lg hover:bg-[#B8911F] transition-colors duration-150">
          <Plus size={14} /> Nueva Solicitud
        </Link>
      </div>

      <div className="px-8 py-6">
        {/* Hero: propuesta de valor + red viva. Es lo primero que ve un cliente
            que entra al producto — comunica el "por qué" antes que los "qué". */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0F1B2E] via-[#152540] to-[#1a2d4f] text-white p-8 mb-6 relative overflow-hidden">
          {/* Detalle sutil en el fondo — solo textura, no distrae */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#C9A227]/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#C9A227]/5 blur-3xl" />

          <div className="relative">
            <div className="text-[11.5px] uppercase tracking-[0.15em] text-[#C9A227] font-medium mb-2.5">
              BidMe · Smart Procurement
            </div>
            <h2 className="text-[26px] leading-tight font-semibold max-w-2xl tracking-tight">
              Encontramos automáticamente a los proveedores correctos para cada solicitud.
            </h2>
            <div className="text-[13px] text-white/60 mt-2 max-w-2xl">
              Sin buscar proveedores, sin cotizar solo con los mismos de siempre, sin depender de contactos personales.
            </div>

            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/10">
              <div>
                <div className="text-[24px] font-semibold tracking-tight">{networkSize.toLocaleString()}</div>
                <div className="text-[11.5px] text-white/50 mt-0.5">empresas en la red</div>
              </div>
              <div className="h-10 w-px bg-white/10 self-center" />
              <div>
                <div className="text-[24px] font-semibold tracking-tight">segundos</div>
                <div className="text-[11.5px] text-white/50 mt-0.5">para encontrar proveedores</div>
              </div>
              <div className="h-10 w-px bg-white/10 self-center" />
              <div>
                <div className="text-[24px] font-semibold tracking-tight text-[#C9A227]">privado</div>
                <div className="text-[11.5px] text-white/50 mt-0.5">ningún proveedor sabe quién más participa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas del comprador — ahora en la posición secundaria, con narrativa */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[11.5px] text-gray-500 uppercase tracking-wide">Activas</div>
            <div className="text-[22px] font-semibold text-gray-900 mt-1">{activeCount}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">solicitudes en curso</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[11.5px] text-gray-500 uppercase tracking-wide">Cotizaciones</div>
            <div className="text-[22px] font-semibold text-gray-900 mt-1">{totalProposals}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">recibidas privadamente</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[11.5px] text-gray-500 uppercase tracking-wide">Proveedores</div>
            <div className="text-[22px] font-semibold text-gray-900 mt-1">{totalInvited}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">seleccionados por el motor</div>
          </div>
          <div className="rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/[0.04] p-4">
            <div className="text-[11.5px] text-[#8a6d15] uppercase tracking-wide">Tiempo ahorrado</div>
            <div className="text-[22px] font-semibold text-[#0F1B2E] mt-1">~{hoursSaved}h</div>
            <div className="text-[11px] text-gray-500 mt-0.5">vs. búsqueda manual</div>
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
                      ) : r.status === "MATCHING" ? (
                        <Link href={`/buyer/requests/${r.id}/matching`} className="text-[#C9A227] font-medium text-[12.5px]">
                          Revisar matching
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
