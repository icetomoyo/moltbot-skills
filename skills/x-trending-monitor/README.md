# X Trending Monitor 🔥

监控 X.com (Twitter) 上关于 AI、机器人、具身智能、VLA、World Model 的热门推文。

## 快速开始

### 方式 1: 手动调用（推荐）

当你想看 X 上的热门 AI 消息时，告诉 Agent：

```
"帮我看看 X 上有什么热门 AI 消息"
"监控一下 X.com 的最新推文"
"看看现在 AI 领域有什么热门讨论"
```

Agent 会自动：
1. 打开 X.com 搜索页面
2. 提取热门推文
3. 生成摘要报告
4. 发送 WhatsApp 推送

### 方式 2: 运行脚本

```bash
# 查看浏览器操作说明
node skills/x-trending-monitor/scripts/fetch-x-browser.js

# 分析已保存的数据
node skills/x-trending-monitor/scripts/fetch-x-trending.js
```

## 监控领域

| 领域 | 关键词示例 |
|------|-----------|
| **AI/LLM** | GPT-5, Claude 4, Gemini 2.5, DeepSeek-V4, Llama 4 |
| **Robotics** | Figure 02/03, Optimus, Tesla Bot, Unitree, humanoid |
| **VLA** | OpenVLA, π0, RT-2, vision language action |
| **World Model** | JEPA, Sora Turbo, DreamerV3, world models |

## 搜索链接（可直接访问）

### 1. AI/LLM 热门
```
https://x.com/search?q=(GPT-5%20OR%20Claude-4%20OR%20Gemini-2.5%20OR%20DeepSeek)%20min_faves%3A100%20lang%3Aen&f=live
```

### 2. Robotics 热门
```
https://x.com/search?q=(Figure-02%20OR%20Optimus%20OR%20%22humanoid%20robot%22)%20min_faves%3A50%20lang%3Aen&f=live
```

### 3. VLA 热门
```
https://x.com/search?q=(VLA%20OR%20OpenVLA%20OR%20%22pi-zero%22)%20min_faves%3A30%20lang%3Aen&f=live
```

### 4. World Model 热门
```
https://x.com/search?q=(%22world%20model%22%20OR%20JEPA%20OR%20%22Sora%20Turbo%22)%20min_faves%3A30%20lang%3Aen&f=live
```

## 输出格式

### WhatsApp 推送示例

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
1️⃣ @DrJimFan (5.2K likes, 1.2K retweets)
   🔥🔥🔥 热度: 9.2/10 (HOT)
   💬 OpenVLA is finally here! The first open-source VLA model...
   🏷️ OpenVLA, VLA, embodied AI
   🔗 https://x.com/DrJimFan/status/...

2️⃣ @karpathy (8.9K likes, 2.1K retweets)
   🔥🔥🔥 热度: 10/10 (VIRAL)
   💬 GPT-5 speculation is interesting but...
   🏷️ GPT-5, VLA, AI
   🔗 https://x.com/karpathy/status/...

📈 热门话题:
   1. OpenVLA (5 mentions)
   2. GPT-5 (3 mentions)
   3. World Model (4 mentions)
```

## 文件结构

```
skills/x-trending-monitor/
├── SKILL.md                    # 技能说明
├── README.md                   # 本文件
├── scripts/
│   ├── fetch-x-trending.js    # 数据分析脚本
│   └── fetch-x-browser.js     # 浏览器操作说明
└── output/                     # 输出目录
    ├── tweets-*.json          # 原始推文数据
    ├── summary-*.md           # 完整报告
    └── whatsapp-*.txt         # WhatsApp 消息
```

## 热度评分算法

```
热度分数 = (likes × 1) + (retweets × 2) + (replies × 1.5) + (quotes × 1.5)

等级划分:
- 🔥🔥🔥 VIRAL (9-10): > 10000 分
- 🔥🔥 HOT (7-8): 5000-10000 分
- 🔥 TRENDING (5-6): 2000-5000 分
- ⭐ WARM (3-4): 500-2000 分
- 💤 LOW (1-2): < 500 分
```

## 使用建议

1. **频率**: 每 2-4 小时检查一次，避免过于频繁
2. **登录**: 确保 Chrome 已登录 X.com 账号
3. **筛选**: 使用 `min_faves` 过滤低质量推文
4. **关注**: 重点关注 Viral 和 Hot 级别的推文

## GitHub

此技能作为 openclaw-skills 项目的一部分维护。

---

**注意**: X.com 有反爬虫机制，请使用浏览器自动化方式访问，不要直接请求 API。
