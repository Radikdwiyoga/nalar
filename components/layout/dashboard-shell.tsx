'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';

interface DashboardShellProps {
  displayName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function DashboardShell({
  displayName,
  userEmail,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // In notebook detail page (`/notebooks/[id]`), hide the desktop sidebar or let it be compact to maximize workspace
  const isNotebookDetail = pathname.startsWith('/notebooks/') && pathname.split('/').length > 2;

  const navLinks = [
    {
      name: 'Notebook Saya',
      href: '/notebooks',
      icon: BookOpen,
      active: pathname.startsWith('/notebooks'),
    },
    {
      name: 'Pengaturan & Kuota',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      {!isNotebookDetail && (
        <aside className="hidden md:flex w-64 border-r bg-card/70 backdrop-blur-xl flex-col justify-between shrink-0 h-screen sticky top-0 z-20">
          <div className="flex flex-col">
            <div className="h-16 px-6 border-b flex items-center gap-3">
              <div className="p-1 rounded-xl bg-primary/10 border border-primary/20">
                <Image
                  src="/logo-icon.png"
                  alt="Nalar Logo"
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight leading-none">Nalar</span>
                <span className="text-[10px] text-muted-foreground font-medium">Personal NotebookLM</span>
              </div>
            </div>

            <nav className="p-4 space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      link.active
                        ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t space-y-3 bg-muted/20">
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-card/60 border">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold truncate leading-none mb-1">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
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
      )}

      {/* Mobile Drawer (Slide-over) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in-0">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col justify-between glass-card p-5 shadow-2xl border-r h-full animate-in slide-in-from-left duration-200">
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-xl bg-primary/10 border border-primary/20">
                    <Image
                      src="/logo-icon.png"
                      alt="Nalar Logo"
                      width={28}
                      height={28}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight">Nalar</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="py-4 space-y-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        link.active
                          ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-card/60 border">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold truncate leading-none mb-1">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
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
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar (Only shown on non-detail pages on mobile) */}
        {!isNotebookDetail && (
          <header className="h-14 border-b glass px-4 flex items-center justify-between md:hidden shrink-0 z-30">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Image
                src="/logo-icon.png"
                alt="Nalar Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span className="font-extrabold text-base tracking-tight">Nalar</span>
            </div>
          </header>
        )}

        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

