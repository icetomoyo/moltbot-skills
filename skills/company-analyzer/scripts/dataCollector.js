/**
 * 多数据源搜集器
 * 支持: Alpha Vantage, Finnhub, Yahoo Finance, NewsAPI
 */
const axios = require('axios');

// API Keys（从环境变量或配置读取）
const CONFIG = {
  alphaVantage: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
  finnhub: process.env.FINNHUB_API_KEY || '',
  newsApi: process.env.NEWS_API_KEY || '',
  iexCloud: process.env.IEX_CLOUD_TOKEN || ''
};

// 请求控制
const rateLimiters = {};

async function rateLimit(provider, minInterval = 1000) {
  if (!rateLimiters[provider]) rateLimiters[provider] = 0;
  const now = Date.now();
  const elapsed = now - rateLimiters[provider];
  if (elapsed < minInterval) {
    await new Promise(r => setTimeout(r, minInterval - elapsed));
  }
  rateLimiters[provider] = Date.now();
}

/**
 * ==========================================
 * 数据源 1: Alpha Vantage（财务数据）
 * ==========================================
 */
class AlphaVantageAPI {
  constructor() {
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.name = 'AlphaVantage';
  }

  async getCompanyOverview(ticker) {
    await rateLimit('alphaVantage', 13000); // 免费版限速
    try {
      const res = await axios.get(this.baseUrl, {
        params: { function: 'OVERVIEW', symbol: ticker, apikey: CONFIG.alphaVantage },
        timeout: 15000
      });
      const d = res.data;
      if (!d || !d.Symbol) return null;
      return {
        name: d.Name,
        ticker: d.Symbol,
        description: d.Description,
        exchange: d.Exchange,
        sector: d.Sector,
        industry: d.Industry,
        marketCap: parseInt(d.MarketCapitalization) || 0,
        peRatio: parseFloat(d.PERatio) || 0,
        pbRatio: parseFloat(d.PriceToBookRatio) || 0,
        psRatio: parseFloat(d.PriceToSalesRatioTTM) || 0,
        eps: parseFloat(d.EPS) || 0,
        weekHigh52: parseFloat(d['52WeekHigh']) || 0,
        weekLow52: parseFloat(d['52WeekLow']) || 0,
        ma50: parseFloat(d['50DayMovingAverage']) || 0,
        ma200: parseFloat(d['200DayMovingAverage']) || 0,
        roe: parseFloat(d.ReturnOnEquityTTM) || 0,
        roa: parseFloat(d.ReturnOnAssetsTTM) || 0,
        profitMargin: parseFloat(d.ProfitMargin) || 0,
        revenueTTM: parseInt(d.RevenueTTM) || 0,
        employees: parseInt(d.FullTimeEmployees) || 0,
        country: d.Country,
        website: d.OfficialSite,
        beta: parseFloat(d.Beta) || 0,
        dividendYield: parseFloat(d.DividendYield) || 0,
        source: this.name
      };
    } catch (e) {
      console.error(`❌ ${this.name} 公司概况失败: ${e.message}`);
      return null;
    }
  }

  async getStockQuote(ticker) {
    await rateLimit('alphaVantage', 13000);
    try {
      const res = await axios.get(this.baseUrl, {
        params: { function: 'GLOBAL_QUOTE', symbol: ticker, apikey: CONFIG.alphaVantage },
        timeout: 15000
      });
      const q = res.data['Global Quote'];
      if (!q) return null;
      return {
        price: parseFloat(q['05. price']),
        change: parseFloat(q['09. change']),
        changePercent: parseFloat(q['10. change percent'].replace('%', '')) / 100,
        volume: parseInt(q['06. volume']),
        latestTradingDay: q['07. latest trading day'],
        source: this.name
      };
    } catch (e) {
      console.error(`❌ ${this.name} 股价失败: ${e.message}`);
      return null;
    }
  }

