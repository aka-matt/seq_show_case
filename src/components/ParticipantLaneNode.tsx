/**
 * Participant Lane Node - custom React Flow node
 *
 * Renders a participant header (box) at the top and a vertical dashed lifeline
 * through the centre of the node. Per spec section 5.2, the node dynamically
 * generates one invisible handle per message that touches the participant.
 *
 * Handles sit on the LIFELINE (horizontal centre of the node) at each message's
 * Y so edges connect to the vertical dashed line, not the header box edges.
 */
import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { LayoutParticipant } from '../layout/layout-types';
import type { ParticipantHandle } from '../react-flow/createNodes';

const PARTICIPANT_HEADER_HEIGHT = 68;
const HANDLE_SIZE = 8;

/**
 * Shared invisible styling for all dynamic handles.
 * React Flow's Position.Left/Right classes set `left:0`/`right:0` and a
 * translate — we must zero those out so the lifeline-centre left/top wins.
 */
const HANDLE_BASE_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  minWidth: HANDLE_SIZE,
  minHeight: HANDLE_SIZE,
  opacity: 0,
  // Absolute so we can place each handle on the lifeline at its message Y.
  position: 'absolute',
  // Kill RF Position.Left/Right edge anchors + default translate.
  transform: 'none',
  right: 'auto',
  bottom: 'auto',
  margin: 0,
};

export interface ParticipantLaneNodeData {
  [key: string]: unknown;
  participant: LayoutParticipant;
  /** Handles for every message that touches this participant, pre-computed by createNodes. */
  handles: ParticipantHandle[];
  /** Total canvas height — used to size the node and extend the lifeline. */
  totalHeight: number;
}

function ParticipantLaneNodeComponent({
  data,
}: NodeProps): React.ReactElement {
  const typedData = data as ParticipantLaneNodeData;
  const { participant, handles, totalHeight } = typedData;
  const width = participant.width;
  const height = Math.max(totalHeight, PARTICIPANT_HEADER_HEIGHT);

  // Lifeline is the vertical centre of the node.
  const lifelineX = width / 2;
  const lifelineTop = PARTICIPANT_HEADER_HEIGHT;
  const lifelineHeight = Math.max(height - lifelineTop, 0);

  return (
    // Explicit size so React Flow's measurement / fitView includes the full lane,
    // not just the 68px header box.
    <div
      style={{
        width,
        height,
        position: 'relative',
      }}
    >
      {/* Per-message handles pinned to the lifeline centre. */}
      {handles.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type={h.type}
          // Position prop still required by RF for edge direction hints, but the
          // visual/measured anchor is forced to the lifeline via left/top.
          position={h.side === 'left' ? Position.Left : Position.Right}
          style={{
            ...HANDLE_BASE_STYLE,
            top: h.y - HANDLE_SIZE / 2,
            left: lifelineX - HANDLE_SIZE / 2,
          }}
        />
      ))}

      {/* Participant header box */}
      <div
        style={{
          width,
          height: PARTICIPANT_HEADER_HEIGHT,
          background: 'var(--sd-surface, #ffffff)',
          border: '2px solid var(--sd-border, #e5e7eb)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px var(--sd-shadow, rgba(0,0,0,0.1))',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--sd-text, #111827)',
            textAlign: 'center',
            lineHeight: 1.3,
            padding: '0 8px',
          }}
        >
          {participant.label}
        </div>
        {participant.index !== undefined && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--sd-text-muted, #6b7280)',
              marginTop: 2,
            }}
          >
            #{participant.index + 1}
          </div>
        )}
      </div>

      {/* Vertical dashed lifeline down the centre */}
      <div
        style={{
          position: 'absolute',
          top: lifelineTop,
          left: lifelineX - 1,
          width: 2,
          height: lifelineHeight,
          borderLeft: `2px dashed var(--sd-border, #d1d5db)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export const ParticipantLaneNode = memo(ParticipantLaneNodeComponent);
