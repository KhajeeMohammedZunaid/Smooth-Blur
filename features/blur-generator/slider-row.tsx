'use client';

import React, { useId } from 'react';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  unit?: string;
}

export function SliderRow({ label, value, min, max, step, onChange, unit = '' }: SliderRowProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground w-16 shrink-0">
        {label}
      </label>
      <div className="relative flex-1 flex items-center">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
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