  async getIncomeStatement(ticker) {
    await rateLimit('alphaVantage', 13000);
    try {
      const res = await axios.get(this.baseUrl, {
        params: { function: 'INCOME_STATEMENT', symbol: ticker, apikey: CONFIG.alphaVantage },
        timeout: 15000
      });
      return res.data.annualReports || [];
    } catch (e) {
      return [];
    }
  }
}

/**
 * ==========================================
 * 数据源 2: Finnhub（实时股价，免费60次/分钟）
 * https://finnhub.io/
 * ==========================================
 */
class FinnhubAPI {
  constructor() {
    this.baseUrl = 'https://finnhub.io/api/v1';
    this.name = 'Finnhub';
  }

  async getStockQuote(ticker) {
    if (!CONFIG.finnhub) return null;
    await rateLimit('finnhub', 1000); // 60次/分钟
    try {
      const res = await axios.get(`${this.baseUrl}/quote`, {
        params: { symbol: ticker, token: CONFIG.finnhub },
        timeout: 10000
      });
      const d = res.data;
      if (!d || !d.c) return null;
      return {
        price: d.c,
        change: d.c - d.pc,
        changePercent: (d.c - d.pc) / d.pc,
        volume: d.v,
        high: d.h,
        low: d.l,
        open: d.o,
        previousClose: d.pc,
        source: this.name
      };
    } catch (e) {
      console.error(`❌ ${this.name} 股价失败: ${e.message}`);
      return null;
    }
  }

  async getCompanyProfile(ticker) {
    if (!CONFIG.finnhub) return null;
    await rateLimit('finnhub', 1000);
    try {
      const res = await axios.get(`${this.baseUrl}/stock/profile2`, {
        params: { symbol: ticker, token: CONFIG.finnhub },
        timeout: 10000
      });
      const d = res.data;
      if (!d || !d.name) return null;
      return {
        name: d.name,
        ticker: d.ticker,
        description: d.description,
        exchange: d.exchange,
        sector: d.finnhubIndustry,
        industry: d.industry,
        marketCap: d.marketCapitalization * 1e6, // Finnhub 用百万
        employees: d.employeeTotal || 0,
        website: d.weburl,
        country: d.country,
        source: this.name
      };
    } catch (e) {
      console.error(`❌ ${this.name} 公司概况失败: ${e.message}`);
      return null;
    }
  }

  async getNews(ticker, from, to) {
    if (!CONFIG.finnhub) return [];
    await rateLimit('finnhub', 1000);
    try {
      const res = await axios.get(`${this.baseUrl}/company-news`, {
        params: { symbol: ticker, from, to, token: CONFIG.finnhub },
        timeout: 10000
      });
      return res.data || [];
    } catch (e) {
      return [];
    }
  }
}

/**
 * ==========================================
 * 数据源 3: Yahoo Finance（备用，无 API Key）
 * ==========================================
 */
class YahooFinanceAPI {
  constructor() {
    this.chartUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.quoteUrl = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';
    this.name = 'YahooFinance';
  }

  async getChart(ticker) {
    await rateLimit('yahoo', 2000);
    try {
      const res = await axios.get(`${this.chartUrl}/${ticker}?range=1y&interval=1d`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      return res.data;
    } catch (e) {
      console.error(`❌ ${this.name} 图表失败: ${e.message}`);
      return null;
    }
  }

  async getQuoteSummary(ticker) {
    await rateLimit('yahoo', 2000);
    try {
      const res = await axios.get(`${this.quoteUrl}/${ticker}?modules=summaryProfile,price,summaryDetail`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      return res.data;
    } catch (e) {
      return null;
    }
  }
}

/**
 * ==========================================
 * 数据源 4: NewsAPI（新闻舆情）
 * https://newsapi.org/
 * ==========================================
 */
class NewsAPI {
  constructor() {
    this.baseUrl = 'https://newsapi.org/v2';
    this.name = 'NewsAPI';
  }

  async getCompanyNews(company, from = null, to = null) {
    if (!CONFIG.newsApi) return null;
    await rateLimit('newsapi', 1000);
    
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      const res = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          q: company,
          from: from || weekAgo,
          to: to || today,
          sortBy: 'publishedAt',
          language: 'en',
          apiKey: CONFIG.newsApi
        },
        timeout: 15000
      });
      
