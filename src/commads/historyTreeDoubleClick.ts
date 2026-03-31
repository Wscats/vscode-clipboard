import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { IClipboardTextChange } from "../monitor";
import { commandList } from "./common";

/**
 * Clipboard Manager - History Tree Double Click command.
 * Emulates double-click behavior on tree view history items.
 *
 * @author Eno Yao
 */

import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { IClipboardTextChange } from "../monitor";
import { commandList } from "./common";

/** Double-click detection threshold in milliseconds. */
const DOUBLE_CLICK_THRESHOLD_MS = 500;

/** Command that pastes a clip on double-click in the history tree view. */
export class HistoryTreeDoubleClickCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  private prevClip: IClipboardTextChange | undefined;
  private prevTime = Date.now();

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.historyTreeDoubleClick,
        this.execute,
        this
      )
    );
  }

  /**
   * Emulate double click on tree view history.
   * First click records the clip; second click within threshold pastes it.
   */
  protected async execute(clip: IClipboardTextChange): Promise<void> {
    const now = Date.now();
    if (this.prevClip !== clip) {
      this.prevClip = clip;
      this.prevTime = now;
      return;
    }

    const diff = now - this.prevTime;
    this.prevTime = now;

    if (diff > DOUBLE_CLICK_THRESHOLD_MS) {
      return;
    }

    // Reset double click
    this.prevClip = undefined;

    // Update current clip in clipboard
    await this._manager.setClipboardValue(clip.value);

    // Force focus on editor so paste command works
    await vscode.commands.executeCommand(
      "workbench.action.focusActiveEditorGroup"
    );

    // Run default paste
    await vscode.commands.executeCommand(
      "editor.action.clipboardPasteAction"
    );
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}
