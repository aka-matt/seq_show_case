/**
 * Participant Lane Node - custom React Flow node
 *
 * Renders a participant header (box) at the top and a vertical dashed lifeline
 * extending down through the event area. Per spec section 5.2, the node
 * dynamically generates one invisible handle per message that touches the
 * participant, using the stable ID format:
 *
 *   - msg:<messageId>:left    — regular message, this participant's left side
 *   - msg:<messageId>:right   — regular message, this participant's right side
 *   - self:<messageId>:out    — self-call, this participant's right side
 *   - self:<messageId>:in     — self-call, this participant's left side
 *
 * Handles are positioned at the absolute Y of their corresponding message so
 * the arrow leaves/arrives at the correct row regardless of direction.
 */
import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { LayoutParticipant } from '../layout/layout-types';
import type { ParticipantHandle } from '../react-flow/createNodes';

const PARTICIPANT_HEADER_HEIGHT = 68;

/** Shared invisible styling for all dynamic handles. */
const HANDLE_BASE_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
  opacity: 0,
  // Absolute positioning so we can place each handle at its message Y.
  position: 'absolute',
};

export interface ParticipantLaneNodeData {
  [key: string]: unknown;
  participant: LayoutParticipant;
  /** Handles for every message that touches this participant, pre-computed by createNodes. */
  handles: ParticipantHandle[];
  /** Total canvas height — used to extend the lifeline down to the bottom of the diagram. */
  totalHeight: number;
}

function ParticipantLaneNodeComponent({
  data,
}: NodeProps): React.ReactElement {
  // Cast data to our expected type — React Flow passes custom data through.
  const typedData = data as ParticipantLaneNodeData;
  const { participant, handles, totalHeight } = typedData;
  const width = participant.width;

  // The header sits at the top of the node; the lifeline spans from just below
  // the header down to the bottom of the diagram.
  const lifelineTop = PARTICIPANT_HEADER_HEIGHT;
  const lifelineHeight = Math.max(totalHeight - lifelineTop, 0);

  return (
    <>
      {/* Per-message handles, rendered first so they sit behind the header box. */}
      {handles.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type={h.type}
          position={h.side === 'left' ? Position.Left : Position.Right}
          style={{
            ...HANDLE_BASE_STYLE,
            top: h.y,
            ...(h.side === 'left' ? { left: -4 } : { right: -4 }),
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
        }}
      >
        {/* Participant label */}
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

      {/* Vertical dashed lifeline */}
      <div
        style={{
          position: 'absolute',
          top: lifelineTop,
          left: '50%',
          width: 2,
          height: lifelineHeight,
          marginLeft: -1,
          borderLeft: `2px dashed var(--sd-border, #d1d5db)`,
          transform: 'translateX(0)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export const ParticipantLaneNode = memo(ParticipantLaneNodeComponent);
