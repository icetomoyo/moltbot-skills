#!/usr/bin/env node
/**
 * NotebookLM Automation Example
 * Uses OpenClaw browser tool with Chrome extension relay
 * 
 * Prerequisites:
 * 1. Install OpenClaw browser extension: openclaw browser extension install
 * 2. Load extension in Chrome (chrome://extensions → Developer mode → Load unpacked)
 * 3. Open NotebookLM in Chrome and click extension icon (badge shows ON)
 * 4. Run this script
 */

const paperUrl = process.argv[2] || 'https://arxiv.org/pdf/2601.22156v1';

console.log(`🚀 NotebookLM Automation`);
console.log(`📄 Paper: ${paperUrl}\n`);

console.log(`执行步骤：`);
console.log(`1️⃣  获取页面快照: browser action=snapshot profile=chrome`);
console.log(`2️⃣  点击新建笔记本: browser action=act profile=chrome request={"kind":"click","ref":"NEW_NOTEBOOK_REF"}`);
console.log(`3️⃣  选择网站来源: browser action=act profile=chrome request={"kind":"click","ref":"WEBSITE_REF"}`);
console.log(`4️⃣  输入URL: browser action=act profile=chrome request={"kind":"type","ref":"INPUT_REF","text":"${paperUrl}"}`);
console.log(`5️⃣  点击插入: browser action=act profile=chrome request={"kind":"click","ref":"INSERT_REF"}`);
console.log(`6️⃣  生成视频: browser action=act profile=chrome request={"kind":"click","ref":"VIDEO_REF"}`);
console.log(`7️⃣  生成信息图: browser action=act profile=chrome request={"kind":"click","ref":"INFOGRAPHIC_REF"}`);
console.log(`8️⃣  生成演示文稿: browser action=act profile=chrome request={"kind":"click","ref":"PRESENTATION_REF"}`);

console.log(`\n💡 提示：使用 browser action=snapshot profile=chrome 获取当前元素的 ref`);
console.log(`📖 详细文档: cat SKILL.md`);
