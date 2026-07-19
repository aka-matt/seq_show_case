/**
 * Unit tests for Note layout and rendering.
 */

import { describe, it, expect } from 'vitest';
import { normalize } from '../../src/model/normalizer';
import { layoutSequence } from '../../src/layout/layoutSequence';
import type { SequenceDiagramData } from '../../src/model/public-types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const dataWithNotes: SequenceDiagramData = {
  schemaVersion: '1.0',
  participants: [
    { id: 'p1', label: 'Participant 1' },
    { id: 'p2', label: 'Participant 2' },
    { id: 'p3', label: 'Participant 3' },
  ],
  events: [
    { id: 'n1', type: 'note', text: 'This is a note', over: ['p1'], placement: 'left' },
    { id: 'm1', type: 'message', from: 'p1', to: 'p2', label: 'Hello' },
    { id: 'n2', type: 'note', text: 'Another note', over: ['p2'], placement: 'right' },
    { id: 'n3', type: 'note', text: 'Centered note', over: ['p2'], placement: 'center' },
    { id: 'n4', type: 'note', text: 'Multi-line\nnote content', over: ['p3'], placement: 'center', tone: 'warning' as const },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Note Layout', () => {
  it('should calculate note positions for left placement', () => {
    const normalized = normalize(dataWithNotes);
    const layout = layoutSequence(normalized);

    const note = layout.notes.find((n) => n.eventId === 'n1')!;
    const participant = layout.participants.find((p) => p.id === 'p1')!;

    expect(note.placement).toBe('left');
    expect(note.x).toBeLessThan(participant.x);
    expect(note.y).toBeGreaterThan(0);
  });

  it('should calculate note positions for right placement', () => {
    const normalized = normalize(dataWithNotes);
    const layout = layoutSequence(normalized);

    const note = layout.notes.find((n) => n.eventId === 'n2')!;
    const participant = layout.participants.find((p) => p.id === 'p2')!;

    expect(note.placement).toBe('right');
    expect(note.x).toBeGreaterThan(participant.x + participant.width);
  });

  it('should calculate note positions for center placement', () => {
    const normalized = normalize(dataWithNotes);
    const layout = layoutSequence(normalized);

    const note = layout.notes.find((n) => n.eventId === 'n3')!;
    const participant = layout.participants.find((p) => p.id === 'p2')!;

    expect(note.placement).toBe('center');
    // Centered note should be horizontally within participant bounds
    expect(note.x).toBeGreaterThanOrEqual(participant.x);
    expect(note.x + note.width).toBeLessThanOrEqual(participant.x + participant.width);
  });

  it('should include all tone colors', () => {
    const normalized = normalize(dataWithNotes);
    const layout = layoutSequence(normalized);

    const note = layout.notes.find((n) => n.eventId === 'n4')!;
    expect(note.tone).toBe('warning');
  });

  it('should track over-participant relationships', () => {
    const normalized = normalize(dataWithNotes);
    const layout = layoutSequence(normalized);

    const note = layout.notes.find((n) => n.eventId === 'n1')!;
    expect(note.overParticipantIds).toContain('p1');
    expect(note.overParticipantIds).toHaveLength(1);
  });

  it('should set default tone to info', () => {
    const data: SequenceDiagramData = {
      schemaVersion: '1.0',
      participants: [{ id: 'p1', label: 'P1' }],
      events: [
        { id: 'n1', type: 'note', text: 'Simple note', over: ['p1'] },
      ],
    };

    const normalized = normalize(data);
    const layout = layoutSequence(normalized);

    const note = layout.notes[0]!;
    expect(note.tone).toBe('info');
  });

  it('should calculate note dimensions based on text content', () => {
    const normalized = normalize(dataWithNotes);
    const layout = layoutSequence(normalized);

    // Multi-line note should have some height and respect max width
    const note = layout.notes.find((n) => n.eventId === 'n4')!;
    expect(note.height).toBeGreaterThan(0);
    expect(note.width).toBeLessThanOrEqual(200); // noteMaxWidth
  });
});
