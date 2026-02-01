# AI Trend Monitor 🔥

统一的 AI 热点监控工具，聚合多个数据源，追踪 AI/LLM/Robotics/VLA/World Model 的最新动态。

## 特点

- ✅ **无需登录** - 所有数据源都通过公开 API 或网页访问
- ✅ **多平台聚合** - arXiv, HuggingFace, Reddit, HackerNews, Nitter
- ✅ **统一热度评分** - 跨平台比较热度
- ✅ **热门话题检测** - 自动识别 GPT-5, OpenVLA, JEPA 等关键词
- ✅ **WhatsApp 友好输出** - 直接发送摘要

## 快速开始

```bash
# 运行监控
node skills/ai-trend-monitor/scripts/monitor.js

# 或安装依赖后运行
cd skills/ai-trend-monitor
npm install
npm start
```

## 数据源

| 来源 | 类型 | 访问方式 |
|------|------|---------|
| 📄 **arXiv** | 学术论文 | API (实时) |
| 🤗 **HuggingFace** | 模型/论文 | API (实时) |
| 👽 **Reddit** | 社区讨论 | 公开 JSON API (分钟级) |
| 🟠 **HackerNews** | 技术圈 | API (实时) |
| 🐦 **Nitter** | 推文镜像 | agent-browser (分钟-小时级) |

## 监控领域

### AI & LLM
- GPT-5, Claude 4, Gemini 2.5, DeepSeek-V4
- Llama 4, Grok 3, Kimi k1.6, Qwen 3

### Robotics & Embodied AI
- Figure 02/03, Optimus, Unitree
- VLA: OpenVLA, π0, RT-2, Octo

### World Models
- JEPA, Sora, DreamerV3

## 输出示例

```
🔥 AI Trend Monitor - 2026-02-01 23:00

📊 数据来源:
   📄 arXiv: 5 条
   🤗 HuggingFace: 3 条
   👽 Reddit: 12 条
   🟠 HackerNews: 8 条

🏆 综合热度 TOP 5
━━━━━━━━━━━━━━━━━━━━━━
1️⃣ [OpenVLA 开源发布]
   🔥🔥🔥 综合热度: 15.5/10
   📊 来源: Reddit(2.3K↑), HN(1.1K↑), HF(500❤️)
   💬 首个开源 VLA 模型...
   🔗 https://reddit.com/r/...

📈 热门话题:
   1. OpenVLA (15 mentions)
   2. DeepSeek-R2 (8 mentions)
   3. GPT-5 (6 mentions)
```

## 技术实现

### Reddit 监控
```javascript
// 使用 Reddit 公开 JSON API
fetch('https://www.reddit.com/r/MachineLearning/hot.json?limit=10')
```

### Hacker News 监控
```javascript
// 使用 Algolia API
fetch('https://hn.algolia.com/api/v1/search?query=AI&tags=story')
```

### Nitter 监控
```bash
# 使用 agent-browser 访问 Nitter 实例
agent-browser open "https://nitter.net/search?f=tweets&q=OpenVLA"
```

## 热度计算

```
综合热度 = Σ(各平台热度 × 平台权重)

平台权重:
- arXiv: 1.2 (学术)
- HF: 1.0 (社区)
- Reddit: 0.9 (大众)
- HN: 1.1 (技术)
- Nitter: 0.8 (社交)
```

## 配置

编辑 `scripts/monitor.js` 修改：
- `HOT_TOPICS` - 监控的关键词
- `PLATFORMS` - 启用的平台
- Reddit subreddits
- Nitter 实例列表

## 文件结构

```
ai-trend-monitor/
├── SKILL.md           # 技能说明
├── README.md          # 本文件
├── package.json       # 依赖
├── scripts/
│   └── monitor.js    # 主脚本
└── output/            # 输出目录
    ├── trends-*.json # 原始数据
    ├── whatsapp-*.txt # WhatsApp 消息
    └── latest-whatsapp.txt # 最新消息
```

## 使用场景

1. **定期监控** - 每 2-4 小时运行一次
2. **手动触发** - 随时询问 "现在 AI 有什么热点"
3. **事件响应** - 重大发布时快速聚合讨论

## GitHub

https://github.com/icetomoyo/openclaw-skills/tree/main/skills/ai-trend-monitor
