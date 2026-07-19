import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { HelloWorld } from '../app/HelloWorld';
import { applyStyles } from '../styles/bundledStyles';

/**
 * Minimal Sequence Diagram Web Component
 * Phase 0: Registers custom element, creates Shadow DOM, mounts React HelloWorld
 */
export class SequenceDiagramElement extends HTMLElement {
  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;

  static get observedAttributes(): string[] {
    return [];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Apply bundled styles to Shadow DOM
    applyStyles(this.shadowRoot);

    // Create mount point for React
    this.mountPoint = document.createElement('div');
    this.mountPoint.style.cssText = 'width: 100%; height: 100%;';
    this.shadowRoot.appendChild(this.mountPoint);

    // Mount React application
    this.root = createRoot(this.mountPoint);
    this.root.render(React.createElement(HelloWorld, { name: 'Sequence Diagram' }));
  }

  disconnectedCallback(): void {
    // Cleanup React root
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.mountPoint = null;
  }
}
