/**
 * Layout types for the deterministic layout engine.
 * All types are React-independent — pure TypeScript only.
 */

// ---------------------------------------------------------------------------
// Layout tokens
// ---------------------------------------------------------------------------

export interface LayoutToken {
  canvasPaddingX: number;
  canvasPaddingTop: number;
  canvasPaddingBottom: number;
  participantWidth: number;
  participantHeaderHeight: number;
  participantGap: number;
  firstEventOffset: number;
  rowHeight: number;
  rowGap: number;
  fragmentPaddingX: number;
  fragmentPaddingTop: number;
  fragmentPaddingBottom: number;
  branchHeaderHeight: number;
  activationWidth: number;
  selfMessageWidth: number;
}

// ---------------------------------------------------------------------------
// Layout row (flattened event representation)
// ---------------------------------------------------------------------------

export type LayoutRowKind =
  | "message"
  | "note"
  | "divider"
  | "fragment-header"
  | "branch-header"
  | "spacer";

export interface LayoutRow {
  /** Unique key for React rendering */
  key: string;
  kind: LayoutRowKind;
  /** Fragment nesting depth (0 = top level) */
  depth: number;
  /** Source event ID if applicable */
  sourceEventId?: string;
  /** Estimated visual height in pixels */
  estimatedHeight: number;
  /** Fragment ID if this row is inside a fragment */
  fragmentId?: string;
  /** Branch ID if this row is inside a branch */
  branchId?: string;
}

// ---------------------------------------------------------------------------
// Layout participant
// ---------------------------------------------------------------------------

export interface LayoutParticipant {
  id: string;
  label: string;
  /** X position of left edge */
  x: number;
  /** Y position of top edge */
  y: number;
  width: number;
  height: number;
  index: number;
}

// ---------------------------------------------------------------------------
// Layout message
// ---------------------------------------------------------------------------

export interface LayoutMessage {
  eventId: string;
  fromParticipantId: string;
  toParticipantId: string;
  /** X position of message start (right edge of source participant) */
  fromX: number;
  /** X position of message end (left edge of target participant) */
  toX: number;
  /** Y position of the message row */
  y: number;
  label: string;
  messageKind: "sync" | "async" | "return";
  isSelfCall: boolean;
  /** Width of self-call loop */
  selfCallWidth: number;
  estimatedWidth: number;
}

// ---------------------------------------------------------------------------
// Layout note
// ---------------------------------------------------------------------------

export interface LayoutNote {
  eventId: string;
  text: string;
  placement: "left" | "right" | "center";
  x: number;
  y: number;
  width: number;
  height: number;
  tone: "info" | "success" | "warning" | "error" | "neutral";
  overParticipantIds: string[];
}

// ---------------------------------------------------------------------------
// Layout activation
// ---------------------------------------------------------------------------

export interface LayoutActivation {
  participantId: string;
  activateEventId: string;
  deactivateEventId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Layout fragment
// ---------------------------------------------------------------------------

export interface LayoutFragment {
  fragmentEventId: string;
  fragmentKind: "alt" | "opt" | "loop" | "par" | "critical" | "break";
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  participants: string[];
}

export interface LayoutBranch {
  branchId: string;
  fragmentEventId: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Layout divider
// ---------------------------------------------------------------------------

export interface LayoutDivider {
  eventId: string;
  label?: string;
  y: number;
  x: number;
  width: number;
}

// ---------------------------------------------------------------------------
// Overall layout bounds
// ---------------------------------------------------------------------------

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Complete layout result
// ---------------------------------------------------------------------------

export interface LayoutResult {
  participants: LayoutParticipant[];
  messages: LayoutMessage[];
  notes: LayoutNote[];
  activations: LayoutActivation[];
  fragments: LayoutFragment[];
  branches: LayoutBranch[];
  dividers: LayoutDivider[];
  rows: LayoutRow[];
  bounds: LayoutBounds;
  /** Y position of each row */
  rowYPositions: number[];
  /** Participant ID → LayoutParticipant */
  participantMap: Map<string, LayoutParticipant>;
  /** Event ID → row index */
  eventRowMap: Map<string, number>;
}
