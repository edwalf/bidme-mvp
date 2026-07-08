import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar, supplierNav } from "@/components/Sidebar";

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.orgType !== "SUPPLIER" && session.orgType !== "BOTH")) redirect("/login");

  const org = await prisma.organization.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  return (
    <div className="flex bg-[#FAFAF7] min-h-screen">
      <Sidebar orgName={org.name} orgTypeLabel={org.verified ? "Proveedor verificado" : "Proveedor (pendiente de verificación)"} nav={supplierNav} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
