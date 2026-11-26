'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Sparkles, UploadCloud, Cpu, CheckCircle2, ShieldCheck, Palette } from 'lucide-react';
import { Profile } from '@/lib/types';
import { ThemeSelectorCards } from '@/components/theme/theme-toggle';

interface RouteItem {
  provider: 'gemini' | 'groq' | 'local';
  model: string;
}

interface UsageData {
  usage: {
    chats: number;
    artifacts: number;
    uploads: number;
    tokens: number;
  };
  limits: {
    daily_chat_limit: number;
    daily_artifact_limit: number;
    daily_upload_limit: number;
    daily_token_limit: number;
  };
  profile: Profile | null;
  routes?: RouteItem[];
}

export default function SettingsPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferredProvider, setPreferredProvider] = useState<'auto' | 'gemini' | 'groq'>('auto');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.profile?.preferred_provider === 'gemini' || d.profile?.preferred_provider === 'groq') {
          setPreferredProvider(d.profile.preferred_provider);
        } else {
          setPreferredProvider('auto');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSavePreference = async (nextPref: 'auto' | 'gemini' | 'groq') => {
    setPreferredProvider(nextPref);
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const res = await fetch('/api/usage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_provider: nextPref === 'auto' ? null : nextPref,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan preferensi');
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: json.profile,
              routes: json.routes || prev.routes,
            }
          : prev
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Gagal menyimpan preferensi');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-nalar-muted">
        <Loader2 className="w-8 h-8 animate-spin text-nalar-accent" />
      </div>
    );
  }

  const { usage, limits, routes = [] } = data;

  const chatPercent = Math.min(100, Math.round((usage.chats / Math.max(1, limits.daily_chat_limit)) * 100));
  const artifactPercent = Math.min(100, Math.round((usage.artifacts / Math.max(1, limits.daily_artifact_limit)) * 100));
  const uploadPercent = Math.min(100, Math.round((usage.uploads / Math.max(1, limits.daily_upload_limit)) * 100));
  const tokenPercent = Math.min(100, Math.round((usage.tokens / Math.max(1, limits.daily_token_limit)) * 100));

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 bg-nalar-bg text-nalar-text">
      <div className="border-b border-nalar-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-nalar-text">
          Pengaturan, Tampilan & Kuota
        </h1>
        <p className="text-xs sm:text-sm text-nalar-muted mt-1">
          Kelola tema ruang kerja, pantau kuota riset harian, dan atur prioritas provider AI Anda
        </p>
      </div>

      {/* Theme Appearance Card (3-State Selector) */}
      <div className="floating-island rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-nalar-citationBg text-nalar-accent border border-nalar-citationBorder flex items-center justify-center shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-nalar-text">
              Tema & Suasana Ruang Riset
            </h2>
            <p className="text-xs text-nalar-muted">
              Pilih kanvas kertas terang atau mode malam Espresso Obsidian yang nyaman di mata
            </p>
          </div>
        </div>

        <ThemeSelectorCards />
      </div>

      {/* Usage meters */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-nalar-text">
            Pemakaian Hari Ini (Reset Otomatis 00:00 UTC)
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Proteksi Kuota Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: 'Pesan Tanya Jawab (Chat)',
              icon: MessageSquare,
              val: `${usage.chats} / ${limits.daily_chat_limit}`,
              pct: chatPercent,
            },
            {
              label: 'Dokumen Studio Sintesis',
              icon: Sparkles,
              val: `${usage.artifacts} / ${limits.daily_artifact_limit}`,
              pct: artifactPercent,
            },
            {
              label: 'Unggah Dokumen Sumber',
              icon: UploadCloud,
              val: `${usage.uploads} / ${limits.daily_upload_limit}`,
              pct: uploadPercent,
            },
            {
              label: 'Total Pemakaian Token AI',
              icon: Cpu,
              val: `${usage.tokens.toLocaleString('id-ID')} / ${limits.daily_token_limit.toLocaleString('id-ID')}`,
              pct: tokenPercent,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="floating-island rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold inline-flex items-center gap-2 text-nalar-text">
                    <Icon className="w-4 h-4 text-nalar-accent" />
                    {item.label}
                  </span>
                  <span className="font-mono text-xs text-nalar-muted">{item.val}</span>
                </div>
                <div className="w-full bg-nalar-surface rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-nalar-accent h-full transition-all rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preferred Provider Selector & Live Fallback Chain */}
      <div className="floating-island rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-nalar-text">
              Prioritas Provider & Rantai AI Fallback
            </h2>
            <p className="text-xs text-nalar-muted mt-0.5">
              Pilih provider utama Anda. Jika terkena batas kuota atau gangguan, Nalar otomatis beralih ke model berikutnya.
            </p>
          </div>
          {saving && (
            <span className="inline-flex items-center gap-1.5 text-xs text-nalar-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-nalar-accent" />
              Menyimpan...
            </span>
          )}
          {saved && !saving && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersimpan
            </span>
          )}
        </div>

        {saveError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              key: 'auto' as const,
              title: 'Otomatis (Rekomendasi)',
              desc: 'Urutan bawaan sistem dengan keseimbangan akurasi & kecepatan.',
            },
            {
              key: 'gemini' as const,
              title: 'Utamakan Google Gemini',
              desc: 'Konteks panjang & penalaran dokumen tebal sebagai prioritas pertama.',
            },
            {
              key: 'groq' as const,
              title: 'Utamakan Groq LPU',
              desc: 'Respons streaming super cepat sebagai prioritas pertama.',
            },
          ].map((opt) => {
            const active = preferredProvider === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={saving}
                onClick={() => handleSavePreference(opt.key)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'border-nalar-accent bg-nalar-citationBg/60 shadow-2xs'
                    : 'border-nalar-border bg-nalar-bg/60 hover:border-nalar-accent/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif font-bold text-xs sm:text-sm text-nalar-text">
                    {opt.title}
                  </span>
                  {active && <span className="w-2 h-2 rounded-full bg-nalar-accent" />}
                </div>
                <p className="text-[11px] text-nalar-muted leading-relaxed">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="border border-nalar-border rounded-xl divide-y divide-nalar-border text-xs overflow-hidden">
          {routes.map((rt, idx) => (
            <div key={`${rt.provider}-${rt.model}-${idx}`} className="p-3.5 flex items-center justify-between bg-nalar-bg/40">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-nalar-citationBg text-nalar-accent font-mono font-bold text-[11px] flex items-center justify-center border border-nalar-citationBorder">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-nalar-text capitalize">
                    {rt.provider === 'gemini' ? 'Google Gemini' : rt.provider === 'groq' ? 'Groq Cloud' : rt.provider}
                  </p>
                  <p className="font-mono text-[11px] text-nalar-muted">{rt.model}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                  idx === 0
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-nalar-surface text-nalar-muted border border-nalar-border'
                }`}
              >
                {idx === 0 ? 'Primer' : `Cadangan #${idx}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
