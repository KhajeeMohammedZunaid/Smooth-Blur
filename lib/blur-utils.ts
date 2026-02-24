export const easings = {
  linear: (t: number) => t,
  sine: {
    in: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
    out: (t: number) => Math.sin((t * Math.PI) / 2),
    'in-out': (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  },
  quad: {
    in: (t: number) => t * t,
    out: (t: number) => 1 - (1 - t) * (1 - t),
    'in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  },
  cubic: {
    in: (t: number) => t * t * t,
    out: (t: number) => 1 - Math.pow(1 - t, 3),
    'in-out': (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  },
  quart: {
    in: (t: number) => t * t * t * t,
    out: (t: number) => 1 - Math.pow(1 - t, 4),
    'in-out': (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  },
  quint: {
    in: (t: number) => t * t * t * t * t,
    out: (t: number) => 1 - Math.pow(1 - t, 5),
    'in-out': (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  },
  expo: {
    in: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    out: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    'in-out': (t: number) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  },
  circ: {
    in: (t: number) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
    out: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),
    'in-out': (t: number) => t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  },
};

export type EasingPreset = keyof typeof easings;
export type EasingVariant = 'in' | 'out' | 'in-out';

export function getEasing(preset: string, type: string, t: number): number {
  if (preset === 'linear') return easings.linear(t);
  const curve = easings[preset as Exclude<EasingPreset, 'linear'>];
  return curve[type as EasingVariant](t);
}
