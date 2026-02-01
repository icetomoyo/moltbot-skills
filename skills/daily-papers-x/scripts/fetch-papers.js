#!/usr/bin/env node
/**
 * Daily Papers from X - Trending edition
 * Enhanced with x.com-style trending detection
 * Sources: arXiv, Hugging Face, cross-reference trending signals
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const WORKSPACE = process.env.WORKSPACE || '/Users/icetomoyo/clawd';

// Enhanced Research Categories based on user's 4 directions
const CATEGORIES = {
  '人工智能 (AI & LLM)': {
    arxiv: ['cs.AI', 'cs.LG', 'cs.CL'],
    keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'neural network'],
    trendingKeywords: [
      // OpenAI - Latest 2025-2026
      'GPT-5', 'GPT-5o', 'GPT-5 Omni', 'o3', 'o3 mini', 'o1 pro',
      'Operator', 'Agentic AI', 'Deep Research', 'Canvas',
      // Anthropic - Latest
      'Claude 4', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 4 Haiku',
      'Claude 3.7', 'Claude Code', 'Computer Use',
      // Google - Latest
      'Gemini 2.0', 'Gemini 2.5', 'Gemini Flash 2.0', 'Gemini Pro 2.0',
      'Gemini Ultra', 'Astra',
      // DeepSeek - Latest
      'DeepSeek-V3.2', 'DeepSeek-V4', 'DeepSeek-R2', 'DeepSeek-R1',
      'DeepSeek-Coder-V2', 'DeepSeek-Math', 'DeepSeek-Prover',
      // Meta - Latest
      'Llama 4', 'Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3',
      'Llama 3.2 Vision', 'Llama 3.1 405B',
      // Mistral / European
      'Mistral Large 2', 'Mistral Medium', 'Mistral Small',
      'Pixtral', 'Codestral', 'Mathstral',
      'Mixtral 8x22B', 'Mixtral 8x7B',
      // Alibaba / China
      'Qwen 2.5', 'Qwen 2.5 Max', 'Qwen 2.5 Coder', 'Qwen 2.5 VL',
      'Qwen 3', 'Qwen 3 MoE', 'Qwq-32B',
      'Baichuan', 'ChatGLM',
      // Other Top Models
      'Grok 3', 'Grok 3 mini', 'xAI',
      'Kimi k1.5', 'Kimi k1.6', 'Moonshot AI',
      'Command R+', 'Cohere',
      'Phi-4', 'Phi-4 mini', 'Microsoft',
      'Gemma 2', 'Gemma 3', 'Gemma 27B',
      'Nemotron', 'NVLM', 'NVIDIA',
      // Core technical terms
      'large language model', 'LLM', 'foundation model', 'frontier model',
      'transformer', 'attention', 'Mamba', 'RNN',
      'reasoning', 'chain-of-thought', 'CoT', 'prompt engineering',
      'in-context learning', 'few-shot', 'zero-shot',
      'LoRA', 'QLoRA', 'parameter efficient', 'PEFT',
      'quantization', 'distillation', 'pruning',
      'RAG', 'retrieval augmented', 'knowledge graph',
      'agent', 'AI agent', 'multi-agent', 'tool use',
      'RLHF', 'reinforcement learning', 'DPO', 'PPO',
      'long context', 'context window', 'position encoding',
      'synthetic data', 'data augmentation',
      'multimodal', 'vision language model', 'VLM'
    ],
    maxPapers: 10
  },
  '具身智能 (Embodied AI)': {
    arxiv: ['cs.RO', 'cs.AI', 'cs.CV'],
    keywords: ['robotics', 'embodied', 'manipulation', 'navigation', 'autonomous'],
    trendingKeywords: [
      // VLA Models - Latest 2025-2026
      'VLA', 'Vision Language Action', 'RT-2', 'RT-X', 'RT-1', 'RT-Trajectory',
      'OpenVLA', 'OpenVLA 7B', 'π0', 'pi-zero', 'pi0',
      'Octo', 'Octo Model', 'Diffusion Policy',
      '3D Diffusion Policy', 'RDT', 'ACT', 'Aloha', 'Aloha 2', 'Mobile ALOHA',
      // World Models - Latest
      'World Model', 'World Models 2025',
      'JEPA', 'I-JEPA', 'V-JEPA', 'Sora', 'Sora Turbo',
      'GAIA-1', 'DreamerV3', 'Dreamer v3', 'UniWorld',
      // Humanoid Robots - Latest 2025
      'humanoid', 'humanoid robot 2025',
      'Figure 02', 'Figure 03', 'Figure AI', 'Helix',
      'Optimus Gen 2', 'Optimus Gen 3', 'Tesla Bot', 'Tesla Optimus',
      'Atlas', 'Boston Dynamics', 'Spot', 'Stretch',
      'Digit', 'Agility Robotics', 'Agility',
      'Unitree G1', 'Unitree H1', 'Unitree', 'B2', 'Go2',
      'Fourier GR-1', 'Fourier GR-2', 'Fourier Intelligence',
      'Apptronik Apollo', 'Apptronik',
      '1X Neo', '1X Eve', '1X Technologies',
      'Clone Robotics', 'Clone Hand', 'Clone',
      'MenteeBot', 'Mentee', 'Beyond Imagination',
      'Astribot S1', 'Astribot',
      // Robot Learning - Latest
      'RT-Sketch', 'RT-Play',
      'Diffusion Policy', 'Implicit Behavior Cloning',
      'sim-to-real', 'sim2real', 'domain randomization', 'domain adaptation',
      'real2sim', 'simulation', 'NVIDIA Isaac', 'Isaac Sim', 'Isaac Gym', 'Isaac Lab',
      'Mujoco', 'PyBullet', 'Gazebo',
      'robot learning', 'imitation learning', 'IL', 'behavior cloning',
      'teleoperation', 'teleop', 'human demonstration', 'kinesthetic teaching',
      'reinforcement learning', 'RL', 'PPO', 'SAC', 'TD3',
      // Manipulation & Navigation
      'dexterous manipulation', 'in-hand manipulation', 'bimanual manipulation',
      'grasping', 'pick and place', 'assembly',
      'mobile manipulation', 'whole-body control', 'loco-manipulation',
      'SLAM', 'navigation', 'path planning', 'motion planning',
      'autonomous driving', 'end-to-end driving', 'Waymo', 'Waymo Driver', 'Tesla FSD', 'FSD V13'
    ],
    maxPapers: 8
  },
  'AI与金融结合 (AI + Finance)': {
    arxiv: ['cs.AI', 'q-fin.CP', 'q-fin.GN', 'q-fin.PM', 'q-fin.ST', 'q-fin.TR'],
    keywords: ['finance', 'financial', 'trading', 'market', 'economic', 'fintech'],
    trendingKeywords: [
      'algorithmic trading', 'algo trading', 'high frequency trading', 'HFT',
      'market prediction', 'stock prediction', 'price forecasting',
      'portfolio optimization', 'portfolio management', 'asset allocation',
      'risk management', 'risk assessment', 'Value at Risk', 'VaR',
      'fraud detection', 'anomaly detection', 'market manipulation',
      'sentiment analysis', 'market sentiment', 'news sentiment',
      'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'blockchain',
      'DeFi', 'decentralized finance', 'yield farming', 'liquidity mining',
      'credit scoring', 'loan default prediction', 'lending',
      'option pricing', 'derivative pricing', 'Black-Scholes',
      'macroeconomic forecasting', 'GDP prediction', 'inflation prediction',
      'financial LLM', 'FinGPT', 'BloombergGPT', 'FinBERT'
    ],
    maxPapers: 6
  },
  'AI与生物医学结合 (AI + Biomedical)': {
    arxiv: ['cs.AI', 'cs.CV', 'q-bio.QM', 'q-bio.BM', 'q-bio.GN', 'q-bio.TO'],
    keywords: ['biomedical', 'medical', 'healthcare', 'bio', 'clinical', 'health'],
    trendingKeywords: [
      'AlphaFold', 'protein folding', 'protein structure', 'structure prediction',
      'drug discovery', 'drug design', 'molecular generation', 'de novo design',
      'clinical trial', 'trial prediction', 'patient recruitment',
      'medical imaging', 'radiology', 'pathology', 'histopathology',
      'diagnosis', 'diagnostic', 'disease detection', 'early detection',
      'EHR', 'electronic health record', 'clinical notes',
      'medical LLM', 'MedPaLM', 'MedPaLM-2', 'ClinicalBERT', 'PubMedBERT',
      'genomics', 'genome', 'DNA', 'RNA', 'sequencing',
      'single cell', 'scRNA-seq', 'transcriptomics', 'proteomics',
      'metabolomics', 'multi-omics', 'systems biology',
      'medical robot', 'surgical robot', 'robotic surgery',
      'drug repurposing', 'target identification', 'biomarker discovery',
      'patient monitoring', 'ICU', 'vital signs', 'early warning',
      'mental health', 'depression detection', 'anxiety',
      'epidemic prediction', 'pandemic modeling', 'disease spread'
    ],
    maxPapers: 8
  }
};

const CONFIG = {
  totalMaxResults: 30,
  hoursBack: parseInt(process.env.HOURS_BACK || '24', 10),
  minPapersThreshold: 3,
  fallbackHoursBack: 48,
  trendingWeight: 2.0,  // Weight for trending keyword matches
  recencyWeight: 1.5    // Weight for very recent papers (last 6h)
};

// Trending paper trackers - organized by the 4 user-defined directions
const TRENDING_TRACKERS = {
  // Hot topics by category (simulating x.com trending) - UPDATED 2025-2026
  hotTopicsByCategory: {
    '人工智能 (AI & LLM)': [
      // OpenAI - Latest
      'GPT-5', 'GPT-5o', 'GPT-5 Omni', 'o3', 'o3 mini', 'o1 pro',
      'Operator', 'Agentic AI', 'Deep Research', 'Canvas',
      // Anthropic - Latest
      'Claude 4', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 4 Haiku',
      'Claude 3.7', 'Claude Code', 'Computer Use',
      // Google - Latest
      'Gemini 2.0', 'Gemini 2.5', 'Gemini Flash 2.0', 'Gemini Pro 2.0',
      'Gemini Ultra', 'Gemini Nano', 'Astra',
      // DeepSeek - Latest
      'DeepSeek-V3.2', 'DeepSeek-V4', 'DeepSeek-R2', 'DeepSeek-R1',
      'DeepSeek-Coder-V2', 'DeepSeek-Math', 'DeepSeek-Prover',
      // Meta - Latest
      'Llama 4', 'Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3',
      'Llama 3.2 Vision', 'Llama 3.1 405B',
      // Mistral / European
      'Mistral Large 2', 'Mistral Medium', 'Mistral Small',
      'Pixtral', 'Codestral', 'Mathstral',
      'Mixtral 8x22B', 'Mixtral 8x7B',
      // Alibaba / China
      'Qwen 2.5', 'Qwen 2.5 Max', 'Qwen 2.5 Coder', 'Qwen 2.5 VL',
      'Qwen 3', 'Qwen 3 MoE', 'Qwq-32B',
      // Other Top Models
      'Grok 3', 'Grok 3 mini', 'xAI',
      'Kimi k1.5', 'Kimi k1.6', 'Moonshot AI',
      'Command R+', 'Cohere',
      'Phi-4', 'Phi-4 mini', 'Microsoft',
      'Gemma 2', 'Gemma 3', 'Gemma 27B',
      'Nemotron', 'NVLM', 'NVIDIA',
      // Technical trends
      'reasoning model', 'test-time compute', 'inference-time compute',
      'mixture of experts', 'MoE', 'sparse attention',
      'multimodal', 'image understanding', 'video understanding',
      'agentic AI', 'AI agent', 'computer use', 'tool use'
    ],
    '具身智能 (Embodied AI)': [
      'VLA model', 'RT-2', 'RT-X', 'OpenVLA', 'π0',
      'world model', 'JEPA', 'I-JEPA', 'V-JEPA',
      'humanoid robot', 'Figure 02', 'Optimus Gen 2',
      'mobile manipulation', 'home robot', 'domestic robot',
      'sim-to-real gap', 'zero-shot transfer', 'domain adaptation'
    ],
    'AI与金融结合 (AI + Finance)': [
      'quant trading', 'high-frequency trading', 'market making',
      'crypto trading', 'DeFi yield', 'flash loan',
      'ESG investing', 'sustainable finance',
      'credit risk', 'default prediction', 'loan approval'
    ],
    'AI与生物医学结合 (AI + Biomedical)': [
      'AlphaFold 3', 'AlphaFold-latest', 'protein-ligand',
      'clinical LLM', 'medical AI', 'diagnostic AI',
      'digital twin', 'personalized medicine', 'precision medicine',
      'aging research', 'longevity', 'AI drug discovery'
    ]
  },
  
  // Universal viral indicators (high engagement keywords)
  viralIndicators: [
    'state-of-the-art', 'SOTA', 'new record', 'breakthrough', 'milestone',
    'surpasses', 'outperforms', 'beats GPT-4', 'beats Claude', 'beats human',
    'first', 'novel', 'new paradigm', 'game-changing',
    'open source', 'open-source', 'released', 'available',
    'reproduction', 'replication', 'verified', 'reproduced',
    'scaling law', 'emergent ability', 'capability jump',
    'safety issue', 'vulnerability', 'attack', 'jailbreak',
    'Sam Altman', 'Demis Hassabis', 'Yann LeCun', 'Geoffrey Hinton', 'Andrew Ng',
    'OpenAI', 'Google DeepMind', 'Anthropic', 'Meta AI', 'Microsoft Research'
  ],
  
  // Cross-category trending topics
  universalHotTopics: [
    'efficiency', 'faster', 'cheaper', 'smaller model', 'edge deployment',
    'multi-modal', 'any-to-any', 'unified model',
    'synthetic data', 'data quality', 'curriculum learning',
    'uncertainty', 'calibration', 'hallucination', 'factuality',
    'interpretability', 'explainability', 'mechanistic interpretability',
    'adversarial', 'robustness', 'generalization',
    'continual learning', 'lifelong learning', 'catastrophic forgetting',
    'federated learning', 'privacy preserving', 'differential privacy',
    'green AI', 'sustainable AI', 'carbon footprint', 'energy efficient'
  ]
};

function ensureDependencies() {
  const pkgPath = path.join(SKILL_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: "daily-papers-x",
      version: "1.1.0",
      dependencies: { "axios": "^1.6.0" }
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

async function fetchWithRetry(url, options = {}, retries = 3) {
  const axios = require('axios');
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 30000, ...options });
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function searchArxivByCategory(categoryName, config, hoursBack = 24) {
  const papers = [];
  const arxivCats = config.arxiv || ['cs.AI'];
  
  for (const cat of arxivCats) {
    try {
      const url = `http://export.arxiv.org/api/query?search_query=cat:${cat}&start=0&max_results=${hoursBack > 24 ? 30 : 15}&sortBy=submittedDate&sortOrder=descending`;
      const response = await fetchWithRetry(url);
      const entries = parseArxivFeed(response.data);
      
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
      
      let recent = entries.filter(e => new Date(e.published) >= cutoffTime);
      
      if (config.keywords && config.keywords.length > 0) {
        recent = recent.filter(e => {
          const text = (e.title + ' ' + e.abstract).toLowerCase();
          return config.keywords.some(kw => text.includes(kw.toLowerCase()));
        });
      }
      
      papers.push(...recent.map(p => ({
        ...p,
        source: 'arXiv',
        url: p.id.replace('/abs/', '/pdf/'),
        category: cat,
        engagement: { likes: 0, retweets: 0, score: 0 },
        trendingScore: 0,
        viralScore: 0
      })));
    } catch (e) {
      console.error(`    ⚠️ arXiv ${cat} failed:`, e.message);
    }
  }
  
  return papers;
}

async function searchHuggingFaceByCategory(categoryName, config, hoursBack = 24) {
  try {
    const url = 'https://huggingface.co/api/daily_papers';
    const response = await fetchWithRetry(url);
    
    if (!Array.isArray(response.data)) return [];
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    
    let papers = response.data.filter(p => {
      const pubDate = p.publishedAt ? new Date(p.publishedAt) : null;
      return !pubDate || pubDate >= cutoffTime;
    });
    
    if (config.keywords && config.keywords.length > 0) {
      papers = papers.filter(p => {
        const paper = p.paper || {};
        const text = ((p.title || paper.title || '') + ' ' + (p.summary || paper.abstract || '')).toLowerCase();
        return config.keywords.some(kw => text.includes(kw.toLowerCase()));
      });
    }
    
    return papers.map(p => {
      const paper = p.paper || {};
      return {
        title: paper.title || p.title || 'Unknown Title',
        id: paper.id || p.id || '',
        abstract: (p.summary || paper.abstract || 'No abstract available').substring(0, 500) + '...',
        authors: paper.authors?.map(a => a.name).filter(Boolean) || ['Unknown'],
        category: categoryName,
        source: 'Hugging Face',
        url: paper.url || `https://arxiv.org/abs/${paper.id}`,
        published: p.publishedAt || new Date().toISOString(),
        engagement: { likes: p.numLikes || 0, retweets: 0, score: p.numLikes || 0 },
        trendingScore: 0,
        viralScore: 0
      };
    });
  } catch (e) {
    return [];
  }
}

function parseArxivFeed(xml) {
  const entries = [];
  const entryMatches = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g) || [];
  
  for (const entryBlock of entryMatches) {
    try {
      const title = (entryBlock.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || '';
      const id = (entryBlock.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim() || '';
      const summary = (entryBlock.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim() || '';
      const published = (entryBlock.match(/<published>([\s\S]*?)<\/published>/) || [])[1]?.trim() || '';
      
      const authorMatches = entryBlock.match(/<author[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g) || [];
      const authors = authorMatches.map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim()).filter(Boolean);
      
      if (title && id) {
        entries.push({
          title: title.replace(/\s+/g, ' '),
          id: id,
          abstract: summary ? summary.substring(0, 500) + (summary.length > 500 ? '...' : '') : 'No abstract available',
          authors: authors.length > 0 ? authors : ['Unknown'],
          published: published || new Date().toISOString()
        });
      }
    } catch (e) {}
  }
  
  return entries;
}

// Calculate trending score (simulating x.com hotness)
function calculateTrendingScore(paper) {
  const text = ((paper.title || '') + ' ' + (paper.abstract || '')).toLowerCase();
  let score = 0;
  let matchedSignals = [];
  let categoryMatch = null;
  
  // Check category-specific hot topics first (higher weight)
  for (const [catName, topics] of Object.entries(TRENDING_TRACKERS.hotTopicsByCategory)) {
    for (const topic of topics) {
      if (text.includes(topic.toLowerCase())) {
        score += 2.5; // High weight for category-specific trending
        matchedSignals.push(`${catName.split(' ')[0]}: ${topic}`);
        categoryMatch = catName;
      }
    }
  }
  
  // Check universal viral indicators
  for (const indicator of TRENDING_TRACKERS.viralIndicators) {
    if (text.includes(indicator.toLowerCase())) {
      score += 4; // Very high weight for viral signals
      matchedSignals.push(`🔥 ${indicator}`);
    }
  }
  
  // Check universal hot topics
  for (const topic of TRENDING_TRACKERS.universalHotTopics) {
    if (text.includes(topic.toLowerCase())) {
      score += 1.5;
      matchedSignals.push(topic);
    }
  }
  
  // Check category-specific trending keywords from CATEGORIES
  for (const [catName, catConfig] of Object.entries(CATEGORIES)) {
    if (catConfig.trendingKeywords) {
      for (const kw of catConfig.trendingKeywords) {
        if (text.includes(kw.toLowerCase())) {
          score += 1.0;
          if (!matchedSignals.some(s => s.includes(kw))) {
            matchedSignals.push(kw);
          }
        }
      }
    }
  }
  
  // Recency bonus (papers from last 6 hours get extra points)
  const pubTime = new Date(paper.published);
  const hoursAgo = (Date.now() - pubTime.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 6) {
    score += CONFIG.recencyWeight * (1 - hoursAgo / 6);
    matchedSignals.push('⚡ 6h内发布');
  } else if (hoursAgo <= 12) {
    score += CONFIG.recencyWeight * 0.5 * (1 - (hoursAgo - 6) / 6);
    matchedSignals.push('⚡ 12h内发布');
  }
  
  // Hugging Face engagement bonus
  if (paper.engagement?.likes > 10) {
    score += Math.log10(paper.engagement.likes) * 0.5;
    matchedSignals.push(`👍 HF ${paper.engagement.likes} likes`);
  }
  
  // Normalize to 0-10 scale
  const normalizedScore = Math.min(Math.round(score * 10) / 10, 10);
  
  return { 
    score: normalizedScore, 
    signals: [...new Set(matchedSignals)].slice(0, 8), // Limit to top 8 signals
    primaryCategory: categoryMatch
  };
}

async function searchPapers(hoursBack = 24) {
  const papersByCategory = {};
  
  for (const [categoryName, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Searching: ${categoryName} (${hoursBack}h)`);
    papersByCategory[categoryName] = [];
    
    try {
      const arxivPapers = await searchArxivByCategory(categoryName, config, hoursBack);
      papersByCategory[categoryName].push(...arxivPapers);
      console.log(`  ✅ arXiv: ${arxivPapers.length}`);
    } catch (e) {}
    
    try {
      const hfPapers = await searchHuggingFaceByCategory(categoryName, config, hoursBack);
      papersByCategory[categoryName].push(...hfPapers);
      console.log(`  ✅ Hugging Face: ${hfPapers.length}`);
    } catch (e) {}
    
    // Calculate trending scores
    papersByCategory[categoryName].forEach(p => {
      const trending = calculateTrendingScore(p);
      p.trendingScore = trending.score;
      p.trendingSignals = trending.signals;
    });
    
    // Sort by trending score within category
    papersByCategory[categoryName].sort((a, b) => b.trendingScore - a.trendingScore);
    
    // Take top papers from this category
    papersByCategory[categoryName] = papersByCategory[categoryName]
      .slice(0, config.maxPapers)
      .map(p => ({ ...p, researchCategory: categoryName }));
  }
  
  let allPapers = [];
  for (const papers of Object.values(papersByCategory)) {
    allPapers.push(...papers);
  }
  
  // Deduplicate
  const seen = new Set();
  const unique = allPapers.filter(p => {
    const key = p.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by trending score globally
  unique.sort((a, b) => b.trendingScore - a.trendingScore);
  
  console.log(`\n📊 Category breakdown:`);
  for (const [cat, papers] of Object.entries(papersByCategory)) {
    const avgTrending = papers.reduce((sum, p) => sum + (p.trendingScore || 0), 0) / (papers.length || 1);
    console.log(`  ${cat}: ${papers.length} papers (avg trending: ${avgTrending.toFixed(1)})`);
  }
  
  return unique.slice(0, CONFIG.totalMaxResults);
}

// Select featured papers with enhanced trending detection
function selectFeaturedPapers(papers) {
  if (!papers || papers.length === 0) return null;

  const featured = {
    mostTrending: null,      // Most likely to be viral on x.com
    mostInteresting: null,
    mostPopular: null,
    mostDeep: null,
    mostValuable: null,
    mostRecommended: null
  };

  // Most Trending - highest trending score
  featured.mostTrending = papers.reduce((max, p) => 
    (p.trendingScore || 0) > (max?.trendingScore || 0) ? p : max, papers[0]);

  // Most Interesting
  const interestingKeywords = ['breakthrough', 'novel', 'first', 'new paradigm', 'surprising', 'unexpected', 'creative', 'innovative'];
  let maxScore = -1;
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    const score = interestingKeywords.filter(kw => text.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      featured.mostInteresting = p;
    }
  }
  if (!featured.mostInteresting) featured.mostInteresting = papers[0];

  // Most Popular (by engagement)
  featured.mostPopular = papers.reduce((max, p) => 
    (p.engagement?.score || 0) > (max?.engagement?.score || 0) ? p : max, papers[0]);

  // Most Deep
  const deepKeywords = ['theoretical', 'framework', 'analysis', 'mechanism', 'understanding', 'interpretability', 'proof', 'theorem'];
  maxScore = -1;
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    const keywordScore = deepKeywords.filter(kw => text.includes(kw)).length;
    const lengthScore = Math.min((p.abstract?.length || 0) / 100, 5);
    const totalScore = keywordScore * 2 + lengthScore;
    if (totalScore > maxScore) {
      maxScore = totalScore;
      featured.mostDeep = p;
    }
  }
  if (!featured.mostDeep) featured.mostDeep = papers[0];

  // Most Valuable
  const valuableKeywords = ['application', 'real-world', 'deployment', 'medical', 'clinical', 'financial', 'production', 'industry'];
  maxScore = -1;
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    let score = valuableKeywords.filter(kw => text.includes(kw)).length;
    if (p.researchCategory?.includes('Biomedical')) score += 2;
    if (p.researchCategory?.includes('Finance')) score += 2;
    if (score > maxScore) {
      maxScore = score;
      featured.mostValuable = p;
    }
  }
  if (!featured.mostValuable) featured.mostValuable = papers[papers.length - 1] || papers[0];

  // Most Recommended - combines trending score + quality signals
  let bestScore = -1;
  let bestReason = '';
  
  for (const p of papers) {
    const text = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();
    
    // Trending score is primary factor
    const trendingScore = (p.trendingScore || 0) * 2;
    
    // Quality signals
    const impactScore = (p.engagement?.score || 0);
    const noveltyScore = interestingKeywords.filter(kw => text.includes(kw)).length * 2;
    const practicalScore = valuableKeywords.filter(kw => text.includes(kw)).length * 2;
    
    // Bonus for trending signals
    let bonusScore = 0;
    let reasons = [];
    
    if (p.trendingScore > 5) {
      bonusScore += 3;
      reasons.push('🔥 高热度话题');
    }
    if (text.includes('open source') || text.includes('code available')) {
      bonusScore += 2;
      reasons.push('📦 开源可用');
    }
    if (text.includes('state-of-the-art') || text.includes('sota')) {
      bonusScore += 2;
      reasons.push('🏆 SOTA性能');
    }
    if (text.includes('llm') || text.includes('large language model')) {
      bonusScore += 1.5;
      reasons.push('🤖 LLM相关');
    }
    
    const totalScore = trendingScore + impactScore + noveltyScore + practicalScore + bonusScore;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      featured.mostRecommended = {
        ...p,
        recommendScore: totalScore,
        recommendReasons: reasons.length > 0 ? reasons : ['综合评分最高']
      };
    }
  }
  
  if (!featured.mostRecommended) {
    featured.mostRecommended = {
      ...papers[0],
      recommendScore: 0,
      recommendReasons: ['默认推荐']
    };
  }

  return featured;
}

// Generate full report with trending info
function generateFullReport(papers, featured, date) {
  const dateStr = getDateString(new Date(date));
  
  const byCategory = {};
  papers.forEach(p => {
    const cat = p.researchCategory || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  });

  let md = `# Daily AI Papers - ${dateStr}

> 🎯 四大研究方向：
> 1. 人工智能 (AI & LLM) • 2. 具身智能 (Embodied AI) • 3. AI与金融 • 4. AI与生物医学
> 📊 Sources: arXiv, Hugging Face, x.com trending signals
> 🔥 Trending Detection: Enabled (按用户定义的4大方向)
> ⏰ Time Range: Last ${CONFIG.hoursBack} hours

## 📈 Summary

Found **${papers.length}** papers across **${Object.keys(byCategory).length}** research directions.

| 研究方向 | Papers | Avg Trending |
|---------|--------|-------------|
`;

  Object.entries(byCategory).forEach(([cat, ps]) => {
    const avgTrending = ps.reduce((sum, p) => sum + (p.trendingScore || 0), 0) / (ps.length || 1);
    md += `| ${cat} | ${ps.length} | ${avgTrending.toFixed(1)} |
`;
  });

  md += `
### 🔥 Top Trending Signals
`;
  const allSignals = papers.flatMap(p => p.trendingSignals || []).filter(Boolean);
  const signalCounts = {};
  allSignals.forEach(s => signalCounts[s] = (signalCounts[s] || 0) + 1);
  const topSignals = Object.entries(signalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  topSignals.forEach(([signal, count]) => {
    md += `- **${signal}**: ${count} papers\n`;
  });

  // Full papers by category
  for (const [cat, ps] of Object.entries(byCategory)) {
    md += `\n---\n\n## 🔬 ${cat}\n\n`;
    ps.forEach((p, i) => {
      md += `### ${i + 1}. ${p.title}\n\n`;
      md += `**Authors**: ${p.authors.join(', ')}  \n`;
      md += `**Source**: ${p.source}  \n`;
      md += `**Published**: ${new Date(p.published).toLocaleDateString()}  \n`;
      md += `**🔥 Trending Score**: ${p.trendingScore || 0}  \n`;
      if (p.trendingSignals && p.trendingSignals.length > 0) {
        md += `**Trending Signals**: ${p.trendingSignals.slice(0, 5).join(', ')}\n`;
      }
      md += `\n**Abstract**: ${p.abstract}\n\n`;
      md += `🔗 [Paper URL](${p.url})\n\n---\n\n`;
    });
  }

  // Featured papers
  if (featured) {
    md += `\n---\n\n## ⭐ Featured Papers\n\n`;
    
    // Most Recommended
    if (featured.mostRecommended) {
      md += `### 🏆 Most Recommended: ${featured.mostRecommended.title}\n\n`;
      md += `**推荐理由:** ${featured.mostRecommended.recommendReasons.join(', ')}\n\n`;
      md += `**热度评分:** ${featured.mostRecommended.trendingScore || 0}/10\n\n`;
      md += `${featured.mostRecommended.abstract}\n\n`;
      md += `🔗 ${featured.mostRecommended.url}\n\n---\n\n`;
    }
    
    // Most Trending (x.com style)
    if (featured.mostTrending) {
      md += `### 🔥 Most Trending (x.com style): ${featured.mostTrending.title}\n\n`;
      md += `**热度评分:** ${featured.mostTrending.trendingScore || 0}/10\n\n`;
      if (featured.mostTrending.trendingSignals) {
        md += `**热门信号:** ${featured.mostTrending.trendingSignals.join(', ')}\n\n`;
      }
      md += `${featured.mostTrending.abstract}\n\n`;
      md += `🔗 ${featured.mostTrending.url}\n\n---\n\n`;
    }
    
    if (featured.mostInteresting) {
      md += `### 🎨 Most Interesting: ${featured.mostInteresting.title}\n\n`;
      md += `${featured.mostInteresting.abstract}\n\n`;
      md += `🔗 ${featured.mostInteresting.url}\n\n---\n\n`;
    }
    
    if (featured.mostPopular) {
      md += `### 👍 Most Popular: ${featured.mostPopular.title}\n\n`;
      md += `${featured.mostPopular.abstract}\n\n`;
      md += `🔗 ${featured.mostPopular.url}\n\n---\n\n`;
    }
    
    if (featured.mostDeep) {
      md += `### 🧠 Most Deep: ${featured.mostDeep.title}\n\n`;
      md += `${featured.mostDeep.abstract}\n\n`;
      md += `🔗 ${featured.mostDeep.url}\n\n---\n\n`;
    }
    
    if (featured.mostValuable) {
      md += `### 💎 Most Valuable: ${featured.mostValuable.title}\n\n`;
      md += `${featured.mostValuable.abstract}\n\n`;
      md += `🔗 ${featured.mostValuable.url}\n`;
    }
  }

  md += `\n---\n\n*Generated by daily-papers-x skill*  
*Trending detection simulates x.com hot topics*  
*Last updated: ${new Date().toLocaleString()}*
`;

  return md;
}

// Generate WhatsApp summary with trending focus
function generateWhatsAppSummary(papers, featured) {
  // Count papers by category
  const byCategory = {};
  papers.forEach(p => {
    const cat = p.researchCategory || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });
  
  let msg = `📚 Daily AI Papers - ${getDateString()}
`;
  msg += `🔥 x.com Trending Edition

`;
  msg += `📊 四大方向共 ${papers.length} 篇 | 均热: ${(papers.reduce((sum, p) => sum + (p.trendingScore || 0), 0) / papers.length).toFixed(1)}/10

`;
  
  // Show category breakdown
  msg += `📈 方向分布:\n`;
  for (const [cat, count] of Object.entries(byCategory)) {
    const shortName = cat.split(' ')[0];
    msg += `   ${shortName}: ${count}篇\n`;
  }
  msg += `\n`;

  // Top trending signals
  const allSignals = papers.flatMap(p => p.trendingSignals || []).filter(Boolean);
  const signalCounts = {};
  allSignals.forEach(s => signalCounts[s] = (signalCounts[s] || 0) + 1);
  const topSignals = Object.entries(signalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topSignals.length > 0) {
    msg += `🔥 热门话题: `;
    msg += topSignals.map(([s, c]) => `${s}(${c})`).join(' | ');
    msg += '\n\n';
  }

  // Most Recommended
  if (featured && featured.mostRecommended) {
    const rec = featured.mostRecommended;
    msg += `🏆 TOP PICK - 最推荐
`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━
`;
    msg += `📌 ${rec.title}

`;
    msg += `📝 ${rec.abstract.substring(0, 350)}...

`;
    msg += `✨ 推荐理由:
`;
    rec.recommendReasons.forEach((reason, i) => {
      msg += `   ${reason}
`;
    });
    msg += `\n🔥 热度: ${rec.trendingScore || 0}/10
`;
    msg += `🔗 ${rec.url}
`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━

`;
  }

  // Most Trending
  if (featured && featured.mostTrending && featured.mostTrending !== featured.mostRecommended) {
    msg += `🔥 TRENDING - 最热
`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━
`;
    msg += `📌 ${featured.mostTrending.title}
`;
    msg += `🔥 热度: ${featured.mostTrending.trendingScore || 0}/10
`;
    if (featured.mostTrending.trendingSignals) {
      msg += `📈 信号: ${featured.mostTrending.trendingSignals.slice(0, 3).join(', ')}
`;
    }
    msg += `🔗 ${featured.mostTrending.url}
`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━

`;
  }

  // All papers list (top 10)
  msg += `📋 Top Papers:\n`;
  papers.slice(0, 10).forEach((p, i) => {
    const fire = (p.trendingScore || 0) >= 5 ? '🔥' : '•';
    msg += `${fire} ${p.title}\n`;
  });

  if (papers.length > 10) {
    msg += `\n... and ${papers.length - 10} more\n`;
  }

  // Featured papers
  if (featured) {
    msg += `\n---\n\n⭐ Featured:\n\n`;

    if (featured.mostInteresting && featured.mostInteresting !== featured.mostRecommended && featured.mostInteresting !== featured.mostTrending) {
      msg += `🎨 Most Interesting:\n`;
      msg += `${featured.mostInteresting.title}\n`;
      msg += `🔗 ${featured.mostInteresting.url}\n\n`;
    }

    if (featured.mostDeep) {
      msg += `🧠 Most Deep:\n`;
      msg += `${featured.mostDeep.title}\n`;
      msg += `🔗 ${featured.mostDeep.url}\n\n`;
    }

    if (featured.mostValuable) {
      msg += `💎 Most Valuable:\n`;
      msg += `${featured.mostValuable.title}\n`;
      msg += `🔗 ${featured.mostValuable.url}\n`;
    }
  }

  msg += `\n📄 Full report: memory/papers-${getDateString()}.md`;

  return msg;
}

async function main() {
  try {
    ensureDependencies();
    
    console.log('🚀 Starting daily papers search (x.com trending edition)...\n');
    console.log(`⏰ Search range: ${CONFIG.hoursBack} hours`);
    console.log(`🔥 Trending detection: Enabled`);
    console.log(`📊 Categories: ${Object.keys(CATEGORIES).join(', ')}\n`);
    
    // First attempt with default hoursBack
    let papers = await searchPapers(CONFIG.hoursBack);
    console.log(`\n📚 Total: ${papers.length} papers`);
    
    // If not enough papers and not already using fallback, try wider range
    if (papers.length < CONFIG.minPapersThreshold && CONFIG.hoursBack < CONFIG.fallbackHoursBack) {
      console.log(`\n⚠️ Only ${papers.length} papers found (threshold: ${CONFIG.minPapersThreshold})`);
      console.log(`🔄 Expanding search to ${CONFIG.fallbackHoursBack} hours...\n`);
      
      papers = await searchPapers(CONFIG.fallbackHoursBack);
      console.log(`\n📚 Total after expansion: ${papers.length} papers`);
    }
    
    if (papers.length === 0) {
      console.log('\n⚠️ No papers found');
      
      // Save empty result marker
      const memoryDir = path.join(WORKSPACE, 'memory');
      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      const emptyMarker = path.join(memoryDir, `papers-${getDateString()}-empty.txt`);
      fs.writeFileSync(emptyMarker, `No papers found on ${getDateString()}\nSearch range: ${CONFIG.fallbackHoursBack} hours`, 'utf8');
      
      // Output for WhatsApp
      console.log('\n📱 WhatsApp Message:');
      console.log('---WHATSAPP_MESSAGE_START---');
      console.log(`📚 Daily AI Papers - ${getDateString()}\n\n🔍 搜索了最近 ${CONFIG.fallbackHoursBack} 小时的论文\n\n⚠️ 暂无新论文发布\n\n明天再试试！ 📖`);
      console.log('---WHATSAPP_MESSAGE_END---');
      
      process.exit(0);
    }
    
    const featured = selectFeaturedPapers(papers);
    const date = new Date();
    
    // Generate full report (saved locally)
    const fullReport = generateFullReport(papers, featured, date);
    const memoryDir = path.join(WORKSPACE, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    const mdPath = path.join(memoryDir, `papers-${getDateString(date)}.md`);
    fs.writeFileSync(mdPath, fullReport, 'utf8');
    console.log(`\n✅ Full report saved: ${mdPath}`);
    
    // Generate WhatsApp summary
    const whatsappSummary = generateWhatsAppSummary(papers, featured);
    
    // Save WhatsApp message to file
    const msgPath = path.join(memoryDir, `papers-${getDateString(date)}-summary.txt`);
    fs.writeFileSync(msgPath, whatsappSummary, 'utf8');
    console.log(`✅ WhatsApp summary saved: ${msgPath}`);
    
    // Output the summary
    console.log('\n📱 WhatsApp Message:\n');
    console.log('---WHATSAPP_MESSAGE_START---');
    console.log(whatsappSummary);
    console.log('---WHATSAPP_MESSAGE_END---');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
