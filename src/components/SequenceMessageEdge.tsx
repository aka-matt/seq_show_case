/**
 * Sequence Message Edge - custom React Flow edge for messages between participants.
 * Supports sync (solid line, filled arrow), async (dashed line, open arrow),
 * and return (dashed line, open arrow going back) message kinds.
 */
import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

export interface SequenceMessageEdgeData {
  [key: string]: unknown;
  label: string;
  messageKind: 'sync' | 'async' | 'return';
  arrowHeadType: 'arrowclosed' | 'arrow';
  messageY: number;
}

function SequenceMessageEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps): React.ReactElement {
  // Cast data to our expected type
  const typedData = data as SequenceMessageEdgeData | undefined;
  const { label, messageKind, arrowHeadType, messageY } = typedData ?? {};
  const msgY = messageY ?? sourceY;

  // Calculate bezier path
  const [edgePath, labelX] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine line style based on message kind
  const isDashed = messageKind === 'async' || messageKind === 'return';
  const strokeDasharray = isDashed ? '8 4' : undefined;

  // Arrow head style
  const markerEnd = arrowHeadType === 'arrowclosed'
    ? `url(#arrowclosed-${messageKind})`
    : `url(#arrow-${messageKind})`;

  return (
    <>
      {/* SVG markers definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id={`arrowclosed-sync`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,12 L12,6 z" fill="#374151" />
          </marker>
          <marker
            id={`arrow-sync`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,12 L12,6" fill="none" stroke="#374151" strokeWidth="1.5" />
          </marker>
          <marker
            id={`arrowclosed-async`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,12 L12,6 z" fill="none" stroke="#374151" strokeWidth="1.5" />
          </marker>
          <marker
            id={`arrow-async`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,12 L12,6" fill="none" stroke="#374151" strokeWidth="1.5" />
          </marker>
          <marker
            id={`arrowclosed-return`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,12 L12,6 z" fill="none" stroke="#374151" strokeWidth="1.5" />
          </marker>
          <marker
            id={`arrow-return`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,12 L12,6" fill="none" stroke="#374151" strokeWidth="1.5" />
          </marker>
        </defs>
      </svg>

      {/* The edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#2563eb' : '#374151',
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray,
        }}
        markerEnd={markerEnd}
      />

      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${msgY}px)`,
              pointerEvents: 'all',
              background: '#ffffff',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              fontSize: 12,
              color: '#374151',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const SequenceMessageEdge = memo(SequenceMessageEdgeComponent);
