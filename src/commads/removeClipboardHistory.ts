/**
 * Clipboard Manager - Remove Clipboard History command.
 * Removes a specific item from clipboard history.
 *
 * @author Eno Yao
 */

import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { ClipHistoryItem } from "../tree/history";
import { commandList } from "./common";

/** Command that removes a specific item from clipboard history. */
export class RemoveClipboardHistory implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.removeClipboardHistory,
        this.execute,
        this
      )
    );
  }

  protected async execute(value: string | ClipHistoryItem): Promise<void> {
    const clipValue =
      value instanceof ClipHistoryItem ? value.clip.value : value;
    await this._manager.removeClipboardValue(clipValue);
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}
