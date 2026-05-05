# WeChat Read Desktop

微信读书桌面客户端，基于 [Pake](https://github.com/tw93/Pake)（Rust + Tauri + WebView2）将微信读书网页版打包为 Windows 桌面应用。

大小仅 **8.8MB**，无需安装，下载即用。使用系统自带 WebView2 而非捆绑 Chromium。

## 特性

- **极轻量** — 仅 8.8MB，相比 Electron 方案（~200MB）减少 95%+
- **无边框窗口** — 隐藏原生标题栏，沉浸式阅读体验
- **自定义标题栏** — 36px 拖拽区域，不遮挡页面内容
- **动态主题适配** — 标题栏和滚动条颜色自动跟随页面背景变化
- **暗色模式** — 自动检测系统主题切换
- **滚动隐藏** — 向下滚动时自动隐藏顶部书名栏和右侧按钮
- **阅读布局优化** — 自动扩展内容区最大宽度，充分利用屏幕空间
- **窗口状态记忆** — 关闭时记住窗口大小和位置
- **单实例运行** — 同一时间只允许一个应用实例
- **系统托盘** — 支持最小化到系统托盘

## 使用方法

### 直接下载

从 [Releases](https://github.com/kangkang042/weread-desktop/releases) 下载 `WeChatRead.exe`，双击运行。

需要 Windows 10+ 系统（自带 WebView2 运行时）。

### 从源码构建

需要安装 Rust 工具链和 MinGW-w64：

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# 安装 MinGW-w64（Windows）
winget install BrechtSanders.WinLibs.POSIX.UCRT
winget install BrechtSanders.WinLibs.POSIX.UCRT.LLVM

# 配置 Cargo 链接器 (~/.cargo/config.toml)
# [target.x86_64-pc-windows-gnu]
# linker = "<path-to-gcc>/x86_64-w64-mingw32-gcc.exe"
# rustflags = ["-C", "link-args=-fuse-ld=lld -Wl,--exclude-all-symbols"]

# 构建
npm run build
```

构建产物在项目根目录：`WeChatRead.exe`（8.8MB）、`WebView2Loader.dll`（157KB）。

## 项目结构

```
├── WeChatRead.exe         # 应用可执行文件
├── WebView2Loader.dll     # WebView2 加载器
├── inject/
│   ├── pake-custom.js     # Pake 注入脚本（标题栏、滚动隐藏、布局优化）
│   └── custom.js          # Nativefier 版本注入脚本（参考）
├── icon.ico               # 应用图标
├── package.json           # 构建配置
└── README.md
```

## 技术实现

- 使用 [Pake](https://github.com/tw93/Pake) / Tauri v2 + Rust 打包
- 利用系统 WebView2 渲染，不捆绑 Chromium
- 注入 JS 实现自定义标题栏和动态主题
- MutationObserver 监听 DOM 变化，适配 SPA 页面切换
- `--exclude-all-symbols` 解决 MinGW 链接器 16-bit 导出符号上限问题

## 许可证

MIT
