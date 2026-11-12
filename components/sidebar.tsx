import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Settings, LogOut, Sparkles, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Pengguna';

  return (
    <aside className="w-64 border-r border-[#E5E0D5] bg-[#F3F0EA] flex flex-col justify-between shrink-0 h-screen sticky top-0 text-nalar-text">
      <div className="flex flex-col">
        {/* Logo / Brand */}
        <div className="h-16 px-6 border-b border-[#E5E0D5] flex items-center gap-3">
          <div className="p-1 rounded-xl bg-[#F3EAE2] border border-[#DFC9B8]">
            <Image
              src="/logo-icon.png"
              alt="Nalar Logo"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
              priority
            />
          </div>
          <span className="font-serif font-bold text-lg tracking-tight text-nalar-text">Nalar</span>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5">
          <Link
            href="/notebooks"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#E5E0D5] text-nalar-text shadow-2xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-nalar-accent" />
            <span>Notebook Saya</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-white/60 text-nalar-muted hover:text-nalar-text transition-colors"
          >
            <Settings className="w-4 h-4 text-nalar-accent" />
            <span>Pengaturan & Kuota</span>
          </Link>
        </nav>
      </div>

      {/* User info & Signout */}
      <div className="p-4 border-t border-[#E5E0D5] space-y-3 bg-[#FAF8F5]/60">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-[#E5E0D5] shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-[#F3EAE2] text-[#C25127] flex items-center justify-center font-bold text-xs shrink-0 border border-[#DFC9B8]">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-bold truncate leading-none mb-1 text-nalar-text">{displayName}</p>
            <p className="text-[11px] text-nalar-muted truncate">{user?.email}</p>
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

