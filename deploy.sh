#!/bin/bash

# 快速部署脚本
# 这个脚本会帮你准备代码并推送到 GitHub

echo "🚀 准备部署 Predictive Horizon..."
echo ""

# 检查是否已初始化 Git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    echo "✅ Git 仓库已初始化"
else
    echo "✅ Git 仓库已存在"
fi

# 添加所有文件
echo "📝 添加文件到 Git..."
git add .

# 检查是否有未提交的更改
if git diff --staged --quiet; then
    echo "ℹ️  没有新的更改需要提交"
else
    echo "💾 提交更改..."
    git commit -m "Ready for deployment"
    echo "✅ 更改已提交"
fi

echo ""
echo "✅ 准备完成！"
echo ""
echo "📋 下一步："
echo "1. 在 GitHub 创建新仓库（如果还没有）"
echo "2. 运行以下命令推送代码："
echo "   git remote add origin <your-github-repo-url>"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 然后访问 https://vercel.com 部署"
echo ""
echo "或者直接运行："
echo "   npm i -g vercel"
echo "   vercel"
echo ""

