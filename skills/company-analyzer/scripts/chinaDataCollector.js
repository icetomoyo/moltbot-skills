/**
 * A股和港股数据源
 * 东方财富、新浪财经、腾讯财经
 */
const axios = require('axios');
const iconv = require('iconv-lite');

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
 * A股数据源: 东方财富
 * ==========================================
 */
class EastMoneyAPI {
  constructor() {
    this.baseUrl = 'https://push2.eastmoney.com/api';
    this.quoteUrl = 'https://push2.eastmoney.com/api/qt/stock/get';
    this.financeUrl = 'https://push2.eastmoney.com/api/qt/stockfinance/get';
    this.name = 'EastMoney';
  }

  /**
   * 获取A股实时行情
   */
  async getAStockQuote(code) {
    await rateLimit('eastmoney', 500);
    
    // 补全代码
    const fullCode = this._normalizeACode(code);
    
    try {
      const res = await axios.get(this.quoteUrl, {
        params: {
          secid: fullCode,
          fields: 'f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f57,f58,f60,f162,f163,f164,f165,f167,f168,f169,f170,f171,f172,f173,f177',
          ut: 'fa5fd1943c7b386f172d6893dbfba10b',
          fltt: 2,
          invt: 2
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const data = res.data?.data;
      if (!data) return null;
      
      return {
        code: data.f57,
        name: data.f58,
        price: data.f43 / 100, // 价格需要除以100
        change: data.f169 / 100,
        changePercent: data.f170 / 100,
        volume: data.f47,
        amount: data.f48,
        marketCap: data.f116 ? data.f116 * 10000 : 0, // 总市值
        peRatio: data.f162 ? data.f162 / 100 : 0,
        pbRatio: data.f167 ? data.f167 / 100 : 0,
        high: data.f44 / 100,
        low: data.f45 / 100,
        open: data.f46 / 100,
        previousClose: data.f60 / 100,
        turnover: data.f168 ? data.f168 / 100 : 0, // 换手率
        source: this.name
      };
    } catch (e) {
      console.error(`❌ ${this.name} A股行情失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 获取A股公司概况
   */
  async getAStockProfile(code) {
    await rateLimit('eastmoney', 500);
    
    const fullCode = this._normalizeACode(code);
    
    try {
      const res = await axios.get('https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/PageConstruct', {
        params: {
          code: code
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      // 东方财富的这个API返回HTML，需要解析
      // 简化处理，使用备用数据源
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 规范A股代码
   */
  _normalizeACode(code) {
    // 去掉后缀
    code = code.replace('.SS', '').replace('.SZ', '').replace('.SH', '');
    
    // 判断市场
    const firstChar = code.charAt(0);
    if (firstChar === '6') {
      return `1.${code}`; // 沪市
    } else if (firstChar === '0' || firstChar === '3') {
      return `0.${code}`; // 深市
    }
    return `1.${code}`; // 默认沪市
  }
}

/**
 * ==========================================
 * 港股数据源: 新浪财经
 * ==========================================
 */
class SinaFinanceAPI {
  constructor() {
    this.name = 'SinaFinance';
  }

  /**
   * 获取港股实时行情
   */
  async getHKStockQuote(code) {
    await rateLimit('sina', 500);
    
    // 规范港股代码
    const hkCode = this._normalizeHKCode(code);
    
    try {
      const url = `https://hq.sinajs.cn/list=rt_hk${hkCode}`;
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://finance.sina.com.cn'
        },
        responseType: 'text'
      });
      
      // 解析返回的JS格式数据
      const data = this._parseSinaResponse(res.data, hkCode);
      return data;
    } catch (e) {
      console.error(`❌ ${this.name} 港股行情失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 获取A股实时行情（备用）
   */
  async getAStockQuote(code) {
    await rateLimit('sina', 500);
    
    const sinaCode = this._normalizeACodeForSina(code);
    
    try {
      const url = `https://hq.sinajs.cn/list=${sinaCode}`;
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': 'https://finance.sina.com.cn'
        },
        responseType: 'text'
      });
      
      return this._parseSinaResponseA(res.data, code);
    } catch (e) {
      console.error(`❌ ${this.name} A股行情失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 解析新浪港股返回
   */
  _parseSinaResponse(text, code) {
    try {
      const match = text.match(/var\s+hq_str_rt_hk\d+="([^"]+)";/);
      if (!match) return null;
      
      const parts = match[1].split(',');
      if (parts.length < 10) return null;
      
      return {
        code: code,
        name: parts[1],
        price: parseFloat(parts[6]),
        change: parseFloat(parts[7]),
        changePercent: parseFloat(parts[8]),
        volume: parseInt(parts[12]),
        amount: parseFloat(parts[11]),
        high: parseFloat(parts[4]),
        low: parseFloat(parts[5]),
        open: parseFloat(parts[2]),
        previousClose: parseFloat(parts[3]),
        marketCap: 0, // 新浪不直接提供
        peRatio: 0,
        pbRatio: 0,
        source: this.name
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * 解析新浪A股返回
   */
  _parseSinaResponseA(text, code) {
    try {
      const match = text.match(/var\s+hq_str_[^=]+="([^"]+)";/);
      if (!match) return null;
      
      const parts = match[1].split(',');
      if (parts.length < 30) return null;
      
      return {
        code: code,
        name: parts[0],
        price: parseFloat(parts[3]),
        change: parseFloat(parts[3]) - parseFloat(parts[2]),
        changePercent: ((parseFloat(parts[3]) - parseFloat(parts[2])) / parseFloat(parts[2])) * 100,
        volume: parseInt(parts[8]),
        amount: parseFloat(parts[9]),
        high: parseFloat(parts[4]),
        low: parseFloat(parts[5]),
        open: parseFloat(parts[1]),
        previousClose: parseFloat(parts[2]),
        marketCap: 0,
        peRatio: 0,
        pbRatio: 0,
        source: this.name
      };
    } catch (e) {
      return null;
    }
  }

  _normalizeHKCode(code) {
    return code.replace('.HK', '');
  }

  _normalizeACodesForSina(code) {
    code = code.replace('.SS', '').replace('.SZ', '').replace('.SH', '');
    const firstChar = code.charAt(0);
    if (firstChar === '6') {
      return `sh${code}`;
    } else {
      return `sz${code}`;
    }
  }
}

/**
 * ==========================================
 * 港股数据源: 腾讯财经
 * ==========================================
 */
class TencentFinanceAPI {
  constructor() {
    this.name = 'TencentFinance';
  }

  /**
   * 获取港股行情
   */
  async getHKStockQuote(code) {
    await rateLimit('tencent', 500);
    
    // 补零到5位
    const hkCode = code.replace('.HK', '').padStart(5, '0');
    
    try {
      const url = `https://qt.gtimg.cn/q=hk${hkCode}`;
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        responseType: 'arraybuffer'
      });
      
