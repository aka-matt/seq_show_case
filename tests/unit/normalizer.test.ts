/**
 * Unit tests for the Normalizer.
 */

import { describe, it, expect } from "vitest";
import { normalize } from "../../src/model/normalizer";
import type { SequenceDiagramData } from "../../src/model/public-types";
import type {
  NormalizedMessageEvent,
  NormalizedNoteEvent,
} from "../../src/model/normalized-types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const minimalData: SequenceDiagramData = {
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

describe("Normalizer", () => {
  describe("normalize", () => {
    it("should fill defaults for messageKind", () => {
      const result = normalize(minimalData);
      const msg = result.events[0] as NormalizedMessageEvent;
      expect(msg.type).toBe("message");
      expect(msg.messageKind).toBe("sync"); // default
    });

    it("should fill defaults for note placement", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [{ id: "n1", type: "note", text: "A note", over: ["p1"] }],
      };
      const result = normalize(data);
      const note = result.events[0] as NormalizedNoteEvent;
      expect(note.type).toBe("note");
      expect(note.placement).toBe("right"); // default
    });

    it("should build participant index", () => {
      const result = normalize(minimalData);
      expect(result.participantIndex.get("p1")).toBe(0);
      expect(result.participantIndex.get("p2")).toBe(1);
    });

    it("should detect self-calls (from === to)", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [{ id: "m1", type: "message", from: "p1", to: "p1", label: "Self call" }],
      };
      const result = normalize(data);
      expect(result.selfCalls).toHaveLength(1);
      expect(result.selfCalls[0]!.eventId).toBe("m1");
      expect(result.selfCalls[0]!.participant).toBe("p1");
    });

    it("should NOT flag regular messages as self-calls", () => {
      const result = normalize(minimalData);
      expect(result.selfCalls).toHaveLength(0);
    });

    it("should match activate/deactivate pairs", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "a1", type: "activate", participant: "p1" },
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Do something" },
          { id: "d1", type: "deactivate", participant: "p1" },
        ],
      };
      const result = normalize(data);
      expect(result.activationPairs).toHaveLength(1);
      expect(result.activationPairs[0]!.activateId).toBe("a1");
      expect(result.activationPairs[0]!.deactivateId).toBe("d1");
      expect(result.unclosedActivations).toHaveLength(0);
    });

    it("should handle nested activations", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "a1", type: "activate", participant: "p1" },
          { id: "a2", type: "activate", participant: "p1" },
          { id: "d2", type: "deactivate", participant: "p1" },
          { id: "d1", type: "deactivate", participant: "p1" },
        ],
      };
      const result = normalize(data);
      expect(result.activationPairs).toHaveLength(2);
      // First deactivate matches second activate (LIFO)
      expect(result.activationPairs[0]!.activateId).toBe("a2");
      expect(result.activationPairs[0]!.deactivateId).toBe("d2");
      expect(result.activationPairs[1]!.activateId).toBe("a1");
      expect(result.activationPairs[1]!.deactivateId).toBe("d1");
    });

    it("should track unclosed activations", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "a1", type: "activate", participant: "p1" },
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Do something" },
          // No deactivate for a1
        ],
      };
      const result = normalize(data);
      expect(result.unclosedActivations).toContain("a1");
      expect(result.activationPairs).toHaveLength(0);
    });

    it("should infer fragment participants from events", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [
          { id: "p1", label: "Participant 1" },
          { id: "p2", label: "Participant 2" },
        ],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "alt",
            branches: [
              {
                id: "b1",
                events: [
                  { id: "m1", type: "message", from: "p1", to: "p2", label: "In fragment" },
                ],
              },
            ],
          },
        ],
      };
      const result = normalize(data);
      const fragment = result.events[0] as any;
      expect(fragment.participants).toEqual(["p1", "p2"]);
    });

    it("should use provided fragment participants when given", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [
          { id: "p1", label: "Participant 1" },
          { id: "p2", label: "Participant 2" },
          { id: "p3", label: "Participant 3" },
        ],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "loop",
            participants: ["p1", "p2"], // Only p1 and p2
            branches: [
              {
                id: "b1",
                events: [
                  { id: "m1", type: "message", from: "p1", to: "p3", label: "Uses p3 too" },
                ],
              },
            ],
          },
        ],
      };
      const result = normalize(data);
      const fragment = result.events[0] as any;
      expect(fragment.participants).toEqual(["p1", "p2"]); // Should NOT include p3
    });

    it("should build event index with row info", () => {
      const result = normalize(minimalData);
      const msgRowInfo = result.eventIndex.get("m1");
      expect(msgRowInfo).toBeDefined();
      expect(msgRowInfo!.row).toBe(0);
      expect(msgRowInfo!.depth).toBe(0);
    });

    it("should set isSelfCall on messages", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Self" },
          { id: "m2", type: "message", from: "p1", to: "p1", label: "Also self" },
        ],
      };
      const result = normalize(data);
      const msg1 = result.events[0] as NormalizedMessageEvent;
      const msg2 = result.events[1] as NormalizedMessageEvent;
      expect(msg1.isSelfCall).toBe(true);
      expect(msg2.isSelfCall).toBe(true);
    });

    it("should preserve normalized participant indices", () => {
      const result = normalize(minimalData);
      expect(result.participants[0]!.index).toBe(0);
      expect(result.participants[1]!.index).toBe(1);
    });

    it("should handle message with explicit sync kind", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p1", label: "Sync", messageKind: "sync" },
        ],
      };
      const result = normalize(data);
      const msg = result.events[0] as NormalizedMessageEvent;
      expect(msg.messageKind).toBe("sync");
    });

    it("should handle message with async kind", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }, { id: "p2", label: "Participant 2" }],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p2", label: "Async", messageKind: "async" },
        ],
      };
      const result = normalize(data);
      const msg = result.events[0] as NormalizedMessageEvent;
      expect(msg.messageKind).toBe("async");
    });

    it("should handle message with return kind", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }, { id: "p2", label: "Participant 2" }],
        events: [
          { id: "m1", type: "message", from: "p2", to: "p1", label: "Return", messageKind: "return" },
        ],
      };
      const result = normalize(data);
      const msg = result.events[0] as NormalizedMessageEvent;
      expect(msg.messageKind).toBe("return");
    });

    it("should normalize note with explicit center placement", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "n1", type: "note", text: "Centered note", over: ["p1"], placement: "center" },
        ],
      };
      const result = normalize(data);
      const note = result.events[0] as NormalizedNoteEvent;
      expect(note.placement).toBe("center");
    });

    it("should handle divider with label", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "div1", type: "divider", label: "Section 1" },
        ],
      };
      const result = normalize(data);
      expect(result.events[0]!.type).toBe("divider");
      expect((result.events[0] as any).label).toBe("Section 1");
    });

    it("should handle divider without label", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          { id: "div1", type: "divider" },
        ],
      };
      const result = normalize(data);
      expect(result.events[0]!.type).toBe("divider");
      expect((result.events[0] as any).label).toBeUndefined();
    });

    it("should produce consistent results for same input", () => {
      const result1 = normalize(minimalData);
      const result2 = normalize(minimalData);
      expect(result1.participantIndex.get("p1")).toBe(result2.participantIndex.get("p1"));
      expect(result1.participantIndex.get("p2")).toBe(result2.participantIndex.get("p2"));
      expect(result1.events.length).toBe(result2.events.length);
    });

    it("should preserve schemaVersion", () => {
      const result = normalize(minimalData);
      expect(result.schemaVersion).toBe("1.0");
    });

    it("should preserve optional root fields", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        id: "diagram-1",
        title: "My Diagram",
        description: "A test diagram",
        participants: [{ id: "p1", label: "P1" }],
        events: [],
      };
      const result = normalize(data);
      expect(result.id).toBe("diagram-1");
      expect(result.title).toBe("My Diagram");
      expect(result.description).toBe("A test diagram");
    });

    it("should normalize events within fragments recursively", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "Participant 1" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "opt",
            branches: [
              {
                id: "b1",
                events: [
                  { id: "m1", type: "message", from: "p1", to: "p1", label: "Inside fragment" },
                ],
              },
            ],
          },
        ],
      };
      const result = normalize(data);
      // The fragment itself doesn't add a row, but the message inside does
      const msgRowInfo = result.eventIndex.get("m1");
      expect(msgRowInfo).toBeDefined();
      expect(msgRowInfo!.depth).toBe(1); // Inside fragment
    });

    it("should handle multiple participants", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [
          { id: "p1", label: "P1" },
          { id: "p2", label: "P2" },
          { id: "p3", label: "P3" },
          { id: "p4", label: "P4" },
        ],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p4", label: "Hello" },
        ],
      };
      const result = normalize(data);
      expect(result.participantIndex.get("p1")).toBe(0);
      expect(result.participantIndex.get("p2")).toBe(1);
      expect(result.participantIndex.get("p3")).toBe(2);
      expect(result.participantIndex.get("p4")).toBe(3);
      expect(result.participants).toHaveLength(4);
    });

    it("should estimate message width based on label length", () => {
      const data: SequenceDiagramData = {
        schemaVersion: "1.0",
        participants: [{ id: "p1", label: "P1" }, { id: "p2", label: "P2" }],
        events: [
          { id: "m1", type: "message", from: "p1", to: "p2", label: "Hi" },
          { id: "m2", type: "message", from: "p1", to: "p2", label: "This is a longer message" },
        ],
      };
      const result = normalize(data);
      const msg1 = result.events[0] as NormalizedMessageEvent;
      const msg2 = result.events[1] as NormalizedMessageEvent;
      expect(msg1.estimatedWidth).toBeLessThan(msg2.estimatedWidth);
    });
  });
});
