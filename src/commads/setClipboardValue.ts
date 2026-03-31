/**
 * Clipboard Manager - Set Clipboard Value command.
 * Updates the clipboard with a specified value.
 *
 * @author Eno Yao
 */

import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { commandList } from "./common";

/** Command that sets the clipboard to a specific value. */
export class SetClipboardValueCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.setClipboardValue,
        this.execute,
        this
      )
    );
  }

  protected async execute(value: string): Promise<void> {
    await this._manager.setClipboardValue(value);
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}
