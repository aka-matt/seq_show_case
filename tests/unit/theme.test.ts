/**
 * Unit tests for the theme system.
 * Tests palette tokens, theme resolution, and applyTheme.
 */

import { describe, it, expect, vi } from 'vitest';
import { palettes, type PaletteName } from '../../src/theme/palettes';
import {
  resolveMode,
  resolveTheme,
  getPalette,
  prefersDarkColorScheme,
  prefersReducedMotion,
  onSystemThemeChange,
  onReducedMotionChange,
} from '../../src/theme/themeResolver';
import {
  applyTheme,
  removeTheme,
  buildThemeCSS,
  getAppliedTheme,
} from '../../src/theme/applyTheme';
import type { PaletteTokens } from '../../src/theme/tokens';

// ---------------------------------------------------------------------------
// MatchMedia mocking for jsdom environment
// ---------------------------------------------------------------------------

const mockMatchMedia = (matches: boolean) => {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  return {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, handler: (e: { matches: boolean }) => void) => {
      listeners.push(handler);
    },
    removeEventListener: (_: string, handler: (e: { matches: boolean }) => void) => {
      const index = listeners.indexOf(handler);
      if (index > -1) listeners.splice(index, 1);
    },
    dispatchEvent: (_: Event) => true,
    _trigger: (m: boolean) => listeners.forEach(l => l({ matches: m })),
  };
};