      const articles = res.data.articles || [];
      const sentiment = this.analyzeSentiment(articles);
      
      return {
        articles: articles.slice(0, 5).map(a => ({
          title: a.title,
          source: a.source.name,
          date: a.publishedAt,
          url: a.url
        })),
        sentiment,
        total: articles.length,
        source: this.name
      };
    } catch (e) {
      console.error(`❌ ${this.name} 新闻失败: ${e.message}`);
      return null;
    }
  }

  analyzeSentiment(articles) {
    // 简单情感分析（基于关键词）
    const positive = ['growth', 'profit', 'surge', 'rise', 'gain', 'strong', 'beat', 'record'];
    const negative = ['loss', 'drop', 'fall', 'decline', 'miss', 'weak', 'crisis', 'lawsuit'];
    
    let pos = 0, neg = 0, neu = 0;
    
    articles.forEach(article => {
      const text = (article.title + ' ' + article.description).toLowerCase();
      const hasPos = positive.some(w => text.includes(w));
      const hasNeg = negative.some(w => text.includes(w));
      
      if (hasPos && !hasNeg) pos++;
      else if (hasNeg && !hasPos) neg++;
      else neu++;
    });
    
    const total = articles.length || 1;
    return {
      positive: Math.round((pos / total) * 100),
      neutral: Math.round((neu / total) * 100),
      negative: Math.round((neg / total) * 100)
    };
  }
}

// 实例化
const alphaVantage = new AlphaVantageAPI();
const finnhub = new FinnhubAPI();
const yahooFinance = new YahooFinanceAPI();
const newsAPI = new NewsAPI();

/**
 * ==========================================
 * 统一数据获取接口（带自动备份）
 * ==========================================
 */

/**
 * 获取公司概况（多源备份）
 */
async function getCompanyOverview(ticker) {
  console.log(`🔍 获取公司概况: ${ticker}`);
  
  // 主源: Alpha Vantage
  let data = await alphaVantage.getCompanyOverview(ticker);
  
  // 备用: Finnhub
  if (!data && CONFIG.finnhub) {
    console.log('   → 尝试 Finnhub...');
    data = await finnhub.getCompanyProfile(ticker);
  }
  
  return data;
}

/**
 * 获取股价（多源备份）
 */
async function getStockQuote(ticker) {
  console.log(`📈 获取股价: ${ticker}`);
  
  // 主源: Alpha Vantage
  let data = await alphaVantage.getStockQuote(ticker);
  
  // 备用1: Finnhub（实时性更好）
  if (!data && CONFIG.finnhub) {
    console.log('   → 尝试 Finnhub...');
    data = await finnhub.getStockQuote(ticker);
  }
  
  return data;
}

/**
 * 获取财务数据
 */
async function getFinancialData(ticker) {
  console.log(`💰 获取财务数据: ${ticker}`);
  
  const [overview, income] = await Promise.all([
    alphaVantage.getCompanyOverview(ticker),
    alphaVantage.getIncomeStatement(ticker)
  ]);
  
  if (!overview) return null;
  
  const currentIncome = income[0] || {};
  const revenue = parseInt(currentIncome.totalRevenue) || 0;
  const netIncome = parseInt(currentIncome.netIncome) || 0;
  const profitMargin = revenue > 0 ? netIncome / revenue : 0;
  
  return {
    revenue: { current: revenue, previous: 0, growth: 0 },
    profit: { netIncome, margin: profitMargin },
    ratios: {
      pe: overview.peRatio,
      pb: overview.pbRatio,
      ps: overview.psRatio,
      roe: overview.roe,
      roa: overview.roa,
      profitMargin: overview.profitMargin
    },
    source: 'AlphaVantage'
  };
}

