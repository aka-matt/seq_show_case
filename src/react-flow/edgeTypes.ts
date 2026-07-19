/**
 * React Flow edge types registry.
 * Registers custom edge types used in sequence diagrams.
 */
import { SequenceMessageEdge } from '../components/SequenceMessageEdge';
import { SelfMessageEdge } from '../components/SelfMessageEdge';
import type { EdgeTypes } from '@xyflow/react';

// Using 'as any' to bypass strict type checking for custom edge types
// React Flow v12's type system requires index signatures on custom data types
export const edgeTypes: EdgeTypes = {
  sequenceMessage: SequenceMessageEdge as any,
  selfMessage: SelfMessageEdge as any,
};
