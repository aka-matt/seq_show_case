/**
 * Unit tests for the Layout Engine.
 */

import { describe, it, expect } from "vitest";
import { normalize } from "../../src/model/normalizer";
import { layoutSequence, calculateParticipantXPositions, calculateCanvasWidth } from "../../src/layout/layoutSequence";
import { DEFAULT_LAYOUT } from "../../src/layout/tokens";
import { flattenEvents, calculateTotalRowsHeight } from "../../src/layout/flattenEvents";
import type { SequenceDiagramData } from "../../src/model/public-types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const twoParticipantsOneMessage: SequenceDiagramData = {
  schemaVersion: "1.0",
  participants: [
    { id: "p1", label: "Participant 1" },
    { id: "p2", label: "Participant 2" },
  ],
  events: [
    { id: "m1", type: "message", from: "p1", to: "p2", label: "Hello" },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Layout Engine", () => {
  describe("calculateParticipantXPositions", () => {
    it("should return correct X positions for 2 participants", () => {
      const positions = calculateParticipantXPositions(2);
      expect(positions).toHaveLength(2);
      expect(positions[0]).toBe(DEFAULT_LAYOUT.canvasPaddingX);
      expect(positions[1]).toBe(
        DEFAULT_LAYOUT.canvasPaddingX + DEFAULT_LAYOUT.participantWidth + DEFAULT_LAYOUT.participantGap
      );
    });

    it("should return correct X positions for 4 participants", () => {
      const positions = calculateParticipantXPositions(4);
      expect(positions).toHaveLength(4);
      // Each subsequent participant is offset by participantWidth + participantGap
      for (let i = 1; i < 4; i++) {
        expect(positions[i]! - positions[i - 1]!).toBe(DEFAULT_LAYOUT.participantWidth + DEFAULT_LAYOUT.participantGap);
      }
    });

    it("should return empty array for 0 participants", () => {
      const positions = calculateParticipantXPositions(0);
      expect(positions).toHaveLength(0);
    });

    it("should return single position for 1 participant", () => {
      const positions = calculateParticipantXPositions(1);
      expect(positions).toHaveLength(1);
      expect(positions[0]).toBe(DEFAULT_LAYOUT.canvasPaddingX);
    });
  });

  describe("calculateCanvasWidth", () => {
    it("should calculate correct width for 2 participants", () => {
      const width = calculateCanvasWidth(2);
      const expected =
        DEFAULT_LAYOUT.canvasPaddingX * 2 +
        2 * DEFAULT_LAYOUT.participantWidth +
        DEFAULT_LAYOUT.participantGap;
      expect(width).toBe(expected);
    });

    it("should increase with more participants", () => {
      const width2 = calculateCanvasWidth(2);
      const width4 = calculateCanvasWidth(4);
      expect(width4).toBeGreaterThan(width2);
    });
  });

  describe("flattenEvents", () => {
    it("should produce correct row count for simple events", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const rows = flattenEvents(normalized.events);
      expect(rows).toHaveLength(1); // 1 message row
    });

    it("should mark message rows correctly", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const rows = flattenEvents(normalized.events);
      expect(rows[0]!.kind).toBe("message");
      expect(rows[0]!.sourceEventId).toBe("m1");
    });

    it("should produce correct row count for multiple events", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Msg 1" },
          { id: "m2", type: "message", from: "p1", to: "p1", label: "Msg 2" },
          { id: "m3", type: "message", from: "p1", to: "p1", label: "Msg 3" },
        ],
      };
      const normalized = normalize(data);
      const rows = flattenEvents(normalized.events);
      expect(rows).toHaveLength(3);
    });

    it("should handle divider rows", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [
          { id: "div1", type: "divider", label: "Section" },
        ],
      };
      const normalized = normalize(data);
      const rows = flattenEvents(normalized.events);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.kind).toBe("divider");
    });

    it("should handle fragment header rows", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "loop",
            branches: [{ id: "b1", events: [] }],
          },
        ],
      };
      const normalized = normalize(data);
      const rows = flattenEvents(normalized.events);
      expect(rows.some((r) => r.kind === "fragment-header")).toBe(true);
      expect(rows.some((r) => r.kind === "branch-header")).toBe(true);
    });

    it("should not add rows for activate/deactivate events", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [
          { id: "a1", type: "activate", participant: "p1" },
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Msg" },
          { id: "d1", type: "deactivate", participant: "p1" },
        ],
      };
      const normalized = normalize(data);
      const rows = flattenEvents(normalized.events);
      // Only message row, not activate/deactivate
      expect(rows).toHaveLength(1);
      expect(rows[0]!.sourceEventId).toBe("m1");
    });
  });

  describe("calculateTotalRowsHeight", () => {
    it("should calculate total height for empty rows", () => {
      const height = calculateTotalRowsHeight([]);
      expect(height).toBe(0);
    });

    it("should calculate total height for single row", () => {
      const rows = flattenEvents(normalize(twoParticipantsOneMessage).events);
      const height = calculateTotalRowsHeight(rows);
      expect(height).toBe(rows[0]!.estimatedHeight);
    });
  });

  describe("layoutSequence", () => {
    it("should produce valid LayoutResult for two participants + one message", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.participants).toHaveLength(2);
      expect(result.messages).toHaveLength(1);
      expect(result.rows).toHaveLength(1);
    });

    it("should calculate correct X coordinates for participants", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.participants[0]!.x).toBe(DEFAULT_LAYOUT.canvasPaddingX);
      expect(result.participants[1]!.x).toBe(
        DEFAULT_LAYOUT.canvasPaddingX + DEFAULT_LAYOUT.participantWidth + DEFAULT_LAYOUT.participantGap
      );
    });

    it("should calculate correct Y coordinates for message row", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      // First row should be at firstEventOffset
      expect(result.rowYPositions[0]).toBe(DEFAULT_LAYOUT.firstEventOffset);
    });

    it("should calculate message fromX and toX correctly", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      const msg = result.messages[0]!;
      const p0 = result.participants[0]!;
      const p1 = result.participants[1]!;
      // Endpoints are lifeline centres, not header-box edges.
      expect(msg.fromX).toBe(p0.x + p0.width / 2);
      expect(msg.toX).toBe(p1.x + p1.width / 2);
    });

    it("should mark self-call messages correctly", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [{ id: "m1", type: "message", from: "p1", to: "p1", label: "Self" }],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.messages[0]!.isSelfCall).toBe(true);
    });

    it("should calculate self-call extra space (toX > fromX)", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [{ id: "m1", type: "message", from: "p1", to: "p1", label: "Self" }],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      const msg = result.messages[0]!;
      expect(msg.isSelfCall).toBe(true);
      // Self-call toX should be further right than fromX
      expect(msg.toX).toBeGreaterThan(msg.fromX);
      expect(msg.selfCallWidth).toBe(DEFAULT_LAYOUT.selfMessageWidth);
    });

    it("should calculate correct bounds", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.bounds.width).toBeGreaterThan(0);
      expect(result.bounds.height).toBeGreaterThan(0);
    });

    it("should produce identical output for same input (pure function)", () => {
      const normalized1 = normalize(twoParticipantsOneMessage);
      const normalized2 = normalize(twoParticipantsOneMessage);

      const result1 = layoutSequence(normalized1);
      const result2 = layoutSequence(normalized2);

      expect(result1.bounds.width).toBe(result2.bounds.width);
      expect(result1.bounds.height).toBe(result2.bounds.height);
      expect(result1.participants[0]!.x).toBe(result2.participants[0]!.x);
      expect(result1.rowYPositions[0]).toBe(result2.rowYPositions[0]);
    });

    it("should handle multiple messages in sequence", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [
          { id: "p1", label: "P1" },
          { id: "p2", label: "P2" },
        ],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p2", label: "Msg 1" },
          { id: "m2", type: "message", from: "p2", to: "p1", label: "Msg 2" },
          { id: "m3", type: "message", from: "p1", to: "p2", label: "Msg 3" },
        ],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.messages).toHaveLength(3);
      expect(result.rows).toHaveLength(3);
      // Y positions should increase for each row
      expect(result.rowYPositions[1]!).toBeGreaterThan(result.rowYPositions[0]!);
      expect(result.rowYPositions[2]!).toBeGreaterThan(result.rowYPositions[1]!);
    });

    it("should handle fragments with correct bounds", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [
          { id: "p1", label: "P1" },
          { id: "p2", label: "P2" },
        ],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "loop",
            branches: [
              {
                id: "b1",
                events: [
                  { id: "m1", type: "message", from: "p1", to: "p2", label: "Inside loop" },
                ],
              },
            ],
          },
        ],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.fragments.length).toBeGreaterThan(0);
      const fragment = result.fragments[0]!;
      expect(fragment.fragmentEventId).toBe("f1");
      expect(fragment.x).toBeDefined();
      expect(fragment.y).toBeDefined();
      expect(fragment.width).toBeGreaterThan(0);
      expect(fragment.height).toBeGreaterThan(0);
    });

    it("should handle notes with correct positioning", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [
          { id: "n1", type: "note", text: "A note", over: ["p1"], placement: "right" },
        ],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.notes).toHaveLength(1);
      const note = result.notes[0]!;
      const p0 = result.participants[0]!;
      expect(note.eventId).toBe("n1");
      expect(note.text).toBe("A note");
      expect(note.placement).toBe("right");
      expect(note.x).toBeGreaterThan(p0.x + p0.width);
    });

    it("should handle dividers spanning all participants", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [
          { id: "p1", label: "P1" },
          { id: "p2", label: "P2" },
          { id: "p3", label: "P3" },
        ],
        events: [
          { id: "div1", type: "divider", label: "Section" },
        ],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.dividers).toHaveLength(1);
      const divider = result.dividers[0]!;
      const p0 = result.participants[0]!;
      const p2 = result.participants[2]!;
      // Divider should span from first to last participant
      expect(divider.width).toBeGreaterThanOrEqual(p2.x + p2.width - p0.x);
    });

    it("should build participantMap correctly", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.participantMap.get("p1")).toBeDefined();
      expect(result.participantMap.get("p2")).toBeDefined();
      expect(result.participantMap.get("p1")!.label).toBe("Participant 1");
    });

    it("should build eventRowMap correctly", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.eventRowMap.get("m1")).toBe(0);
    });

    it("should handle activations", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [
          { id: "a1", type: "activate", participant: "p1" },
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Active" },
          { id: "d1", type: "deactivate", participant: "p1" },
        ],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.activations).toHaveLength(1);
      const activation = result.activations[0]!;
      expect(activation.participantId).toBe("p1");
      expect(activation.activateEventId).toBe("a1");
      expect(activation.deactivateEventId).toBe("d1");
    });

    it("should calculate activation height correctly", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }],
        events: [
          { id: "a1", type: "activate", participant: "p1" },
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Msg 1" },
          { id: "m2", type: "message", from: "p1", to: "p1", label: "Msg 2" },
          { id: "d1", type: "deactivate", participant: "p1" },
        ],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.activations).toHaveLength(1);
      const activation = result.activations[0]!;
      // Activation should span from activate row to deactivate row
      expect(activation.height).toBeGreaterThan(DEFAULT_LAYOUT.rowHeight * 2);
    });

    it("should set participant y to 0 (at top)", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.participants[0]!.y).toBe(0);
      expect(result.participants[1]!.y).toBe(0);
    });

    it("should set participant width from tokens", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.participants[0]!.width).toBe(DEFAULT_LAYOUT.participantWidth);
      expect(result.participants[1]!.width).toBe(DEFAULT_LAYOUT.participantWidth);
    });

    it("should set participant height from tokens", () => {
      const normalized = normalize(twoParticipantsOneMessage);
      const result = layoutSequence(normalized);

      expect(result.participants[0]!.height).toBe(DEFAULT_LAYOUT.participantHeaderHeight);
      expect(result.participants[1]!.height).toBe(DEFAULT_LAYOUT.participantHeaderHeight);
    });

    it("should handle message with return kind", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }, { id: "p2", label: "P2" }],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p2", label: "Request", messageKind: "return" },
        ],
      };
      const normalized = normalize(data);
      const result = layoutSequence(normalized);

      expect(result.messages[0]!.messageKind).toBe("return");
    });
  });
});
