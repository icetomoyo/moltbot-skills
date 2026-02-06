#!/usr/bin/env node
/**
 * 公司投资分析器 - 全球市场版本
 * 支持: 美股、A股、港股
 * 
 * 数据源:
 * - 美股: Alpha Vantage, Finnhub, Yahoo Finance
 * - A股: 东方财富, 腾讯财经, 新浪财经
 * - 港股: 腾讯财经, 新浪财经
 * 
 * 用法:
 *   node analyze.js --ticker AAPL        # 美股
 *   node analyze.js --ticker 600519.SS   # A股（贵州茅台）
 *   node analyze.js --ticker 0700.HK     # 港股（腾讯）
 *   node analyze.js "贵州茅台" --market CN
 */

const fs = require('fs');
const path = require('path');
const { 
  getCompanyOverview, 
  getStockQuote, 
  getFinancialData, 
  getNewsSentiment,
  guessTicker 
} = require('./dataCollector');
const {
  detectMarket,
  getChinaStockQuote,
  getAStockName,
  getHKStockName
} = require('./chinaDataCollector');

const OUTPUT_DIR = path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 解析输入
 */
function parseInput(args) {
  const input = args.join(' ');
  
  // 检查 --market 参数
  const marketMatch = input.match(/--market\s+(US|CN|HK)/i);
  const market = marketMatch ? marketMatch[1].toUpperCase() : 'AUTO';
  
  // --ticker
  if (input.includes('--ticker')) {
    const match = input.match(/--ticker\s+(\S+)/);
    const ticker = match?.[1];
    return { type: 'ticker', value: ticker, market: market === 'AUTO' ? detectMarket(ticker) : market };
  }
  
  // 去除 --market 部分
  const cleanInput = input.replace(/--market\s+\w+/i, '').trim();
  
  // 判断是否是纯代码
  if (/^[A-Z0-9]{1,6}(\.SS|\.SZ|\.HK|\.SH)?$/i.test(cleanInput)) {
    return { 
      type: 'ticker', 
      value: cleanInput, 
      market: market === 'AUTO' ? detectMarket(cleanInput) : market 
    };
  }
  
  // 公司名
  return { type: 'company', value: cleanInput, market };
}

/**
 * 猜测A股/港股代码
 */
function guessChinaTicker(company, market) {
  const aStocks = {
    '茅台': '600519.SS', '贵州茅台': '600519.SS',
    '五粮液': '000858.SZ',
    '美的': '000333.SZ', '美的集团': '000333.SZ',
    '格力': '000651.SZ', '格力电器': '000651.SZ',
    '比亚迪': '002594.SZ',
    '宁德时代': '300750.SZ',
    '中国平安': '601318.SS',
    '工商银行': '601398.SS',
    '招商银行': '600036.SS',
    '恒瑞医药': '600276.SS',
    '长江电力': '600900.SS',
    '隆基绿能': '601012.SS',
    '海天味业': '603288.SS'
  };
  
  const hkStocks = {
    '腾讯': '0700.HK', '腾讯控股': '0700.HK',
    '美团': '3690.HK', '美团点评': '3690.HK',
    '小米': '1810.HK', '小米集团': '1810.HK',
    '阿里': '9988.HK', '阿里巴巴': '9988.HK',
    '汇丰': '0005.HK', '汇丰控股': '0005.HK',
    '友邦': '1299.HK', '友邦保险': '1299.HK',
    '港交所': '0388.HK', '香港交易所': '0388.HK',
    '中海油': '0883.HK', '中国海洋石油': '0883.HK',
    '建设银行': '0939.HK',
    '工商银行': '1398.HK',
    '中国银行': '3988.HK',
    '比亚迪股份': '1211.HK',
    '网易': '9999.HK',
    '京东': '9618.HK', '京东集团': '9618.HK'
  };
  
  const map = market === 'HK' ? hkStocks : (market === 'CN' ? aStocks : { ...aStocks, ...hkStocks });
  
  for (const [key, ticker] of Object.entries(map)) {
    if (company.includes(key)) return ticker;
  }
  
  return null;
}

/**
 * 获取美股数据
 */
async function analyzeUSStock(ticker) {
  console.log(`\n🇺🇸 分析美股: ${ticker}\n`);
  
  const [overview, quote, financials, news] = await Promise.all([
    getCompanyOverview(ticker),
    getStockQuote(ticker),
    getFinancialData(ticker),
    getNewsSentiment(ticker, ticker)
  ]);
  
  if (!overview) throw new Error(`无法获取 ${ticker} 的数据`);
  
  return {
    ticker,
    company: overview.name,
    market: 'US',
    overview,
    quote,
    financials,
    news
  };
}

