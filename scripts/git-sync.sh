#!/bin/bash
# Git静默同步脚本 - 节省token
# 用法: ./scripts/git-sync.sh "[Coze]type: description"
# 输出: 仅一行状态

cd "${COZE_WORKSPACE_PATH:-/workspace/projects}"

# 获取提交信息
MSG="${1:-[Coze]chore: auto sync}"

# 确保有 [Coze] 前缀
if [[ ! "$MSG" =~ ^\[Coze\] ]]; then
    MSG="[Coze]$MSG"
fi

# 检查是否有变更
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
    echo "✓ 无变更"
    exit 0
fi

# 执行提交
git add -A
git commit -m "$MSG"
git push origin main

HASH=$(git rev-parse --short HEAD)
echo "✓ $HASH $MSG"
