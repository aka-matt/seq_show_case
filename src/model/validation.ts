/**
 * Ajv-based JSON Schema validator + semantic validation.
 * All validation is React-independent — pure TypeScript only.
 */

import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

import type { SequenceDiagramData, SequenceEvent } from "./public-types";

import type {
  SequenceDiagramError,
  SequenceDiagramWarning,
  ValidationResult,
  ErrorCode,
} from "./validation-types";

import {
  MAX_PARTICIPANTS,
  MAX_EVENTS,
  MAX_DEPTH,
  MAX_MESSAGE_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_JSON_SIZE,
  MAX_LABEL_LENGTH,
  MAX_FRAGMENT_LABEL_LENGTH,
} from "./limits";

// ---------------------------------------------------------------------------
// AJV setup
// ---------------------------------------------------------------------------

const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
  validateFormats: true,
});

addFormats(ajv);

// Load schema dynamically (bundled with the library)
import schema from "../../schemas/sequence-diagram.schema.json";

const validateSchema: ValidateFunction = ajv.compile(schema);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function error(code: ErrorCode, message: string, path?: string, details?: unknown): SequenceDiagramError {
  const err: SequenceDiagramError = { code, message };
  if (path !== undefined) err.path = path;
  if (details !== undefined) err.details = details;
  return err;
}

/** Collect all event IDs including nested ones */
function collectEventIds(events: SequenceEvent[], prefix = ""): string[] {
  const ids: string[] = [];
  for (const event of events) {
    const path = prefix ? `${prefix}/${event.id}` : event.id;
    ids.push(event.id);
    if (event.type === "fragment") {
      for (const branch of event.branches) {
        const branchPath = `${path}/branches/${branch.id}`;
        ids.push(branch.id);
        ids.push(...collectEventIds(branch.events, branchPath));
      }
    }
  }
  return ids;
}

/** Flatten all events (including nested) for counting */
function flattenEvents(events: SequenceEvent[]): SequenceEvent[] {
  const result: SequenceEvent[] = [];
  function flatten(evs: SequenceEvent[]): void {
    for (const ev of evs) {
      result.push(ev);
      if (ev.type === "fragment") {
        for (const branch of ev.branches) {
          flatten(branch.events);
        }
      }
    }
  }
  flatten(events);
  return result;
}

/** Check fragment depth */
function getMaxFragmentDepth(events: SequenceEvent[], currentDepth = 0): number {
  let maxDepth = currentDepth;
  for (const ev of events) {
    if (ev.type === "fragment") {
      for (const branch of ev.branches) {
        const branchDepth = getMaxFragmentDepth(branch.events, currentDepth + 1);
        maxDepth = Math.max(maxDepth, branchDepth);
      }
    }
  }
  return maxDepth;
}

/** Collect all participant IDs referenced in events */
function collectParticipantRefs(events: SequenceEvent[]): string[] {
  const refs: string[] = [];
  function collect(evs: SequenceEvent[]): void {
    for (const ev of evs) {
      if (ev.type === "message") {
        refs.push(ev.from);
        refs.push(ev.to);
      } else if (ev.type === "note") {
        refs.push(...ev.over);
      } else if (ev.type === "activate" || ev.type === "deactivate") {
        refs.push(ev.participant);
      } else if (ev.type === "fragment") {
        for (const branch of ev.branches) {
          collect(branch.events);
        }
      }
    }
  }
  collect(events);
  return refs;
}

