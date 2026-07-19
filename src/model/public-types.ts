/**
 * Public TypeScript types for the Sequence Diagram Web Component.
 * These types define the public JSON data model and must be React-independent.
 */

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export interface SequenceDiagramData {
  schemaVersion: "1.0";
  id?: string;
  title?: string;
  description?: string;
  participants: Participant[];
  events: SequenceEvent[];
  options?: DiagramDataOptions;
}

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------

export type ParticipantKind = "actor" | "service" | "system" | "database" | "queue" | "external";

export type ParticipantIcon = "person" | "server" | "database" | "queue" | "cloud" | "browser";

export interface Participant {
  id: string;
  label: string;
  subtitle?: string;
  kind?: ParticipantKind;
  icon?: ParticipantIcon;
  accent?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

// ---------------------------------------------------------------------------
// Events union
// ---------------------------------------------------------------------------

export type SequenceEvent = MessageEvent | NoteEvent | ActivateEvent | DeactivateEvent | DividerEvent | FragmentEvent;

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export type MessageKind = "sync" | "async" | "return";

export type MessageStatus = "normal" | "success" | "warning" | "error" | "muted";

export interface MessageEvent {
  id: string;
  type: "message";
  from: string;
  to: string;
  label: string;
  messageKind?: MessageKind;
  number?: string | number;
  status?: MessageStatus;
  tooltip?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

// ---------------------------------------------------------------------------
// Note
// ---------------------------------------------------------------------------

export type NotePlacement = "left" | "right" | "center";
export type NoteTone = "info" | "success" | "warning" | "error" | "neutral";

export interface NoteEvent {
  id: string;
  type: "note";
  text: string;
  over: string[];
  placement?: NotePlacement;
  tone?: NoteTone;
}

// ---------------------------------------------------------------------------
// Activate / Deactivate
// ---------------------------------------------------------------------------

export interface ActivateEvent {
  id: string;
  type: "activate";
  participant: string;
}

export interface DeactivateEvent {
  id: string;
  type: "deactivate";
  participant: string;
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export interface DividerEvent {
  id: string;
  type: "divider";
  label?: string;
}

// ---------------------------------------------------------------------------
// Fragment
// ---------------------------------------------------------------------------

export type FragmentKind = "alt" | "opt" | "loop" | "par" | "critical" | "break";

export interface FragmentBranch {
  id: string;
  label?: string;
  events: SequenceEvent[];
}

export interface FragmentEvent {
  id: string;
  type: "fragment";
  fragmentKind: FragmentKind;
  label?: string;
  participants?: string[];
  branches: FragmentBranch[];
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface DiagramDataOptions {
  showSequenceNumbers?: boolean;
  showParticipantIcons?: boolean;
  messageLabelMaxWidth?: number;
  participantWidth?: number;
  participantGap?: number;
  rowGap?: number;
}
