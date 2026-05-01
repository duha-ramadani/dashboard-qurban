"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile top header */}
      <MobileHeader />

      <main
        className={cn(
          "transition-all duration-200 min-h-screen",
          // Desktop: push right by sidebar width
          collapsed ? "md:ml-16" : "md:ml-56",
          // Mobile: space for top header (56px) and bottom nav (60px)
          "pt-14 md:pt-0 pb-16 md:pb-0"
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
