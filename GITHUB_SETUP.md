# GitHub 自动发布配置

## 快速设置（一次性）

### 1. 创建 GitHub Token
1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 选择权限：**repo** (完整仓库访问)
4. 生成并复制 token

### 2. 配置 Moltbot
将 token 添加到环境变量：

```bash
# 添加到 ~/.zshrc 或 ~/.bash_profile
export GITHUB_TOKEN="ghp_your_token_here"
```

然后运行：
```bash
source ~/.zshrc
```

### 3. 配置 GitHub CLI
```bash
gh auth login --with-token <<< "$GITHUB_TOKEN"
```

完成！现在我可以自动推送技能到 GitHub。

## 使用方法

### 发布当前技能
```bash
/Users/icetomoyo/clawd/scripts/publish-skill.sh beautiful-mermaid
```

### 发布其他技能
```bash
/Users/icetomoyo/clawd/scripts/publish-skill.sh <skill-name>
```

## 自动发布脚本功能

✅ 自动创建 GitHub 仓库  
✅ 推送代码  
✅ 生成 .skill 安装包  
✅ 输出仓库链接  

---

**你现在有两个选择：**

**选项 A** - 提供 GitHub Token，我立即帮你完成推送  
**选项 B** - 使用 GitHub Desktop 手动创建（我之前说的步骤）

你想用哪种方式？
