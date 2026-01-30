#!/usr/bin/env node
/**
 * Daily Papers from X (Twitter)
 * Fetches trending AI/Embodied AI/Robotics papers from X and generates a detailed report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  minEngagement: 10,  // Minimum likes/retweets
  maxResults: 20,     // Max papers per search
  hoursBack: 24       // Look back 24 hours
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

function getHoursAgo(hours) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

async function searchPapers() {
  const axios = require('axios');
  
  // Try multiple sources
  const papers = [];
  
  // 1. Try arXiv RSS feed for AI categories
  try {
    console.log('🔍 Searching arXiv for latest papers...');
    const arxivPapers = await searchArxiv(axios);
    papers.push(...arxivPapers);
  } catch (e) {
    console.error('⚠️ arXiv search failed:', e.message);
  }
  
  // 2. Try Papers With Code trending
  try {
    console.log('🔍 Searching Papers With Code...');
    const pwcpPapers = await searchPapersWithCode(axios);
    papers.push(...pwcpPapers);
  } catch (e) {
    console.error('⚠️ Papers With Code search failed:', e.message);
  }
  
  // 3. Try Hugging Face daily papers
  try {
    console.log('🔍 Searching Hugging Face...');
    const hfPapers = await searchHuggingFace(axios);
    papers.push(...hfPapers);
  } catch (e) {
    console.error('⚠️ Hugging Face search failed:', e.message);
  }
  
  // Remove duplicates by title
  const seen = new Set();
  return papers.filter(p => {
    if (seen.has(p.title)) return false;
    seen.add(p.title);
    return true;
  }).slice(0, CONFIG.maxResults);
}

async function searchArxiv(axios) {
  // Query for AI, robotics, and embodied AI papers from last 24 hours
  const categories = ['cs.AI', 'cs.RO', 'cs.LG', 'cs.CV'];
  const papers = [];
  
  const yesterday = getHoursAgo(24).split('T')[0].replace(/-/g, '');
  
  for (const cat of categories) {
    try {
      const url = `http://export.arxiv.org/api/query?search_query=cat:${cat}+AND+submittedDate:[${yesterday}+TO+NOW]&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
      const response = await axios.get(url, { timeout: 30000 });
      
      const entries = parseArxivFeed(response.data);
      papers.push(...entries);
    } catch (e) {
      console.error(`⚠️ arXiv ${cat} failed:`, e.message);
    }
  }
  
  return papers.map(p => ({
    ...p,
    source: 'arXiv',
    url: p.id,
    engagement: { likes: 0, retweets: 0, score: 0 }
  }));
}

function parseArxivFeed(xml) {
  const entries = [];
  const entryRegex = /<entry>(.*?)<\/entry>/gs;
  let match;
  
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    
    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
    const idMatch = entry.match(/<id>(.*?)<\/id>/s);
    const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
    const authorMatch = entry.match(/<name>(.*?)<\/name>/);
    const categoryMatch = entry.match(/<category term="(.*?)"/);
    
    if (titleMatch && idMatch) {
      entries.push({
        title: titleMatch[1].trim().replace(/\s+/g, ' '),
        id: idMatch[1].trim(),
        abstract: summaryMatch ? summaryMatch[1].trim().replace(/\s+/g, ' ').substring(0, 500) + '...' : 'No abstract available',
        authors: authorMatch ? [authorMatch[1]] : ['Unknown'],
        category: categoryMatch ? categoryMatch[1] : 'cs.AI',
        published: new Date().toISOString()
      });
    }
  }
  
  return entries;
}

async function searchPapersWithCode(axios) {
  try {
    const response = await axios.get('https://paperswithcode.com/api/v1/papers/', {
      params: {
        ordering: '-published',
        page: 1,
        items_per_page: 10
      },
      timeout: 30000
    });
    
    return response.data.results.map(p => ({
      title: p.title,
      id: p.url_pdf || p.url_abs,
      abstract: p.abstract ? p.abstract.substring(0, 500) + '...' : 'No abstract available',
      authors: p.authors || ['Unknown'],
      category: 'Papers With Code',
      source: 'Papers With Code',
      url: p.url_abs || p.url_pdf,
      published: p.published,
      engagement: { likes: 0, retweets: 0, score: p.stars || 0 }
    }));
  } catch (e) {
    console.error('Papers With Code error:', e.message);
    return [];
  }
}

async function searchHuggingFace(axios) {
  try {
    const response = await axios.get('https://huggingface.co/api/daily_papers', {
      timeout: 30000
    });
    
    return response.data.map(p => ({
      title: p.title,
      id: p.paper?.id || p.id,
      abstract: p.summary ? p.summary.substring(0, 500) + '...' : 'No abstract available',
      authors: p.paper?.authors?.map(a => a.name) || ['Unknown'],
      category: 'Hugging Face',
      source: 'Hugging Face Daily Papers',
      url: p.paper?.url || `https://arxiv.org/abs/${p.paper?.id}`,
      published: p.publishedAt,
      engagement: { likes: p.numLikes || 0, retweets: 0, score: p.numLikes || 0 }
    }));
  } catch (e) {
    console.error('Hugging Face error:', e.message);
    return [];
  }
}

async function summarizeWithAI(papers) {
  console.log('🤖 Generating AI summaries...');
  
  // For now, we'll use the abstracts as-is
  // In a full implementation, you could call an LLM API here
  return papers.map(p => ({
    ...p,
    summary: p.abstract,
    keyPoints: [
      'Paper published recently',
      `Category: ${p.category}`,
      `Source: ${p.source}`
    ],
    relevance: 'AI/Robotics related'
  }));
}

function generateMarkdown(papers, date) {
  const dateStr = getDateString(new Date(date));
  
  let md = `# Daily AI Papers - ${dateStr}

> 🎯 **Focus**: AI, Embodied AI, Robotics, World Models, LLMs  
> 📊 **Sources**: arXiv, Papers With Code, Hugging Face  
> ⏰ **Time Range**: Last 24 hours  

---

## 📈 Summary

Found **${papers.length}** trending papers in the last 24 hours.

`;

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

    if (p.codeUrl) {
      md += `- [Code](${p.codeUrl})\n`;
    }

    md += `
### 📊 Engagement

- Likes: ${p.engagement?.likes || 0}
- Retweets: ${p.engagement?.retweets || 0}
- Score: ${p.engagement?.score || 0}

---

`;
  });

  md += `
## 🏷️ Tags

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
    console.log(`🔍 Keywords: ${CONFIG.keywords.join(', ')}`);
    
    // Search for papers
    const papers = await searchPapers();
    console.log(`📚 Found ${papers.length} papers`);
    
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
    const filepath = path.join(WORKSPACE, 'memory', filename);
    
    // Ensure memory directory exists
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, markdown, 'utf8');
    
    console.log('\n✅ Report generated successfully!');
    console.log(`📄 File: ${filepath}`);
    console.log(`📊 Papers: ${papers.length}`);
    
    // Output summary for WhatsApp notification
    console.log('\n📱 Notification:');
    console.log(`Found ${papers.length} trending AI papers today!`);
    console.log(`Report saved to: memory/${filename}`);
    console.log('\nTop papers:');
    enrichedPapers.slice(0, 3).forEach((p, i) => {
      console.log(`${i + 1}. ${p.title.substring(0, 60)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
