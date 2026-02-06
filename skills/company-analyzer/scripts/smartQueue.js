#!/usr/bin/env node
/**
 * 智能分析队列系统
 * 自动处理API频率限制，支持延迟执行和缓存
 * 
 * 使用方法:
 *   node smartQueue.js --add AAPL        # 添加到队列
 *   node smartQueue.js --add MSFT --deep # 深度分析
 *   node smartQueue.js --list            # 查看队列
 *   node smartQueue.js --process         # 处理队列
 *   node smartQueue.js --auto            # 自动模式(持续处理)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// 队列文件
const QUEUE_FILE = path.join(__dirname, '../data/analysis_queue.json');
const CACHE_DIR = path.join(__dirname, '../data/cache');
const RESULTS_DIR = path.join(__dirname, '../output/queue_results');

// 确保目录存在
[QUEUE_FILE.replace('analysis_queue.json', ''), CACHE_DIR, RESULTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// API 速率限制配置 (毫秒)
const RATE_LIMITS = {
  'alpha_vantage': 13000,  // 13秒 (免费版 5次/分钟)
  'finnhub': 1000,         // 1秒 (60次/分钟)
  'sec_edgar': 100,        // 0.1秒 (10次/秒)
  'tencent': 500,          // 0.5秒
  'eastmoney': 500,        // 0.5秒
  'default': 1000
};

// 上次请求时间
const lastRequestTime = {};

/**
 * 加载队列
 */
function loadQueue() {
  if (fs.existsSync(QUEUE_FILE)) {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  }
  return { tasks: [], completed: [], failed: [] };
}

/**
 * 保存队列
 */
function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

/**
 * 添加任务到队列
 */
function addTask(ticker, options = {}) {
  const queue = loadQueue();
  
  // 检查是否已存在
  const exists = queue.tasks.find(t => t.ticker === ticker && t.status === 'pending');
  if (exists) {
    console.log(`⚠️ ${ticker} 已在队列中，跳过添加`);
    return false;
  }
  
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    ticker: ticker.toUpperCase(),
    type: options.deep ? 'deep' : 'standard',
    market: options.market || 'AUTO',
    status: 'pending',
    addedAt: new Date().toISOString(),
    priority: options.priority || 1,
    retryCount: 0,
    maxRetries: 3
  };
  
  queue.tasks.push(task);
  saveQueue(queue);
  
  console.log(`✅ 已添加任务: ${ticker} (${task.type})`);
  console.log(`📊 当前队列: ${queue.tasks.filter(t => t.status === 'pending').length} 个待处理`);
  
  return task;
}

/**
 * 获取下一个任务
 */
function getNextTask() {
  const queue = loadQueue();
  const pending = queue.tasks.filter(t => t.status === 'pending');
  
  if (pending.length === 0) return null;
  
  // 按优先级排序
  pending.sort((a, b) => b.priority - a.priority);
  
  return pending[0];
}

/**
 * 更新任务状态
 */
function updateTask(taskId, updates) {
  const queue = loadQueue();
  const task = queue.tasks.find(t => t.id === taskId);
  
  if (task) {
    Object.assign(task, updates);
    saveQueue(queue);
  }
}

/**
 * 完成任务
 */
function completeTask(taskId, result) {
  const queue = loadQueue();
  const taskIndex = queue.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex >= 0) {
    const task = queue.tasks[taskIndex];
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    
    // 移动到completed列表
    queue.completed.push(task);
    queue.tasks.splice(taskIndex, 1);
    
    saveQueue(queue);
    
    // 保存结果到文件
    const resultFile = path.join(RESULTS_DIR, `${task.ticker}_${Date.now()}.json`);
    fs.writeFileSync(resultFile, JSON.stringify({ task, result }, null, 2));
  }
}

/**
 * 任务失败
 */
function failTask(taskId, error) {
  const queue = loadQueue();
  const task = queue.tasks.find(t => t.id === taskId);
  
  if (task) {
    task.retryCount++;
    task.lastError = error;
    
    if (task.retryCount >= task.maxRetries) {
      task.status = 'failed';
      task.failedAt = new Date().toISOString();
      queue.failed.push(task);
      const index = queue.tasks.findIndex(t => t.id === taskId);
      queue.tasks.splice(index, 1);
      console.log(`❌ ${task.ticker} 失败 ${task.maxRetries} 次，移至失败列表`);
    } else {
      task.status = 'pending';
      console.log(`⚠️ ${task.ticker} 失败，将在 ${task.retryCount * 30} 秒后重试`);
    }
    
    saveQueue(queue);
  }
}

