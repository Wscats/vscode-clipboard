/**
 * Clipboard Manager - Copy to History command.
 * Copies the current selection and adds it to clipboard history.
 *
 * @author Eno Yao
 */

import * as vscode from "vscode";
import { Monitor } from "../monitor";
import { commandList } from "./common";

/** Command that copies the current selection and triggers clipboard monitoring. */
export class CopyToHistoryCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected monitor: Monitor) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.copyToHistory,
        this.execute,
        this
      )
    );
  }

  protected async execute(): Promise<void> {
    await vscode.commands.executeCommand("editor.action.clipboardCopyAction");
    await this.monitor.checkChangeText();
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}
