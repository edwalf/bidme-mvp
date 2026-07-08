import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar, buyerNav } from "@/components/Sidebar";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.orgType !== "BUYER") redirect("/login");

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  return (
    <div className="flex bg-[#FAFAF7] min-h-screen">
      <Sidebar orgName={org.name} orgTypeLabel="Comprador" nav={buyerNav} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
