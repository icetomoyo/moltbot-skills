# Daily Papers X 📚

自动获取和整理 arXiv 和 Hugging Face 上的热门 AI 论文，智能筛选 Top 20 并精选 Top Pick + 4 Featured 论文。

## 功能特点

- 📊 **智能筛选** - Top 20 选择，确保类别多样性（至少 5 AI&LLM + 5 Embodied AI）
- 🎯 **精选推荐** - 1 Top Pick + 4 Featured（最有流量、最有趣、最有深度、最有价值）
- 📱 **WhatsApp 推送** - 简洁的 TOP 5 摘要
- 📝 **完整报告** - Markdown 格式，包含所有 20 篇论文
- 🔄 **自动同步** - 报告自动保存到用户同步文件夹
- 🔍 **动态热词** - 集成 hot-topic-vocabulary 的 63 个动态热词

## 使用方法

### 手动运行

```bash
# 运行论文获取
node skills/daily-papers-x/scripts/fetch-papers.js

# 或使用 SKILL.md 中定义的命令
```

### 定时运行

默认每天 12:00 自动运行（通过 cron 配置）

## 论文分类

### 6 大研究方向（30 个 arXiv 类别）

| 方向 | 类别 |
|------|------|
| **AI & LLM** | cs.AI, cs.LG, cs.CL, cs.DB, cs.CR, cs.DS, cs.SE |
| **Embodied AI** | cs.RO, cs.CV, cs.GR, cs.SY |
| **Multimodal & Vision** | cs.MM, eess.IV |
| **AI + Finance** | q-fin.CP, q-fin.GN, q-fin.PM, q-fin.ST, q-fin.TR, q-fin.EC, q-fin.MF |
| **AI + Biomedical** | q-bio.QM, q-bio.BM, q-bio.GN, q-bio.TO, q-bio.CB, q-bio.MN, q-bio.SC |
| **AI + Science** | cs.NA, cs.SC, physics.comp-ph, physics.chem-ph, physics.ao-ph |

## 输出格式

### WhatsApp 消息

```
╔════════════════════════════════════╗
║      ⭐⭐⭐ TOP PICK ⭐⭐⭐        ║
╚════════════════════════════════════╝

📌 [Top Pick 论文标题]
🔥 热度: [分数]
📁 [研究方向]
🔗 [URL]
════════════════════════════════════

📚 其他精选:
🔥 最有流量 - [标题]
🎨 最有趣 - [标题]
🧠 最有深度 - [标题]
💎 最有价值 - [标题]
```

### 完整 Markdown 报告

包含：
- ⭐ Top Pick 详细介绍
- 🔥 最有流量论文
- 🎨 最有趣论文
- 🧠 最有深度论文
- 💎 最有价值论文
- 📋 Top 20 完整列表

## 文件结构

```
daily-papers-x/
├── SKILL.md                    # 技能说明
├── README.md                   # 本文件
├── CATEGORIES_REVIEW.md        # 类别管理文档
├── scripts/
│   └── fetch-papers.js        # 主脚本
├── output/                     # 输出目录（gitignored）
└── examples/                   # 示例输出
```

## 输出位置

| 位置 | 文件 |
|------|------|
| `memory/papers-YYYY-MM-DD.md` | 完整报告 |
| `memory/papers-YYYY-MM-DD-summary.txt` | WhatsApp 摘要 |
| `skills/daily-papers-x/output/` | 输出备份 |
| `/Users/icetomoyo/Downloads/同步空间/Dir4Openclaw/` | 同步文件夹 |

## 关键技术

### 热度评分算法
```
Trending Score = Base Score + Hot Topic Bonus + Recency Bonus

- 论文引用：根据引用数计算
- 社区热度：HuggingFace likes, Twitter mentions
- 热词匹配：匹配动态热词库加分
- 时效性：新发表论文有额外加成
```

### 精选策略

1. **Top 20 选择**
   - 按热度排序
   - 强制执行类别最小值（AI&LLM ≥ 5, Embodied AI ≥ 5）

2. **Featured 4 选择**
   - 最有流量：热度最高
   - 最有趣：标题/摘要吸引力
   - 最有深度：方法论创新
   - 最有价值：实用潜力

3. **Top Pick 选择**
   - 从 Featured 4 中综合选出

## 依赖

- Node.js
- arXiv API
- HuggingFace API
- hot-topic-vocabulary（动态热词）

## GitHub

https://github.com/icetomoyo/openclaw-skills/tree/main/skills/daily-papers-x
