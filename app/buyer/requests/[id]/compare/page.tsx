import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Lock, Check, Download, Trophy } from "lucide-react";
import { AwardButton } from "@/components/AwardButton";

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const rfq = await prisma.rfq.findUnique({ where: { id } });
  if (!rfq || rfq.buyerOrgId !== session.orgId) notFound();

  const invitations = await prisma.invitation.findMany({
    where: { rfqId: id },
    include: {
      supplierOrg: { select: { id: true, name: true, verified: true } },
      proposal: true,
    },
  });

  const withProposal = invitations.filter((i) => i.proposal);
  const isClosed = rfq.status === "CLOSED";
  const winner = invitations.find((i) => i.result === "WON");

  return (
    <div>
      <div className="px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">Comparador de Cotizaciones</h1>
      </div>

      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[13px] text-gray-400">{rfq.title}</div>
            <div className="text-[12px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Lock size={11} /> Cada proveedor ve únicamente su propia propuesta
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-[12.5px] border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50">
            <Download size={13} /> Exportar PDF
          </button>
        </div>

        {isClosed && winner && (
          <div className="rounded-lg bg-[#C9A227]/10 border border-[#C9A227]/30 px-4 py-3 mb-4 flex items-center gap-2">
            <Trophy size={15} className="text-[#C9A227]" />
            <span className="text-[13px] text-[#0F1B2E]">
              Adjudicado a <strong>{winner.supplierOrg.name}</strong>. Los demás proveedores fueron notificados de que el proceso finalizó, sin conocer el precio ganador.
            </span>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {withProposal.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-gray-400">
              Aún no hay propuestas para esta solicitud. Los proveedores invitados tienen hasta la fecha límite para responder.
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-gray-400 text-[11.5px] uppercase tracking-wide bg-gray-50/60">
                  <th className="px-5 py-2.5 font-medium">Proveedor</th>
                  <th className="px-5 py-2.5 font-medium">Precio</th>
                  <th className="px-5 py-2.5 font-medium">Tiempo de entrega</th>
                  <th className="px-5 py-2.5 font-medium">Garantía</th>
                  <th className="px-5 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {withProposal.map((inv) => {
                  const isWinner = inv.result === "WON";
                  const isLoser = inv.result === "LOST";
                  return (
                    <tr
                      key={inv.id}
                      className={`border-t border-gray-50 transition-colors duration-150 ${
                        isWinner ? "bg-[#C9A227]/5" : "hover:bg-gray-50/60"
                      } ${isLoser ? "opacity-50" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {isWinner && <Trophy size={13} className="text-[#C9A227]" />}
                          <span className="font-medium text-gray-900">{inv.supplierOrg.name}</span>
                          {inv.supplierOrg.verified && <Check size={12} className="text-emerald-500" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">${inv.proposal!.price.toLocaleString()}</td>
                      <td className="px-5 py-3 text-gray-600">{inv.proposal!.deliveryTime}</td>
                      <td className="px-5 py-3 text-gray-600">{inv.proposal!.warranty}</td>
                      <td className="px-5 py-3 text-right">
                        {!isClosed && (
                          <AwardButton rfqId={rfq.id} invitationId={inv.id} supplierName={inv.supplierOrg.name} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 text-[12px] text-gray-400">
          Invitaciones enviadas por el motor de matching: {invitations.length} · Respondidas: {invitations.filter((i) => i.status !== "PENDING").length}
        </div>
      </div>
    </div>
  );
}
