# NotebookLM Automation

使用 OpenClaw browser 工具自动化 Google NotebookLM 工作流。

## 快速开始

### 1. 安装 Chrome 扩展

```bash
openclaw browser extension install
openclaw browser extension path
```

Chrome → `chrome://extensions` → 开启开发者模式 → 加载已解压的扩展程序

### 2. 附加到 Chrome 标签页

1. 在 Chrome 中打开任意标签页（或 NotebookLM）
2. 确保已登录 Google 账号
3. 点击 OpenClaw Browser Relay 扩展图标（徽章显示 ON）

### 3. 运行自动化

```javascript
// 0. 自动导航到 NotebookLM
browser action=navigate profile=chrome targetUrl="https://notebooklm.google.com"

// 1. 获取页面快照
browser action=snapshot profile=chrome

// 2. 点击新建笔记本
browser action=act profile=chrome request={"kind":"click","ref":"e12"}

// 3. 选择网站来源
browser action=act profile=chrome request={"kind":"click","ref":"e7"}

// 4. 输入论文 URL
browser action=act profile=chrome request={"kind":"type","ref":"e2","text":"https://arxiv.org/pdf/2601.22156v1"}

// 5. 点击插入
browser action=act profile=chrome request={"kind":"click","ref":"e4"}

// 6. 生成内容
browser action=act profile=chrome request={"kind":"click","ref":"e28"}  // 视频
browser action=act profile=chrome request={"kind":"click","ref":"e44"}  // 信息图
browser action=act profile=chrome request={"kind":"click","ref":"e46"}  // 演示文稿
```

## 工作原理

使用 **OpenClaw Browser Relay** 扩展控制 Chrome：
- 通过 `chrome.debugger` API 与 Chrome 通信
- 使用 Playwright 协议远程控制
- 支持已登录状态的复用

## 对比旧方案

| 特性 | 新方案 (Browser Relay) | 旧方案 (Playwright CDP) |
|------|------------------------|-------------------------|
| Chrome 启动 | 手动/自动启动 | 脚本启动 |
| 登录状态 | 复用现有登录 | 需要重新登录 |
| 导航控制 | 自动导航到 NotebookLM | 依赖用户已在页面 |
| 稳定性 | 高（用户已验证的会话） | 中（新会话） |
| 使用方式 | `browser` 工具 | Playwright 脚本 |

## 依赖

- OpenClaw Gateway
- Chrome Browser
- OpenClaw Browser Relay 扩展

## 文档

完整文档见 [SKILL.md](SKILL.md)

## 许可证

MIT
