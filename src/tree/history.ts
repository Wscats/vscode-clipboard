/**
 * Clipboard Manager - Tree view data provider for clipboard history.
 *
 * @author Eno Yao
 */

import * as path from "path";
import * as vscode from "vscode";
import { commandList } from "../commads/common";
import { ClipboardManager, IClipboardItem } from "../manager";
import { leftPad } from "../util";

/** Tree item representing a single clipboard history entry. */
export class ClipHistoryItem extends vscode.TreeItem {
  constructor(readonly clip: IClipboardItem) {
    super(clip.value);

    this.contextValue = "clipHistoryItem:";
    this.label = this.clip.value.replace(/\s+/g, " ").trim();
    this.tooltip = this.clip.value;

    this.command = {
      command: commandList.historyTreeDoubleClick,
      title: "Paste",
      tooltip: "Paste",
      arguments: [this.clip],
    };

    if (this.clip.createdLocation) {
      this.resourceUri = this.clip.createdLocation.uri;
      this.contextValue += "file";
      this.tooltip = `File: ${this.resourceUri.fsPath}\nValue: ${this.tooltip}\n`;
    } else {
      const basePath = path.join(__filename, "..", "..", "..", "resources");
      this.iconPath = {
        light: path.join(basePath, "light", "string.svg"),
        dark: path.join(basePath, "dark", "string.svg"),
      };
    }
  }
}

/** Provides clipboard history items to the VS Code tree view. */
export class ClipboardTreeDataProvider
  implements vscode.TreeDataProvider<ClipHistoryItem>, vscode.Disposable
{
  private _disposables: vscode.Disposable[] = [];

  private _onDidChangeTreeData = new vscode.EventEmitter<
    ClipHistoryItem | null
  >();
  public readonly onDidChangeTreeData: vscode.Event<ClipHistoryItem | null> =
    this._onDidChangeTreeData.event;

  constructor(protected _manager: ClipboardManager) {
    this._manager.onDidChangeClipList(() => {
      this._onDidChangeTreeData.fire(null);
    });
  }

  public getTreeItem(
    element: ClipHistoryItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(
    _element?: ClipHistoryItem
  ): vscode.ProviderResult<ClipHistoryItem[]> {
    const clips = this._manager.clips;
    const maxLength = `${clips.length}`.length;

    return clips.map((c, index) => {
      const item = new ClipHistoryItem(c);
      const indexNumber = leftPad(index + 1, maxLength, "0");
      item.label = `${indexNumber}) ${item.label}`;
      return item;
    });
  }

  public dispose(): void {
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}
