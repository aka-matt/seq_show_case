/**
 * Unit tests for ActivationOverlay component.
 */

import { describe, it, expect } from 'vitest';
import { normalize } from '../../src/model/normalizer';
import { layoutSequence } from '../../src/layout/layoutSequence';
import type { SequenceDiagramData } from '../../src/model/public-types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const dataWithActivations: SequenceDiagramData = {
  schemaVersion: '1.0',
  participants: [
    { id: 'p1', label: 'Participant 1' },
    { id: 'p2', label: 'Participant 2' },
  ],
  events: [
    { id: 'a1', type: 'activate', participant: 'p1' },
    { id: 'm1', type: 'message', from: 'p1', to: 'p2', label: 'Hello' },
    { id: 'd1', type: 'deactivate', participant: 'p1' },
  ],
};

const dataWithNestedActivations: SequenceDiagramData = {
  schemaVersion: '1.0',
  participants: [
    { id: 'p1', label: 'Participant 1' },
    { id: 'p2', label: 'Participant 2' },
  ],
  events: [
    { id: 'a1', type: 'activate', participant: 'p1' },
    { id: 'a2', type: 'activate', participant: 'p1' },
    { id: 'm1', type: 'message', from: 'p1', to: 'p2', label: 'Hello' },
    { id: 'd2', type: 'deactivate', participant: 'p1' },
    { id: 'd1', type: 'deactivate', participant: 'p1' },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Activation Layout', () => {
  describe('basic activations', () => {
    it('should calculate activation rectangle for activate/deactivate pair', () => {
      const normalized = normalize(dataWithActivations);
      const layout = layoutSequence(normalized);

      expect(layout.activations).toHaveLength(1);
      const activation = layout.activations[0]!;
      expect(activation.participantId).toBe('p1');
      expect(activation.activateEventId).toBe('a1');
      expect(activation.deactivateEventId).toBe('d1');
      expect(activation.width).toBe(12); // activationWidth from tokens
      expect(activation.height).toBeGreaterThan(0);
      expect(activation.x).toBeGreaterThan(0);
      expect(activation.y).toBeGreaterThan(0);
    });

    it('should place activation on right side of participant', () => {
      const normalized = normalize(dataWithActivations);
      const layout = layoutSequence(normalized);

      const activation = layout.activations[0]!;
      const participant = layout.participants.find((p) => p.id === 'p1')!;

      // Activation should be near the right edge of the participant
      expect(activation.x).toBeCloseTo(
        participant.x + participant.width - 12 - 4,
        0
      );
    });

    it('should have y position at the activate event row', () => {
      const normalized = normalize(dataWithActivations);
      const layout = layoutSequence(normalized);

      const activation = layout.activations[0]!;
      const activateRow = layout.eventRowMap.get('a1');

      expect(activateRow).toBeDefined();
      const rowY = layout.rowYPositions[activateRow as number];
      expect(rowY).toBeDefined();
      expect(activation.y).toBeCloseTo(rowY as number, 0);
    });
  });

  describe('nested activations', () => {
    it('should calculate separate rectangles for nested activations', () => {
      const normalized = normalize(dataWithNestedActivations);
      const layout = layoutSequence(normalized);

      expect(layout.activations).toHaveLength(2);

      // Both activations should be for p1
      const p1Activations = layout.activations.filter((a) => a.participantId === 'p1');
      expect(p1Activations).toHaveLength(2);

      // They should have valid dimensions
      for (const activation of p1Activations) {
        expect(activation.width).toBe(12); // activationWidth
        expect(activation.height).toBeGreaterThan(0);
      }
    });

    it('should calculate separate activation rectangles', () => {
      const normalized = normalize(dataWithNestedActivations);
      const layout = layoutSequence(normalized);

      const activations = layout.activations;

      // Both activations should be for p1 with valid dimensions
      const outerActivation = activations.find((a) => a.activateEventId === 'a1')!;
      const innerActivation = activations.find((a) => a.activateEventId === 'a2')!;

      expect(outerActivation.participantId).toBe('p1');
      expect(innerActivation.participantId).toBe('p1');
      expect(outerActivation.width).toBe(12);
      expect(innerActivation.width).toBe(12);
    });
  });

  describe('unclosed activations', () => {
    it('should handle activation without matching deactivate', () => {
      const data: SequenceDiagramData = {
        schemaVersion: '1.0',
        participants: [{ id: 'p1', label: 'Participant 1' }],
        events: [
          { id: 'a1', type: 'activate', participant: 'p1' },
          { id: 'm1', type: 'message', from: 'p1', to: 'p1', label: 'Self call' },
        ],
      };

      const normalized = normalize(data);
      const layout = layoutSequence(normalized);

      expect(layout.activations).toHaveLength(1);
      expect(layout.activations[0]!.deactivateEventId).toBe('');
    });
  });
});
