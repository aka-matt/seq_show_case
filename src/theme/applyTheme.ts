/**
 * Apply theme tokens as CSS variables to a Shadow DOM host element.
 */

import type { PaletteTokens, ThemeMode } from './tokens';
import type { PaletteName } from './palettes';
import { resolveTheme } from './themeResolver';

/**
 * CSS variable names that map to palette tokens.
 */
const CSS_VAR_MAP: Record<keyof PaletteTokens, string> = {
  canvas: '--sd-canvas',
  surface: '--sd-surface',
  surfaceMuted: '--sd-surface-muted',
  text: '--sd-text',
  textMuted: '--sd-text-muted',
  border: '--sd-border',
  accent: '--sd-accent',
  accentSoft: '--sd-accent-soft',
  line: '--sd-line',
  success: '--sd-success',
  warning: '--sd-warning',
  error: '--sd-error',
  note: '--sd-note',
  fragmentFill: '--sd-fragment-fill',
  shadow: '--sd-shadow',
};

/**
 * Additional CSS custom properties from spec (section 9.6).
 * These override or extend the palette tokens.
 */
/**
 * Options for applyTheme.
 */
export interface ApplyThemeOptions {
  /** The host element (typically a Shadow DOM root's host) */
  host: HTMLElement;
  /** Theme mode */
  mode: ThemeMode;
  /** Palette name */
  palette: PaletteName | string;
  /** Additional CSS variable overrides from host page */
  hostOverrides?: Record<string, string>;
}

/**
 * Apply theme tokens as CSS custom properties to the host element.
 * Uses CSS variables so host page can override via CSS cascade.
 */
export function applyTheme(options: ApplyThemeOptions): void {
  const { host, mode, palette, hostOverrides = {} } = options;
  const { tokens } = resolveTheme(mode, palette);

  // Apply each token as a CSS variable
  for (const [token, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = tokens[token as keyof PaletteTokens];
    host.style.setProperty(cssVar, value);
  }

  // Apply host override CSS variables (these take precedence)
  for (const [prop, value] of Object.entries(hostOverrides)) {
    host.style.setProperty(prop, value);
  }

  // Set data attributes for CSS targeting
  const resolvedTheme = resolveTheme(mode, palette);
  host.dataset.theme = resolvedTheme.mode;
  host.dataset.palette = palette;
}

/**
 * Remove theme CSS variables from an element.
 */
export function removeTheme(host: HTMLElement): void {
  // Remove all CSS variables we set
  for (const cssVar of Object.values(CSS_VAR_MAP)) {
    host.style.removeProperty(cssVar);
  }

  // Remove data attributes
  delete host.dataset.theme;
  delete host.dataset.palette;
}

/**
 * Get current CSS variable values from a host element.
 * Useful for debugging and testing.
 */
export function getAppliedTheme(host: HTMLElement): Record<string, string> {
  const result: Record<string, string> = {};

  for (const cssVar of Object.values(CSS_VAR_MAP)) {
    const value = getComputedStyle(host).getPropertyValue(cssVar).trim();
    if (value) {
      result[cssVar] = value;
    }
  }

  return result;
}

/**
 * Build CSS string for theme tokens.
 * Useful for inline styles within Shadow DOM.
 */
export function buildThemeCSS(tokens: PaletteTokens, extraVars?: Record<string, string>): string {
  const vars: string[] = [];

  for (const [token, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = tokens[token as keyof PaletteTokens];
    vars.push(`${cssVar}: ${value};`);
  }

  // Add extra variables
  if (extraVars) {
    for (const [prop, value] of Object.entries(extraVars)) {
      vars.push(`${prop}: ${value};`);
    }
  }

  return vars.join('\n  ');
}
