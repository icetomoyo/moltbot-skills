/**
 * 公司分析器配置
 */
module.exports = {
  // Alpha Vantage API (美股数据)
  // 免费申请: https://www.alphavantage.co/support/#api-key
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
    baseUrl: 'https://www.alphavantage.co/query'
  },
  
  // Yahoo Finance (备用数据源)
  yahooFinance: {
    enabled: true,
    baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart'
  },
  
  // 新闻 API
  news: {
    // NewsAPI: https://newsapi.org/
    newsApi: {
      enabled: false,
      apiKey: process.env.NEWS_API_KEY || ''
    }
  },
  
  // 中国公司数据源
  china: {
    // 东方财富
    eastmoney: {
      enabled: true,
      baseUrl: 'https://push2.eastmoney.com/api'
    }
  },
  
  // 分析参数
  analysis: {
    // 财务评分权重
    weights: {
      profitability: 0.20,  // 盈利能力
      growth: 0.20,         // 成长能力
      leverage: 0.20,       // 财务杠杆
      efficiency: 0.20,     // 运营效率
      cashflow: 0.20        // 现金流
    },
    
    // 评分阈值
    thresholds: {
      strongBuy: 80,
      buy: 60,
      hold: 40,
      reduce: 20,
      sell: 0
    }
  },
  
  // 输出设置
  output: {
    saveMarkdown: true,
    saveJson: true,
    saveWhatsApp: true
  }
};
