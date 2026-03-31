import * as clipboardy from "clipboardy";
import * as vscode from "vscode";

/**
 * Clipboard Manager - Core clipboard abstraction layer.
 * Provides base class and implementations for reading/writing clipboard text.
 *
 * @author Eno Yao
 */

import * as clipboardy from "clipboardy";
import * as vscode from "vscode";

/**
 * Clipboard base class to read and write text and detect changes.
 * Subclasses must implement `readTextInternal` and `writeTextInternal`.
 */
export abstract class BaseClipboard {
  protected _disposables: vscode.Disposable[] = [];

  private _onDidWillWriteText = new vscode.EventEmitter<string>();
  public readonly onDidWillWriteText = this._onDidWillWriteText.event;

  private _onDidWriteText = new vscode.EventEmitter<string>();
  public readonly onDidWriteText = this._onDidWriteText.event;

  constructor() {
    this._disposables.push(this._onDidWillWriteText);
    this._disposables.push(this._onDidWriteText);
  }

  /** Read text from the clipboard. */
  public readText(): Thenable<string> {
    return this.readTextInternal();
  }

  /** Write text to the clipboard, firing pre/post events. */
  public async writeText(value: string): Promise<void> {
    this._onDidWillWriteText.fire(value);
    await this.writeTextInternal(value);
    this._onDidWriteText.fire(value);
  }

  protected abstract readTextInternal(): Thenable<string>;
  protected abstract writeTextInternal(value: string): Thenable<void>;

  public dispose(): void {
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}

/** Clipboard implementation using VS Code's built-in clipboard API. */
export class VSCodeClipboard extends BaseClipboard {
  protected readTextInternal(): Thenable<string> {
    return vscode.env.clipboard.readText();
  }
  protected writeTextInternal(value: string): Thenable<void> {
    return vscode.env.clipboard.writeText(value);
  }
}

/** Error shape returned by clipboardy on Windows failures. */
interface ClipboardyError {
  stderr?: string;
  message?: string;
}

/** Clipboard implementation using the `clipboardy` npm package. */
export class ClipboardyClipboard extends BaseClipboard {
  protected readTextInternal(): Thenable<string> {
    let promise = clipboardy.read();

    /**
     * Fix problem in `clipboardy` when clipboard text is empty on Windows.
     * Example: After power up or after a print screen.
     */
    if (process.platform === "win32") {
      promise = promise.then(null, (reason: unknown) => {
        const ignoreMessage =
          "thread 'main' panicked at 'Error: Could not paste from clipboard: Error { repr: Os { code: 0, message:";

        const err = reason as ClipboardyError;
        if (err?.stderr && err.stderr.startsWith(ignoreMessage)) {
          // Return empty content for known benign error
          return "";
        }

        throw reason;
      });
    }

    return promise;
  }
  protected writeTextInternal(value: string): Thenable<void> {
    return clipboardy.write(value);
  }
}

/**
 * Create a new default clipboard instance.
 * Prefers VS Code's built-in clipboard; falls back to clipboardy.
 */
export function getNewDefaultInstance(): BaseClipboard {
  try {
    vscode.env.clipboard.readText();
    return new VSCodeClipboard();
  } catch {
    // VS Code clipboard not available, fall back to clipboardy
  }

  return new ClipboardyClipboard();
}

export const defaultClipboard: BaseClipboard = getNewDefaultInstance();