describe('palettes', () => {
  const REQUIRED_TOKENS: (keyof PaletteTokens)[] = [
    'canvas',
    'surface',
    'surfaceMuted',
    'text',
    'textMuted',
    'border',
    'accent',
    'accentSoft',
    'line',
    'success',
    'warning',
    'error',
    'note',
    'fragmentFill',
    'shadow',
  ];

  const ALL_PALETTE_NAMES: PaletteName[] = [
    'classic',
    'ocean',
    'forest',
    'violet',
    'sunset',
    'rose',
    'slate',
  ];

  it('has all 7 palette names', () => {
    expect(Object.keys(palettes)).toHaveLength(7);
    for (const name of ALL_PALETTE_NAMES) {
      expect(palettes[name]).toBeDefined();
    }
  });

  it('each palette has light and dark tokens', () => {
    for (const name of ALL_PALETTE_NAMES) {
      const palette = palettes[name]!;
      expect(palette.light).toBeDefined();
      expect(palette.dark).toBeDefined();
    }
  });

  it('each palette has all required tokens in both modes', () => {
    for (const name of ALL_PALETTE_NAMES) {
      const palette = palettes[name]!;
      for (const token of REQUIRED_TOKENS) {
        expect(palette.light[token]).toBeDefined();
        expect(palette.dark[token]).toBeDefined();
        expect(typeof palette.light[token]).toBe('string');
        expect(typeof palette.dark[token]).toBe('string');
      }
    }
  });

  it('light and dark tokens are different for each palette', () => {
    for (const name of ALL_PALETTE_NAMES) {
      const palette = palettes[name]!;
      // At least the canvas should be different between light and dark
      expect(palette.light.canvas).not.toBe(palette.dark.canvas);
    }
  });

  it('token values are valid hex colors or rgba strings', () => {
    const colorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgba?\(/;

    for (const name of ALL_PALETTE_NAMES) {
      const palette = palettes[name]!;
      for (const mode of ['light', 'dark'] as const) {
        const tokens = palette[mode];
        for (const token of REQUIRED_TOKENS) {
          const value = tokens[token];
          // Should be a valid color string
          expect(value).toMatch(colorRegex);
        }
      }
    }
  });

  describe('classic palette defaults', () => {
    it('has expected light mode values', () => {
      const classic = palettes.classic!;
      expect(classic.light.canvas).toBe('#f9fafb');
      expect(classic.light.surface).toBe('#ffffff');
      expect(classic.light.accent).toBe('#2563eb');
      expect(classic.light.success).toBe('#059669');
      expect(classic.light.warning).toBe('#d97706');
      expect(classic.light.error).toBe('#dc2626');
    });

    it('has expected dark mode values', () => {
      const classic = palettes.classic!;
      expect(classic.dark.canvas).toBe('#0f172a');
      expect(classic.dark.surface).toBe('#1e293b');
      expect(classic.dark.accent).toBe('#3b82f6');
      expect(classic.dark.success).toBe('#10b981');
      expect(classic.dark.warning).toBe('#f59e0b');
      expect(classic.dark.error).toBe('#ef4444');
    });
  });
});

// ---------------------------------------------------------------------------
// Theme resolution
// ---------------------------------------------------------------------------

describe('resolveMode', () => {
  it('returns light for light mode', () => {
    expect(resolveMode('light')).toBe('light');
  });

  it('returns dark for dark mode', () => {
    expect(resolveMode('dark')).toBe('dark');
  });

  it('resolves system to current color scheme', () => {
    // Mock window.matchMedia for this test
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMatchMedia(false)),
    });

    try {
      const result = resolveMode('system');
      // Should be either light or dark depending on system
      expect(result === 'light' || result === 'dark').toBe(true);
    } finally {
      // Restore original
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});

describe('getPalette', () => {
  it('returns palette by name', () => {
    const ocean = getPalette('ocean');
    expect(ocean.name).toBe('ocean');
  });

  it('returns classic for unknown palette names', () => {
    const unknown = getPalette('nonexistent');
    expect(unknown.name).toBe('classic');
  });

  it('returns classic for empty string', () => {
    const empty = getPalette('');
    expect(empty.name).toBe('classic');
  });
});

describe('resolveTheme', () => {
  it('resolves light mode with classic palette', () => {
    const result = resolveTheme('light', 'classic');
    expect(result.mode).toBe('light');
    expect(result.palette.name).toBe('classic');
    expect(result.tokens).toBe(palettes.classic!.light);
  });

  it('resolves dark mode with classic palette', () => {
    const result = resolveTheme('dark', 'classic');
    expect(result.mode).toBe('dark');
    expect(result.palette.name).toBe('classic');
    expect(result.tokens).toBe(palettes.classic!.dark);
  });

  it('resolves system mode to actual mode', () => {
    // Mock window.matchMedia for this test
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMatchMedia(false)),
    });

    try {
      const result = resolveTheme('system', 'classic');
      expect(result.mode === 'light' || result.mode === 'dark').toBe(true);
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    }
  });

  it('resolves any palette name', () => {
    for (const name of ['ocean', 'forest', 'violet', 'sunset', 'rose', 'slate'] as PaletteName[]) {
      const result = resolveTheme('light', name);
      expect(result.palette.name).toBe(name);
    }
  });

  it('falls back to classic for unknown palette', () => {
    const result = resolveTheme('light', 'unknown');
    expect(result.palette.name).toBe('classic');
  });

  it('resolves to classic.light tokens for light mode', () => {
    const result = resolveTheme('light', 'classic');
    expect(result.tokens).toBe(palettes.classic!.light);
  });
});

// ---------------------------------------------------------------------------
// System preference detection
// ---------------------------------------------------------------------------

describe('prefersDarkColorScheme', () => {
  it('returns a boolean', () => {
    // Mock window.matchMedia for this test
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMatchMedia(true)),
    });

    try {
      const result = prefersDarkColorScheme();
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});

