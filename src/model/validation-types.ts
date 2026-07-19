/**
 * Structured error and warning types returned by the validator.
 * These types are React-independent — they are plain TypeScript.
 */

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export type ErrorCode =
  | "INVALID_JSON"
  | "SCHEMA_VALIDATION_FAILED"
  | "DUPLICATE_ID"
  | "UNKNOWN_PARTICIPANT"
  | "INVALID_ACTIVATION"
  | "MAX_DEPTH_EXCEEDED"
  | "LIMIT_EXCEEDED"
  | "RENDER_FAILED";

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export interface SequenceDiagramError {
  code: ErrorCode;
  message: string;
  path?: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Warning codes
// ---------------------------------------------------------------------------

export type WarningCode =
  | "UNCLOSED_ACTIVATION"
  | "SINGLE_BRANCH_FRAGMENT"
  | "MISSING_FRAGMENT_LABEL"
  | "AUTO_CLOSED_ACTIVATION";

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

export interface SequenceDiagramWarning {
  code: WarningCode;
  message: string;
  path?: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: SequenceDiagramError[];
  warnings: SequenceDiagramWarning[];
}

/** Alias for backward compatibility */
export type ValidationWarnings = SequenceDiagramWarning[];
