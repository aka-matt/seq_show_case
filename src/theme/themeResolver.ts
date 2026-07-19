/**
 * Theme resolver - resolves light/dark/system theme modes.
 * Supports system theme detection via matchMedia and reduced motion.
 */

import type { PaletteDefinition, PaletteTokens, ThemeMode } from './tokens';
import { palettes, type PaletteName } from './palettes';

/**
 * Resolved theme with tokens and mode.
 */
export interface ResolvedTheme {
  mode: 'light' | 'dark';
  palette: PaletteDefinition;
  tokens: PaletteTokens;
}

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers dark color scheme.
 */
export function prefersDarkColorScheme(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolve a theme mode to an actual mode (light or dark).
 * 'system' is resolved based on the OS preference.
 */
export function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return prefersDarkColorScheme() ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Get palette definition by name, with fallback to 'classic'.
 */
export function getPalette(name: PaletteName | string): PaletteDefinition {
  const palette = palettes[name as PaletteName];
  if (palette) {
    return palette;
  }
  // Fallback to classic palette
  return palettes.classic!;
}

/**
 * Resolve a complete theme: mode + palette → resolved tokens.
 */
export function resolveTheme(
  mode: ThemeMode,
  paletteName: PaletteName | string
): ResolvedTheme {
  const resolvedMode = resolveMode(mode);
  const palette = getPalette(paletteName);
  const tokens = resolvedMode === 'dark' ? palette.dark : palette.light;

  return {
    mode: resolvedMode,
    palette,
    tokens,
  };
}

/**
 * Get a single token from a theme.
 */
export function getToken(
  mode: ThemeMode,
  paletteName: PaletteName | string,
  tokenName: keyof PaletteTokens
): string {
  const { tokens } = resolveTheme(mode, paletteName);
  return tokens[tokenName];
}

/**
 * Create a callback for system theme changes.
 * Returns a cleanup function.
 */
export function onSystemThemeChange(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Create a callback for reduced motion preference changes.
 * Returns a cleanup function.
 */
export function onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
