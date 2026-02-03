#!/usr/bin/env ts-node
/**
 * Test script for Browser Use Client
 */

import { BrowserUseClient } from './client';

async function main() {
  console.log('🧪 Testing Browser Use Client\n');

  const client = new BrowserUseClient({
    host: 'localhost',
    port: 8765,
    reconnect: true,
  });

  // 监听事件
  client.on('connected', () => {
    console.log('✅ Event: connected');
  });

  client.on('disconnected', () => {
    console.log('🔌 Event: disconnected');
  });

  client.on('stateUpdate', (state) => {
    console.log('📸 Event: stateUpdate');
    console.log(`   URL: ${state.url}`);
    console.log(`   Action: ${state.action}`);
    console.log(`   Screenshot: ${state.screenshot.substring(0, 50)}...`);
  });

  client.on('handoffRequired', (request) => {
    console.log('🤖 Event: handoffRequired');
    console.log(`   Reason: ${request.reason}`);
    console.log(`   URL: ${request.url}`);
    console.log(`   Message: ${request.message}`);
    
    // 模拟人工完成后确认
    setTimeout(() => {
      console.log('👤 Simulating human completion...');
      client.confirmHandoff(true);
    }, 3000);
  });

  client.on('taskCompleted', (result) => {
    console.log('✅ Event: taskCompleted');
    console.log(`   Result: ${result.summary}`);
    client.disconnect();
    process.exit(0);
  });

  client.on('error', (error) => {
    console.error('❌ Event: error', error);
  });

  // 连接
  try {
    await client.connect();
    console.log('Connected to bridge\n');

    // 执行任务
    console.log('🚀 Executing task...\n');
    await client.executeTask('Search for OpenAI on Google', {
      headless: false,
    });

    // 等待任务完成
    await new Promise((resolve) => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('Failed to connect:', error);
    process.exit(1);
  }
}

main();
