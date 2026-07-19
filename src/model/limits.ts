/**
 * Soft limits to prevent browser resource exhaustion.
 * These can be overridden via config property but not via HTML attributes.
 */

/** Maximum number of participants in a diagram */
export const MAX_PARTICIPANTS = 20;

/** Maximum expanded event rows (after fragment expansion) */
export const MAX_EVENTS = 300;

/** Maximum fragment nesting depth */
export const MAX_DEPTH = 4;

/** Maximum characters in a message label */
export const MAX_MESSAGE_LENGTH = 500;

/** Maximum characters in a note text */
export const MAX_NOTE_LENGTH = 2000;

/** Maximum JSON input size in bytes (1 MB) */
export const MAX_JSON_SIZE = 1024 * 1024;

/** Maximum characters in a participant label */
export const MAX_LABEL_LENGTH = 60;

/** Maximum characters in a fragment/branch label */
export const MAX_FRAGMENT_LABEL_LENGTH = 100;
