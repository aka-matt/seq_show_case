// Import React Flow base styles - this is inlined at build time
// The ?inline query loads the CSS as a string instead of injecting it
import rfBaseStyles from '@xyflow/react/dist/base.css?inline';

// Combine all styles
const allStyles = rfBaseStyles;

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
