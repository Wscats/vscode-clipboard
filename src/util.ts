/**
 * Clipboard Manager - Utility functions.
 *
 * @author Eno Yao
 */

export interface IDisposable {
  dispose(): void;
}

/** Wrap a dispose callback into an IDisposable object. */
export function toDisposable(dispose: () => void): IDisposable {
  return { dispose };
}

/**
 * Left-pad a value with a character to reach the desired size.
 *
 * @param value - The value to pad.
 * @param size - The desired total length.
 * @param char - The padding character (default: space).
 */
export function leftPad(
  value: string | number,
  size: number,
  char: string = " "
): string {
  const chars = char.repeat(size);
  return `${chars}${value}`.slice(-chars.length);
}

/**
 * Sleep for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract an error message from an unknown error value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
