/**
 * Clipboard Manager - VSCode Extension entry point.
 * Registers commands, monitors clipboard changes, and manages history.
 *
 * @author Eno Yao
 */

"use strict";
import * as vscode from "vscode";
import { defaultClipboard } from "./clipboard";
import { ApiGetMonitor } from "./commads/apiGetMonitor";
import { ClearClipboardHistory } from "./commads/clearClipboardHistory";
import { CopyToHistoryCommand } from "./commads/copyToHistory";
import { HistoryTreeDoubleClickCommand } from "./commads/historyTreeDoubleClick";
import { PickAndPasteCommand } from "./commads/pickAndPaste";
import { RemoveClipboardHistory } from "./commads/removeClipboardHistory";
import { SetClipboardValueCommand } from "./commads/setClipboardValue";
import { ShowClipboardInFile } from "./commads/showClipboardInFile";
import { ClipboardCompletion } from "./completion";
import { ClipboardManager } from "./manager";
import { Monitor } from "./monitor";
import { ClipboardTreeDataProvider } from "./tree/history";
import { getErrorMessage } from "./util";

let manager: ClipboardManager;

/**
 * Called when the extension is activated.
 * Sets up clipboard monitoring, commands, tree view, and completion provider.
 */
export async function activate(
  context: vscode.ExtensionContext
): Promise<{ completion: ClipboardCompletion; manager: ClipboardManager } | undefined> {
  const disposable: vscode.Disposable[] = [];

  // Check the clipboard is working
  try {
    await defaultClipboard.readText();
  } catch (error: unknown) {
    console.log(error);
    // Small delay to force show error
    setTimeout(() => {
      const message = getErrorMessage(error);
      vscode.window.showErrorMessage(
        message || "Failed to read value from clipboard, check the console log"
      );
    }, 2000);
    // Disable clipboard listening
    defaultClipboard.dispose();
    return;
  }

  // Add to disposable list the default clipboard
  disposable.push(defaultClipboard);

  const monitor = new Monitor(defaultClipboard);
  disposable.push(monitor);

  manager = new ClipboardManager(context, monitor);
  disposable.push(manager);

  // API Commands
  disposable.push(new ApiGetMonitor(monitor));

  // Commands
  disposable.push(new PickAndPasteCommand(manager));
  disposable.push(new HistoryTreeDoubleClickCommand(manager));
  disposable.push(new SetClipboardValueCommand(manager));
  disposable.push(new RemoveClipboardHistory(manager));
  disposable.push(new ShowClipboardInFile(manager));
  disposable.push(new ClearClipboardHistory(manager));
  disposable.push(new CopyToHistoryCommand(monitor));

  const completion = new ClipboardCompletion(manager);

  // Register completion provider for all file types
  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: "file" },
      completion
    )
  );

  // Register completion provider for untitled (new) files
  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: "untitled" },
      completion
    )
  );

  const clipboardTreeDataProvider = new ClipboardTreeDataProvider(manager);
  disposable.push(clipboardTreeDataProvider);

  disposable.push(
    vscode.window.registerTreeDataProvider(
      "clipboardHistory",
      clipboardTreeDataProvider
    )
  );

  // Configuration update handler
  const updateConfig = (): void => {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    monitor.checkInterval = config.get("checkInterval", 500);
    monitor.onlyWindowFocused = config.get("onlyWindowFocused", true);
    monitor.maxClipboardSize = config.get("maxClipboardSize", 1000000);
  };
  updateConfig();

  disposable.push(
    vscode.workspace.onDidChangeConfiguration(
      e => e.affectsConfiguration("clipboard-manager") && updateConfig()
    )
  );

  context.subscriptions.push(...disposable);

  return {
    completion,
    manager,
  };
}

/**
 * Called when the extension is deactivated.
 * Persists clipboard history to disk.
 */
export function deactivate(): void {
  if (manager) {
    manager.saveClips();
  }
}
