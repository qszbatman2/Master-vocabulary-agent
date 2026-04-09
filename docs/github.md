# GitHub 代码仓库配置完整指南

本指南详细介绍了 Coze 编程项目如何配置和使用 GitHub 代码仓库，包括密钥管理、Webhook 配置、Git 操作等完整流程。

---

## 📑 目录

1. [概述](#1-概述)
2. [GitHub 密钥类型详解](#2-github-密钥类型详解)
3. [用户需要提供的信息](#3-用户需要提供的信息)
4. [配置步骤](#4-配置步骤)
5. [实现方案](#5-实现方案)
6. [使用流程](#6-使用流程)
7. [常见问题](#7-常见问题)
8. [安全最佳实践](#8-安全最佳实践)
9. [快速开始模板](#9-快速开始模板)

---

## 1. 概述

### 1.1 工作原理

```
用户/AI 开发代码
    ↓
Git 提交 (commit)
    ↓
推送到 GitHub (push)
    ↓
GitHub 触发 Webhook
    ↓
沙箱接收 Webhook 请求
    ↓
执行 git pull
    ↓
热更新生效
```

### 1.2 核心组件

| 组件 | 位置 | 作用 |
|------|------|------|
| **Git 仓库** | `/workspace/projects/.git` | 版本控制 |
| **GitHub 仓库** | GitHub.com | 远程代码托管 |
| **Webhook API** | `src/app/api/webhook/github/route.ts` | 接收 GitHub 推送通知 |
| **项目配置** | `.coze` | 声明 git 依赖 |
| **环境变量** | 运行时环境 | 动态配置 |

---

## 2. GitHub 密钥类型详解

### 2.1 Personal Access Token (PAT) ⭐

#### 📌 用途
- 访问**私有仓库**
- 通过 HTTPS 协议进行 git 操作
- 授权第三方应用访问 GitHub

#### 🔑 如何生成

**步骤 1：进入 Token 生成页面**
```
GitHub → Settings (右上角头像)
  → Developer settings
  → Personal access tokens
  → Tokens (classic)
  → Generate new token (classic)
```

**步骤 2：设置权限**

| 权限 | 说明 | 是否必须 |
|------|------|---------|
| `repo` | 完整仓库访问权限 | ✅ 必须 |

**步骤 3：设置过期时间**
- 推荐：30 天、60 天、90 天

**步骤 4：复制 Token**
```
Token 只显示一次，请立即复制保存！
```

#### 📝 Token 格式
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### ✅ 使用场景

| 仓库类型 | 是否需要 PAT | 说明 |
|---------|-------------|------|
| **公开仓库** | ❌ 不需要 | 可直接访问 |
| **私有仓库** | ✅ 必须 | 需要 Token 认证 |

#### 🔧 使用方式

**方式 1：直接在 URL 中**
```bash
git remote set-url origin https://ghp_TOKEN@github.com/user/repo.git
```

**方式 2：Git Credential Store（推荐）**
```bash
git config --global credential.helper store
git pull origin main  # 会提示输入 Token
```

---

### 2.2 Webhook Secret 🔒

#### 📌 用途
- 验证 Webhook 请求的真实性
- 防止恶意请求伪造

#### 🔑 如何生成

**重要提示：这不是 GitHub 生成的，而是你自己设置的！**

**推荐格式：**
```
coze-webhook-2024
my-project-secret-key-xyz123
```

**生成建议：**
- 长度：至少 16 位
- 包含：字母、数字、特殊字符
- 唯一性：不同项目使用不同的 Secret

#### 📝 配置位置

**GitHub 端：**
```
GitHub 仓库 → Settings → Webhooks → Add webhook → Secret 字段
```

**沙箱环境变量：**
```bash
GITHUB_WEBHOOK_SECRET=coze-webhook-2024
```

**代码中：**
```typescript
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'coze-webhook-2024';
```

#### ✅ 使用场景

| 场景 | 是否需要 Webhook Secret |
|------|------------------------|
| **需要自动同步** | ✅ 必须 |
| **手动同步即可** | ❌ 不需要 |

---

### 2.3 密钥对比表

| 密钥类型 | 生成方 | 适用仓库类型 | 必须性 | 安全性 |
|---------|--------|------------|--------|--------|
| **Personal Access Token** | GitHub | 私有 | 必须 | ⭐⭐⭐⭐ |
| **Webhook Secret** | 用户自定义 | 所有（需 Webhook） | 推荐 | ⭐⭐⭐⭐ |
| **SSH Key** | 本地生成 | 所有 | 可选 | ⭐⭐⭐⭐⭐ |

---

## 3. 用户需要提供的信息

### 3.1 核心信息清单

#### 场景 A：公开仓库 + 需要 Webhook 自动同步

```
✅ 仓库地址：https://github.com/username/project.git
✅ 仓库类型：公开
✅ 分支名称：main
✅ Webhook Secret：coze-webhook-2024（你自己设置的）

❌ Personal Access Token：不需要
```

#### 场景 B：私有仓库 + 需要 Webhook 自动同步

```
✅ 仓库地址：https://github.com/username/project.git
✅ 仓库类型：私有
✅ 分支名称：main
✅ Webhook Secret：coze-webhook-2024
✅ Personal Access Token：ghp_xxxxxxxxxxxxxxxxxxxxxxx（GitHub 生成）
```

### 3.2 信息提交模板

```
========================================
GitHub 仓库配置信息
========================================

【仓库信息】
- 仓库地址：https://github.com/username/project.git
- 仓库类型：公开 / 私有
- 分支名称：main

【Webhook 配置】（如果需要自动同步）
- Webhook Secret：coze-webhook-2024
- 是否需要自动同步：是 / 否

【认证信息】（私有仓库必须提供）
- Personal Access Token：ghp_xxxxxxxxxxxxxxxxxxxxxxx

【其他需求】
- 是否需要初始化 Git 仓库：是 / 否
- 是否需要配置 CI/CD：是 / 否

========================================
```

---

## 4. 配置步骤

### 4.1 首次配置完整流程

#### 步骤 1：检查现有 Git 配置

```bash
cd /workspace/projects
ls -la .git
```

#### 步骤 2：初始化 Git 仓库（如需要）

```bash
cd /workspace/projects
git init
git config user.name "your-username"
git config user.email "your-email@example.com"
```

#### 步骤 3：添加 GitHub 远程仓库

**公开仓库：**
```bash
git remote add origin https://github.com/username/project.git
```

**私有仓库：**
```bash
git remote add origin https://ghp_TOKEN@github.com/username/project.git
```

#### 步骤 4：创建 Webhook API（如果需要）

创建文件：`src/app/api/webhook/github/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execAsync = promisify(exec);
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'coze-webhook-2024';

function verifySignature(payload: string, signature: string): boolean {
  if (!signature.startsWith('sha256=')) return false;
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature.slice(7) === expectedSignature;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || '';
  
  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const eventType = request.headers.get('x-github-event') || '';
  const data = JSON.parse(payload);
  
  if (eventType !== 'push') {
    return NextResponse.json({ message: `Ignored event: ${eventType}` });
  }
  
  const ref = data.ref || '';
  if (!ref.endsWith('/main') && !ref.endsWith('/master')) {
    return NextResponse.json({ message: `Ignored branch: ${ref}` });
  }
  
  const { stdout } = await execAsync('git pull origin main', {
    cwd: process.env.COZE_WORKSPACE_PATH || '/workspace/projects',
    timeout: 60000,
  });
  
  return NextResponse.json({ success: true, output: stdout });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'GitHub Webhook is ready' });
}
```

#### 步骤 5：在 GitHub 配置 Webhook

1. GitHub 仓库 → Settings → Webhooks → Add webhook
2. 填写配置：

| 字段 | 值 |
|------|-----|
| **Payload URL** | `https://<沙箱域名>/api/webhook/github` |
| **Content type** | `application/json` |
| **Secret** | `coze-webhook-2024` |
| **Which events** | `Just the push event` |
| **Active** | ✅ 勾选 |

---

## 5. 实现方案

### 5.1 核心架构

```
用户/AI 开发代码
    ↓
git add + git commit
    ↓
git push
    ↓
GitHub 仓库
    ↓
触发 Webhook
    ↓
沙箱 /api/webhook/github
    ↓
git pull + 热更新
```

---

## 6. 使用流程

### 6.1 日常开发流程

```
用户：需求描述
  ↓
AI：修改代码
  ↓
AI：验证代码
  ↓
AI：done({ commit_msg: "xxx" })
  ↓
用户：git add
  ↓
用户：git commit
  ↓
用户：git push
  ↓
GitHub：触发 Webhook
  ↓
沙箱：自动 git pull
  ↓
完成：代码同步
```

---

## 7. 常见问题

### 7.1 Git 配置问题

#### ❌ fatal: not a git repository
```bash
cd /workspace/projects
git init
git config user.name "username"
git config user.email "email@example.com"
```

#### ❌ fatal: could not read Username
```bash
git remote set-url origin https://ghp_TOKEN@github.com/user/repo.git
```

---

### 7.2 Webhook 问题

#### ❌ Invalid signature
- 检查 Secret 是否一致
- 区分大小写

#### ❌ Webhook 未触发
- 检查 Payload URL
- 检查事件类型
- 检查 Active 是否勾选

---

## 8. 安全最佳实践

### 8.1 Token 安全

✅ **推荐：**
- 使用最小权限
- 设置过期时间（30-90天）
- 定期更换
- 使用环境变量

❌ **避免：**
- 分享给他人
- 硬编码在代码中
- 使用无过期时间的 Token

### 8.2 Webhook Secret 安全

✅ **推荐：**
- 使用强密码（16位以上）
- 唯一性
- 环境变量配置

❌ **避免：**
- 硬编码
- 使用默认值
- 与其他服务共用

---

## 9. 快速开始模板

### 9.1 用户信息提交模板

```
========================================
GitHub 仓库配置申请
========================================

【基本信息】
- 你的 GitHub 用户名：_________________
- 项目名称：_________________
- 项目描述：_________________

【仓库信息】
- 仓库地址：https://github.com/username/project.git
- 仓库类型：☐ 公开  ☐ 私有
- 主分支名称：_________________（默认：main）

【Webhook 配置】
- 是否需要自动同步：☐ 是  ☐ 否
- Webhook Secret：_________________

【认证信息】（私有仓库必须提供）
- Personal Access Token：ghp_xxxxxxxxxxxxxxxxxxxxxxx

【其他需求】
- ☐ 需要初始化 Git 仓库
- ☐ 需要配置 CI/CD

========================================
```

### 9.2 检查清单

配置完成后验证：

```
□ .git 目录存在
□ .git/config 配置正确
□ git remote -v 显示正确的 remote
□ Webhook API 文件存在
□ GET /api/webhook/github 返回 200
□ GitHub Webhook 配置正确
□ git pull 成功
```

---

## 10. 附录

### 10.1 常用 Git 命令

| 命令 | 说明 |
|------|------|
| `git status` | 查看状态 |
| `git add .` | 添加文件 |
| `git commit -m "xxx"` | 提交更改 |
| `git push` | 推送到远程 |
| `git pull` | 拉取远程更改 |
| `git log --oneline -10` | 查看提交历史 |

### 10.2 环境变量参考

```bash
# Coze 自动配置
COZE_WORKSPACE_PATH=/workspace/projects
COZE_PROJECT_DOMAIN_DEFAULT=https://xxx.dev.coze.site
DEPLOY_RUN_PORT=5000

# GitHub 相关
GITHUB_WEBHOOK_SECRET=coze-webhook-2024
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxx
```

---

## 11. 总结

### 核心要点

1. **密钥类型**
   - Personal Access Token：私有仓库必须
   - Webhook Secret：自动同步推荐

2. **用户需要提供**
   - 仓库地址（必填）
   - 仓库类型（公开/私有）
   - Webhook Secret（如需自动同步）
   - Personal Access Token（私有仓库）

3. **AI 自动完成**
   - 初始化/配置 Git 仓库
   - 添加远程仓库
   - 创建 Webhook API
   - 测试连接

4. **用户手动操作**
   - 在 GitHub 配置 Webhook
   - 执行 `git commit`
   - 执行 `git push`

---

**以上就是 Coze 编程项目使用 GitHub 代码仓库的完整指南！** 🎉
