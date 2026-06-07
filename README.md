Breeze AI 助手

一个面向企业内部网络的 AI 助手 Chrome 扩展，支持选中文本后快速进行解释、翻译、写代码、画流程图、AI 搜索，以及自由问答。

无需注册任何云服务，只需配置公司内部的 OpenAI 兼容 API 地址即可使用，所有数据不经过第三方。

---

## 功能

| 功能 | 说明 |
|---|---|
| **解释** | 选中任意文本，快速获得 AI 的详细解释 |
| **翻译** | 中英文双向互译 |
| **写代码** | 描述功能后，AI 给出 Python 和 C++ 两版代码 |
| **逐行代码解释** | 选中代码片段，AI 逐行分析功能和算法 |
| **流程图** | 将文本转成 Mermaid 流程图，支持复制源码 |
| **AI 搜索** | 跳转到自定义内网搜索引擎，带上选中文本直接搜索 |
| **自由问答** | 在侧边栏中持续对话，支持追问，回答中代码块自动高亮 |

---

## 快速开始

### 1. 下载与安装

```bash
git clone https://github.com/bearmeetu/breeze.git
```

或者直接下载 ZIP 并解压。

### 2. 加载到 Chrome

1. 打开 Chrome，地址栏输入 `chrome://extensions/`
2. 打开右上角 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择 `breeze/breeze` 文件夹（包含 `manifest.json` 的那个）

### 3. 配置

点击工具栏上的 Breeze 图标，打开配置页面：

- **AI Base URL** — 你的 API 地址，例如 `http://192.168.1.100:8000/v1`（需兼容 OpenAI 接口格式）
- **API Key** — Bearer Token
- **模型列表** — 可用的模型名称，如 `gpt-4`、`deepseek-chat` 等
- **内网搜索 URL** — 点击"AI 搜索"时打开的搜索引擎地址，用 `%s` 表示搜索词

保存即可使用。

### 4. 使用

1. 在任意网页上**选中文字**
2. 弹出菜单中点击需要的操作
3. 结果会显示在浮窗或侧边栏中

---

## 技术栈

| 名称 | 用途 | 版本 |
|---|---|---|
| **Chrome Extension Manifest V3** | 扩展框架 | V3 |
| **Vanilla JavaScript** (原生 JS) | 全部业务逻辑，无框架依赖 | ES2020+ |
| **CSS3** | 样式与动画 | — |
| **Marked** | Markdown → HTML 渲染 | v15.0.12 |
| **Highlight.js** | 代码块语法高亮 | v11.9.0 |
| **Mermaid** | 文本 → 流程图渲染 | 最新 |
| **github.min.css** | Highlight.js GitHub 主题样式 | — |

> 不依赖 React / Vue / Webpack 等框架，零构建步骤，开箱即用。

---

## 项目结构

```
breeze/
├── breeze/                      # 扩展代码主目录
│   ├── manifest.json            # 扩展清单（权限、文件声明）
│   ├── background.js            # 后台 Service Worker（API 请求处理）
│   ├── content.js               # 内容脚本（弹出菜单、侧边栏、交互逻辑）
│   ├── content.css              # 弹出菜单和侧边栏样式
│   ├── options.html             # 配置页面 HTML
│   ├── options.js               # 配置页面逻辑
│   ├── options.css              # 配置页面样式
│   ├── marked.min.js            # Markdown 解析库
│   ├── highlight.min.js         # 代码高亮库
│   ├── mermaid.min.js           # 流程图渲染库
│   └── github.min.css           # 代码高亮 GitHub 主题
├── .gitignore
└── README.md
```

### 核心文件说明

| 文件 | 职责 |
|---|---|
| `manifest.json` | 声明扩展权限、注册 content script 和 service worker |
| `background.js` | 接收前端请求，与 AI API 建立 SSE 流式连接，逐块返回结果 |
| `content.js` | 注入到每个页面，管理选中菜单、结果弹窗、侧边栏对话 |
| `content.css` | 所有注入 UI 的样式，覆盖默认美观风格 |
| `options.html / js / css` | 扩展配置页面，持久化存储 API 地址、密钥等信息 |

---

## 通信流程

```
用户选中文字 → mouseup 事件 → 弹出操作菜单
    ↓
点击按钮 → content.js 发 chrome.runtime.sendMessage
    ↓
background.js 接收 → 构造 Prompt → fetch SSE 流式请求 AI API
    ↓
逐块返回 → chrome.tabs.sendMessage → content.js 渲染到弹窗/侧边栏
```

---

## 自定义开发

本项目**零构建**，修改后直接在 Chrome 扩展管理页点击 **🔄 刷新** 即可生效。

### 常用修改场景

**添加新按钮**
在 `content.js` 的 `buttons` 数组里追加一项，然后在 `background.js` 的 `switch` 中添加对应 prompt 即可。

**修改 UI 样式**
编辑 `content.css`，所有选择器都以 `#breeze-` 开头，避免污染页面原有样式。

**切换代码高亮主题**
把 `github.min.css` 替换成其他 Highlight.js 主题（如 `atom-one-dark.min.css`），并在 `manifest.json` 中更新文件名。

---

## 路线图 Roadmap

- [x] 选中文本弹出操作菜单
- [x] 解释、翻译、写代码、逐行解释
- [x] Mermaid 流程图渲染
- [x] 内网 AI 搜索跳转
- [x] 侧边栏连续对话
- [x] Markdown 渲染与代码高亮
- [x] 流程图源码复制
- [x] 侧边栏回答气泡复制
- [x] 菜单边缘碰撞检测与自适应
- [ ] 深色模式适配
- [ ] 对话历史持久化（刷新后保留）
- [ ] 多轮对话上下文增强
- [ ] 自定义 Prompt 模板
- [ ] 导出对话记录
- [ ] i18n 多语言支持

---

## 许可

GPL V3.0 License
