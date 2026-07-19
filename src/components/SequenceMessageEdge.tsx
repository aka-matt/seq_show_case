/**
 * Sequence Message Edge - custom React Flow edge for messages between participants.
 * Supports sync (solid line, filled arrow), async (dashed line, open arrow),
 * and return (dashed line, open arrow going back) message kinds.
 *
 * Edges are drawn as HORIZONTAL straight lines at the message Y between the
 * two lifeline centres (handle positions). Using a bezier path would bow the
 * line away from the lifeline anchors and look "floating".
 */
import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
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
  data,
  selected,
}: EdgeProps): React.ReactElement {
  const typedData = data as SequenceMessageEdgeData | undefined;
  const { label, messageKind, arrowHeadType, messageY, status = 'normal' } = typedData ?? {};

  // Prefer the layout-computed message Y so the line stays on the event row
  // even if handle measurement drifts by a pixel or two. Fall back to the
  // midpoint of the two handle Ys.
  const msgY = messageY ?? (sourceY + targetY) / 2;

  // Force a perfectly horizontal straight line between the two lifeline centres.
  const [edgePath, labelX] = getStraightPath({
    sourceX,
    sourceY: msgY,
    targetX,
    targetY: msgY,
  });

  const isDashed = messageKind === 'async' || messageKind === 'return';
  const strokeDasharray = isDashed ? '8 4' : undefined;

  // Unique marker ids per edge so concurrent edges with different colours don't clash.
  const markerId = `sd-arrow-${id}`;
  const isClosed = arrowHeadType === 'arrowclosed' || messageKind === 'sync';

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

  // Marker points along the path direction; for left-going edges (targetX < sourceX)
  // orient="auto" still orients the arrow toward the path end.
  const markerEnd = `url(#${markerId})`;

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id={markerId}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            {isClosed ? (
              <path d="M0,0 L0,12 L12,6 z" fill={lineColor} />
            ) : (
              <path d="M0,0 L12,6 L0,12" fill="none" stroke={lineColor} strokeWidth="1.5" />
            )}
          </marker>
        </defs>
      </svg>

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

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px, ${msgY - 4}px)`,
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
