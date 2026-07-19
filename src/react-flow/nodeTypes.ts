/**
 * React Flow node types registry.
 * Registers custom node types used in sequence diagrams.
 */
import { ParticipantLaneNode } from '../components/ParticipantLaneNode';
import type { NodeTypes } from '@xyflow/react';

// Using 'as any' to bypass strict type checking for custom node types
// React Flow v12's type system requires index signatures on custom data types
export const nodeTypes: NodeTypes = {
  participantLane: ParticipantLaneNode as any,
};
