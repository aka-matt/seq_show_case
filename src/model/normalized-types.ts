/**
 * Normalized data types produced by the Normalizer.
 * These are React-independent — pure TypeScript only.
 */

import type {
  Participant,
  MessageEvent,
  NoteEvent,
  FragmentEvent,
} from "./public-types";

// ---------------------------------------------------------------------------
// Normalized participant (with index)
// ---------------------------------------------------------------------------

export interface NormalizedParticipant extends Participant {
  /** Zero-based index in participants array */
  index: number;
}

// ---------------------------------------------------------------------------
// Normalized events (with defaults filled)
// ---------------------------------------------------------------------------

export type NormalizedSequenceEvent =
  | NormalizedMessageEvent
  | NormalizedNoteEvent
  | NormalizedActivateEvent
  | NormalizedDeactivateEvent
  | NormalizedDividerEvent
  | NormalizedFragmentEvent;

export interface NormalizedMessageEvent extends MessageEvent {
  messageKind: "sync" | "async" | "return";
  /** True when from === to */
  isSelfCall: boolean;
  /** Estimated visual width in pixels */
  estimatedWidth: number;
}

export interface NormalizedNoteEvent extends NoteEvent {
  placement: "left" | "right" | "center";
  /** Estimated number of lines after wrapping */
  estimatedLineCount: number;
}

export interface NormalizedActivateEvent {
  id: string;
  type: "activate";
  participant: string;
  /** Depth in fragment nesting */
  depth: number;
}

export interface NormalizedDeactivateEvent {
  id: string;
  type: "deactivate";
  participant: string;
  /** Depth in fragment nesting */
  depth: number;
}

export interface NormalizedDividerEvent {
  id: string;
  type: "divider";
  label?: string;
}

export interface NormalizedFragmentEvent extends Omit<FragmentEvent, "branches" | "label"> {
  /** Inferred participant IDs if not provided */
  participants: string[];
  branches: NormalizedFragmentBranch[];
  label?: string;
}

export interface NormalizedFragmentBranch {
  id: string;
  label?: string;
  events: NormalizedSequenceEvent[];
}

// ---------------------------------------------------------------------------
// Activation pair tracking
// ---------------------------------------------------------------------------

/** A matched activate/deactivate pair */
export interface ActivationPair {
  activateId: string;
  deactivateId: string;
  participant: string;
  /** Row index where activate occurs */
  activateRow: number;
  /** Row index where deactivate occurs */
  deactivateRow: number;
}

// ---------------------------------------------------------------------------
// Self-call tracking
// ---------------------------------------------------------------------------

/** A self-call message */
export interface SelfCallInfo {
  eventId: string;
  participant: string;
  row: number;
}

// ---------------------------------------------------------------------------
// Normalized root
// ---------------------------------------------------------------------------

export interface NormalizedData {
  schemaVersion: "1.0";
  id?: string;
  title?: string;
  description?: string;
  participants: NormalizedParticipant[];
  events: NormalizedSequenceEvent[];
  /** Participant ID → zero-based index */
  participantIndex: Map<string, number>;
  /** Event ID → row info */
  eventIndex: Map<string, EventRowInfo>;
  /** Activation pairs matched by the normalizer */
  activationPairs: ActivationPair[];
  /** Self-call messages detected */
  selfCalls: SelfCallInfo[];
  /** Unclosed activations (activate with no matching deactivate) */
  unclosedActivations: string[];
  options?: {
    showSequenceNumbers?: boolean;
    showParticipantIcons?: boolean;
    messageLabelMaxWidth?: number;
    participantWidth?: number;
    participantGap?: number;
    rowGap?: number;
  };
}

/** Info stored in event index */
export interface EventRowInfo {
  row: number;
  depth: number;
  parentFragmentId?: string;
  parentBranchId?: string;
}
