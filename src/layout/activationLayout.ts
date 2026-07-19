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

  // Activate/deactivate markers are invisible. Anchor them to the nearest
  // visible message/event so bars connect actual diagram events.
  const markerAnchors = calculateMarkerAnchors(normalizedData.events, rowByEventId);

  for (const pair of normalizedData.activationPairs) {
    const participant = participantMap.get(pair.participant);
    if (!participant) continue;

    // Find row indices for activate and deactivate
    const activateRow = markerAnchors.get(pair.activateId);
    const deactivateRow = markerAnchors.get(pair.deactivateId);
    if (activateRow === undefined || deactivateRow === undefined) continue;

    const y = rowCenter(activateRow, rows, rowYPositions);
    const deactivateY = rowCenter(deactivateRow, rows, rowYPositions);
    const height = Math.max(2, deactivateY - y);

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
    if (activateRow === undefined) continue;
    const y = rowCenter(activateRow, rows, rowYPositions);

    // Extend to the last row
    const lastRow = Math.max(0, rows.length - 1);
    const lastY = rowCenter(lastRow, rows, rowYPositions);
    const height = Math.max(2, lastY - y);

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

function calculateMarkerAnchors(
  events: NormalizedData['events'],
  rowByEventId: Map<string, number>
): Map<string, number> {
  const ordered: string[] = [];
  const walk = (items: NormalizedData['events']): void => {
    for (const event of items) {
      ordered.push(event.id);
      if (event.type === 'fragment') {
        for (const branch of event.branches) walk(branch.events);
      }
    }
  };
  walk(events);

  const anchors = new Map<string, number>();
  for (let index = 0; index < ordered.length; index++) {
    const id = ordered[index]!;
    if (rowByEventId.has(id)) continue;
    let anchor: number | undefined;
    for (let before = index - 1; before >= 0 && anchor === undefined; before--) {
      anchor = rowByEventId.get(ordered[before]!);
    }
    for (let after = index + 1; after < ordered.length && anchor === undefined; after++) {
      anchor = rowByEventId.get(ordered[after]!);
    }
    if (anchor !== undefined) anchors.set(id, anchor);
  }
  return anchors;
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
