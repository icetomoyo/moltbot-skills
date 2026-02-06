# Company Analyzer 📊

专业公司投资分析工具，支持美股、A股、港股的多维度深度分析。

## ✨ 特性

- 🔥 **多市场支持**: 美股、A股、港股全覆盖
- 📡 **多数据源**: Alpha Vantage, SEC EDGAR, 腾讯财经, 东方财富, 新浪财经
- 📊 **智能评分**: 0-100分，A-F评级，买卖建议
- 🔍 **深度分析**: 杜邦分析、行业对比、财务健康度评估
- ⚡ **智能队列**: 自动处理API频率限制，支持批量分析
- 📱 **双输出**: Markdown完整报告 + WhatsApp简洁摘要

## 🚀 快速开始

### 安装依赖

```bash
cd skills/company-analyzer
npm install
```

### 基础使用

```bash
# 分析美股
node scripts/analyze.js --ticker AAPL

# 分析A股
node scripts/analyze.js --ticker 600519

# 分析港股
node scripts/analyze.js --ticker 0700.HK
```

### 智能队列（推荐）

```bash
# 批量添加股票到队列
node scripts/smartQueue.js --add AAPL
node scripts/smartQueue.js --add MSFT
node scripts/smartQueue.js --add 600519

# 自动处理（自动限速）
node scripts/smartQueue.js --process
```

## 📊 分析维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 财务健康度 | 40% | 净利润、ROE、现金流 |
| 估值水平 | 20% | P/E、P/B、行业对比 |
| 盈利能力 | 20% | 利润率、ROA |
| 股价趋势 | 10% | 近期涨跌、技术信号 |
| 规模因素 | 10% | 市值、行业地位 |

## 🎯 评级系统

| 评级 | 分数 | 建议 |
|------|------|------|
| 🟢 A | 80-100 | 强烈买入 |
| 🟢 B | 65-79 | 买入 |
| 🟡 C | 50-64 | 持有 |
| 🟠 D | 35-49 | 减持 |
| 🔴 F | 0-34 | 卖出 |

## 🔑 API Key 配置（可选）

免费申请 API Key 可提升数据质量：

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export ALPHA_VANTAGE_API_KEY=your_key
export FINNHUB_API_KEY=your_key
export NEWS_API_KEY=your_key
```

- [Alpha Vantage](https://www.alphavantage.co/support/#api-key) - 美股财务数据
- [Finnhub](https://finnhub.io/) - 实时股价
- [NewsAPI](https://newsapi.org/) - 新闻舆情

## 📁 项目结构

```
skills/company-analyzer/
├── scripts/
│   ├── analyze.js              # 基础分析入口
│   ├── deepAnalyze.js          # 深度分析（杜邦分析）
│   ├── smartQueue.js           # 智能队列系统
│   ├── dataCollector.js        # 美股数据源
│   ├── chinaDataCollector.js   # A股/港股数据源
│   └── deepAnalysis.js         # SEC EDGAR/财务分析
├── output/                     # 分析报告输出
├── data/                       # 队列数据
├── SKILL.md                    # OpenClaw技能文档
├── DATA_SOURCES.md             # 数据源架构
└── README.md                   # 本文件
```

## 📝 输出示例

### WhatsApp 推送

```
🟢 **Apple Inc (AAPL) 投资分析**

📊 **综合评分**: 82/100
🏆 **投资评级**: A 级
💡 **投资建议**: 强烈买入

📈 **股价**: $185.92 (+1.25%)
💰 **市值**: $2.8T
📈 **52周**: $164.08 - $199.62

━━━━━━━━━━━━━━━
💰 **财务指标**
  • 盈利能力: 净利润 $96.9B
  • ROE: 25.3%
  • 利润率: 24.6%
  • 估值: P/E 28.5 (合理)

⚠️ **风险提示**: 本分析仅供参考，不构成投资建议
```

### Markdown 报告

完整报告包含：
- 执行摘要与评级
- 股价概览与技术指标
- 公司概况与业务介绍
- 深度财务分析（杜邦分析）
- 行业对比排名
- 风险因素与投资建议

## ⚠️ 免责声明

本工具提供的分析结果仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。请根据自身情况做出独立判断。

## 📄 License

MIT
