# seq_show_case Implementation Plan

## Overview

Implement a Sequence Diagram Web Component per `seq_show_case.md`. The component renders interactive sequence diagrams from JSON data using React + React Flow inside Shadow DOM.

**Project:** `seq_show_case` — Sequence Diagram Web Component
**Spec:** `/mnt/c/dev/GitHub/seq_show_case/seq_show_case.md`
**Branch:** `implementation`

---

## Global Constraints

- TypeScript strict mode throughout
- Layout/validation/normalization must be React-independent (pure unit testable)
- React Flow handles rendering/viewport only — layout is deterministic and self-contained
- `nodesDraggable: false`, `edgesReconnectable: false`, `elementsSelectable: true`
- Dynamic handles use stable IDs: `msg:<id>:left`, `msg:<id>:right`
- Overlays use React Flow `ViewportPortal` with `pointer-events: none`
- All CSS inlined into Shadow DOM — no external stylesheets
- No `dangerouslySetInnerHTML` — all text as text nodes
- Build outputs: `sequence-diagram.es.js`, `sequence-diagram.iife.js`, `index.d.ts`, `sequence-diagram.schema.json`

---

## Task 1: Phase 0 — Project Scaffold

### Description

Initialize the complete project infrastructure: Vite + React + TypeScript with all build/test configs. Create minimal custom element that mounts a React "Hello World" into Shadow DOM.

### Deliverables

- `package.json` with all dependencies and scripts
- `tsconfig.json` (strict mode)
- `vite.config.ts` (library mode, ESM + IIFE outputs, React plugin)
- `vitest.config.ts`
- `playwright.config.ts`
- `eslint.config.js` (or `.eslintrc.*`)
- `prettier.config.js` (or `.prettierrc.*`)
- `index.html` (minimal dev server entry)
- `src/index.ts` — entry point that registers `<sequence-diagram>`
- `src/web-component/SequenceDiagramElement.ts` — minimal custom element with Shadow DOM + React mount
- `src/app/HelloWorld.tsx` — placeholder React component
- `src/styles/placeholder.css` — minimal styles
- `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all pass
- Basic Playwright test: custom element registers, Shadow DOM mounts React

### Acceptance Criteria

1. `npm run dev` starts Vite dev server
2. `npm run lint` passes without errors
3. `npm run typecheck` passes without errors
4. `npm run test` runs Vitest (placeholder test passes)
5. `npm run build` produces `dist/sequence-diagram.es.js` and `dist/sequence-diagram.iife.js`
6. `<sequence-diagram>` can be placed in HTML and mounts React into Shadow DOM
7. Playwright test confirms custom element works in browser

### File Structure

```
seq_show_case/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
├── prettier.config.js
├── index.html
├── src/
│   ├── index.ts
│   ├── web-component/
│   │   └── SequenceDiagramElement.ts
│   └── app/
│       └── HelloWorld.tsx
└── tests/
    └── component/
        └── basic.spec.ts
```

---

## Task 2: Phase 1 — Model, Schema, Validation

### Description

Implement the public TypeScript types, JSON Schema Draft 2020-12, Ajv validation, semantic validation, and structured error model. All layout/validation must be React-independent.

### Deliverables

- `src/model/public-types.ts` — all public interfaces (SequenceDiagramData, Participant, MessageEvent, NoteEvent, ActivateEvent, DeactivateEvent, DividerEvent, FragmentEvent, etc.)
- `src/model/limits.ts` — soft limits constants (MAX_PARTICIPANTS=20, MAX_EVENTS=300, MAX_DEPTH=4, etc.)
- `schemas/sequence-diagram.schema.json` — Draft 2020-12 JSON Schema
- `src/model/validation.ts` — Ajv validator + semantic validator + structured errors
- `src/model/validation-types.ts` — SequenceDiagramError, SequenceDiagramWarning, ValidationResult types
- Unit tests covering: valid data, missing schemaVersion, duplicate participant ID, duplicate event ID, unknown participant reference, unmatched deactivate, fragment depth exceeded, limits exceeded

### Acceptance Criteria

1. All TypeScript types compile without errors
2. JSON Schema validates correct data structures
3. Ajv validation returns structured errors with path information
4. Semantic validation catches: duplicate IDs, unknown references, invalid activation pairs, depth violations
5. All unit tests pass

### File Structure

```
src/model/
├── public-types.ts
├── limits.ts
├── validation-types.ts
├── validation.ts
schemas/
└── sequence-diagram.schema.json
tests/unit/
├── validation.test.ts
└── fixtures/
    ├── valid-minimal.json
    ├── invalid-duplicate-ids.json
    ├── invalid-unknown-participant.json
    └── invalid-depth.json
