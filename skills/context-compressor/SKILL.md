---
name: context-compressor
description: Automatic context window monitoring and compression. Use when the conversation history is approaching token limits (200k tokens). Triggers automatic compression at 85-90% threshold to summarize work items and maintain only essential context. Use in long-running sessions to prevent token overflow errors.
---

# Context Compressor

## Overview

This skill provides automatic monitoring of conversation context size and intelligent compression when approaching token limits.

**Key Features:**
- Monitors context window size in real-time
- Automatically compresses at configurable threshold (default: 85%)
- Summarizes work items into structured format
- Maintains essential context while reducing token usage

## When to Use

Use this skill when:
1. Working on long-running tasks with many steps
2. Context window is approaching 200k token limit
3. You see token limit errors or warnings
4. Need to maintain continuity across many message exchanges

## Workflow

### 1. Check Context Size

Before each significant task, check current context usage:

```bash
node scripts/check-context.js 85 check
```

Returns:
- Current threshold setting
- Whether compression is needed
- Estimated token usage

### 2. Compress Context (When Needed)

When approaching threshold (85-90% of 200k = 170k-180k tokens):

```bash
node scripts/check-context.js 90 compress '[{"task": "创建 skill", "status": "completed"}, {"task": "编写脚本", "status": "in-progress"}]'
```

Output format:
```json
{
  "status": "compressed",
  "timestamp": "2026-01-31T00:00:00.000Z",
  "summary": {
    "completed": ["创建 skill"],
    "inProgress": ["编写脚本"],
    "pending": []
  },
  "nextSteps": "等待用户确认后继续"
}
```

### 3. Manual Compression Format

If automatic detection isn't available, manually format compression:

```
**📦 上下文已压缩**

**工作摘要：**
- ✅ 已完成：[列出已完成任务]
- 🔄 进行中：[列出进行中任务]
- ⏳ 待处理：[列出待处理任务]

**下一步：** [明确下一步行动]
```

## Configuration

**Environment Variables:**
- `CONTEXT_LIMIT_K` - Context limit in thousands (default: 200)
- `COMPRESS_AT_PERCENT` - Compression threshold (default: 85)

**Threshold Guidelines:**
- 85% - Conservative, early compression
- 90% - Aggressive, maximum context utilization
- 95% - Risky, only for emergency use

## Best Practices

1. **Compress proactively** - Don't wait for errors
2. **Summarize clearly** - Include completed, in-progress, and pending items
3. **State next steps** - Always indicate what to do next
4. **Wait for confirmation** - After compression, wait for user before continuing
5. **Track work items** - Maintain a mental list of current tasks for compression

## Scripts

### check-context.js

Main utility for context monitoring and compression.

**Usage:**
```bash
# Check current threshold
node scripts/check-context.js 85 check

# Compress with work items
node scripts/check-context.js 90 compress '[{"task": "task1", "status": "completed"}]'
```

**API (Node.js):**
```javascript
const { estimateTokens, shouldCompress, compressSummary } = require('./scripts/check-context');

const tokens = estimateTokens(longText);
if (shouldCompress(tokens)) {
  const summary = compressSummary(workItems);
}
```

## Integration Pattern

For automatic integration in workflows:

1. Before each major task step, check context size
2. If above threshold, generate work summary
3. Present compressed summary to user
4. Wait for "继续" or "确认" before proceeding
5. Proceed with next task step

This ensures the session never hits token limits unexpectedly.
