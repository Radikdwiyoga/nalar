'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

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
    <div className="flex h-screen w-full bg-nalar-bg text-nalar-text overflow-hidden">
      {/* Desktop Floating-Style Sidebar */}
      {!isNotebookDetail && (
        <aside className="hidden md:flex w-64 p-3 pr-0 flex-col shrink-0 h-screen sticky top-0 z-20">
          <div className="floating-island rounded-2xl flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col">
              <div className="h-16 px-5 border-b border-nalar-border flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="p-1 rounded-xl bg-nalar-citationBg border border-nalar-citationBorder group-hover:scale-105 transition-transform">
                    <Image
                      src="/logo-icon.png"
                      alt="Nalar Logo"
                      width={26}
                      height={26}
                      className="w-6 h-6 object-contain"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-base tracking-tight leading-none text-nalar-text">
                      Nalar
                    </span>
                    <span className="text-[10px] text-nalar-muted font-medium">AI Research</span>
                  </div>
                </Link>
                <ThemeToggle compact />
              </div>

              <nav className="p-3 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        link.active
                          ? 'bg-nalar-surface text-nalar-text font-semibold border border-nalar-border shadow-2xs'
                          : 'text-nalar-muted hover:bg-nalar-surface/60 hover:text-nalar-text'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-nalar-accent" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-3.5 border-t border-nalar-border space-y-2.5 bg-nalar-surface/40">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-nalar-card border border-nalar-border shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-nalar-citationBg text-nalar-accent flex items-center justify-center font-bold text-xs shrink-0 border border-nalar-citationBorder">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold truncate leading-none mb-1 text-nalar-text">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-nalar-muted truncate">{userEmail}</p>
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
        </aside>
      )}

      {/* Mobile Drawer (Slide-over) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in-0">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col justify-between bg-nalar-card p-5 shadow-2xl border-r border-nalar-border h-full animate-in slide-in-from-left duration-200">
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-nalar-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-xl bg-nalar-citationBg border border-nalar-citationBorder">
                    <Image
                      src="/logo-icon.png"
                      alt="Nalar Logo"
                      width={26}
                      height={26}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="font-serif font-bold text-lg tracking-tight text-nalar-text">
                    Nalar
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-nalar-muted hover:bg-nalar-surface"
                  aria-label="Tutup Menu"
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
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                        link.active
                          ? 'bg-nalar-surface text-nalar-text font-semibold border border-nalar-border shadow-2xs'
                          : 'text-nalar-muted hover:bg-nalar-surface/60 hover:text-nalar-text'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-nalar-accent" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-nalar-border pt-4 space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-nalar-surface border border-nalar-border">
                <div className="w-8 h-8 rounded-full bg-nalar-citationBg text-nalar-accent flex items-center justify-center font-bold text-xs shrink-0 border border-nalar-citationBorder">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold truncate leading-none mb-1 text-nalar-text">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-nalar-muted truncate">{userEmail}</p>
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
        {!isNotebookDetail && (
          <header className="h-14 border-b border-nalar-border bg-nalar-card/85 backdrop-blur-md px-4 flex items-center justify-between md:hidden shrink-0 z-30">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1.5 rounded-lg text-nalar-muted hover:bg-nalar-surface"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Image
                src="/logo-icon.png"
                alt="Nalar Logo"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              <span className="font-serif font-bold text-base tracking-tight text-nalar-text">
                Nalar
              </span>
            </div>
            <ThemeToggle compact />
          </header>
        )}

        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
