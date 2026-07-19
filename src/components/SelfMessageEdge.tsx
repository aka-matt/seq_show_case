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
}

function SelfMessageEdgeComponent({
  id,
  data,
  selected,
}: EdgeProps): React.ReactElement {
  // Cast data to our expected type
  const typedData = data as SelfMessageEdgeData | undefined;
  const { label, messageKind, messageY, selfCallWidth } = typedData ?? {};
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
            <path d="M0,0 L0,12 L12,6 z" fill="#374151" />
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
            <path d="M0,0 L0,12 L12,6" fill="none" stroke="#374151" strokeWidth="1.5" />
          </marker>
        </defs>
      </svg>

      {/* Self-call loop edge */}
      <BaseEdge
        id={id}
        path={loopPath}
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
              transform: `translate(-50%, -50%) translate(${loopWidth / 2}px, ${msgY + 36}px)`,
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

export const SelfMessageEdge = memo(SelfMessageEdgeComponent);
