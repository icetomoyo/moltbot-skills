#!/usr/bin/env node
/**
 * Camera Snapshot - macOS 摄像头截图工具
 * 
 * Usage:
 *   node snapshot.js
 *   node snapshot.js --width 1920 --height 1080
 *   node snapshot.js --output ~/Pictures/photo.jpg
 *   node snapshot.js --list
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    width: 1280,
    height: 720,
    format: 'jpg',
    device: '0',
    list: false,
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--width':
      case '-w':
        config.width = parseInt(args[++i]);
        break;
      case '--height':
      case '-h':
        config.height = parseInt(args[++i]);
        break;
      case '--output':
      case '-o':
        config.output = args[++i];
        break;
      case '--format':
      case '-f':
        config.format = args[++i].toLowerCase();
        break;
      case '--device':
      case '-d':
        config.device = args[++i];
        break;
      case '--list':
      case '-l':
        config.list = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function showHelp() {
  console.log(`
📷 Camera Snapshot - macOS 摄像头截图工具

Usage:
  node snapshot.js [options]

Options:
  --width, -w      图片宽度 (默认: 1280)
  --height, -h     图片高度 (默认: 720)
  --output, -o     输出路径 (默认: ~/Desktop/camera_YYYYMMDD_HHMMSS.jpg)
  --format, -f     图片格式: jpg|png (默认: jpg)
  --device, -d     设备索引 (默认: 0)
  --list, -l       列出可用设备
  --help           显示帮助信息

Examples:
  node snapshot.js
  node snapshot.js --width 1920 --height 1080
  node snapshot.js --output ~/Pictures/photo.png --format png
  node snapshot.js --list
`);
}

// 列出可用设备
function listDevices() {
  try {
    // ffmpeg list_devices 总是返回退出码 1，需要从 stderr 读取输出
    const result = execSync(
      'ffmpeg -f avfoundation -list_devices true -i "" 2>&1 || true',
      { encoding: 'utf8', timeout: 5000, shell: true }
    );
    
    console.log('📹 可用视频设备:\n');
    
    const lines = result.split('\n');
    lines.forEach(line => {
      if (line.includes('[') && (line.includes('Camera') || line.includes('camera') || line.includes('Capture'))) {
        console.log(line.trim());
      }
    });
    
    console.log('\n🎤 可用音频设备:');
    lines.forEach(line => {
      if (line.includes('[') && line.includes('麦克风')) {
        console.log(line.trim());
      }
    });
    
  } catch (error) {
    console.error('❌ 无法列出设备:', error.message);
    process.exit(1);
  }
}

// 拍照
function takeSnapshot(config) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const defaultOutput = path.join(os.homedir(), 'Desktop', `camera_${timestamp}.${config.format}`);
  const outputPath = config.output || defaultOutput;
  
  const pixelFormat = config.format === 'png' ? 'rgb24' : 'yuvj422p';
  const codec = config.format === 'png' ? 'png' : 'mjpeg';
  
  const cmd = `ffmpeg -f avfoundation -video_size ${config.width}x${config.height} -framerate 30 -i "${config.device}" -frames:v 1 -c:v ${codec} -pix_fmt ${pixelFormat} -update 1 "${outputPath}" 2>&1`;
  
  try {
    console.log('\n📷 Camera Snapshot');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`设备: FaceTime高清相机 [${config.device}]`);
    console.log(`分辨率: ${config.width}x${config.height}`);
    console.log(`格式: ${config.format.toUpperCase()}`);
    console.log(`保存至: ${outputPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('拍照中...\n');
    
    execSync(cmd, { timeout: 10000 });
    
    // 验证文件是否创建成功
    const fs = require('fs');
    const stats = fs.statSync(outputPath);
    
    console.log(`✅ 拍照成功!`);
    console.log(`📁 文件大小: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`📍 完整路径: ${outputPath}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('\n❌ 拍照失败:', error.message);
    console.error('\n可能的解决方法:');
    console.error('  1. 检查摄像头权限（系统设置 > 隐私与安全性 > 摄像头）');
    console.error('  2. 确保没有其他应用正在使用摄像头');
    console.error('  3. 运行 --list 查看可用设备索引');
    console.error('  4. 尝试指定不同的设备索引: --device 1');
    process.exit(1);
  }
}

// 主函数
function main() {
  const config = parseArgs();
  
  if (config.list) {
    listDevices();
  } else {
    takeSnapshot(config);
  }
}

main();
