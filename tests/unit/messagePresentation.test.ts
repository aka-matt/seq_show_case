import { describe, expect, it } from 'vitest';
import { normalize } from '../../src/model/normalizer';
import { layoutSequence } from '../../src/layout/layoutSequence';
import { createEdges } from '../../src/react-flow/createEdges';
import type { SequenceDiagramData } from '../../src/model/public-types';

describe('message presentation fields', () => {
  it.each([
    ['regular', 'p2'],
    ['self', 'p1'],
  ] as const)('passes number and tooltip to a %s edge', (_kind, target) => {
    const data: SequenceDiagramData = {
      schemaVersion: '1.0',
      participants: [
        { id: 'p1', label: 'P1' },
        { id: 'p2', label: 'P2' },
      ],
      events: [
        {
          id: 'm1',
          type: 'message',
          from: 'p1',
          to: target,
          label: 'Request',
          number: 3,
          tooltip: 'More information',
        },
      ],
    };
    const edge = createEdges(layoutSequence(normalize(data)))[0]!;

    expect(edge.data).toMatchObject({
      number: 3,
      tooltip: 'More information',
    });
  });
});
