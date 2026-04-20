"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Beef,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/peserta", label: "Peserta", icon: Users },
  { href: "/dashboard/hewan", label: "Hewan", icon: Beef },
  { href: "/dashboard/distribusi", label: "Distribusi", icon: PackageOpen },
  { href: "/dashboard/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-40",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-slate-100", collapsed && "justify-center px-2")}>
        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">Q</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">Dashboard</p>
            <p className="text-xs text-slate-400 truncate">Qurban 1446H</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5",
                collapsed && "justify-center px-2",
                active
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-2 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Keluar" : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <ChevronLeft size={18} className={cn("flex-shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Tutup sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
