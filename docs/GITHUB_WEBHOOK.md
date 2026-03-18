# GitHub Webhook 自动部署配置指南

本文档介绍如何配置 GitHub Webhook，实现代码推送后沙箱环境自动同步更新。

## 一、工作原理

```
本地提交 → GitHub Push → Webhook 触发 → 沙箱 API 接收 → git pull → 热更新生效
```

## 二、配置步骤

### 2.1 获取 Webhook URL

Webhook 接收地址：

```
https://<你的沙箱域名>/api/webhook/github
```

示例：
```
https://1555923d-048a-4770-9aeb-684f6b5716a7.dev.coze.site/api/webhook/github
```

### 2.2 在 GitHub 配置 Webhook

1. 打开 GitHub 仓库页面
2. 点击 **Settings** → **Webhooks** → **Add webhook**
3. 填写配置：

| 字段 | 值 |
|------|-----|
| **Payload URL** | `https://<沙箱域名>/api/webhook/github` |
| **Content type** | `application/json` |
| **Secret** | `coze-webhook-2024` (或自定义，需同步更新环境变量) |
| **Which events** | 选择 `Just the push event` |
| **Active** | ✅ 勾选 |

4. 点击 **Add webhook** 保存

### 2.3 配置环境变量（可选）

如果要使用自定义密钥，在沙箱环境设置：

```bash
GITHUB_WEBHOOK_SECRET=your-custom-secret
```

## 三、验证配置

### 3.1 测试 Webhook 连通性

```bash
# 健康检查
curl https://<沙箱域名>/api/webhook/github

# 预期响应
{
  "status": "ok",
  "message": "GitHub Webhook endpoint is ready",
  "timestamp": "2026-03-18T..."
}
```

### 3.2 测试自动同步

1. 本地修改代码并提交
2. 推送到 GitHub：`git push origin main`
3. 查看 GitHub Webhook 详情页的 "Recent Deliveries"
4. 确认沙箱环境已更新

## 四、Webhook 安全机制

### 4.1 签名验证

每个 Webhook 请求都包含 `X-Hub-Signature-256` 头：

```
X-Hub-Signature-256: sha256=<hmac_signature>
```

服务器会验证签名，确保请求来自 GitHub。

### 4.2 事件过滤

只处理以下事件：
- `push` - 代码推送事件
- 分支：`main` 或 `master`

其他事件（如 `pull_request`、`issues`）会被忽略。

## 五、故障排查

### 5.1 Webhook 未触发

检查项：
- [ ] GitHub Webhook 配置是否正确
- [ ] Payload URL 是否可访问
- [ ] 事件类型是否为 `push`
- [ ] 分支是否为 `main` 或 `master`

### 5.2 签名验证失败

```
错误：Invalid signature
```

解决方案：
1. 确认 GitHub Webhook 的 Secret 配置
2. 确认环境变量 `GITHUB_WEBHOOK_SECRET` 是否一致
3. 默认密钥为 `coze-webhook-2024`

### 5.3 Git Pull 失败

```
错误：fatal: could not read Username
```

可能原因：
- 沙箱环境 Git 凭证未配置
- 仓库为私有仓库

解决方案：
- 对于公开仓库，直接 pull 即可
- 对于私有仓库，需要配置 SSH 密钥或访问令牌

## 六、手动触发同步

如果 Webhook 未生效，可以手动触发：

```bash
# 方式 1: 通过 API 触发（需要签名）
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{"ref":"refs/heads/main"}' \
  https://<沙箱域名>/api/webhook/github

# 方式 2: 让 AI 助手执行
# 在对话中说："帮我拉取最新代码"
```

## 七、配置截图参考

### GitHub Webhook 配置页面

```
+--------------------------------------------------+
| Add webhook                                      |
+--------------------------------------------------+
| Payload URL                                      |
| https://xxx.dev.coze.site/api/webhook/github    |
|                                                  |
| Content type                                     |
| application/json                        [下拉]  |
|                                                  |
| Secret                                           |
| coze-webhook-2024                               |
|                                                  |
| Which events would you like to trigger this...  |
| (•) Just the push event                         |
| ( ) Send me everything                          |
| ( ) Let me select individual events             |
|                                                  |
| Active                                           |
| [✓]                                             |
|                                                  |
|               [Add webhook]                      |
+--------------------------------------------------+
```

## 八、API 响应示例

### 成功响应

```json
{
  "success": true,
  "message": "Successfully pulled latest changes",
  "pulled": true,
  "commits": [
    {
      "message": "feat: 添加新功能",
      "author": "username"
    }
  ],
  "output": "Updating 832a79a..61150f3..."
}
```

### 忽略响应

```json
{
  "message": "Ignored branch: refs/heads/develop"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "fatal: not a git repository"
}
```
