---
name: x-trending-monitor
description: Monitor trending tweets from X.com (Twitter) about AI, robotics, embodied AI, VLA, and World Models. Fetches high-engagement tweets and summarizes hot topics for research tracking.
homepage: https://x.com
metadata: {"openclaw":{"emoji":"🔥","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"axios","bins":["node"]}]}}
---

# X Trending Monitor

⚠️ **重要提示: 此技能目前无法自动运行**

X.com (Twitter) 的反爬虫机制阻止了自动化数据抓取。此技能需要手动配合浏览器使用。

## 现状

❌ **无法自动抓取**: X.com 需要登录 + JavaScript 渲染 + 频繁触发验证码
✅ **手动查询指南**: 提供搜索链接，需手动访问
✅ **建议替代方案**: 使用 `ai-trend-monitor` (聚合 arXiv, Reddit, HN 等无需登录的源)

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

## 手动使用方法

### 方式 1: 直接使用 X.com 搜索

访问以下链接（需登录 X.com）:

| 领域 | 搜索链接 |
|------|----------|
| AI/LLM | https://x.com/search?q=AI%20OR%20LLM%20min_faves%3A100%20lang%3Aen&f=live |
| Robotics | https://x.com/search?q=robotics%20OR%20humanoid%20min_faves%3A50%20lang%3Aen&f=live |
| VLA | https://x.com/search?q=VLA%20OR%20OpenVLA%20min_faves%3A30%20lang%3Aen&f=live |
| World Model | https://x.com/search?q=world%20model%20OR%20JEPA%20min_faves%3A30%20lang%3Aen&f=live |

### 方式 2: 使用脚本获取搜索链接

```bash
node skills/x-trending-monitor/scripts/fetch-x-trending.js
```

此脚本会输出搜索链接，**不会自动抓取数据**。

### 方式 3: 使用 OpenClaw Browser 工具

1. 确保 Chrome 已登录 X.com
2. 附加 OpenClaw Browser Relay 扩展
3. 执行:
```
browser action=open profile=chrome targetUrl="https://x.com/search?q=AI%20min_faves%3A100&f=live"
browser action=snapshot profile=chrome refs=aria
```
4. 从 snapshot 中手动提取推文内容

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
