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

    it('should place activation centred on the participant lifeline', () => {
      const normalized = normalize(dataWithActivations);
      const layout = layoutSequence(normalized);

      const activation = layout.activations[0]!;
      const participant = layout.participants.find(p => p.id === 'p1')!;

      // Activation bar is centred on the lifeline (participant centre).
      expect(activation.x).toBeCloseTo(
        participant.x + participant.width / 2 - activation.width / 2,
        0
      );
    });

    it('should use the lifeline top when there is no preceding participant message', () => {
      const normalized = normalize(dataWithActivations);
      const layout = layoutSequence(normalized);

      const activation = layout.activations[0]!;
      const participant = layout.participants.find(p => p.id === 'p1')!;
      expect(activation.y).toBe(participant.y + participant.height);
    });
  });

  describe('nested activations', () => {
    it('should calculate separate rectangles for nested activations', () => {
      const normalized = normalize(dataWithNestedActivations);
      const layout = layoutSequence(normalized);

      expect(layout.activations).toHaveLength(2);

      // Both activations should be for p1
      const p1Activations = layout.activations.filter(a => a.participantId === 'p1');
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
      const outerActivation = activations.find(a => a.activateEventId === 'a1')!;
      const innerActivation = activations.find(a => a.activateEventId === 'a2')!;

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
      expect(layout.activations[0]!.y + layout.activations[0]!.height).toBe(layout.bounds.height);
    });
  });

  it('uses only the preceding message involving the activation participant', () => {
    const data: SequenceDiagramData = {
      schemaVersion: '1.0',
      participants: [
        { id: 'p1', label: 'P1' },
        { id: 'p2', label: 'P2' },
        { id: 'p3', label: 'P3' },
      ],
      events: [
        { id: 'p1-message', type: 'message', from: 'p1', to: 'p2', label: 'P1 message' },
        { id: 'unrelated', type: 'message', from: 'p2', to: 'p3', label: 'Unrelated' },
        { id: 'a1', type: 'activate', participant: 'p1' },
        { id: 'd1', type: 'deactivate', participant: 'p1' },
      ],
    };
    const layout = layoutSequence(normalize(data));
    const activation = layout.activations[0]!;
    const participantMessage = layout.messages.find(message => message.eventId === 'p1-message')!;

    expect(activation.y).toBe(participantMessage.y);
    expect(activation.height).toBe(27);
  });
});
