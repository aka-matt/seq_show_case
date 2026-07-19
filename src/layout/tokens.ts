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
  canvasPaddingX: 48,
  canvasPaddingTop: 32,
  canvasPaddingBottom: 48,
  participantWidth: 156,
  participantHeaderHeight: 68,
  participantGap: 112,
  firstEventOffset: 72,
  rowHeight: 56,
  rowGap: 8,
  fragmentPaddingX: 20,
  fragmentPaddingTop: 38,
  fragmentPaddingBottom: 18,
  branchHeaderHeight: 28,
  activationWidth: 12,
  selfMessageWidth: 54,
};
