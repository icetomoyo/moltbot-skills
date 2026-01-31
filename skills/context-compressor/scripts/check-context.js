#!/usr/bin/env node
/**
 * Context Monitor - 检测上下文大小并在接近限制时触发压缩
 * 
 * 使用方法: node check-context.js [threshold_percentage]
 * 例如: node check-context.js 85
 * 
 * 环境变量:
 *   CONTEXT_LIMIT_K - 上下文限制（默认 200k）
 *   COMPRESS_AT_PERCENT - 压缩阈值百分比（默认 85）
 */

const THRESHOLD_PERCENT = parseInt(process.argv[2] || process.env.COMPRESS_AT_PERCENT || '85', 10);
const CONTEXT_LIMIT_K = parseInt(process.env.CONTEXT_LIMIT_K || '200', 10);
const THRESHOLD_TOKENS = Math.floor(CONTEXT_LIMIT_K * 1000 * (THRESHOLD_PERCENT / 100));

function estimateTokens(text) {
  // 粗略估计：英文 ~4字符/token，中文 ~1.5字符/token
  // 保守估计使用 3.5 字符/token
  const avgCharsPerToken = 3.5;
  return Math.ceil(text.length / avgCharsPerToken);
}

function getContextInfo() {
  // 从环境或日志获取上下文信息
  // 这里返回一个对象，实际使用时需要根据具体情况调整
  return {
    threshold: THRESHOLD_TOKENS,
    limit: CONTEXT_LIMIT_K * 1000,
    thresholdPercent: THRESHOLD_PERCENT
  };
}

function shouldCompress(currentTokens) {
  return currentTokens >= THRESHOLD_TOKENS;
}

function compressSummary(workItems) {
  const items = workItems || [];
  return {
    status: 'compressed',
    timestamp: new Date().toISOString(),
    summary: {
      completed: items.filter(i => i.status === 'completed').map(i => i.task),
      inProgress: items.filter(i => i.status === 'in-progress').map(i => i.task),
      pending: items.filter(i => i.status === 'pending').map(i => i.task)
    },
    nextSteps: items.find(i => i.next)?.next || '等待用户确认后继续'
  };
}

// CLI 支持
if (require.main === module) {
  const action = process.argv[3] || 'check';
  
  if (action === 'check') {
    const info = getContextInfo();
    console.log(JSON.stringify({
      action: 'check',
      threshold: info.threshold,
      limit: info.limit,
      shouldCompress: false,
      message: `阈值设置为 ${THRESHOLD_PERCENT}% (${info.threshold.toLocaleString()} tokens)`
    }, null, 2));
  }
  else if (action === 'compress') {
    const workItems = JSON.parse(process.argv[4] || '[]');
    const result = compressSummary(workItems);
    console.log(JSON.stringify(result, null, 2));
  }
  else {
    console.error('用法: node check-context.js [percent] [check|compress] [workItemsJson]');
    process.exit(1);
  }
}

module.exports = { estimateTokens, shouldCompress, compressSummary, getContextInfo };
