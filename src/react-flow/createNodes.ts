/**
 * Creates React Flow nodes from LayoutResult.
 * Each participant becomes a ParticipantLaneNode positioned at their computed X.
 *
 * Per spec section 5.2: every lane node generates one handle per message
 * touching that participant, with a stable ID (msg:<id>:left/right or
 * self:<id>:out/in), positioned at the message's Y. The handle is a
 * source/target pair so the edge can attach to either side depending on
 * whether the message travels left-to-right or right-to-left.
 */
import type { Node } from '@xyflow/react';
import type { LayoutResult, LayoutMessage, LayoutParticipant } from '../layout/layout-types';
import type { ParticipantLaneNodeData } from '../components/ParticipantLaneNode';

/**
 * A single dynamic handle for a participant lane.
 * Computed once during node creation; rendered absolutely-positioned by
 * ParticipantLaneNode at the message's Y.
 */
export interface ParticipantHandle {
  /** Stable handle ID, e.g. `msg:m1:right` or `self:m1:out`. */
  id: string;
  /** React Flow handle type. */
  type: 'source' | 'target';
  /** Which edge of the node the handle sits on. */
  side: 'left' | 'right';
  /** Absolute Y position in canvas coordinates. */
  y: number;
}

/**
 * Build the per-participant handle list from the global message list.
 *
 * For a normal (left-to-right) message m: P1 → P2
 *   - P1 gets a source handle `msg:m:right` (right side)
 *   - P2 gets a target handle `msg:m:left`  (left side)
 *
 * For a reversed (right-to-left) message m: P2 → P1 (where P1 sits left of P2)
 *   - P2 gets a source handle `msg:m:left`  (left side, arrow leaves going left)
 *   - P1 gets a target handle `msg:m:right` (right side, arrow arrives from right)
 *
 * For a self-call m on P:
 *   - P gets both `self:m:out` (source, right) and `self:m:in` (target, left)
 */
function computeHandlesForParticipant(
  participantId: string,
  messages: LayoutMessage[],
  participantXMap: Map<string, number>
): ParticipantHandle[] {
  const handles: ParticipantHandle[] = [];

  for (const m of messages) {
    if (m.fromParticipantId !== participantId && m.toParticipantId !== participantId) {
      continue;
    }

    if (m.isSelfCall) {
      handles.push({ id: `self:${m.eventId}:out`, type: 'source', side: 'right', y: m.y });
      handles.push({ id: `self:${m.eventId}:in`, type: 'target', side: 'left', y: m.y });
      continue;
    }

    const fromX = participantXMap.get(m.fromParticipantId) ?? 0;
    const toX = participantXMap.get(m.toParticipantId) ?? 0;
    const isReversed = toX < fromX;

    if (m.fromParticipantId === participantId) {
      // Sender. Arrow leaves from the side facing the recipient.
      handles.push({
        id: `msg:${m.eventId}:${isReversed ? 'left' : 'right'}`,
        type: 'source',
        side: isReversed ? 'left' : 'right',
        y: m.y,
      });
    } else {
      // Recipient. Arrow arrives on the side facing the sender.
      handles.push({
        id: `msg:${m.eventId}:${isReversed ? 'right' : 'left'}`,
        type: 'target',
        side: isReversed ? 'right' : 'left',
        y: m.y,
      });
    }
  }

  return handles;
}

/**
 * Converts a LayoutResult into an array of React Flow nodes.
 * Each participant is rendered as a ParticipantLaneNode with one handle per
 * message touching that participant (spec 5.2).
 */
export function createNodes(layoutResult: LayoutResult): Node<ParticipantLaneNodeData>[] {
  const { participants, messages, bounds } = layoutResult;

  // X position map (center of each participant) — used to detect reversed messages.
  const participantXMap = new Map<string, number>();
  for (const p of participants) {
    participantXMap.set(p.id, p.x + p.width / 2);
  }

  const totalHeight = Math.max(bounds.height, 1);

  const nodes: Node<ParticipantLaneNodeData>[] = participants.map(
    (participant: LayoutParticipant) => {
      const handles = computeHandlesForParticipant(participant.id, messages, participantXMap);

      const nodeData: ParticipantLaneNodeData = {
        participant,
        handles,
        totalHeight,
        showParticipantIcons: layoutResult.showParticipantIcons,
      };

      return {
        id: `participant-${participant.id}`,
        type: 'participantLane',
        position: { x: participant.x, y: participant.y },
        // Explicit size so RF measurement / fitView covers the full lane
        // (header + lifeline), not just the 68px header box.
        width: participant.width,
        height: totalHeight,
        style: { width: participant.width, height: totalHeight },
        data: nodeData,
        draggable: false,
      };
    }
  );

  return nodes;
}
