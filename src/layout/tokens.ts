/**
 * Layout geometry tokens for the deterministic layout engine.
 * All tokens are React-independent — pure TypeScript only.
 */

import type { LayoutToken } from "./layout-types";

/**
 * Default layout geometry tokens.
 * These define the visual spacing and sizing of sequence diagram elements.
 */
export const DEFAULT_LAYOUT: LayoutToken = {
  canvasPaddingX: 32,
  canvasPaddingTop: 24,
  canvasPaddingBottom: 32,
  participantWidth: 140,
  participantHeaderHeight: 68,
  // Narrower gap so multi-participant diagrams fit typical demo viewports.
  participantGap: 80,
  firstEventOffset: 88,
  rowHeight: 48,
  rowGap: 6,
  fragmentPaddingX: 16,
  fragmentPaddingTop: 32,
  fragmentPaddingBottom: 14,
  branchHeaderHeight: 26,
  activationWidth: 12,
  selfMessageWidth: 48,
};
