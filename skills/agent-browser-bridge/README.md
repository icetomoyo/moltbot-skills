# Agent Browser Bridge

基于 browser-use 的 OpenClaw Agent 浏览器桥接服务

## 架构

```
OpenClaw (Node.js) ←WebSocket→ Python Bridge (browser-use) → Playwright → Browser
```

## 安装

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 安装 Playwright 浏览器
playwright install chromium

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 设置 OPENAI_API_KEY 或其他 LLM 配置

# 4. 启动服务
python main.py
```

## API 文档

### WebSocket 接口

**连接**: `ws://localhost:8765/ws`

**消息格式**:

#### 1. 执行任务
```json
{
  "type": "execute_task",
  "task": "Search for OpenAI on Google",
  "options": {
    "headless": false,
    "model": "gpt-4o"
  }
}
```

#### 2. 状态更新（服务端推送）
```json
{
  "type": "state_update",
  "url": "https://google.com",
  "title": "Google",
  "screenshot": "base64encoded...",
  "action": "goto",
  "timestamp": "2026-02-03T10:00:00Z"
}
```

#### 3. 人工接管请求（服务端推送）
```json
{
  "type": "handoff_required",
  "reason": "login_page_detected",
  "url": "https://example.com/login",
  "message": "检测到登录页面，需要人工输入凭证"
}
```

#### 4. 人工完成确认（客户端发送）
```json
{
  "type": "human_completed",
  "success": true
}
```

## 开发

```bash
# 开发模式（自动重载）
uvicorn main:app --reload --host 0.0.0.0 --port 8765
```

## 配置

编辑 `.env` 文件：

```env
# LLM 配置（选择一种）
OPENAI_API_KEY=your-openai-key
# 或
ANTHROPIC_API_KEY=your-anthropic-key
# 或本地模型
OLLAMA_BASE_URL=http://localhost:11434

# 可选：Browser-Use Cloud
BROWSER_USE_API_KEY=your-browser-use-key

# 服务端配置
HOST=0.0.0.0
PORT=8765
LOG_LEVEL=info
```
