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
import {
  parseTheme,
  parsePalette,
  parseHeight,
  parseZoom,
  parseBoolean,
  parseAriaLabel,
  parseDataJson,
  serializeTheme,
  serializePalette,
  serializeBoolean,
  serializeZoom,
  ALL_OBSERVED_ATTRIBUTES,
  ATTR_THEME,
  ATTR_PALETTE,
  ATTR_HEIGHT,
  ATTR_MIN_ZOOM,
  ATTR_MAX_ZOOM,
  ATTR_CONTROLS,
  ATTR_MINIMAP,
  ATTR_FIT_VIEW,
  ATTR_INTERACTIVE,
  ATTR_SHOW_BACKGROUND,
  ATTR_ARIA_LABEL,
  ATTR_DATA_JSON,
  DEFAULT_CONFIG,
  type Theme,
  type PaletteName,
  type SequenceDiagramConfig,
} from './attributes';
import { applyTheme } from '../theme';
import {
  createSequenceReadyDispatcher,
  createSequenceRenderedDispatcher,
  createSequenceErrorDispatcher,
  createSequenceWarningDispatcher,
  createSequenceMessageClickDispatcher,
  createSequenceParticipantClickDispatcher,
  createSequenceFragmentClickDispatcher,
  createSequenceViewportChangeDispatcher,
  type SequenceReadyDetail,
} from './events';

/**
 * Sequence Diagram Web Component - Full API Implementation
 * Phase 5: Complete Web Component API with Shadow DOM
 */
export class SequenceDiagramElement extends HTMLElement {
  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;
  private currentData: SequenceDiagramData | null = null;
  private currentLayout: LayoutResult | null = null;
  private currentValidation: ValidationResult | null = null;
  private renderStartTime: number = 0;

  // Configuration state
  private _theme: Theme = 'system';
  private _palette: PaletteName = 'classic';
  private _height: string = '520px';
  private _minZoom: number = DEFAULT_CONFIG.minZoom;
  private _maxZoom: number = DEFAULT_CONFIG.maxZoom;
  private _controls: boolean = DEFAULT_CONFIG.controls;
  private _minimap: boolean = DEFAULT_CONFIG.minimap;
  private _fitView: boolean = DEFAULT_CONFIG.fitView;
  private _interactive: boolean = DEFAULT_CONFIG.interactive;
  private _showBackground: boolean = DEFAULT_CONFIG.showBackground;
  private _ariaLabel: string = DEFAULT_CONFIG.ariaLabel;

  // React Flow viewport ref for fitView/resetView
  private reactFlowInstance: { fitView: (options?: object) => void; setViewport: (viewport: object) => void } | null = null;

  // System theme listener
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

  // ResizeObserver for responsive containers
  private resizeObserver: ResizeObserver | null = null;

  // Lifecycle state
  private _isConnected: boolean = false;
  private initialDataLoaded: boolean = false;

  // -------------------------------------------------------------------------
  // Observed attributes
  // -------------------------------------------------------------------------