/**
 * 获取新闻舆情（多源）
 */
async function getNewsSentiment(company, ticker) {
  console.log(`📰 获取新闻舆情: ${company}`);
  
  // 主源: NewsAPI
  if (CONFIG.newsApi) {
    const news = await newsAPI.getCompanyNews(company);
    if (news) return news;
  }
  
  // 备用: Finnhub
  if (CONFIG.finnhub && ticker) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const news = await finnhub.getNews(ticker, weekAgo, today);
    if (news && news.length > 0) {
      return {
        articles: news.slice(0, 5).map(n => ({
          title: n.headline,
          source: n.source,
          date: n.datetime,
          url: n.url
        })),
        sentiment: { positive: 50, neutral: 30, negative: 20 },
        total: news.length,
        source: 'Finnhub'
      };
    }
  }
  
  return {
    articles: [],
    sentiment: { positive: 50, neutral: 30, negative: 20 },
    total: 0,
    source: 'Default'
  };
}

/**
 * 股票代码映射
 */
function guessTicker(company) {
  const known = {
    '苹果': 'AAPL', 'Apple': 'AAPL', 'AAPL': 'AAPL',
    '特斯拉': 'TSLA', 'Tesla': 'TSLA', 'TSLA': 'TSLA',
    '微软': 'MSFT', 'Microsoft': 'MSFT', 'MSFT': 'MSFT',
    '谷歌': 'GOOGL', 'Google': 'GOOGL', 'GOOGL': 'GOOGL',
    '亚马逊': 'AMZN', 'Amazon': 'AMZN', 'AMZN': 'AMZN',
    '英伟达': 'NVDA', 'NVIDIA': 'NVDA', 'NVDA': 'NVDA',
    'Meta': 'META', 'Facebook': 'META', 'META': 'META',
    '伯克希尔': 'BRK-B', 'Berkshire': 'BRK-B', 'BRK-B': 'BRK-B',
    '台积电': 'TSM', 'TSMC': 'TSM', 'TSM': 'TSM',
    'IBM': 'IBM', 'ibm': 'IBM',
    '阿里巴巴': 'BABA', '阿里': 'BABA', 'BABA': 'BABA',
    '腾讯': 'TCEHY', 'Tencent': 'TCEHY',
    '拼多多': 'PDD', 'PDD': 'PDD',
    '京东': 'JD', 'JD': 'JD',
    '奈飞': 'NFLX', 'Netflix': 'NFLX', 'NFLX': 'NFLX',
    '迪士尼': 'DIS', 'Disney': 'DIS', 'DIS': 'DIS',
    '可口可乐': 'KO', 'Coca-Cola': 'KO', 'KO': 'KO',
    '宝洁': 'PG', 'P&G': 'PG', 'PG': 'PG',
    '强生': 'JNJ', 'Johnson': 'JNJ', 'JNJ': 'JNJ',
    '沃尔玛': 'WMT', 'Walmart': 'WMT', 'WMT': 'WMT',
    'Visa': 'V', 'V': 'V',
    '万事达': 'MA', 'Mastercard': 'MA', 'MA': 'MA',
    '摩根大通': 'JPM', 'JPMorgan': 'JPM', 'JPM': 'JPM',
    '美国银行': 'BAC', 'Bank of America': 'BAC', 'BAC': 'BAC',
    '高盛': 'GS', 'Goldman': 'GS', 'GS': 'GS'
  };
  
  for (const [key, ticker] of Object.entries(known)) {
    if (company.toUpperCase().includes(key.toUpperCase())) return ticker;
  }
  
  if (/^[A-Z]{1,5}$/.test(company)) return company;
  
  return null;
}

module.exports = {
  getCompanyOverview,
  getStockQuote,
  getFinancialData,
  getNewsSentiment,
  guessTicker,
  // 导出单独 API 供高级使用
  alphaVantage,
  finnhub,
  yahooFinance,
  newsAPI
};
