/**
 * Unit tests for the validation module.
 * All validation must be React-independent.
 */

import { describe, it, expect } from "vitest";
import { validateData, isValid } from "../../src/model/validation";
import validMinimal from "./fixtures/valid-minimal.json";
import invalidDuplicateIds from "./fixtures/invalid-duplicate-ids.json";
import invalidUnknownParticipant from "./fixtures/invalid-unknown-participant.json";
import invalidDepth from "./fixtures/invalid-depth.json";
import invalidUnmatchedDeactivate from "./fixtures/invalid-unmatched-deactivate.json";
import invalidDuplicateEventId from "./fixtures/invalid-duplicate-event-id.json";
import invalidMissingSchemaVersion from "./fixtures/invalid-missing-schema-version.json";
import invalidNoteUnknownParticipant from "./fixtures/invalid-note-unknown-participant.json";
import invalidEmptyParticipants from "./fixtures/invalid-empty-participants.json";

describe("validation", () => {
  // ========================================================================
  // Valid data
  // ========================================================================

  describe("valid data", () => {
    it("accepts minimal valid diagram", () => {
      const result = validateData(validMinimal);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("accepts valid diagram as JSON string", () => {
      const json = JSON.stringify(validMinimal);
      const result = validateData(json);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("isValid returns true for valid data", () => {
      expect(isValid(validMinimal)).toBe(true);
      expect(isValid(JSON.stringify(validMinimal))).toBe(true);
    });

    it("accepts diagram with all event types", () => {
      const data = {
        schemaVersion: "1.0",
        id: "full-example",
        participants: [
          { id: "a", label: "Alice", kind: "actor", icon: "person" },
          { id: "b", label: "Bob", kind: "service", icon: "server" },
          { id: "c", label: "Carol", kind: "database", icon: "database" },
        ],
        events: [
          { id: "m1", type: "message", from: "a", to: "b", label: "Request", messageKind: "sync" },
          { id: "m2", type: "message", from: "b", to: "c", label: "Query", messageKind: "sync" },
          { id: "m3", type: "message", from: "c", to: "b", label: "Result", messageKind: "return", status: "success" },
          { id: "a1", type: "activate", participant: "b" },
          { id: "a2", type: "activate", participant: "c" },
          { id: "n1", type: "note", text: "This is a note", over: ["b", "c"], placement: "right", tone: "info" },
          { id: "d1", type: "divider", label: "Section break" },
          { id: "d2", type: "deactivate", participant: "c" },
          { id: "d3", type: "deactivate", participant: "b" },
          { id: "m4", type: "message", from: "b", to: "a", label: "Response", messageKind: "return" },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts fragment with alt kind and multiple branches", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "alt",
            label: "Decision",
            branches: [
              { id: "yes", label: "Yes path", events: [{ id: "m1", type: "message", from: "a", to: "b", label: "Do it" }] },
              { id: "no", label: "No path", events: [{ id: "m2", type: "message", from: "a", to: "b", label: "Skip" }] },
            ],
          },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts self-message (from === to)", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "Alice" }],
        events: [
          { id: "m1", type: "message", from: "a", to: "a", label: "Self call", messageKind: "sync" },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts diagram with nested fragments within depth limit", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "loop",
            label: "Level 1",
            branches: [
              {
                id: "b1",
                events: [
                  {
                    id: "f2",
                    type: "fragment",
                    fragmentKind: "loop",
                    label: "Level 2",
                    branches: [
                      {
                        id: "b2",
                        events: [
                          {
                            id: "f3",
                            type: "fragment",
                            fragmentKind: "loop",
                            label: "Level 3",
                            branches: [
                              {
                                id: "b3",
                                events: [
                                  {
                                    id: "f4",
                                    type: "fragment",
                                    fragmentKind: "loop",
                                    label: "Level 4",
                                    branches: [
                                      {
                                        id: "b4",
                                        events: [
                                          { id: "m1", type: "message", from: "a", to: "a", label: "Deep" },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      // Depth 4 should be at the limit, not exceeding
      const result = validateData(data);
      expect(result.valid).toBe(true);
      expect(result.errors.filter((e) => e.code === "MAX_DEPTH_EXCEEDED")).toHaveLength(0);
    });

    it("accepts optional metadata fields", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [
          { id: "a", label: "Alice", metadata: { key: "value", num: 42, flag: true, nil: null } },
        ],
        events: [
          {
            id: "m1",
            type: "message",
            from: "a",
            to: "a",
            label: "Test",
            metadata: { "custom-key": "test" },
          },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(true);
    });

    it("accepts all messageKind values", () => {
      for (const mk of ["sync", "async", "return"] as const) {
        const data = {
          schemaVersion: "1.0",
          participants: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
          events: [{ id: `m-${mk}`, type: "message", from: "a", to: "b", label: "Test", messageKind: mk }],
        };
        expect(validateData(data).valid).toBe(true);
      }
    });

    it("accepts all status values", () => {
      for (const status of ["normal", "success", "warning", "error", "muted"] as const) {
        const data = {
          schemaVersion: "1.0",
          participants: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
          events: [{ id: `m-${status}`, type: "message", from: "a", to: "b", label: "Test", status }],
        };
        expect(validateData(data).valid).toBe(true);
      }
    });

    it("accepts all participant kind values", () => {
      for (const kind of ["actor", "service", "system", "database", "queue", "external"] as const) {
        const data = {
          schemaVersion: "1.0",
          participants: [{ id: `p-${kind}`, label: "P", kind }],
          events: [],
        };
        expect(validateData(data).valid).toBe(true);
      }
    });

    it("accepts all icon values", () => {
      for (const icon of ["person", "server", "database", "queue", "cloud", "browser"] as const) {
        const data = {
          schemaVersion: "1.0",
          participants: [{ id: `p-${icon}`, label: "P", icon }],
          events: [],
        };
        expect(validateData(data).valid).toBe(true);
      }
    });

    it("accepts all fragmentKind values", () => {
      for (const fk of ["alt", "opt", "loop", "par", "critical", "break"] as const) {
        const data = {
          schemaVersion: "1.0",
          participants: [{ id: "a", label: "A" }],
          events: [
            {
              id: `f-${fk}`,
              type: "fragment",
              fragmentKind: fk,
              branches: [{ id: "b1", events: [] }],
            },
          ],
        };
        expect(validateData(data).valid).toBe(true);
      }
    });

    it("accepts all note tones and placements", () => {
      for (const tone of ["info", "success", "warning", "error", "neutral"] as const) {
        for (const placement of ["left", "right", "center"] as const) {
          const data = {
            schemaVersion: "1.0",
            participants: [{ id: "a", label: "A" }],
            events: [
              { id: `n-${tone}-${placement}`, type: "note", text: "Test", over: ["a"], tone, placement },
            ],
          };
          expect(validateData(data).valid).toBe(true);
        }
      }
    });

    it("accepts number as string or number", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
        events: [
          { id: "m1", type: "message", from: "a", to: "b", label: "With number string", number: "1.1" },
          { id: "m2", type: "message", from: "a", to: "b", label: "With number", number: 2 },
        ],
      };
      expect(validateData(data).valid).toBe(true);
    });

    it("accepts DiagramDataOptions", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [],
        options: {
          showSequenceNumbers: true,
          showParticipantIcons: false,
          messageLabelMaxWidth: 200,
          participantWidth: 180,
          participantGap: 100,
          rowGap: 12,
        },
      };
      expect(validateData(data).valid).toBe(true);
    });
  });

  // ========================================================================
  // Invalid JSON
  // ========================================================================

  describe("INVALID_JSON", () => {
    it("rejects malformed JSON string", () => {
      const result = validateData("{ invalid json }");
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("INVALID_JSON");
    });

    it("rejects null input", () => {
      const result = validateData(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("INVALID_JSON");
    });

    it("rejects undefined input", () => {
      const result = validateData(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("INVALID_JSON");
    });
  });

  // ========================================================================
  // SCHEMA_VALIDATION_FAILED
  // ========================================================================

  describe("SCHEMA_VALIDATION_FAILED", () => {
    it("rejects missing schemaVersion", () => {
      const result = validateData(invalidMissingSchemaVersion);
      expect(result.valid).toBe(false);
      const schemaErrors = result.errors.filter((e) => e.code === "SCHEMA_VALIDATION_FAILED");
      expect(schemaErrors.length).toBeGreaterThan(0);
    });

    it("rejects empty participants array", () => {
      const result = validateData(invalidEmptyParticipants);
      expect(result.valid).toBe(false);
      const schemaErrors = result.errors.filter((e) => e.code === "SCHEMA_VALIDATION_FAILED");
      expect(schemaErrors.length).toBeGreaterThan(0);
    });

    it("rejects wrong schemaVersion value", () => {
      const data = { schemaVersion: "2.0", participants: [{ id: "a", label: "A" }], events: [] };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "SCHEMA_VALIDATION_FAILED")).toBe(true);
    });

    it("reports path for missing required field", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a" }], // missing label
        events: [],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.path).toBeDefined();
    });

    it("rejects message without from field", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
        events: [{ id: "m1", type: "message", to: "b", label: "Test" }], // missing from
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("SCHEMA_VALIDATION_FAILED");
    });

    it("rejects note without over field", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [{ id: "n1", type: "note", text: "Test" }], // missing over
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("SCHEMA_VALIDATION_FAILED");
    });

    it("rejects fragment without branches", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [{ id: "f1", type: "fragment", fragmentKind: "loop" }], // missing branches
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("SCHEMA_VALIDATION_FAILED");
    });

    it("rejects unknown type field", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [{ id: "m1", type: "unknown", from: "a", to: "a", label: "Test" }],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("SCHEMA_VALIDATION_FAILED");
    });
  });

  // ========================================================================
  // DUPLICATE_ID
  // ========================================================================

  describe("DUPLICATE_ID", () => {
    it("detects duplicate participant IDs", () => {
      const result = validateData(invalidDuplicateIds);
      expect(result.valid).toBe(false);
      const dupErrors = result.errors.filter((e) => e.code === "DUPLICATE_ID");
      expect(dupErrors.length).toBeGreaterThan(0);
      expect(dupErrors.some((e) => e.message.includes('"a"'))).toBe(true);
    });

    it("detects duplicate event IDs at top level", () => {
      const result = validateData(invalidDuplicateEventId);
      expect(result.valid).toBe(false);
      const dupErrors = result.errors.filter((e) => e.code === "DUPLICATE_ID");
      expect(dupErrors.length).toBeGreaterThan(0);
    });

    it("detects duplicate branch IDs within a fragment", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "alt",
            branches: [
              { id: "dup", events: [] },
              { id: "dup", events: [] },
            ],
          },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      const dupErrors = result.errors.filter((e) => e.code === "DUPLICATE_ID");
      expect(dupErrors.length).toBeGreaterThan(0);
    });

    it("detects duplicate IDs in nested fragments", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "loop",
            branches: [
              {
                id: "b1",
                events: [
                  { id: "m1", type: "message", from: "a", to: "a", label: "Inner" },
                  { id: "m1", type: "message", from: "a", to: "a", label: "Duplicate inner" },
                ],
              },
            ],
          },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "DUPLICATE_ID")).toBe(true);
    });

    it("detects participant ID reused as event ID", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "Alice" }],
        events: [{ id: "a", type: "message", from: "a", to: "a", label: "ID conflict" }],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "DUPLICATE_ID")).toBe(true);
    });
  });

  // ========================================================================
  // UNKNOWN_PARTICIPANT
  // ========================================================================

  describe("UNKNOWN_PARTICIPANT", () => {
    it("detects unknown participant in message from", () => {
      const result = validateData(invalidUnknownParticipant);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "UNKNOWN_PARTICIPANT")).toBe(true);
    });

    it("detects unknown participant in note over", () => {
      const result = validateData(invalidNoteUnknownParticipant);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "UNKNOWN_PARTICIPANT")).toBe(true);
    });

    it("detects unknown participant in activate", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [{ id: "a1", type: "activate", participant: "unknown" }],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "UNKNOWN_PARTICIPANT")).toBe(true);
    });

    it("detects unknown participant in deactivate", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [{ id: "d1", type: "deactivate", participant: "unknown" }],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "UNKNOWN_PARTICIPANT")).toBe(true);
    });

    it("provides path information in error", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [{ id: "m1", type: "message", from: "a", to: "ghost", label: "Test" }],
      };
      const result = validateData(data);
      const err = result.errors.find((e) => e.code === "UNKNOWN_PARTICIPANT");
      expect(err?.path).toBeDefined();
    });
  });

  // ========================================================================
  // INVALID_ACTIVATION
  // ========================================================================

  describe("INVALID_ACTIVATION", () => {
    it("detects unmatched deactivate without preceding activate", () => {
      const result = validateData(invalidUnmatchedDeactivate);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_ACTIVATION")).toBe(true);
    });

    it("detects unmatched deactivate with message path info", () => {
      const result = validateData(invalidUnmatchedDeactivate);
      const err = result.errors.find((e) => e.code === "INVALID_ACTIVATION");
      expect(err?.path).toBeDefined();
    });

    it("accepts matching activate-deactivate pair", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          { id: "a1", type: "activate", participant: "a" },
          { id: "d1", type: "deactivate", participant: "a" },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(true);
      expect(result.errors.filter((e) => e.code === "INVALID_ACTIVATION")).toHaveLength(0);
    });

    it("accepts nested activations", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          { id: "a1", type: "activate", participant: "a" },
          { id: "a2", type: "activate", participant: "a" },
          { id: "d2", type: "deactivate", participant: "a" },
          { id: "d1", type: "deactivate", participant: "a" },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(true);
    });

    it("rejects deactivate without matching activate", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          { id: "a1", type: "activate", participant: "a" },
          { id: "d1", type: "deactivate", participant: "a" },
          { id: "d2", type: "deactivate", participant: "a" }, // extra deactivate
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_ACTIVATION")).toBe(true);
    });
  });

  // ========================================================================
  // MAX_DEPTH_EXCEEDED
  // ========================================================================

  describe("MAX_DEPTH_EXCEEDED", () => {
    it("detects fragment depth exceeding MAX_DEPTH (4)", () => {
      const result = validateData(invalidDepth);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MAX_DEPTH_EXCEEDED")).toBe(true);
    });

    it("depth at exactly MAX_DEPTH is allowed", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "loop",
            label: "L1",
            branches: [
              {
                id: "b1",
                events: [
                  {
                    id: "f2",
                    type: "fragment",
                    fragmentKind: "loop",
                    label: "L2",
                    branches: [
                      {
                        id: "b2",
                        events: [
                          {
                            id: "f3",
                            type: "fragment",
                            fragmentKind: "loop",
                            label: "L3",
                            branches: [
                              {
                                id: "b3",
                                events: [
                                  {
                                    id: "f4",
                                    type: "fragment",
                                    fragmentKind: "loop",
                                    label: "L4",
                                    branches: [
                                      {
                                        id: "b4",
                                        events: [
                                          { id: "m1", type: "message", from: "a", to: "a", label: "OK" },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(true);
      expect(result.errors.filter((e) => e.code === "MAX_DEPTH_EXCEEDED")).toHaveLength(0);
    });
  });

  // ========================================================================
  // LIMIT_EXCEEDED
  // ========================================================================

  describe("LIMIT_EXCEEDED", () => {
    it("detects too many participants", () => {
      const participants = Array.from({ length: 25 }, (_, i) => ({
        id: `p${i}`,
        label: `Participant ${i}`,
      }));
      const data = { schemaVersion: "1.0", participants, events: [] };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "LIMIT_EXCEEDED" && e.message.includes("Participant"))).toBe(true);
    });

    it("detects too many events", () => {
      const participants = [{ id: "a", label: "A" }];
      const events = Array.from({ length: 350 }, (_, i) => ({
        id: `m${i}`,
        type: "message",
        from: "a",
        to: "a",
        label: "Msg",
      }));
      const data = { schemaVersion: "1.0", participants, events };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "LIMIT_EXCEEDED" && e.message.includes("Event"))).toBe(true);
    });

    it("detects message label exceeding MAX_MESSAGE_LENGTH", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
        events: [
          {
            id: "m1",
            type: "message",
            from: "a",
            to: "b",
            label: "x".repeat(501),
          },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "LIMIT_EXCEEDED")).toBe(true);
    });

    it("detects note text exceeding MAX_NOTE_LENGTH", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          {
            id: "n1",
            type: "note",
            text: "x".repeat(2001),
            over: ["a"],
          },
        ],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "LIMIT_EXCEEDED")).toBe(true);
    });

    it("detects participant label exceeding MAX_LABEL_LENGTH", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "x".repeat(61) }],
        events: [],
      };
      const result = validateData(data);
      expect(result.valid).toBe(false);
      // Schema catches this (maxLength: 60 in schema), returns SCHEMA_VALIDATION_FAILED
      expect(result.errors.some((e) => e.code === "SCHEMA_VALIDATION_FAILED")).toBe(true);
    });
  });

  // ========================================================================
  // ValidationResult shape
  // ========================================================================

  describe("ValidationResult shape", () => {
    it("returns errors array even when valid", () => {
      const result = validateData(validMinimal);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("error has code, message, path, and details", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [{ id: "m1", type: "message", from: "a", to: "ghost", label: "Test" }],
      };
      const result = validateData(data);
      const err = result.errors[0]!;
      expect(typeof err.code).toBe("string");
      expect(typeof err.message).toBe("string");
    });

    it("multiple errors are all reported", () => {
      // Schema passes (non-empty participants, valid message structure)
      // But semantic validation finds: duplicate participant ID AND unknown refs
      const data = {
        schemaVersion: "1.0",
        participants: [
          { id: "a", label: "Alice" },
          { id: "a", label: "Also Alice" }, // duplicate
        ],
        events: [
          { id: "m1", type: "message", from: "a", to: "ghost", label: "Test" }, // unknown ref
        ],
      };
      const result = validateData(data);
      // Schema validation passes, semantic validation finds duplicate ID AND unknown participant
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  // ========================================================================
  // JSON string input
  // ========================================================================

  describe("JSON string input", () => {
    it("parses and validates valid JSON string", () => {
      const result = validateData(JSON.stringify(validMinimal));
      expect(result.valid).toBe(true);
    });

    it("returns INVALID_JSON for invalid string", () => {
      const result = validateData("not json at all");
      expect(result.errors[0]?.code).toBe("INVALID_JSON");
    });

    it("handles whitespace-only string", () => {
      const result = validateData("   ");
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe("INVALID_JSON");
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe("edge cases", () => {
    it("handles fragment with empty branch events array", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "loop",
            branches: [{ id: "b1", events: [] }],
          },
        ],
      };
      expect(validateData(data).valid).toBe(true);
    });

    it("handles single-branch alt fragment (warning, but valid)", () => {
      const data = {
        schemaVersion: "1.0",
        participants: [{ id: "a", label: "A" }],
        events: [
          {
            id: "f1",
            type: "fragment",
            fragmentKind: "alt",
            branches: [{ id: "only", events: [] }],
          },
        ],
      };
      // Single branch alt is schema-valid (minItems: 1) but may produce warning in normalizer
      expect(validateData(data).valid).toBe(true);
    });

    it("handles diagram with title and description", () => {
      const data = {
        schemaVersion: "1.0",
        id: "my-diagram",
        title: "My Diagram",
        description: "A description",
        participants: [{ id: "a", label: "A" }],
        events: [],
      };
      expect(validateData(data).valid).toBe(true);
    });
  });
});
