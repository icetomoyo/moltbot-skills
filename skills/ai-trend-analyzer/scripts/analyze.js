#!/usr/bin/env node
/**
 * AI Trend Analyzer
 * Deep analysis of AI trend monitoring results
 * Generates comprehensive markdown reports with insights
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';
const OUTPUT_DIR = path.join(SKILL_DIR, '..', 'output');
const TREND_MONITOR_DIR = path.join(WORKSPACE, 'skills', 'ai-trend-monitor', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    date: null,
    format: 'full', // full, technical, executive
    output: null
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      options.date = args[i + 1];
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      options.format = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    }
  }
  
  return options;
}

// Find the latest trends data file
function findLatestData(date = null) {
  if (!fs.existsSync(TREND_MONITOR_DIR)) {
    console.error('❌ ai-trend-monitor output directory not found');
    return null;
  }
  
  const files = fs.readdirSync(TREND_MONITOR_DIR)
    .filter(f => f.startsWith('trends-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error('❌ No trends data found');
    return null;
  }
  
  if (date) {
    // Find file matching the date
    const targetFile = files.find(f => f.includes(date));
    if (targetFile) {
      return path.join(TREND_MONITOR_DIR, targetFile);
    }
    console.error(`❌ No data found for date: ${date}`);
    return null;
  }
  
  // Return latest
  return path.join(TREND_MONITOR_DIR, files[0]);
}

// Load trends data
function loadTrendsData(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (e) {
    console.error('❌ Error loading data:', e.message);
    return null;
  }
}

// Generate analysis prompt for AI
function generateAnalysisPrompt(data, format = 'full') {
  const { byPlatform, rankedItems } = data;
  
  const topItems = rankedItems.slice(0, 15);
  
  let prompt = `你是一位资深的 AI 技术分析师。请对以下 AI 热点数据进行深度分析，生成专业的趋势报告。

## 数据概览
- 监控时间: ${new Date().toLocaleString('zh-CN')}
- 数据源: ${Object.entries(byPlatform).map(([p, items]) => `${p}: ${items.length}条`).join(', ')}
- 分析热点数: ${topItems.length}

## 热点数据详情

`;

  topItems.forEach((item, i) => {
    prompt += `### ${i + 1}. ${item.title}
- 来源: ${item.platform}
- 热度: ${item.score.toFixed(1)}
- 链接: ${item.url}
- 标签: ${item.hotTopics?.map(h => h.topic).join(', ') || 'N/A'}
`;
    
    if (item.abstract) {
      prompt += `- 摘要: ${item.abstract.substring(0, 200)}...\n`;
    }
    
    prompt += '\n';
  });

  prompt += `
## 分析要求

请生成一份专业的 AI 趋势分析报告，包含以下内容：

### 1. 执行摘要
- 本次监控的关键发现（3-5点）
- 最值得关注的方向推荐

### 2. 热点深度解析（逐个分析）
对前 10 个热点进行深度分析，每个热点必须包含以下格式：

**格式要求**（必须严格遵守）：
```
### X. [热点标题]
**来源**: [平台] | **热度**: [分数] | **链接**: [URL]

#### 技术背景
[背景介绍]

#### 核心创新点
- 创新点1
- 创新点2
...

#### 与现有技术对比
[对比分析]

#### 潜在应用场景
[应用场景]

#### 行业影响评估
[影响分析]
```

要求：
1. 每个热点必须包含**链接**和**热度值**
2. 保持原有深度分析内容质量
3. 技术背景、创新点、对比、应用、影响五部分都要有

### 3. 整体趋势分析
- 技术方向热度排行
- 新兴趋势识别（与常规趋势不同的新方向）
- 热点分布特征（学术vs工业、理论vs应用等）

### 4. 细分领域洞察
分别分析以下领域：
- AI/LLM 大模型方向
- Robotics/具身智能
- VLA/Vision-Language-Action
- World Models
- AI Infra/工具

### 5. 趋势预测与建议
- 短期热点预测（1-3个月）
- 中期技术趋势（3-12个月）
- 值得关注的论文/项目推荐

### 6. 结论
总结本次分析的核心观点。

## 输出格式
请使用 Markdown 格式，结构清晰，专业但不晦涩。适合技术从业者阅读。
`;

  if (format === 'technical') {
    prompt += '\n## 特殊要求（技术深度版）\n- 增加技术细节和实现方法分析\n- 包含相关论文引用建议\n- 深入分析算法原理\n';
  } else if (format === 'executive') {
    prompt += '\n## 特殊要求（高管摘要版）\n- 简化技术细节，突出商业价值\n- 增加投资/战略建议\n- 控制篇幅在2页以内\n';
  }

  return prompt;
}

// Call AI model for analysis using sessions_spawn
async function analyzeWithAI(prompt, data) {
  console.log('🤖 Calling AI for deep analysis...');
  
  try {
    // Write prompt to temp file
    const tempFile = path.join(OUTPUT_DIR, 'analysis-prompt.txt');
    fs.writeFileSync(tempFile, prompt, 'utf8');
    
    // Use sessions_spawn to call AI
    console.log('   Spawning AI analysis agent...');
    
    // For now, we'll generate a basic analysis without external AI call
    // The user can manually feed the prompt to an AI model
    console.log('   ⚠️  Note: AI analysis requires manual processing or configured API');
    console.log('   Analysis prompt saved to:', tempFile);
    
    // Return a basic analysis with full data
    return generateBasicAnalysis(data);
  } catch (e) {
    console.error('❌ AI analysis failed:', e.message);
    return null;
  }
}

// Generate basic analysis without external AI
function generateBasicAnalysis(data) {
  const { rankedItems, byPlatform } = data;
  const topItems = rankedItems.slice(0, 15);
  
  // Generate basic report
  let report = `# AI 趋势分析报告\n\n`;
  report += `> **报告类型**: 初步数据分析\n`;
  report += `> **生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  report += `## 📋 数据概览\n\n`;
  report += `- **总监控条目**: ${rankedItems.length}\n`;
  report += `- **分析热点数**: ${topItems.length}\n`;
  report += `- **数据源分布**: ${Object.entries(byPlatform).map(([p, items]) => `${p}: ${items.length}条`).join(', ')}\n\n`;
  
  report += `## 🔥 TOP 15 热点详情\n\n`;
  topItems.forEach((item, i) => {
    report += `### ${i + 1}. ${item.title}\n\n`;
    report += `- **来源**: ${item.platform}\n`;
    report += `- **热度**: ${item.score.toFixed(1)}\n`;
    report += `- **链接**: ${item.url}\n`;
    if (item.hotTopics?.length) {
      report += `- **标签**: ${item.hotTopics.map(h => h.topic).join(', ')}\n`;
    }
    
    // Platform-specific details
    if (item.platform === 'GitHub') {
      report += `- **Stars**: ${item.stars || 'N/A'}\n`;
      report += `- **Forks**: ${item.forks || 'N/A'}\n`;
      if (item.language) report += `- **语言**: ${item.language}\n`;
    } else if (item.platform === 'Reddit') {
      report += `- **Upvotes**: ${item.upvotes || 'N/A'}\n`;
      report += `- **Comments**: ${item.comments || 'N/A'}\n`;
      if (item.subreddit) report += `- **Subreddit**: r/${item.subreddit}\n`;
    } else if (item.platform === 'HackerNews') {
      report += `- **Points**: ${item.points || 'N/A'}\n`;
      report += `- **Comments**: ${item.comments || 'N/A'}\n`;
    } else if (item.platform === 'HuggingFace') {
      report += `- **Likes**: ${item.likes || 'N/A'}\n`;
    } else if (item.platform === 'arXiv') {
      report += `- **作者**: ${item.author || 'N/A'}\n`;
      report += `- **发布时间**: ${item.published ? new Date(item.published).toLocaleDateString('zh-CN') : 'N/A'}\n`;
      if (item.arxivCategory) report += `- **分类**: ${item.arxivCategory}\n`;
    }
    
    if (item.abstract) {
      report += `- **摘要**: ${item.abstract.substring(0, 300)}${item.abstract.length > 300 ? '...' : ''}\n`;
    }
    
    report += `\n---\n\n`;
  });
  
  report += `## 📊 热门标签统计\n\n`;
  const tagCounts = {};
  topItems.forEach(item => {
    if (item.hotTopics) {
      item.hotTopics.forEach(h => {
        tagCounts[h.topic] = (tagCounts[h.topic] || 0) + 1;
      });
    }
  });
  
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sortedTags.forEach(([tag, count], i) => {
    report += `${i + 1}. **${tag}**: ${count} 次提及\n`;
  });
  
  report += `\n## 📝 说明\n\n`;
  report += `本报告为数据原始分析。如需深度解读和趋势预测，建议：\n`;
  report += `1. 使用 AI 模型分析上述数据\n`;
  report += `2. 查看完整数据文件: \`output/analysis-prompt.txt\`\n`;
  report += `3. 运行深度分析: \`node scripts/analyze.js\`\n\n`;
  
  return report;
}

// Generate report metadata
function generateReportHeader(data) {
  const date = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const { byPlatform } = data;
  const totalItems = Object.values(byPlatform).reduce((sum, items) => sum + items.length, 0);
  
  return `# AI 趋势深度分析报告

> **报告生成时间**: ${date}  
> **数据来源**: AI Trend Monitor  
> **监控条目**: ${totalItems} 条  
> **分析平台**: ${Object.keys(byPlatform).join(', ')}

---

`;
}

// Save report
function saveReport(content, format = 'full') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `analysis-${timestamp}-${format}.md`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, content, 'utf8');
  
  // Also save as latest
  fs.writeFileSync(path.join(OUTPUT_DIR, 'latest-analysis.md'), content, 'utf8');
  
  // Save to sync folder for user access
  const SYNC_FOLDER = '/Users/icetomoyo/Downloads/同步空间/Dir4Openclaw';
  try {
    if (!fs.existsSync(SYNC_FOLDER)) {
      fs.mkdirSync(SYNC_FOLDER, { recursive: true });
    }
    const syncPath = path.join(SYNC_FOLDER, filename);
    fs.writeFileSync(syncPath, content, 'utf8');
    console.log(`📁 Also saved to sync folder: ${syncPath}`);
  } catch (e) {
    console.warn(`⚠️  Could not save to sync folder: ${e.message}`);
  }
  
  return filepath;
}

// Main function
async function main() {
  console.log('📊 AI Trend Analyzer\n');
  
  const options = parseArgs();
  console.log(`📅 Date: ${options.date || 'latest'}`);
  console.log(`📝 Format: ${options.format}\n`);
  
  // Find and load data
  const dataFile = findLatestData(options.date);
  if (!dataFile) {
    console.error('❌ No data file found');
    process.exit(1);
  }
  
  console.log(`📂 Loading data: ${path.basename(dataFile)}`);
  const data = loadTrendsData(dataFile);
  if (!data) {
    console.error('❌ Failed to load data');
    process.exit(1);
  }
  
  const { rankedItems, byPlatform } = data;
  console.log(`\n📈 Found ${rankedItems.length} items from ${Object.keys(byPlatform).length} platforms\n`);
  
  // Generate analysis prompt
  console.log('📝 Generating analysis prompt...');
  const prompt = generateAnalysisPrompt(data, options.format);
  
  // Call AI for analysis
  console.log('\n🔍 Starting deep analysis...');
  const analysis = await analyzeWithAI(prompt, data);
  
  if (!analysis) {
    console.error('❌ Analysis failed');
    process.exit(1);
  }
  
  // Generate full report
  const report = generateReportHeader(data) + analysis;
  
  // Save report
  const reportPath = saveReport(report, options.format);
  console.log(`\n✅ Report saved: ${path.basename(reportPath)}`);
  console.log(`📄 Full path: ${reportPath}`);
  
  // Output preview
  console.log('\n📋 Report Preview (first 2000 chars):\n');
  console.log('---');
  console.log(report.substring(0, 2000));
  console.log('...');
  console.log('---');
  
  return reportPath;
}

// Run
if (require.main === module) {
  main().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });
}

module.exports = { main, findLatestData, loadTrendsData, generateAnalysisPrompt };
