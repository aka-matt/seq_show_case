/**
 * Self Message Edge - custom React Flow edge for self-call messages.
 * Renders as a loop that goes out to the right of the lifeline and comes back.
 *
 * Anchors on the source handle (lifeline centre). sourceX/sourceY come from
 * React Flow's handle measurement — after the ParticipantLaneNode fix those
 * are on the vertical dashed line, not the header box edge.
 */
import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react';

export interface SelfMessageEdgeData {
  [key: string]: unknown;
  label: string;
  messageKind: 'sync' | 'async' | 'return';
  messageY: number;
  selfCallWidth: number;
  status?: 'normal' | 'success' | 'warning' | 'error' | 'muted';
}

function SelfMessageEdgeComponent({
  id,
  sourceX,
  sourceY,
  data,
  selected,
}: EdgeProps): React.ReactElement {
  const typedData = data as SelfMessageEdgeData | undefined;
  const { label, messageKind, messageY, selfCallWidth, status = 'normal' } = typedData ?? {};
  const msgY = messageY ?? sourceY;
  const loopWidth = selfCallWidth ?? 54;
  // Anchor at the measured handle (lifeline centre).
  const x0 = sourceX;
  const y0 = msgY;
  const y1 = msgY + 28;

  // Self-call path: leave the lifeline to the right, drop, return.
  const loopPath = [
    `M ${x0} ${y0}`,
    `L ${x0 + loopWidth} ${y0}`,
    `L ${x0 + loopWidth} ${y1}`,
    `L ${x0} ${y1}`,
  ].join(' ');

  const isDashed = messageKind === 'async' || messageKind === 'return';
  const strokeDasharray = isDashed ? '8 4' : undefined;
  const markerId = `self-arrow-${id}`;
  const isClosed = messageKind === 'sync';

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
        path={loopPath}
        style={{
          stroke: lineColor,
          strokeWidth: lineWidth,
          strokeDasharray,
        }}
        markerEnd={`url(#${markerId})`}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(0, -50%) translate(${x0 + loopWidth + 6}px, ${(y0 + y1) / 2}px)`,
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

export const SelfMessageEdge = memo(SelfMessageEdgeComponent);
