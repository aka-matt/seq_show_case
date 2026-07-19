/**
 * Theme tokens for sequence diagram palettes.
 * Each palette provides a complete set of design tokens for light and dark modes.
 */

/**
 * The complete set of palette tokens for a single mode (light or dark).
 */
export interface PaletteTokens {
  /** Background canvas color */
  canvas: string;
  /** Primary surface color (cards, panels) */
  surface: string;
  /** Muted surface color (secondary backgrounds) */
  surfaceMuted: string;
  /** Primary text color */
  text: string;
  /** Muted/secondary text color */
  textMuted: string;
  /** Border color */
  border: string;
  /** Primary accent color (interactive elements, links) */
  accent: string;
  /** Soft accent color (backgrounds, highlights) */
  accentSoft: string;
  /** Line color (message arrows, dividers) */
  line: string;
  /** Success state color */
  success: string;
  /** Warning state color */
  warning: string;
  /** Error state color */
  error: string;
  /** Note background color */
  note: string;
  /** Fragment background color */
  fragmentFill: string;
  /** Shadow color */
  shadow: string;
}

/**
 * Both light and dark token sets for a palette.
 */
export interface PaletteDefinition {
  name: string;
  light: PaletteTokens;
  dark: PaletteTokens;
}

/**
 * Status types that map to different visual treatments.
 */
export type MessageStatus = 'normal' | 'success' | 'warning' | 'error' | 'muted';

/**
 * Theme mode setting.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Get the tokens for a given palette, mode, and optional status.
 */
export interface ResolvedTokens extends PaletteTokens {
  /** The resolved mode (light or dark, never 'system') */
  resolvedMode: 'light' | 'dark';
}

/**
 * Map status to line/text color token name.
 */
export function getStatusToken(status: MessageStatus): keyof PaletteTokens {
  switch (status) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'muted':
      return 'textMuted';
    case 'normal':
    default:
      return 'line';
  }
}
