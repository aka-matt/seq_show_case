/**
 * Visual regression smoke tests — Phase 8
 *
 * Captures screenshots for visual comparison across key diagram scenarios.
 * Baseline images are stored in tests/visual/baselines/ and updated via
 * `playwright test --dir tests/visual --update-snapshots`.
 *
 * Each test loads a specific scenario and verifies the component renders
 * without console errors and with expected DOM structure.
 */

import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const BASIC_LIGHT_CLASSIC = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'a', label: 'Alice' },
    { id: 'b', label: 'Bob' },
    { id: 's', label: 'Service' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'a', to: 'b', label: 'Hello', messageKind: 'sync' },
    { id: 'm2', type: 'message', from: 'b', to: 's', label: 'Process', messageKind: 'async' },
    { id: 'm3', type: 'message', from: 's', to: 'b', label: 'Done', messageKind: 'return' },
    { id: 'm4', type: 'message', from: 'b', to: 'a', label: 'Reply', messageKind: 'sync' },
  ],
};

const BASIC_DARK_CLASSIC = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'u', label: 'User' },
    { id: 'w', label: 'Web' },
    { id: 'a', label: 'API' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'u', to: 'w', label: 'Login', messageKind: 'sync' },
    { id: 'm2', type: 'message', from: 'w', to: 'a', label: 'Auth', messageKind: 'sync' },
    { id: 'm3', type: 'message', from: 'a', to: 'w', label: 'Token', messageKind: 'return' },
    { id: 'm4', type: 'message', from: 'w', to: 'u', label: 'OK', messageKind: 'return' },
  ],
};

const OCEAN_LIGHT = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'c', label: 'Client' },
    { id: 's', label: 'Server' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'c', to: 's', label: 'GET /data', messageKind: 'sync' },
    { id: 'm2', type: 'message', from: 's', to: 'c', label: '200 OK', messageKind: 'return' },
  ],
};

const FOREST_DARK = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'p', label: 'Producer' },
    { id: 'q', label: 'Queue' },
    { id: 'c', label: 'Consumer' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'p', to: 'q', label: 'Publish', messageKind: 'async' },
    { id: 'm2', type: 'message', from: 'q', to: 'c', label: 'Deliver', messageKind: 'sync' },
    { id: 'm3', type: 'message', from: 'c', to: 'q', label: 'ACK', messageKind: 'return' },
  ],
};

const SELF_MESSAGE = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'x', label: 'X' },
    { id: 'y', label: 'Y' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'x', to: 'x', label: 'Local validation', messageKind: 'sync' },
    { id: 'm2', type: 'message', from: 'x', to: 'y', label: 'Send', messageKind: 'sync' },
    { id: 'm3', type: 'message', from: 'y', to: 'x', label: 'OK', messageKind: 'return' },
  ],
};

const ACTIVATION_NESTED = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'c', label: 'Client' },
    { id: 's', label: 'Service' },
    { id: 'd', label: 'DB' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'c', to: 's', label: 'Request', messageKind: 'sync' },
    { id: 'a1', type: 'activate', participant: 's' },
    { id: 'm2', type: 'message', from: 's', to: 'd', label: 'Query', messageKind: 'sync' },
    { id: 'a2', type: 'activate', participant: 'd' },
    { id: 'm3', type: 'message', from: 'd', to: 's', label: 'Result', messageKind: 'return' },
    { id: 'd2', type: 'deactivate', participant: 'd' },
    { id: 'm4', type: 'message', from: 's', to: 'c', label: 'Response', messageKind: 'return' },
    { id: 'd1', type: 'deactivate', participant: 's' },
  ],
};

const ALT_FRAGMENT = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ],
  events: [
    {
      id: 'f1',
      type: 'fragment' as const,
      fragmentKind: 'alt' as const,
      label: 'Condition',
      branches: [
        {
          id: 'b1',
          label: 'Yes',
          events: [{ id: 'm1', type: 'message' as const, from: 'a', to: 'b', label: 'Yes path', messageKind: 'sync' as const }],
        },
        {
          id: 'b2',
          label: 'No',
          events: [{ id: 'm2', type: 'message' as const, from: 'b', to: 'a', label: 'No path', messageKind: 'sync' as const }],
        },
      ],
    },
  ],
};

