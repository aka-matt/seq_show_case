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
// Tone colors (CSS variable based)
// ---------------------------------------------------------------------------

const TONE_STYLES: Record<
  LayoutNote['tone'],
  { background: string; borderVar: string; textVar: string }
> = {
  info: { background: 'var(--sd-accent-soft)', borderVar: '--sd-accent', textVar: '--sd-accent' },
  success: {
    background: 'color-mix(in srgb, var(--sd-success) 16%, var(--sd-surface))',
    borderVar: '--sd-success',
    textVar: '--sd-success',
  },
  warning: {
    background: 'color-mix(in srgb, var(--sd-warning) 16%, var(--sd-surface))',
    borderVar: '--sd-warning',
    textVar: '--sd-text',
  },
  error: {
    background: 'color-mix(in srgb, var(--sd-error) 16%, var(--sd-surface))',
    borderVar: '--sd-error',
    textVar: '--sd-error',
  },
  neutral: {
    background: 'var(--sd-surface-muted)',
    borderVar: '--sd-border',
    textVar: '--sd-text',
  },
};

function NoteOverlayComponent({ notes, onNoteClick }: NoteOverlayProps): React.ReactElement | null {
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
        {notes.map(note => {
          const tone = TONE_STYLES[note.tone] ?? TONE_STYLES.neutral;
          return (
            <div
              key={`note-${note.eventId}`}
              onClick={e => {
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
                backgroundColor: tone.background,
                border: `1px solid var(${tone.borderVar})`,
                borderRadius: 6,
                padding: '6px 10px',
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                cursor: 'pointer',
                boxShadow: '0 1px 3px var(--sd-shadow)',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: `var(${tone.textVar})`,
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
