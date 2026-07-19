/**
 * Unit tests for Fragment and Branch layout.
 */

import { describe, it, expect } from 'vitest';
import { normalize } from '../../src/model/normalizer';
import { layoutSequence } from '../../src/layout/layoutSequence';
import type { SequenceDiagramData } from '../../src/model/public-types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const dataWithAltFragment: SequenceDiagramData = {
  schemaVersion: '1.0',
  participants: [
    { id: 'p1', label: 'Participant 1' },
    { id: 'p2', label: 'Participant 2' },
  ],
  events: [
    {
      id: 'frag1',
      type: 'fragment',
      fragmentKind: 'alt',
      label: 'Condition',
      participants: ['p1', 'p2'],
      branches: [
        {
          id: 'b1',
          label: 'true',
          events: [{ id: 'm1', type: 'message', from: 'p1', to: 'p2', label: 'Do something' }],
        },
        {
          id: 'b2',
          label: 'false',
          events: [{ id: 'm2', type: 'message', from: 'p2', to: 'p1', label: 'Do nothing' }],
        },
      ],
    },
  ],
};

const dataWithLoopFragment: SequenceDiagramData = {
  schemaVersion: '1.0',
  participants: [
    { id: 'p1', label: 'Participant 1' },
    { id: 'p2', label: 'Participant 2' },
  ],
  events: [
    {
      id: 'frag1',
      type: 'fragment',
      fragmentKind: 'loop',
      label: 'Retry',
      participants: ['p1', 'p2'],
      branches: [
        {
          id: 'b1',
          events: [
            { id: 'm1', type: 'message', from: 'p1', to: 'p2', label: 'Try' },
            { id: 'm2', type: 'message', from: 'p2', to: 'p1', label: 'Result' },
          ],
        },
      ],
    },
  ],
};