      return this._parseTencentResponse(res.data, code);
    } catch (e) {
      console.error(`❌ ${this.name} 港股行情失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 获取A股行情
   */
  async getAStockQuote(code) {
    await rateLimit('tencent', 500);
    
    const tencentCode = this._normalizeACodeForTencent(code);
    
    try {
      const url = `https://qt.gtimg.cn/q=${tencentCode}`;
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        responseType: 'arraybuffer'
      });
      
      return this._parseTencentResponse(res.data, code);
    } catch (e) {
      console.error(`❌ ${this.name} A股行情失败: ${e.message}`);
      return null;
    }
  }

  /**
   * 解析腾讯财经返回
   */
  _parseTencentResponse(buffer, code) {
    try {
      // 将 GBK 转换为 UTF-8
      const text = iconv.decode(Buffer.from(buffer), 'gbk');
      
      const match = text.match(/v_[^=]+="([^"]+)";/);
      if (!match) return null;
      
      const parts = match[1].split('~');
      if (parts.length < 40) return null;
      
      // 腾讯数据格式参考：
      // 0: 市场代码 1: 名称 2: 代码 3: 现价 4: 昨收 5: 开盘
      // 6: 成交量(手) 7-8: 外盘/内盘 9-30: 买卖盘
      // 31: 最高 32: 最低 33-35: 未知 36: 成交额(万)
      // 37: 未知 38: 换手率 39: 市盈率 40-43: 未知
      // 44: 总市值(亿) 45: 流通市值(亿) 46: 市净率
      
      const price = parseFloat(parts[3]);
      const previousClose = parseFloat(parts[4]);
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
      
      // 换手率字段可能需要验证，先用0
      let turnover = parseFloat(parts[38]);
      if (isNaN(turnover) || turnover > 100) turnover = 0;
      
      return {
        code: code,
        name: parts[1],
        price: price,
        change: change,
        changePercent: changePercent,
        volume: parseInt(parts[6]) * 100, // 手转股(1手=100股)
        amount: parseFloat(parts[36]) * 10000, // 万元转元
        marketCap: parseFloat(parts[44]) * 100000000, // 亿转元
        peRatio: parseFloat(parts[39]) || 0,
        pbRatio: parseFloat(parts[46]) || 0,
        high: parseFloat(parts[31]),
        low: parseFloat(parts[32]),
        open: parseFloat(parts[5]),
        previousClose: previousClose,
        turnover: turnover,
        source: this.name
      };
    } catch (e) {
      return null;
    }
  }

  _normalizeACodeForTencent(code) {
    code = code.replace('.SS', '').replace('.SZ', '').replace('.SH', '');
    const firstChar = code.charAt(0);
    if (firstChar === '6') {
      return `sh${code}`;
    } else {
      return `sz${code}`;
    }
  }
}

