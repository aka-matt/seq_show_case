# Sequence Diagram Web Component

A custom element (`<sequence-diagram>`) that renders interactive sequence diagrams from JSON data. Uses React + React Flow inside Shadow DOM — zero framework dependencies on the host page.

**[Live Demo](http://localhost:3000)** — `npm run dev`

---

## Quick Start

### 1. Add the script (IIFE or ESM)

**IIFE** (simple, no bundler):
```html
<script src="sequence-diagram.iife.js"></script>
```

**ESM** (modern bundlers):
```html
<script type="module" src="sequence-diagram.es.js"></script>
```

### 2. Add the element

```html
<sequence-diagram id="diagram"></sequence-diagram>
<script type="application/json">
{
  "schemaVersion": "1.0",
  "participants": [
    { "id": "alice", "label": "Alice" },
    { "id": "bob",   "label": "Bob" }
  ],
  "events": [
    { "id": "m1", "type": "message", "from": "alice", "to": "bob", "label": "Hello!", "messageKind": "sync" }
  ]
}
</script>
```

### 3. Configure

```html
<sequence-diagram
  theme="system"
  palette="classic"
  height="400px">
</sequence-diagram>
```

---

## Data Model

```ts
// Root
{ schemaVersion: "1.0", id?, title?, description?, participants: Participant[], events: SequenceEvent[] }

// Participant
{ id: string, label: string, subtitle?, kind?: "actor"|"service"|"system"|"database"|"queue"|"external", icon?, accent?, metadata? }

// Events (union)
MessageEvent   { id, type:"message", from, to, label, messageKind?:"sync"|"async"|"return", number?, status?, tooltip? }
NoteEvent      { id, type:"note", text, over: participantId[], placement?:"left"|"right"|"center", tone? }
ActivateEvent  { id, type:"activate", participant }
DeactivateEvent{ id, type:"deactivate", participant }
DividerEvent   { id, type:"divider", label? }
FragmentEvent  { id, type:"fragment", fragmentKind:"alt"|"opt"|"loop"|"par"|"critical"|"break", label?, participants?, branches: FragmentBranch[] }
```

See `schemas/sequence-diagram.schema.json` for the full JSON Schema definition.

---

## API Reference

### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `theme` | `"light"` \| `"dark"` \| `"system"` | `"system"` | Color scheme |
| `palette` | PaletteName | `"classic"` | Color palette (see below) |
| `height` | CSS length | `"500px"` | Container height |
| `min-zoom` | number | `0.1` | Minimum zoom level |
| `max-zoom` | number | `5` | Maximum zoom level |
| `controls` | boolean | `true` | Show pan/zoom controls |
| `minimap` | boolean | `true` | Show minimap |
| `fit-view` | boolean | `true` | Auto-fit on render |
| `interactive` | boolean | `true` | Enable pan/zoom |
| `show-background` | boolean | `true` | Show dot grid background |

### Properties

```ts
element.data                    // SequenceDiagramData | string | null — diagram data
element.theme                   // "light" | "dark" | "system"
element.palette                 // PaletteName
element.config                  // SequenceDiagramConfig (readonly)
element.validationErrors        // SequenceDiagramError[]
element.validationWarnings      // SequenceDiagramWarning[]
```

### Methods

```ts
element.setData(data)           // Set diagram data (object or JSON string)
element.getData()                // Get current diagram data
element.validateData(data?)     // Validate without setting (returns ValidationResult)
element.fitView(options?)       // Trigger fitView (React Flow)
element.resetView()              // Reset to default viewport
element.refresh()                // Force re-render
```

### Events

All events `bubbles: true, composed: true` (cross Shadow DOM boundary).

| Event | Detail | Description |
|---|---|---|
| `sequence-ready` | `{ participantCount, eventCount }` | Component initialized |
| `sequence-rendered` | `{ bounds, durationMs }` | Render complete |
| `sequence-error` | `{ errors[] }` | Validation/render error |
| `sequence-warning` | `{ warnings[] }` | Non-fatal issues |
| `sequence-message-click` | `{ eventId, message }` | Message arrow clicked |
| `sequence-participant-click` | `{ participantId, participant }` | Participant header clicked |
| `sequence-fragment-click` | `{ eventId, fragment }` | Fragment region clicked |
| `sequence-viewport-change` | `{ x, y, zoom }` | Viewport changed |

### Palettes

Seven built-in palettes: `classic` | `ocean` | `forest` | `violet` | `sunset` | `rose` | `slate`

### CSS Custom Properties

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

## Browser Support

| Browser | Version |
|---|---|
| Chrome | 89+ |
| Firefox | 90+ |
| Safari | 15.4+ |
| Edge | 89+ |

Requires: Custom Elements v1, Shadow DOM v1, ResizeObserver, ES2022.

---

## Bundle Size

| Bundle | Minified | Gzip |
|---|---|---|
| IIFE | 858.8 KB | **263.7 KB** |
| ESM | 1,281.1 KB | **313.7 KB** |

Sizes include React 18, React Flow 12, and all palettes.

---

## Development

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build ESM + IIFE to dist/
npm run lint         # ESLint
npm run typecheck    # TypeScript --noEmit
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run test:visual  # Visual regression screenshots
npm run verify-dist  # Dist smoke tests
npm run serve:dist    # Serve dist/ on http://localhost:3000
```

---

## Architecture

```
Host Page → Custom Element → Ajv Validation → Normalizer → Layout Engine → React Flow Adapter → React (Shadow DOM)
```

Key modules:
- `src/model/` — Types, JSON Schema, validation (React-independent)
- `src/layout/` — Pure TypeScript geometry engine (React-independent)
- `src/react-flow/` — Layout → nodes/edges adapter
- `src/components/` — React rendering (ParticipantLaneNode, SequenceMessageEdge, overlays)
- `src/theme/` — Palette tokens, light/dark/system resolver
- `src/web-component/` — Custom Element lifecycle, Shadow DOM

---

## License

MIT
