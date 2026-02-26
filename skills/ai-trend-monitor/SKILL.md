---
name: ai-trend-monitor
description: Unified AI trend monitoring with ai-daily-digest integration. Tracks 90+ tech blogs via RSS, plus Reddit, HackerNews, arXiv, HuggingFace, GitHub. Features Gemini AI scoring, Chinese translation, structured summaries, and trend analysis.
homepage: https://github.com/icetomoyo/openclaw-skills
metadata: {"openclaw":{"emoji":"🔥","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"fast-xml-parser","bins":["node"]},{"id":"npm","kind":"npm","package":"axios","bins":["node"]}]}}
---

# AI Trend Monitor 🔥 (Enhanced Edition)

统一的 AI 热点监控工具，融合 [ai-daily-digest](https://github.com/vigorX777/ai-daily-digest) 能力，聚合 **90+ 顶级技术博客 RSS**、社区讨论、学术论文、开源项目，提供 AI 智能评分和结构化日报。

## ✨ 融合增强特性

### 📡 技术博客 RSS 监控 (新增)
- **90 个顶级技术博客** — 来自 Andrej Karpathy 推荐的 HN 精选
- 包括: Simon Willison、Gwern、Lilian Weng、OpenAI、DeepMind、各大公司工程博客等
- 自动 RSS/Atom 解析，去重过滤

### 🤖 Gemini AI 智能分析 (新增)
- **三维评分**: 相关性、质量、时效性 (1-10分)
- **6大分类**: AI/ML、安全、工程、工具/开源、观点、其他
- **结构化摘要**: 4-6句覆盖核心问题→论点→结论
- **中文翻译**: 自动翻译标题和摘要
- **推荐理由**: AI 一句话总结阅读价值

### 📊 增强报告结构 (新增)
- **今日看点**: AI 归纳当日技术圈宏观趋势
- **今日必读 TOP 3**: 精选高分深度文章，含完整 AI 分析
- **社区热点**: Reddit/HN/GitHub 实时讨论
- **分类文章列表**: 按 6 大分类浏览
- **可视化图表**: Mermaid 饼图、柱状图、标签云

## 数据源

| 来源 | 类型 | 数量 | 特点 |
|------|------|------|------|
| **📡 Tech Blogs** | RSS | 90+ | Andrej Karpathy 推荐，深度长文 |
| **👽 Reddit** | 社区 | 6 subreddits | 实时讨论，热点追踪 |
| **🟠 HackerNews** | 社区 | API | 技术圈风向标 |
| **📄 arXiv** | 论文 | API | 最新 AI 研究 |
| **🤗 HuggingFace** | 模型 | API | 热门模型/论文 |
| **🐙 GitHub** | 开源 | API | 新星项目 |

## 安装依赖

```bash
cd skills/ai-trend-monitor
npm install fast-xml-parser axios
```

## 配置 Gemini API

**必需配置**（用于 RSS 博客分析和趋势总结）:

```bash
export GEMINI_API_KEY="your-api-key"
```

获取免费 API Key: https://aistudio.google.com/apikey

## 使用方法

### 增强版监控（推荐）

```bash
# 完整监控（包含 RSS 博客 AI 分析）
node skills/ai-trend-monitor/scripts/monitor-enhanced.js
```

### 原版监控（仅社区数据）

```bash
# 仅 Reddit/HN/arxiv/HF/GitHub
node skills/ai-trend-monitor/scripts/monitor.js
```

### 通过 OpenClaw Agent

告诉 Agent：
- "帮我看看现在 AI 领域有什么热点" → 运行完整监控
- "监控最新的 AI 趋势" → 快速版
- "看看今天有哪些高质量技术文章" → RSS 博客重点

## 输出文件

| 文件 | 说明 |
|------|------|
| `output/report-YYYY-MM-DD-HHMMSS.md` | 完整 Markdown 报告（含可视化图表）|
| `output/whatsapp-YYYY-MM-DD-HHMMSS.txt` | WhatsApp 推送消息 |
| `output/trends-YYYY-MM-DD-HHMMSS.json` | 原始数据 JSON |
| `~/Downloads/同步空间/Dir4Openclaw/ai-trends-report-YYYY-MM-DD.md` | 同步文件夹副本 |

## 报告结构示例

```markdown
# 🔥 AI 热点监控日报

## 📝 今日看点
> 今日技术圈聚焦...（AI 生成的趋势总结）

## 📊 数据源统计
| 来源类型 | 数量 | 占比 |

## 🏆 今日必读 TOP 3
### 1. 🔥🔥🔥 [中文标题]
**AI 评分**: 综合 8.5/10 | 相关性 9/10 | 质量 8/10
**摘要**: 4-6 句结构化中文摘要...
**推荐理由**: ...

## 🔥 TOP 10 社区热点
...

## 📚 精选文章分类
### 🤖 AI/ML
### 🔒 Security
...

## 📈 热门关键词 TOP 10
### 可视化统计
```mermaid
xychart-beta...
```
```

## RSS 博客源分类

| 分类 | 代表博客 |
|------|----------|
| **🤖 AI/ML** | Simon Willison, Lilian Weng, OpenAI, DeepMind, Anthropic |
| **🔒 Security** | Krebs on Security, Troy Hunt, Google Project Zero |
| **⚙️ Engineering** | Martin Fowler, Netflix/Uber/Stripe Engineering, High Scalability |
| **🛠️ Tools** | GitHub Blog, Rust/Go/Python Blog, Kubernetes |
| **💡 Opinion** | Paul Graham, Dan Abramov, Sam Altman, patio11 |

完整列表见: `config/rss-feeds.js`

## 热度计算

### 社区内容评分
```
Reddit:     热度 = upvotes × 0.01 + 5
HackerNews: 热度 = points × 0.01 + 4
GitHub:     热度 = stars × 0.02 + 3
```

### AI 评分（RSS 博客）
```
综合评分 = (相关性 + 质量 + 时效性) / 3

各维度 1-10 分:
- 相关性: 对 AI/技术从业者的价值
- 质量:   技术深度、原创性、写作质量
- 时效性: 当前价值和新鲜度
```

## 技术实现

### RSS 抓取流程
```
90 个 RSS 源 → 并发抓取 → 时间过滤 → 去重 → 
AI 评分/分类/摘要/翻译 → 按分排序 → 生成报告
```

### AI 分析流水线
```
RSS 文章 → Gemini API → 三维评分 + 分类 + 摘要 + 翻译
```

## 配置调优

### `config/rss-feeds.js`
- 修改 `defaultHours`: 抓取时间范围（默认 48 小时）
- 修改 `concurrency`: 并发数（默认 10）
- 修改 `feeds`: 添加/删除 RSS 源

### `lib/gemini-analyzer.js`
- 修改 `batchSize`: AI 分析批次大小（默认 3，避免 API 限制）
- 修改 `CATEGORIES`: 自定义分类体系

## 注意事项

1. **Gemini API**: RSS 博客分析需要配置 `GEMINI_API_KEY`
2. **API 限制**: Gemini 免费版有速率限制，建议 batchSize ≤ 3
3. **RSS 稳定性**: 部分博客 RSS 可能不稳定，会自动跳过
4. **时间范围**: 默认抓取最近 48 小时内容，可调整

## 更新日志

### v2.0.1 (2026-02-26) - Bug Fix
- 🐛 修复 Markdown 报告各平台详情截断问题
- ✅ 各平台详情现在显示完整内容（不再限制前5条）
- 📄 arXiv、HuggingFace、Reddit、GitHub 等全部条目完整展示

### v2.0.0 (2026-02-15) - Enhanced Edition
- ✅ 融合 ai-daily-digest RSS 博客监控能力
- ✅ 集成 Gemini AI 智能评分、分类、摘要
- ✅ 新增 6 大分类体系
- ✅ 新增趋势总结和可视化图表
- ✅ 中文标题翻译和推荐理由
- ✅ 增强版 Markdown 报告结构

### v1.0.0 (2026-02-01)
- 初始版本
- 支持 5 个社区数据源
- 统一热度评分系统

## 致谢

本项目融合并改进了 [ai-daily-digest](https://github.com/vigorX777/ai-daily-digest) 的核心能力，感谢原作者的开源贡献。
