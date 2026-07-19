/**
 * Normalizer: fills defaults, builds indices, matches activate/deactivate pairs.
 * All operations are pure TypeScript — no React dependencies.
 */

import type {
  SequenceDiagramData,
  SequenceEvent,
  MessageEvent,
  NoteEvent,
  FragmentEvent,
} from "./public-types";

import type {
  NormalizedData,
  NormalizedParticipant,
  NormalizedSequenceEvent,
  NormalizedMessageEvent,
  NormalizedNoteEvent,
  NormalizedFragmentEvent,
  NormalizedFragmentBranch,
  NormalizedActivateEvent,
  NormalizedDeactivateEvent,
  ActivationPair,
  SelfCallInfo,
  EventRowInfo,
} from "./normalized-types";

import type { SequenceDiagramWarning } from "./validation-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MESSAGE_LABEL_MAX_WIDTH = 200;
const AVG_CHAR_WIDTH = 8; // average character width in pixels

// ---------------------------------------------------------------------------
// Main normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes raw SequenceDiagramData:
 * - Fills defaults for optional fields
 * - Builds participant and event indices
 * - Matches activate/deactivate pairs
 * - Infers fragment participants
 * - Detects self-calls
 */
export function normalize(data: SequenceDiagramData): NormalizedData {
  // Build participant index
  const participants: NormalizedParticipant[] = data.participants.map((p, i) => ({
    ...p,
    index: i,
  }));
  const participantIndex = new Map<string, number>();
  for (const p of participants) {
    participantIndex.set(p.id, p.index);
  }

  // Normalize events (fills defaults, builds indices, matches activations)
  const { events, eventIndex, activationPairs, selfCalls, unclosedActivations } =
    normalizeEvents(data.events, participantIndex);

  const normalizedOptions: NormalizedData["options"] = data.options
    ? {
        ...(data.options.showSequenceNumbers !== undefined && { showSequenceNumbers: data.options.showSequenceNumbers }),
        ...(data.options.showParticipantIcons !== undefined && { showParticipantIcons: data.options.showParticipantIcons }),
        ...(data.options.messageLabelMaxWidth !== undefined && { messageLabelMaxWidth: data.options.messageLabelMaxWidth }),
        ...(data.options.participantWidth !== undefined && { participantWidth: data.options.participantWidth }),
        ...(data.options.participantGap !== undefined && { participantGap: data.options.participantGap }),
        ...(data.options.rowGap !== undefined && { rowGap: data.options.rowGap }),
      }
    : undefined;

  const result: NormalizedData = {
    schemaVersion: data.schemaVersion,
    participants,
    events,
    participantIndex,
    eventIndex,
    activationPairs,
    selfCalls,
    unclosedActivations,
  };

  if (data.id !== undefined) result.id = data.id;
  if (data.title !== undefined) result.title = data.title;
  if (data.description !== undefined) result.description = data.description;
  if (normalizedOptions !== undefined) result.options = normalizedOptions;

  return result;
}

// ---------------------------------------------------------------------------
// Event normalization
// ---------------------------------------------------------------------------

interface NormalizeEventsResult {
  events: NormalizedSequenceEvent[];
  eventIndex: Map<string, EventRowInfo>;
  activationPairs: ActivationPair[];
  selfCalls: SelfCallInfo[];
  unclosedActivations: string[];
  eventWarnings: SequenceDiagramWarning[];
}

