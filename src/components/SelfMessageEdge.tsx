/**
 * Self Message Edge - custom React Flow edge for self-call messages.
 * Renders as a loop that goes out to the right and comes back.
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
  data,
  selected,
}: EdgeProps): React.ReactElement {
  // Cast data to our expected type
  const typedData = data as SelfMessageEdgeData | undefined;
  const { label, messageKind, messageY, selfCallWidth, status = 'normal' } = typedData ?? {};
  const msgY = messageY ?? 0;
  const loopWidth = selfCallWidth ?? 54;

  // Self-call path: start at center-right, go out, loop, come back
  // Simplified loop path
  const loopPath = `
    M 0 ${msgY}
    C ${loopWidth * 0.4} ${msgY},
      ${loopWidth} ${msgY},
      ${loopWidth} ${msgY + 24}
    L ${loopWidth} ${msgY + 48}
    C ${loopWidth} ${msgY + 72},
      ${loopWidth * 0.6} ${msgY + 72},
      0 ${msgY + 72}
    L -4 ${msgY + 72}
  `.trim().replace(/\n/g, ' ');

  const isDashed = messageKind === 'async' || messageKind === 'return';
  const strokeDasharray = isDashed ? '8 4' : undefined;

  // Determine arrow direction
  const markerEnd = messageKind === 'sync'
    ? `url(#self-arrowclosed)`
    : `url(#self-arrow)`;

  // Determine line color based on status
  const getLineColor = () => {
    if (selected) return 'var(--sd-accent)';
    switch (status) {
      case 'success':
        return 'var(--sd-success)';
      case 'warning':
        return 'var(--sd-warning)';
      case 'error':
        return 'var(--sd-error)';
      case 'muted':
        return 'var(--sd-text-muted)';
      default:
        return 'var(--sd-line)';
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
            id="self-arrowclosed"
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
            id="self-arrow"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,12 L12,6" fill="none" stroke={lineColor} strokeWidth="1.5" />
          </marker>
        </defs>
      </svg>

      {/* Self-call loop edge */}
      <BaseEdge
        id={id}
        path={loopPath}
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
              transform: `translate(-50%, -50%) translate(${loopWidth / 2}px, ${msgY + 36}px)`,
              pointerEvents: 'all',
              background: 'var(--sd-surface)',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid var(--sd-border)',
              fontSize: 12,
              color: 'var(--sd-text)',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px var(--sd-shadow)',
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
