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
    <div className="flex h-screen w-full bg-nalar-bg text-nalar-text overflow-hidden">
      {/* Desktop Sidebar */}
      {!isNotebookDetail && (
        <aside className="hidden md:flex w-64 border-r border-[#E5E0D5] bg-[#F3F0EA] flex-col justify-between shrink-0 h-screen sticky top-0 z-20">
          <div className="flex flex-col">
            <div className="h-16 px-6 border-b border-[#E5E0D5] flex items-center gap-3">
              <div className="p-1 rounded-xl bg-[#F3EAE2] border border-[#DFC9B8]/70">
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
                <span className="font-serif font-bold text-lg tracking-tight leading-none text-nalar-text">Nalar</span>
                <span className="text-[10px] text-nalar-muted font-medium">AI Document Synthesis</span>
              </div>
            </div>

            <nav className="p-4 space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      link.active
                        ? 'bg-white text-nalar-text font-semibold border border-[#E5E0D5] shadow-2xs'
                        : 'text-nalar-muted hover:bg-white/60 hover:text-nalar-text'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-nalar-accent" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-[#E5E0D5] space-y-3 bg-[#FAF8F5]/60">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-[#E5E0D5] shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#F3EAE2] text-[#C25127] flex items-center justify-center font-bold text-xs shrink-0 border border-[#DFC9B8]">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold truncate leading-none mb-1 text-nalar-text">{displayName}</p>
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
        </aside>
      )}

      {/* Mobile Drawer (Slide-over) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in-0">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col justify-between bg-[#F3F0EA] p-5 shadow-2xl border-r border-[#E5E0D5] h-full animate-in slide-in-from-left duration-200">
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D5]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-xl bg-[#F3EAE2] border border-[#DFC9B8]">
                    <Image
                      src="/logo-icon.png"
                      alt="Nalar Logo"
                      width={28}
                      height={28}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <span className="font-serif font-bold text-lg tracking-tight text-nalar-text">Nalar</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-nalar-muted hover:bg-white"
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
                          ? 'bg-white text-nalar-text font-semibold border border-[#E5E0D5] shadow-2xs'
                          : 'text-nalar-muted hover:bg-white/60 hover:text-nalar-text'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-nalar-accent" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-[#E5E0D5] pt-4 space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-[#E5E0D5]">
                <div className="w-8 h-8 rounded-full bg-[#F3EAE2] text-[#C25127] flex items-center justify-center font-bold text-xs shrink-0 border border-[#DFC9B8]">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold truncate leading-none mb-1 text-nalar-text">{displayName}</p>
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
        {/* Mobile Header Bar (Only shown on non-detail pages on mobile) */}
        {!isNotebookDetail && (
          <header className="h-14 border-b border-[#E5E0D5] bg-[#FAF8F5]/90 backdrop-blur-md px-4 flex items-center justify-between md:hidden shrink-0 z-30">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1.5 rounded-lg text-nalar-muted hover:bg-[#F3F0EA]"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Image
                src="/logo-icon.png"
                alt="Nalar Logo"
                width={26}
                height={26}
                className="w-6.5 h-6.5 object-contain"
              />
              <span className="font-serif font-bold text-base tracking-tight text-nalar-text">Nalar</span>
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

