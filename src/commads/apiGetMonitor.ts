/**
 * Clipboard Manager - API Get Monitor command.
 * Exposes the clipboard monitor instance via a VS Code command API.
 *
 * @author Eno Yao
 */

import * as vscode from "vscode";
import { Monitor } from "../monitor";
import { commandList } from "./common";

/** Command that returns the clipboard monitor instance (for API consumers). */
export class ApiGetMonitor implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected monitor: Monitor) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.apiGetMonitor,
        this.execute,
        this
      )
    );
  }

  protected async execute(): Promise<Monitor> {
    return this.monitor;
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}
