import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Plus, MapPin, Send, Users, MessageSquare, Trophy, Check } from "lucide-react";

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

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-medium text-gray-700">Tus solicitudes</div>
            <div className="text-[11.5px] text-gray-400">{rfqs.length} en total</div>
          </div>

          {rfqs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-5 py-14 text-center">
              <div className="text-[14px] text-gray-500 font-medium">Aún no tienes solicitudes.</div>
              <div className="text-[12.5px] text-gray-400 mt-1 mb-4">Publica la primera y verás el motor de matching en acción en menos de 5 segundos.</div>
              <Link
                href="/buyer/requests/new"
                className="inline-flex items-center gap-1.5 bg-[#C9A227] text-[#0F1B2E] text-[12.5px] font-semibold px-3.5 py-1.5 rounded-lg hover:bg-[#B8911F]"
              >
                <Plus size={14} /> Nueva Solicitud
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {rfqs.map((r) => {
                const invited = r.invitations.length;
                const responded = r.invitations.filter((i) => i.status !== "PENDING").length;
                const proposals = r.invitations.filter((i) => i.proposal).length;
                const awarded = r.status === "CLOSED";

                // Los 4 hitos del ciclo de vida de un RFQ. Cada uno se pinta
                // "completado" o "pendiente" según el estado real del RFQ —
                // el usuario ve exactamente en qué punto está su proceso.
                const steps = [
                  { icon: Send, label: "Publicada", done: r.status !== "DRAFT" },
                  { icon: Users, label: `${invited} invitados`, done: invited > 0 },
                  { icon: MessageSquare, label: `${proposals} cotizaron`, done: proposals > 0 },
                  { icon: Trophy, label: "Adjudicada", done: awarded },
                ];

                const cta =
                  r.status === "DRAFT"
                    ? { href: "/buyer/requests/new", label: "Continuar edición" }
                    : r.status === "MATCHING"
                    ? { href: `/buyer/requests/${r.id}/matching`, label: "Revisar matching →" }
                    : { href: `/buyer/requests/${r.id}/compare`, label: awarded ? "Ver resultado →" : "Ver cotizaciones →" };

                return (
                  <Link
                    key={r.id}
                    href={cta.href}
                    className="group block rounded-xl border border-gray-200 bg-white p-5 hover:border-[#C9A227]/40 hover:shadow-[0_2px_20px_rgba(15,27,46,0.06)] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight truncate">{r.title}</h3>
                          <span className={`text-[10.5px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status]}`}>
                            {STATUS_LABELS[r.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-gray-500">
                          <span>{r.category}</span>
                          <span className="text-gray-300">·</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {r.city}</span>
                          <span className="text-gray-300">·</span>
                          <span>{new Date(r.createdAt).toLocaleDateString("es-GT", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                      <div className="text-[12.5px] font-medium text-[#C9A227] group-hover:translate-x-0.5 transition-transform shrink-0">
                        {cta.label}
                      </div>
                    </div>

                    {/* Stepper visual del flujo de la solicitud. Cada punto
                        se llena en dorado cuando ese hito se cumplió. */}
                    <div className="mt-5 flex items-center gap-1">
                      {steps.map((s, i) => {
                        const Icon = s.done ? Check : s.icon;
                        return (
                          <div key={i} className="flex items-center flex-1 last:flex-none">
                            <div className="flex items-center gap-2 shrink-0">
                              <div
                                className={`h-7 w-7 rounded-full flex items-center justify-center border transition-colors ${
                                  s.done
                                    ? "bg-[#C9A227] border-[#C9A227] text-[#0F1B2E]"
                                    : "bg-white border-gray-200 text-gray-400"
                                }`}
                              >
                                <Icon size={13} strokeWidth={2.2} />
                              </div>
                              <span className={`text-[11.5px] ${s.done ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                                {s.label}
                              </span>
                            </div>
                            {i < steps.length - 1 && (
                              <div className={`h-px flex-1 mx-2 ${s.done ? "bg-[#C9A227]/40" : "bg-gray-200"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Cambio C: cuando está esperando propuestas, mostrar un
                        aviso que comunique "el sistema está trabajando por ti"
                        en vez de un frío "0 cotizaciones". */}
                    {r.status === "PUBLISHED" && proposals === 0 && (
                      <div className="mt-4 flex items-center gap-2 text-[11.5px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>
                          Esperando respuestas · fecha límite {new Date(r.deadline).toLocaleDateString("es-GT", { day: "numeric", month: "long" })} · te notificaremos en cuanto llegue la primera propuesta
                        </span>
                      </div>
                    )}
                    {r.status === "PUBLISHED" && proposals > 0 && (
                      <div className="mt-4 flex items-center gap-2 text-[11.5px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                        <MessageSquare size={12} />
                        <span>
                          {proposals} propuesta{proposals === 1 ? "" : "s"} lista{proposals === 1 ? "" : "s"} para comparar
                        </span>
                      </div>
                    )}
                    {r.status === "CLOSED" && (
                      <div className="mt-4 flex items-center gap-2 text-[11.5px] text-[#8a6d15] bg-[#C9A227]/10 rounded-lg px-3 py-2">
                        <Trophy size={12} />
                        <span>Solicitud adjudicada — los proveedores no ganadores fueron notificados sin conocer el precio ganador.</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
