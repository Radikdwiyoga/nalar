'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Sparkles,
  Radio,
  User,
} from 'lucide-react';

interface DialogLine {
  id: number;
  speaker: 'maya' | 'budi' | 'narrator';
  name: string;
  text: string;
}

interface AudioPodcastPlayerProps {
  contentMd: string;
  title?: string;
}

export function AudioPodcastPlayer({ contentMd, title }: AudioPodcastPlayerProps) {
  const [lines, setLines] = useState<DialogLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
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

      // Match "**Maya:**", "Maya:", "**Host (Maya):**", etc.
      const mayaMatch = line.match(/^\*?\*?(?:Host\s*)?\(?Maya\)?\*?\*?:\s*(.*)/i);
      // Match "**Budi:**", "Budi:", "**Analis (Budi):**", etc.
      const budiMatch = line.match(/^\*?\*?(?:Analis\s*)?\(?Budi\)?\*?\*?:\s*(.*)/i);

      if (mayaMatch) {
        parsed.push({
          id: idCounter++,
          speaker: 'maya',
          name: 'Maya (Host)',
          text: mayaMatch[1].replace(/\*\*/g, '').trim(),
        });
      } else if (budiMatch) {
        parsed.push({
          id: idCounter++,
          speaker: 'budi',
          name: 'Budi (Analis)',
          text: budiMatch[1].replace(/\*\*/g, '').trim(),
        });
      } else if (!line.startsWith('#') && line.length > 20) {
        // General narration paragraph
        parsed.push({
          id: idCounter++,
          speaker: 'narrator',
          name: 'Narator',
          text: line.replace(/\*\*/g, '').trim(),
        });
      }
    }

    setLines(parsed);
  }, [contentMd]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex]);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const speakLine = (index: number) => {
    if (!synthRef.current || index >= lines.length || index < 0) {
      setIsPlaying(false);
      return;
    }

    synthRef.current.cancel();
    setCurrentLineIndex(index);

    const current = lines[index];
    const utterance = new SpeechSynthesisUtterance(current.text);
    utteranceRef.current = utterance;

    // Detect Indonesian voices if present
    const idVoices = voices.filter((v) => v.lang.startsWith('id') || v.lang.startsWith('ID'));
    const defaultVoice = idVoices.length > 0 ? idVoices[0] : null;

    if (defaultVoice) {
      utterance.voice = defaultVoice;
    }

    // Give distinct voice tones to Host (Maya) vs Analis (Budi)
    if (current.speaker === 'maya') {
      utterance.pitch = 1.2; // slightly higher pitch for female host
      utterance.rate = speed * 1.05;
    } else if (current.speaker === 'budi') {
      utterance.pitch = 0.85; // deeper tone for male analyst
      utterance.rate = speed * 0.98;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = speed;
    }

    utterance.volume = isMuted ? 0 : 1;

    utterance.onend = () => {
      if (isPlayingRef.current) {
        if (index + 1 < lines.length) {
          speakLine(index + 1);
        } else {
          setIsPlaying(false);
          setCurrentLineIndex(0);
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('TTS error:', e);
      }
      setIsPlaying(false);
    };

    synthRef.current.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!synthRef.current) {
      alert('Browser Anda tidak mendukung Web Speech API');
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakLine(currentLineIndex);
    }
  };

  const handleReset = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setCurrentLineIndex(0);
  };

  const handleNext = () => {
    if (currentLineIndex + 1 < lines.length) {
      const nextIdx = currentLineIndex + 1;
      setCurrentLineIndex(nextIdx);
      if (isPlaying) {
        speakLine(nextIdx);
      }
    }
  };

  const handlePrev = () => {
    if (currentLineIndex > 0) {
      const prevIdx = currentLineIndex - 1;
      setCurrentLineIndex(prevIdx);
      if (isPlaying) {
        speakLine(prevIdx);
      }
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.25, 1.5];
    const nextSpeed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(nextSpeed);
    if (isPlaying) {
      speakLine(currentLineIndex);
    }
  };

  if (lines.length === 0) {
    return null;
  }

  const progressPercent = Math.round(((currentLineIndex + 1) / lines.length) * 100);

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-linear-to-b from-orange-500/10 via-background to-background p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header Player */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <span>{title || 'AI Podcast Diskusi Interaktif'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-300 font-semibold">
                Dual Speaker
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Maya (Host) & Budi (Analis) · Audio Speech AI
            </p>
          </div>
        </div>

        {/* Live animated sound bars when playing */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 h-4">
            <span className="w-1 bg-orange-500 rounded-full animate-bounce h-3" />
            <span className="w-1 bg-orange-500 rounded-full animate-bounce [animation-delay:0.15s] h-4" />
            <span className="w-1 bg-orange-500 rounded-full animate-bounce [animation-delay:0.3s] h-2" />
            <span className="w-1 bg-orange-500 rounded-full animate-bounce [animation-delay:0.45s] h-4" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>Bagian {currentLineIndex + 1} dari {lines.length}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            title="Ulangi dari Awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentLineIndex === 0}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-40"
            title="Baris Sebelumnya"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Jeda' : 'Putar Audio'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={handleNext}
            disabled={currentLineIndex >= lines.length - 1}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-40"
            title="Baris Berikutnya"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-lg border text-xs font-mono font-bold bg-muted/60 hover:bg-muted text-foreground transition cursor-pointer"
            title="Kecepatan Suara"
          >
            {speed}x
          </button>

          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            title={isMuted ? 'Batal Senyap' : 'Senyapkan'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-destructive" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Transcript Viewer with Live Karaoke Highlight */}
      <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 border-t pt-3 text-xs">
        {lines.map((item, idx) => {
          const isActive = idx === currentLineIndex;
          const isMaya = item.speaker === 'maya';
          const isBudi = item.speaker === 'budi';

          return (
            <div
              key={item.id}
              ref={isActive ? activeLineRef : null}
              onClick={() => {
                setCurrentLineIndex(idx);
                if (isPlaying) {
                  speakLine(idx);
                }
              }}
              className={`p-2.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                isActive
                  ? 'border-orange-500 bg-orange-500/15 ring-2 ring-orange-500/20 shadow-xs'
                  : 'bg-card/50 border-border/60 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                    isMaya
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : isBudi
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <User className="w-2.5 h-2.5" />
                  {item.name}
                </span>
                {isActive && isPlaying && (
                  <span className="text-[10px] font-medium text-orange-600 animate-pulse">
                    ● Sedang diputar...
                  </span>
                )}
              </div>
              <p className="text-foreground/90 font-sans">{item.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
