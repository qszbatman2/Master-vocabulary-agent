# 远程部署更新 API 使用说明

## 概述
此 API 允许从本地电脑远程部署和更新沙箱环境代码，无需手动登录服务器。

## 认证方式
所有请求都需要在 `Authorization` header 中携带管理员密钥：
```
Authorization: Bearer coze-admin-2024
```

## API 端点

### 1. 查询状态 (GET 或 POST)

**端点：** `GET/POST /api/deploy/update`

**请求头：**
```
Content-Type: application/json
Authorization: Bearer coze-admin-2024
```

**请求体（POST）：**
```json
{
  "action": "status"
}
```

**响应示例：**
```json
{
  "success": true,
  "action": "status",
  "branch": "main",
  "recentCommits": [
    "748fc82 feat: 添加远程部署更新API接口",
    "b861dbf fix: 修复例句挖空模式API调用错误",
    "c0ee47f [Trae] Update stats dashboard visuals"
  ],
  "workingTreeClean": true,
  "statusOutput": "Working tree clean"
}
```

### 2. 拉取最新代码 (POST)

**端点：** `POST /api/deploy/update`

**请求头：**
```
Content-Type: application/json
Authorization: Bearer coze-admin-2024
```

**请求体：**
```json
{
  "action": "pull",
  "branch": "main"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "Successfully pulled latest changes",
  "action": "pull",
  "branch": "main",
  "output": "Current branch main is up to date.\n",
  "stderr": "From https://github.com/qszbatman2/Master-vocabulary-agent\n * branch            main       -> FETCH_HEAD\n",
  "recentCommits": [
    "748fc82 feat: 添加远程部署更新API接口",
    "b861dbf fix: 修复例句挖空模式API调用错误",
    "c0ee47f [Trae] Update stats dashboard visuals"
  ]
}
```

## 使用示例

### 1. 查询当前状态

**curl 命令：**
```bash
curl -X POST https://your-domain.com/api/deploy/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer coze-admin-2024" \
  -d '{"action":"status"}'
```

**PowerShell 命令：**
```powershell
$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer coze-admin-2024"
}
$body = @{
  "action" = "status"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-domain.com/api/deploy/update" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

### 2. 拉取最新代码

**curl 命令：**
```bash
curl -X POST https://your-domain.com/api/deploy/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer coze-admin-2024" \
  -d '{"action":"pull"}'
```

**PowerShell 命令：**
```powershell
$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer coze-admin-2024"
}
$body = @{
  "action" = "pull"
  "branch" = "main"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-domain.com/api/deploy/update" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

### 3. 创建快捷脚本（推荐）

**Bash 脚本 (`deploy.sh`)：**
```bash
#!/bin/bash
DOMAIN="https://your-domain.com"
ADMIN_KEY="coze-admin-2024"

echo "🚀 开始部署..."

# 拉取最新代码
echo "📥 拉取最新代码..."
RESPONSE=$(curl -s -X POST "$DOMAIN/api/deploy/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d '{"action":"pull"}')

# 解析响应
SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
MESSAGE=$(echo $RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)

if [ "$SUCCESS" = "true" ]; then
  echo "✅ $MESSAGE"
  echo ""
  echo "📋 最近提交："
  echo "$RESPONSE" | grep -o '"recentCommits":\[[^]]*\]' | \
    sed 's/"recentCommits":\["//' | \
    sed 's/"\]//' | \
    sed 's/","/\n/g' | sed 's/"//g' | head -5
else
  echo "❌ 部署失败"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "🎉 部署完成！"
echo "请访问: $DOMAIN"
```

**PowerShell 脚本 (`deploy.ps1`)：**
```powershell
$Domain = "https://your-domain.com"
$AdminKey = "coze-admin-2024"

Write-Host "🚀 开始部署..." -ForegroundColor Cyan

try {
  Write-Host "📥 拉取最新代码..." -ForegroundColor Yellow

  $headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $AdminKey"
  }
  $body = @{
    "action" = "pull"
  } | ConvertTo-Json

  $response = Invoke-RestMethod -Uri "$Domain/api/deploy/update" `
    -Method Post `
    -Headers $headers `
    -Body $body

  if ($response.success) {
    Write-Host "✅ $($response.message)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 最近提交：" -ForegroundColor Cyan
    $response.recentCommits | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
    Write-Host ""
    Write-Host "🎉 部署完成！" -ForegroundColor Green
    Write-Host "请访问: $Domain" -ForegroundColor Yellow
  } else {
    Write-Host "❌ 部署失败" -ForegroundColor Red
    Write-Host $response.error -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "❌ 请求失败: $_" -ForegroundColor Red
  exit 1
}
```

## 错误处理

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 401 | 认证失败 | 检查管理员密钥是否正确 |
| 400 | 请求参数错误 | 检查 action 参数是否有效 |
| 500 | 服务器错误 | 查看服务器日志，可能需要手动处理 git 冲突 |

## 注意事项

1. **工作目录必须干净**：如果工作目录有未提交的更改，pull 操作会失败
2. **自动热更新**：Next.js 会自动检测代码变化并热更新，无需手动重启
3. **分支指定**：默认拉取 `main` 分支，可以指定其他分支
4. **安全性**：请勿将管理员密钥泄露给他人

## 环境变量

如需修改管理员密钥，请在环境变量中设置：
```bash
ADMIN_KEY=your-secret-key
```

## 示例域名

- 开发环境：`https://abc123.dev.coze.site`（请替换为实际域名）
- 生产环境：根据实际部署域名

---

**最后更新：** 2026-03-28
