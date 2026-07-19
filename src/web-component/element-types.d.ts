/**
 * Type declarations for the Sequence Diagram custom element.
 * These extend the built-in HTMLElement interface.
 */

import type { SequenceDiagramData } from '../model/public-types';
import type { SequenceDiagramError, SequenceDiagramWarning } from '../model/validation-types';
import type { PaletteName } from './attributes';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Custom element API
// ---------------------------------------------------------------------------

export interface SequenceDiagramElement extends HTMLElement {
  // Properties
  /**
   * The diagram data. Can be set as a JS object, JSON string, or null to clear.
   */
  data: SequenceDiagramData | string | null;

  /**
   * The color theme. Values: "light" | "dark" | "system".
   * @default "system"
   */
  theme: 'light' | 'dark' | 'system';

  /**
   * The color palette. Values: "classic" | "ocean" | "forest" | "violet" | "sunset" | "rose" | "slate".
   * @default "classic"
   */
  palette: PaletteName;

  /**
   * The configuration options.
   */
  config: Partial<SequenceDiagramConfig>;

  /**
   * Current validation errors (readonly).
   */
  readonly validationErrors: SequenceDiagramError[];

  /**
   * Current validation warnings (readonly).
   */
  readonly validationWarnings: SequenceDiagramWarning[];

  // Methods
  /**
   * Sets the diagram data.
   * @param data - The diagram data object or JSON string
   */
  setData(data: SequenceDiagramData | string): void;

  /**
   * Gets the current diagram data.
   * @returns The current data or null if not set
   */
  getData(): SequenceDiagramData | string | null;

  /**
   * Validates data without setting it.
   * @param input - Optional data to validate. Defaults to current data.
   */
  validateData(input?: unknown): {
    valid: boolean;
    errors: SequenceDiagramError[];
    warnings: SequenceDiagramWarning[];
  };

  /**
   * Fits the viewport to show all content.
   * @param options - Optional fit options
   */
  fitView(options?: { padding?: number; duration?: number }): void;

  /**
   * Resets the viewport to default position and zoom.
   */
  resetView(): void;

  /**
   * Forces a re-render with current data.
   */
  refresh(): void;
}

// ---------------------------------------------------------------------------
// Global declaration
// ---------------------------------------------------------------------------

declare global {
  interface HTMLElementTagNameMap {
    'sequence-diagram': SequenceDiagramElement;
  }
}