/** Validate activation/deactivation pairing - returns unmatched deactivates */
function validateActivations(events: SequenceEvent[]): SequenceDiagramError[] {
  const errors: SequenceDiagramError[] = [];
  // Use a stack-based approach per participant
  const stacks: Map<string, { id: string; activateRow: number }[]> = new Map();

  function process(evs: SequenceEvent[], row = 0): void {
    for (const ev of evs) {
      if (ev.type === "activate") {
        const stack = stacks.get(ev.participant) ?? [];
        stack.push({ id: ev.id, activateRow: row });
        stacks.set(ev.participant, stack);
      } else if (ev.type === "deactivate") {
        const stack = stacks.get(ev.participant) ?? [];
        if (stack.length === 0) {
          errors.push(
            error(
              "INVALID_ACTIVATION",
              `Deactivate '${ev.id}' has no matching activate for participant '${ev.participant}'`,
              `/events/${ev.id}`
            )
          );
        } else {
          stack.pop();
          stacks.set(ev.participant, stack);
        }
      } else if (ev.type === "fragment") {
        for (const branch of ev.branches) {
          process(branch.events, row + 1);
        }
      }
    }
  }

  process(events);

  // Unmatched activates are not errors — they auto-close with a warning in normalizer
  // But unmatched deactivates are errors (caught above)

  return errors;
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validates a raw JSON input (string or object) against the JSON Schema
 * and performs semantic validation.
 *
 * All functions are pure TypeScript — no React dependencies.
 */
export function validateData(input: unknown): ValidationResult {
  const errors: SequenceDiagramError[] = [];
  const warnings: SequenceDiagramWarning[] = [];

  // 1. Check JSON size
  if (typeof input === "string") {
    if (new TextEncoder().encode(input).length > MAX_JSON_SIZE) {
      return {
        valid: false,
        errors: [error("LIMIT_EXCEEDED", `JSON size exceeds ${MAX_JSON_SIZE} bytes (1 MB)`)],
        warnings: [],
      };
    }
    try {
      input = JSON.parse(input);
    } catch {
      return {
        valid: false,
        errors: [error("INVALID_JSON", "Failed to parse JSON string")],
        warnings: [],
      };
    }
  }

  if (input === null || input === undefined) {
    return {
      valid: false,
      errors: [error("INVALID_JSON", "Input is null or undefined")],
      warnings: [],
    };
  }

  // 2. Schema validation
  const valid = validateSchema(input);
  if (!valid && validateSchema.errors) {
    for (const err of validateSchema.errors) {
      const path = err.instancePath
        ? err.instancePath.replace(/^\//, "/").replace(/\//g, "/") || "/"
        : "/";
      let message = err.message ?? "Validation error";
      if (err.keyword === "required") {
        message = `Missing required field: ${(err.params as { missingProperty: string }).missingProperty}`;
      } else if (err.keyword === "additionalProperties") {
        message = `Unknown field: ${(err.params as { additionalProperty: string }).additionalProperty}`;
      }
      errors.push(
        error("SCHEMA_VALIDATION_FAILED", message, path, {
          keyword: err.keyword,
          schemaPath: err.schemaPath,
        })
      );
    }
    return { valid: false, errors, warnings };
  }

  const data = input as SequenceDiagramData;

  // 3. Check schemaVersion
  if (data.schemaVersion !== "1.0") {
    errors.push(
      error(
        "SCHEMA_VALIDATION_FAILED",
        `schemaVersion must be "1.0", got "${data.schemaVersion}"`,
        "/schemaVersion"
      )
    );
  }

  // 4. Participant ID uniqueness
  const participantIds = data.participants.map((p) => p.id);
  const duplicateParticipantIds = participantIds.filter(
    (id, i) => participantIds.indexOf(id) !== i
  );
  if (duplicateParticipantIds.length > 0) {
    for (const id of duplicateParticipantIds) {
      errors.push(error("DUPLICATE_ID", `Duplicate participant ID: "${id}"`, `/participants`));
    }
  }

  // 5. Event ID uniqueness (including nested)
  const allEventIds = collectEventIds(data.events);
  const seenEventIds = new Set<string>();
  const duplicateEventIds = new Set<string>();
  for (const id of allEventIds) {
    // Also check participant IDs are not reused as event IDs
    if (seenEventIds.has(id)) {
      duplicateEventIds.add(id);
    }
    seenEventIds.add(id);
  }
  // Check participant IDs don't conflict with event IDs
  for (const pid of participantIds) {
    if (seenEventIds.has(pid)) {
      errors.push(
        error(
          "DUPLICATE_ID",
          `Participant ID "${pid}" is also used as an event ID`,
          `/participants`
        )
      );
    }
  }
  for (const id of duplicateEventIds) {
    errors.push(error("DUPLICATE_ID", `Duplicate event ID: "${id}"`));
  }

  // 6. Participant reference validation
  const participantIdSet = new Set(participantIds);
  const allRefs = collectParticipantRefs(data.events);
  for (const ref of allRefs) {
    if (!participantIdSet.has(ref)) {
      errors.push(
        error(
          "UNKNOWN_PARTICIPANT",
          `Unknown participant referenced: "${ref}"`,
          "/events"
        )
      );
    }
  }

  // 7. Activation/deactivation pairing
  errors.push(...validateActivations(data.events));

  // 8. Fragment depth
  const maxDepth = getMaxFragmentDepth(data.events);
  if (maxDepth > MAX_DEPTH) {
    errors.push(
      error(
        "MAX_DEPTH_EXCEEDED",
        `Fragment nesting depth ${maxDepth} exceeds limit of ${MAX_DEPTH}`,
        "/events"
      )
    );
  }

  // 9. Size limits
  if (data.participants.length > MAX_PARTICIPANTS) {
    errors.push(
      error(
        "LIMIT_EXCEEDED",
        `Participant count ${data.participants.length} exceeds limit of ${MAX_PARTICIPANTS}`,
        "/participants"
      )
    );
  }

  const flattenedEvents = flattenEvents(data.events);
  if (flattenedEvents.length > MAX_EVENTS) {
    errors.push(
      error(
        "LIMIT_EXCEEDED",
        `Event count ${flattenedEvents.length} exceeds limit of ${MAX_EVENTS}`,
        "/events"
      )
    );
  }

  // Label length checks
  for (const p of data.participants) {
    if (p.label.length > MAX_LABEL_LENGTH) {
      errors.push(
        error(
          "LIMIT_EXCEEDED",
          `Participant label "${p.label}" exceeds ${MAX_LABEL_LENGTH} characters`,
          `/participants/${p.id}`
        )
      );
    }
  }

  function checkMessageLabels(evs: SequenceEvent[], path: string): void {
    for (const ev of evs) {
      const evPath = `${path}/${ev.id}`;
      if (ev.type === "message") {
        if (ev.label.length > MAX_MESSAGE_LENGTH) {
          errors.push(
            error(
              "LIMIT_EXCEEDED",
              `Message label exceeds ${MAX_MESSAGE_LENGTH} characters`,
              evPath
            )
          );
        }
      } else if (ev.type === "note") {
        if (ev.text.length > MAX_NOTE_LENGTH) {
          errors.push(
            error(
              "LIMIT_EXCEEDED",
              `Note text exceeds ${MAX_NOTE_LENGTH} characters`,
              evPath
            )
          );
        }
      } else if (ev.type === "fragment") {
        if (ev.label && ev.label.length > MAX_FRAGMENT_LABEL_LENGTH) {
          errors.push(
            error(
              "LIMIT_EXCEEDED",
              `Fragment label exceeds ${MAX_FRAGMENT_LABEL_LENGTH} characters`,
              evPath
            )
          );
        }
        for (const branch of ev.branches) {
          const branchPath = `${evPath}/branches/${branch.id}`;
          if (branch.label && branch.label.length > MAX_FRAGMENT_LABEL_LENGTH) {
            errors.push(
              error(
                "LIMIT_EXCEEDED",
                `Branch label exceeds ${MAX_FRAGMENT_LABEL_LENGTH} characters`,
                branchPath
              )
            );
          }
          checkMessageLabels(branch.events, branchPath);
        }
      }
    }
  }

  checkMessageLabels(data.events, "/events");

  // 10. Fragment branch ID uniqueness within fragment
  function checkFragmentBranchIds(evs: SequenceEvent[], path: string): void {
    for (const ev of evs) {
      const evPath = `${path}/${ev.id}`;
      if (ev.type === "fragment") {
        const branchIds = ev.branches.map((b) => b.id);
        const seen = new Set<string>();
        for (const bid of branchIds) {
          if (seen.has(bid)) {
            errors.push(
              error(
                "DUPLICATE_ID",
                `Duplicate branch ID "${bid}" in fragment "${ev.id}"`,
                `${evPath}/branches`
              )
            );
          }
          seen.add(bid);
        }
        for (const branch of ev.branches) {
          checkFragmentBranchIds(branch.events, `${evPath}/branches/${branch.id}`);
        }
      }
    }
  }

  checkFragmentBranchIds(data.events, "/events");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convenience wrapper: returns true if data is valid.
 */
export function isValid(input: unknown): boolean {
  return validateData(input).valid;
}
