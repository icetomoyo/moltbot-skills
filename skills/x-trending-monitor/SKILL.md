---
name: x-trending-monitor
description: Monitor trending tweets from X.com (Twitter) about AI, robotics, embodied AI, VLA, and World Models. Fetches high-engagement tweets and summarizes hot topics for research tracking.
homepage: https://x.com
metadata: {"openclaw":{"emoji":"🔥","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"axios","bins":["node"]}]}}
---

# X Trending Monitor

监控 X.com (Twitter) 上关于 AI、机器人、具身智能、VLA、World Model 的热门推文。

## 监控领域

### 1. AI / 人工智能
- Large Language Models (GPT, Claude, Gemini, etc.)
- Machine Learning breakthroughs
- AI research papers going viral

### 2. Robotics / 机器人
- Humanoid robots
- Industrial robotics
- Robot learning

### 3. Embodied AI / 具身智能
- Vision-Language-Action (VLA) models
- World Models
- Sim-to-real transfer
- Robot manipulation

## Usage

### 手动运行

```bash
# 运行监控（使用浏览器自动化获取 X.com）
node skills/x-trending-monitor/scripts/fetch-x-trending.js

# 输出
# - 推文列表: skills/x-trending-monitor/output/tweets-YYYY-MM-DD-HHMM.json
# - 摘要报告: skills/x-trending-monitor/output/summary-YYYY-MM-DD-HHMM.md
```

### 使用方式

用户说类似以下指令时调用：
- "帮我看看 X 上有什么热门 AI 消息"
- "监控一下 X.com 的最新推文"
- "关注一下 Twitter 上的 AI 热点"
- "看看现在 AI 领域有什么热门讨论"

## Output Format

### WhatsApp 消息格式

```
🔥 X Trending - AI/Robotics/VLA/World Model
⏰ 2026-02-01 22:00

📊 监控领域分布:
   AI/LLM: 8 条
   Robotics: 3 条
   VLA: 4 条
   World Model: 2 条

🏆 最热推文 TOP 3
━━━━━━━━━━━━━━━━━━━━━━
1️⃣ @username (1.2K likes, 234 retweets)
   🔥 热度: 9.2/10
   💬 [推文内容摘要...]
   🔗 https://x.com/...

2️⃣ @username (856 likes, 123 retweets)
   🔥 热度: 7.8/10
   💬 [推文内容摘要...]
   🔗 https://x.com/...

3️⃣ @username (643 likes, 89 retweets)
   🔥 热度: 6.5/10
   💬 [推文内容摘要...]
   🔗 https://x.com/...

📈 热门话题:
   • GPT-5 (5 mentions)
   • Figure 02 (3 mentions)
   • World Model (4 mentions)

📄 完整报告: output/summary-2026-02-01-2200.md
```

## Search Queries

监控使用的 X.com 搜索词：

```
# 组合查询（英语）
(AI OR "artificial intelligence" OR LLM OR GPT) 
  OR (robotics OR robot OR humanoid)
  OR ("embodied AI" OR "embodied intelligence")
  OR (VLA OR "vision language action" OR RT-2 OR "openvla")
  OR ("world model" OR "world models" OR JEPA)
  min_faves:50
  lang:en
```

## Hot Topics Tracking

自动追踪以下热门话题：

### AI Models
- GPT-5, GPT-5o, o3, o3 mini
- Claude 4, Claude 3.7
- Gemini 2.0, Gemini 2.5
- DeepSeek-V3.2, DeepSeek-V4, DeepSeek-R2
- Llama 4, Llama 3.3
- Grok 3, Kimi k1.5/k1.6
- Qwen 3, Qwq-32B

### Robotics
- Figure 02, Figure 03, Figure AI
- Optimus Gen 2/3, Tesla Bot
- Unitree G1, H1, B2, Go2
- Boston Dynamics Atlas, Spot
- Agility Digit, Fourier GR-1/2

### VLA & Embodied AI
- OpenVLA, π0 (pi-zero), Octo
- RT-2, RT-X, RT-Trajectory
- ACT, Aloha, Mobile ALOHA
- Diffusion Policy

### World Models
- JEPA, I-JEPA, V-JEPA
- Sora, Sora Turbo
- DreamerV3, UniWorld
- GAIA-1

## Implementation

使用浏览器自动化访问 X.com 搜索页面：
1. 构造搜索 URL (Live feed + minimum likes filter)
2. 使用 browser tool 访问并获取页面内容
3. 解析推文数据 (author, content, likes, retweets, timestamp)
4. 计算热度分数
5. 生成摘要报告

## Engagement Score Calculation

```
热度分数 = (likes × 1) + (retweets × 2) + (replies × 1.5) + (quotes × 1.5)

热度等级:
- 🔥🔥🔥 Viral: > 5000
- 🔥🔥 Hot: 1000-5000
- 🔥 Trending: 500-1000
- Warm: 100-500
```

## Notes

- X.com 有反爬虫机制，使用浏览器自动化更稳定
- 需要用户登录 X.com 账号才能看到完整内容
- 监控频率建议：每 2-4 小时一次
- 保存历史数据用于趋势分析
