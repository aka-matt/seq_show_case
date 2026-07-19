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
  status?: 'normal' | 'success' | 'warning' | 'error' | 'muted';
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
  const { label, messageKind, arrowHeadType, messageY, status = 'normal' } = typedData ?? {};
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

  // Determine line color based on status
  const getLineColor = () => {
    if (selected) return 'var(--sd-accent, #2563eb)';
    switch (status) {
      case 'success':
        return 'var(--sd-success, #059669)';
      case 'warning':
        return 'var(--sd-warning, #d97706)';
      case 'error':
        return 'var(--sd-error, #dc2626)';
      case 'muted':
        return 'var(--sd-text-muted, #6b7280)';
      default:
        return 'var(--sd-line, #374151)';
    }
  };

  const lineColor = getLineColor();
  const lineWidth = selected ? 2.5 : 2;

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
            <path d="M0,0 L0,12 L12,6 z" fill={lineColor} />
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
            <path d="M0,0 L0,12 L12,6" fill="none" stroke={lineColor} strokeWidth="1.5" />
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
            <path d="M0,0 L0,12 L12,6 z" fill="none" stroke={lineColor} strokeWidth="1.5" />
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
            <path d="M0,0 L0,12 L12,6" fill="none" stroke={lineColor} strokeWidth="1.5" />
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
            <path d="M0,0 L0,12 L12,6 z" fill="none" stroke={lineColor} strokeWidth="1.5" />
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
            <path d="M0,0 L0,12 L12,6" fill="none" stroke={lineColor} strokeWidth="1.5" />
          </marker>
        </defs>
      </svg>

      {/* The edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: lineColor,
          strokeWidth: lineWidth,
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
              background: 'var(--sd-surface, #ffffff)',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid var(--sd-border, #e5e7eb)',
              fontSize: 12,
              color: 'var(--sd-text, #374151)',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px var(--sd-shadow, rgba(0,0,0,0.05))',
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
