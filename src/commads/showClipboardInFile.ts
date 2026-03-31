/**
 * Clipboard Manager - Show Clipboard In File command.
 * Opens the source file and highlights the location where a clip was copied.
 *
 * @author Eno Yao
 */

import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { ClipHistoryItem } from "../tree/history";
import { commandList } from "./common";

/** Command that navigates to the source location of a clipboard history item. */
export class ShowClipboardInFile implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.showClipboardInFile,
        this.execute,
        this
      )
    );
  }

  protected async execute(item: ClipHistoryItem): Promise<void> {
    const { clip } = item;

    if (!clip.createdLocation) {
      return;
    }

    const uri = clip.createdLocation.uri;
    const document = await vscode.workspace.openTextDocument(uri);

    const opts: vscode.TextDocumentShowOptions = {
      viewColumn: vscode.ViewColumn.Active,
    };

    if (document.getText(clip.createdLocation.range) === clip.value) {
      opts.selection = clip.createdLocation.range;
    } else {
      // Find current position of value in the document
      const indexes: number[] = [];
      const text = document.getText();
      let lastIndex = text.indexOf(clip.value);

      while (lastIndex >= 0) {
        indexes.push(lastIndex);
        lastIndex = text.indexOf(clip.value, lastIndex + 1);
      }

      if (indexes.length > 0) {
        const offset = document.offsetAt(clip.createdLocation.range.start);

        // Sort by distance from initial location
        indexes.sort((a, b) => Math.abs(a - offset) - Math.abs(b - offset));

        const closestIndex = indexes[0];
        if (closestIndex !== undefined && closestIndex >= 0) {
          const range = new vscode.Range(
            document.positionAt(closestIndex),
            document.positionAt(closestIndex + clip.value.length)
          );
          opts.selection = range;
        }
      }
    }

    await vscode.window.showTextDocument(document, opts);
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}
