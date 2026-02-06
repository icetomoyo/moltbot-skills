/**
 * 深度财务数据分析
 * SEC EDGAR, 巨潮资讯, 行业对比
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 缓存目录
const CACHE_DIR = path.join(__dirname, '../cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

/**
 * ==========================================
 * SEC EDGAR API (美股财报)
 * https://www.sec.gov/edgar/sec-api-documentation
 * ==========================================
 */
class SECEDGARAPI {
  constructor() {
    this.baseUrl = 'https://data.sec.gov';
    this.submissionsUrl = 'https://data.sec.gov/submissions';
    this.companyFactsUrl = 'https://data.sec.gov/api/xbrl/companyfacts';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    };
  }

  /**
   * 获取公司CIK (SEC Central Index Key)
   */
  async getCIK(ticker) {
    const cacheFile = path.join(CACHE_DIR, `cik_${ticker}.json`);
    
    // 检查缓存
    if (fs.existsSync(cacheFile)) {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      if (Date.now() - cache.timestamp < 30 * 24 * 60 * 60 * 1000) {
        return cache.cik;
      }
    }
    
    try {
      const res = await axios.get('https://www.sec.gov/files/company_tickers.json', {
        headers: this.headers,
        timeout: 30000
      });
      
      const companies = Object.values(res.data);
      const company = companies.find(c => c.ticker === ticker.toUpperCase());
      
      if (company) {
        const cik = company.cik_str.toString().padStart(10, '0');
        fs.writeFileSync(cacheFile, JSON.stringify({ cik, ticker, timestamp: Date.now() }));
        return cik;
      }
      return null;
    } catch (e) {
      console.error(`❌ SEC CIK获取失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 获取公司提交文件列表
   */
  async getSubmissions(ticker) {
    const cik = await this.getCIK(ticker);
    if (!cik) return null;
    
    try {
      const res = await axios.get(`${this.submissionsUrl}/CIK${cik}.json`, {
        headers: this.headers,
        timeout: 30000
      });
      
      return res.data;
    } catch (e) {
      console.error(`❌ SEC Submissions获取失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 获取最新10-K年报
   */
  async getLatest10K(ticker) {
    const submissions = await this.getSubmissions(ticker);
    if (!submissions) return null;
    
    const filings = submissions.filings?.recent;
    if (!filings) return null;
    
    // 找到最新的10-K
    for (let i = 0; i < filings.form?.length; i++) {
      if (filings.form[i] === '10-K') {
        return {
          form: '10-K',
          filingDate: filings.filingDate[i],
          reportDate: filings.reportDate[i],
          accessionNumber: filings.accessionNumber[i],
          primaryDocument: filings.primaryDocument[i]
        };
      }
    }
    return null;
  }

  /**
   * 获取公司财务指标 (XBRL)
   */
  async getCompanyFacts(ticker) {
    const cik = await this.getCIK(ticker);
    if (!cik) return null;
    
    try {
      const res = await axios.get(`${this.companyFactsUrl}/CIK${cik}.json`, {
        headers: this.headers,
        timeout: 30000
      });
      
      return this._parseFacts(res.data);
    } catch (e) {
      console.error(`❌ SEC Facts获取失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 解析XBRL财务数据
   */
  _parseFacts(data) {
    if (!data?.facts) return null;
    
    const usGaap = data.facts['us-gaap'] || {};
    const results = {
      revenue: this._extractMetric(usGaap, ['Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerExcludingAssessedTax']),
      netIncome: this._extractMetric(usGaap, ['NetIncomeLoss', 'ProfitLoss']),
      totalAssets: this._extractMetric(usGaap, ['Assets']),
      totalLiabilities: this._extractMetric(usGaap, ['Liabilities']),
      equity: this._extractMetric(usGaap, ['StockholdersEquity', 'ShareholdersEquity']),
      operatingCashFlow: this._extractMetric(usGaap, ['NetCashProvidedByUsedInOperatingActivities']),
      freeCashFlow: this._extractMetric(usGaap, ['FreeCashFlow'])
    };
    
    return results;
  }

  _extractMetric(usGaap, possibleNames) {
    for (const name of possibleNames) {
      if (usGaap[name]) {
        const units = usGaap[name].units;
        const unit = units['USD'] || units['shares'] || Object.values(units)[0];
        if (unit && unit.length > 0) {
          // 返回最近的数据
          const sorted = unit.sort((a, b) => new Date(b.end) - new Date(a.end));
          return {
            value: sorted[0].val,
            period: sorted[0].fp, // FY/Q1/Q2/Q3/Q4
            year: sorted[0].fy,
            endDate: sorted[0].end
          };
        }
      }
    }
    return null;
  }
}

/**
 * ==========================================
 * 巨潮资讯 (A股财报)
 * ==========================================
 */
class CNInfoAPI {
  constructor() {
    this.baseUrl = 'http://www.cninfo.com.cn/new/information';
  }

  /**
   * 获取A股公司公告列表
   */
  async getAnnouncements(stockCode) {
    const url = 'http://www.cninfo.com.cn/new/hisAnnouncement/query';
    
    try {
      const res = await axios.post(url, {
        stock: stockCode,
        tabName: 'fulltext',
        pageSize: 30,
        pageNum: 1,
        column: stockCode.startsWith('6') ? 'sse' : 'szse',
        category: 'category_ndbg_szsh', // 年报
        seDate: `${new Date().getFullYear() - 5}-01-01~${new Date().getFullYear()}-12-31`
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 30000
      });
      
      return res.data?.announcements || [];
    } catch (e) {
      console.error(`❌ 巨潮资讯获取失败: ${e.message}`);
      return [];
    }
  }

  /**
   * 获取最新年报
   */
  async getLatestAnnualReport(stockCode) {
    const announcements = await this.getAnnouncements(stockCode);
    
    // 找到最新的年报
    for (const item of announcements) {
      if (item.announcementTitle?.includes('年度报告')) {
        return {
          title: item.announcementTitle,
          url: `http://static.cninfo.com.cn/${item.adjunctUrl}`,
          publishDate: item.announcementTime
        };
      }
    }
    return null;
  }
}

/**
 * ==========================================
 * 行业对比数据
 * ==========================================
 */
class IndustryComparisonAPI {
  constructor() {
    // 行业分类数据
    this.sectors = {
      // 美股行业 ETF 作为基准
      'Technology': 'XLK',
      'Financials': 'XLF',
      'Healthcare': 'XLV',
      'Consumer Discretionary': 'XLY',
      'Industrials': 'XLI',
      'Energy': 'XLE',
      'Consumer Staples': 'XLP',
      'Utilities': 'XLU',
      'Real Estate': 'XLRE',
      'Materials': 'XLB',
      'Communication Services': 'XLC'
    };
  }

  /**
   * 获取行业平均比率
   */
  async getIndustryAverages(sector) {
    // 基于历史数据的行业基准
    const benchmarks = {
      'Technology': { pe: 28, pb: 6, roe: 0.18, profitMargin: 0.22 },
      'Financials': { pe: 14, pb: 1.2, roe: 0.12, profitMargin: 0.28 },
      'Healthcare': { pe: 22, pb: 4, roe: 0.15, profitMargin: 0.12 },
      'Consumer Discretionary': { pe: 25, pb: 5, roe: 0.20, profitMargin: 0.08 },
      'Industrials': { pe: 20, pb: 3, roe: 0.16, profitMargin: 0.10 },
      'Energy': { pe: 12, pb: 1.5, roe: 0.14, profitMargin: 0.10 },
      'Consumer Staples': { pe: 20, pb: 4, roe: 0.18, profitMargin: 0.08 },
      'Utilities': { pe: 18, pb: 1.8, roe: 0.10, profitMargin: 0.12 }
    };
    
    return benchmarks[sector] || benchmarks['Technology'];
  }

  /**
   * 计算行业排名
   */
  calculateIndustryRank(value, metric, industryAvg) {
    const diff = ((value - industryAvg[metric]) / industryAvg[metric]) * 100;
    
    if (diff > 30) return { rank: '前10%', percentile: 90, grade: 'A' };
    if (diff > 10) return { rank: '前25%', percentile: 75, grade: 'B' };
    if (diff > -10) return { rank: '平均', percentile: 50, grade: 'C' };
    if (diff > -30) return { rank: '后25%', percentile: 25, grade: 'D' };
    return { rank: '后10%', percentile: 10, grade: 'F' };
  }
}

/**
 * ==========================================
 * 杜邦分析
 * ==========================================
 */
function dupontAnalysis(netIncome, revenue, totalAssets, equity) {
  if (!netIncome || !revenue || !totalAssets || !equity) return null;
  
  const profitMargin = netIncome / revenue;
  const assetTurnover = revenue / totalAssets;
  const equityMultiplier = totalAssets / equity;
  const roe = profitMargin * assetTurnover * equityMultiplier;
  
  return {
    roe,
    profitMargin,
    assetTurnover,
    equityMultiplier,
    breakdown: {
      profitability: `净利润率 ${(profitMargin * 100).toFixed(2)}%`,
      efficiency: `资产周转率 ${assetTurnover.toFixed(2)}`,
      leverage: `权益乘数 ${equityMultiplier.toFixed(2)}`
    }
  };
}

/**
 * ==========================================
 * 财务健康度评分
 * ==========================================
 */
function calculateFinancialHealth(facts, industryAverages) {
  const scores = {
    profitability: 0,
    solvency: 0,
    efficiency: 0,
    growth: 0
  };
  
  const details = [];
  
  // 盈利能力
  if (facts.netIncome?.value > 0) {
    scores.profitability += 25;
    details.push({ metric: '净利润为正', score: 25 });
  }
  
  // 偿债能力
  const debtRatio = facts.totalLiabilities?.value / facts.totalAssets?.value;
  if (debtRatio < 0.5) {
    scores.solvency += 25;
    details.push({ metric: '资产负债率<50%', score: 25 });
  } else if (debtRatio < 0.7) {
    scores.solvency += 15;
    details.push({ metric: '资产负债率适中', score: 15 });
  }
  
  // 现金流
  if (facts.operatingCashFlow?.value > 0) {
    scores.efficiency += 25;
    details.push({ metric: '经营现金流为正', score: 25 });
  }
  
  // 成长能力 (简化，实际需要多年数据)
  scores.growth = 25;
  details.push({ metric: '成长潜力', score: 25 });
  
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  
  return {
    total,
    scores,
    details,
    grade: total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D'
  };
}

// 导出
module.exports = {
  SECEDGARAPI,
  CNInfoAPI,
  IndustryComparisonAPI,
  dupontAnalysis,
  calculateFinancialHealth
};
