import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MatchingResults } from "@/components/MatchingResults";

export default async function MatchingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const rfq = await prisma.rfq.findUnique({ where: { id } });
  if (!rfq || rfq.buyerOrgId !== session.orgId) notFound();

  // Si ya se invitó, la fase de matching terminó — llevar al comparador.
  if (rfq.status === "PUBLISHED" || rfq.status === "CLOSED") {
    redirect(`/buyer/requests/${id}/compare`);
  }

  return <MatchingResults rfqId={id} />;
}
