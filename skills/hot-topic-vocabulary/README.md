# Hot Topic Vocabulary 🔥

动态 AI/技术热词分析器，自动追踪和更新热门关键词，为其他技能提供动态热词支持。

## 功能特点

- 🤖 **自动更新** - 每日 12:00 自动运行，追踪最新热词
- 📊 **10 大分类** - AI、Robotics、Agents、VLA、World Models 等
- 🔗 **技能集成** - 自动更新 ai-trend-monitor 的热词库
- 📈 **趋势追踪** - 识别新兴词汇和趋势变化
- 💾 **JSON 输出** - 标准化格式供其他技能使用

## 使用方法

### 手动运行

```bash
# 运行热词分析
node skills/hot-topic-vocabulary/scripts/analyze.js

# 或使用 npm
npm start
```

### 定时运行

默认每天 12:00 自动运行（通过 cron 配置）

## 热词分类

| 分类 | 关键词示例 |
|------|-----------|
| **AI** | GPT, Claude, Llama, DeepSeek, Kimi, Qwen |
| **Robotics** | Figure, Optimus, Atlas, Unitree, Humanoid |
| **Agents** | Agentic, Multi-agent, AutoGPT, Cursor |
| **VLA** | OpenVLA, RT-2, Diffusion Policy, ACT |
| **World Models** | JEPA, Sora, Dreamer |
| **Multimodal** | VLM, Image Generation, Video Generation |
| **Infra** | Training, Inference, LoRA, Quantization, RAG |
| **Safety** | Alignment, RLHF, Interpretability |
| **Open Source** | GitHub, HuggingFace, Open Source |
| **Apps** | Coding, Medical, Legal, Finance |

## 输出格式

### JSON 结构

```json
{
  "categories": {
    "ai": {
      "keywords": [
        {"word": "GPT", "frequency": 45, "trend": "up"},
        {"word": "DeepSeek", "frequency": 32, "trend": "up"}
      ]
    },
    "robotics": {
      "keywords": [
        {"word": "Figure", "frequency": 28, "trend": "stable"}
      ]
    }
  },
  "lastUpdated": "2026-02-03T12:00:00Z"
}
```

## 文件结构

```
hot-topic-vocabulary/
├── SKILL.md                    # 技能说明
├── README.md                   # 本文件
├── package.json               # 依赖
├── hot-topics-latest.json     # 最新热词（供其他技能使用）
├── scripts/
│   └── analyze.js            # 分析脚本
└── output/                    # 历史输出
    └── hot-topics-*.json
```

## 技术实现

### 数据源

- arXiv 最新论文标题/摘要
- HuggingFace 热门模型
- Reddit r/MachineLearning 讨论
- 技术博客和新闻

### NLP 处理

```javascript
// 关键词提取流程
1. 文本预处理（分词、去停用词）
2. 命名实体识别（NER）
3. 词频统计
4. 趋势分析（对比上一周期）
5. 分类标注
```

## 集成方式

### 被 ai-trend-monitor 使用

```javascript
// monitor.js 中加载动态热词
const hotTopics = loadDynamicHotTopics();
// 用于增强搜索和评分
```

### JSON 读取示例

```javascript
const fs = require('fs');
const hotTopics = JSON.parse(
  fs.readFileSync('skills/hot-topic-vocabulary/output/hot-topics-latest.json')
);
```

## 输出位置

| 位置 | 说明 |
|------|------|
| `skills/hot-topic-vocabulary/hot-topics-latest.json` | 最新热词（主文件）|
| `skills/hot-topic-vocabulary/output/` | 历史存档 |

## 依赖

- Node.js
- 自然语言处理库（分词、NER）
- 数据源 API（arXiv, HuggingFace 等）

## GitHub

https://github.com/icetomoyo/openclaw-skills/tree/main/skills/hot-topic-vocabulary