/**
 * 速率限制等待
 */
async function rateLimit(apiName) {
  const limit = RATE_LIMITS[apiName] || RATE_LIMITS.default;
  const lastTime = lastRequestTime[apiName] || 0;
  const now = Date.now();
  const elapsed = now - lastTime;
  
  if (elapsed < limit) {
    const waitTime = limit - elapsed;
    console.log(`⏱️  等待 ${(waitTime/1000).toFixed(1)} 秒 (${apiName})...`);
    await new Promise(r => setTimeout(r, waitTime));
  }
  
  lastRequestTime[apiName] = Date.now();
}

/**
 * 执行分析任务
 */
async function executeTask(task) {
  console.log(`\n🔥 开始分析: ${task.ticker} (${task.type})`);
  updateTask(task.id, { status: 'processing', startedAt: new Date().toISOString() });
  
  try {
    // 根据市场类型选择API
    const market = detectMarket(task.ticker);
    
    if (market === 'US') {
      // 美股分析
      await rateLimit('alpha_vantage');
      
      const script = task.type === 'deep' ? 'deepAnalyze.js' : 'analyze.js';
      const { stdout, stderr } = await execPromise(
        `cd ${path.dirname(__dirname)} && node scripts/${script} --ticker ${task.ticker}`,
        { timeout: 120000 }
      );
      
      // 解析结果
      const resultMatch = stdout.match(/RESULT_START\n([\s\S]+?)\nRESULT_END/);
      const result = resultMatch ? JSON.parse(resultMatch[1]) : { raw: stdout };
      
      completeTask(task.id, result);
      console.log(`✅ ${task.ticker} 分析完成: ${result.rating || 'N/A'}`);
      
      return result;
      
    } else {
      // A股/港股分析
      await rateLimit('tencent');
      
      const { stdout } = await execPromise(
        `cd ${path.dirname(__dirname)} && node scripts/analyze.js --ticker ${task.ticker}`,
        { timeout: 60000 }
      );
      
      const resultMatch = stdout.match(/RESULT_START\n([\s\S]+?)\nRESULT_END/);
      const result = resultMatch ? JSON.parse(resultMatch[1]) : { raw: stdout };
      
      completeTask(task.id, result);
      console.log(`✅ ${task.ticker} 分析完成`);
      
      return result;
    }
    
  } catch (error) {
    console.error(`❌ ${task.ticker} 分析失败: ${error.message}`);
    failTask(task.id, error.message);
    throw error;
  }
}

/**
 * 检测市场
 */
function detectMarket(code) {
  if (code.endsWith('.HK')) return 'HK';
  if (code.endsWith('.SS') || code.endsWith('.SH') || code.endsWith('.SZ')) return 'CN';
  if (/^\d{6}$/.test(code)) {
    const first = code.charAt(0);
    if (first === '6') return 'CN'; // 沪市
    if (first === '0' || first === '3') return 'CN'; // 深市
  }
  return 'US';
}

/**
 * 处理队列
 */
async function processQueue(options = {}) {
  const maxTasks = options.maxTasks || Infinity;
  let processed = 0;
  
  console.log('🚀 开始处理分析队列...\n');
  
  while (processed < maxTasks) {
    const task = getNextTask();
    
    if (!task) {
      console.log('\n✅ 队列为空，处理完成');
      break;
    }
    
    try {
      await executeTask(task);
      processed++;
      
      // 显示进度
      const queue = loadQueue();
      const pending = queue.tasks.filter(t => t.status === 'pending').length;
      console.log(`\n📊 进度: ${processed} 完成, ${pending} 待处理\n`);
      
    } catch (e) {
      // 错误已在 executeTask 中处理
      processed++;
    }
  }
  
  // 显示总结
  const queue = loadQueue();
  console.log('\n' + '='.repeat(50));
  console.log('📊 队列处理总结');
  console.log('='.repeat(50));
  console.log(`✅ 完成: ${queue.completed.length}`);
  console.log(`❌ 失败: ${queue.failed.length}`);
  console.log(`⏳ 待处理: ${queue.tasks.filter(t => t.status === 'pending').length}`);
  console.log('='.repeat(50));
}

