---
name: ai-trend-monitor
description: Unified AI trend monitoring across multiple sources - arXiv, Hugging Face, Reddit, Hacker News, and Nitter. Tracks trending AI/LLM/Robotics/VLA/World Model discussions without requiring login.
homepage: https://github.com/icetomoyo/openclaw-skills
metadata: {"openclaw":{"emoji":"🔥","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"axios","bins":["node"]}]}}
---

# AI Trend Monitor 🔥

统一的 AI 热点监控工具，聚合多个数据源，无需登录即可追踪 AI/LLM/Robotics/VLA/World Model 的最新动态。

## 数据源

| 来源 | 类型 | 实时性 | 访问方式 |
|------|------|--------|----------|
| **arXiv** | 学术论文 | 实时 | API |
| **Hugging Face** | 模型/论文 | 实时 | API |
| **Reddit** | 社区讨论 | 分钟级 | agent-browser |
| **Hacker News** | 技术圈 | 实时 | API |
| **Nitter** | 推文镜像 | 分钟-小时级 | agent-browser |

## 监控领域

### 1. AI & LLM
- 大语言模型（GPT-5, Claude 4, Gemini, DeepSeek, Llama 4, etc.）
- 多模态模型
- AI 基础设施（训练、推理、部署）

### 2. Robotics & Embodied AI
- 人形机器人（Figure, Optimus, Unitree, etc.）
- VLA 模型（OpenVLA, π0, RT-2, etc.）
- 机器人学习

### 3. World Models
- JEPA, Sora, DreamerV3
- 物理世界建模
- Sim-to-real

## 使用方法

### 手动触发

```bash
# 运行完整监控
node skills/ai-trend-monitor/scripts/monitor.js

# 只监控特定来源
node skills/ai-trend-monitor/scripts/monitor.js --source reddit,hackernews

# 只监控特定领域
node skills/ai-trend-monitor/scripts/monitor.js --topic vla,world-model
```

### 通过 OpenClaw Agent

告诉 Agent：
- "帮我看看现在 AI 领域有什么热点"
- "监控一下最新的 AI 趋势"
- "看看 Reddit 上在讨论什么 AI 话题"

## 输出格式

### WhatsApp 推送

```
🔥 AI Trend Monitor - 2026-02-01 23:00

📊 数据来源:
   📄 arXiv: 5 篇新论文
   🤗 HuggingFace: 3 个热门模型
   👽 Reddit: 12 个热门讨论
   🟠 HN: 8 个热门话题
   🐦 Nitter: 6 条热门推文

🏆 综合热度 TOP 5
━━━━━━━━━━━━━━━━━━━━━━
1️⃣ [OpenVLA 开源发布]
   🔥 综合热度: 9.5/10
   📊 来源: Reddit(2.3K↑), HN(1.1K↑), Nitter(856❤️)
   💬 首个开源 VLA 模型，社区反响热烈...
   🔗 https://reddit.com/r/...

2️⃣ [DeepSeek-R2 即将发布]
   🔥 综合热度: 8.8/10
   📊 来源: arXiv, Reddit, HN
   💬  rumored to surpass GPT-4 on reasoning tasks...
   🔗 https://arxiv.org/...

📈 热门话题:
   • OpenVLA (15 mentions)
   • DeepSeek-R2 (8 mentions)
   • GPT-5 speculation (6 mentions)
   • World Models (5 mentions)
```

### 详细报告

保存到 `output/trend-report-YYYY-MM-DD-HHMM.md`

## 配置

### Reddit 监控的 Subreddits

- r/MachineLearning
- r/LocalLLaMA
- r/ArtificialIntelligence
- r/robotics
- r/reinforcementlearning

### Hacker News 监控

- 搜索关键词：AI, LLM, GPT, Claude, robotics, VLA, world model
- 过滤：score > 50

### Nitter 实例

按优先级尝试：
1. nitter.net
2. nitter.privacydev.net
3. nitter.cz
4. （备用实例列表）

## 热度计算

### 单平台热度

```
arXiv:     热度 = 引用潜力评分 (0-10)
HF:        热度 = log(下载量) + log(点赞数)
Reddit:    热度 = upvotes × 1 + comments × 0.5
HN:        热度 = score (系统自带)
Nitter:    热度 = likes × 1 + retweets × 2
```

### 综合热度

```
综合热度 = Σ(平台热度 × 平台权重)

平台权重:
- arXiv: 1.2 (学术权威)
- HF: 1.0 (社区热度)
- Reddit: 0.9 (大众讨论)
- HN: 1.1 (技术圈)
- Nitter: 0.8 (社交媒体)
```

## 技术实现

### Reddit 抓取

使用 agent-browser 访问 Reddit 公开页面：
```bash
agent-browser open "https://www.reddit.com/r/MachineLearning/hot.json"
agent-browser snapshot --json
```

或使用 Reddit JSON API（公开）：
```
https://www.reddit.com/r/MachineLearning/hot.json?limit=25
```

### Hacker News API

```
https://hn.algolia.com/api/v1/search?query=AI&tags=story&numericFilters=points>50
```

### Nitter 抓取

```bash
agent-browser open "https://nitter.net/search?f=tweets&q=VLA+OR+OpenVLA"
agent-browser snapshot -i
```

## 注意事项

1. **Reddit**: 有 API 速率限制，建议使用 agent-browser 访问公开 JSON
2. **Hacker News**: 有官方 API，速率限制较宽松
3. **Nitter**: 实例不稳定，需要多个备用
4. **频率建议**: 每 2-4 小时运行一次

## 更新日志

### v1.0.0 (2026-02-01)
- 初始版本
- 支持 5 个数据源
- 统一热度评分系统
