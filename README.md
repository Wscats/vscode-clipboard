# Clipboard

Keep a history of your copied and cut items and re-paste, without override the `Ctrl+C` and `Ctrl+V` keyboard shortcuts.

To pick a copied item, only run `Ctrl+Shift+V`

## Features

1. Save history of all copied and cut items
1. Can check copied items outside the VSCode (`"clipboard-manager.onlyWindowFocused": false`)
1. Paste from history (`Ctrl+Shift+V` => Pick and Paste)
1. Preview the paste
1. Snippets to paste (Ex. `clip01, clip02, ...`)
1. Remove selected item from history
1. Clear all history
1. Open copy location
1. Double click in history view to paste

## Extension Settings

This extension contributes the following settings (default values):

<!--begin-settings-->
```js
{
  // Avoid duplicate clips in the list
  "clipboard-manager.avoidDuplicates": true,

  // Time in milliseconds to check changes in clipboard. Set zero to disable.
  "clipboard-manager.checkInterval": 500,

  // Maximum clipboard size in bytes.
  "clipboard-manager.maxClipboardSize": 1000000,

  // Maximum number of clips to save in clipboard
  "clipboard-manager.maxClips": 100,

  // Move used clip to top in the list
  "clipboard-manager.moveToTop": true,

  // Get clips only from VSCode
  "clipboard-manager.onlyWindowFocused": true,

  // View a preview while you are choosing the clip
  "clipboard-manager.preview": true,

  // Set location to save the clipboard file, set false to disable
  "clipboard-manager.saveTo": null,

  // Enable completion snippets
  "clipboard-manager.snippet.enabled": true,

  // Maximum number of clips to suggests in snippets (Zero for all)
  "clipboard-manager.snippet.max": 10,

  // Default prefix for snippets completion (clip1, clip2, ...)
  "clipboard-manager.snippet.prefix": "clip"
}
```
<!--end-settings-->

## Examples

Copy to history:

![Clipboard Manager - Copy](screenshots/copy.gif)

Pick and Paste:

![Clipboard Manager - Pick and Paste](screenshots/pick-and-paste.gif)

## Thanks to EdgardMessias for the original extension

| [<img src="https://avatars3.githubusercontent.com/u/1530997?s=400&v=4" width="60px;"/><br /><sub>Edgardmessias</sub>](https://github.com/edgardmessias) | 
|-|