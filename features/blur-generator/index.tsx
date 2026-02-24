'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react';
import {
  IconArrowUp, IconArrowDown, IconArrowRight, IconArrowLeft,
  IconRotateClockwise, IconSun, IconMoon, IconCopy, IconChevronUp,
  IconArrowBackUp, IconArrowForwardUp, IconUpload, IconX,
  IconCode, IconBrandTailwind, IconCheck,
} from '@tabler/icons-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { SliderRow } from './slider-row';
import { getEasing } from '@/lib/blur-utils';
import { saveImageToDB, loadImageFromDB, deleteImageFromDB } from '@/lib/db';

// ─── Types ─────────────────────────────────────────────────────────────────────

type BlurState = {
  direction: string;
  height: number;
  precision: number;
  blur: number;
  easingType: string;
  preset: string;
  reverse: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const SPRING = { type: 'spring', bounce: 0.4, duration: 0.6 } as const;

const DIRECTIONS = [
  { id: 'to top',    icon: IconArrowUp,    label: 'Up'    },
  { id: 'to bottom', icon: IconArrowDown,  label: 'Down'  },
  { id: 'to right',  icon: IconArrowRight, label: 'Right' },
  { id: 'to left',   icon: IconArrowLeft,  label: 'Left'  },
] as const;

const EASING_TYPES = [
  { id: 'in',     label: 'In',     path: 'M4 20 Q 12 20 20 4'     },
  { id: 'out',    label: 'Out',    path: 'M4 20 Q 4 4 20 4'        },
  { id: 'in-out', label: 'In Out', path: 'M4 20 C 12 20 12 4 20 4' },
] as const;

const PRESETS = ['linear', 'sine', 'quad', 'cubic', 'quart', 'quint', 'expo', 'circ'] as const;
type Preset = typeof PRESETS[number];

const PRESET_PATHS: Record<Preset, React.ReactNode> = {
  linear: <line x1="4" y1="20" x2="20" y2="4" />,
  sine:   <path d="M4 20 Q 12 20 20 4" />,
  quad:   <path d="M4 20 Q 16 20 20 4" />,
  cubic:  <path d="M4 20 C 16 20 20 12 20 4" />,
  quart:  <path d="M4 20 C 18 20 20 10 20 4" />,
  quint:  <path d="M4 20 C 19 20 20 8 20 4" />,
  expo:   <path d="M4 20 L 16 20 L 20 4" />,
  circ:   <path d="M4 20 A 16 16 0 0 0 20 4" />,
};

const DEFAULT_STATE: BlurState = {
  direction:  'to top',
  height:     50,
  precision:  6,
  blur:       15,
  easingType: 'in',
  preset:     'expo',
  reverse:    false,
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BlurGenerator() {
  const [mounted, setMounted]           = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Blur state
  const [direction,  setDirection]  = useState(DEFAULT_STATE.direction);
  const [height,     setHeight]     = useState(DEFAULT_STATE.height);
  const [precision,  setPrecision]  = useState(DEFAULT_STATE.precision);
  const [blur,       setBlur]       = useState(DEFAULT_STATE.blur);
  const [easingType, setEasingType] = useState(DEFAULT_STATE.easingType);
  const [preset,     setPreset]     = useState<Preset>(DEFAULT_STATE.preset as Preset);
  const [reverse,    setReverse]    = useState(DEFAULT_STATE.reverse);

  // UI state
  const [exportFormat,  setExportFormat]  = useState<'css' | 'tailwind'>('css');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customImage,    setCustomImage]    = useState<string | null>(null);
  const [isCopied,       setIsCopied]       = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reverseId = useId();

  // ─── History ───────────────────────────────────────────────────────────────

  const currentState = useMemo<BlurState>(() => ({
    direction, height, precision, blur, easingType, preset, reverse,
  }), [direction, height, precision, blur, easingType, preset, reverse]);

  const [history,      setHistory]      = useState<BlurState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoing = useRef(false);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([currentState]);
      setHistoryIndex(0);
      return;
    }
    if (isUndoing.current) {
      isUndoing.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setHistory(prev => {
        const next = prev.slice(0, historyIndex + 1);
        const last = next[next.length - 1];
        if (JSON.stringify(last) !== JSON.stringify(currentState)) {
          next.push(currentState);
          setHistoryIndex(next.length - 1);
        }
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [currentState, history.length, historyIndex]);

  const applyState = useCallback((state: BlurState) => {
    setDirection(state.direction);
    setHeight(state.height);
    setPrecision(state.precision);
    setBlur(state.blur);
    setEasingType(state.easingType);
    setPreset(state.preset as Preset);
    setReverse(state.reverse);
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoing.current = true;
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      applyState(history[idx]);
    }
  }, [historyIndex, history, applyState]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoing.current = true;
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      applyState(history[idx]);
    }
  }, [historyIndex, history, applyState]);

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    loadImageFromDB().then(img => { if (img) setCustomImage(img); });
  }, []);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // ─── Derived values ────────────────────────────────────────────────────────

  const maskImage = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i <= precision; i++) {
      const t       = i / precision;
      const easedT  = getEasing(preset, easingType, t);
      const opacity = reverse ? easedT : 1 - easedT;
      const pos     = (i / precision) * height;
      stops.push(`rgba(0, 0, 0, ${opacity.toFixed(3)}) ${pos.toFixed(1)}%`);
    }
    if (height < 100) stops.push(`rgba(0, 0, 0, ${reverse ? 1 : 0}) 100%`);
    return `linear-gradient(${direction}, ${stops.join(', ')})`;
  }, [direction, height, precision, easingType, preset, reverse]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    const code = exportFormat === 'css'
      ? `.smooth-blur {\n  backdrop-filter: blur(${blur}px);\n  -webkit-backdrop-filter: blur(${blur}px);\n  mask-image: ${maskImage};\n  -webkit-mask-image: ${maskImage};\n}`
      : `<div className="absolute inset-0 backdrop-blur-[${blur}px]" style={{ maskImage: '${maskImage}', WebkitMaskImage: '${maskImage}' }}></div>`;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success(
      exportFormat === 'css' ? 'HTML / CSS copied' : 'Tailwind copied',
      { description: 'Paste it directly into your project' },
    );
  }, [exportFormat, blur, maskImage]);

  const resetBlur = useCallback(() => applyState(DEFAULT_STATE), [applyState]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCustomImage(dataUrl);
      await saveImageToDB(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeCustomImage = useCallback(async () => {
    setCustomImage(null);
    await deleteImageFromDB();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 md:p-6 font-sans transition-colors duration-500 bg-background text-foreground">
      <div className="flex flex-col lg:flex-row gap-4 max-w-4xl w-full items-center lg:items-stretch justify-center">

        {/* ── Preview ────────────────────────────────────────────────────────── */}
        <section
          aria-label="Effect preview"
          className="relative w-full max-w-[400px] aspect-[4/5] lg:aspect-auto rounded-xl overflow-hidden shadow-xl shrink-0 flex items-center justify-center bg-muted"
        >
          {/* Upload controls */}
          <div className="absolute top-3 right-3 z-20 flex gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="sr-only"
              aria-label="Upload custom preview image"
            />
            <Button
              variant="secondary"
              size="icon-xs"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload image"
              className="backdrop-blur-sm bg-background/70"
            >
              <IconUpload size={14} stroke={2} />
            </Button>
            {customImage && (
              <Button
                variant="secondary"
                size="icon-xs"
                onClick={removeCustomImage}
                aria-label="Remove custom image"
                className="backdrop-blur-sm bg-background/70"
              >
                <IconX size={14} stroke={2} />
              </Button>
            )}
          </div>

          {/* Image */}
          {customImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={customImage}
              alt="Custom blur effect preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src="https://picsum.photos/800/1000?random=1"
              alt="Blur effect preview"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              priority
              className="object-cover"
            />
          )}

          {/* Blur overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backdropFilter:       `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage:            maskImage,
              WebkitMaskImage:      maskImage,
            }}
          />

          {/* Caption */}
          <div className="absolute bottom-4 left-4 text-white/80 text-xs font-medium drop-shadow-md z-10">
            {customImage ? 'Your Photo' : <>Photo by <span className="font-bold text-white">Picsum</span></>}
          </div>
        </section>

        {/* ── Controls ───────────────────────────────────────────────────────── */}
        <Card className="w-full max-w-[360px] shrink-0 shadow-xl gap-0 py-0 bg-card border-border">
          <CardContent className="p-5 flex-1 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Blur Generator
              </span>
              <div role="toolbar" aria-label="Actions" className="flex gap-1">
                <Button
                  variant="ghost" size="icon-xs"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  aria-label="Undo"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconArrowBackUp size={14} stroke={2} />
                </Button>
                <Button
                  variant="ghost" size="icon-xs"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  aria-label="Redo"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconArrowForwardUp size={14} stroke={2} />
                </Button>
                <Button
                  variant="ghost" size="icon-xs"
                  onClick={resetBlur}
                  aria-label="Reset settings"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <IconRotateClockwise size={14} stroke={2} />
                </Button>
                <Button
                  variant="ghost" size="icon-xs"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isDark ? <IconSun size={14} stroke={2} /> : <IconMoon size={14} stroke={2} />}
                </Button>
              </div>
            </div>

            {/* Params */}
            <div className="space-y-4">
              <fieldset className="space-y-1 border-none p-0 m-0">
                <legend className="sr-only">Blur parameters</legend>

                {/* Direction */}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Direction</span>
                  <div role="radiogroup" aria-label="Blur direction" className="flex gap-1 p-1 rounded-lg shadow-inner bg-muted">
                    {DIRECTIONS.map(dir => (
                      <button
                        key={dir.id}
                        role="radio"
                        aria-checked={direction === dir.id}
                        aria-label={dir.label}
                        onClick={() => setDirection(dir.id)}
                        className={`relative w-7 h-7 rounded-md flex items-center justify-center transition-colors z-10 ${direction === dir.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {direction === dir.id && (
                          <motion.div
                            layoutId="active-direction"
                            className="absolute inset-0 rounded-md bg-background shadow-sm"
                            transition={SPRING}
                          />
                        )}
                        <span className="relative z-20">
                          <dir.icon size={14} stroke={2} aria-hidden="true" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <SliderRow label="Height"    value={height}    min={0}  max={100} step={1}  onChange={setHeight}    unit="%" />
                <SliderRow label="Precision" value={precision} min={2}  max={20}  step={1}  onChange={setPrecision} />
                <SliderRow label="Blur"      value={blur}      min={0}  max={50}  step={1}  onChange={setBlur}      unit="px" />
              </fieldset>

              <div className="pt-4 border-t border-border">

                {/* Easing type */}
                <fieldset className="border-none p-0 m-0 mb-4">
                  <legend className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Easing Type
                  </legend>
                  <div role="radiogroup" aria-label="Easing type" className="flex gap-1 p-1 rounded-lg shadow-inner bg-muted">
                    {EASING_TYPES.map(type => (
                      <button
                        key={type.id}
                        role="radio"
                        aria-checked={easingType === type.id}
                        onClick={() => setEasingType(type.id)}
                        className={`relative flex-1 py-1.5 text-[11px] font-medium rounded-md flex items-center justify-center transition-colors z-10 ${easingType === type.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {easingType === type.id && (
                          <motion.div
                            layoutId="active-easing"
                            className="absolute inset-0 rounded-md bg-background shadow-sm"
                            transition={SPRING}
                          />
                        )}
                        <span className="relative z-20 flex items-center">
                          <svg aria-hidden="true" className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={type.path} />
                          </svg>
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Presets — same pattern: muted bg container + elastic layoutId */}
                <fieldset className="border-none p-0 m-0 mb-4">
                  <legend className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Presets
                  </legend>
                  <div role="radiogroup" aria-label="Easing preset" className="grid grid-cols-3 gap-1 p-1 rounded-lg shadow-inner bg-muted">
                    {PRESETS.map(p => (
                      <button
                        key={p}
                        role="radio"
                        aria-checked={preset === p}
                        onClick={() => setPreset(p)}
                        className={`relative py-1.5 text-[11px] font-medium rounded-md flex items-center justify-center transition-colors z-10 ${preset === p ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {preset === p && (
                          <motion.div
                            layoutId="active-preset"
                            className="absolute inset-0 rounded-md bg-background shadow-sm"
                            transition={SPRING}
                          />
                        )}
                        <span className="relative z-20 flex items-center capitalize">
                          <svg aria-hidden="true" className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {PRESET_PATHS[p]}
                          </svg>
                          {p}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Reverse toggle */}
                <div className="flex items-center justify-between py-1">
                  <label htmlFor={reverseId} className="text-xs font-medium text-muted-foreground">
                    Reverse direction
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id={reverseId}
                      type="checkbox"
                      checked={reverse}
                      onChange={(e) => setReverse(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 peer-focus-visible:ring-2 peer-focus-visible:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all bg-muted-foreground/30 peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Export footer */}
          <CardFooter className="p-4 border-t justify-between rounded-b-xl relative bg-muted border-border">
            <div className="flex flex-col" ref={dropdownRef}>
              <span className="font-bold text-xs text-foreground">Export code</span>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
                aria-label={`Export format: ${exportFormat === 'css' ? 'HTML / CSS' : 'Tailwind'}`}
                className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              >
                {exportFormat === 'css'
                  ? <IconCode size={13} stroke={2} aria-hidden="true" />
                  : <IconBrandTailwind size={13} stroke={2} aria-hidden="true" />}
                <span className="text-[11px] font-semibold">
                  {exportFormat === 'css' ? 'HTML / CSS' : 'Tailwind'}
                </span>
                <IconChevronUp
                  size={11} stroke={2}
                  className={`transition-transform duration-300 ${isDropdownOpen ? '' : 'rotate-180'}`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    role="listbox"
                    aria-label="Export format"
                    className="absolute bottom-full left-0 mb-2.5 w-52 rounded-xl shadow-2xl border overflow-hidden z-50 bg-popover border-border"
                  >
                    <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Format
                    </p>
                    {([
                      {
                        value:   'css'      as const,
                        label:   'HTML / CSS',
                        desc:    'Standard CSS mask-image',
                        Icon:    IconCode,
                      },
                      {
                        value:   'tailwind' as const,
                        label:   'Tailwind',
                        desc:    'Inline JSX utility classes',
                        Icon:    IconBrandTailwind,
                      },
                    ]).map(opt => {
                      const active = exportFormat === opt.value;
                      return (
                        <button
                          key={opt.value}
                          role="option"
                          aria-selected={active}
                          onClick={() => { setExportFormat(opt.value); setIsDropdownOpen(false); }}
                          className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors last:mb-1 ${
                            active
                              ? 'bg-accent text-foreground'
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                          }`}
                        >
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            active ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            <opt.Icon size={16} stroke={1.75} aria-hidden="true" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold leading-none mb-0.5">{opt.label}</span>
                            <span className="text-[10px] leading-tight opacity-60">{opt.desc}</span>
                          </div>
                          {active && (
                            <IconCheck size={14} stroke={2.5} className="ml-auto shrink-0 text-primary" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={handleCopy}
              size="sm"
              aria-label="Copy code to clipboard"
              className="min-w-[80px] text-[11px] font-bold overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                  <motion.span
                    key="copied"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    exit={{ clipPath: 'inset(0 0 0 100%)' }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5"
                  >
                    <IconCheck size={13} stroke={2.5} aria-hidden="true" />
                    COPIED
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    exit={{ clipPath: 'inset(0 0 0 100%)' }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5"
                  >
                    <IconCopy size={13} stroke={2} aria-hidden="true" />
                    COPY
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
