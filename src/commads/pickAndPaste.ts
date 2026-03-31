/**
 * Clipboard Manager - Pick and Paste command.
 * Shows a quick pick list of clipboard history items for pasting.
 *
 * @author Eno Yao
 */

import * as vscode from "vscode";
import { ClipboardManager, IClipboardItem } from "../manager";
import { leftPad } from "../util";
import { commandList } from "./common";

/** Quick pick item wrapping a clipboard history entry. */
class ClipPickItem implements vscode.QuickPickItem {
  public label: string;

  get description(): string | undefined {
    if (this.clip.createdAt) {
      const date = new Date(this.clip.createdAt);
      return date.toLocaleString();
    }
    return undefined;
  }

  constructor(readonly clip: IClipboardItem) {
    this.label = this.clip.value.replace(/\s+/g, " ").trim();
  }
}

/** Command that shows a quick pick of clipboard history and pastes the selection. */
export class PickAndPasteCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.pickAndPaste,
        this.execute,
        this
      )
    );
  }

  protected async execute(): Promise<void> {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const preview = config.get("preview", true);

    const clips = this._manager.clips;
    const maxLength = `${clips.length}`.length;

    const picks = clips.map((c, index) => {
      const item = new ClipPickItem(c);
      const indexNumber = leftPad(index + 1, maxLength, "0");
      item.label = `${indexNumber}) ${item.label}`;
      return item;
    });

    // Variable to check changes in document by preview
    let needUndo = false;

    const options: vscode.QuickPickOptions = {
      placeHolder: "Select one clip to paste. ESC to cancel.",
    };

    /**
     * If preview is enabled, get current text editor and replace
     * current selection.
     * NOTE: no need to paste if the text is replaced.
     */
    if (preview) {
      options.onDidSelectItem = async (selected: vscode.QuickPickItem) => {
        const clipItem = selected as ClipPickItem;
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await editor.edit(
            edit => {
              for (const selection of editor.selections) {
                edit.replace(selection, clipItem.clip.value);
              }
              needUndo = true;
            },
            {
              undoStopAfter: false,
              undoStopBefore: false,
            }
          );
        }
      };
    }

    const pick = await vscode.window.showQuickPick(picks, options);

    if (!pick) {
      if (needUndo) {
        return await vscode.commands.executeCommand("undo");
      }
      return;
    }

    // Update current clip in clipboard
    await this._manager.setClipboardValue(pick.clip.value);

    // If text changed, only need to remove selection
    // If an error occurs on replace, run paste command as fallback
    if (needUndo) {
      // Fix editor selection
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.selections = editor.selections.map(
          s => new vscode.Selection(s.end, s.end)
        );
      } else {
        await vscode.commands.executeCommand("cancelSelection");
      }
    } else {
      await vscode.commands.executeCommand(
        "editor.action.clipboardPasteAction"
      );
    }
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}
