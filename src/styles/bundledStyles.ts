import placeholderStyles from './placeholder.css?inline';

// React Flow base styles (minimal subset needed for rendering)
const reactFlowBaseStyles = `
.react-flow {
  position: absolute;
  width: 100%;
  height: 100%;
}
.react-flow__renderer {
  width: 100%;
  height: 100%;
}
.react-flow__container {
  width: 100%;
  height: 100%;
}
`;

/**
 * Applies bundled styles to Shadow DOM
 * Uses adoptedStyleSheets where supported, with style element fallback
 */
export function applyStyles(shadowRoot: ShadowRoot): void {
  // Combine all styles
  const allStyles = `${placeholderStyles}\n${reactFlowBaseStyles}`;

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
