/**
 * Verifies that the custom element correctly loads data from:
 *   1. A child <script type="application/json">
 *   2. The data property setter (post-upgrade)
 *   3. A pre-upgrade own-property data assignment (shadowing recovery)
 *   4. Sibling scripts are intentionally NOT loaded
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { SequenceDiagramElement } from '../../src/web-component/SequenceDiagramElement';

const SAMPLE = {
  schemaVersion: '1.0' as const,
  participants: [
    { id: 'a', label: 'Alice' },
    { id: 'b', label: 'Bob' },
  ],
  events: [
    {
      id: 'm1',
      type: 'message' as const,
      from: 'a',
      to: 'b',
      label: 'Hi',
      messageKind: 'sync' as const,
    },
  ],
};

beforeAll(() => {
  // jsdom stubs required by the theme resolver + ResizeObserver lifecycle
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  // @ts-expect-error test stub
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // CSSStyleSheet.adoptedStyleSheets support is partial in jsdom — force style fallback
  if (typeof CSSStyleSheet === 'undefined') {
    // @ts-expect-error test stub
    global.CSSStyleSheet = class {
      replaceSync() {}
    };
  }

  if (!customElements.get('sequence-diagram')) {
    customElements.define('sequence-diagram', SequenceDiagramElement);
  }
});

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SequenceDiagramElement data loading', () => {
  it('loads data from a child application/json script', async () => {
    const host = document.createElement('sequence-diagram') as SequenceDiagramElement;
    host.setAttribute('height', '360px');
    const script = document.createElement('script');
    script.type = 'application/json';
    script.textContent = JSON.stringify(SAMPLE);
    host.appendChild(script);
    document.body.appendChild(host);

    await new Promise((r) => setTimeout(r, 50));

    expect(host.data).not.toBeNull();
    expect((host.data as typeof SAMPLE).participants).toHaveLength(2);

    const text = host.shadowRoot?.textContent ?? '';
    expect(text).not.toMatch(/No sequence data/);
  });

  it('applies data set via the property after upgrade', async () => {
    const host = document.createElement('sequence-diagram') as SequenceDiagramElement;
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 20));

    host.data = SAMPLE;
    await new Promise((r) => setTimeout(r, 50));

    expect(host.data).not.toBeNull();
    const text = host.shadowRoot?.textContent ?? '';
    expect(text).not.toMatch(/No sequence data/);
  });

  it('recovers data that was set before the element upgraded', async () => {
    const host = document.createElement('sequence-diagram') as SequenceDiagramElement;
    // Simulate a pre-upgrade own-property assignment, then reconnect.
    host.remove();
    Object.defineProperty(host, 'data', {
      value: SAMPLE,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    document.body.appendChild(host);
    await new Promise((r) => setTimeout(r, 50));

    expect(Object.prototype.hasOwnProperty.call(host, 'data')).toBe(false);
    expect(host.data).not.toBeNull();
    expect((host.data as typeof SAMPLE).participants?.[0]?.id).toBe('a');
  });

  it('does NOT find a sibling script (only children)', async () => {
    const wrap = document.createElement('div');
    const host = document.createElement('sequence-diagram') as SequenceDiagramElement;
    const script = document.createElement('script');
    script.type = 'application/json';
    script.textContent = JSON.stringify(SAMPLE);
    wrap.appendChild(host);
    wrap.appendChild(script); // sibling, not child — must be ignored
    document.body.appendChild(wrap);
    await new Promise((r) => setTimeout(r, 50));

    expect(host.data).toBeNull();
    const text = host.shadowRoot?.textContent ?? '';
    expect(text).toMatch(/No sequence data/);
  });
});