  static get observedAttributes(): string[] {
    return ALL_OBSERVED_ATTRIBUTES;
  }

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  connectedCallback(): void {
    this._isConnected = true;

    if (!this.shadowRoot) {
      return;
    }

    // Apply bundled styles to Shadow DOM
    applyStyles(this.shadowRoot);

    // Create mount point for React
    this.mountPoint = document.createElement('div');
    this.mountPoint.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
      position: relative;
    `;
    this.shadowRoot.appendChild(this.mountPoint);

    // Setup host styles
    this.applyHostStyles();

    // Mount React application
    this.root = createRoot(this.mountPoint);

    // Setup system theme listener
    this.setupSystemThemeListener();

    // Setup ResizeObserver for responsive containers
    this.setupResizeObserver();

    // Recover data that was set on the element before the custom element
    // upgraded. A pre-upgrade `el.data = …` creates an own property that
    // shadows the class accessor; delete it and re-apply via the setter so
    // the value reaches currentData / processData.
    const pendingData = this.consumePreUpgradeData();
    if (pendingData !== undefined) {
      this.data = pendingData;
    } else if (!this.currentData) {
      // No data yet — load from embedded <script type="application/json">
      // child or data-json attribute. Skip if the accessor already populated
      // currentData (e.g. host set `el.data` after upgrade but before connect).
      this.loadInitialData();
    }

    // Initial render (also covers the case where data was applied pre-connect
    // via the accessor — that path's renderDiagram no-ops without a root).
    this.renderDiagram();
  }

  /**
   * If the host page assigned `element.data` before this custom element was
   * upgraded, the assignment created an own property that shadows the class
   * accessor. Capture and delete it so subsequent gets/sets use the accessor.
   * Returns the captured value, or `undefined` if none was present.
   */
  private consumePreUpgradeData(): SequenceDiagramData | string | null | undefined {
    if (!Object.prototype.hasOwnProperty.call(this, 'data')) {
      return undefined;
    }
    const pending = (this as { data?: SequenceDiagramData | string | null }).data;
    delete (this as { data?: unknown }).data;
    return pending ?? null;
  }

  disconnectedCallback(): void {
    this._isConnected = false;

    // Cleanup React root
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.mountPoint = null;
    this.reactFlowInstance = null;

    // Cleanup system theme listener
    this.cleanupSystemThemeListener();

    // Cleanup ResizeObserver
    this.cleanupResizeObserver();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case ATTR_THEME:
        this._theme = parseTheme(newValue);
        break;
      case ATTR_PALETTE:
        this._palette = parsePalette(newValue);
        break;
      case ATTR_HEIGHT:
        this._height = parseHeight(newValue);
        this.applyHostStyles();
        break;
      case ATTR_MIN_ZOOM:
        this._minZoom = parseZoom(newValue, DEFAULT_CONFIG.minZoom);
        break;
      case ATTR_MAX_ZOOM:
        this._maxZoom = parseZoom(newValue, DEFAULT_CONFIG.maxZoom);
        break;
      case ATTR_CONTROLS:
        this._controls = parseBoolean(newValue, DEFAULT_CONFIG.controls);
        break;
      case ATTR_MINIMAP:
        this._minimap = parseBoolean(newValue, DEFAULT_CONFIG.minimap);
        break;
      case ATTR_FIT_VIEW:
        this._fitView = parseBoolean(newValue, DEFAULT_CONFIG.fitView);
        break;
      case ATTR_INTERACTIVE:
        this._interactive = parseBoolean(newValue, DEFAULT_CONFIG.interactive);
        break;
      case ATTR_SHOW_BACKGROUND:
        this._showBackground = parseBoolean(newValue, DEFAULT_CONFIG.showBackground);
        break;
      case ATTR_ARIA_LABEL:
        this._ariaLabel = parseAriaLabel(newValue);
        break;
      case ATTR_DATA_JSON:
        // data-json attribute changed - reload data if not already loaded via property
        if (!this.initialDataLoaded) {
          this.loadDataFromAttribute();
        }
        break;
    }

    // Re-render if connected
    if (this._isConnected && this.root) {
      this.renderDiagram();
    }
  }

  // -------------------------------------------------------------------------
  // Public API - Properties
  // -------------------------------------------------------------------------

  /**
   * The diagram data. Can be set as a JS object, JSON string, or null to clear.
   */
  get data(): SequenceDiagramData | string | null {
    return this.currentData;
  }

  set data(value: SequenceDiagramData | string | null) {
    this.initialDataLoaded = true;

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

      // Dispatch error event
      this.dispatchError(this.currentValidation.errors);
    }

    this.renderDiagram();
  }

  /**
   * The color theme.
   */
  get theme(): Theme {
    return this._theme;
  }

  set theme(value: Theme) {
    this._theme = value;
    this.setAttribute(ATTR_THEME, serializeTheme(value));
  }

  /**
   * The color palette.
   */
  get palette(): PaletteName {
    return this._palette;
  }

  set palette(value: PaletteName) {
    this._palette = value;
    this.setAttribute(ATTR_PALETTE, serializePalette(value));
  }

  /**
   * The diagram configuration.
   */
  get config(): Partial<SequenceDiagramConfig> {
    return {
      minZoom: this._minZoom,
      maxZoom: this._maxZoom,
      controls: this._controls,
      minimap: this._minimap,
      fitView: this._fitView,
      interactive: this._interactive,
      showBackground: this._showBackground,
      ariaLabel: this._ariaLabel,
    };
  }

  set config(value: Partial<SequenceDiagramConfig>) {
    if (value.minZoom !== undefined) {
      this._minZoom = value.minZoom;
      this.setAttribute(ATTR_MIN_ZOOM, serializeZoom(value.minZoom));
    }
    if (value.maxZoom !== undefined) {
      this._maxZoom = value.maxZoom;
      this.setAttribute(ATTR_MAX_ZOOM, serializeZoom(value.maxZoom));
    }
    if (value.controls !== undefined) {
      this._controls = value.controls;
      this.setAttribute(ATTR_CONTROLS, serializeBoolean(value.controls));
    }
    if (value.minimap !== undefined) {
      this._minimap = value.minimap;
      this.setAttribute(ATTR_MINIMAP, serializeBoolean(value.minimap));
    }
    if (value.fitView !== undefined) {
      this._fitView = value.fitView;
      this.setAttribute(ATTR_FIT_VIEW, serializeBoolean(value.fitView));
    }
    if (value.interactive !== undefined) {
      this._interactive = value.interactive;
      this.setAttribute(ATTR_INTERACTIVE, serializeBoolean(value.interactive));
    }
    if (value.showBackground !== undefined) {
      this._showBackground = value.showBackground;
      this.setAttribute(ATTR_SHOW_BACKGROUND, serializeBoolean(value.showBackground));
    }
    if (value.ariaLabel !== undefined) {
      this._ariaLabel = value.ariaLabel;
      this.setAttribute(ATTR_ARIA_LABEL, value.ariaLabel);
    }

    if (this._isConnected && this.root) {
      this.renderDiagram();
    }
  }

  /**
   * Current validation errors (readonly).
   */
  get validationErrors() {
    return this.currentValidation?.errors ?? [];
  }

  /**
   * Current validation warnings (readonly).
   */
  get validationWarnings() {
    return this.currentValidation?.warnings ?? [];
  }

  // -------------------------------------------------------------------------
  // Public API - Methods
  // -------------------------------------------------------------------------

  /**
   * Sets the diagram data.
   */
  setData(data: SequenceDiagramData | string): void {
    this.data = data;
  }

  /**
   * Gets the current diagram data.
   */
  getData(): SequenceDiagramData | string | null {
    return this.currentData;
  }

  /**
   * Validates data without setting it.
   */
  validateData(input?: unknown): ValidationResult {
    if (input === undefined) {
      return this.currentValidation ?? { valid: true, errors: [], warnings: [] };
    }
    return validateData(input);
  }

  /**
   * Fits the viewport to show all content.
   */
  fitView(options?: { padding?: number; duration?: number }): void {
    if (this.reactFlowInstance) {
      this.reactFlowInstance.fitView({
        padding: options?.padding ?? 0.15,
        duration: options?.duration ?? 200,
      });
    } else {
      // If no instance yet, force a re-render with fitView enabled
      this._fitView = true;
      this.renderDiagram();
    }
  }

  /**
   * Resets the viewport to default position and zoom.
   */
  resetView(): void {
    if (this.reactFlowInstance) {
      this.reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
    }
  }

  /**
   * Forces a re-render with current data.
   */
  refresh(): void {
    if (this.currentData) {
      this.processData(this.currentData);
    }
    this.renderDiagram();
  }

  // -------------------------------------------------------------------------
  // Private methods
  // -------------------------------------------------------------------------

  /**
   * Load initial data from embedded script or data-json attribute
   */
  private loadInitialData(): void {
    // Method A: Check for embedded JSON script
    const script = this.querySelector('script[type="application/json"]');
    if (script) {
      try {
        const json = script.textContent ?? '';
        const data = JSON.parse(json) as SequenceDiagramData;
        this.initialDataLoaded = true;
        this.currentData = data;
        this.processData(data);
        this.dispatchReady();
        return;
      } catch (err) {
        console.error('Failed to parse embedded JSON:', err);
        this.currentValidation = {
          valid: false,
          errors: [
            {
              code: 'INVALID_JSON',
              message: err instanceof Error ? err.message : 'Failed to parse embedded JSON',
            },
          ],
          warnings: [],
        };
        this.dispatchError(this.currentValidation.errors);
      }
    }

    // Method C: Check data-json attribute
    const dataJsonAttr = this.getAttribute(ATTR_DATA_JSON);
    if (dataJsonAttr) {
      this.loadDataFromAttribute();
      return;
    }
  }

  /**
   * Load data from data-json attribute
   */
  private loadDataFromAttribute(): void {
    const dataJson = parseDataJson(this.getAttribute(ATTR_DATA_JSON));
    if (dataJson) {
      try {
        const data = JSON.parse(dataJson) as SequenceDiagramData;
        this.initialDataLoaded = true;
        this.currentData = data;
        this.processData(data);
        this.dispatchReady();
      } catch (err) {
        console.error('Failed to parse data-json attribute:', err);
        this.currentValidation = {
          valid: false,
          errors: [
            {
              code: 'INVALID_JSON',
              message: err instanceof Error ? err.message : 'Failed to parse data-json',
            },
          ],
          warnings: [],
        };
        this.dispatchError(this.currentValidation.errors);
      }
    }
  }

  /**
   * Process data: validate → normalize → layout
   */
  private processData(data: SequenceDiagramData): void {
    this.renderStartTime = performance.now();

    // Step 1: Validate
    this.currentValidation = validateData(data);

    if (!this.currentValidation.valid) {
      this.currentLayout = null;
      this.dispatchError(this.currentValidation.errors);
      if (this.currentValidation.warnings.length > 0) {
        this.dispatchWarning(this.currentValidation.warnings);
      }
      return;
    }

    // Dispatch warnings if any
    if (this.currentValidation.warnings.length > 0) {
      this.dispatchWarning(this.currentValidation.warnings);
    }

    // Step 2: Normalize
    const normalized = normalize(data);

    // Step 3: Layout
    this.currentLayout = layoutSequence(normalized);

    // Dispatch ready event
    this.dispatchReady();
  }

  /**
   * Apply host element styles
   */
  private applyHostStyles(): void {
    this.style.setProperty('--sd-host-height', this._height);
    this.style.display = 'block';
    this.style.position = 'relative';
    this.style.width = '100%';
    this.style.height = this._height;
    this.style.contain = 'layout paint style';

    // Apply theme tokens as CSS variables
    applyTheme({
      host: this,
      mode: this._theme,
      palette: this._palette,
    });
  }

  /**
   * Setup system theme listener
   */
  private setupSystemThemeListener(): void {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryListener = (_e: MediaQueryListEvent) => {
      // Only react if theme is set to 'system'
      if (this._theme === 'system') {
        this.renderDiagram();
      }
    };
    this.mediaQuery.addEventListener('change', this.mediaQueryListener);
  }

  /**
   * Cleanup system theme listener
   */
  private cleanupSystemThemeListener(): void {
    if (this.mediaQuery && this.mediaQueryListener) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryListener);
      this.mediaQuery = null;
      this.mediaQueryListener = null;
    }
  }

  /**
   * Setup ResizeObserver for responsive containers
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.root && this.currentLayout) {
        // Re-render on resize to update React Flow viewport
        this.renderDiagram();
      }
    });

    if (this.mountPoint) {
      this.resizeObserver.observe(this.mountPoint);
    }
  }

  /**
   * Cleanup ResizeObserver
   */
  private cleanupResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Dispatch ready event
   */
  private dispatchReady(): void {
    if (!this._isConnected) return;

    const dispatch = createSequenceReadyDispatcher(this as HTMLElement);
    const detail: SequenceReadyDetail = {
      participantCount: this.currentData?.participants.length ?? 0,
      eventCount: this.currentData?.events.length ?? 0,
    };
    if (this.currentData?.id) {
      detail.id = this.currentData.id;
    }
    dispatch(detail);
  }

  /**
   * Dispatch rendered event
   */
  private dispatchRendered(): void {
    if (!this._isConnected) return;

    const durationMs = performance.now() - this.renderStartTime;
    const bounds = this.currentLayout?.bounds ?? { x: 0, y: 0, width: 0, height: 0 };

    const dispatch = createSequenceRenderedDispatcher(this as HTMLElement);
    dispatch({ bounds, durationMs });
  }

  /**
   * Dispatch error event
   */
  private dispatchError(
    errors: Array<{ code: string; message: string; path?: string; details?: unknown }>
  ): void {
    if (!this._isConnected) return;

    const dispatch = createSequenceErrorDispatcher(this as HTMLElement);
    dispatch({ errors });
  }

  /**
   * Dispatch warning event
   */
  private dispatchWarning(
    warnings: Array<{ code: string; message: string; path?: string; details?: unknown }>
  ): void {
    if (!this._isConnected) return;

    const dispatch = createSequenceWarningDispatcher(this as HTMLElement);
    dispatch({ warnings });
  }

  /**
   * Get resolved theme (resolves 'system' to actual theme)
   */
  private getResolvedTheme(): 'light' | 'dark' {
    if (this._theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this._theme;
  }

  /**
   * Render the diagram
   */
  private renderDiagram(): void {
    if (!this.root || !this.mountPoint) {
      return;
    }

    const isLoading = false;
    const hasErrors = this.currentValidation && !this.currentValidation.valid;

    let content: React.ReactNode;

    if (hasErrors && !this.currentLayout) {
      // Show validation errors
      content = this.renderErrorState();
    } else if (!this.currentData) {
      // Show empty state
      content = this.renderEmptyState();
    } else {
      // Render the diagram
      content = (
        <SequenceFlow
          layoutResult={this.currentLayout}
          isLoading={isLoading}
          onNodeClick={this.handleNodeClick.bind(this)}
          onEdgeClick={this.handleEdgeClick.bind(this)}
          onViewportChange={this.handleViewportChange.bind(this)}
          onReady={this.handleReactFlowReady.bind(this)}
          config={{
            minZoom: this._minZoom,
            maxZoom: this._maxZoom,
            controls: this._controls,
            minimap: this._minimap,
            fitView: this._fitView,
            interactive: this._interactive,
            showBackground: this._showBackground,
          }}
          theme={this.getResolvedTheme()}
          palette={this._palette}
        />
      );
    }

    this.root.render(content);

    // Dispatch rendered event after a brief delay to allow React to settle
    requestAnimationFrame(() => {
      if (this.currentData && this.currentLayout) {
        this.dispatchRendered();
      }
    });
  }

  /**
   * Render error state
   */
  private renderErrorState(): React.ReactNode {
    const errors = this.currentValidation?.errors ?? [];
    const displayErrors = errors.slice(0, 5); // Show first 5 errors

    return (
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
          background: 'var(--sd-surface, #fef2f2)',
          color: 'var(--sd-error, #991b1b)',
          boxSizing: 'border-box',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginBottom: 16, opacity: 0.7 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
          Validation Errors
        </h3>
        <ul style={{ margin: 0, padding: '0 20px', textAlign: 'left', fontSize: 13 }}>
          {displayErrors.map((err, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {err.message}
            </li>
          ))}
        </ul>
        {errors.length > 5 && (
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            ...and {errors.length - 5} more errors
          </p>
        )}
      </div>
    );
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): React.ReactNode {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--sd-canvas, #f9fafb)',
          color: 'var(--sd-text-muted, #6b7280)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          boxSizing: 'border-box',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginBottom: 12, opacity: 0.5 }}
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span>No sequence data</span>
      </div>
    );
  }

  /**
   * Handle React Flow ready event
   */
  private handleReactFlowReady(instance: { fitView: (options?: object) => void; setViewport: (viewport: object) => void }): void {
    this.reactFlowInstance = instance;
    if (this._fitView && this.currentLayout) {
      instance.fitView({ padding: 0.15, duration: 200 });
    }
  }

  /**
   * Handle node click (participant)
   */
  private handleNodeClick(
    _event: React.MouseEvent,
    node: { id: string },
    _nativeEvent?: MouseEvent
  ): void {
    if (node.id.startsWith('participant-')) {
      const participantId = node.id.replace('participant-', '');
      const participant = this.currentData?.participants.find((p) => p.id === participantId);

      const dispatch = createSequenceParticipantClickDispatcher(this as HTMLElement);
      const participantDetail: { id: string; label: string; kind?: string } = {
        id: participantId,
        label: participant?.label ?? participantId,
      };
      if (participant?.kind) {
        participantDetail.kind = participant.kind;
      }
      dispatch({ participant: participantDetail });
    } else if (node.id.startsWith('fragment-')) {
      const fragmentId = node.id.replace('fragment-', '');
      // Find fragment in data
      const fragment = this.findFragmentById(fragmentId);

      const dispatch = createSequenceFragmentClickDispatcher(this as HTMLElement);
      const fragmentDetail: { id: string; fragmentKind: string; label?: string } = {
        id: fragmentId,
        fragmentKind: fragment?.fragmentKind ?? 'alt',
      };
      if (fragment?.label) {
        fragmentDetail.label = fragment.label;
      }
      dispatch({ fragment: fragmentDetail });
    }
  }

  /**
   * Handle edge click (message)
   */
  private handleEdgeClick(
    _event: React.MouseEvent,
    edge: { id: string; source: string; target: string; label?: string; messageKind?: string },
    _nativeEvent?: MouseEvent
  ): void {
    if (edge.id.startsWith('edge-')) {
      const eventId = edge.id.replace('edge-', '');

      // Find the message event
      const message = this.findMessageById(eventId);

      const dispatch = createSequenceMessageClickDispatcher(this as HTMLElement);
      const messageDetail: { id: string; from: string; to: string; label: string; messageKind?: string } = {
        id: eventId,
        from: edge.source,
        to: edge.target,
        label: message?.label ?? edge.label ?? '',
      };
      const mk = edge.messageKind ?? message?.messageKind;
      if (mk) {
        messageDetail.messageKind = mk;
      }
      dispatch({ message: messageDetail });
    }
  }

  /**
   * Handle viewport change
   */
  private handleViewportChange(viewport: { x: number; y: number; zoom: number }): void {
    const dispatch = createSequenceViewportChangeDispatcher(this as HTMLElement);
    dispatch(viewport);
  }

  /**
   * Find fragment by ID in current data
   */
  private findFragmentById(id: string): { id: string; fragmentKind: string; label?: string } | null {
    if (!this.currentData) return null;

    function searchFragment(events: SequenceDiagramData['events']): { id: string; fragmentKind: string; label?: string } | null {
      for (const event of events) {
        if (event.type === 'fragment' && event.id === id) {
          return event;
        }
        if (event.type === 'fragment') {
          for (const branch of event.branches) {
            const found = searchFragment(branch.events);
            if (found) return found;
          }
        }
      }
      return null;
    }

    return searchFragment(this.currentData.events);
  }

  /**
   * Find message by ID in current data
   */
  private findMessageById(id: string): { id: string; label: string; messageKind?: string } | null {
    if (!this.currentData) return null;

    function searchMessage(events: SequenceDiagramData['events']): { id: string; label: string; messageKind?: string } | null {
      for (const event of events) {
        if (event.type === 'message' && event.id === id) {
          return event;
        }
        if (event.type === 'fragment') {
          for (const branch of event.branches) {
            const found = searchMessage(branch.events);
            if (found) return found;
          }
        }
      }
      return null;
    }

    return searchMessage(this.currentData.events);
  }
}
