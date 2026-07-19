/**
 * Pure functions for estimating text dimensions and line counts.
 * All functions are React-independent — pure TypeScript only.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Average character width in pixels at default font size */
const AVG_CHAR_WIDTH = 8;

/** Average character height in pixels at default font size */
const AVG_CHAR_HEIGHT = 16;

/** Note text padding */
const NOTE_PADDING_X = 12;
const NOTE_PADDING_Y = 8;

/** Fragment label padding */
const FRAGMENT_LABEL_PADDING_X = 16;
const FRAGMENT_LABEL_PADDING_Y = 8;

// ---------------------------------------------------------------------------
// Text measurement
// ---------------------------------------------------------------------------

/**
 * Estimates the number of lines text will wrap to.
 * @param text The text to measure
 * @param maxWidth Maximum width in pixels before wrapping
 * @param charWidth Average character width (default 8px)
 */
export function estimateLineCount(
  text: string,
  maxWidth: number,
  charWidth = AVG_CHAR_WIDTH
): number {
  if (text.length === 0) return 1;

  // Count newlines as line breaks
  const explicitLines = text.split("\n").length;

  // Estimate wrapped lines based on width
  const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
  const estimatedWrappedLines = Math.ceil(text.length / charsPerLine);

  return Math.max(1, Math.max(explicitLines, estimatedWrappedLines));
}

/**
 * Estimates the pixel width of text.
 * @param text The text to measure
 * @param charWidth Average character width (default 8px)
 */
export function estimateTextWidth(
  text: string,
  charWidth = AVG_CHAR_WIDTH
): number {
  return text.length * charWidth;
}

/**
 * Estimates the pixel height of text based on line count.
 * @param lineCount Number of lines
 * @param lineHeight Height per line (default 16px)
 */
export function estimateTextHeight(
  lineCount: number,
  lineHeight = AVG_CHAR_HEIGHT
): number {
  return lineCount * lineHeight;
}

/**
 * Estimates note dimensions.
 * @param text Note text content
 * @param maxWidth Maximum width before wrapping
 */
export function estimateNoteDimensions(
  text: string,
  maxWidth: number
): { width: number; height: number; lineCount: number } {
  const lineCount = estimateLineCount(text, maxWidth - NOTE_PADDING_X * 2);
  const textWidth = estimateTextWidth(text);
  const textHeight = estimateTextHeight(lineCount);

  return {
    width: Math.min(textWidth + NOTE_PADDING_X * 2, maxWidth),
    height: textHeight + NOTE_PADDING_Y * 2,
    lineCount,
  };
}

/**
 * Estimates fragment label dimensions.
 * @param label Fragment label text
 */
export function estimateFragmentLabelDimensions(
  label: string
): { width: number; height: number } {
  const textWidth = estimateTextWidth(label);
  const textHeight = AVG_CHAR_HEIGHT;

  return {
    width: textWidth + FRAGMENT_LABEL_PADDING_X * 2,
    height: textHeight + FRAGMENT_LABEL_PADDING_Y * 2,
  };
}
