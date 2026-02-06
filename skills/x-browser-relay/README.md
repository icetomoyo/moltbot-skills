# X Browser Relay 🐦

使用 OpenClaw Browser Relay (Chrome 扩展) 访问 x.com，按需查看推荐内容，智能推送热门推文。

## ✨ 特性

- 🔌 **Browser Relay 集成**: 使用 Chrome 扩展直接访问 x.com
- 📱 **按需查看**: 用户随时触发，非实时监控
- 🔥 **热度检测**: 自动识别高互动推文（转发/点赞/评论）
- 📊 **智能推送**: 只推送值得关注的推文
- 🎯 **推荐流分析**: 查看 "For You" 页面内容

## 🚀 使用方法

### 前提条件

1. 安装 **OpenClaw Browser Relay** Chrome 扩展
2. 登录 x.com 账号
3. 确保扩展已连接到 OpenClaw

### 使用方式

直接对 Agent 说：

| 指令 | 效果 |
|------|------|
| "帮我看看 x.com 推荐" | 查看 For You 推荐流 |
| "刷一下 x.com 有什么热门" | 查看并推送热门推文 |
| "看看马斯克最近发了什么" | 查看 @elonmusk 主页 |
| "x.com 推荐流扫一眼" | 快速浏览20条 |
| "x.com 推荐，要热度高的" | 只推送 ≥70 分的推文 |

### 命令行方式

```bash
cd skills/x-browser-relay

# 查看推荐流
cat scripts/x-relay-simple.js | node

# 查看特定用户
cat scripts/x-relay-simple.js | node -- --user elonmusk

# 查看更多条数
cat scripts/x-relay-simple.js | node -- --count 30
```

## 📊 输出示例

Agent 会返回格式化的推文数据：

```
🔥 X.com 推荐流 (5条热门)

━━━━━━━━━━━━━━━
🐦 **Elon Musk** @elonmusk

Just launched Starship! 🚀
Landing sequence in progress...

🔥 热度: 98/100 (爆款)
🔄 12.5K 转发 | ❤️ 58K 喜欢 | 💬 8.9K 回复
🕐 5分钟前

🔗 https://x.com/elonmusk/status/1234567890

━━━━━━━━━━━━━━━
🐦 **Naval** @naval

Read what you love until you love to read.

🔥 热度: 85/100 (热门)
🔄 3.2K 转发 | ❤️ 15K 喜欢 | 💬 890 回复
🕐 12分钟前

🔗 https://x.com/naval/status/1234567891
```

## 🔥 热度计算

```
热度 = 转发 × 3 + 点赞 × 1 + 评论 × 2

标准化到 0-100 分
```

**热度等级**:
- 🔥 **90-100**: 爆款 (必推送)
- ⭐ **70-89**: 热门 (推送)
- 📈 **50-69**: 较热 (可选)
- 📊 **<50**: 普通 (不推送)

## 🔧 工作原理

1. **用户触发**: 用户通过自然语言指令让 Agent 访问 x.com
2. **Browser Relay**: Agent 通过 Chrome 扩展控制浏览器
3. **页面操作**: 
   - 打开 x.com 首页或指定用户页
   - 滚动加载推文
   - 提取推文数据
4. **热度计算**: 根据互动数计算热度分数
5. **智能推送**: 只推送热度 ≥70 的推文到 WhatsApp

## 🔒 隐私说明

- ✅ 只读取用户已登录账号的推荐内容
- ✅ 不存储用户 x.com 凭证
- ✅ 只在用户主动请求时访问 x.com
- ✅ 不进行后台监控

## ⚠️ 限制

1. **需要登录**: 用户必须已登录 x.com
2. **Browser Relay**: 必须保持 Chrome 扩展连接
3. **频率限制**: x.com 可能有反爬虫，过于频繁可能触发验证
4. **内容限制**: 部分私密账号内容无法访问

## 📝 示例对话

**用户**: "帮我看看 x.com 推荐"

**Agent**: 
```
🐦 正在打开 x.com...
📱 加载 For You 页面
📜 滚动加载推文
✅ 找到 5 条热门推文

🔥 X.com 推荐流 (5条)
[推文内容...]
```

**用户**: "马斯克发了什么"

**Agent**:
```
🐦 正在访问 @elonmusk...
👤 加载用户主页
📜 滚动加载推文
✅ 找到 3 条新推文

🔥 @elonmusk 最新推文
[推文内容...]
```

## 📄 License

MIT
