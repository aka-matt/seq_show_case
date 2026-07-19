/**
 * Creates React Flow nodes from LayoutResult.
 * Each participant becomes a ParticipantLaneNode positioned at their computed X.
 */
import type { Node } from '@xyflow/react';
import type { LayoutResult } from '../layout/layout-types';
import type { ParticipantLaneNodeData } from '../components/ParticipantLaneNode';

/**
 * Converts a LayoutResult into an array of React Flow nodes.
 * Each participant is rendered as a ParticipantLaneNode.
 */
export function createNodes(layoutResult: LayoutResult): Node<ParticipantLaneNodeData>[] {
  const { participants } = layoutResult;

  const nodes: Node<ParticipantLaneNodeData>[] = participants.map((participant, index) => {
    const nodeData: ParticipantLaneNodeData = {
      participant,
      isFirst: index === 0,
      isLast: index === participants.length - 1,
    };

    return {
      id: `participant-${participant.id}`,
      type: 'participantLane',
      position: { x: participant.x, y: participant.y },
      data: nodeData,
      draggable: false,
    };
  });

  return nodes;
}
