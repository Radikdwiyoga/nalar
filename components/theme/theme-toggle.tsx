'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type ThemeChoice = 'system' | 'light' | 'dark';

export function applyColorScheme(choice: ThemeChoice) {
  const isSystemDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const meta = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement | null;
  const metaValue = choice === 'system' ? 'light dark' : choice;
  if (meta) {
    meta.content = metaValue;
  }

  try {
    if (choice === 'system') {
      localStorage.removeItem('color-scheme');
    } else {
      localStorage.setItem('color-scheme', choice);
    }
  } catch {
    // ignore storage errors
  }

  const resolvedDark = choice === 'dark' || (choice === 'system' && isSystemDark);
  document.documentElement.classList.toggle('dark', resolvedDark);
  document.documentElement.classList.toggle('light', choice === 'light');
  window.dispatchEvent(new CustomEvent('nalar-theme-change'));
}

export function useThemeState() {
  const [choice, setChoice] = useState<ThemeChoice>('system');
  const [resolvedDark, setResolvedDark] = useState(false);

  const syncState = useCallback(() => {
    if (typeof window === 'undefined') return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('color-scheme');
    } catch {
      stored = null;
    }
    const nextChoice: ThemeChoice =
      stored === 'light' || stored === 'dark' ? stored : 'system';
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = nextChoice === 'dark' || (nextChoice === 'system' && sysDark);

    setChoice(nextChoice);
    setResolvedDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', nextChoice === 'light');
  }, []);

  useEffect(() => {
    syncState();
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => syncState();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme' || e.key === null) syncState();
    };
    const onCustom = () => syncState();

    mql.addEventListener('change', onMediaChange);
    window.addEventListener('storage', onStorage);
    window.addEventListener('nalar-theme-change', onCustom);
    return () => {
      mql.removeEventListener('change', onMediaChange);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('nalar-theme-change', onCustom);
    };
  }, [syncState]);

  const toggleOpposite = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const targetIsDark = !resolvedDark;
    const targetScheme = targetIsDark ? 'dark' : 'light';
    const systemScheme = sysDark ? 'dark' : 'light';

    // If target matches current OS preference, revert to system rather than pinning
    if (targetScheme === systemScheme) {
      applyColorScheme('system');
    } else {
      applyColorScheme(targetScheme);
    }
  }, [resolvedDark]);

  return { choice, resolvedDark, setTheme: applyColorScheme, toggleOpposite };
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedDark, toggleOpposite } = useThemeState();

  return (
    <button
      type="button"
      onClick={toggleOpposite}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-nalar-border bg-nalar-card hover:bg-nalar-surface text-nalar-muted hover:text-nalar-text transition-colors cursor-pointer shadow-2xs ${
        compact ? 'p-2' : 'px-2.5 py-1.5 text-xs font-medium'
      }`}
      title={resolvedDark ? 'Beralih ke Warm Paper (Terang)' : 'Beralih ke Espresso Mode (Gelap)'}
      aria-label={resolvedDark ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
    >
      {resolvedDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          {!compact && <span className="hidden sm:inline">Terang</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-nalar-accent shrink-0" />
          {!compact && <span className="hidden sm:inline">Gelap</span>}
        </>
      )}
    </button>
  );
}

export function ThemeSelectorCards() {
  const { choice, resolvedDark, setTheme } = useThemeState();

  const options: Array<{
    key: ThemeChoice;
    title: string;
    desc: string;
    icon: typeof Monitor;
  }> = [
    {
      key: 'system',
      title: `Otomatis Sistem (${resolvedDark && choice === 'system' ? 'Saat ini Gelap' : choice === 'system' ? 'Saat ini Terang' : 'Ikuti OS'})`,
      desc: 'Menyesuaikan jadwal terang/gelap perangkat Anda secara otomatis.',
      icon: Monitor,
    },
    {
      key: 'light',
      title: 'Warm Paper (Terang)',
      desc: 'Kanvas kertas alabaster hangat dengan aksen terakota editorial.',
      icon: Sun,
    },
    {
      key: 'dark',
      title: 'Espresso Obsidian (Gelap)',
      desc: 'Mode malam kontras lembut yang nyaman untuk riset berjam-jam.',
      icon: Moon,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = choice === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              active
                ? 'border-nalar-accent bg-nalar-citationBg/60 shadow-2xs'
                : 'border-nalar-border bg-nalar-bg/60 hover:border-nalar-accent/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-nalar-accent shrink-0" />
                <span className="font-serif font-bold text-xs sm:text-sm text-nalar-text">
                  {opt.title}
                </span>
              </div>
              {active && <span className="w-2 h-2 rounded-full bg-nalar-accent shrink-0" />}
            </div>
            <p className="text-[11px] text-nalar-muted leading-relaxed">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