```

---

## Task 3: Phase 2 — Normalizer + Layout Engine

### Description

Implement the data normalizer (fills defaults, builds indices, matches activate/deactivate pairs) and the pure TypeScript deterministic layout engine with two-stage layout.

### Deliverables

- `src/model/normalizer.ts` — Normalizer class: fills defaults, builds participant/event indices, matches activate/deactivate with stack, infers fragment participants, detects self-calls
- `src/model/normalized-types.ts` — NormalizedData, NormalizedParticipant, NormalizedEvent types
- `src/layout/layout-types.ts` — LayoutToken, LayoutRow, LayoutBounds, LayoutParticipant, LayoutMessage, LayoutFragment, LayoutActivation types
- `src/layout/tokens.ts` — DEFAULT_LAYOUT constant with all geometry tokens in one file
- `src/layout/flattenEvents.ts` — flattens nested event tree to LayoutRow[] with fragment/branch markers
- `src/layout/textMeasurement.ts` — pure function for estimating text wrapping and line counts
- `src/layout/activationLayout.ts` — activation/deactivation rectangle calculation
- `src/layout/fragmentLayout.ts` — fragment/branch rectangle calculation
- `src/layout/layoutSequence.ts` — main layout engine (pure function, takes NormalizedData → LayoutResult)
- Unit tests: normalizer defaults, activation pairing, self-call detection, fragment inference; layout: two participants one message coordinates, participant count → X positions, self-message extra space, fragment bounds, activation offset

### Acceptance Criteria

1. Normalizer produces consistent normalized data for same input
2. Layout engine is pure — same input always produces identical output
3. Two participants + one message produces known X,Y coordinates
4. Self-message adds extra right-side canvas space
5. Fragment bounds cover correct participants and rows
6. All unit tests pass

### File Structure

```
src/layout/
├── layout-types.ts
├── tokens.ts
├── flattenEvents.ts
├── textMeasurement.ts
├── activationLayout.ts
├── fragmentLayout.ts
└── layoutSequence.ts
tests/unit/
├── normalizer.test.ts
└── layout.test.ts
```

---

## Task 4: Phase 3 — React Flow Rendering (Vertical Slice)

### Description

Build the minimal vertical slice: two participants + one sync message + deterministic layout + React Flow rendering. Verify the core integration risk of React Flow + Shadow DOM + dynamic handles works.

### Deliverables

- `src/react-flow/SequenceFlow.tsx` — main React Flow wrapper component
- `src/react-flow/createNodes.ts` — converts LayoutResult to React Flow nodes (participant lanes)
- `src/react-flow/createEdges.ts` — converts LayoutResult to React Flow edges (messages)
- `src/react-flow/nodeTypes.ts` — registers custom node types
- `src/react-flow/edgeTypes.ts` — registers custom edge types
- `src/components/ParticipantLaneNode.tsx` — custom participant lane node (header + lifeline)
- `src/components/SequenceMessageEdge.tsx` — custom message edge (sync, async, return)
- `src/components/SelfMessageEdge.tsx` — custom self-call edge
- `src/styles/bundledStyles.ts` — imports and exports all CSS as string (including @xyflow/react base.css)
- Update `SequenceDiagramElement` to wire up data → validate → normalize → layout → React Flow
- Minimal test data: 2 participants, 1 sync message
- Playwright test: diagram renders, pan/zoom works, no console errors

### Acceptance Criteria

1. Two participants with one message renders correctly
2. React Flow pan and zoom work
3. `fitView` auto-fits on initial render
4. Dynamic handles are stable (same ID format: `msg:<id>:left/right`)
5. No console errors in browser
6. Hostile CSS does not affect component internals

### File Structure

```
src/react-flow/
├── SequenceFlow.tsx
├── createNodes.ts
├── createEdges.ts
├── nodeTypes.ts
└── edgeTypes.ts
src/components/
├── ParticipantLaneNode.tsx
├── SequenceMessageEdge.tsx
└── SelfMessageEdge.tsx
src/styles/
└── bundledStyles.ts
tests/
├── e2e/
│   └── minimal-slice.spec.ts
└── visual/
    └── basic-light-classic.png (screenshot baseline)
