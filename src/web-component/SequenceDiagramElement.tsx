import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { applyStyles } from '../styles/bundledStyles';
import { validateData } from '../model/validation';
import { normalize } from '../model/normalizer';
import { layoutSequence } from '../layout/layoutSequence';
import { SequenceFlow } from '../react-flow/SequenceFlow';
import type { SequenceDiagramData } from '../model/public-types';
import type { LayoutResult } from '../layout/layout-types';
import type { ValidationResult } from '../model/validation-types';

/**
 * Sequence Diagram Web Component
 * Phase 3: Wires data → validate → normalize → layout → React Flow
 */
export class SequenceDiagramElement extends HTMLElement {
  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;
  private currentData: SequenceDiagramData | null = null;
  private currentLayout: LayoutResult | null = null;
  private currentValidation: ValidationResult | null = null;

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
    this.renderDiagram();
  }

  disconnectedCallback(): void {
    // Cleanup React root
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.mountPoint = null;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Sets the diagram data (object or JSON string)
   */
  set data(value: SequenceDiagramData | string | null) {
    if (value === null) {
      this.currentData = null;
      this.currentLayout = null;
      this.currentValidation = null;
      this.renderDiagram();
      return;
    }

    try {
      const data = typeof value === 'string' ? JSON.parse(value) : value;
      this.currentData = data;
      this.processData(data);
    } catch (err) {
      console.error('Failed to parse diagram data:', err);
      this.currentData = null;
      this.currentLayout = null;
      this.currentValidation = {
        valid: false,
        errors: [
          {
            code: 'INVALID_JSON',
            message: err instanceof Error ? err.message : 'Failed to parse JSON',
          },
        ],
        warnings: [],
      };
    }

    this.renderDiagram();
  }

  get data(): SequenceDiagramData | string | null {
    return this.currentData;
  }

  /**
   * Validates data without setting it
   */
  validateData(input?: unknown): ValidationResult {
    return validateData(input ?? this.currentData);
  }

  /**
   * Gets current validation result
   */
  get validationErrors(): ValidationResult['errors'] {
    return this.currentValidation?.errors ?? [];
  }

  get validationWarnings(): ValidationResult['warnings'] {
    return this.currentValidation?.warnings ?? [];
  }

  /**
   * Triggers a re-render with current data
   */
  refresh(): void {
    if (this.currentData) {
      this.processData(this.currentData);
    }
    this.renderDiagram();
  }

  /**
   * Fits the view to the diagram content
   */
  fitView(_options?: { padding?: number; duration?: number }): void {
    // React Flow handles fitView internally via its configuration
    // The SequenceFlow component has fitView: true by default
    this.refresh();
  }

  /**
   * Resets the viewport (centers diagram)
   */
  resetView(): void {
    this.refresh();
  }

  // -------------------------------------------------------------------------
  // Private methods
  // -------------------------------------------------------------------------

  private processData(data: SequenceDiagramData): void {
    // Step 1: Validate
    this.currentValidation = validateData(data);

    if (!this.currentValidation.valid) {
      this.currentLayout = null;
      return;
    }

    // Step 2: Normalize
    const normalized = normalize(data);

    // Step 3: Layout
    this.currentLayout = layoutSequence(normalized);
  }

  private renderDiagram(): void {
    if (!this.root || !this.mountPoint) {
      return;
    }

    const isLoading = false;
    const hasErrors = this.currentValidation && !this.currentValidation.valid;

    let content: React.ReactNode;

    if (hasErrors && !this.currentLayout) {
      // Show validation errors
      const errors = this.currentValidation?.errors ?? [];
      content = (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            background: '#fef2f2',
            color: '#991b1b',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
            Validation Errors
          </h3>
          <ul style={{ margin: 0, padding: '0 20px', textAlign: 'left', fontSize: 13 }}>
            {errors.map((err, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (!this.currentData) {
      content = (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
            color: '#6b7280',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
          }}
        >
          No diagram data provided
        </div>
      );
    } else {
      content = (
        <SequenceFlow
          layoutResult={this.currentLayout}
          isLoading={isLoading}
          onNodeClick={this.handleNodeClick.bind(this)}
          onEdgeClick={this.handleEdgeClick.bind(this)}
          onViewportChange={this.handleViewportChange.bind(this)}
        />
      );
    }

    this.root.render(content);
  }

  private handleNodeClick(_event: React.MouseEvent, node: { id: string }): void {
    // Dispatch custom event for participant click
    const participantId = node.id.replace('participant-', '');
    this.dispatchEvent(
      new CustomEvent('sequence-participant-click', {
        bubbles: true,
        composed: true,
        detail: { participantId },
      })
    );
  }

  private handleEdgeClick(_event: React.MouseEvent, edge: { id: string }): void {
    // Dispatch custom event for message click
    const eventId = edge.id.replace('edge-', '');
    this.dispatchEvent(
      new CustomEvent('sequence-message-click', {
        bubbles: true,
        composed: true,
        detail: { eventId },
      })
    );
  }

  private handleViewportChange(viewport: { x: number; y: number; zoom: number }): void {
    this.dispatchEvent(
      new CustomEvent('sequence-viewport-change', {
        bubbles: true,
        composed: true,
        detail: viewport,
      })
    );
  }
}
