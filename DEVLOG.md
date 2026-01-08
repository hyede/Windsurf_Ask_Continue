# Windsurf Ask Continue 开发日记

> 作者：Rhongomiant1227
> 
> 记录我开发这个"无限对话"工具的全过程

---

## 缘起：闲鱼惊现"AI无限对话"？

那天刷闲鱼，看到有人在卖一个叫"AI无限对话"的工具。

点进去一看——功能描述：让 Windsurf 的 AI 对话可以无限继续。标价几十块。

我人傻了。

这玩意儿有什么技术含量？一个 MCP Server + 一个 VS Code 扩展，通过 HTTP 通信，弹个窗问用户要不要继续。就这？

在 Vibe Coding 时代，随便一个会用智能 IDE 的人，让 AI 帮忙写，一天都能搞定。结果有人靠信息差割韭菜？

行，那我就开源，直接砸场子。

**对那些拿这东西卖钱的朋友：不好意思，我来了。** 😎

---

## 搭建基础架构

目标很简单：
1. 写一个 MCP Server（Python），提供 `ask_continue` 工具
2. 写一个 Windsurf 扩展（TypeScript），弹窗询问用户是否继续
3. 两者通过 HTTP 通信

基础版本很快跑通。MCP Server 被 AI 调用 → 扩展弹窗 → 用户输入 → 返回给 AI。

**第一个坑**：Windsurf 的 MCP 实现和官方文档有些出入，消息格式调试了一会儿。

---

## 端口冲突地狱

问题来了：用户开多个 Windsurf 窗口怎么办？

每个窗口的扩展都监听同一个端口，必然冲突。

**解决方案**：
- 扩展使用动态端口，默认端口被占用就自动尝试下一个
- 写入端口文件到临时目录，MCP Server 通过读取文件发现可用端口

主要是端口文件清理逻辑麻烦，进程退出后文件残留会导致连接错误端口。

---

## 图片传输的坑

想着既然要做，就做完善点，支持图片传输。

实现了 Ctrl+V 粘贴和拖拽上传，用 Base64 编码。

**踩坑**：一开始把 Base64 当纯文本传给 AI，大图片直接把上下文撑爆，AI 说图片"截断"了。

**解决方案**：MCP 协议原生支持 `ImageContent` 类型！

```python
from mcp.types import ImageContent

result.append(ImageContent(
    type="image",
    data=base64_data,
    mimeType=f"image/{mime_subtype}",
))
```

这个细节文档里没怎么提，差点没发现。

---

## 玄学 Bug —— 消息发了但收不到

最折磨的一个问题。

现象：点击"继续"按钮，消息发出去了（有日志），但 AI 完全没收到。

排查半天，问题出在**旧进程残留**。

之前的 MCP Server 进程没正确退出，新进程监听新端口，但扩展还在往旧端口发消息。

**解决方案**：扩展启动时自动清理旧进程。

```typescript
async function cleanupOldMcpProcesses(): Promise<void> {
  // 清理端口 23984-24034 范围内的旧进程
  for (let port = 23984; port <= 24034; port++) {
    // Windows: netstat + taskkill
    // Unix: lsof + kill
  }
}
```

加上这个功能后，终于稳定了。

---

## UI 优化

- 侧边栏状态面板，显示服务运行状态
- "重新打开弹窗"命令，防止用户不小心关掉
- 弹窗 UI 美化，支持暗色主题

---

## 最后说几句

这项目技术难度真不高，坑倒是有几个：

1. **MCP 协议细节** - 官方文档不够详细，很多要自己摸索
2. **多窗口场景** - 端口管理和进程清理容易出问题
3. **图片传输** - 要用对数据类型
4. **调试困难** - MCP Server + 扩展 + AI 三方通信，任何一环出问题都难定位

但说实话，这些问题让 AI 帮忙调试，一天内都能解决。

所以我真的想不通，这种东西怎么还有人拿去卖钱？还有人买？

**各位，这东西完全免费开源。如果有人找你收费，直接举报。**

别被割韭菜了。

---

*Rhongomiant1227*

*GitHub: https://github.com/Rhongomiant1227*

*B站: https://space.bilibili.com/21070946*
