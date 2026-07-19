/**
 * Unit tests for Divider layout and rendering.
 */

import { describe, it, expect } from 'vitest';
import { normalize } from '../../src/model/normalizer';
import { layoutSequence } from '../../src/layout/layoutSequence';
import type { SequenceDiagramData } from '../../src/model/public-types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const dataWithDividers: SequenceDiagramData = {
  schemaVersion: '1.0',
  participants: [
    { id: 'p1', label: 'Participant 1' },
    { id: 'p2', label: 'Participant 2' },
    { id: 'p3', label: 'Participant 3' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'p1', to: 'p2', label: 'Hello' },
    { id: 'dv1', type: 'divider', label: 'Section 1' },
    { id: 'm2', type: 'message', from: 'p2', to: 'p3', label: 'World' },
    { id: 'dv2', type: 'divider' },
    { id: 'm3', type: 'message', from: 'p3', to: 'p1', label: 'Done' },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Divider Layout', () => {
  it('should calculate dividers spanning all participants', () => {
    const normalized = normalize(dataWithDividers);
    const layout = layoutSequence(normalized);

    expect(layout.dividers).toHaveLength(2);

    const divider = layout.dividers.find((d) => d.eventId === 'dv1')!;
    const firstParticipant = layout.participants[0]!;
    const lastParticipant = layout.participants[layout.participants.length - 1]!;

    expect(divider.x).toBe(firstParticipant.x);
    expect(divider.width).toBe(
      lastParticipant.x + lastParticipant.width - firstParticipant.x
    );
  });

  it('should position dividers at correct y coordinates', () => {
    const normalized = normalize(dataWithDividers);
    const layout = layoutSequence(normalized);

    const divider = layout.dividers.find((d) => d.eventId === 'dv1')!;
    const dividerRow = layout.eventRowMap.get('dv1');

    expect(dividerRow).toBeDefined();
    const rowY = layout.rowYPositions[dividerRow as number];
    expect(rowY).toBeDefined();
    expect(divider.y).toBeCloseTo(rowY as number + 16, 0);
  });

  it('should include optional label', () => {
    const normalized = normalize(dataWithDividers);
    const layout = layoutSequence(normalized);

    const labeledDivider = layout.dividers.find((d) => d.eventId === 'dv1')!;
    const unlabeledDivider = layout.dividers.find((d) => d.eventId === 'dv2')!;

    expect(labeledDivider.label).toBe('Section 1');
    expect(unlabeledDivider.label).toBeUndefined();
  });

  it('should render dividers at correct row positions', () => {
    const normalized = normalize(dataWithDividers);
    const layout = layoutSequence(normalized);

    const divider1Row = layout.eventRowMap.get('dv1')!;
    const divider2Row = layout.eventRowMap.get('dv2')!;

    expect(divider1Row).toBeLessThan(divider2Row);

    const divider1Y = layout.dividers.find((d) => d.eventId === 'dv1')!.y;
    const divider2Y = layout.dividers.find((d) => d.eventId === 'dv2')!.y;

    expect(divider1Y).toBeLessThan(divider2Y);
  });
});
