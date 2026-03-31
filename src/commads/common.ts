/**
 * Clipboard Manager - Command identifiers.
 *
 * @author Eno Yao
 */

/** Enum of all registered command identifiers for the Clipboard Manager extension. */
export enum commandList {
  apiGetMonitor = "clipboard-manager.api.getMonitor",
  clearClipboardHistory = "clipboard-manager.history.clear",
  copyToHistory = "clipboard-manager.editor.copyToHistory",
  historyTreeDoubleClick = "clipboard-manager.historyTree.doubleClick",
  pickAndPaste = "clipboard-manager.editor.pickAndPaste",
  removeClipboardHistory = "clipboard-manager.history.remove",
  setClipboardValue = "clipboard-manager.setClipboardValue",
  showClipboardInFile = "clipboard-manager.editor.showClipboardInFile",
}
