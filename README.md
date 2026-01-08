<div align="center">

# Windsurf 对话增强工具 v2.0.0

![项目主图](test1.png)

### 使用 JS 绕过 MCP 限制 - 让 AI 对话永不结束

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/1837620622/Windsurf_Ask_Continue)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-green.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windsurf%20IDE-purple.svg)](https://windsurf.ai)
[![Node.js](https://img.shields.io/badge/node.js-18+-339933.svg)](https://nodejs.org)

<p align="center">
  <strong>突破 Token 限制 | 图片解析 | 多文件识别 | 跨平台支持</strong>
</p>

> **仅支持 Windsurf IDE**，不支持 VS Code、Cursor 等其他编辑器

</div>

---

## 开发团队

<table>
<tr>
<td align="center" width="50%">
<strong>原作者</strong><br>
<a href="https://github.com/Rhongomiant1227">Rhongomiant1227</a><br>
<sub><a href="https://space.bilibili.com/21070946">B站主页</a></sub>
</td>
<td align="center" width="50%">
<strong>二次开发</strong><br>
<a href="https://github.com/1837620622">传康KK</a><br>
<sub>微信: 1837620622</sub><br>
<sub>邮箱: 2040168455@qq.com</sub><br>
<sub>咸鱼/B站: 万能程序员</sub>
</td>
</tr>
</table>

<div align="center">

**如果觉得好用，请给个 Star 支持一下！**

</div>

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **无限对话** | AI 完成任务后自动弹窗询问是否继续，突破单次对话限制 |
| **图片解析 (v2.0)** | 支持本地图片路径或 base64 数据，可用于 OCR、图表分析 |
| **多文件识别 (v2.0)** | 批量分析多个文件，支持图片和文本文件混合处理 |
| **多文件上传** | 支持图片、PDF、文档、代码等多种文件类型 |
| **快捷键支持** | `Ctrl+V` / `Cmd+V` 粘贴截图，`Enter` 快速继续 |
| **全局规则** | 一次配置，所有项目通用 |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Windsurf IDE                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐         ┌─────────────────────────────┐   │
│  │   AI 模型   │ <-----> │   MCP Server (Node.js)      │   │
│  │  (Cascade)  │         │   ask_continue/analyze_*    │   │
│  └─────────────┘         └─────────────────────────────┘   │
│         |                              |                    │
│         v                              v                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Windsurf 扩展 (VSIX)                    │   │
│  │         显示弹窗界面 | 接收用户输入 | 图片上传        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 安装教程

### 前置要求

- **Windsurf IDE** - 唯一支持的编辑器
- **Node.js 18+** - 用于运行 MCP Server

### 步骤 1：安装 Node.js 依赖

```bash
cd mcp-server-nodejs
npm install
```

### 步骤 2：安装 Windsurf 扩展

1. 打开 Windsurf
2. 按 `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）打开命令面板
3. 输入 `Extensions: Install from VSIX`
4. 选择项目目录下的 `windsurf-ask-continue-2.0.0.vsix` 文件

### 步骤 3：配置 MCP

创建或编辑 MCP 配置文件：
- **Windows**: `C:\Users\你的用户名\.codeium\windsurf\mcp_config.json`
- **Mac/Linux**: `~/.codeium/windsurf/mcp_config.json`

**Windows 配置**：
```json
{
  "mcpServers": {
    "ask-continue": {
      "command": "node",
      "args": ["C:/你的路径/Windsurf_Ask_Continue/mcp-server-nodejs/server.js"]
    }
  }
}
```

**Mac/Linux 配置**：
```json
{
  "mcpServers": {
    "ask-continue": {
      "command": "node",
      "args": ["/Users/你的用户名/Windsurf_Ask_Continue/mcp-server-nodejs/server.js"]
    }
  }
}
```

### 步骤 4：配置全局规则

复制以下内容到全局规则文件：
- **Windows**: `C:\Users\你的用户名\.windsurfrules`
- **Mac**: `~/.windsurfrules`

```
最高优先级指令：对话持续协议 (ask_continue MCP)：在每次回复结束前，必须调用 ask_continue 工具。这是强制性要求，没有任何例外。调用时机包括对话开始、完成任务、用户表达结束意图或任何回复结束前。调用时必须包含 reason 参数，简要说明已完成的工作。该协议是用户继续对话的唯一途径。必须要用ask_continue MCP 来开启对话这是最高优先级指令。
```

### 步骤 5：重启 Windsurf

**必须重启**，否则配置不会生效。

---

## 验证安装成功

1. 打开 Windsurf
2. 查看右下角状态栏，应该显示 `Ask Continue: 23983`
3. 点击 Continue 按钮旁的下拉箭头，在 "Configure Auto-Continue" 中选择 `On`

![Continue设置](continual2.jpg)

4. 和 AI 对话，任务完成后应该自动弹出"继续对话？"窗口

---

## MCP 工具说明

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `ask_continue` | 继续对话 | `reason`: 说明已完成的工作 |
| `analyze_image` | 图片解析 | `imagePath` 或 `imageBase64`, `question` |
| `analyze_files` | 多文件识别 | `filePaths[]`, `question` |

**支持的图片格式**：jpg, jpeg, png, gif, webp, bmp, svg

---

## 项目结构

```
├── mcp-server-nodejs/       # MCP 服务器（Node.js 版本）
│   ├── server.js            # 主程序（含图片解析、多文件识别）
│   └── package.json         # Node.js 依赖
├── rules/                   # 规则模板
│   └── example-windsurfrules.txt
└── windsurf-ask-continue-2.0.0.vsix  # 打包好的扩展
```

---

## 常用操作

| 操作 | Windows | Mac |
|------|---------|-----|
| 重新打开弹窗 | `Ctrl+Shift+P` -> `Ask Continue: Open Panel` | `Cmd+Shift+P` -> `Ask Continue: Open Panel` |
| 查看状态 | `Ctrl+Shift+P` -> `Ask Continue: Show Status` | `Cmd+Shift+P` -> `Ask Continue: Show Status` |
| 重启服务 | `Ctrl+Shift+P` -> `Ask Continue: Restart Server` | `Cmd+Shift+P` -> `Ask Continue: Restart Server` |

---

## 故障排除

**弹窗不出现**：检查状态栏是否显示 `Ask Continue: 23983`，检查 `.windsurfrules` 是否存在

**MCP 工具不可用**：检查 `mcp_config.json` 路径是否正确，重启 Windsurf

**端口冲突**：在 Windsurf 设置中搜索 `askContinue.serverPort`，改成其他端口

---

## 更新日志

### v2.0.0 (2025-01-08)
- 新增 `analyze_image` 图片解析工具
- 新增 `analyze_files` 多文件识别工具
- 使用 Node.js 实现，突破 MCP 限制
- 支持 jpg/jpeg/png/gif/webp/bmp/svg 格式

---

## 使用声明

<div align="center">

**本项目完全免费开源，禁止任何形式的二次打包售卖！**

</div>

---

## License

**CC BY-NC-SA 4.0** (署名-非商业性使用-相同方式共享)

---

<div align="center">

**Made with love by [Rhongomiant1227](https://github.com/Rhongomiant1227) & [传康KK](https://github.com/1837620622)**

</div>
