#!/usr/bin/env node
/**
 * beautiful-mermaid render script
 * Renders Mermaid diagrams to SVG or ASCII
 * Auto-installs dependencies if needed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const NODE_MODULES = path.join(SKILL_DIR, 'node_modules');

// Check and install dependencies
function ensureDependencies() {
  const packageJsonPath = path.join(SKILL_DIR, 'package.json');
  
  // Create package.json if not exists
  if (!fs.existsSync(packageJsonPath)) {
    const pkg = {
      name: "beautiful-mermaid-skill",
      version: "1.0.0",
      dependencies: {
        "beautiful-mermaid": "^0.1.3"
      }
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  }
  
  // Check if beautiful-mermaid is installed
  const modulePath = path.join(NODE_MODULES, 'beautiful-mermaid');
  if (!fs.existsSync(modulePath)) {
    console.error('Installing beautiful-mermaid...');
    try {
      execSync('npm install', { 
        cwd: SKILL_DIR, 
        stdio: 'inherit',
        timeout: 120000 
      });
      console.error('✓ Dependencies installed');
    } catch (e) {
      console.error('Failed to install dependencies:', e.message);
      process.exit(1);
    }
  }
}

// Main function
async function main() {
  ensureDependencies();
  
  // Now load the module
  const beautifulMermaid = require('beautiful-mermaid');
  const { renderMermaid, renderMermaidAscii, THEMES } = beautifulMermaid;
  
  // Parse arguments
  const args = process.argv.slice(2);
  const options = {
    format: 'svg',
    theme: 'tokyo-night',
    bg: null,
    fg: null,
    transparent: false,
  };
  
  let input = '';
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-f':
      case '--format':
        options.format = args[++i];
        break;
      case '-t':
      case '--theme':
        options.theme = args[++i];
        break;
      case '--bg':
        options.bg = args[++i];
        break;
      case '--fg':
        options.fg = args[++i];
        break;
      case '--transparent':
        options.transparent = true;
        break;
      case '--list-themes':
        console.log(JSON.stringify(Object.keys(THEMES)));
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('-')) {
          input = arg;
        }
        break;
    }
  }
  
  // If no input provided, read from stdin
  if (!input) {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    input = chunks.join('');
  }
  
  if (!input.trim()) {
    console.error('Error: No input provided');
    process.exit(1);
  }
  
  // Prepare render options
  const renderOptions = {};
  
  if (options.theme && THEMES[options.theme]) {
    Object.assign(renderOptions, THEMES[options.theme]);
  }
  
  if (options.bg) renderOptions.bg = options.bg;
  if (options.fg) renderOptions.fg = options.fg;
  if (options.transparent) renderOptions.transparent = true;
  
  // Render
  try {
    let output;
    if (options.format === 'ascii') {
      output = renderMermaidAscii(input, renderOptions);
    } else {
      output = await renderMermaid(input, renderOptions);
    }
    console.log(output);
  } catch (error) {
    console.error('Render error:', error.message);
    process.exit(1);
  }
}

main();
