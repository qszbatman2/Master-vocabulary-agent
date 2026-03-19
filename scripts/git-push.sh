#!/bin/bash
# Git自动提交脚本
# 用法: ./scripts/git-push.sh "commit message"
# 提交信息格式: [Coze]type: description

set -e

# 获取提交信息
COMMIT_MSG="${1:-chore: auto commit}"

# 添加 [Coze] 前缀（如果还没有）
if [[ ! "$COMMIT_MSG" =~ ^\[Coze\] ]]; then
    COMMIT_MSG="[Coze]$COMMIT_MSG"
fi

# 进入项目目录
cd "${COZE_WORKSPACE_PATH:-/workspace/projects}"

# 检查是否有变更
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ 没有需要提交的变更"
    exit 0
fi

# 显示变更文件
echo "📋 变更文件:"
git status --short

# 添加所有变更
git add -A

# 提交
git commit -m "$COMMIT_MSG"

# 推送
echo "🚀 推送到远程仓库..."
git push origin main

echo "✅ 提交成功: $COMMIT_MSG"
