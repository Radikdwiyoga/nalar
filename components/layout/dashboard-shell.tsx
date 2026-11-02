'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        <aside className="hidden md:flex w-64 border-r bg-card flex-col justify-between shrink-0 h-screen sticky top-0 z-20">
          <div className="flex flex-col">
            <div className="h-14 px-6 border-b flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
                N
              </div>
              <span className="font-bold text-lg tracking-tight">Nalar</span>
            </div>

            <nav className="p-4 space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      link.active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <p className="text-sm font-semibold truncate leading-none mb-1">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
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
      )}

      {/* Mobile Drawer (Slide-over) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col justify-between bg-card p-4 shadow-2xl border-r">
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
                    N
                  </div>
                  <span className="font-bold text-lg tracking-tight">Nalar</span>
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        link.active
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex-1">
                  <p className="text-sm font-semibold truncate leading-none mb-1">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
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
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar (Only shown on non-detail pages on mobile) */}
        {!isNotebookDetail && (
          <header className="h-14 border-b bg-card px-4 flex items-center justify-between md:hidden shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                N
              </div>
              <span className="font-bold text-base tracking-tight">Nalar</span>
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

