'use client';

import { Toaster } from 'sileo';
import { useTheme } from 'next-themes';

export function SileoToaster() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Toaster
      position="top-right"
      options={
        isDark
          ? {
              // dark theme → white toast
              fill: '#ffffff',
              roundness: 16,
              styles: {
                title:       '!text-neutral-900',
                description: '!text-neutral-600',
                badge:       '!bg-black/8',
              },
            }
          : {
              // light theme → black toast
              fill: '#0f0f0f',
              roundness: 16,
              styles: {
                title:       '!text-white',
                description: '!text-white/70',
                badge:       '!bg-white/10',
              },
            }
      }
    />
  );
}
