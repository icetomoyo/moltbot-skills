---
name: ai-trend-analyzer
description: Deep analysis of AI trend monitoring results. Parses data from ai-trend-monitor, provides comprehensive analysis of each hotspot, identifies overall trends, and generates professional markdown reports with insights and predictions.
homepage: https://github.com/icetomoyo/openclaw-skills
metadata: {"openclaw":{"emoji":"📊","requires":{"bins":["node"]},"install":[{"id":"npm","kind":"npm","package":"axios","bins":["node"]}]}}
---

# AI Trend Analyzer 📊

深度分析 AI 热点监控结果，生成专业的趋势分析报告。

## 功能

### 1. 热点深度解析
- 逐条分析每个热点的技术背景和创新点
- 识别关键技术突破和行业影响
- 提取论文/项目的核心方法论

### 2. 趋势分析
- 识别整体技术发展趋势
- 对比历史数据发现新兴热点
- 预测未来发展方向

### 3. 竞品分析
- 同类技术对比
- 不同平台的内容差异
- 热度变化轨迹

### 4. 专业报告生成
- 结构化的 Markdown 报告
- 包含技术解读、趋势分析、投资建议
- 适合发布到博客/知识库

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
# AI 趋势深度分析报告 - YYYY年MM月DD日

## 📋 执行摘要
- 监控数据源概览
- 关键发现总结
- 推荐关注领域

## 🔥 热点深度解析

### 1. [标题]
**来源**: [平台] | **热度**: [分数]

#### 技术背景
[技术领域简介]

#### 核心创新点
- 创新点1
- 创新点2
- 创新点3

#### 行业影响
[对 AI 领域的影响分析]

#### 相关技术对比
| 技术 | 优势 | 劣势 |
|------|------|------|
| A | ... | ... |
| B | ... | ... |

---

### 2. [下一个热点]...

## 📈 整体趋势分析

### 技术方向热度排行
1. **[方向]** - 提及次数/热度分数
2. **[方向]** - ...

### 新兴趋势识别
- 🔥 **趋势1**: [描述]
- 🔥 **趋势2**: [描述]

### 趋势演变对比
与上周/上月数据对比：
- 上升: [哪些方向热度上升]
- 下降: [哪些方向热度下降]
- 新出现: [新热点]

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

### 长期方向（1年+）
- [方向1]
- [方向2]

## 📚 延伸阅读

### 必读论文
1. [论文标题] - [链接]
2. ...

### 值得关注的项目
1. [项目名称] - [链接]
2. ...

### 推荐资源
- [博客/视频/教程]

---
*报告生成时间: [时间]*
*数据来源: AI Trend Monitor*
*分析模型: [使用的AI模型]*
```

## 技术实现

### 分析流程
1. **数据加载** - 读取 ai-trend-monitor 的 JSON 输出
2. **内容获取** - 抓取论文摘要、项目 README
3. **AI 分析** - 使用大模型进行深度解读
4. **趋势计算** - 对比历史数据分析变化
5. **报告生成** - 输出结构化 Markdown

### 评分维度
- **技术创新性**: 突破性程度
- **实用性**: 落地应用潜力
- **影响力**: 社区关注度
- **时效性**: 发布时间
- **完整度**: 项目/论文成熟度

## 注意事项

- 需要配置 AI 模型 API 进行深度分析
- 分析结果基于当前热点数据，非投资建议
- 技术解读仅供参考，请以原文为准