/**
 * 获取A股/港股数据
 */
async function analyzeChinaStock(code, market) {
  const isHK = market === 'HK';
  console.log(`\n${isHK ? '🇭🇰' : '🇨🇳'} 分析${isHK ? '港股' : 'A股'}: ${code}\n`);
  
  const quote = await getChinaStockQuote(code);
  
  if (!quote) throw new Error(`无法获取 ${code} 的数据`);
  
  const name = quote.name || (isHK ? getHKStockName(code) : getAStockName(code));
  
  return {
    ticker: code,
    company: name,
    market,
    overview: {
      name,
      ticker: code,
      exchange: isHK ? 'HKEX' : (code.endsWith('.SS') ? 'SSE' : 'SZSE'),
      marketCap: quote.marketCap || 0,
      peRatio: quote.peRatio || 0,
      pbRatio: quote.pbRatio || 0,
      employees: 0,
      source: quote.source
    },
    quote,
    financials: null,
    news: { sentiment: { positive: 50, neutral: 30, negative: 20 } }
  };
}

/**
 * 计算评分
 */
function calculateScore(data) {
  let score = 0;
  const details = [];
  const { quote, overview } = data;
  
  // 股价表现
  if (quote.changePercent > 0.05) {
    score += 15;
    details.push({ item: '近期走势', score: 15, comment: `+${(quote.changePercent*100).toFixed(1)}%` });
  } else if (quote.changePercent > 0) {
    score += 10;
    details.push({ item: '近期走势', score: 10, comment: `+${(quote.changePercent*100).toFixed(1)}%` });
  } else if (quote.changePercent > -0.03) {
    score += 5;
    details.push({ item: '近期走势', score: 5, comment: `${(quote.changePercent*100).toFixed(1)}%` });
  }
  
  // 市值
  if (overview.marketCap > 1000e9) {
    score += 20;
    details.push({ item: '规模', score: 20, comment: '超大盘股' });
  } else if (overview.marketCap > 100e9) {
    score += 15;
    details.push({ item: '规模', score: 15, comment: '大盘股' });
  } else if (overview.marketCap > 10e9) {
    score += 10;
    details.push({ item: '规模', score: 10, comment: '中盘股' });
  }
  
  // 估值
  if (overview.peRatio > 0 && overview.peRatio < 15) {
    score += 20;
    details.push({ item: '估值', score: 20, comment: `P/E ${overview.peRatio.toFixed(1)} (低估)` });
  } else if (overview.peRatio > 0 && overview.peRatio < 25) {
    score += 15;
    details.push({ item: '估值', score: 15, comment: `P/E ${overview.peRatio.toFixed(1)} (合理)` });
  } else if (overview.peRatio > 0) {
    score += 5;
    details.push({ item: '估值', score: 5, comment: `P/E ${overview.peRatio.toFixed(1)} (偏高)` });
  }
  
  // 美股特有指标
  if (data.market === 'US' && data.overview) {
    if (data.overview.roe > 0.15) {
      score += 20;
      details.push({ item: 'ROE', score: 20, comment: `${(data.overview.roe*100).toFixed(1)}%` });
    } else if (data.overview.roe > 0.10) {
      score += 10;
      details.push({ item: 'ROE', score: 10, comment: `${(data.overview.roe*100).toFixed(1)}%` });
    }
    
    if (data.overview.profitMargin > 0.15) {
      score += 15;
      details.push({ item: '利润率', score: 15, comment: `${(data.overview.profitMargin*100).toFixed(1)}%` });
    }
  }
  
  // 换手率（A股/港股特有）
  if (quote.turnover > 0 && quote.turnover < 100) {
    score += 5;
    details.push({ item: '活跃度', score: 5, comment: `换手率 ${quote.turnover.toFixed(2)}%` });
  }
  
  return { total: Math.min(score, 100), details };
}

/**
 * 评级
 */
function getRating(score) {
  if (score >= 80) return { rating: 'A', action: '强烈买入', emoji: '🟢' };
  if (score >= 65) return { rating: 'B', action: '买入', emoji: '🟢' };
  if (score >= 50) return { rating: 'C', action: '持有', emoji: '🟡' };
  if (score >= 35) return { rating: 'D', action: '减持', emoji: '🟠' };
  return { rating: 'F', action: '卖出', emoji: '🔴' };
}

/**
 * 格式化
 */
