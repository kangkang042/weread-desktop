# WeChat Read Desktop

微信读书桌面客户端，基于 [Nativefier](https://github.com/nativefier/nativefier) 将微信读书网页版打包为 Windows 桌面应用。

## 特性

- **无边框窗口** — 隐藏原生标题栏，沉浸式阅读体验
- **自定义标题栏** — 36px 拖拽区域，不遮挡页面内容
- **动态主题适配** — 标题栏和滚动条颜色自动跟随页面背景变化
- **暗色模式** — 自动检测系统主题切换
- **滚动隐藏** — 向下滚动时自动隐藏顶部书名栏和右侧按钮，向上滚动时显示
- **阅读布局优化** — 自动扩展内容区最大宽度，充分利用屏幕空间
- **窗口状态记忆** — 关闭时记住窗口大小和位置，下次打开自动恢复
- **数据持久化** — 登录状态、Cookie、缓存等保存在 `%APPDATA%\WeChatRead\`
- **单实例运行** — 同一时间只允许一个应用实例
- **SPA 感知** — 页面内导航时自动重新适配

## 使用方法

### 运行

构建产物在 `WeChatRead-win32-x64/` 目录，双击 `WeChatRead.exe` 即可运行。

如需单个 exe 便携版，可将 `WeChatRead-win32-x64/` 目录内容用 Bandizip 或 7-Zip SFX 打包为自解压 exe。

### 从源码构建

```bash
npm install
npm run build
```

## 项目结构

```
├── inject/custom.js      # 注入脚本（标题栏、滚动隐藏、布局优化等）
├── patch.js              # 构建后补丁（窗口状态、IPC 通信等）
├── package.json          # 构建配置
├── icon.ico              # 应用图标
└── README.md
```

## 技术实现

- 使用 Nativefier 52 + Electron 打包
- `--title-bar-style hidden` 隐藏原生标题栏
- 注入 JS 实现自定义标题栏和动态主题
- 通过 IPC 通信实现渲染进程与主进程的颜色同步
- MutationObserver 监听 DOM 变化，适配 SPA 页面切换
- `electron-window-state` 管理窗口状态持久化

## 许可证

MIT
