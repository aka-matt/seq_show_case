/**
 * Activation/deactivation rectangle calculation.
 * All functions are React-independent — pure TypeScript only.
 */

import type { NormalizedData } from "../model/normalized-types";
import type { LayoutActivation, LayoutParticipant } from "./layout-types";
import { DEFAULT_LAYOUT } from "./tokens";

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
  rowHeight: number
): LayoutActivation[] {
  const activations: LayoutActivation[] = [];

  // Build participant ID → LayoutParticipant map
  const participantMap = new Map<string, LayoutParticipant>();
  for (const p of participants) {
    participantMap.set(p.id, p);
  }

  for (const pair of normalizedData.activationPairs) {
    const participant = participantMap.get(pair.participant);
    if (!participant) continue;

    // Find row indices for activate and deactivate
    const activateRowInfo = normalizedData.eventIndex.get(pair.activateId);
    const deactivateRowInfo = normalizedData.eventIndex.get(pair.deactivateId);

    if (!activateRowInfo || !deactivateRowInfo) continue;

    const activateRow = activateRowInfo.row;
    const deactivateRow = deactivateRowInfo.row;

    // Clamp row indices to valid range (activate/deactivate may be beyond visible rows)
    const clampedActivateRow = Math.min(activateRow, rowYPositions.length - 1);
    const clampedDeactivateRow = Math.min(deactivateRow, rowYPositions.length - 1);

    // Calculate Y positions
    const y = rowYPositions[clampedActivateRow] ?? 0;
    const deactivateY = rowYPositions[clampedDeactivateRow] ?? 0;
    const height = deactivateY - y + rowHeight;

    // Activation bar appears on the right side of the participant header
    const x = participant.x + participant.width - DEFAULT_LAYOUT.activationWidth - 4;

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
    const activateRowInfo = normalizedData.eventIndex.get(activateId);
    if (!activateRowInfo) continue;

    const activateEvent = normalizedData.events.find((e) => e.id === activateId);
    if (!activateEvent || activateEvent.type !== "activate") continue;

    const participant = participantMap.get(activateEvent.participant);
    if (!participant) continue;

    const activateRow = activateRowInfo.row;
    const y = rowYPositions[activateRow] ?? 0;

    // Extend to the last row
    const lastY = rowYPositions[rowYPositions.length - 1] ?? y;
    const height = lastY - y + rowHeight;

    const x = participant.x + participant.width - DEFAULT_LAYOUT.activationWidth - 4;

    activations.push({
      participantId: activateEvent.participant,
      activateEventId: activateId,
      deactivateEventId: "", // No matching deactivate
      x,
      y,
      width: DEFAULT_LAYOUT.activationWidth,
      height,
    });
  }

  return activations;
}

/**
 * Calculates the X position for an activation bar given a participant's layout info.
 */
export function getActivationX(participant: LayoutParticipant): number {
  return participant.x + participant.width - DEFAULT_LAYOUT.activationWidth - 4;
}
