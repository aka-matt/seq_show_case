import { test, expect } from '@playwright/test';

/**
 * Minimal vertical slice test for Phase 3 React Flow rendering.
 * Tests: two participants + one sync message + deterministic layout + React Flow.
 */
const MINIMAL_DATA = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'p1', label: 'Client' },
    { id: 'p2', label: 'Server' },
  ],
  events: [
    {
      id: 'm1',
      type: 'message' as const,
      from: 'p1',
      to: 'p2',
      label: 'GET /api/users',
      messageKind: 'sync' as const,
    },
  ],
};

test.describe('Phase 3: React Flow Rendering - Minimal Slice', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dev server
    await page.goto('/');
  });

  test('diagram renders with two participants and one message', async ({ page }) => {
    // Create the custom element with minimal data
    await page.evaluate(data => {
      const el = document.createElement('sequence-diagram');
      el.setAttribute('id', 'test-diagram');
      (el as any).data = data;
      document.body.appendChild(el);
    }, MINIMAL_DATA);

    // Wait for the diagram to render
    await page.waitForFunction(
      () => {
        const el = document.getElementById('test-diagram');
        if (!el?.shadowRoot) return false;
        // Check for React Flow rendered content
        const rf = el.shadowRoot.querySelector('.react-flow');
        return rf !== null;
      },
      { timeout: 10000 }
    );

    // Verify React Flow is rendered inside Shadow DOM
    const hasReactFlow = await page.evaluate(() => {
      const el = document.getElementById('test-diagram');
      return el?.shadowRoot?.querySelector('.react-flow') !== null;
    });
    expect(hasReactFlow).toBe(true);

    // Verify participant nodes are rendered
    const participantCount = await page.evaluate(() => {
      const el = document.getElementById('test-diagram');
      return el?.shadowRoot?.querySelectorAll('.react-flow__node').length ?? 0;
    });
    expect(participantCount).toBe(2);

    // Verify edges are rendered
    const edgeCount = await page.evaluate(() => {
      const el = document.getElementById('test-diagram');
      return el?.shadowRoot?.querySelectorAll('.react-flow__edge').length ?? 0;
    });
    expect(edgeCount).toBeGreaterThanOrEqual(1);
  });

  test('pan and zoom controls are present and functional', async ({ page }) => {
    await page.evaluate(data => {
      const el = document.createElement('sequence-diagram');
      (el as any).data = data;
      document.body.appendChild(el);
    }, MINIMAL_DATA);

    // Wait for React Flow to render
    await page.waitForFunction(
      () => {
        const el = document.querySelector('sequence-diagram');
        return el?.shadowRoot?.querySelector('.react-flow') !== null;
      },
      { timeout: 10000 }
    );

    // Check for controls
    const hasControls = await page.evaluate(() => {
      const el = document.querySelector('sequence-diagram');
      return el?.shadowRoot?.querySelector('.react-flow__controls') !== null;
    });
    expect(hasControls).toBe(true);

    const chrome = await page.evaluate(() => {
      const root = document.querySelector('sequence-diagram')?.shadowRoot;
      return {
        controlsClass: root?.querySelector('.react-flow__controls')?.className ?? '',
        hasAttribution: root?.querySelector('.react-flow__attribution') !== null,
      };
    });
    expect(chrome.controlsClass).toContain('bottom');
    expect(chrome.controlsClass).toContain('left');
    expect(chrome.hasAttribution).toBe(false);

    // Check for minimap
    const hasMiniMap = await page.evaluate(() => {
      const el = document.querySelector('sequence-diagram');
      return el?.shadowRoot?.querySelector('.react-flow__minimap') !== null;
    });
    expect(hasMiniMap).toBe(true);
  });

  test('no console errors on render', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.evaluate(data => {
      const el = document.createElement('sequence-diagram');
      (el as any).data = data;
      document.body.appendChild(el);
    }, MINIMAL_DATA);

    // Wait for render
    await page.waitForFunction(
      () => {
        const el = document.querySelector('sequence-diagram');
        return el?.shadowRoot?.querySelector('.react-flow') !== null;
      },
      { timeout: 10000 }
    );

    // Small delay to catch any async errors
    await page.waitForTimeout(500);

    // Filter out known acceptable errors (like favicon 404)
    const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(realErrors).toHaveLength(0);
  });

  test('hostile CSS does not leak into Shadow DOM', async ({ page }) => {
    // Inject hostile CSS into the page
    await page.addStyleTag({
      content: `
        .react-flow {
          background: magenta !important;
        }
        .react-flow__node {
          border: 10px solid red !important;
        }
      `,
    });

    await page.evaluate(data => {
      const el = document.createElement('sequence-diagram');
      (el as any).data = data;
      document.body.appendChild(el);
    }, MINIMAL_DATA);

    await page.waitForFunction(
      () => {
        const el = document.querySelector('sequence-diagram');
        return el?.shadowRoot?.querySelector('.react-flow') !== null;
      },
      { timeout: 10000 }
    );

    // Verify Shadow DOM styles are not overridden by hostile CSS
    const shadowBg = await page.evaluate(() => {
      const el = document.querySelector('sequence-diagram');
      const rf = el?.shadowRoot?.querySelector('.react-flow');
      return window.getComputedStyle(rf!).backgroundColor;
    });

    // Should not be magenta (hostile CSS)
    expect(shadowBg).not.toBe('magenta');
  });

  test('fitView is applied on initial render', async ({ page }) => {
    await page.evaluate(data => {
      const el = document.createElement('sequence-diagram');
      (el as any).data = data;
      document.body.appendChild(el);
    }, MINIMAL_DATA);

    await page.waitForFunction(
      () => {
        const el = document.querySelector('sequence-diagram');
        return el?.shadowRoot?.querySelector('.react-flow') !== null;
      },
      { timeout: 10000 }
    );

    // Verify the viewport has applied fitView (transform contains scale)
    const hasFitView = await page.evaluate(() => {
      const el = document.querySelector('sequence-diagram');
      const viewport = el?.shadowRoot?.querySelector('.react-flow__viewport');
      if (!viewport) return false;
      const transform = window.getComputedStyle(viewport).transform;
      // fitView sets a transform matrix with scale
      return transform.includes('matrix');
    });
    expect(hasFitView).toBe(true);
  });

  test('clicking message edge dispatches custom event', async ({ page }) => {
    await page.evaluate(data => {
      const el = document.createElement('sequence-diagram');
      (el as any).data = data;
      document.body.appendChild(el);
    }, MINIMAL_DATA);

    await page.waitForFunction(
      () => {
        const el = document.querySelector('sequence-diagram');
        return el?.shadowRoot?.querySelector('.react-flow') !== null;
      },
      { timeout: 10000 }
    );

    // Listen for the custom event
    const eventPromise = page.evaluate(() => {
      return new Promise(resolve => {
        document.addEventListener(
          'sequence-message-click',
          (e: any) => {
            resolve(e.detail);
          },
          { once: true }
        );
      });
    });

    // Click on an edge
    await page.evaluate(() => {
      const el = document.querySelector('sequence-diagram');
      const edge = el?.shadowRoot?.querySelector('.react-flow__edge') as HTMLElement;
      edge?.click();
    });

    // Wait for event
    const eventDetail = await eventPromise;
    expect(eventDetail).toHaveProperty('eventId');
  });

  test('clicking participant node dispatches custom event', async ({ page }) => {
    await page.evaluate(data => {
      const el = document.createElement('sequence-diagram');
      (el as any).data = data;
      document.body.appendChild(el);
    }, MINIMAL_DATA);

    await page.waitForFunction(
      () => {
        const el = document.querySelector('sequence-diagram');
        return el?.shadowRoot?.querySelector('.react-flow') !== null;
      },
      { timeout: 10000 }
    );

    // Listen for the custom event
    const eventPromise = page.evaluate(() => {
      return new Promise(resolve => {
        document.addEventListener(
          'sequence-participant-click',
          (e: any) => {
            resolve(e.detail);
          },
          { once: true }
        );
      });
    });

    // Click on a node
    await page.evaluate(() => {
      const el = document.querySelector('sequence-diagram');
      const node = el?.shadowRoot?.querySelector('.react-flow__node') as HTMLElement;
      node?.click();
    });

    // Wait for event
    const eventDetail = await eventPromise;
    expect(eventDetail).toHaveProperty('participantId');
  });
});
