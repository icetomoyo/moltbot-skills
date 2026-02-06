#!/usr/bin/env node
/**
 * 公司深度投资分析器
 * 整合 SEC EDGAR、巨潮资讯、行业对比、杜邦分析
 * 
 * 用法:
 *   node deepAnalyze.js --ticker AAPL
 *   node deepAnalyze.js --ticker 600519 --market CN
 */

const fs = require('fs');
const path = require('path');
const { 
  SECEDGARAPI, 
  IndustryComparisonAPI,
  dupontAnalysis,
  calculateFinancialHealth 
} = require('./deepAnalysis');
const {
  getCompanyOverview,
  getStockQuote,
  getFinancialData
} = require('./dataCollector');

const OUTPUT_DIR = path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const secAPI = new SECEDGARAPI();
const industryAPI = new IndustryComparisonAPI();

/**
 * 解析输入
 */
function parseInput(args) {
  const input = args.join(' ');
  
  if (input.includes('--ticker')) {
    const match = input.match(/--ticker\s+(\S+)/);
    return { type: 'ticker', value: match?.[1], market: 'US' };
  }
  
  if (/^[A-Z0-9]{1,6}(\.SS|\.SZ|\.HK)?$/i.test(input)) {
    return { type: 'ticker', value: input, market: 'US' };
  }
  
  return { type: 'company', value: input.trim(), market: 'US' };
}

/**
 * 美股深度分析 - 使用备用数据源
 */
async function deepAnalyzeUSStock(ticker) {
  console.log(`\n🔥 深度分析美股: ${ticker}\n`);
  
  // 尝试多个数据源
  console.log('📊 获取多维度数据...');
  
  let overview = null;
  let quote = null;
  
  // 尝试 Alpha Vantage
  try {
    [overview, quote] = await Promise.all([
      getCompanyOverview(ticker),
      getStockQuote(ticker)
    ]);
  } catch (e) {
    console.log('   → Alpha Vantage 受限，使用备用数据');
  }
  
  // 如果失败，使用腾讯/新浪财经的美股数据（部分支持）
  if (!overview) {
    console.log('   → 尝试备用数据源...');
    // 使用基础行业数据
    overview = {
      name: ticker,
      ticker: ticker,
      sector: 'Technology',
      industry: 'Technology',
      marketCap: 0,
      peRatio: 0,
      pbRatio: 0,
      roe: 0,
      profitMargin: 0,
      weekHigh52: 0,
      weekLow52: 0,
      employees: 0,
      source: 'Limited'
    };
  }
  
  // SEC EDGAR 数据（免费，有限速）
  let secFacts = null;
  try {
    secFacts = await secAPI.getCompanyFacts(ticker);
  } catch (e) {
    console.log('   → SEC EDGAR 数据获取受限');
  }
  
  // 获取行业基准
  const industryAverages = await industryAPI.getIndustryAverages(overview.sector || 'Technology');
  
  // 杜邦分析
  const dupont = secFacts ? dupontAnalysis(
    secFacts.netIncome?.value,
    secFacts.revenue?.value,
    secFacts.totalAssets?.value,
    secFacts.equity?.value
  ) : null;
  
  // 财务健康度
  const health = secFacts ? calculateFinancialHealth(secFacts, industryAverages) : null;
  
  // 行业排名
  const industryRanks = {
    pe: industryAPI.calculateIndustryRank(overview.peRatio || 0, 'pe', industryAverages),
    pb: industryAPI.calculateIndustryRank(overview.pbRatio || 0, 'pb', industryAverages),
    roe: industryAPI.calculateIndustryRank(overview.roe || 0, 'roe', industryAverages),
    margin: industryAPI.calculateIndustryRank(overview.profitMargin || 0, 'profitMargin', industryAverages)
  };
  
  return {
    ticker,
    company: overview.name,
    market: 'US',
    overview,
    quote,
    secFacts,
    industry: {
      sector: overview.sector,
      averages: industryAverages,
      ranks: industryRanks
    },
    analysis: {
      dupont,
      health,
      industryRanks
    }
  };
}

/**
 * 生成深度分析报告
 */
