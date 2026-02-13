---
name: camera-snapshot
description: Capture photos using macOS built-in camera (FaceTime HD Camera) via ffmpeg. Supports automatic device detection and configurable resolution.
homepage: https://github.com/openclaw/openclaw
metadata: {"openclaw":{"emoji":"📷","requires":{"bins":["ffmpeg"]},"install":[{"id":"ffmpeg","kind":"brew","package":"ffmpeg","bins":["ffmpeg"],"label":"Install ffmpeg: brew install ffmpeg"}]}}
---

# Camera Snapshot - macOS 摄像头截图

使用 ffmpeg 调用 macOS 内置摄像头（FaceTime HD Camera）拍照。

## 功能特点

- 🔍 **自动检测设备** - 自动识别 FaceTime 高清相机
- 📐 **可配置分辨率** - 支持 720p/1080p 等多种分辨率
- 💾 **自动保存** - 保存到桌面或指定路径
- 🖼️ **多种格式** - 支持 JPG、PNG 等格式

## Quick Start

```bash
# 使用默认设置拍照（720p JPG 保存到桌面）
node skills/camera-snapshot/scripts/snapshot.js

# 指定分辨率和路径
node skills/camera-snapshot/scripts/snapshot.js --width 1920 --height 1080 --output ~/Pictures/photo.jpg

# 使用 PNG 格式
node skills/camera-snapshot/scripts/snapshot.js --format png
```

## 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--width` | 1280 | 图片宽度 |
| `--height` | 720 | 图片高度 |
| `--output` | ~/Desktop/camera_YYYYMMDD_HHMMSS.jpg | 输出路径 |
| `--format` | jpg | 图片格式 (jpg/png) |
| `--device` | 0 | 摄像头设备索引 |
| `--list` | false | 列出可用设备 |

## 使用示例

### 列出可用设备
```bash
node skills/camera-snapshot/scripts/snapshot.js --list
```

### 拍摄高清照片
```bash
node skills/camera-snapshot/scripts/snapshot.js --width 1920 --height 1080
```

### 指定输出路径
```bash
node skills/camera-snapshot/scripts/snapshot.js --output ~/Documents/my_photo.jpg
```

## 技术要求

- **macOS** 系统
- **ffmpeg** 已安装 (`brew install ffmpeg`)
- 摄像头访问权限已授权

## 授权设置

首次使用时需要在 **系统设置 > 隐私与安全性 > 摄像头** 中授权终端访问摄像头。

## 常见问题

### 照片是黑色的？
- 检查光线是否充足
- 检查摄像头是否被遮挡（贴纸/盖子）
- 检查摄像头是否被其他应用占用

### 找不到设备？
- 运行 `--list` 查看可用设备
- 检查摄像头是否被禁用

### 权限被拒绝？
- 前往系统设置授权摄像头访问
- 重启终端后重试

## 输出示例

```
📷 Camera Snapshot
━━━━━━━━━━━━━━━━━━━━━━
设备: FaceTime高清相机 [0]
分辨率: 1280x720
格式: JPEG
保存至: ~/Desktop/camera_20260213_084320.jpg
━━━━━━━━━━━━━━━━━━━━━━
✅ 拍照成功!
```

## 集成到 OpenClaw

可以直接调用：
```bash
# 在 OpenClaw 中执行
exec node skills/camera-snapshot/scripts/snapshot.js
```
