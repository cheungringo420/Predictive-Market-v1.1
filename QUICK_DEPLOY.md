# 🚀 快速部署指南

## ✅ 构建测试已通过！

你的项目已经可以部署了。以下是三种最简单的部署方法：

---

## 方法 1: Vercel 部署（推荐 - 5分钟完成）

### 步骤：

1. **访问 Vercel**
   - 打开 [vercel.com](https://vercel.com)
   - 点击 "Sign Up" 使用 GitHub 账号登录

2. **连接 GitHub 仓库**
   - 点击 "Add New Project"
   - 如果没有 GitHub 仓库，先创建：
     ```bash
     cd "/Users/ringocheung/Desktop/StrategyTest/predictive-horizon (5)"
     git init
     git add .
     git commit -m "Ready for deployment"
     ```
   - 在 GitHub 创建新仓库并推送：
     ```bash
     # 在 GitHub 创建新仓库后
     git remote add origin <your-github-repo-url>
     git branch -M main
     git push -u origin main
     ```

3. **在 Vercel 部署**
   - 回到 Vercel，选择你的 GitHub 仓库
   - Vercel 会自动检测 Vite 项目
   - **无需修改任何配置**（已包含 `vercel.json`）
   - 点击 "Deploy"

4. **完成！**
   - 等待 1-2 分钟
   - 获得部署 URL（例如：`predictive-horizon.vercel.app`）
   - 分享给队友即可访问

### 优势：
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 每次 push 代码自动重新部署
- ✅ 可以添加队友为协作者

---

## 方法 2: Netlify 部署（同样简单）

1. 访问 [netlify.com](https://netlify.com)
2. 使用 GitHub 登录
3. 点击 "Add new site" → "Import an existing project"
4. 选择你的仓库
5. 配置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 点击 "Deploy site"

---

## 方法 3: 使用 Vercel CLI（命令行）

如果你喜欢用命令行：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目目录运行
cd "/Users/ringocheung/Desktop/StrategyTest/predictive-horizon (5)"
vercel

# 按照提示操作
# 生产环境部署
vercel --prod
```

---

## 📝 部署前检查清单

- [x] ✅ 构建测试通过 (`npm run build`)
- [x] ✅ 已创建 `vercel.json` 配置文件
- [x] ✅ 已创建 `index.css` 文件
- [ ] ⬜ 代码已推送到 GitHub
- [ ] ⬜ 在 Vercel/Netlify 连接仓库

---

## 🔗 分享给队友

部署完成后，你会得到一个 URL，例如：
- `https://predictive-horizon.vercel.app`
- 或 `https://your-project.netlify.app`

**直接分享这个 URL 给队友即可！**

---

## 🎯 推荐流程

1. **现在立即部署**（使用 Vercel）
2. **测试部署的版本**（确保钱包连接等功能正常）
3. **分享 URL 给队友**
4. **后续更新**：每次 push 代码到 GitHub，Vercel 会自动重新部署

---

## ⚠️ 注意事项

1. **钱包连接**：确保部署的 URL 是 HTTPS（Vercel/Netlify 自动提供）
2. **网络切换**：确保队友连接到正确的测试网络（Base Sepolia 等）
3. **环境变量**：如果以后需要 API keys，在 Vercel 项目设置中添加

---

## 🆘 遇到问题？

- **构建失败**：检查构建日志，确保所有依赖已安装
- **路由问题**：`vercel.json` 已配置，应该没问题
- **钱包连接失败**：确保 URL 是 HTTPS

---

**准备好了吗？现在就访问 [vercel.com](https://vercel.com) 开始部署吧！** 🚀