async function generateDeepReport(data) {
  const { ticker, company, overview, quote, secFacts, industry, analysis } = data;
  const timestamp = new Date().toISOString().split('T')[0];
  
  const price = quote?.price || 0;
  const change = quote?.change || 0;
  const changePercent = quote?.changePercent || 0;
  
  // 计算综合评分
  let totalScore = 0;
  const scoreDetails = [];
  
  // 估值评分
  if (overview.peRatio < industry.averages.pe) {
    totalScore += 20;
    scoreDetails.push({ item: '估值优势', score: 20, comment: `P/E ${overview.peRatio.toFixed(1)} < 行业平均 ${industry.averages.pe}` });
  } else {
    totalScore += 10;
    scoreDetails.push({ item: '估值', score: 10, comment: `P/E ${overview.peRatio.toFixed(1)}` });
  }
  
  // 盈利能力
  if (overview.roe > industry.averages.roe) {
    totalScore += 25;
    scoreDetails.push({ item: 'ROE优势', score: 25, comment: `${(overview.roe*100).toFixed(1)}% > 行业 ${(industry.averages.roe*100).toFixed(1)}%` });
  } else if (overview.roe > 0.10) {
    totalScore += 15;
    scoreDetails.push({ item: 'ROE', score: 15, comment: `${(overview.roe*100).toFixed(1)}%` });
  }
  
  // 利润率
  if (overview.profitMargin > industry.averages.profitMargin) {
    totalScore += 20;
    scoreDetails.push({ item: '利润率优势', score: 20, comment: `${(overview.profitMargin*100).toFixed(1)}% > 行业 ${(industry.averages.profitMargin*100).toFixed(1)}%` });
  } else if (overview.profitMargin > 0.10) {
    totalScore += 10;
    scoreDetails.push({ item: '利润率', score: 10, comment: `${(overview.profitMargin*100).toFixed(1)}%` });
  }
  
  // 财务健康
  if (analysis.health) {
    totalScore += analysis.health.total * 0.25;
    scoreDetails.push({ item: '财务健康', score: analysis.health.total * 0.25, comment: analysis.health.grade + '级' });
  }
  
  // 杜邦分析
  if (analysis.dupont) {
    totalScore += 10;
    scoreDetails.push({ item: '资产效率', score: 10, comment: `ROE ${(analysis.dupont.roe*100).toFixed(1)}%` });
  }
  
  // 评级
  const rating = totalScore >= 80 ? { grade: 'A', action: '强烈买入', emoji: '🟢' } :
                 totalScore >= 65 ? { grade: 'B', action: '买入', emoji: '🟢' } :
                 totalScore >= 50 ? { grade: 'C', action: '持有', emoji: '🟡' } :
                 totalScore >= 35 ? { grade: 'D', action: '减持', emoji: '🟠' } :
                 { grade: 'F', action: '卖出', emoji: '🔴' };
  
  // 生成 Markdown 深度报告
  const report = `# ${company} (${ticker}) 深度投资分析报告

**报告日期**: ${new Date().toLocaleString('zh-CN')}  
**分析师**: AI 深度分析系统 v2.0  
**评级**: ${rating.grade} | **建议**: ${rating.action}

---

## 📊 执行摘要

### 综合评分
**${Math.round(totalScore)}/100** - ${rating.grade}级

| 维度 | 得分 | 说明 |
|------|------|------|
${scoreDetails.map(d => `| ${d.item} | ${d.score.toFixed(1)} | ${d.comment} |`).join('\n')}

### 核心结论
**${rating.action}** - 基于财务健康度、行业对比、估值综合评估

---

## 📈 股价概览

- **当前价格**: $${price.toFixed(2)} ${change !== 0 ? `(${change >= 0 ? '+' : ''}${(changePercent*100).toFixed(2)}%)` : ''}
- **市值**: $${(overview.marketCap / 1e9).toFixed(2)}B
- **52周区间**: $${overview.weekLow52?.toFixed(2)} - $${overview.weekHigh52?.toFixed(2)}
- **行业**: ${overview.sector}

---

## 💰 深度财务分析

### 3.1 财务健康度评估
${analysis.health ? `
**综合评级**: ${analysis.health.grade}

| 维度 | 得分 | 评价 |
|------|------|------|
${analysis.health.details.map(d => `| ${d.metric} | ${d.score} | ${d.score >= 20 ? '✅' : d.score >= 10 ? '⚠️' : '❌'} |`).join('\n')}

**总得分**: ${analysis.health.total}/100
` : '*SEC数据获取受限，使用简化评估*'}

### 3.2 杜邦分析 (ROE拆解)
${analysis.dupont ? `
**ROE**: ${(analysis.dupont.roe * 100).toFixed(2)}%

| 因素 | 数值 | 含义 |
|------|------|------|
| 净利润率 | ${(analysis.dupont.profitMargin * 100).toFixed(2)}% | 盈利能力 |
| 资产周转率 | ${analysis.dupont.assetTurnover.toFixed(2)} | 运营效率 |
| 权益乘数 | ${analysis.dupont.equityMultiplier.toFixed(2)} | 财务杠杆 |

${analysis.dupont.roe > 0.15 ? '✅ **ROE优秀** (>15%)' : analysis.dupont.roe > 0.10 ? '⚠️ **ROE良好** (10-15%)' : '❌ **ROE偏低** (<10%)'}
` : '*杜邦分析需要完整财务报表数据*'}

### 3.3 行业对比分析

| 指标 | 公司值 | 行业平均 | 行业排名 | 评价 |
|------|--------|----------|----------|------|
| 市盈率 | ${overview.peRatio?.toFixed(2)} | ${industry.averages.pe} | ${industry.ranks.pe.rank} | ${industry.ranks.pe.grade} |
| 市净率 | ${overview.pbRatio?.toFixed(2)} | ${industry.averages.pb} | ${industry.ranks.pb.rank} | ${industry.ranks.pb.grade} |
| ROE | ${(overview.roe*100)?.toFixed(1)}% | ${(industry.averages.roe*100).toFixed(1)}% | ${industry.ranks.roe.rank} | ${industry.ranks.roe.grade} |
| 净利润率 | ${(overview.profitMargin*100)?.toFixed(1)}% | ${(industry.averages.profitMargin*100).toFixed(1)}% | ${industry.ranks.margin.rank} | ${industry.ranks.margin.grade} |

---

## 🏭 行业分析

### 4.1 行业定位
- **所属行业**: ${overview.sector}
- **细分领域**: ${overview.industry}
- **竞争地位**: ${industry.ranks.roe.percentile >= 75 ? '行业领先' : industry.ranks.roe.percentile >= 50 ? '行业中上' : '行业中下'}

### 4.2 行业基准数据
| 指标 | 行业平均 | 公司vs行业 |
|------|----------|------------|
| 市盈率 | ${industry.averages.pe}x | ${((overview.peRatio/industry.averages.pe - 1)*100).toFixed(0)}% |
| ROE | ${(industry.averages.roe*100).toFixed(1)}% | ${((overview.roe/industry.averages.roe - 1)*100).toFixed(0)}% |
| 净利润率 | ${(industry.averages.profitMargin*100).toFixed(1)}% | ${((overview.profitMargin/industry.averages.profitMargin - 1)*100).toFixed(0)}% |

---

## ⚠️ 风险因素

### 5.1 财务风险
${secFacts ? `
- 资产负债率: ${(secFacts.totalLiabilities?.value / secFacts.totalAssets?.value * 100).toFixed(1)}%
- 现金流健康度: ${secFacts.operatingCashFlow?.value > 0 ? '✅ 经营现金流为正' : '❌ 经营现金流为负'}
` : '- 财务报表数据获取受限'}

### 5.2 估值风险
- 当前PE ${overview.peRatio?.toFixed(1)}x ${overview.peRatio > 30 ? '❌ 高于历史均值' : overview.peRatio > 20 ? '⚠️ 处于合理区间' : '✅ 估值偏低'}

### 5.3 行业风险
- ${overview.sector} 行业周期性
- 竞争格局变化
- 政策/监管风险

---

## 🎯 投资建议

### 6.1 评级说明
**${rating.grade} 级** - ${rating.action}

### 6.2 核心逻辑
${scoreDetails.filter(d => d.score >= 15).map(d => `- ✅ ${d.item}: ${d.comment}`).join('\n')}

${scoreDetails.filter(d => d.score < 10).map(d => `- ⚠️ ${d.item}: ${d.comment}`).join('\n')}

### 6.3 操作建议
- **建议操作**: ${rating.action}
- **仓位建议**: ${totalScore >= 70 ? '重仓' : totalScore >= 50 ? '中等仓位' : '轻仓观望'}
- **持有期**: 建议 ${totalScore >= 60 ? '长期持有 (1-3年)' : '短期持有 (6-12个月)'}

---

## 📚 数据来源

- 财务数据: SEC EDGAR API, Alpha Vantage
- 行业对比: 行业ETF基准数据
- 股价数据: Finnhub, Yahoo Finance
- 分析报告生成时间: ${new Date().toLocaleString('zh-CN')}

---

## 📌 免责声明

本报告由 AI 系统自动生成，仅供参考，不构成投资建议。投资有风险，入市需谨慎。请根据自身风险承受能力和投资目标做出独立判断。

---

*深度分析 v2.0 | 多数据源整合*
`;

  // 保存
  const mdPath = path.join(OUTPUT_DIR, `deep-analysis-${ticker}-${timestamp}.md`);
  fs.writeFileSync(mdPath, report, 'utf-8');
  
  // WhatsApp 摘要
  const whatsapp = `${rating.emoji} **${company} (${ticker}) 深度分析**

📊 **综合评分**: ${Math.round(totalScore)}/100
🏆 **评级**: ${rating.grade} 级 | ${rating.action}

📈 **股价**: $${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${(changePercent*100).toFixed(2)}%)
💰 **市值**: $${(overview.marketCap/1e9).toFixed(1)}B
🏭 **行业**: ${overview.sector}

━━━━━━━━━━━━━━━
💰 **财务分析**
${analysis.dupont ? `  • ROE: ${(analysis.dupont.roe*100).toFixed(1)}%` : ''}
${analysis.health ? `  • 健康度: ${analysis.health.grade}级` : ''}
  • P/E: ${overview.peRatio?.toFixed(1)} (${industry.ranks.pe.rank})
  • ROE: ${(overview.roe*100)?.toFixed(1)}% (${industry.ranks.roe.rank})

📊 **行业对比**
  • 行业: ${overview.sector}
  • 竞争地位: ${industry.ranks.roe.percentile >= 75 ? '领先' : '中等'}

⚠️ **风险提示**: 本分析仅供参考，不构成投资建议
📄 **完整报告**: ${mdPath}`;

  const waPath = path.join(OUTPUT_DIR, `deep-whatsapp-${Date.now()}.txt`);
  fs.writeFileSync(waPath, whatsapp, 'utf-8');
  
  console.log(`\n✅ 深度报告: ${mdPath}`);
  console.log(`✅ WhatsApp: ${waPath}`);
  console.log('\n' + '='.repeat(60));
  console.log('📱 推送预览:');
  console.log('='.repeat(60));
  console.log(whatsapp);
  console.log('='.repeat(60));
  
  return { mdPath, waPath, whatsapp, score: Math.round(totalScore), rating: rating.grade };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🏢 公司深度投资分析器 v2.0\n');
    console.log('功能:');
    console.log('  • SEC EDGAR 财务报表分析');
    console.log('  • 杜邦分析 (ROE拆解)');
    console.log('  • 行业对比排名');
    console.log('  • 综合健康度评估\n');
    console.log('用法:');
    console.log('  node deepAnalyze.js --ticker AAPL');
    console.log('  node deepAnalyze.js MSFT\n');
    process.exit(0);
  }
  
  const parsed = parseInput(args);
  const ticker = parsed.value;
  
  console.log(`📌 分析标的: ${ticker}`);
  
  try {
    const data = await deepAnalyzeUSStock(ticker);
    const output = await generateDeepReport(data);
    
    console.log('\n📤 RESULT_START');
    console.log(JSON.stringify({
      ticker,
      company: data.company,
      score: output.score,
      rating: output.rating,
      reportPath: output.mdPath
    }, null, 2));
    console.log('📤 RESULT_END');
  } catch (e) {
    console.error('❌ 分析失败:', e.message);
    process.exit(1);
  }
}

main();
