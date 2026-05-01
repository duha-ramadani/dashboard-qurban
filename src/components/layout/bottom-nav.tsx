'use client';

import { BarChart3, Beef, LayoutDashboard, PackageOpen, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard',             label: 'Home',       icon: LayoutDashboard },
  { href: '/dashboard/peserta',     label: 'Shohibul',   icon: Users },
  { href: '/dashboard/hewan',       label: 'Hewan',      icon: Beef },
  { href: '/dashboard/distribusi',  label: 'Distribusi', icon: PackageOpen },
  { href: '/dashboard/laporan',     label: 'Laporan',    icon: BarChart3 },
  { href: '/dashboard/settings',    label: 'Setelan',    icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              active ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
