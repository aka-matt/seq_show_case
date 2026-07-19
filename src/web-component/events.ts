/**
 * DOM Event definitions and dispatchers for the Sequence Diagram Web Component.
 * All events bubble and are composed (cross Shadow DOM boundary).
 */

// ---------------------------------------------------------------------------
// Event detail types
// ---------------------------------------------------------------------------

export interface SequenceReadyDetail {
  id?: string;
  participantCount: number;
  eventCount: number;
}

export interface SequenceRenderedDetail {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  durationMs: number;
}

export interface SequenceErrorDetail {
  errors: Array<{
    code: string;
    message: string;
    path?: string;
    details?: unknown;
  }>;
}

export interface SequenceWarningDetail {
  warnings: Array<{
    code: string;
    message: string;
    path?: string;
    details?: unknown;
  }>;
}

export interface SequenceMessageClickDetail {
  message: {
    id: string;
    from: string;
    to: string;
    label: string;
    messageKind?: string;
  };
  nativeEvent?: MouseEvent;
}

export interface SequenceParticipantClickDetail {
  participant: {
    id: string;
    label: string;
    kind?: string;
  };
}

export interface SequenceFragmentClickDetail {
  fragment: {
    id: string;
    fragmentKind: string;
    label?: string;
  };
}

export interface SequenceViewportChangeDetail {
  x: number;
  y: number;
  zoom: number;
}

// ---------------------------------------------------------------------------
// Event names
// ---------------------------------------------------------------------------

export const EVENT_SEQUENCE_READY = 'sequence-ready';
export const EVENT_SEQUENCE_RENDERED = 'sequence-rendered';
export const EVENT_SEQUENCE_ERROR = 'sequence-error';
export const EVENT_SEQUENCE_WARNING = 'sequence-warning';
export const EVENT_SEQUENCE_MESSAGE_CLICK = 'sequence-message-click';
export const EVENT_SEQUENCE_PARTICIPANT_CLICK = 'sequence-participant-click';
export const EVENT_SEQUENCE_FRAGMENT_CLICK = 'sequence-fragment-click';
export const EVENT_SEQUENCE_VIEWPORT_CHANGE = 'sequence-viewport-change';

// ---------------------------------------------------------------------------
// Event dispatch options
// ---------------------------------------------------------------------------

const EVENT_OPTIONS = {
  bubbles: true,
  composed: true,
  cancelable: false,
} as const;

// ---------------------------------------------------------------------------
// Event dispatchers (bound to an HTMLElement context)
// ---------------------------------------------------------------------------

export type EventDispatcher<T> = (detail: T, nativeEvent?: MouseEvent) => void;

export function createSequenceReadyDispatcher(
  element: HTMLElement
): (detail: SequenceReadyDetail) => void {
  return (detail: SequenceReadyDetail) => {
    element.dispatchEvent(new CustomEvent(EVENT_SEQUENCE_READY, { ...EVENT_OPTIONS, detail }));
  };
}

export function createSequenceRenderedDispatcher(
  element: HTMLElement
): (detail: SequenceRenderedDetail) => void {
  return (detail: SequenceRenderedDetail) => {
    element.dispatchEvent(new CustomEvent(EVENT_SEQUENCE_RENDERED, { ...EVENT_OPTIONS, detail }));
  };
}

export function createSequenceErrorDispatcher(
  element: HTMLElement
): (detail: SequenceErrorDetail) => void {
  return (detail: SequenceErrorDetail) => {
    element.dispatchEvent(new CustomEvent(EVENT_SEQUENCE_ERROR, { ...EVENT_OPTIONS, detail }));
  };
}

export function createSequenceWarningDispatcher(
  element: HTMLElement
): (detail: SequenceWarningDetail) => void {
  return (detail: SequenceWarningDetail) => {
    element.dispatchEvent(new CustomEvent(EVENT_SEQUENCE_WARNING, { ...EVENT_OPTIONS, detail }));
  };
}

export function createSequenceMessageClickDispatcher(
  element: HTMLElement
): EventDispatcher<SequenceMessageClickDetail> {
  return (detail: SequenceMessageClickDetail, nativeEvent?: MouseEvent) => {
    element.dispatchEvent(
      new CustomEvent(EVENT_SEQUENCE_MESSAGE_CLICK, {
        ...EVENT_OPTIONS,
        detail,
        // Pass native event for click coordinates etc.
        ...(nativeEvent && { nativeEvent }),
      })
    );
  };
}

export function createSequenceParticipantClickDispatcher(
  element: HTMLElement
): EventDispatcher<SequenceParticipantClickDetail> {
  return (detail: SequenceParticipantClickDetail) => {
    element.dispatchEvent(
      new CustomEvent(EVENT_SEQUENCE_PARTICIPANT_CLICK, { ...EVENT_OPTIONS, detail })
    );
  };
}

export function createSequenceFragmentClickDispatcher(
  element: HTMLElement
): EventDispatcher<SequenceFragmentClickDetail> {
  return (detail: SequenceFragmentClickDetail) => {
    element.dispatchEvent(
      new CustomEvent(EVENT_SEQUENCE_FRAGMENT_CLICK, { ...EVENT_OPTIONS, detail })
    );
  };
}

export function createSequenceViewportChangeDispatcher(
  element: HTMLElement
): (detail: SequenceViewportChangeDetail) => void {
  return (detail: SequenceViewportChangeDetail) => {
    element.dispatchEvent(
      new CustomEvent(EVENT_SEQUENCE_VIEWPORT_CHANGE, { ...EVENT_OPTIONS, detail })
    );
  };
}
