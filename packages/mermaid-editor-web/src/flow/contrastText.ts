export type Rgb = { r: number; g: number; b: number };

const LIGHT_TEXT = '#ffffff';
const DARK_TEXT = '#141414';
const LUMINANCE_THRESHOLD = 0.45;

function parseHexColor(input: string): Rgb | null {
  const hex = input.startsWith('#') ? input.slice(1) : input;
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

function parseRgbFunction(input: string): (Rgb & { a: number }) | null {
  const m = /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(
    input.trim()
  );
  if (!m) {
    return null;
  }
  const channel = (v: string) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : Number(v));
  return {
    r: channel(m[1]),
    g: channel(m[2]),
    b: channel(m[3]),
    a: m[4] !== undefined ? Math.min(1, Math.max(0, Number(m[4]))) : 1,
  };
}

function compositeRgb(fg: Rgb & { a: number }, bg: Rgb): Rgb {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Resolve a CSS color string to RGB, optionally compositing alpha over a backdrop. */
export function resolveColorToRgb(color: string, backdrop?: Rgb): Rgb | null {
  const trimmed = color.trim();
  if (!trimmed) {
    return null;
  }

  const rgbFn = parseRgbFunction(trimmed);
  if (rgbFn) {
    if (rgbFn.a < 1 && backdrop) {
      return compositeRgb(rgbFn, backdrop);
    }
    return { r: rgbFn.r, g: rgbFn.g, b: rgbFn.b };
  }

  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }

  return parseHexColor(trimmed);
}

export function isDarkBackground(color: string, backdrop?: Rgb): boolean {
  const rgb = resolveColorToRgb(color, backdrop);
  if (!rgb) {
    return false;
  }
  return relativeLuminance(rgb) < LUMINANCE_THRESHOLD;
}

/** Pick white or near-black label text for readable contrast on `backgroundColor`. */
export function contrastingTextColor(
  backgroundColor: string,
  backdrop?: Rgb
): typeof LIGHT_TEXT | typeof DARK_TEXT {
  return isDarkBackground(backgroundColor, backdrop) ? LIGHT_TEXT : DARK_TEXT;
}

export const CANVAS_BACKDROP_RGB = {
  dark: { r: 20, g: 20, b: 20 },
  light: { r: 255, g: 255, b: 255 },
} as const satisfies Record<'dark' | 'light', Rgb>;
