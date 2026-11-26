'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Radio,
  User,
  Download,
  Loader2,
  Mic2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface DialogLine {
  id: number;
  speaker: 'maya' | 'budi' | 'narrator';
  name: string;
  text: string;
}

interface VoiceOption {
  id: string;
  label: string;
  gender: 'Wanita' | 'Pria';
}

const HOST_VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Kore', label: 'Kore — Wanita (Hangat & Tegas)', gender: 'Wanita' },
  { id: 'Aoede', label: 'Aoede — Wanita (Ceria & Mengalir)', gender: 'Wanita' },
  { id: 'Zephyr', label: 'Zephyr — Wanita (Jernih & Lembut)', gender: 'Wanita' },
  { id: 'Leda', label: 'Leda — Wanita (Tenang & Eksekutif)', gender: 'Wanita' },
  { id: 'Puck', label: 'Puck — Pria (Energik & Akrab)', gender: 'Pria' },
];

const ANALYST_VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Orus', label: 'Orus — Pria (Dalam & Berwibawa)', gender: 'Pria' },
  { id: 'Charon', label: 'Charon — Pria (Analitis & Tenang)', gender: 'Pria' },
  { id: 'Fenrir', label: 'Fenrir — Pria (Tegas & Dinamis)', gender: 'Pria' },
  { id: 'Puck', label: 'Puck — Pria (Energik & Akrab)', gender: 'Pria' },
  { id: 'Kore', label: 'Kore — Wanita (Hangat & Tegas)', gender: 'Wanita' },
];

