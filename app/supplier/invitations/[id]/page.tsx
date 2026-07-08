import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { InvitationActions } from "@/components/InvitationActions";
import { Calendar, MapPin } from "lucide-react";

export default async function InvitationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: { rfq: true, proposal: true },
  });

  if (!invitation || invitation.supplierOrgId !== session.orgId) notFound();

  return (
    <div>
      <div className="px-8 py-5 border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <h1 className="text-[19px] font-semibold text-gray-900 tracking-tight">{invitation.rfq.title}</h1>
      </div>
      <div className="px-8 py-6 max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
          <div className="flex items-center gap-4 text-[12.5px] text-gray-500 mb-3">
            <span className="flex items-center gap-1"><MapPin size={12} /> {invitation.rfq.city}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> Fecha límite: {new Date(invitation.rfq.deadline).toLocaleDateString("es-GT")}</span>
            <span>{invitation.rfq.category}</span>
          </div>
          <p className="text-[13.5px] text-gray-700 whitespace-pre-line">{invitation.rfq.description}</p>
          {invitation.rfq.requirements && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-[12px] font-medium text-gray-500 mb-1">Requisitos</div>
              <p className="text-[13px] text-gray-600">{invitation.rfq.requirements}</p>
            </div>
          )}
          {invitation.rfq.budget && (
            <div className="mt-2 text-[12.5px] text-gray-500">
              Presupuesto de referencia: ${invitation.rfq.budget.toLocaleString()}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <InvitationActions
            invitationId={invitation.id}
            status={invitation.status as "PENDING" | "ACCEPTED" | "REJECTED"}
            hasProposal={!!invitation.proposal}
          />
        </div>
      </div>
    </div>
  );
}
