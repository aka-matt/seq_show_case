/**
 * Activation/deactivation rectangle calculation.
 * All functions are React-independent — pure TypeScript only.
 */

import type { NormalizedData } from '../model/normalized-types';
import type { LayoutActivation, LayoutParticipant, LayoutRow } from './layout-types';
import { DEFAULT_LAYOUT } from './tokens';

// ---------------------------------------------------------------------------
// Activation layout
// ---------------------------------------------------------------------------

/**
 * Calculates activation rectangles for all activate/deactivate pairs.
 * An activation is a vertical bar showing when a participant is "active"
 * during a sequence diagram.
 */
export function calculateActivations(
  normalizedData: NormalizedData,
  participants: LayoutParticipant[],
  rowYPositions: number[],
  rows: LayoutRow[]
): LayoutActivation[] {
  const activations: LayoutActivation[] = [];

  // Build participant ID → LayoutParticipant map
  const participantMap = new Map<string, LayoutParticipant>();
  for (const p of participants) {
    participantMap.set(p.id, p);
  }

  const rowByEventId = new Map<string, number>();
  rows.forEach((row, index) => {
    if (row.sourceEventId !== undefined) rowByEventId.set(row.sourceEventId, index);
  });

  // Markers use the preceding message involving their own participant.
  const markerAnchors = calculateParticipantMessageAnchors(normalizedData.events, rowByEventId);
  const lifelineBottom = calculateLifelineBottom(rows, rowYPositions);

  for (const pair of normalizedData.activationPairs) {
    const participant = participantMap.get(pair.participant);
    if (!participant) continue;

    const activateRow = markerAnchors.get(pair.activateId);
    const deactivateRow = markerAnchors.get(pair.deactivateId);
    const y =
      activateRow === undefined
        ? participant.y + participant.height
        : rowCenter(activateRow, rows, rowYPositions);
    const deactivateY =
      deactivateRow === undefined
        ? participant.y + participant.height
        : rowCenter(deactivateRow, rows, rowYPositions);
    const sameMessage = activateRow !== undefined && activateRow === deactivateRow;
    const height = sameMessage
      ? (DEFAULT_LAYOUT.rowHeight + DEFAULT_LAYOUT.rowGap) / 2
      : Math.max(2, deactivateY - y);

    // Activation bar is centred on the lifeline (participant centre).
    const x = participant.x + participant.width / 2 - DEFAULT_LAYOUT.activationWidth / 2;

    activations.push({
      participantId: pair.participant,
      activateEventId: pair.activateId,
      deactivateEventId: pair.deactivateId,
      x,
      y,
      width: DEFAULT_LAYOUT.activationWidth,
      height,
    });
  }

  // Handle unclosed activations (extend to end of diagram)
  for (const activateId of normalizedData.unclosedActivations) {
    const activateEvent = findEvent(normalizedData.events, activateId);
    if (!activateEvent || activateEvent.type !== 'activate') continue;

    const participant = participantMap.get(activateEvent.participant);
    if (!participant) continue;

    const activateRow = markerAnchors.get(activateId);
    const y =
      activateRow === undefined
        ? participant.y + participant.height
        : rowCenter(activateRow, rows, rowYPositions);
    const height = Math.max(2, lifelineBottom - y);

    // Centred on the lifeline (participant centre).
    const x = participant.x + participant.width / 2 - DEFAULT_LAYOUT.activationWidth / 2;

    activations.push({
      participantId: activateEvent.participant,
      activateEventId: activateId,
      deactivateEventId: '', // No matching deactivate
      x,
      y,
      width: DEFAULT_LAYOUT.activationWidth,
      height,
    });
  }

  return activations;
}

function rowCenter(row: number, rows: LayoutRow[], positions: number[]): number {
  return (positions[row] ?? 0) + (rows[row]?.estimatedHeight ?? DEFAULT_LAYOUT.rowHeight) / 2;
}

function calculateParticipantMessageAnchors(
  events: NormalizedData['events'],
  rowByEventId: Map<string, number>
): Map<string, number> {
  const anchors = new Map<string, number>();
  const previousMessageByParticipant = new Map<string, number>();
  const walk = (items: NormalizedData['events']): void => {
    for (const event of items) {
      if (event.type === 'message') {
        const row = rowByEventId.get(event.id);
        if (row !== undefined) {
          previousMessageByParticipant.set(event.from, row);
          previousMessageByParticipant.set(event.to, row);
        }
      } else if (event.type === 'activate' || event.type === 'deactivate') {
        const row = previousMessageByParticipant.get(event.participant);
        if (row !== undefined) anchors.set(event.id, row);
      } else if (event.type === 'fragment') {
        for (const branch of event.branches) walk(branch.events);
      }
    }
  };
  walk(events);
  return anchors;
}

function calculateLifelineBottom(rows: LayoutRow[], positions: number[]): number {
  if (rows.length === 0) {
    return DEFAULT_LAYOUT.participantHeaderHeight + DEFAULT_LAYOUT.canvasPaddingBottom;
  }
  const lastRow = rows.length - 1;
  return (
    (positions[lastRow] ?? DEFAULT_LAYOUT.participantHeaderHeight) +
    (rows[lastRow]?.estimatedHeight ?? DEFAULT_LAYOUT.rowHeight) +
    DEFAULT_LAYOUT.canvasPaddingBottom
  );
}

function findEvent(
  events: NormalizedData['events'],
  id: string
): NormalizedData['events'][number] | undefined {
  for (const event of events) {
    if (event.id === id) return event;
    if (event.type === 'fragment') {
      for (const branch of event.branches) {
        const found = findEvent(branch.events, id);
        if (found) return found;
      }
    }
  }
  return undefined;
}

/**
 * Calculates the X position for an activation bar given a participant's layout info.
 * Centred on the lifeline (participant centre).
 */
export function getActivationX(participant: LayoutParticipant): number {
  return participant.x + participant.width / 2 - DEFAULT_LAYOUT.activationWidth / 2;
}
