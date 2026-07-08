"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, FileText, MessageSquare, Users, LogOut } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export function Sidebar({ orgName, orgTypeLabel, nav }: { orgName: string; orgTypeLabel: string; nav: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 bg-[#0F1B2E] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2">
        <Image src="/icon-mark-square.png" alt="BidMe" width={26} height={26} priority />
        <span className="font-semibold text-[15px] tracking-tight text-[#F5F1E8]">BidMe</span>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((n) => {
          const Icon = n.icon;
          const isActive = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors duration-150 ${
                isActive
                  ? "bg-[#C9A227]/15 text-[#C9A227] font-medium"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-[11px] font-medium text-[#C9A227]">
              {orgName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-[12px] leading-tight">
              <div className="font-medium text-[#F5F1E8]">{orgName}</div>
              <div className="text-gray-500">{orgTypeLabel}</div>
            </div>
          </div>
          <button onClick={logout} title="Cerrar sesión" className="text-gray-500 hover:text-gray-300">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export const buyerNav = [
  { href: "/buyer/dashboard", label: "Dashboard", icon: LayoutGrid },
];

export const supplierNav = [
  { href: "/supplier/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/supplier/invitations", label: "Invitaciones", icon: MessageSquare },
];
