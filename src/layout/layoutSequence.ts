/**
 * Main layout engine: Stage B - calculates geometry from flattened rows.
 * All functions are React-independent — pure TypeScript only.
 */

import type { NormalizedData } from "../model/normalized-types";
import type {
  LayoutResult,
  LayoutParticipant,
  LayoutMessage,
  LayoutNote,
  LayoutDivider,
  LayoutRow,
} from "./layout-types";
import { DEFAULT_LAYOUT } from "./tokens";
import { flattenEvents } from "./flattenEvents";
import { calculateActivations } from "./activationLayout";
import { calculateFragmentLayout } from "./fragmentLayout";
import { estimateNoteDimensions } from "./textMeasurement";

// ---------------------------------------------------------------------------
// Main layout function
// ---------------------------------------------------------------------------

/**
 * Pure function that computes the complete layout for a sequence diagram.
 * Takes normalized data and returns all layout information.
 */
export function layoutSequence(normalizedData: NormalizedData): LayoutResult {
  // Stage A: Flatten events to rows
  const rows = flattenEvents(normalizedData.events);

  // Calculate participant positions
  const participants = calculateParticipantPositions(normalizedData);

  // Calculate row Y positions
  const rowYPositions = calculateRowYPositions(rows);

  // Stage B: Calculate message/divider positions
  const { messages, notes, dividers } = calculateMessagesAndNotes(
    normalizedData,
    rows,
    rowYPositions,
    participants
  );

  // Calculate activation rectangles
  const activations = calculateActivations(
    normalizedData,
    participants,
    rowYPositions,
    DEFAULT_LAYOUT.rowHeight
  );

  // Calculate fragment/branch rectangles
  const { fragments, branches } = calculateFragmentLayout(
    normalizedData,
    participants,
    rows,
    rowYPositions
  );

  // Calculate overall bounds
  const bounds = calculateBounds(participants, rowYPositions, rows);

  // Build lookup maps
  const participantMap = new Map<string, LayoutParticipant>();
  for (const p of participants) {
    participantMap.set(p.id, p);
  }

  const eventRowMap = new Map<string, number>();
  for (const [eventId, info] of normalizedData.eventIndex) {
    eventRowMap.set(eventId, info.row);
  }

  return {
    participants,
    messages,
    notes,
    activations,
    fragments,
    branches,
    dividers,
    rows,
    bounds,
    rowYPositions,
    participantMap,
    eventRowMap,
  };
}

// ---------------------------------------------------------------------------
// Participant positioning
// ---------------------------------------------------------------------------

function calculateParticipantPositions(normalizedData: NormalizedData): LayoutParticipant[] {
  const participants: LayoutParticipant[] = [];
  const { canvasPaddingX, participantWidth, participantGap, participantHeaderHeight } = DEFAULT_LAYOUT;

  for (let i = 0; i < normalizedData.participants.length; i++) {
    const participant = normalizedData.participants[i];
    if (!participant) continue;
    const x = canvasPaddingX + i * (participantWidth + participantGap);

    participants.push({
      id: participant.id,
      label: participant.label,
      x,
      y: 0, // Participants are at the top
      width: participantWidth,
      height: participantHeaderHeight,
      index: i,
    });
  }

  return participants;
}

// ---------------------------------------------------------------------------
// Row Y positions
// ---------------------------------------------------------------------------

function calculateRowYPositions(rows: LayoutRow[]): number[] {
  const rowYPositions: number[] = [];
  let currentY = DEFAULT_LAYOUT.firstEventOffset;

  for (let i = 0; i < rows.length; i++) {
    rowYPositions.push(currentY);
    currentY += rows[i]!.estimatedHeight + DEFAULT_LAYOUT.rowGap;
  }

  return rowYPositions;
}

// ---------------------------------------------------------------------------
// Messages and notes
// ---------------------------------------------------------------------------