describe('prefersReducedMotion', () => {
  it('returns a boolean', () => {
    // Mock window.matchMedia for this test
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMatchMedia(true)),
    });

    try {
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Theme change listeners
// ---------------------------------------------------------------------------

describe('onSystemThemeChange', () => {
  it('returns a cleanup function', () => {
    // Mock window.matchMedia for this test
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMatchMedia(false)),
    });

    try {
      const cleanup = onSystemThemeChange(() => {});
      expect(typeof cleanup).toBe('function');
      cleanup();
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});

describe('onReducedMotionChange', () => {
  it('returns a cleanup function', () => {
    // Mock window.matchMedia for this test
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMatchMedia(false)),
    });

    try {
      const cleanup = onReducedMotionChange(() => {});
      expect(typeof cleanup).toBe('function');
      cleanup();
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// applyTheme
// ---------------------------------------------------------------------------

describe('applyTheme', () => {
  it('applies CSS variables to host element', () => {
    const host = document.createElement('div');
    applyTheme({ host, mode: 'light', palette: 'classic' });

    expect(host.style.getPropertyValue('--sd-canvas')).toBe('#f9fafb');
    expect(host.style.getPropertyValue('--sd-surface')).toBe('#ffffff');
    expect(host.style.getPropertyValue('--sd-accent')).toBe('#2563eb');
  });

  it('sets data attributes for theme and palette', () => {
    const host = document.createElement('div');
    applyTheme({ host, mode: 'dark', palette: 'ocean' });

    expect(host.dataset.theme).toBe('dark');
    expect(host.dataset.palette).toBe('ocean');
    expect(host.style.colorScheme).toBe('dark');
  });

  it('applies dark tokens when mode is dark', () => {
    const host = document.createElement('div');
    applyTheme({ host, mode: 'dark', palette: 'classic' });

    expect(host.style.getPropertyValue('--sd-canvas')).toBe('#0f172a');
    expect(host.style.getPropertyValue('--sd-surface')).toBe('#1e293b');
  });

  it('applies different accent for different palettes', () => {
    const classicHost = document.createElement('div');
    const oceanHost = document.createElement('div');

    applyTheme({ host: classicHost, mode: 'light', palette: 'classic' });
    applyTheme({ host: oceanHost, mode: 'light', palette: 'ocean' });

    expect(classicHost.style.getPropertyValue('--sd-accent')).toBe('#2563eb');
    expect(oceanHost.style.getPropertyValue('--sd-accent')).toBe('#0d9488');
  });

  it('applies host overrides', () => {
    const host = document.createElement('div');
    applyTheme({
      host,
      mode: 'light',
      palette: 'classic',
      hostOverrides: { '--sd-accent': '#ff0000' },
    });

    expect(host.style.getPropertyValue('--sd-accent')).toBe('#ff0000');
  });
});

describe('removeTheme', () => {
  it('removes CSS variables from host', () => {
    const host = document.createElement('div');
    applyTheme({ host, mode: 'light', palette: 'classic' });
    removeTheme(host);

    expect(host.style.colorScheme).toBe('');

    expect(host.style.getPropertyValue('--sd-canvas')).toBe('');
    expect(host.style.getPropertyValue('--sd-accent')).toBe('');
  });

  it('removes data attributes', () => {
    const host = document.createElement('div');
    applyTheme({ host, mode: 'light', palette: 'classic' });
    removeTheme(host);

    expect(host.dataset.theme).toBeUndefined();
    expect(host.dataset.palette).toBeUndefined();
  });
});

describe('getAppliedTheme', () => {
  it('returns applied CSS variable values', () => {
    const host = document.createElement('div');
    applyTheme({ host, mode: 'light', palette: 'classic' });

    const applied = getAppliedTheme(host);
    expect(applied['--sd-canvas']).toBe('#f9fafb');
    expect(applied['--sd-accent']).toBe('#2563eb');
  });
});

describe('buildThemeCSS', () => {
  it('builds CSS string from tokens', () => {
    const tokens = palettes.classic!.light;
    const css = buildThemeCSS(tokens);

    expect(css).toContain('--sd-canvas: #f9fafb');
    expect(css).toContain('--sd-accent: #2563eb');
    expect(css).toContain(';');
  });

  it('includes extra variables', () => {
    const tokens = palettes.classic!.light;
    const css = buildThemeCSS(tokens, { '--custom': '#123456' });

    expect(css).toContain('--custom: #123456');
  });
});
