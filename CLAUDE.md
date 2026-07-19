# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`seq_show_case` is a **Sequence Diagram Web Component** — a custom element (`<sequence-diagram>`) that renders interactive sequence diagrams from JSON data. It uses React + React Flow inside Shadow DOM, targeting static HTML pages without framework dependencies.

**Technology stack:** TypeScript (strict) · React · `@xyflow/react` v12 · Vite (library mode) · Vitest · Playwright · ESLint · Prettier · Ajv + JSON Schema Draft 2020-12

---

## Architecture

```
Host Page → Custom Element → Validation → Normalizer → Layout Engine → React Flow Adapter → React (Shadow DOM)
```

### Module boundaries

| Module | Responsibility |
|---|---|
| `web-component/` | Custom Element lifecycle, attributes, properties, DOM events |
| `model/` | Public types, JSON Schema, validation, normalization |
| `layout/` | Pure TypeScript geometry engine — no React dependencies |
| `react-flow/` | Adapts layout output to React Flow nodes/edges/viewport |
| `components/` | React rendering components (participant lanes, message edges, overlays) |
| `theme/` | Palette tokens, theme resolver (light/dark/system), CSS variables |
| `styles/` | Bundled CSS including React Flow base styles |

**Key rule:** Layout, validation, and normalization must be React-independent to support pure-unit testing.

### React Flow usage policy

- React Flow handles **rendering and viewport** only (pan, zoom, nodes, edges).
- **Layout is deterministic and self-contained** — `@xyflow/react` does not infer sequence diagram layout.
- `nodesDraggable: false`, `edgesReconnectable: false`, `elementsSelectable: true` — read-only interaction.
- Dynamic handles (per-message source/target anchors) use stable IDs: `msg:<id>:left`, `msg:<id>:right`.
- Overlays (fragments, activations, notes, dividers) use React Flow `ViewportPortal` with `pointer-events: none`.

### Data flow

1. Host sets `element.data` (JS object or JSON string).
2. Ajv validates against JSON Schema Draft 2020-12.
3. `Normalizer` fills defaults, builds participant/event indices, matches activate/deactivate pairs.
4. `LayoutEngine` (pure function) computes participant X positions and event Y rows.
5. `ReactFlowAdapter` converts to nodes/edges.
6. React renders into Shadow DOM; React Flow handles viewport.

---

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (example.html)
npm run lint         # ESLint
npm run typecheck    # TypeScript --noEmit
npm run test         # Vitest unit tests
npm run test:unit    # Unit tests only (alias)
npm run test:e2e     # Playwright E2E/component tests
npm run test:visual  # Visual regression screenshot tests

# Build
npm run build        # Vite library mode → dist/ (ESM + IIFE)
npm run build:typecheck # Verify build output types

# Quality
npm run verify-dist  # dist/ smoke tests (file existence, no eval, schema match)
```

## JSON Data Model (Summary)

```ts
// Root
{ schemaVersion: "1.0", id?, title?, description?, participants: Participant[], events: SequenceEvent[] }

// Participants
{ id: string, label: string, subtitle?, kind?: "actor"|"service"|"system"|"database"|"queue"|"external", icon?, accent?, metadata? }

// Events (union)
MessageEvent   { id, type:"message", from, to, label, messageKind?:"sync"|"async"|"return", number?, status?, tooltip? }
NoteEvent      { id, type:"note", text, over: participantId[], placement?:"left"|"right"|"center", tone? }
ActivateEvent  { id, type:"activate", participant }
DeactivateEvent{ id, type:"deactivate", participant }
DividerEvent   { id, type:"divider", label? }
FragmentEvent  { id, type:"fragment", fragmentKind:"alt"|"opt"|"loop"|"par"|"critical"|"break", label?, participants?, branches: FragmentBranch[] }
```

**Self-call:** `from === to` on a message renders as a self-message edge.

## Web Component API

```ts
// Properties
element.data: SequenceDiagramData | string | null
element.theme: "light" | "dark" | "system"
element.palette: PaletteName  // "classic" | "ocean" | "forest" | "violet" | "sunset" | "rose" | "slate"
element.config: Partial<SequenceDiagramConfig>
element.validationErrors: SequenceDiagramError[]
element.validationWarnings: SequenceDiagramWarning[]

// Methods
element.setData(data)
element.getData()
element.validateData(data?)
element.fitView(options?)
element.resetView()
element.refresh()

// Events (all bubbles:true, composed:true)
sequence-ready, sequence-rendered, sequence-error, sequence-warning,
sequence-message-click, sequence-participant-click, sequence-fragment-click,
sequence-viewport-change
```

## CSS Custom Properties (Host)

```css
sequence-diagram {
  --sd-font-family, --sd-font-size, --sd-participant-width, --sd-participant-radius,
  --sd-line-width, --sd-message-label-size, --sd-control-size;
  --sd-accent, --sd-surface, --sd-surface-muted, --sd-text, --sd-text-muted,
  --sd-border, --sd-line, --sd-success, --sd-warning, --sd-error, --sd-note,
  --sd-fragment-fill, --sd-shadow;
}
```

---

## Implementation Phases

1. **Phase 0:** Project scaffold (Vite + React + TS), minimal custom element + React "Hello"
2. **Phase 1:** Public model, JSON Schema, Ajv validation, structured errors
3. **Phase 2:** Normalizer + deterministic layout engine (no React)
4. **Phase 3:** React Flow rendering (participants + messages only, minimal vertical slice)
5. **Phase 4:** Activation, note, divider, fragment overlays
6. **Phase 5:** Web Component API, Shadow DOM styles, lifecycle, multi-instance
7. **Phase 6:** Theme system (light/dark/system), all 7 palettes
8. **Phase 7:** `example.html` demo page
9. **Phase 8:** Full test suite, visual regression, bundle analysis

**First vertical slice (Phase 0→3 minimal):** Two participants, one sync message, light/classic, pan/zoom/fit.

---

## Known Risks (from spec)

| Risk | Mitigation |
|---|---|
| React Flow CSS enters document instead of Shadow DOM | Build step inlines `@xyflow/react/dist/base.css` into Shadow DOM stylesheet |
| Dynamic handles stale on layout change | Stable handle IDs + React Flow node internal update on layout changes |
| `EdgeLabelRenderer` / portal escapes Shadow DOM | Playwright test confirms portal container is inside Shadow Root |
| Multiple instances sharing stylesheet across iframes | Stylesheet cached per `ownerDocument`, with `<style>` fallback |
| System theme listener leak on reconnect | `disconnectedCallback` cleanup + reconnect lifecycle test |
| Large diagram blocks browser | Configurable soft limits (20 participants, 300 events, 4 fragment depth) with error event |

---

## Reference

- React Flow docs: https://reactflow.dev/learn
- Shadow DOM: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
- JSON Schema Draft 2020-12: https://json-schema.org/specification