// 实例化
const eastMoney = new EastMoneyAPI();
const sinaFinance = new SinaFinanceAPI();
const tencentFinance = new TencentFinanceAPI();

/**
 * ==========================================
 * 统一接口 - A股
 * ==========================================
 */

/**
 * 判断市场类型
 */
function detectMarket(code) {
  if (code.endsWith('.HK')) return 'HK';
  if (code.endsWith('.SS') || code.endsWith('.SH')) return 'A_SH';
  if (code.endsWith('.SZ')) return 'A_SZ';
  
  // 根据代码规则判断
  const pureCode = code.replace(/\D/g, '');
  if (pureCode.length === 5) return 'HK';
  if (pureCode.length === 6) {
    const firstChar = pureCode.charAt(0);
    if (firstChar === '6') return 'A_SH';
    if (firstChar === '0' || firstChar === '3') return 'A_SZ';
  }
  
  return 'US';
}

/**
 * 获取A股行情（多源备份）
 */
async function getAStockQuote(code) {
  console.log(`📈 获取A股行情: ${code}`);
  
  // 主源: 腾讯财经（数据格式更标准）
  let data = await tencentFinance.getAStockQuote(code);
  
  // 备用1: 东方财富
  if (!data) {
    console.log('   → 尝试东方财富...');
    data = await eastMoney.getAStockQuote(code);
  }
  
  // 备用2: 新浪财经
  if (!data) {
    console.log('   → 尝试新浪财经...');
    data = await sinaFinance.getAStockQuote(code);
  }
  
  return data;
}

/**
 * 获取港股行情（多源备份）
 */
async function getHKStockQuote(code) {
  console.log(`📈 获取港股行情: ${code}`);
  
  // 主源: 腾讯财经
  let data = await tencentFinance.getHKStockQuote(code);
  
  // 备用: 新浪财经
  if (!data) {
    console.log('   → 尝试新浪财经...');
    data = await sinaFinance.getHKStockQuote(code);
  }
  
  return data;
}

/**
 * A股公司名称映射
 */
function getAStockName(code) {
  const known = {
    '600519': '贵州茅台',
    '000858': '五粮液',
    '000333': '美的集团',
    '000651': '格力电器',
    '000725': '京东方A',
    '002594': '比亚迪',
    '002415': '海康威视',
    '300750': '宁德时代',
    '300059': '东方财富',
    '601318': '中国平安',
    '601398': '工商银行',
    '601288': '农业银行',
    '601857': '中国石油',
    '601988': '中国银行',
    '600036': '招商银行',
    '600276': '恒瑞医药',
    '600900': '长江电力',
    '601012': '隆基绿能',
    '603288': '海天味业',
    '601888': '中国中免'
  };
  
  const pureCode = code.replace(/\D/g, '');
  return known[pureCode] || code;
}

/**
 * 港股公司名称映射
 */
function getHKStockName(code) {
  const known = {
    '0700': '腾讯控股',
    '3690': '美团-W',
    '1810': '小米集团-W',
    '9988': '阿里巴巴-SW',
    '2318': '中国平安',
    '0005': '汇丰控股',
    '1299': '友邦保险',
    '0388': '香港交易所',
    '0001': '长和',
    '0016': '新鸿基地产',
    '0027': '银河娱乐',
    '0883': '中国海洋石油',
    '0939': '建设银行',
    '1398': '工商银行',
    '3988': '中国银行',
    '1211': '比亚迪股份',
    '9999': '网易-S',
    '9618': '京东集团-SW',
    '1024': '快手-W',
    '2382': '舜宇光学科技'
  };
  
  const pureCode = code.replace(/\D/g, '');
  return known[pureCode] || code;
}

/**
 * 统一获取行情
 */
async function getChinaStockQuote(code) {
  const market = detectMarket(code);
  
  if (market === 'HK') {
    const data = await getHKStockQuote(code);
    if (data && !data.name) {
      data.name = getHKStockName(code);
    }
    return data;
  } else if (market === 'A_SH' || market === 'A_SZ') {
    const data = await getAStockQuote(code);
    if (data && !data.name) {
      data.name = getAStockName(code);
    }
    return data;
  }
  
  return null;
}

module.exports = {
  detectMarket,
  getAStockQuote,
  getHKStockQuote,
  getChinaStockQuote,
  getAStockName,
  getHKStockName,
  eastMoney,
  sinaFinance,
  tencentFinance
};
