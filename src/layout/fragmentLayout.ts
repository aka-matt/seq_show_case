/**
 * Fragment/branch rectangle calculation.
 * All functions are React-independent — pure TypeScript only.
 */

import type { NormalizedData, NormalizedFragmentEvent } from '../model/normalized-types';
import type { LayoutFragment, LayoutBranch, LayoutParticipant, LayoutRow } from './layout-types';
import { DEFAULT_LAYOUT } from './tokens';

// ---------------------------------------------------------------------------
// Fragment layout
// ---------------------------------------------------------------------------

/**
 * Calculates fragment and branch rectangles.
 */
export function calculateFragmentLayout(
  normalizedData: NormalizedData,
  participants: LayoutParticipant[],
  rows: LayoutRow[],
  rowYPositions: number[]
): { fragments: LayoutFragment[]; branches: LayoutBranch[] } {
  const fragments: LayoutFragment[] = [];
  const branches: LayoutBranch[] = [];

  // Build participant index map
  const participantIndex = new Map<string, number>();
  for (const p of participants) {
    participantIndex.set(p.id, p.index);
  }

  // Process fragments from normalized data
  processFragments(
    normalizedData.events,
    rows,
    rowYPositions,
    participantIndex,
    fragments,
    branches,
    participants
  );

  return { fragments, branches };
}

// ---------------------------------------------------------------------------
// Recursive fragment processing
// ---------------------------------------------------------------------------

function processFragments(
  events: NormalizedData['events'],
  rows: LayoutRow[],
  rowYPositions: number[],
  participantIndex: Map<string, number>,
  fragments: LayoutFragment[],
  branches: LayoutBranch[],
  allParticipants: LayoutParticipant[]
): void {
  for (const event of events) {
    if (event.type === 'fragment') {
      const fragment = event as NormalizedFragmentEvent;

      // Find fragment header row
      const headerRowIndex = rows.findIndex(
        r => r.sourceEventId === fragment.id && r.kind === 'fragment-header'
      );

      if (headerRowIndex === -1) continue;

      // Determine which participants this fragment spans
      const fragmentParticipants = fragment.participants ?? [];
      const participantIndices = fragmentParticipants.map(pid => participantIndex.get(pid) ?? 0);
      const startParticipantIndex = Math.min(...participantIndices);
      const endParticipantIndex = Math.max(...participantIndices);

      const startParticipant = allParticipants[startParticipantIndex];
      const endParticipant = allParticipants[endParticipantIndex];

      if (!startParticipant || !endParticipant) continue;

      const headerY = rowYPositions[headerRowIndex] ?? 0;
      const headerHeight =
        rows[headerRowIndex]?.estimatedHeight ?? DEFAULT_LAYOUT.fragmentPaddingTop;

      // Find all rows that belong to this fragment
      const fragmentRows = rows.filter(r => r.fragmentId === fragment.id);
      const lastFragmentRow = fragmentRows[fragmentRows.length - 1];
      const fragmentEndRowIndex = lastFragmentRow
        ? rows.lastIndexOf(lastFragmentRow)
        : headerRowIndex;

      const fragmentEndY = rowYPositions[fragmentEndRowIndex] ?? headerY;
      const fragmentEndRow = rows[fragmentEndRowIndex];
      const fragmentHeight = fragmentEndY - headerY + (fragmentEndRow?.estimatedHeight ?? 0);

      // Calculate X bounds
      const x = startParticipant.x - DEFAULT_LAYOUT.fragmentPaddingX;
      const width =
        endParticipant.x +
        endParticipant.width -
        startParticipant.x +
        DEFAULT_LAYOUT.fragmentPaddingX * 2;

      const layoutFragment: LayoutFragment = {
        fragmentEventId: fragment.id,
        fragmentKind: fragment.fragmentKind,
        x,
        // Do not extend into the preceding row/component.
        y: headerY,
        width,
        height: fragmentHeight + DEFAULT_LAYOUT.fragmentPaddingBottom,
        depth: rows[headerRowIndex]?.depth ?? 0,
        participants: fragmentParticipants,
        ...(fragment.label !== undefined && { label: fragment.label }),
      };
      fragments.push(layoutFragment);

      // Process branches
      let branchY = headerY + headerHeight;
      for (const branch of fragment.branches) {
        const branchHeaderRowIndex = rows.findIndex(
          r => r.sourceEventId === branch.id && r.kind === 'branch-header'
        );

        if (branchHeaderRowIndex === -1) continue;

        const branchHeaderY = rowYPositions[branchHeaderRowIndex] ?? branchY;

        // Find rows belonging to this branch
        const branchRows = rows.filter(r => r.branchId === branch.id && r.kind !== 'branch-header');
        const lastBranchRow = branchRows[branchRows.length - 1];
        const branchEndRowIndex = lastBranchRow
          ? rows.lastIndexOf(lastBranchRow)
          : branchHeaderRowIndex;

        const branchEndY = rowYPositions[branchEndRowIndex] ?? branchHeaderY;
        const branchEndRow = rows[branchEndRowIndex];
        const branchHeight = branchEndY - branchHeaderY + (branchEndRow?.estimatedHeight ?? 0);

        const layoutBranch: LayoutBranch = {
          branchId: branch.id,
          fragmentEventId: fragment.id,
          x,
          y: branchHeaderY,
          width,
          height: branchHeight,
          ...(branch.label !== undefined && { label: branch.label }),
        };
        branches.push(layoutBranch);

        branchY = branchEndY + (branchEndRow?.estimatedHeight ?? 0);
      }

      // Recurse into nested fragments
      for (const branch of fragment.branches) {
        processFragments(
          branch.events,
          rows,
          rowYPositions,
          participantIndex,
          fragments,
          branches,
          allParticipants
        );
      }
    }
  }
}

/**
 * Helper to get all participants in a fragment's range.
 */
export function getFragmentParticipantRange(
  fragment: NormalizedFragmentEvent,
  participantIndex: Map<string, number>
): { startIndex: number; endIndex: number } {
  const indices = fragment.participants.map(pid => participantIndex.get(pid) ?? 0);
  return {
    startIndex: Math.min(...indices),
    endIndex: Math.max(...indices),
  };
}
