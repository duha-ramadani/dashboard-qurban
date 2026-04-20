"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main
        className={cn(
          "transition-all duration-200 min-h-screen",
          collapsed ? "ml-16" : "ml-56"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