function normalizeEvents(
  events: SequenceEvent[],
  participantIndex: Map<string, number>,
  depth = 0,
  parentFragmentId?: string,
  parentBranchId?: string
): NormalizeEventsResult {
  const result: NormalizeEventsResult = {
    events: [],
    eventIndex: new Map(),
    activationPairs: [],
    selfCalls: [],
    unclosedActivations: [],
    eventWarnings: [],
  };

  // Per-participant activation stacks for pairing
  const activationStacks: Map<string, { id: string; visibleRow: number; depth: number }[]> = new Map();

  let eventRow = 0;
  let visibleRow = 0;

  for (const event of events) {
    // Build event index entry (uses eventRow for all events)
    const eventRowInfo: EventRowInfo = {
      row: eventRow,
      depth,
      ...(parentFragmentId !== undefined && { parentFragmentId }),
      ...(parentBranchId !== undefined && { parentBranchId }),
    };

    switch (event.type) {
      case "message": {
        const normalized = normalizeMessageEvent(event, participantIndex);
        result.events.push(normalized);
        result.eventIndex.set(event.id, eventRowInfo);

        // Detect self-call (uses visibleRow)
        if (event.from === event.to) {
          result.selfCalls.push({
            eventId: event.id,
            participant: event.from,
            row: visibleRow,
          });
        }
        visibleRow++;
        break;
      }

      case "note": {
        const normalized = normalizeNoteEvent(event);
        result.events.push(normalized);
        result.eventIndex.set(event.id, eventRowInfo);
        visibleRow++;
        break;
      }

      case "activate": {
        const normalized: NormalizedActivateEvent = {
          id: event.id,
          type: "activate",
          participant: event.participant,
          depth,
        };
        result.events.push(normalized);
        result.eventIndex.set(event.id, eventRowInfo);

        // Push onto activation stack (uses visibleRow)
        const stack = activationStacks.get(event.participant) ?? [];
        stack.push({ id: event.id, visibleRow, depth });
        activationStacks.set(event.participant, stack);
        break;
      }

      case "deactivate": {
        const normalized: NormalizedDeactivateEvent = {
          id: event.id,
          type: "deactivate",
          participant: event.participant,
          depth,
        };
        result.events.push(normalized);
        result.eventIndex.set(event.id, eventRowInfo);

        // Match with activate (uses visibleRow)
        const stack = activationStacks.get(event.participant) ?? [];
        const activate = stack[stack.length - 1];
        if (stack.length > 0 && activate && activate.depth === depth) {
          result.activationPairs.push({
            activateId: activate.id,
            deactivateId: event.id,
            participant: event.participant,
            activateRow: activate.visibleRow,
            deactivateRow: visibleRow,
          });
          stack.pop();
          if (stack.length === 0) {
            activationStacks.delete(event.participant);
          } else {
            activationStacks.set(event.participant, stack);
          }
        }
        break;
      }

      case "divider": {
        const normalized: NormalizedSequenceEvent = {
          id: event.id,
          type: "divider",
          ...(event.label !== undefined && { label: event.label }),
        };
        result.events.push(normalized);
        result.eventIndex.set(event.id, eventRowInfo);
        visibleRow++;
        break;
      }

      case "fragment": {
        const normalized = normalizeFragmentEvent(event, participantIndex, depth);
        result.events.push(normalized);
        result.eventIndex.set(event.id, eventRowInfo);

        // Process branches recursively
        for (const branch of event.branches) {
          const branchResult = normalizeEvents(
            branch.events,
            participantIndex,
            depth + 1,
            event.id,
            branch.id
          );

          // Merge branch results
          for (const ev of branchResult.events) {
            result.events.push(ev);
          }
          for (const [evId, info] of branchResult.eventIndex) {
            result.eventIndex.set(evId, info);
          }
          result.activationPairs.push(...branchResult.activationPairs);
          result.selfCalls.push(...branchResult.selfCalls);
          result.eventWarnings.push(...branchResult.eventWarnings);
        }

        // Fragment itself doesn't increment visibleRow (it's a container)
        break;
      }
    }

    eventRow++;
  }

  // Track unclosed activations
  for (const [, stack] of activationStacks) {
    for (const activate of stack) {
      result.unclosedActivations.push(activate.id);
      result.eventWarnings.push({
        code: "UNCLOSED_ACTIVATION",
        message: `Activation '${activate.id}' for participant has no matching deactivation`,
        path: `/events/${activate.id}`,
        details: { activateId: activate.id },
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Event-specific normalization
// ---------------------------------------------------------------------------

function normalizeMessageEvent(
  event: MessageEvent,
  _participantIndex: Map<string, number>
): NormalizedMessageEvent {
  // Estimate width based on label length + arrow
  const labelWidth = event.label.length * AVG_CHAR_WIDTH;
  const arrowWidth = 40; // arrow head space
  const estimatedWidth = Math.min(labelWidth + arrowWidth, DEFAULT_MESSAGE_LABEL_MAX_WIDTH + arrowWidth);

  return {
    id: event.id,
    type: "message",
    from: event.from,
    to: event.to,
    label: event.label,
    messageKind: event.messageKind ?? "sync",
    isSelfCall: event.from === event.to,
    estimatedWidth,
    ...(event.number !== undefined && { number: event.number }),
    ...(event.status !== undefined && { status: event.status }),
    ...(event.tooltip !== undefined && { tooltip: event.tooltip }),
    ...(event.metadata !== undefined && { metadata: event.metadata }),
  };
}

function normalizeNoteEvent(event: NoteEvent): NormalizedNoteEvent {
  // Estimate line count based on text length
  const maxWidth = DEFAULT_MESSAGE_LABEL_MAX_WIDTH;
  const charsPerLine = Math.floor(maxWidth / AVG_CHAR_WIDTH);
  const lineCount = Math.ceil(event.text.length / charsPerLine);

  return {
    id: event.id,
    type: "note",
    text: event.text,
    over: event.over,
    placement: event.placement ?? "right",
    estimatedLineCount: Math.max(1, lineCount),
    ...(event.tone !== undefined && { tone: event.tone }),
  };
}

function normalizeFragmentEvent(
  event: FragmentEvent,
  participantIndex: Map<string, number>,
  _depth: number
): NormalizedFragmentEvent {
  // Infer participants if not provided
  const participants = event.participants ?? inferFragmentParticipants(event, participantIndex);

  const branches: NormalizedFragmentBranch[] = event.branches.map((branch) => ({
    id: branch.id,
    ...(branch.label !== undefined && { label: branch.label }),
    events: [], // Events are processed in normalizeEvents
  }));

  return {
    id: event.id,
    type: "fragment",
    fragmentKind: event.fragmentKind,
    ...(event.label !== undefined && { label: event.label }),
    participants,
    branches,
  };
}

// ---------------------------------------------------------------------------
// Fragment participant inference
// ---------------------------------------------------------------------------

/**
 * Infers which participants are involved in a fragment by collecting
 * all participant references from its events.
 */
function inferFragmentParticipants(
  fragment: FragmentEvent,
  participantIndex: Map<string, number>
): string[] {
  const participantSet = new Set<string>();

  function collectFromEvents(events: SequenceEvent[]): void {
    for (const ev of events) {
      if (ev.type === "message") {
        participantSet.add(ev.from);
        participantSet.add(ev.to);
      } else if (ev.type === "note") {
        for (const pid of ev.over) {
          participantSet.add(pid);
        }
      } else if (ev.type === "activate" || ev.type === "deactivate") {
        participantSet.add(ev.participant);
      } else if (ev.type === "fragment") {
        for (const branch of ev.branches) {
          collectFromEvents(branch.events);
        }
      }
    }
  }

  for (const branch of fragment.branches) {
    collectFromEvents(branch.events);
  }

  // Return in order they appear in participant index
  const result: string[] = [];
  for (const [pid] of participantIndex) {
    if (participantSet.has(pid)) {
      result.push(pid);
    }
  }

  return result;
}
