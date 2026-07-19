import { describe, expect, it } from 'vitest';
import { bundledStyles } from '../../src/styles/bundledStyles';

describe('bundled React Flow theme styles', () => {
  it('themes controls and attribution with sequence diagram variables', () => {
    expect(bundledStyles).toContain('.react-flow__controls-button');
    expect(bundledStyles).toContain('background: var(--sd-surface)');
    expect(bundledStyles).toContain('color: var(--sd-text)');
    expect(bundledStyles).toContain('.react-flow__attribution a');
    expect(bundledStyles).toContain('color: var(--sd-text-muted)');
  });
});
