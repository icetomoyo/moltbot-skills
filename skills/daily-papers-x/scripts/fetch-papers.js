#!/usr/bin/env node
/**
 * Daily Papers from X (Twitter)
 * Fetches trending AI/Embodied AI/Robotics papers from multiple sources
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';

// Configuration
const CONFIG = {
  keywords: [
    'AI paper',
    'embodied AI',
    'robotics paper',
    'LLM research',
    'machine learning paper',
    '#PaperOfTheDay',
    '#arXiv',
    'simulation learning',
    'world model',
    'generative AI'
  ],
  minEngagement: 10,
  maxResults: 20,
  hoursBack: 24
};

function ensureDependencies() {
  const pkgPath = path.join(SKILL_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: "daily-papers-x",
      version: "1.0.0",
      dependencies: {
        "axios": "^1.6.0"
      }
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  
  const modulePath = path.join(SKILL_DIR, 'node_modules', 'axios');
  if (!fs.existsSync(modulePath)) {
    console.error('📦 Installing dependencies...');
    try {
      execSync('npm install', { cwd: SKILL_DIR, stdio: 'inherit', timeout: 120000 });
    } catch (e) {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  }
}

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function getDateRange() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // arXiv format: YYYYMMDD
  const start = yesterday.toISOString().split('T')[0].replace(/-/g, '');
  const end = now.toISOString().split('T')[0].replace(/-/g, '');
  
  return { start, end };
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  const axios = require('axios');
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        ...options
      });
      return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`  ⚠️ Retry ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function searchPapers() {
  const papers = [];
  
  // 1. Try arXiv RSS feed for AI categories
  try {
    console.log('🔍 Searching arXiv for latest papers...');
    const arxivPapers = await searchArxiv();
    papers.push(...arxivPapers);
    console.log(`  ✅ Found ${arxivPapers.length} papers from arXiv`);
  } catch (e) {
    console.error('  ⚠️ arXiv search failed:', e.message);
  }
  
  // 2. Try Papers With Code trending
  try {
    console.log('🔍 Searching Papers With Code...');
    const pwcpPapers = await searchPapersWithCode();
    papers.push(...pwcpPapers);
    console.log(`  ✅ Found ${pwcpPapers.length} papers from Papers With Code`);
  } catch (e) {
    console.error('  ⚠️ Papers With Code search failed:', e.message);
  }
  
  // 3. Try Hugging Face daily papers
  try {
    console.log('🔍 Searching Hugging Face...');
    const hfPapers = await searchHuggingFace();
    papers.push(...hfPapers);
    console.log(`  ✅ Found ${hfPapers.length} papers from Hugging Face`);
  } catch (e) {
    console.error('  ⚠️ Hugging Face search failed:', e.message);
  }
  
  // Remove duplicates by title
  const seen = new Set();
  const unique = papers.filter(p => {
    const key = p.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return unique.slice(0, CONFIG.maxResults);
}

async function searchArxiv() {
  const categories = ['cs.AI', 'cs.RO', 'cs.LG', 'cs.CV'];
  const papers = [];
  
  for (const cat of categories) {
    try {
      // Use arXiv API with date range - last 24 hours
      const url = `http://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`;
      
      const response = await fetchWithRetry(url);
      const entries = parseArxivFeed(response.data);
      
      // Filter to last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recent = entries.filter(e => new Date(e.published) >= oneDayAgo);
      
      papers.push(...recent.map(p => ({
        ...p,
        source: 'arXiv',
        url: p.id,
        category: cat,
        engagement: { likes: 0, retweets: 0, score: 0 }
      })));
    } catch (e) {
      console.error(`    ⚠️ arXiv ${cat} failed:`, e.message);
    }
  }
  
  return papers;
}

function parseArxivFeed(xml) {
  const entries = [];
  
  // Parse entry blocks
  const entryMatches = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g) || [];
  
  for (const entryBlock of entryMatches) {
    try {
      const title = (entryBlock.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || '';
      const id = (entryBlock.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim() || '';
      const summary = (entryBlock.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim() || '';
      const published = (entryBlock.match(/<published>([\s\S]*?)<\/published>/) || [])[1]?.trim() || '';
      
      // Get all authors
      const authorMatches = entryBlock.match(/<author[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g) || [];
      const authors = authorMatches.map(a => {
        const name = a.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim();
        return name;
      }).filter(Boolean);
      
      // Get primary category
      const category = (entryBlock.match(/<arxiv:primary_category[^>]*?term="([^"]+)"/) || [])[1] || 
                       (entryBlock.match(/<category[^>]*?term="([^"]+)"/) || [])[1] || 'cs.AI';
      
      if (title && id) {
        entries.push({
          title: title.replace(/\s+/g, ' '),
          id: id,
          abstract: summary ? summary.substring(0, 500) + (summary.length > 500 ? '...' : '') : 'No abstract available',
          authors: authors.length > 0 ? authors : ['Unknown'],
          category: category,
          published: published || new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('    ⚠️ Failed to parse arXiv entry:', e.message);
    }
  }
  
  return entries;
}

async function searchPapersWithCode() {
  try {
    // Papers With Code API
    const url = 'https://paperswithcode.com/api/v1/papers/';
    const response = await fetchWithRetry(url, {
      params: {
        ordering: '-published',
        page: 1,
        items_per_page: 10
      }
    });
    
    // Check if response has expected structure
    if (!response.data || !Array.isArray(response.data.results)) {
      console.log('  ⚠️ Papers With Code: Unexpected response structure');
      return [];
    }
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return response.data.results
      .filter(p => p.published && new Date(p.published) >= oneDayAgo)
      .map(p => ({
        title: p.title || 'Unknown Title',
        id: p.id || '',
        abstract: p.abstract ? p.abstract.substring(0, 500) + (p.abstract.length > 500 ? '...' : '') : 'No abstract available',
        authors: p.authors?.map(a => typeof a === 'string' ? a : a.name).filter(Boolean) || ['Unknown'],
        category: 'Papers With Code',
        source: 'Papers With Code',
        url: p.url_abs || p.url_pdf || `https://paperswithcode.com/paper/${p.id}`,
        published: p.published,
        engagement: { likes: 0, retweets: 0, score: p.stars || 0 }
      }));
  } catch (e) {
    console.error('  ⚠️ Papers With Code error:', e.message);
    return [];
  }
}

async function searchHuggingFace() {
  try {
    const url = 'https://huggingface.co/api/daily_papers';
    const response = await fetchWithRetry(url);
    
    if (!Array.isArray(response.data)) {
      console.log('  ⚠️ Hugging Face: Unexpected response structure');
      return [];
    }
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return response.data
      .filter(p => {
        const pubDate = p.publishedAt ? new Date(p.publishedAt) : null;
        return !pubDate || pubDate >= oneDayAgo;
      })
      .map(p => {
        const paper = p.paper || {};
        return {
          title: paper.title || p.title || 'Unknown Title',
          id: paper.id || p.id || '',
          abstract: (p.summary || paper.abstract || 'No abstract available').substring(0, 500) + '...',
          authors: paper.authors?.map(a => a.name).filter(Boolean) || ['Unknown'],
          category: 'Hugging Face',
          source: 'Hugging Face Daily Papers',
          url: paper.url || `https://arxiv.org/abs/${paper.id}`,
          published: p.publishedAt || new Date().toISOString(),
          engagement: { 
            likes: p.numLikes || 0, 
            retweets: 0, 
            score: p.numLikes || 0 
          }
        };
      });
  } catch (e) {
    console.error('  ⚠️ Hugging Face error:', e.message);
    return [];
  }
}

async function summarizeWithAI(papers) {
  console.log('🤖 Processing papers...');
  
  return papers.map(p => ({
    ...p,
    summary: p.abstract,
    keyPoints: [
      `Source: ${p.source}`,
      `Category: ${p.category}`,
      `Published: ${new Date(p.published).toLocaleDateString()}`
    ]
  }));
}

function generateMarkdown(papers, date) {
  const dateStr = getDateString(new Date(date));
  
  // Source stats
  const sourceStats = papers.reduce((acc, p) => {
    acc[p.source] = (acc[p.source] || 0) + 1;
    return acc;
  }, {});
  
  let md = `# Daily AI Papers - ${dateStr}

> 🎯 **Focus**: AI, Embodied AI, Robotics, World Models, LLMs  
> 📊 **Sources**: arXiv, Papers With Code, Hugging Face  
> ⏰ **Time Range**: Last 24 hours  

---

## 📈 Summary

Found **${papers.length}** trending papers in the last 24 hours.

| Source | Count |
|--------|-------|
`;

  Object.entries(sourceStats).forEach(([source, count]) => {
    md += `| ${source} | ${count} |\n`;
  });

  md += '\n---\n\n';

  // Sort by engagement score
  const sortedPapers = [...papers].sort((a, b) => 
    (b.engagement?.score || 0) - (a.engagement?.score || 0)
  );

  sortedPapers.forEach((p, i) => {
    md += `## ${i + 1}. ${p.title}

**Authors**: ${p.authors.join(', ')}  
**Source**: ${p.source}  
**Category**: ${p.category}  
**Published**: ${new Date(p.published).toLocaleDateString()}

### 📝 Abstract

${p.summary || p.abstract}

### 🔗 Links

- [Paper URL](${p.url})
`;

    if (p.pdfUrl) {
      md += `- [PDF](${p.pdfUrl})\n`;
    }

    md += `
### 📊 Engagement

- Likes: ${p.engagement?.likes || 0}
- Score: ${p.engagement?.score || 0}

---

`;
  });

  md += `
## 🏷️ Search Keywords

${CONFIG.keywords.map(k => `- ${k}`).join('\n')}

---

*Generated by daily-papers-x skill for Moltbot*  
*Last updated: ${new Date().toLocaleString()}*
`;

  return md;
}

async function main() {
  try {
    ensureDependencies();
    
    console.log('🚀 Starting daily papers search...');
    console.log(`📅 Looking back ${CONFIG.hoursBack} hours`);
    console.log('');
    
    // Search for papers
    const papers = await searchPapers();
    console.log('');
    console.log(`📚 Total unique papers: ${papers.length}`);
    
    if (papers.length === 0) {
      console.log('⚠️ No papers found today');
      process.exit(0);
    }
    
    // Generate summaries
    const enrichedPapers = await summarizeWithAI(papers);
    
    // Generate markdown
    const date = new Date();
    const markdown = generateMarkdown(enrichedPapers, date);
    
    // Save to file
    const filename = `papers-${getDateString(date)}.md`;
    const memoryDir = path.join(WORKSPACE, 'memory');
    const filepath = path.join(memoryDir, filename);
    
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, markdown, 'utf8');
    
    console.log('');
    console.log('✅ Report generated successfully!');
    console.log(`📄 File: ${filepath}`);
    console.log(`📊 Papers: ${papers.length}`);
    console.log('');
    console.log('📱 Summary:');
    console.log(`Found ${papers.length} trending AI papers today!`);
    console.log(`Report saved to: memory/${filename}`);
    console.log('');
    console.log('Top papers:');
    enrichedPapers.slice(0, 5).forEach((p, i) => {
      const shortTitle = p.title.length > 50 ? p.title.substring(0, 50) + '...' : p.title;
      console.log(`  ${i + 1}. [${p.source}] ${shortTitle}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
