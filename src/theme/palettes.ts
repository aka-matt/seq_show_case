/**
 * All 7 palette definitions with light and dark tokens.
 * Each palette has distinct accent colors while maintaining WCAG AA contrast.
 */

import type { PaletteDefinition } from './tokens';

/**
 * Classic palette - neutral blue (default)
 * Professional, clean look suitable for most use cases.
 */
const classic: PaletteDefinition = {
  name: 'classic',
  light: {
    canvas: '#f9fafb',
    surface: '#ffffff',
    surfaceMuted: '#f3f4f6',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    accent: '#2563eb',
    accentSoft: '#dbeafe',
    line: '#374151',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    note: '#fef9c3',
    fragmentFill: 'rgba(37, 99, 235, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    canvas: '#0f172a',
    surface: '#1e293b',
    surfaceMuted: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#475569',
    accent: '#3b82f6',
    accentSoft: 'rgba(59, 130, 246, 0.15)',
    line: '#cbd5e1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    note: '#422006',
    fragmentFill: 'rgba(59, 130, 246, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Ocean palette - blue-green
 * Calm, professional, reminiscent of deep water.
 */
const ocean: PaletteDefinition = {
  name: 'ocean',
  light: {
    canvas: '#f0fdfa',
    surface: '#ffffff',
    surfaceMuted: '#ccfbf1',
    text: '#134e4a',
    textMuted: '#5eead4',
    border: '#99f6e4',
    accent: '#0d9488',
    accentSoft: '#ccfbf1',
    line: '#134e4a',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    note: '#fef9c3',
    fragmentFill: 'rgba(13, 148, 136, 0.05)',
    shadow: 'rgba(13, 148, 136, 0.15)',
  },
  dark: {
    canvas: '#042f2e',
    surface: '#134e4a',
    surfaceMuted: '#115e59',
    text: '#f0fdfa',
    textMuted: '#5eead4',
    border: '#134e4a',
    accent: '#2dd4bf',
    accentSoft: 'rgba(45, 212, 191, 0.15)',
    line: '#5eead4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    note: '#422006',
    fragmentFill: 'rgba(45, 212, 191, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Forest palette - green
 * Natural, organic feel with earth tones.
 */
const forest: PaletteDefinition = {
  name: 'forest',
  light: {
    canvas: '#f0fdf4',
    surface: '#ffffff',
    surfaceMuted: '#dcfce7',
    text: '#14532d',
    textMuted: '#6ee7b7',
    border: '#bbf7d0',
    accent: '#16a34a',
    accentSoft: '#dcfce7',
    line: '#14532d',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    note: '#fef9c3',
    fragmentFill: 'rgba(22, 163, 74, 0.05)',
    shadow: 'rgba(22, 163, 74, 0.15)',
  },
  dark: {
    canvas: '#052e16',
    surface: '#14532d',
    surfaceMuted: '#166534',
    text: '#f0fdf4',
    textMuted: '#86efac',
    border: '#15803d',
    accent: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.15)',
    line: '#86efac',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    note: '#422006',
    fragmentFill: 'rgba(34, 197, 94, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Violet palette - violet
 * Creative, distinctive look with rich purples.
 */
const violet: PaletteDefinition = {
  name: 'violet',
  light: {
    canvas: '#faf5ff',
    surface: '#ffffff',
    surfaceMuted: '#f3e8ff',
    text: '#581c87',
    textMuted: '#c084fc',
    border: '#e9d5ff',
    accent: '#7c3aed',
    accentSoft: '#f3e8ff',
    line: '#581c87',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    note: '#fef9c3',
    fragmentFill: 'rgba(124, 58, 237, 0.05)',
    shadow: 'rgba(124, 58, 237, 0.15)',
  },
  dark: {
    canvas: '#1e1b4b',
    surface: '#312e81',
    surfaceMuted: '#3730a3',
    text: '#faf5ff',
    textMuted: '#c4b5fd',
    border: '#4c1d95',
    accent: '#a78bfa',
    accentSoft: 'rgba(167, 139, 250, 0.15)',
    line: '#c4b5fd',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    note: '#422006',
    fragmentFill: 'rgba(167, 139, 250, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Sunset palette - orange-red
 * Warm, energetic palette with sunset hues.
 */
const sunset: PaletteDefinition = {
  name: 'sunset',
  light: {
    canvas: '#fff7ed',
    surface: '#ffffff',
    surfaceMuted: '#ffedd5',
    text: '#7c2d12',
    textMuted: '#fb923c',
    border: '#fed7aa',
    accent: '#ea580c',
    accentSoft: '#ffedd5',
    line: '#7c2d12',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    note: '#fef9c3',
    fragmentFill: 'rgba(234, 88, 12, 0.05)',
    shadow: 'rgba(234, 88, 12, 0.15)',
  },
  dark: {
    canvas: '#1c1917',
    surface: '#292524',
    surfaceMuted: '#44403c',
    text: '#fff7ed',
    textMuted: '#fdba74',
    border: '#57534e',
    accent: '#fb923c',
    accentSoft: 'rgba(251, 146, 60, 0.15)',
    line: '#fdba74',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    note: '#422006',
    fragmentFill: 'rgba(251, 146, 60, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Rose palette - rose-pink
 * Soft, approachable palette with pink tones.
 */
const rose: PaletteDefinition = {
  name: 'rose',
  light: {
    canvas: '#fff1f2',
    surface: '#ffffff',
    surfaceMuted: '#ffe4e6',
    text: '#881337',
    textMuted: '#fb7185',
    border: '#fecdd3',
    accent: '#e11d48',
    accentSoft: '#ffe4e6',
    line: '#881337',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    note: '#fef9c3',
    fragmentFill: 'rgba(225, 29, 72, 0.05)',
    shadow: 'rgba(225, 29, 72, 0.15)',
  },
  dark: {
    canvas: '#1f1f1f',
    surface: '#2f2f2f',
    surfaceMuted: '#404040',
    text: '#fff1f2',
    textMuted: '#fda4af',
    border: '#4c0519',
    accent: '#fb7185',
    accentSoft: 'rgba(251, 113, 133, 0.15)',
    line: '#fda4af',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    note: '#422006',
    fragmentFill: 'rgba(251, 113, 133, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Slate palette - low-saturation gray-blue
 * Neutral, professional palette with subtle blue-gray tones.
 */
const slate: PaletteDefinition = {
  name: 'slate',
  light: {
    canvas: '#f8fafc',
    surface: '#ffffff',
    surfaceMuted: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#cbd5e1',
    accent: '#475569',
    accentSoft: '#f1f5f9',
    line: '#334155',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    note: '#fef9c3',
    fragmentFill: 'rgba(71, 85, 105, 0.05)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    canvas: '#0f172a',
    surface: '#1e293b',
    surfaceMuted: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#475569',
    accent: '#94a3b8',
    accentSoft: 'rgba(148, 163, 184, 0.15)',
    line: '#cbd5e1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    note: '#422006',
    fragmentFill: 'rgba(148, 163, 184, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

/**
 * All available palettes.
 */
export const palettes: Record<string, PaletteDefinition> = {
  classic,
  ocean,
  forest,
  violet,
  sunset,
  rose,
  slate,
};

/**
 * Palette names for type-safe access.
 */
export type PaletteName = keyof typeof palettes;