const dataWithNestedFragments: SequenceDiagramData = {
  schemaVersion: '1.0',
  participants: [
    { id: 'p1', label: 'Participant 1' },
    { id: 'p2', label: 'Participant 2' },
  ],
  events: [
    {
      id: 'frag1',
      type: 'fragment',
      fragmentKind: 'alt',
      label: 'Outer',
      participants: ['p1', 'p2'],
      branches: [
        {
          id: 'b1',
          label: 'case1',
          events: [
            {
              id: 'frag2',
              type: 'fragment',
              fragmentKind: 'loop',
              label: 'Inner',
              participants: ['p1', 'p2'],
              branches: [
                {
                  id: 'b2',
                  events: [{ id: 'm1', type: 'message', from: 'p1', to: 'p2', label: 'Loop msg' }],
                },
              ],
            },
          ],
        },
        {
          id: 'b3',
          label: 'case2',
          events: [{ id: 'm2', type: 'message', from: 'p2', to: 'p1', label: 'Alt case2' }],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Fragment Layout', () => {
  describe('alt fragments', () => {
    it('should create fragment rectangle spanning participants', () => {
      const normalized = normalize(dataWithAltFragment);
      const layout = layoutSequence(normalized);

      expect(layout.fragments).toHaveLength(1);
      const fragment = layout.fragments[0]!;

      expect(fragment.fragmentKind).toBe('alt');
      expect(fragment.label).toBe('Condition');
      expect(fragment.participants).toEqual(['p1', 'p2']);
      expect(fragment.width).toBeGreaterThan(0);
      expect(fragment.height).toBeGreaterThan(0);

      const headerRow = layout.rows.findIndex(row => row.sourceEventId === 'frag1');
      const firstBranch = layout.branches.find(branch => branch.branchId === 'b1')!;
      expect(fragment.y).toBe(layout.rowYPositions[headerRow]);
      expect(firstBranch.y - fragment.y).toBeLessThanOrEqual(32);
    });

    it('should create branch separators', () => {
      const normalized = normalize(dataWithAltFragment);
      const layout = layoutSequence(normalized);

      expect(layout.branches).toHaveLength(2);

      const branch1 = layout.branches.find(b => b.branchId === 'b1')!;
      const branch2 = layout.branches.find(b => b.branchId === 'b2')!;

      expect(branch1.label).toBe('true');
      expect(branch2.label).toBe('false');

      // Branches should be at different y positions
      expect(branch1.y).not.toBe(branch2.y);
      expect(layout.messages).toHaveLength(2);
      expect(layout.messages[0]!.y).toBeLessThan(branch2.y);
      expect(layout.messages[1]!.y).toBeGreaterThan(branch2.y);
    });

    it('should have fragment x spanning from first to last participant', () => {
      const normalized = normalize(dataWithAltFragment);
      const layout = layoutSequence(normalized);

      const fragment = layout.fragments[0]!;
      const p1 = layout.participants.find(p => p.id === 'p1')!;
      const p2 = layout.participants.find(p => p.id === 'p2')!;

      // Fragment should start before p1's x (with padding)
      expect(fragment.x).toBeLessThan(p1.x);
      // Fragment should end after p2's right edge (with padding)
      expect(fragment.x + fragment.width).toBeGreaterThan(p2.x + p2.width);
    });
  });

  describe('loop fragments', () => {
    it('should create fragment for loop type', () => {
      const normalized = normalize(dataWithLoopFragment);
      const layout = layoutSequence(normalized);

      expect(layout.fragments).toHaveLength(1);
      const fragment = layout.fragments[0]!;

      expect(fragment.fragmentKind).toBe('loop');
      expect(fragment.label).toBe('Retry');
    });

    it('should contain messages inside fragment', () => {
      const normalized = normalize(dataWithLoopFragment);
      const layout = layoutSequence(normalized);

      // Messages should be inside the fragment bounds
      const fragment = layout.fragments[0]!;

      for (const message of layout.messages) {
        expect(message.y).toBeGreaterThanOrEqual(fragment.y);
        expect(message.y).toBeLessThanOrEqual(fragment.y + fragment.height);
      }
    });
  });

  describe('nested fragments', () => {
    it('should create separate fragment rectangles for nested fragments', () => {
      const normalized = normalize(dataWithNestedFragments);
      const layout = layoutSequence(normalized);

      // Should have 2 fragments: outer alt and inner loop
      expect(layout.fragments).toHaveLength(2);

      const outerFragment = layout.fragments.find(f => f.fragmentEventId === 'frag1')!;
      const innerFragment = layout.fragments.find(f => f.fragmentEventId === 'frag2')!;

      expect(outerFragment.fragmentKind).toBe('alt');
      expect(innerFragment.fragmentKind).toBe('loop');

      // Both fragments should exist and have valid bounds
      expect(outerFragment.width).toBeGreaterThan(0);
      expect(outerFragment.height).toBeGreaterThan(0);
      expect(innerFragment.width).toBeGreaterThan(0);
      expect(innerFragment.height).toBeGreaterThan(0);
      expect(outerFragment.y + outerFragment.height).toBeGreaterThanOrEqual(
        innerFragment.y + innerFragment.height
      );
    });

    it('expands the outer bounds for all nested events and participants', () => {
      const data: SequenceDiagramData = {
        schemaVersion: '1.0',
        participants: [
          { id: 'p1', label: 'P1' },
          { id: 'p2', label: 'P2' },
          { id: 'p3', label: 'P3' },
        ],
        events: [
          {
            id: 'outer',
            type: 'fragment',
            fragmentKind: 'loop',
            participants: ['p1'],
            branches: [
              {
                id: 'outer-branch',
                events: [
                  {
                    id: 'inner',
                    type: 'fragment',
                    fragmentKind: 'opt',
                    participants: ['p2'],
                    branches: [
                      {
                        id: 'inner-branch',
                        events: [
                          {
                            id: 'nested-message',
                            type: 'message',
                            from: 'p2',
                            to: 'p3',
                            label: 'Nested',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const layout = layoutSequence(normalize(data));
      const outer = layout.fragments.find(fragment => fragment.fragmentEventId === 'outer')!;
      const inner = layout.fragments.find(fragment => fragment.fragmentEventId === 'inner')!;
      const p3 = layout.participants.find(participant => participant.id === 'p3')!;
      const nestedMessage = layout.messages.find(message => message.eventId === 'nested-message')!;

      expect(outer.participants).toEqual(expect.arrayContaining(['p1', 'p2', 'p3']));
      expect(outer.x + outer.width).toBeGreaterThan(p3.x + p3.width);
      expect(nestedMessage.y).toBeLessThan(outer.y + outer.height);
      expect(outer.y + outer.height).toBeGreaterThanOrEqual(inner.y + inner.height);
    });

    it('should track fragment types correctly', () => {
      const normalized = normalize(dataWithNestedFragments);
      const layout = layoutSequence(normalized);

      const outerFragment = layout.fragments.find(f => f.fragmentEventId === 'frag1')!;
      const innerFragment = layout.fragments.find(f => f.fragmentEventId === 'frag2')!;

      // Outer should be alt, inner should be loop
      expect(outerFragment.fragmentKind).toBe('alt');
      expect(innerFragment.fragmentKind).toBe('loop');
    });
  });
});