interface AudioPodcastPlayerProps {
  contentMd: string;
  title?: string;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AudioPodcastPlayer({ contentMd, title }: AudioPodcastPlayerProps) {
  const [lines, setLines] = useState<DialogLine[]>([]);
  const [hostVoice, setHostVoice] = useState<string>('Kore');
  const [analystVoice, setAnalystVoice] = useState<string>('Orus');

  // Neural Studio Audio (.wav) state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [synthesizedVoiceKey, setSynthesizedVoiceKey] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Parse markdown into dialog lines
  useEffect(() => {
    if (!contentMd) return;

    const rawLines = contentMd.split('\n');
    const parsed: DialogLine[] = [];
    let idCounter = 0;

    for (const raw of rawLines) {
      const line = raw.trim();
      if (!line) continue;

      const mayaMatch = line.match(/^\*?\*?(?:Host\s*)?\(?Maya\)?\*?\*?:\s*(.*)/i);
      const budiMatch = line.match(/^\*?\*?(?:Analis\s*)?\(?Budi\)?\*?\*?:\s*(.*)/i);

      if (mayaMatch && mayaMatch[1].trim()) {
        parsed.push({
          id: idCounter++,
          speaker: 'maya',
          name: 'Maya (Host)',
          text: mayaMatch[1].replace(/\*\*/g, '').trim(),
        });
      } else if (budiMatch && budiMatch[1].trim()) {
        parsed.push({
          id: idCounter++,
          speaker: 'budi',
          name: 'Budi (Analis)',
          text: budiMatch[1].replace(/\*\*/g, '').trim(),
        });
      } else if (!line.startsWith('#') && !line.startsWith('---') && line.length > 25) {
        parsed.push({
          id: idCounter++,
          speaker: 'narrator',
          name: 'Maya (Host)',
          text: line.replace(/\*\*/g, '').trim(),
        });
      }
    }

    setLines(parsed);
  }, [contentMd]);

  // Cleanup Blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Precalculate cumulative character ratios so transcript highlights in sync with audio timeline
  const lineRanges = useMemo(() => {
    const totalChars = Math.max(
      1,
      lines.reduce((acc, l) => acc + l.text.length, 0)
    );
    let acc = 0;
    return lines.map((l) => {
      const startRatio = acc / totalChars;
      acc += l.text.length;
      const endRatio = acc / totalChars;
      return { startRatio, endRatio };
    });
  }, [lines]);

  // Auto-scroll transcript container when active line changes while playing
  useEffect(() => {
    if (isPlaying && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentLineIndex, isPlaying]);

  const currentVoiceKey = `${hostVoice}:${analystVoice}`;
  const isVoiceChanged = Boolean(audioUrl && synthesizedVoiceKey && synthesizedVoiceKey !== currentVoiceKey);

  const generateStudioAudio = async (autoPlayAfter = true): Promise<string | null> => {
    if (lines.length === 0 || synthesizing) return null;

    setSynthesizing(true);
    setTtsError(null);

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      const res = await fetch('/api/artifacts/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            speaker: l.speaker === 'budi' ? 'budi' : 'maya',
            text: l.text,
          })),
          hostVoice,
          analystVoice,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || `Gagal membuat audio (${res.status})`);
      }

      const blob = await res.blob();
      const newUrl = URL.createObjectURL(blob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(newUrl);
      setSynthesizedVoiceKey(currentVoiceKey);
      setCurrentTime(0);
      setCurrentLineIndex(0);

      if (autoPlayAfter) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.playbackRate = speed;
            audioRef.current.muted = isMuted;
            audioRef.current.play().catch((e) => console.error('Auto-play error:', e));
          }
        }, 80);
      }

      return newUrl;
    } catch (err: any) {
      setTtsError(err?.message || 'Terjadi kendala saat menyintesis suara AI.');
      return null;
    } finally {
      setSynthesizing(false);
    }
  };

  const handlePlayPause = async () => {
    if (synthesizing) return;

    // If not yet synthesized or user changed voice selection, synthesize now
    if (!audioUrl || isVoiceChanged) {
      await generateStudioAudio(true);
      return;
    }

    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
    } else {
      el.playbackRate = speed;
      el.muted = isMuted;
      await el.play().catch((e) => console.error('Play error:', e));
    }
  };

  const handleDownloadAudio = async () => {
    let targetUrl = audioUrl;
    if (!targetUrl || isVoiceChanged) {
      targetUrl = await generateStudioAudio(false);
    }
    if (!targetUrl) return;

    const safeTitle = (title || 'podcast-nalar')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `${safeTitle || 'podcast-nalar'}-${hostVoice.toLowerCase()}-${analystVoice.toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentLineIndex(0);
  };

  const handleSkipSeconds = (delta: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = Math.max(0, Math.min(duration, el.currentTime + delta));
  };

  const cycleSpeed = () => {
    const speeds = [0.85, 1.0, 1.2, 1.4];
    const nextSpeed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
  };

  const jumpToLine = (idx: number) => {
    setCurrentLineIndex(idx);
    if (audioRef.current && duration > 0 && lineRanges[idx]) {
      audioRef.current.currentTime = lineRanges[idx].startRatio * duration;
    }
  };

  if (lines.length === 0) {
    return null;
  }

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.round((currentTime / duration) * 100))
      : Math.round(((currentLineIndex + 1) / lines.length) * 100);

  return (
    <div className="rounded-2xl border border-nalar-citationBorder bg-gradient-to-b from-nalar-citationBg/60 via-nalar-card to-nalar-card p-4 sm:p-5 shadow-xs space-y-4">
      {/* Hidden HTML5 Audio Engine */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            const d = e.currentTarget.duration || 0;
            setCurrentTime(t);
            if (d > 0) {
              const ratio = t / d;
              const matchedIdx = lineRanges.findIndex(
                (r) => ratio >= r.startRatio && ratio <= r.endRatio
              );
              if (matchedIdx !== -1 && matchedIdx !== currentLineIndex) {
                setCurrentLineIndex(matchedIdx);
              }
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentLineIndex(0);
          }}
        />
      )}

      {/* Header Bar + Download Audio Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-nalar-citationBg border border-nalar-citationBorder text-nalar-accent flex items-center justify-center shrink-0 shadow-2xs">
            <Radio className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-nalar-text flex items-center gap-2 flex-wrap">
              <span>{title || 'AI Podcast Diskusi Interaktif'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-nalar-accent text-white font-sans font-semibold">
                Studio Neural TTS
              </span>
            </h4>
            <p className="text-[11px] text-nalar-muted">
              2 Pembicara Berbeda (Wanita & Pria) • Mendukung Unduh Audio (.wav)
            </p>
          </div>
        </div>

        {/* Download WAV Button */}
        <button
          type="button"
          onClick={handleDownloadAudio}
          disabled={synthesizing}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-nalar-accent hover:bg-nalar-accentHover text-white text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
          title="Unduh rekaman audio podcast (.wav)"
        >
          {synthesizing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyintesis Suara...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Audio (.wav)</span>
            </>
          )}
        </button>
      </div>

      {/* Dual Voice Character Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-nalar-surface/70 border border-nalar-border text-xs">
        <div className="space-y-1">
          <label
            htmlFor="host-voice-select"
            className="text-[11px] font-semibold text-nalar-text flex items-center gap-1.5"
          >
            <Mic2 className="w-3 h-3 text-rose-500" />
            <span>Suara Maya (Host):</span>
          </label>
          <select
            id="host-voice-select"
            value={hostVoice}
            disabled={synthesizing}
            onChange={(e) => setHostVoice(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-nalar-border bg-nalar-card text-xs text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30"
          >
            {HOST_VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="analyst-voice-select"
            className="text-[11px] font-semibold text-nalar-text flex items-center gap-1.5"
          >
            <Mic2 className="w-3 h-3 text-blue-500" />
            <span>Suara Budi (Analis):</span>
          </label>
          <select
            id="analyst-voice-select"
            value={analystVoice}
            disabled={synthesizing}
            onChange={(e) => setAnalystVoice(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-nalar-border bg-nalar-card text-xs text-nalar-text focus:outline-none focus:ring-2 focus:ring-nalar-accent/30"
          >
            {ANALYST_VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert if TTS failed */}
      {ttsError && (
        <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{ttsError}</span>
        </div>
      )}

      {/* Voice Changed Notice */}
      {isVoiceChanged && !synthesizing && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-nalar-text">
          <span>Karakter suara diubah. Klik perbarui untuk menerapkan suara baru.</span>
          <button
            type="button"
            onClick={() => generateStudioAudio(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-nalar-accent text-white font-semibold text-[11px] cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Perbarui Suara</span>
          </button>
        </div>
      )}

      {/* Scrubber & Time Counter */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 100}
          step={0.1}
          value={duration > 0 ? currentTime : 0}
          disabled={!audioUrl || duration === 0}
          onChange={(e) => {
            const nextVal = parseFloat(e.target.value);
            setCurrentTime(nextVal);
            if (audioRef.current) {
              audioRef.current.currentTime = nextVal;
            }
          }}
          aria-label="Posisi waktu pemutaran podcast"
          className="w-full h-1.5 rounded-lg cursor-pointer accent-nalar-accent disabled:opacity-40"
        />
        <div className="flex justify-between text-[10px] font-mono text-nalar-muted">
          <span>
            {audioUrl && duration > 0
              ? `${formatTime(currentTime)} / ${formatTime(duration)}`
              : synthesizing
              ? 'Menyusun suara neural Maya & Budi...'
              : 'Klik tombol Putar untuk menghasilkan & mendengarkan audio'}
          </span>
          <span>
            Dialog {currentLineIndex + 1}/{lines.length} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={!audioUrl || synthesizing}
            className="p-2 rounded-lg text-nalar-muted hover:text-nalar-text hover:bg-nalar-surface transition cursor-pointer disabled:opacity-40"
            title="Ulangi dari Awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSkipSeconds(-10)}
            disabled={!audioUrl || synthesizing}
            className="p-2 rounded-lg text-nalar-muted hover:text-nalar-text hover:bg-nalar-surface transition cursor-pointer disabled:opacity-40"
            title="Mundur 10 Detik"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={synthesizing}
            className="px-4 h-10 rounded-full bg-nalar-accent hover:bg-nalar-accentHover text-white flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-60 text-xs font-semibold"
            title={isPlaying ? 'Jeda Podcast' : 'Putar Podcast'}
          >
            {synthesizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{audioUrl && !isVoiceChanged ? 'Putar' : 'Buat & Putar Audio'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSkipSeconds(10)}
            disabled={!audioUrl || synthesizing}
            className="p-2 rounded-lg text-nalar-muted hover:text-nalar-text hover:bg-nalar-surface transition cursor-pointer disabled:opacity-40"
            title="Maju 10 Detik"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2.5 py-1 rounded-lg border border-nalar-border text-xs font-mono font-bold bg-nalar-surface hover:bg-nalar-bg text-nalar-text transition cursor-pointer"
            title="Kecepatan Suara"
          >
            {speed}x
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-lg text-nalar-muted hover:text-nalar-text hover:bg-nalar-surface transition cursor-pointer"
            title={isMuted ? 'Batal Senyap' : 'Senyapkan'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-destructive" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Interactive Transcript Viewer */}
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border-t border-nalar-border pt-3 text-xs">
        {lines.map((item, idx) => {
          const isActive = idx === currentLineIndex;
          const isBudi = item.speaker === 'budi';

          return (
            <div
              key={item.id}
              ref={isActive ? activeLineRef : null}
              onClick={() => jumpToLine(idx)}
              className={`p-2.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                isActive
                  ? 'border-nalar-accent bg-nalar-citationBg/60 shadow-2xs'
                  : 'bg-nalar-bg/40 border-nalar-border hover:bg-nalar-surface/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                    isBudi
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  <User className="w-2.5 h-2.5" />
                  {item.name} • {isBudi ? analystVoice : hostVoice}
                </span>
                {isActive && isPlaying && (
                  <span className="text-[10px] font-semibold text-nalar-accent animate-pulse">
                    ● Sedang diputar
                  </span>
                )}
              </div>
              <p className="text-nalar-text font-sans">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