function formatNumber(num) {
  if (!num || isNaN(num)) return 'N/A';
  if (Math.abs(num) >= 1e12) return `$${(num/1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9) return `$${(num/1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num/1e6).toFixed(2)}M`;
  if (Math.abs(num) >= 1e4) return `¥${(num/1e4).toFixed(0)}万`;
  return `¥${num.toFixed(2)}`;
}

/**
 * 生成输出
 */
async function generateOutputs(data, scoreData) {
  const { ticker, company, market, overview, quote } = data;
  const { total: score, details } = scoreData;
  const { rating, action, emoji } = getRating(score);
  
  const price = quote?.price || 0;
  const change = quote?.change || 0;
  const changePercent = quote?.changePercent || 0;
  const priceEmoji = change >= 0 ? '📈' : '📉';
  const currency = market === 'US' ? '$' : (market === 'HK' ? 'HK$' : '¥');
  
  const timestamp = new Date().toISOString().split('T')[0];
  
  // WhatsApp
  const whatsapp = `${emoji} **${company} (${ticker}) 投资分析**

📊 **综合评分**: ${score}/100
🏆 **投资评级**: ${rating} 级
💡 **投资建议**: ${action}

${priceEmoji} **股价**: ${currency}${price.toFixed(2)} ${change !== 0 ? `(${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)` : ''}
💰 **市值**: ${formatNumber(overview.marketCap)}
📊 **交易所**: ${overview.exchange}

━━━━━━━━━━━━━━━
💰 **评分细项**
${details.slice(0, 5).map(d => `  • ${d.item}: ${d.comment}`).join('\n')}

📊 **关键指标**
  • P/E: ${overview.peRatio?.toFixed(2) || 'N/A'}
  • P/B: ${overview.pbRatio?.toFixed(2) || 'N/A'}
  • 换手: ${quote.turnover?.toFixed(2) || 'N/A'}%

⚠️ **风险提示**: 本分析仅供参考，不构成投资建议
*数据来源: ${market === 'US' ? 'Alpha Vantage, Finnhub' : '东方财富, 腾讯财经, 新浪财经'}*`;

  // 保存
  const mdPath = path.join(OUTPUT_DIR, `analysis-${ticker.replace(/\./g, '_')}-${timestamp}.md`);
  const waPath = path.join(OUTPUT_DIR, `whatsapp-${Date.now()}.txt`);
  
  fs.writeFileSync(waPath, whatsapp, 'utf-8');
  
  console.log(`\n✅ 报告已保存: ${waPath}`);
  console.log('\n' + '='.repeat(60));
  console.log('📱 WhatsApp 推送预览:');
  console.log('='.repeat(60));
  console.log(whatsapp);
  console.log('='.repeat(60));
  
  return { whatsapp, waPath };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🏢 全球市场投资分析器\n');
    console.log('用法:');
    console.log('  美股: node analyze.js --ticker AAPL');
    console.log('  A股: node analyze.js --ticker 600519.SS');
    console.log('  港股: node analyze.js --ticker 0700.HK');
    console.log('  或:  node analyze.js "贵州茅台" --market CN');
    console.log('       node analyze.js "腾讯" --market HK\n');
    process.exit(0);
  }
  
  const parsed = parseInput(args);
  
  // 如果是公司名，猜测代码
  let ticker = parsed.value;
  if (parsed.type === 'company') {
    const guessed = guessChinaTicker(parsed.value, parsed.market);
    if (guessed) {
      ticker = guessed;
      parsed.market = detectMarket(guessed);
    } else {
      // 尝试美股
      const usTicker = guessTicker(parsed.value);
      if (usTicker) {
        ticker = usTicker;
        parsed.market = 'US';
      }
    }
  }
  
  if (!ticker) {
    console.error(`❌ 无法识别: ${parsed.value}`);
    process.exit(1);
  }
  
  console.log(`📌 使用代码: ${ticker} (${parsed.market})`);
  
  // 分析
  let data;
  if (parsed.market === 'US') {
    data = await analyzeUSStock(ticker);
  } else {
    data = await analyzeChinaStock(ticker, parsed.market);
  }
  
  // 评分
  const scoreData = calculateScore(data);
  
  // 输出
  const output = await generateOutputs(data, scoreData);
  
  console.log('\n📤 RESULT_START');
  console.log(JSON.stringify({
    ticker: data.ticker,
    company: data.company,
    market: data.market,
    score: scoreData.total,
    rating: getRating(scoreData.total).rating,
    action: getRating(scoreData.total).action
  }, null, 2));
  console.log('📤 RESULT_END');
}

main().catch(e => {
  console.error('❌ 错误:', e.message);
  process.exit(1);
});
