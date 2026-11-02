import Link from 'next/link';
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
    <aside className="w-64 border-r bg-card flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="flex flex-col">
        {/* Logo / Brand */}
        <div className="h-16 px-6 border-b flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
            N
          </div>
          <span className="font-bold text-lg tracking-tight">Nalar</span>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5">
          <Link
            href="/notebooks"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Notebook Saya</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan & Kuota</span>
          </Link>
        </nav>
      </div>

      {/* User info & Signout */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate flex-1">
            <p className="text-sm font-semibold truncate leading-none mb-1">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

