/**
 * Shadow Generator — saved for later use.
 * This component is NOT imported anywhere in the app yet.
 * It is self-contained: all state, helpers, and sub-components live here.
 *
 * To activate: import dynamically in app/page.tsx (or any page) like:
 *
 *   const ShadowGenerator = dynamic(() => import('@/features/shadow-generator'), { ssr: false });
 */

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react';
import {
  IconRotateClockwise, IconSun, IconMoon, IconCopy, IconChevronUp,
  IconArrowBackUp, IconArrowForwardUp,
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, opacity: number) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// ─── SliderRow ─────────────────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground w-16 shrink-0">{label}</label>
      <div className="relative flex-1 flex items-center">
        <input
          id={id} type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 rounded-md appearance-none cursor-pointer bg-muted text-foreground"
        />
      </div>
      <output htmlFor={id} className="text-xs font-mono text-muted-foreground w-10 text-right tabular-nums">
        {value}{unit}
      </output>
    </div>
  );
}

// ─── ColorPickerField ──────────────────────────────────────────────────────────

function ColorPickerField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const colorId = useId();
  const textId  = useId();
  return (
    <div className="flex-1 flex flex-col gap-1.5">
      <label htmlFor={colorId} className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-background">
        <input id={colorId} type="color" value={value} onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="size-6 rounded cursor-pointer bg-transparent border-none p-0" />
        <label htmlFor={textId} className="sr-only">{label} hex value</label>
        <input id={textId} type="text" value={value} onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex value`}
          className="w-16 text-xs font-mono text-muted-foreground uppercase bg-transparent border-none outline-none" />
      </div>
    </div>
  );
}

// ─── InlineColorPicker ─────────────────────────────────────────────────────────

function InlineColorPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const colorId = useId();
  const textId  = useId();
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-border bg-background">
      <label htmlFor={colorId} className="sr-only">{label} color</label>
      <input id={colorId} type="color" value={value} onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color picker`}
        className="size-4 rounded cursor-pointer bg-transparent border-none p-0" />
      <label htmlFor={textId} className="sr-only">{label} hex</label>
      <input id={textId} type="text" value={value} onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} hex value`}
        className="w-14 text-[10px] font-mono text-muted-foreground uppercase bg-transparent border-none outline-none" />
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type ShadowState = {
  buttonText: string;
  buttonBgColor: string;
  buttonTextColor: string;
  paddingX: number; paddingY: number;
  fontSize: number; fontWeight: number; borderRadius: number;
  outsetX: number; outsetY: number; outsetBlur: number; outsetSpread: number;
  outsetOpacity: number; outsetShadowColor: string;
  insetX: number; insetY: number; insetBlur: number; insetSpread: number;
  insetOpacity: number; insetShadowColor: string;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ShadowGenerator() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [buttonText,       setButtonText]       = useState('Hover Me');
  const [buttonBgColor,    setButtonBgColor]    = useState('#ffffff');
  const [buttonTextColor,  setButtonTextColor]  = useState('#000000');
  const [paddingX,         setPaddingX]         = useState(32);
  const [paddingY,         setPaddingY]         = useState(16);
  const [fontSize,         setFontSize]         = useState(14);
  const [fontWeight,       setFontWeight]       = useState(700);
  const [borderRadius,     setBorderRadius]     = useState(16);
  const [outsetX,          setOutsetX]          = useState(0);
  const [outsetY,          setOutsetY]          = useState(10);
  const [outsetBlur,       setOutsetBlur]       = useState(20);
  const [outsetSpread,     setOutsetSpread]     = useState(-5);
  const [outsetOpacity,    setOutsetOpacity]    = useState(15);
  const [outsetShadowColor, setOutsetShadowColor] = useState('#000000');
  const [insetX,           setInsetX]           = useState(0);
  const [insetY,           setInsetY]           = useState(2);
  const [insetBlur,        setInsetBlur]        = useState(4);
  const [insetSpread,      setInsetSpread]      = useState(0);
  const [insetOpacity,     setInsetOpacity]     = useState(10);
  const [insetShadowColor, setInsetShadowColor] = useState('#ffffff');

  const [exportFormat,   setExportFormat]   = useState<'css' | 'tailwind'>('css');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const buttonTextId = useId();

  // ─── History ─────────────────────────────────────────────────────────────

  const currentState = useMemo<ShadowState>(() => ({
    buttonText, buttonBgColor, buttonTextColor, paddingX, paddingY, fontSize, fontWeight, borderRadius,
    outsetX, outsetY, outsetBlur, outsetSpread, outsetOpacity, outsetShadowColor,
    insetX, insetY, insetBlur, insetSpread, insetOpacity, insetShadowColor,
  }), [buttonText, buttonBgColor, buttonTextColor, paddingX, paddingY, fontSize, fontWeight, borderRadius,
    outsetX, outsetY, outsetBlur, outsetSpread, outsetOpacity, outsetShadowColor,
    insetX, insetY, insetBlur, insetSpread, insetOpacity, insetShadowColor]);

  const [history,      setHistory]      = useState<ShadowState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoing = useRef(false);

  useEffect(() => {
    if (history.length === 0) { setHistory([currentState]); setHistoryIndex(0); return; }
    if (isUndoing.current) { isUndoing.current = false; return; }
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

  const applyState = useCallback((s: ShadowState) => {
    setButtonText(s.buttonText);       setButtonBgColor(s.buttonBgColor);
    setButtonTextColor(s.buttonTextColor); setPaddingX(s.paddingX);
    setPaddingY(s.paddingY);           setFontSize(s.fontSize);
    setFontWeight(s.fontWeight);       setBorderRadius(s.borderRadius);
    setOutsetX(s.outsetX);             setOutsetY(s.outsetY);
    setOutsetBlur(s.outsetBlur);       setOutsetSpread(s.outsetSpread);
    setOutsetOpacity(s.outsetOpacity); setOutsetShadowColor(s.outsetShadowColor);
    setInsetX(s.insetX);               setInsetY(s.insetY);
    setInsetBlur(s.insetBlur);         setInsetSpread(s.insetSpread);
    setInsetOpacity(s.insetOpacity);   setInsetShadowColor(s.insetShadowColor);
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) { isUndoing.current = true; const i = historyIndex - 1; setHistoryIndex(i); applyState(history[i]); }
  }, [historyIndex, history, applyState]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) { isUndoing.current = true; const i = historyIndex + 1; setHistoryIndex(i); applyState(history[i]); }
  }, [historyIndex, history, applyState]);

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────

  const buttonBoxShadow = useMemo(() => {
    const outColor = hexToRgba(outsetShadowColor, outsetOpacity);
    const inColor  = hexToRgba(insetShadowColor, insetOpacity);
    return `${outsetX}px ${outsetY}px ${outsetBlur}px ${outsetSpread}px ${outColor}, inset ${insetX}px ${insetY}px ${insetBlur}px ${insetSpread}px ${inColor}`;
  }, [outsetX, outsetY, outsetBlur, outsetSpread, outsetOpacity, outsetShadowColor,
      insetX, insetY, insetBlur, insetSpread, insetOpacity, insetShadowColor]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    const code = exportFormat === 'css'
      ? `.custom-button {\n  background-color: ${buttonBgColor};\n  color: ${buttonTextColor};\n  padding: ${paddingY}px ${paddingX}px;\n  font-size: ${fontSize}px;\n  font-weight: ${fontWeight};\n  border-radius: ${borderRadius}px;\n  box-shadow: ${buttonBoxShadow};\n  border: none;\n  outline: none;\n  cursor: pointer;\n  transition: all 0.3s ease;\n}`
      : `<button style={{ backgroundColor: '${buttonBgColor}', color: '${buttonTextColor}', padding: '${paddingY}px ${paddingX}px', fontSize: '${fontSize}px', fontWeight: ${fontWeight}, borderRadius: '${borderRadius}px', boxShadow: '${buttonBoxShadow}' }} className="transition-all duration-300 outline-none">${buttonText}</button>`;
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  }, [exportFormat, buttonBgColor, buttonTextColor, paddingX, paddingY, fontSize, fontWeight, borderRadius, buttonBoxShadow, buttonText]);

  const resetShadow = useCallback(() => {
    setButtonText('Hover Me');
    setButtonBgColor(resolvedTheme === 'dark' ? '#2A2B2E' : '#ffffff');
    setButtonTextColor(resolvedTheme === 'dark' ? '#ffffff' : '#111827');
    setPaddingX(32); setPaddingY(16); setFontSize(14); setFontWeight(700); setBorderRadius(16);
    setOutsetX(0); setOutsetY(10); setOutsetBlur(20); setOutsetSpread(-5); setOutsetOpacity(15);
    setOutsetShadowColor('#000000');
    setInsetX(0); setInsetY(2); setInsetBlur(4); setInsetSpread(0); setInsetOpacity(10);
    setInsetShadowColor('#ffffff');
  }, [resolvedTheme]);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 md:p-6 font-sans bg-background text-foreground">
      <div className="flex flex-col lg:flex-row gap-4 max-w-4xl w-full items-center lg:items-stretch justify-center">

        {/* Preview */}
        <section
          aria-label="Shadow preview"
          className="relative w-full max-w-[400px] aspect-[4/5] lg:aspect-auto rounded-xl overflow-hidden shadow-xl shrink-0 flex items-center justify-center bg-muted"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="tracking-wide transition-shadow duration-300 outline-none border-none cursor-pointer"
            style={{
              backgroundColor: buttonBgColor,
              color:           buttonTextColor,
              padding:         `${paddingY}px ${paddingX}px`,
              fontSize:        `${fontSize}px`,
              fontWeight:      fontWeight,
              borderRadius:    borderRadius,
              boxShadow:       buttonBoxShadow,
            }}
          >
            {buttonText}
          </motion.button>
        </section>

        {/* Controls */}
        <Card className="w-full max-w-[360px] shrink-0 shadow-xl gap-0 py-0 bg-card border-border">
          <CardContent className="p-5 flex-1 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Shadow Generator
              </span>
              <div role="toolbar" aria-label="Actions" className="flex gap-1">
                <Button variant="ghost" size="icon-xs" onClick={undo} disabled={historyIndex <= 0}
                  aria-label="Undo" className="text-muted-foreground hover:text-foreground">
                  <IconArrowBackUp size={14} stroke={2} />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={redo} disabled={historyIndex >= history.length - 1}
                  aria-label="Redo" className="text-muted-foreground hover:text-foreground">
                  <IconArrowForwardUp size={14} stroke={2} />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={resetShadow}
                  aria-label="Reset settings" className="text-muted-foreground hover:text-foreground">
                  <IconRotateClockwise size={14} stroke={2} />
                </Button>
                <Button variant="ghost" size="icon-xs"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="text-muted-foreground hover:text-foreground">
                  {isDark ? <IconSun size={14} stroke={2} /> : <IconMoon size={14} stroke={2} />}
                </Button>
              </div>
            </div>

            {/* Controls body */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">

              {/* Button text */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor={buttonTextId} className="text-xs font-medium text-muted-foreground">Button Text</label>
                <input
                  id={buttonTextId} type="text" value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-md border outline-none transition-colors bg-background border-border text-foreground focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Colors */}
              <div className="flex items-center justify-between gap-3">
                <ColorPickerField label="Background" value={buttonBgColor} onChange={setButtonBgColor} />
                <ColorPickerField label="Text Color"  value={buttonTextColor} onChange={setButtonTextColor} />
              </div>

              {/* Dimensions */}
              <fieldset className="pt-4 border-t border-border p-0 m-0">
                <legend className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Dimensions & Font
                </legend>
                <div className="space-y-1">
                  <SliderRow label="Padding X" value={paddingX}    min={0}   max={100} step={1}   onChange={setPaddingX}    unit="px" />
                  <SliderRow label="Padding Y" value={paddingY}    min={0}   max={100} step={1}   onChange={setPaddingY}    unit="px" />
                  <SliderRow label="Font Size" value={fontSize}    min={10}  max={48}  step={1}   onChange={setFontSize}    unit="px" />
                  <SliderRow label="Weight"    value={fontWeight}  min={100} max={900} step={100} onChange={setFontWeight}  />
                  <SliderRow label="Radius"    value={borderRadius} min={0}   max={100} step={1}  onChange={setBorderRadius} unit="px" />
                </div>
              </fieldset>

              {/* Outset shadow */}
              <fieldset className="pt-4 border-t border-border p-0 m-0">
                <legend className="sr-only">Outset Shadow</legend>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Outset Shadow</span>
                  <InlineColorPicker label="Outset shadow" value={outsetShadowColor} onChange={setOutsetShadowColor} />
                </div>
                <div className="space-y-1">
                  <SliderRow label="X Offset" value={outsetX}       min={-50} max={50}  step={1} onChange={setOutsetX}       unit="px" />
                  <SliderRow label="Y Offset" value={outsetY}       min={-50} max={50}  step={1} onChange={setOutsetY}       unit="px" />
                  <SliderRow label="Blur"     value={outsetBlur}    min={0}   max={100} step={1} onChange={setOutsetBlur}    unit="px" />
                  <SliderRow label="Spread"   value={outsetSpread}  min={-50} max={50}  step={1} onChange={setOutsetSpread}  unit="px" />
                  <SliderRow label="Opacity"  value={outsetOpacity} min={0}   max={100} step={1} onChange={setOutsetOpacity} unit="%"  />
                </div>
              </fieldset>

              {/* Inset shadow */}
              <fieldset className="pt-4 border-t border-border p-0 m-0">
                <legend className="sr-only">Inset Shadow</legend>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Inset Shadow</span>
                  <InlineColorPicker label="Inset shadow" value={insetShadowColor} onChange={setInsetShadowColor} />
                </div>
                <div className="space-y-1">
                  <SliderRow label="X Offset" value={insetX}       min={-50} max={50}  step={1} onChange={setInsetX}       unit="px" />
                  <SliderRow label="Y Offset" value={insetY}       min={-50} max={50}  step={1} onChange={setInsetY}       unit="px" />
                  <SliderRow label="Blur"     value={insetBlur}    min={0}   max={100} step={1} onChange={setInsetBlur}    unit="px" />
                  <SliderRow label="Spread"   value={insetSpread}  min={-50} max={50}  step={1} onChange={setInsetSpread}  unit="px" />
                  <SliderRow label="Opacity"  value={insetOpacity} min={0}   max={100} step={1} onChange={setInsetOpacity} unit="%"  />
                </div>
              </fieldset>
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
                className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest text-left mt-0.5 transition-colors"
              >
                {exportFormat === 'css' ? 'HTML / CSS' : 'Tailwind'}
                <IconChevronUp
                  size={10} stroke={2}
                  className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    role="listbox"
                    aria-label="Export format"
                    className="absolute bottom-full left-4 mb-2 w-32 rounded-lg shadow-xl border overflow-hidden z-50 bg-popover border-border"
                  >
                    {([
                      { value: 'css',      label: 'HTML / CSS' },
                      { value: 'tailwind', label: 'Tailwind'   },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={exportFormat === opt.value}
                        onClick={() => { setExportFormat(opt.value); setIsDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${exportFormat === opt.value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={handleCopy}
              size="sm"
              aria-label="Copy code to clipboard"
              className="text-[11px] font-bold gap-1.5 active:scale-95 transition-transform"
            >
              <IconCopy size={12} stroke={2} aria-hidden="true" />
              COPY
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
