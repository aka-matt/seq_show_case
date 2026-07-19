/**
 * Attribute parsing and serialization for the Sequence Diagram Web Component.
 * Handles type coercion, defaults, and validation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';
export type PaletteName = 'classic' | 'ocean' | 'forest' | 'violet' | 'sunset' | 'rose' | 'slate';

export interface SequenceDiagramConfig {
  minZoom: number;
  maxZoom: number;
  controls: boolean;
  minimap: boolean;
  fitView: boolean;
  interactive: boolean;
  showBackground: boolean;
  ariaLabel: string;
}

export const DEFAULT_CONFIG: SequenceDiagramConfig = {
  minZoom: 0.25,
  maxZoom: 2,
  controls: true,
  minimap: false,
  fitView: true,
  interactive: true,
  showBackground: false,
  ariaLabel: 'auto',
};

// ---------------------------------------------------------------------------
// Attribute names
// ---------------------------------------------------------------------------

export const ATTR_THEME = 'theme';
export const ATTR_PALETTE = 'palette';
export const ATTR_HEIGHT = 'height';
export const ATTR_MIN_ZOOM = 'min-zoom';
export const ATTR_MAX_ZOOM = 'max-zoom';
export const ATTR_CONTROLS = 'controls';
export const ATTR_MINIMAP = 'minimap';
export const ATTR_FIT_VIEW = 'fit-view';
export const ATTR_INTERACTIVE = 'interactive';
export const ATTR_SHOW_BACKGROUND = 'show-background';
export const ATTR_ARIA_LABEL = 'aria-label';
export const ATTR_DATA_JSON = 'data-json';

export const ALL_OBSERVED_ATTRIBUTES = [
  ATTR_THEME,
  ATTR_PALETTE,
  ATTR_HEIGHT,
  ATTR_MIN_ZOOM,
  ATTR_MAX_ZOOM,
  ATTR_CONTROLS,
  ATTR_MINIMAP,
  ATTR_FIT_VIEW,
  ATTR_INTERACTIVE,
  ATTR_SHOW_BACKGROUND,
  ATTR_ARIA_LABEL,
  ATTR_DATA_JSON,
];

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse theme attribute
 */
export function parseTheme(value: string | null): Theme {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

/**
 * Parse palette attribute
 */
export function parsePalette(value: string | null): PaletteName {
  const validPalettes: PaletteName[] = ['classic', 'ocean', 'forest', 'violet', 'sunset', 'rose', 'slate'];
  if (value && validPalettes.includes(value as PaletteName)) {
    return value as PaletteName;
  }
  return 'classic';
}

/**
 * Parse height attribute (CSS length)
 */
export function parseHeight(value: string | null): string {
  if (value && /^[\d.]+(px|em|rem|%|vh|vw)$/.test(value)) {
    return value;
  }
  return '520px';
}

/**
 * Parse zoom limit attributes
 */
export function parseZoom(value: string | null, defaultValue: number): number {
  if (value === null) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed <= 0) return defaultValue;
  return Math.min(Math.max(parsed, 0.01), 10); // Clamp to reasonable range
}

/**
 * Parse boolean attribute
 */
export function parseBoolean(value: string | null, defaultValue: boolean): boolean {
  if (value === null) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Parse aria-label attribute
 */
export function parseAriaLabel(value: string | null): string {
  return value ?? 'auto';
}

/**
 * Parse data-json attribute
 */
export function parseDataJson(value: string | null): string | null {
  return value;
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serialize theme to attribute value
 */
export function serializeTheme(value: Theme): string {
  return value;
}

/**
 * Serialize palette to attribute value
 */
export function serializePalette(value: PaletteName): string {
  return value;
}

/**
 * Serialize height to attribute value
 */
export function serializeHeight(value: string): string {
  return value;
}

/**
 * Serialize boolean to attribute value
 */
export function serializeBoolean(value: boolean): string {
  return value ? 'true' : 'false';
}

/**
 * Serialize zoom to attribute value
 */
export function serializeZoom(value: number): string {
  return String(value);
}

// ---------------------------------------------------------------------------
// Config extraction
// ---------------------------------------------------------------------------

/**
 * Extract full config from an element's attributes
 */
export function extractConfig(element: Element): SequenceDiagramConfig {
  // Theme, palette, height are parsed but returned separately via dedicated getters
  parseTheme(element.getAttribute(ATTR_THEME));
  parsePalette(element.getAttribute(ATTR_PALETTE));
  parseHeight(element.getAttribute(ATTR_HEIGHT));
  const minZoom = parseZoom(element.getAttribute(ATTR_MIN_ZOOM), DEFAULT_CONFIG.minZoom);
  const maxZoom = parseZoom(element.getAttribute(ATTR_MAX_ZOOM), DEFAULT_CONFIG.maxZoom);
  const controls = parseBoolean(element.getAttribute(ATTR_CONTROLS), DEFAULT_CONFIG.controls);
  const minimap = parseBoolean(element.getAttribute(ATTR_MINIMAP), DEFAULT_CONFIG.minimap);
  const fitView = parseBoolean(element.getAttribute(ATTR_FIT_VIEW), DEFAULT_CONFIG.fitView);
  const interactive = parseBoolean(element.getAttribute(ATTR_INTERACTIVE), DEFAULT_CONFIG.interactive);
  const showBackground = parseBoolean(element.getAttribute(ATTR_SHOW_BACKGROUND), DEFAULT_CONFIG.showBackground);
  const ariaLabel = parseAriaLabel(element.getAttribute(ATTR_ARIA_LABEL));

  return {
    minZoom,
    maxZoom,
    controls,
    minimap,
    fitView,
    interactive,
    showBackground,
    ariaLabel,
  };
}
