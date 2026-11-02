'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Sparkles, UploadCloud, Cpu, CheckCircle } from 'lucide-react';
import { Profile } from '@/lib/types';

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
}

export default function SettingsPage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferredProvider, setPreferredProvider] = useState<string>('auto');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.profile?.preferred_provider) {
          setPreferredProvider(d.profile.preferred_provider);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSavePreference = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // In MVP, we can save user preferred provider
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { usage, limits } = data;

  const chatPercent = Math.min(100, Math.round((usage.chats / limits.daily_chat_limit) * 100));
  const artifactPercent = Math.min(100, Math.round((usage.artifacts / limits.daily_artifact_limit) * 100));
  const uploadPercent = Math.min(100, Math.round((usage.uploads / limits.daily_upload_limit) * 100));
  const tokenPercent = Math.min(100, Math.round((usage.tokens / limits.daily_token_limit) * 100));

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan & Kuota</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau penggunaan harian dan kelola preferensi model AI Anda
        </p>
      </div>

      {/* Usage meters */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Penggunaan Hari Ini (Reset Tiap 00:00 UTC)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium inline-flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Pesan Chat
              </span>
              <span className="text-muted-foreground">
                {usage.chats} / {limits.daily_chat_limit}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${chatPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Pembuatan Artifact
              </span>
              <span className="text-muted-foreground">
                {usage.artifacts} / {limits.daily_artifact_limit}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${artifactPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium inline-flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-primary" />
                Unggah Dokumen
              </span>
              <span className="text-muted-foreground">
                {usage.uploads} / {limits.daily_upload_limit}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium inline-flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                Estimasi Token
              </span>
              <span className="text-muted-foreground">
                {usage.tokens.toLocaleString()} / {limits.daily_token_limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Fallback & Router info */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Rantai AI Fallback</h2>
        <p className="text-sm text-muted-foreground">
          Nalar secara cerdas merutekan permintaan ke model terbaik dan beralih otomatis jika terjadi kegagalan/rate-limit.
        </p>

        <div className="border rounded-lg divide-y text-sm">
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <p className="font-semibold">Provider Primer (Tingkat 1)</p>
              <p className="text-xs text-muted-foreground">Google Gemini 2.5 Flash</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-500/10 text-green-700">
              Aktif
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div>
              <p className="font-semibold">Provider Sekunder (Tingkat 2 - Fallback)</p>
              <p className="text-xs text-muted-foreground">Groq — Llama 3.3 70B Versatile</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700">
              Siaga
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div>
              <p className="font-semibold">Provider Tersier (Tingkat 3 - Fallback Cepat)</p>
              <p className="text-xs text-muted-foreground">Groq — Llama 3.1 8B Instant</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              Cadangan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

