# 钩玄 macOS 图标资源 v1

沿用已选定的尖端回钩，应用图形为 `#1b1b1b`，图标自身背景为白色。正式资源由 SVG 统一导出，不从 AI 位图缩放或自动描摹，确保路径、颜色和各尺寸一致。

应用图标已做光学校正：1024px 母版主体相对原版左移 30px，上下位置、轮廓与比例不变，用于平衡右侧粗弧的视觉重量。兼容 ICNS 随母版同步；菜单栏模板保持原来的位置与文件内容，不随应用图标移动。AI 参考稿不包含这次 SVG 定位校正。

## 资源

- `source/app-icon.svg` 是可编辑的 1024 × 1024 全幅白底源文件，没有预裁圆角、阴影或字体依赖。
- `source/foreground.svg` 和 `foreground-1024.png` 是同画布透明前景层，可导入 Icon Composer，将背景设置为白色。
- `app-icon-1024.png` 是全幅白底 PNG 母版。
- `Gouxuan.icns`、`Gouxuan.iconset`、`app-icon-macos-1024.png` 是用于现有 Electron 打包链的兼容导出，带圆角白色底板和透明外边距。不要把这个已裁圆角版本当成 Icon Composer 输入层。
- `source/app-icon-macos.svg` 是兼容导出的矢量版。
- `source/menu-bar.svg`、`menu-bar/GouxuanTemplate.png` 和 `menu-bar/GouxuanTemplate@2x.png` 是菜单栏模板，透明底、纯黑 alpha 蒙版，分别为 16 × 16 / 72dpi 和 32 × 32 / 144dpi。小尺寸仅做轻微轮廓增粗。
- `preview.png` 模拟应用图标与浅深色菜单栏效果，不是系统截图。
- `verification.json` 记录尺寸、DPI、透明度、纯色像素、文件哈希和 ICNS 表示。
- `ai-reference.png` 是内置 ImageGen 生成的视觉参考，提示词见 `PROMPT.md`；它不是最终尺寸和颜色的来源。

## 重新导出

在 macOS 上使用支持 TypeScript 类型剥离的 Node.js 22.18+、`sharp` 和系统 `iconutil`。`sharp` 已在执行环境提供，无需给应用增加运行依赖。若模块不在脚本的 Node.js 解析路径，使用 `NODE_PATH` 指向已安装 `sharp` 的 `node_modules`。受限沙箱中的 `iconutil` 可能对有效 PNG 报告 `Invalid Iconset`，应在本机正常权限环境执行，不更改已验证的尺寸或 DPI 来规避。

```sh
NODE_PATH=/path/to/node_modules node apps/electron/build/icons/gouxuan-v1/export-icons.mts
```

脚本只更新本目录内的派生资源，不更改 SVG 母版、AI 参考、应用配置或现有 `build/icon.icns`。

本版已验证 15 个正式 PNG 的尺寸、DPI、alpha 和纯色，且通过系统 `iconutil` 将 ICNS 反向解包，十个表示与原 PNG 的 RGBA 像素完全一致。导出脚本格式及 lint 检查通过。`preview.png` 与 ImageGen 参考已人工视觉检查。

## 接入边界

本次仅生成资源，没有替换现有打包图标，也没有新增 Tray 功能。后续可将 `electron-builder.yml` 的 `mac.icon` 指向 `build/icons/gouxuan-v1/Gouxuan.icns`。菜单栏接入时保留 `Template` / `@2x` 文件名，并使用 Electron `nativeImage.setTemplateImage(true)`。

未生成或验证 Icon Composer `.icon` 工程、系统 Liquid Glass 外观、真实 Dock / 菜单栏显示或签名安装包；兼容 ICNS 不等同于已完成新的分层系统外观。正式发布任务仍需单独验收。

## 规范依据

- [Apple App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons) 要求正方形未遮罩图层；系统负责最终裁切，优先矢量前景。
- [Apple Icon Composer](https://developer.apple.com/documentation/xcode/creating-your-app-icon-using-icon-composer) 支持 1024 × 1024 Mac 画布，SVG 图层便于保持可缩放性。
- [Apple Icon Set Type](https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/IconSetType.html) 定义完整 iconset 的十个标准 / Retina 表示。
- [Electron Tray](https://www.electronjs.org/docs/latest/api/tray#macos) 推荐透明 Template 图像、16px / 72dpi 和 32px / 144dpi，系统负责菜单栏颜色适配。