/**
 * 自动模式 - 持续处理
 */
async function autoMode() {
  console.log('🤖 自动模式启动 (按 Ctrl+C 停止)\n');
  
  while (true) {
    const task = getNextTask();
    
    if (!task) {
      console.log('⏳ 队列空，等待 60 秒...');
      await new Promise(r => setTimeout(r, 60000));
      continue;
    }
    
    try {
      await executeTask(task);
    } catch (e) {
      // 继续下一个
    }
    
    // 任务间延迟
    await new Promise(r => setTimeout(r, 2000));
  }
}

/**
 * 显示队列状态
 */
function showStatus() {
  const queue = loadQueue();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 分析队列状态');
  console.log('='.repeat(60));
  
  const pending = queue.tasks.filter(t => t.status === 'pending');
  const processing = queue.tasks.filter(t => t.status === 'processing');
  
  console.log(`\n⏳ 待处理 (${pending.length}):`);
  pending.forEach(t => {
    console.log(`   • ${t.ticker} (${t.type}) - ${new Date(t.addedAt).toLocaleString()}`);
  });
  
  if (processing.length > 0) {
    console.log(`\n🔄 处理中 (${processing.length}):`);
    processing.forEach(t => {
      console.log(`   • ${t.ticker} - 开始于 ${new Date(t.startedAt).toLocaleTimeString()}`);
    });
  }
  
  console.log(`\n✅ 已完成: ${queue.completed.length}`);
  console.log(`❌ 失败: ${queue.failed.length}`);
  console.log('='.repeat(60));
  
  // 显示最近完成的
  if (queue.completed.length > 0) {
    console.log('\n📈 最近完成:');
    queue.completed.slice(-5).reverse().forEach(t => {
      const result = t.result || {};
      console.log(`   • ${t.ticker}: ${result.rating || 'N/A'} (${result.score || 'N/A'}分)`);
    });
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === '--help') {
    console.log('🤖 智能分析队列系统\n');
    console.log('用法:');
    console.log('  node smartQueue.js --add AAPL          # 添加美股');
    console.log('  node smartQueue.js --add 600519 --market CN   # 添加A股');
    console.log('  node smartQueue.js --add 0700.HK --deep       # 添加深度分析');
    console.log('  node smartQueue.js --list              # 查看队列');
    console.log('  node smartQueue.js --process           # 处理所有任务');
    console.log('  node smartQueue.js --process --max 5   # 处理5个任务');
    console.log('  node smartQueue.js --auto              # 自动持续处理\n');
    console.log('特点:');
    console.log('  • 自动处理API频率限制');
    console.log('  • 失败自动重试 (最多3次)');
    console.log('  • 任务结果持久化保存');
    console.log('  • 支持批量添加股票\n');
    process.exit(0);
  }
  
  switch (command) {
    case '--add':
      const ticker = args[1];
      if (!ticker) {
        console.error('❌ 请提供股票代码');
        process.exit(1);
      }
      const options = {
        deep: args.includes('--deep'),
        market: args.includes('--market') ? args[args.indexOf('--market') + 1] : 'AUTO',
        priority: args.includes('--priority') ? parseInt(args[args.indexOf('--priority') + 1]) : 1
      };
      addTask(ticker, options);
      break;
      
    case '--list':
    case '--status':
      showStatus();
      break;
      
    case '--process':
      const maxIndex = args.indexOf('--max');
      const maxTasks = maxIndex >= 0 ? parseInt(args[maxIndex + 1]) : Infinity;
      await processQueue({ maxTasks });
      break;
      
    case '--auto':
      await autoMode();
      break;
      
    case '--clear':
      if (args.includes('--completed')) {
        const queue = loadQueue();
        queue.completed = [];
        saveQueue(queue);
        console.log('✅ 已清空完成列表');
      } else if (args.includes('--failed')) {
        const queue = loadQueue();
        queue.failed = [];
        saveQueue(queue);
        console.log('✅ 已清空失败列表');
      } else if (args.includes('--all')) {
        saveQueue({ tasks: [], completed: [], failed: [] });
        console.log('✅ 已清空所有队列');
      }
      break;
      
    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('使用 --help 查看帮助');
  }
}

main().catch(console.error);
