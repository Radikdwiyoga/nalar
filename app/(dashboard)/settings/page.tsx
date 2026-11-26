'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Sparkles, UploadCloud, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Profile } from '@/lib/types';

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
      <div className="border-b border-[#E5E0D5] pb-5">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-nalar-text">
          Pengaturan & Kuota Harian
        </h1>
        <p className="text-xs sm:text-sm text-nalar-muted mt-1">
          Pantau pemakaian kuota riset harian Anda dan sesuaikan prioritas provider AI
        </p>
      </div>

      {/* Usage meters */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-nalar-text">
            Pemakaian Hari Ini (Reset Otomatis 00:00 UTC)
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Proteksi Kuota Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold inline-flex items-center gap-2 text-nalar-text">
                <MessageSquare className="w-4 h-4 text-nalar-accent" />
                Pesan Tanya Jawab (Chat)
              </span>
              <span className="font-mono text-xs text-nalar-muted">
                {usage.chats} / {limits.daily_chat_limit}
              </span>
            </div>
            <div className="w-full bg-[#F3F0EA] rounded-full h-2 overflow-hidden">
              <div
                className="bg-nalar-accent h-full transition-all rounded-full"
                style={{ width: `${chatPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold inline-flex items-center gap-2 text-nalar-text">
                <Sparkles className="w-4 h-4 text-nalar-accent" />
                Dokumen Studio Sintesis
              </span>
              <span className="font-mono text-xs text-nalar-muted">
                {usage.artifacts} / {limits.daily_artifact_limit}
              </span>
            </div>
            <div className="w-full bg-[#F3F0EA] rounded-full h-2 overflow-hidden">
              <div
                className="bg-nalar-accent h-full transition-all rounded-full"
                style={{ width: `${artifactPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold inline-flex items-center gap-2 text-nalar-text">
                <UploadCloud className="w-4 h-4 text-nalar-accent" />
                Unggah Dokumen Sumber
              </span>
              <span className="font-mono text-xs text-nalar-muted">
                {usage.uploads} / {limits.daily_upload_limit}
              </span>
            </div>
            <div className="w-full bg-[#F3F0EA] rounded-full h-2 overflow-hidden">
              <div
                className="bg-nalar-accent h-full transition-all rounded-full"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold inline-flex items-center gap-2 text-nalar-text">
                <Cpu className="w-4 h-4 text-nalar-accent" />
                Total Pemakaian Token AI
              </span>
              <span className="font-mono text-xs text-nalar-muted">
                {usage.tokens.toLocaleString('id-ID')} / {limits.daily_token_limit.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-full bg-[#F3F0EA] rounded-full h-2 overflow-hidden">
              <div
                className="bg-nalar-accent h-full transition-all rounded-full"
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferred Provider Selector & Live Fallback Chain */}
      <div className="bg-white border border-[#E5E0D5] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-lg text-nalar-text">
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
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
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

        {/* Selector Cards */}
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
                    ? 'border-[#C25127] bg-[#F3EAE2]/60 shadow-2xs'
                    : 'border-[#E5E0D5] bg-[#FAF8F5]/60 hover:border-[#C25127]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif font-bold text-xs sm:text-sm text-nalar-text">
                    {opt.title}
                  </span>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-[#C25127]" />
                  )}
                </div>
                <p className="text-[11px] text-nalar-muted leading-relaxed">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Live Active Route Order */}
        <div className="border border-[#E5E0D5] rounded-xl divide-y divide-[#E5E0D5] text-xs overflow-hidden">
          {routes.map((rt, idx) => (
            <div key={`${rt.provider}-${rt.model}-${idx}`} className="p-3.5 flex items-center justify-between bg-[#FAF8F5]/40">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#F3EAE2] text-[#A6421D] font-mono font-bold text-[11px] flex items-center justify-center border border-[#DFC9B8]">
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
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#F3F0EA] text-nalar-muted border border-[#E5E0D5]'
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
