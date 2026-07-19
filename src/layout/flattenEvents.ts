/**
 * Stage A of two-stage layout: flattens nested event tree to LayoutRow[].
 * All functions are React-independent — pure TypeScript only.
 */

import type { NormalizedSequenceEvent, NormalizedFragmentEvent } from '../model/normalized-types';
import type { LayoutRow } from './layout-types';
import { DEFAULT_LAYOUT } from './tokens';
import { estimateLineCount } from './textMeasurement';

// ---------------------------------------------------------------------------
// Main flatten function
// ---------------------------------------------------------------------------

/**
 * Flattens a normalized event tree into an array of LayoutRows.
 * This is Stage A of the two-stage layout process.
 */
export function flattenEvents(events: NormalizedSequenceEvent[]): LayoutRow[] {
  const rows: LayoutRow[] = [];
  flattenRecursive(events, rows, 0, undefined, undefined);
  return rows;
}

// ---------------------------------------------------------------------------
// Recursive flattening
// ---------------------------------------------------------------------------

function flattenRecursive(
  events: NormalizedSequenceEvent[],
  rows: LayoutRow[],
  depth: number,
  fragmentId: string | undefined,
  branchId: string | undefined
): void {
  for (const event of events) {
    switch (event.type) {
      case 'message': {
        const row: LayoutRow = {
          key: `msg-${event.id}`,
          kind: 'message',
          depth,
          sourceEventId: event.id,
          estimatedHeight: DEFAULT_LAYOUT.rowHeight,
          ...(fragmentId !== undefined && { fragmentId }),
          ...(branchId !== undefined && { branchId }),
        };
        rows.push(row);
        break;
      }

      case 'note': {
        // Notes take more height based on line count
        const noteMaxWidth = 200;
        const lineCount = estimateLineCount(event.text, noteMaxWidth);
        // Include the note's 4px top inset and a bottom clearance. Without
        // this, the next message label can overlap the rendered note box.
        const noteHeight = Math.max(DEFAULT_LAYOUT.rowHeight, lineCount * 20 + 28);

        const row: LayoutRow = {
          key: `note-${event.id}`,
          kind: 'note',
          depth,
          sourceEventId: event.id,
          estimatedHeight: noteHeight,
          ...(fragmentId !== undefined && { fragmentId }),
          ...(branchId !== undefined && { branchId }),
        };
        rows.push(row);
        break;
      }

      case 'divider': {
        const row: LayoutRow = {
          key: `div-${event.id}`,
          kind: 'divider',
          depth,
          sourceEventId: event.id,
          estimatedHeight: 32, // Dividers are compact
          ...(fragmentId !== undefined && { fragmentId }),
          ...(branchId !== undefined && { branchId }),
        };
        rows.push(row);
        break;
      }

      case 'activate':
      case 'deactivate': {
        // Activations/deactivations don't add visible rows themselves
        // They are rendered as part of message rows or via activation rectangles
        // So we don't push a row for them
        break;
      }

      case 'fragment': {
        const fragment = event as NormalizedFragmentEvent;

        // Add fragment header row
        const headerRow: LayoutRow = {
          key: `frag-${fragment.id}`,
          kind: 'fragment-header',
          depth,
          sourceEventId: fragment.id,
          estimatedHeight: DEFAULT_LAYOUT.fragmentPaddingTop + DEFAULT_LAYOUT.branchHeaderHeight,
          fragmentId: fragment.id,
        };
        rows.push(headerRow);

        // Add branch header rows
        for (const branch of fragment.branches) {
          const branchHeaderRow: LayoutRow = {
            key: `branch-${branch.id}`,
            kind: 'branch-header',
            depth: depth + 1,
            sourceEventId: branch.id,
            estimatedHeight: DEFAULT_LAYOUT.branchHeaderHeight,
            fragmentId: fragment.id,
            branchId: branch.id,
          };
          rows.push(branchHeaderRow);

          // Recursively flatten branch events
          flattenRecursive(branch.events, rows, depth + 1, fragment.id, branch.id);
        }
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the total height of all rows.
 */
export function calculateTotalRowsHeight(rows: LayoutRow[]): number {
  return (
    rows.reduce((sum, row) => sum + row.estimatedHeight, 0) +
    (rows.length > 0 ? (rows.length - 1) * DEFAULT_LAYOUT.rowGap : 0)
  );
}

/**
 * Finds the row index for a given event ID.
 */
export function findRowByEventId(rows: LayoutRow[], eventId: string): number {
  return rows.findIndex(row => row.sourceEventId === eventId);
}