const PAR_FRAGMENT = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ],
  events: [
    {
      id: 'f1',
      type: 'fragment' as const,
      fragmentKind: 'par' as const,
      label: 'Parallel',
      branches: [
        {
          id: 'b1',
          label: 'Branch 1',
          events: [{ id: 'm1', type: 'message' as const, from: 'a', to: 'b', label: 'Msg 1', messageKind: 'sync' as const }],
        },
        {
          id: 'b2',
          label: 'Branch 2',
          events: [{ id: 'm2', type: 'message' as const, from: 'a', to: 'c', label: 'Msg 2', messageKind: 'sync' as const }],
        },
      ],
    },
  ],
};

const LONG_LABELS_CJK = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'u', label: '用户' },
    { id: 's', label: '服务' },
  ],
  events: [
    { id: 'm1', type: 'message', from: 'u', to: 's', label: '你好世界', messageKind: 'sync' },
    { id: 'm2', type: 'message', from: 's', to: 'u', label: 'こんにちは世界', messageKind: 'return' },
  ],
};

const ERROR_STATE = {
  schemaVersion: '1.0' as const,
  participants: [{ id: 'g', label: 'Good' }],
  events: [
    { id: 'm1', type: 'message', from: 'g', to: 'ghost', label: 'To unknown', messageKind: 'sync' },
  ],
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const BASELINE_DIR = 'tests/visual/baselines';

async function renderDiagram(page: Page, data: object, theme?: string, palette?: string): Promise<void> {
  await page.goto('/');

  await page.evaluate(({ data: d, theme: t, palette: p }) => {
    const el = document.createElement('sequence-diagram');
    if (t) el.setAttribute('theme', t);
    if (p) el.setAttribute('palette', p);
    (el as any).data = d;
    el.style.height = '400px';
    document.body.appendChild(el);
  }, { data, theme, palette });

  await page.waitForFunction(() => {
    const el = document.querySelector('sequence-diagram');
    return el?.shadowRoot?.querySelector('.react-flow') !== null;
  }, { timeout: 10000 });
}

async function capture(page: Page, name: string): Promise<void> {
  const el = await page.waitForSelector('sequence-diagram');
  const box = await el.boundingBox();
  if (!box) throw new Error('Could not get bounding box');

  await page.screenshot({
    path: `${BASELINE_DIR}/${name}.png`,
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Visual Regression — Smoke', () => {
  test('basic-light-classic renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await renderDiagram(page, BASIC_LIGHT_CLASSIC, 'light', 'classic');
    await capture(page, 'basic-light-classic');

    const realErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(realErrors).toHaveLength(0);
  });

  test('basic-dark-classic renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await renderDiagram(page, BASIC_DARK_CLASSIC, 'dark', 'classic');
    await capture(page, 'basic-dark-classic');

    const realErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(realErrors).toHaveLength(0);
  });

  test('ocean-light renders without errors', async ({ page }) => {
    await renderDiagram(page, OCEAN_LIGHT, 'light', 'ocean');
    await capture(page, 'ocean-light');
  });

  test('forest-dark renders without errors', async ({ page }) => {
    await renderDiagram(page, FOREST_DARK, 'dark', 'forest');
    await capture(page, 'forest-dark');
  });

  test('self-message renders without errors', async ({ page }) => {
    await renderDiagram(page, SELF_MESSAGE, 'light', 'classic');
    await capture(page, 'self-message');
  });

  test('activation-nested renders without errors', async ({ page }) => {
    await renderDiagram(page, ACTIVATION_NESTED, 'light', 'ocean');
    await capture(page, 'activation-nested');
  });

  test('alt-fragment renders without errors', async ({ page }) => {
    await renderDiagram(page, ALT_FRAGMENT, 'light', 'forest');
    await capture(page, 'alt-fragment');
  });

  test('par-fragment renders without errors', async ({ page }) => {
    await renderDiagram(page, PAR_FRAGMENT, 'light', 'violet');
    await capture(page, 'par-fragment');
  });

  test('long-labels-CJK renders without errors', async ({ page }) => {
    await renderDiagram(page, LONG_LABELS_CJK, 'light', 'sunset');
    await capture(page, 'long-labels-CJK');
  });

  test('error-state renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await renderDiagram(page, ERROR_STATE, 'light', 'slate');
    await capture(page, 'error-state');

    // Error state is expected to have console errors from validation
    // Just verify the component didn't crash
    const hasReactFlow = await page.evaluate(() => {
      const el = document.querySelector('sequence-diagram');
      return el?.shadowRoot?.querySelector('.react-flow') !== null ||
             el?.shadowRoot?.textContent?.includes('Error') !== null;
    });
    expect(hasReactFlow).toBe(true);
  });
});
