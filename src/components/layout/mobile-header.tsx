'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/peserta': 'Shohibul Qurban',
  '/dashboard/hewan': 'Data Hewan',
  '/dashboard/distribusi': 'Distribusi',
  '/dashboard/laporan': 'Laporan',
  '/dashboard/settings': 'Pengaturan',
};

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-4 gap-3">
      <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0">
        <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-full h-full object-cover" />
      </div>
      <span className="font-semibold text-slate-800 text-sm flex-1 truncate">{title}</span>
      <button
        onClick={handleLogout}
        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        title="Keluar"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}
