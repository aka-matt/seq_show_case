// Import React Flow base styles - this is inlined at build time
// The ?inline query loads the CSS as a string instead of injecting it
import rfStyles from '@xyflow/react/dist/style.css?inline';

// React Flow defaults are light-only. Keep its chrome on the same palette as
// the diagram, including controls, minimap, and the attribution badge.
const themedReactFlowStyles = `
.react-flow__controls {
  background: var(--sd-surface);
  border: 1px solid var(--sd-border);
  box-shadow: 0 1px 4px var(--sd-shadow);
}

.react-flow__controls-button {
  background: var(--sd-surface);
  border-bottom-color: var(--sd-border);
  color: var(--sd-text);
  fill: var(--sd-text);
}

.react-flow__controls-button:hover {
  background: var(--sd-surface-muted);
}

.react-flow__controls-button svg,
.react-flow__controls-button svg path {
  fill: currentColor;
}

.react-flow__attribution {
  background: color-mix(in srgb, var(--sd-surface) 88%, transparent);
  color: var(--sd-text-muted);
}

.react-flow__attribution a {
  color: var(--sd-text-muted);
}

.react-flow__attribution a:hover {
  color: var(--sd-accent);
}

.react-flow__minimap {
  background: var(--sd-surface);
  border: 1px solid var(--sd-border);
}
`;

// Combine all styles
const allStyles = `${rfStyles}\n${themedReactFlowStyles}`;

/**
 * Applies bundled styles to Shadow DOM
 * Uses adoptedStyleSheets where supported, with style element fallback
 */
export function applyStyles(shadowRoot: ShadowRoot): void {
  // Try using adoptedStyleSheets (modern browsers)
  if (shadowRoot.adoptedStyleSheets !== undefined) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(allStyles);
    shadowRoot.adoptedStyleSheets = [sheet];
  } else {
    // Fallback: create style element
    const style = document.createElement('style');
    style.textContent = allStyles;
    shadowRoot.appendChild(style);
  }
}

// Export the CSS string for external use (e.g., testing)
export { allStyles as bundledStyles };
