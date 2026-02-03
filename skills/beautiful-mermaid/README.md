# Beautiful Mermaid 🧜

Render Mermaid diagrams as beautiful SVGs or ASCII art. Supports flowcharts, state diagrams, sequence diagrams, class diagrams, ER diagrams with 15+ professional themes.

## 功能特点

- 🎨 **15+ 精美主题** - Tokyo Night、Dracula、Catppuccin、Nord、GitHub Dark 等
- 📊 **多种图表类型** - 流程图、状态图、时序图、类图、ER图
- 🖼️ **SVG 输出** - 高质量矢量图形，支持自定义颜色
- 📝 **ASCII 输出** - 终端友好的字符画
- 🚀 **零依赖** - 纯 Node.js 实现，无需浏览器环境
- ⚡ **自动安装** - 首次运行时自动安装 npm 依赖

## 使用方法

### 命令行使用

```bash
cd skills/beautiful-mermaid

# SVG 输出（默认主题: tokyo-night）
echo 'graph TD; A --> B' | node scripts/render.js

# 指定主题
echo 'graph TD; A --> B' | node scripts/render.js -t dracula

# ASCII 输出
echo 'graph TD; A --> B' | node scripts/render.js -f ascii

# 透明背景
echo 'graph TD; A --> B' | node scripts/render.js --transparent

# 自定义颜色
echo 'graph TD; A --> B' | node scripts/render.js --bg "#1a1a1a" --fg "#ffffff"

# 列出所有主题
node scripts/render.js --list-themes
```

### 通过 OpenClaw Agent

- "把这段 Mermaid 代码转成 SVG 图"
- "用 Tokyo Night 主题渲染这个流程图"
- "生成这个时序图的 ASCII 版本"

## 支持的图表类型

| 类型 | 语法 | 示例 |
|------|------|------|
| **流程图** | `graph TD/LR/BT/RL` | `graph TD; A --> B --> C` |
| **状态图** | `stateDiagram-v2` | `stateDiagram-v2; [*] --> Still` |
| **时序图** | `sequenceDiagram` | `sequenceDiagram; A->>B: Hello` |
| **类图** | `classDiagram` | `classDiagram; class Animal` |
| **ER图** | `erDiagram` | `erDiagram; CUSTOMER ||--o{ ORDER` |

## 输出格式

### SVG 输出
- 高质量矢量图形
- 支持自定义背景/前景色
- 支持透明背景
- 可直接嵌入网页或文档

### ASCII 输出
- 终端友好的字符画
- 适合代码注释或纯文本环境
- 保留图表结构

## 主题列表

| 主题 | 风格 | 适用场景 |
|------|------|----------|
| `tokyo-night` | 深蓝紫 | 默认，适合代码文档 |
| `dracula` | 紫黑 | 深色主题爱好者 |
| `catppuccin-mocha` | 暖棕 | 舒适的深色模式 |
| `nord` | 冰蓝 | 北欧风，清爽 |
| `github-dark` | 灰黑 | 与 GitHub 风格一致 |
| `solarized-dark` | 绿棕 | 护眼，低对比度 |
| `monokai` | 黑彩 | 经典编辑器主题 |
| `one-dark` | 深蓝 | Atom 编辑器风格 |
| `gruvbox-dark` | 棕黄 | 复古风格 |
| `rose-pine` | 粉紫 | 优雅柔和 |

更多主题：`--list-themes` 查看完整列表

## 文件结构

```
beautiful-mermaid/
├── SKILL.md              # 技能说明
├── README.md             # 本文件
├── scripts/
│   └── render.js        # 渲染脚本
└── examples/            # 示例输出（如有）
```

## CLI 参数

```
-f, --format <svg|ascii>   输出格式（默认: svg）
-t, --theme <name>         主题名称（默认: tokyo-night）
--bg <color>               背景颜色（hex格式，如 #1a1a1a）
--fg <color>               前景颜色（hex格式）
--transparent              透明背景
--list-themes              列出所有可用主题
-h, --help                 显示帮助
```

## 使用示例

### 流程图示例

```bash
echo '
graph TD
    A[开始] --> B{判断}
    B -->|条件1| C[处理1]
    B -->|条件2| D[处理2]
    C --> E[结束]
    D --> E
' | node scripts/render.js -t dracula
```

### 时序图示例

```bash
echo '
sequenceDiagram
    participant A as 用户
    participant B as 系统
    A->>B: 发送请求
    B-->>A: 返回响应
' | node scripts/render.js -f ascii
```

### 状态图示例

```bash
echo '
stateDiagram-v2
    [*] --> 空闲
    空闲 --> 运行: 开始
    运行 --> 暂停: 暂停
    暂停 --> 运行: 恢复
    运行 --> [*]: 结束
' | node scripts/render.js --transparent
```

## 依赖

- Node.js
- beautiful-mermaid npm 包（自动安装）

## 技术实现

- 基于 beautiful-mermaid 库
- 零 DOM 依赖
- 纯 Node.js 环境运行
- 支持自定义 CSS 主题

## GitHub

https://github.com/icetomoyo/openclaw-skills/tree/main/skills/beautiful-mermaid

## 参考

- [Mermaid 语法文档](https://mermaid.js.org/intro/)
- [beautiful-mermaid 项目](https://github.com/lukilabs/beautiful-mermaid)
