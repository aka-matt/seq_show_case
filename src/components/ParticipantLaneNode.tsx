/**
 * Participant Lane Node - custom React Flow node
 * Renders a participant header (box) with a vertical dashed lifeline extending down.
 */
import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { LayoutParticipant } from '../layout/layout-types';

const PARTICIPANT_HEADER_HEIGHT = 68;

export interface ParticipantLaneNodeData {
  [key: string]: unknown;
  participant: LayoutParticipant;
  isFirst: boolean;
  isLast: boolean;
}

function ParticipantLaneNodeComponent({
  data,
}: NodeProps): React.ReactElement {
  // Cast data to our expected type - React Flow passes custom data through
  const typedData = data as {
    participant: LayoutParticipant;
    isFirst: boolean;
    isLast: boolean;
  };
  const { participant, isFirst, isLast } = typedData;
  const width = participant.width;

  return (
    <>
      {/* Left handle for messages going left */}
      {!isFirst && (
        <Handle
          type="target"
          position={Position.Left}
          id={`lane-left-${participant.id}`}
          style={{
            background: 'transparent',
            border: 'none',
            width: 8,
            height: 8,
            top: 'auto',
            left: -4,
            opacity: 0,
          }}
        />
      )}

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
          top: PARTICIPANT_HEADER_HEIGHT,
          left: '50%',
          width: 2,
          height: 800,
          marginLeft: -1,
          borderLeft: `2px dashed var(--sd-border, #d1d5db)`,
          transform: 'translateX(0)',
        }}
      />

      {/* Right handle for messages going right */}
      {!isLast && (
        <Handle
          type="source"
          position={Position.Right}
          id={`lane-right-${participant.id}`}
          style={{
            background: 'transparent',
            border: 'none',
            width: 8,
            height: 8,
            top: 'auto',
            right: -4,
            opacity: 0,
          }}
        />
      )}
    </>
  );
}

export const ParticipantLaneNode = memo(ParticipantLaneNodeComponent);