```

---

## Task 5: Phase 4 — Advanced Overlays

### Description

Implement all overlay elements: activation bars, note annotations, dividers, and fragment/branch overlays with support for nested fragments.

### Deliverables

- `src/components/SequenceOverlays.tsx` — container for all overlay types
- `src/components/ActivationOverlay.tsx` — activation/deactivation bar rendering
- `src/components/NoteOverlay.tsx` — note annotation rendering (left/right/center placement)
- `src/components/DividerOverlay.tsx` — horizontal divider rendering
- `src/components/FragmentOverlay.tsx` — alt/opt/loop/par/critical/break fragment rectangles and branch separators
- Update layout engine to produce overlay geometry data
- Update SequenceFlow to render overlays via ViewportPortal
- Unit tests for each overlay type
- Playwright tests: activation nested, note placement, alt-fragment, nested-fragments

### Acceptance Criteria

1. Activation bars render at correct positions and support nesting
2. Notes appear at correct left/right/center positions relative to participants
3. Dividers render as horizontal lines
4. Fragment rectangles cover correct participant range and event rows
5. Branch separators render at correct positions
6. 4-level nested fragments work correctly
7. All unit tests pass

---

## Task 6: Phase 5 — Web Component API + Shadow DOM

### Description

Implement the full Web Component API: all attributes, properties, methods, events. Full lifecycle management, multi-instance isolation, stylesheet embedding.

### Deliverables

- `src/web-component/attributes.ts` — attribute parsing and serialization
- `src/web-component/events.ts` — all DOM event definitions and dispatchers
- `src/web-component/element-types.d.ts` — type declarations for custom element
- Update `SequenceDiagramElement` with full API:
  - Properties: `data`, `theme`, `palette`, `config`, `validationErrors`, `validationWarnings`
  - Attributes: `theme`, `palette`, `height`, `min-zoom`, `max-zoom`, `controls`, `minimap`, `fit-view`, `interactive`, `show-background`, `aria-label`, `data-json`
  - Methods: `setData()`, `getData()`, `validateData()`, `fitView()`, `resetView()`, `refresh()`
  - Events: `sequence-ready`, `sequence-rendered`, `sequence-error`, `sequence-warning`, `sequence-message-click`, `sequence-participant-click`, `sequence-fragment-click`, `sequence-viewport-change`
- Shadow DOM stylesheet embedding with constructable stylesheets + style fallback
- `ResizeObserver` for responsive containers
- System theme listener with cleanup on disconnect
- Multi-instance isolation (no shared state)
- Playwright tests: all attributes, properties, methods, events, lifecycle, multi-instance

### Acceptance Criteria

1. All attributes parse correctly
2. All properties read/write correctly
3. All methods work as specified
4. All events fire with correct detail and cross Shadow DOM boundary
5. Multiple instances on same page are fully independent
6. `disconnectedCallback` cleans up all listeners and React roots
7. Hostile CSS isolation confirmed by Playwright test

---

## Task 7: Phase 6 — Theme System + Palettes

### Description

Implement light/dark/system theme modes with all 7 palettes, CSS variable application, system theme change listener, reduced motion support.

### Deliverables

- `src/theme/palettes.ts` — all 7 palette definitions (classic, ocean, forest, violet, sunset, rose, slate) each with light and dark tokens
- `src/theme/tokens.ts` — PaletteTokens interface
- `src/theme/themeResolver.ts` — resolves light/dark/system with media query support
- `src/theme/applyTheme.ts` — applies CSS variables to Shadow DOM host
- Update `SequenceDiagramElement` to use theme system
- `reduced-motion` media query support for animations
- Playwright tests: light/dark/system modes, palette switching, system theme change

### Acceptance Criteria

1. All 7 palettes render correctly in both light and dark
2. System theme switches automatically when OS theme changes
3. CSS variables can be overridden by host page
4. WCAG AA contrast on all palettes
5. No color-only differentiation for critical states (also use line style, icons)

---

## Task 8: Phase 7 — example.html Demo Page

### Description

Build the complete example.html demo page as specified in section 17 of the spec.

### Deliverables

- `example.html` with all 10 required sections:
  1. Basic Usage (embedded JSON script)
  2. Property API (dynamic data replacement)
  3. Theme Modes (light/dark/system side by side)
  4. Palette Gallery (all 7 palettes with live switching)
  5. Sequence Features (sync/async/return/self-call, note, activation, divider, fragments)
  6. Events (click listeners with formatted JSON display)
  7. Responsive Layout (resizable container)
  8. CSS Isolation (hostile host CSS)
  9. Error Handling (invalid data demonstration)
  10. Multiple Instances (6+ instances)
- `public/examples/*.json` — all example fixture files
- IIFE and ESM loading demos
- Example page uses no React, no CDN, no framework CSS

### Acceptance Criteria

1. All 10 sections functional and visually correct
2. Both IIFE and ESM loading work
3. No external dependencies (CDN, framework CSS)
4. Works behind a simple static file server

---

## Task 9: Phase 8 — Tests + QA

### Description

Complete the full test suite: unit tests for all modules, component tests, E2E tests, visual regression baselines, bundle analysis, and dist verification.

### Deliverables

- `tests/unit/` — complete unit test coverage for model, layout, theme
- `tests/component/` — custom element lifecycle, attribute/property/method/event tests
- `tests/e2e/` — full E2E scenarios from spec section 18
- `tests/visual/` — screenshot baselines for all scenarios in spec section 18.4
- `tests/fixtures/` — all test fixture files
- `scripts/verify-dist.mjs` — dist smoke test script
- `scripts/copy-schema.mjs` — copies schema to dist
- `npm run verify-dist` passes
- Bundle analyzer report
- README.md with quick start, API docs, schema docs, browser support

### Acceptance Criteria

1. All unit tests pass
2. All component tests pass
3. All E2E tests pass
4. Visual baselines exist for all specified scenarios
5. `npm run verify-dist` passes
6. Bundle size documented in README
7. No placeholders or TODOs in production code
