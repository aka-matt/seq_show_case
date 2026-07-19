/**
 * Creates React Flow edges from LayoutResult.
 * Each message becomes a SequenceMessageEdge or SelfMessageEdge.
 */
import type { Edge } from '@xyflow/react';
import type { LayoutResult } from '../layout/layout-types';
import type { SequenceMessageEdgeData } from '../components/SequenceMessageEdge';
import type { SelfMessageEdgeData } from '../components/SelfMessageEdge';

/**
 * Converts a LayoutResult into an array of React Flow edges.
 * Regular messages between two participants become SequenceMessageEdge.
 * Self-call messages (from === to) become SelfMessageEdge.
 */
export function createEdges(layoutResult: LayoutResult): Edge[] {
  const { participants, messages } = layoutResult;

  // Build participant ID -> index map for X position lookup
  const participantXMap = new Map<string, number>();
  for (const p of participants) {
    participantXMap.set(p.id, p.x + p.width / 2); // Use center X
  }

  const edges: Edge[] = messages.map((message) => {
    if (message.isSelfCall) {
      // Self-call edge
      const selfMessageData: SelfMessageEdgeData = {
        label: message.label,
        messageKind: message.messageKind,
        messageY: message.y,
        selfCallWidth: message.selfCallWidth,
        ...(message.status !== undefined && { status: message.status }),
      };

      return {
        id: `edge-${message.eventId}`,
        source: `participant-${message.fromParticipantId}`,
        target: `participant-${message.toParticipantId}`,
        type: 'selfMessage',
        data: selfMessageData,
        // Self-call: source and target are same, position handles at edges
        sourceHandle: `self:${message.eventId}:out`,
        targetHandle: `self:${message.eventId}:in`,
      };
    }

    // Regular message edge
    const fromX = participantXMap.get(message.fromParticipantId) ?? 0;
    const toX = participantXMap.get(message.toParticipantId) ?? 0;
    const isReversed = toX < fromX;

    const messageData: SequenceMessageEdgeData = {
      label: message.label,
      messageKind: message.messageKind,
      arrowHeadType: message.messageKind === 'sync' ? 'arrowclosed' : 'arrow',
      messageY: message.y,
      ...(message.status !== undefined && { status: message.status }),
    };

    // Source is always the sender (`from`); target is always the recipient (`to`).
    // The handle side flips when the message travels right-to-left (reversed),
    // because the arrow leaves from the sender's left side and arrives at the
    // recipient's right side in that case.
    return {
      id: `edge-${message.eventId}`,
      source: `participant-${message.fromParticipantId}`,
      target: `participant-${message.toParticipantId}`,
      type: 'sequenceMessage',
      data: messageData,
      sourceHandle: isReversed ? `msg:${message.eventId}:left` : `msg:${message.eventId}:right`,
      targetHandle: isReversed ? `msg:${message.eventId}:right` : `msg:${message.eventId}:left`,
    };
  });

  return edges;
}
