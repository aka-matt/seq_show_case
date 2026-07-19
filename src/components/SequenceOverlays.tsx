/**
 * SequenceOverlays - container for all overlay elements.
 * Renders activation bars, notes, dividers, and fragment overlays
 * in the correct z-order using React Flow's ViewportPortal.
 *
 * Layer order (per spec section 5.5, back to front):
 * 1. Background
 * 2. Fragment backgrounds and borders
 * 3. Lifelines (already done in Phase 3 via ParticipantLaneNode)
 * 4. Activation bars
 * 5. Message edges (already done in Phase 3 via SequenceMessageEdge)
 * 6. Message labels
 * 7. Participant cards (already done in Phase 3 via ParticipantLaneNode)
 * 8. Controls, errors, loading
 *
 * FragmentOverlay uses zIndex 2 (lowest overlay)
 * ActivationOverlay and DividerOverlay use zIndex 4
 * NoteOverlay uses zIndex 6 (highest, above message labels)
 */
import React, { memo } from 'react';
import type { LayoutResult } from '../layout/layout-types';
import { ActivationOverlay } from './ActivationOverlay';
import { NoteOverlay } from './NoteOverlay';
import { DividerOverlay } from './DividerOverlay';
import { FragmentOverlay } from './FragmentOverlay';

export interface SequenceOverlaysProps {
  layoutResult: LayoutResult;
  /** Callback when a note is clicked */
  onNoteClick?: (eventId: string) => void;
  /** Callback when a fragment title is clicked */
  onFragmentClick?: (fragmentEventId: string) => void;
}

function SequenceOverlaysComponent({
  layoutResult,
  onNoteClick,
  onFragmentClick,
}: SequenceOverlaysProps): React.ReactElement | null {
  if (!layoutResult) return null;

  return (
    <>
      {/* Fragment backgrounds (zIndex 2) - lowest overlay layer */}
      <FragmentOverlay
        fragments={layoutResult.fragments}
        branches={layoutResult.branches}
        {...(onFragmentClick && { onFragmentClick })}
      />

      {/* Activation bars (zIndex 4) */}
      <ActivationOverlay activations={layoutResult.activations} />

      {/* Dividers (zIndex 4) */}
      <DividerOverlay dividers={layoutResult.dividers} />

      {/* Notes (zIndex 6) - highest overlay layer */}
      <NoteOverlay notes={layoutResult.notes} {...(onNoteClick && { onNoteClick })} />
    </>
  );
}

export const SequenceOverlays = memo(SequenceOverlaysComponent);
