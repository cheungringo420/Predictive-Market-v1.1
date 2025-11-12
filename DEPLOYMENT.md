# 部署指南 (Deployment Guide)

## 方法 1: Vercel 部署 (推荐 - 最简单)

### 步骤：

1. **准备代码**
   - 确保所有更改已提交到 Git
   - 如果没有 Git 仓库，先初始化：
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     ```

2. **推送到 GitHub**
   - 在 GitHub 创建新仓库
   - 推送代码：
     ```bash
     git remote add origin <your-github-repo-url>
     git branch -M main
     git push -u origin main
     ```

3. **在 Vercel 部署**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测 Vite 项目
   - 点击 "Deploy"
   - 等待部署完成（通常 1-2 分钟）

4. **访问你的应用**
   - 部署完成后，Vercel 会提供一个 URL（例如：`your-project.vercel.app`）
   - 你的队友可以通过这个 URL 访问应用

### Vercel 优势：
- ✅ 完全免费（个人项目）
- ✅ 自动 HTTPS
- ✅ 自动部署（每次 push 到 GitHub）
- ✅ 全球 CDN
- ✅ 无需配置

---

## 方法 2: Netlify 部署

### 步骤：

1. **准备代码**（同上）

2. **在 Netlify 部署**
   - 访问 [netlify.com](https://netlify.com)
   - 使用 GitHub 账号登录
   - 点击 "Add new site" → "Import an existing project"
   - 选择你的 GitHub 仓库
   - 配置：
     - Build command: `npm run build`
     - Publish directory: `dist`
   - 点击 "Deploy site"

3. **访问应用**
   - Netlify 会提供一个 URL（例如：`your-project.netlify.app`）

---

## 方法 3: Cloudflare Pages 部署

### 步骤：

1. **准备代码**（同上）

2. **在 Cloudflare Pages 部署**
   - 访问 [pages.cloudflare.com](https://pages.cloudflare.com)
   - 使用 GitHub 账号登录
   - 点击 "Create a project"
   - 选择你的 GitHub 仓库
   - 配置：
     - Framework preset: `Vite`
     - Build command: `npm run build`
     - Build output directory: `dist`
   - 点击 "Save and Deploy"

---

## 本地测试构建

在部署前，建议先在本地测试构建：

```bash
# 安装依赖（如果还没安装）
npm install

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

如果构建成功，`dist` 文件夹会包含所有静态文件。

---

## 环境变量（如果需要）

如果你的应用需要环境变量（如 API keys），在部署平台设置：

### Vercel:
- 项目设置 → Environment Variables
- 添加变量并重新部署

### Netlify:
- Site settings → Build & deploy → Environment
- 添加变量并重新部署

---

## 常见问题

### 1. 路由问题
如果使用 React Router，确保添加了 `vercel.json` 中的 rewrites 配置（已包含）。

### 2. 构建失败
- 检查 `package.json` 中的构建脚本
- 确保所有依赖都已安装
- 查看构建日志中的错误信息

### 3. 钱包连接问题
- 确保部署的 URL 是 HTTPS（Vercel/Netlify 自动提供）
- 某些钱包需要 HTTPS 才能连接

---

## 快速部署命令（Vercel CLI）

如果你想使用命令行部署：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目目录运行
vercel

# 生产环境部署
vercel --prod
```

---

## 推荐方案

**对于团队协作，推荐使用 Vercel：**
- 最简单易用
- 自动部署（每次 push 代码）
- 可以添加队友为协作者
- 提供预览部署（PR 时自动部署预览版本）

