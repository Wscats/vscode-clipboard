# 粘贴板管理

保留项目的复制和剪切，并在可在面板的历史记录中重新选择粘贴，而不必再重复使用 `Ctrl + C` 和 `Ctrl + V` 的快捷键。

要选择复制的内容，只需使用 `Ctrl+Shift+V` 快捷键。

## 特性

1. 保存所有复制和剪切内容的历史记录
1. 可以检查 VSCode 之外的复制内容(`"clipboard-manager.onlyWindowFocused": false`)
1. 从历史记录中粘贴 (`Ctrl+Shift+V` => 选择并粘贴)
1. 预览粘贴的内容
1. 使用复制片段粘贴 (例如： `clip01, clip02, ...`)
1. 从历史记录中删除所选内容
1. 清除所有历史记录
1. 打开历史记录的位置
1. 在历史记录面板中双击来粘贴

## 插件设置

该插件提供以下设置（默认值）:

```js
{
  // 避免列表中出现重复的内容。
  "clipboard-manager.avoidDuplicates": true,
  // 检查剪贴板中更改的时间（以毫秒为单位），设置为零以禁用。
  "clipboard-manager.checkInterval": 500,
  // 剪贴板的最大大小（以字节为单位）。
  "clipboard-manager.maxClipboardSize": 1000000,
  // 要保存在剪贴板中的最大片段数。
  "clipboard-manager.maxClips": 100,
  // 将使用过的剪辑移到列表顶部。
  "clipboard-manager.moveToTop": true,
  // 仅从 VSCode 获取复制内容。
  "clipboard-manager.onlyWindowFocused": true,
  // 选择复制时时查看并预览。
  "clipboard-manager.preview": true,
  // 设置保存剪贴板文件的位置，设置为 false 禁用。
  "clipboard-manager.saveTo": null,
  // 启用完成的片段
  "clipboard-manager.snippet.enabled": true,
  // 片段中建议的最大片段数（全部为零）。
  "clipboard-manager.snippet.max": 10,
  // 代码段完成的默认前缀（clip1，clip2等）
  "clipboard-manager.snippet.prefix": "clip"
}
```

## 示例

复制到历史记录:

![Clipboard Manager - Copy](screenshots/copy.gif)

选择并粘贴:

![Clipboard Manager - Pick and Paste](screenshots/pick-and-paste.gif)

## 感谢

感谢原作者的贡献，非常棒的一个插件！

| [<img src="https://avatars3.githubusercontent.com/u/1530997?s=400&v=4" width="60px;"/><br /><sub>Edgardmessias</sub>](https://github.com/edgardmessias) | 
|-|