function calculateMessagesAndNotes(
  normalizedData: NormalizedData,
  rows: LayoutRow[],
  rowYPositions: number[],
  participants: LayoutParticipant[]
): { messages: LayoutMessage[]; notes: LayoutNote[]; dividers: LayoutDivider[] } {
  const messages: LayoutMessage[] = [];
  const notes: LayoutNote[] = [];
  const dividers: LayoutDivider[] = [];

  // Build participant ID → LayoutParticipant map
  const participantMap = new Map<string, LayoutParticipant>();
  for (const p of participants) {
    participantMap.set(p.id, p);
  }

  // Build event ID → row index map
  const eventRowMap = new Map<string, number>();
  for (const [eventId, info] of normalizedData.eventIndex) {
    eventRowMap.set(eventId, info.row);
  }

  // Process each event
  for (const event of normalizedData.events) {
    if (event.type === "message") {
      const fromParticipant = participantMap.get(event.from);
      const toParticipant = participantMap.get(event.to);

      if (!fromParticipant || !toParticipant) continue;

      const rowIndex = eventRowMap.get(event.id);
      if (rowIndex === undefined) continue;

      const y = rowYPositions[rowIndex] ?? 0;
      const row = rows[rowIndex];

      // Calculate message endpoints
      let fromX: number;
      let toX: number;

      if (event.isSelfCall) {
        // Self-call: from and to are the same participant
        // Message starts from right side and loops back
        fromX = fromParticipant.x + fromParticipant.width;
        toX = fromX + DEFAULT_LAYOUT.selfMessageWidth;
      } else {
        // Normal message between two different participants
        fromX = fromParticipant.x + fromParticipant.width;
        toX = toParticipant.x;
      }

      const msg: LayoutMessage = {
        eventId: event.id,
        fromParticipantId: event.from,
        toParticipantId: event.to,
        fromX,
        toX,
        y: y + (row?.estimatedHeight ?? DEFAULT_LAYOUT.rowHeight) / 2,
        label: event.label,
        messageKind: event.messageKind,
        isSelfCall: event.isSelfCall,
        selfCallWidth: event.isSelfCall ? DEFAULT_LAYOUT.selfMessageWidth : 0,
        estimatedWidth: event.estimatedWidth,
        ...(event.status !== undefined && { status: event.status }),
      };
      messages.push(msg);
    } else if (event.type === "note") {
      const rowIndex = eventRowMap.get(event.id);
      if (rowIndex === undefined) continue;

      const y = rowYPositions[rowIndex] ?? 0;

      // Calculate note position based on placement
      const overParticipants = event.over
        .map((pid) => participantMap.get(pid))
        .filter((p): p is LayoutParticipant => p !== undefined);

      if (overParticipants.length === 0) continue;

      // Note position is centered over the first participant in the list
      const targetParticipant = overParticipants[0];
      if (!targetParticipant) continue;

      const noteMaxWidth = 200;
      const { width, height } = estimateNoteDimensions(event.text, noteMaxWidth);

      let x: number;
      switch (event.placement) {
        case "left":
          x = targetParticipant.x - width - 8;
          break;
        case "right":
          x = targetParticipant.x + targetParticipant.width + 8;
          break;
        case "center":
        default:
          x = targetParticipant.x + (targetParticipant.width - width) / 2;
          break;
      }

      const note: LayoutNote = {
        eventId: event.id,
        text: event.text,
        placement: event.placement,
        x,
        y: y + 4,
        width,
        height,
        tone: event.tone ?? "info",
        overParticipantIds: event.over,
      };
      notes.push(note);
    } else if (event.type === "divider") {
      const rowIndex = eventRowMap.get(event.id);
      if (rowIndex === undefined) continue;

      const y = rowYPositions[rowIndex] ?? 0;

      // Divider spans all participants
      const firstParticipant = participants[0];
      const lastParticipant = participants[participants.length - 1];

      if (!firstParticipant || !lastParticipant) continue;

      const divider: LayoutDivider = {
        eventId: event.id,
        y: y + 16,
        x: firstParticipant.x,
        width: lastParticipant.x + lastParticipant.width - firstParticipant.x,
        ...(event.label !== undefined && { label: event.label }),
      };
      dividers.push(divider);
    }
  }

  return { messages, notes, dividers };
}

// ---------------------------------------------------------------------------
// Bounds calculation
// ---------------------------------------------------------------------------

function calculateBounds(
  participants: LayoutParticipant[],
  rowYPositions: number[],
  rows: LayoutRow[]
): { x: number; y: number; width: number; height: number } {
  const { canvasPaddingX, canvasPaddingBottom, participantHeaderHeight } = DEFAULT_LAYOUT;

  if (participants.length === 0 || rowYPositions.length === 0) {
    return {
      x: 0,
      y: 0,
      width: canvasPaddingX * 2 + DEFAULT_LAYOUT.participantWidth,
      height: participantHeaderHeight + canvasPaddingBottom,
    };
  }

  // Calculate width: from first participant to last participant + padding
  const firstParticipant = participants[0];
  const lastParticipant = participants[participants.length - 1];

  if (!firstParticipant || !lastParticipant) {
    return {
      x: 0,
      y: 0,
      width: canvasPaddingX * 2 + DEFAULT_LAYOUT.participantWidth,
      height: participantHeaderHeight + canvasPaddingBottom,
    };
  }

  const width =
    lastParticipant.x +
    lastParticipant.width +
    canvasPaddingX -
    firstParticipant.x;

  // Calculate height: from top to last row + bottom padding
  const lastRowY = rowYPositions[rowYPositions.length - 1] ?? 0;
  const lastRow = rows[rows.length - 1];
  const lastRowHeight = lastRow?.estimatedHeight ?? DEFAULT_LAYOUT.rowHeight;

  const height = lastRowY + lastRowHeight + canvasPaddingBottom;

  return {
    x: 0,
    y: 0,
    width,
    height,
  };
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

/**
 * Calculates just the participant X positions (useful for testing).
 */
export function calculateParticipantXPositions(
  participantCount: number
): number[] {
  const positions: number[] = [];
  const { canvasPaddingX, participantWidth, participantGap } = DEFAULT_LAYOUT;

  for (let i = 0; i < participantCount; i++) {
    positions.push(canvasPaddingX + i * (participantWidth + participantGap));
  }

  return positions;
}

/**
 * Calculates the total canvas width for a given number of participants.
 */
export function calculateCanvasWidth(participantCount: number): number {
  const { canvasPaddingX, participantWidth, participantGap } = DEFAULT_LAYOUT;
  return (
    canvasPaddingX * 2 +
    participantCount * participantWidth +
    (participantCount - 1) * participantGap
  );
}
