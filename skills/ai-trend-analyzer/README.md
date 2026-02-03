# AI Trend Analyzer 📊

深度分析 AI 热点监控结果，生成专业的趋势分析报告。

## 功能

- 📊 **热点深度解析** - 逐条分析技术背景、创新点、行业影响
- 📈 **趋势分析** - 识别整体技术发展趋势和新兴方向  
- 🎯 **细分领域洞察** - AI/LLM、Robotics、VLA 等方向深度分析
- 📝 **专业报告生成** - 结构化 Markdown 报告，含链接和热度值
- 📁 **自动同步** - 报告自动保存到用户同步文件夹

## 使用方法

### 手动运行

```bash
# 分析最新的热点数据
node skills/ai-trend-analyzer/scripts/analyze.js

# 分析指定日期的数据
node skills/ai-trend-analyzer/scripts/analyze.js --date 2026-02-03

# 输出格式选项
node skills/ai-trend-analyzer/scripts/analyze.js --format technical  # 技术深度版
node skills/ai-trend-analyzer/scripts/analyze.js --format executive  # 高管摘要版
node skills/ai-trend-analyzer/scripts/analyze.js --format full       # 完整版（默认）
```

### 通过 OpenClaw Agent

- "帮我深度分析一下今天的 AI 热点"
- "生成 AI 趋势分析报告"
- "解读一下最新的 AI 论文和开源项目"

## 输入数据源

自动读取 `skills/ai-trend-monitor/output/` 中的数据：
- `trends-YYYY-MM-DDTHH-MM-SS.json` - 热点原始数据
- `latest-whatsapp.txt` - 最新摘要

## 输出格式

### 报告结构

```markdown
# AI 趋势深度分析报告

## 📋 执行摘要
- 监控数据源概览
- 关键发现总结（3-5点）
- 推荐关注领域

## 🔥 热点深度解析

### 1. [标题]
**来源**: [平台] | **热度**: [分数] | **链接**: [URL]

#### 技术背景
[技术领域简介]

#### 核心创新点
- 创新点1
- 创新点2
- 创新点3

#### 行业影响
[对 AI 领域的影响分析]

---

### 2. [下一个热点]...

## 📈 整体趋势分析

### 技术方向热度排行
1. **[方向]** - 提及次数/热度分数
2. **[方向]** - ...

### 新兴趋势识别
- 🔥 **趋势1**: [描述]
- 🔥 **趋势2**: [描述]

## 🎯 细分领域洞察

### AI/LLM 领域
[深度分析]

### Robotics/具身智能
[深度分析]

### VLA/World Models
[深度分析]

### 基础设施/工具
[深度分析]

## 💡 投资建议与机会

### 短期机会（1-3个月）
- [机会1]
- [机会2]

### 中期趋势（3-12个月）
- [趋势1]
- [趋势2]

## 📚 延伸阅读

### 必读论文
1. [论文标题] - [链接]
2. ...

### 值得关注的项目
1. [项目名称] - [链接]
2. ...
```

## 技术实现

### 分析流程
1. **数据加载** - 读取 ai-trend-monitor 的 JSON 输出
2. **内容获取** - 抓取论文摘要、项目 README
3. **AI 分析** - 使用大模型进行深度解读
4. **趋势计算** - 对比历史数据分析变化
5. **报告生成** - 输出结构化 Markdown

### 输出位置

| 位置 | 说明 |
|------|------|
| `skills/ai-trend-analyzer/output/` | 技能输出目录 |
| `/Users/icetomoyo/Downloads/同步空间/Dir4Openclaw/` | 用户同步文件夹 |

## 文件结构

```
ai-trend-analyzer/
├── SKILL.md              # 技能说明
├── README.md             # 本文件
├── scripts/
│   └── analyze.js       # 主分析脚本
└── output/               # 输出目录
    ├── analysis-*.md    # 分析报告
    ├── latest-analysis.md # 最新报告
    └── analysis-prompt.txt # AI提示词
```

## 依赖

- Node.js
- ai-trend-monitor 的输出数据
- OpenClaw AI 服务（用于深度分析）

## GitHub

https://github.com/icetomoyo/openclaw-skills/tree/main/skills/ai-trend-analyzer
