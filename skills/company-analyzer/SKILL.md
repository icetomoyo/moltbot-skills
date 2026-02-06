---
name: company-analyzer
description: 专业公司投资分析工具 - 多数据源整合（Alpha Vantage, Finnhub, NewsAPI），深度财务分析、智能评分系统
homepage: https://github.com/icetomoyo/openclaw-skills
metadata:
  openclaw:
    emoji: 📊
    requires:
      bins:
        - node
    install:
      - id: npm
        kind: npm
        package: axios
        bins:
          - node
---

# Company Analyzer 📊

专业公司投资分析工具，支持多数据源整合和自动备份，提供全面的投资分析和评级。

## ✨ 特性

### 📡 多数据源支持

| 数据源 | 功能 | API Key | 速率限制 |
|--------|------|---------|----------|
| **Alpha Vantage** | 财务数据、股价、公司概况 | 免费申请 | 5次/分钟 |
| **Finnhub** | 实时股价、公司新闻 | 免费申请 | 60次/分钟 |
| **NewsAPI** | 新闻舆情分析 | 免费申请 | 100次/天 |
| **Yahoo Finance** | 备用股价数据 | 无需 | 无限制 |

### 📊 分析维度

- **财务健康度** (25分): 净利润、营收、现金流
- **盈利能力** (25分): ROE、ROA、净利润率
- **估值水平** (20分): P/E、P/B、P/S
- **股价趋势** (10分): 近期涨跌、技术信号
- **规模因素** (10分): 市值、行业地位
- **舆情分析** (10分): 新闻情感、市场情绪

### 🎯 评级系统

| 评级 | 分数 | 建议 | 说明 |
|------|------|------|------|
| 🟢 A | 80-100 | 强烈买入 | 基本面优秀，估值合理 |
| 🟢 B | 65-79 | 买入 | 基本面良好，值得关注 |
| 🟡 C | 50-64 | 持有 | 中性，适合观望 |
| 🟠 D | 35-49 | 减持 | 存在一定风险 |
| 🔴 F | 0-34 | 卖出 | 基本面较差，建议回避 |

## 🚀 使用方法

### 基础使用

```bash
# 分析美股（使用 demo key，数据有限）
node skills/company-analyzer/scripts/analyze.js --ticker AAPL

# 使用中文名
node skills/company-analyzer/scripts/analyze.js "苹果公司"

# 直接使用 ticker
node skills/company-analyzer/scripts/analyze.js TSLA
```

### 使用自己的 API Key（推荐）

```bash
# 设置环境变量
export ALPHA_VANTAGE_API_KEY=your_key_here
export FINNHUB_API_KEY=your_key_here
export NEWS_API_KEY=your_key_here

# 运行分析
node skills/company-analyzer/scripts/analyze.js --ticker MSFT
```

### OpenClaw Agent 调用

```
"分析一下苹果公司"
"帮我看看特斯拉的投资价值"
"评估一下 NVDA"
"分析伯克希尔"
```

## 🔑 获取 API Key

### Alpha Vantage（财务数据）
1. 访问: https://www.alphavantage.co/support/#api-key
2. 填写邮箱注册（免费）
3. 获取 API Key

### Finnhub（实时股价）
1. 访问: https://finnhub.io/
2. 注册免费账户
3. 从 Dashboard 获取 API Key

### NewsAPI（新闻舆情）
1. 访问: https://newsapi.org/
2. 注册获取 API Key
3. 免费版支持 100 次/天

## 📁 输出格式

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
  • 规模: 大盘股

📊 **关键比率**
  • P/E: 28.52
  • P/B: 45.20
  • ROE: 25.3%
  • ROA: 17.1%

📰 **舆情**: 正面65%

⚠️ **风险提示**: 本分析仅供参考，不构成投资建议
*数据来源: Alpha Vantage, Finnhub 等*
```

### Markdown 报告
- 完整财务分析
- 公司概况和业务介绍
- 新闻舆情汇总
- 投资建议和风险提示
- 保存路径: `output/analysis-{ticker}-{date}.md`

## 🌍 支持的市场

### 美股（主要）
- Apple (AAPL), Tesla (TSLA), Microsoft (MSFT)
- Google (GOOGL), Amazon (AMZN), NVIDIA (NVDA)
- Meta (META), Berkshire (BRK-B), TSMC (TSM)

### 中概股
- Alibaba (BABA), Tencent (TCEHY), JD (JD)
- PDD (PDD), NetEase (NTES), Baidu (BIDU)

### 其他
- 支持任意美股 Ticker
- 可通过 `--ticker XXX` 分析

## ⚙️ 技术实现

### 数据源自动切换
```javascript
// 主源失败时自动切换到备用源
const quote = await getStockQuote(ticker);
// 1. 尝试 Alpha Vantage
// 2. 失败则尝试 Finnhub
// 3. 最后尝试 Yahoo Finance
```

### 速率限制管理
- Alpha Vantage: 13秒间隔（免费版）
- Finnhub: 1秒间隔（60次/分钟）
- 自动排队避免触发限制

## 📝 配置说明

### 环境变量
```bash
# 必需（至少一个）
export ALPHA_VANTAGE_API_KEY=xxx
export FINNHUB_API_KEY=xxx

# 可选（新闻舆情）
export NEWS_API_KEY=xxx
```

### 配置文件
编辑 `config.js` 可调整:
- 评分权重
- 评级阈值
- 输出选项

## 🔄 更新日志

### v1.1.0 (2026-02-06)
- ✅ 新增多数据源支持（Alpha Vantage + Finnhub + NewsAPI）
- ✅ 实现自动备份机制
- ✅ 优化评分算法
- ✅ 添加更多财务指标

### v1.0.0 (2026-02-06)
- 🎉 初始版本发布
- ✅ Alpha Vantage 数据接入
- ✅ 基础财务分析
- ✅ WhatsApp + Markdown 双输出

## ⚠️ 免责声明

本工具提供的分析结果仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。请根据自身情况做出独立判断。

## 📄 License

MIT
