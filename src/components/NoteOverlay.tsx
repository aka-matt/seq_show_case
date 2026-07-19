/**
 * NoteOverlay - renders note annotations as React Flow overlays.
 * Notes appear at left/right/center positions relative to participants.
 * Uses ViewportPortal for proper z-ordering.
 */
import React, { memo } from 'react';
import { ViewportPortal } from '@xyflow/react';
import type { LayoutNote } from '../layout/layout-types';

export interface NoteOverlayProps {
  notes: LayoutNote[];
  /** Callback when a note is clicked (restores pointer-events) */
  onNoteClick?: (eventId: string) => void;
}

// ---------------------------------------------------------------------------
// Tone colors
// ---------------------------------------------------------------------------

const TONE_STYLES: Record<
  LayoutNote['tone'],
  { bg: string; border: string; text: string }
> = {
  info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  neutral: { bg: '#f9fafb', border: '#6b7280', text: '#374151' },
};

function NoteOverlayComponent({
  notes,
  onNoteClick,
}: NoteOverlayProps): React.ReactElement | null {
  if (notes.length === 0) return null;

  return (
    <ViewportPortal>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      >
        {notes.map((note) => {
          const tone = TONE_STYLES[note.tone] ?? TONE_STYLES.neutral;
          return (
            <div
              key={`note-${note.eventId}`}
              onClick={(e) => {
                // Restore pointer-events for clickable notes
                e.stopPropagation();
                onNoteClick?.(note.eventId);
              }}
              style={{
                position: 'absolute',
                left: note.x,
                top: note.y,
                width: note.width,
                minHeight: note.height,
                backgroundColor: tone.bg,
                border: `1px solid ${tone.border}`,
                borderRadius: 6,
                padding: '6px 10px',
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: tone.text,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}
              >
                {note.text}
              </span>
            </div>
          );
        })}
      </div>
    </ViewportPortal>
  );
}

export const NoteOverlay = memo(NoteOverlayComponent);
