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

      // Include every participant referenced anywhere in the fragment tree.
      // Explicit JSON participants are treated as additions, not as a crop.
      const participantIds = collectParticipantIds(fragment);
      const participantIndices = participantIds
        .map(pid => participantIndex.get(pid))
        .filter((index): index is number => index !== undefined);
      if (participantIndices.length === 0) continue;
      const startParticipantIndex = Math.min(...participantIndices);
      const endParticipantIndex = Math.max(...participantIndices);

      const startParticipant = allParticipants[startParticipantIndex];
      const endParticipant = allParticipants[endParticipantIndex];

      if (!startParticipant || !endParticipant) continue;

      const headerY = rowYPositions[headerRowIndex] ?? 0;
      const headerHeight =
        rows[headerRowIndex]?.estimatedHeight ?? DEFAULT_LAYOUT.fragmentPaddingTop;

      // Find the final row recursively. Nested rows carry their own fragmentId,
      // so filtering only by the parent fragmentId truncates the parent frame.
      const fragmentRowIds = collectFragmentRowIds(fragment);
      const fragmentEndRowIndex = findLastRowIndex(rows, fragmentRowIds, headerRowIndex);

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
        participants: participantIds,
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

        const branchRowIds = collectBranchRowIds(branch);
        const branchEndRowIndex = findLastRowIndex(rows, branchRowIds, branchHeaderRowIndex);

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

function collectParticipantIds(fragment: NormalizedFragmentEvent): string[] {
  const ids = new Set(fragment.participants);
  const visit = (events: NormalizedData['events']): void => {
    for (const event of events) {
      if (event.type === 'message') {
        ids.add(event.from);
        ids.add(event.to);
      } else if (event.type === 'note') {
        event.over.forEach(id => ids.add(id));
      } else if (event.type === 'activate' || event.type === 'deactivate') {
        ids.add(event.participant);
      } else if (event.type === 'fragment') {
        event.participants.forEach(id => ids.add(id));
        event.branches.forEach(branch => visit(branch.events));
      }
    }
  };
  fragment.branches.forEach(branch => visit(branch.events));
  return [...ids];
}

function collectFragmentRowIds(fragment: NormalizedFragmentEvent): Set<string> {
  const ids = new Set<string>([fragment.id]);
  for (const branch of fragment.branches) {
    ids.add(branch.id);
    collectEventRowIds(branch.events, ids);
  }
  return ids;
}

function collectBranchRowIds(branch: NormalizedFragmentEvent['branches'][number]): Set<string> {
  const ids = new Set<string>([branch.id]);
  collectEventRowIds(branch.events, ids);
  return ids;
}

function collectEventRowIds(events: NormalizedData['events'], ids: Set<string>): void {
  for (const event of events) {
    ids.add(event.id);
    if (event.type === 'fragment') {
      for (const branch of event.branches) {
        ids.add(branch.id);
        collectEventRowIds(branch.events, ids);
      }
    }
  }
}

function findLastRowIndex(rows: LayoutRow[], sourceIds: Set<string>, fallback: number): number {
  let last = fallback;
  for (let index = fallback; index < rows.length; index++) {
    const sourceId = rows[index]?.sourceEventId;
    if (sourceId !== undefined && sourceIds.has(sourceId)) last = index;
  }
  return last;
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
