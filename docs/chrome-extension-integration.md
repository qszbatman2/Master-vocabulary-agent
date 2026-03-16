# Chrome 插件对接指南

主站域名：`https://8qcfzhhw7t.coze.site`

本文档面向 **Chrome 插件开发方**，说明主站已提供的 API、请求格式、返回结构以及插件端需要完成的开发工作。

---

## 一、主站已提供的 API

### 1. 登录认证

#### `POST /api/auth/login`

用户登录，获取 token。

**请求：**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "your-password"
}
```

**成功响应：**
```json
{
  "message": "登录成功",
  "user": {
    "id": 123,
    "email": "you@example.com",
    "nickname": "用户昵称",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "MTIzOjE3MDYwNzY4MDAwMDA="
}
```

**错误响应：**
- `400`：邮箱和密码不能为空
- `401`：邮箱或密码错误

**插件端需要做的：**
- 在 Popup 中提供邮箱/密码输入表单
- 登录成功后将 `token` 存储到 `chrome.storage.local`
- 后续所有请求携带 `Authorization: Bearer <token>` Header

---

#### `GET /api/auth/me`

验证 token 是否有效，获取用户信息。

**请求：**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**成功响应：**
```json
{
  "id": 123,
  "email": "you@example.com",
  "nickname": "用户昵称",
  "user": {
    "id": 123,
    "email": "you@example.com",
    "nickname": "用户昵称",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login_at": "2024-01-15T12:00:00Z"
  }
}
```

**错误响应：**
- `401`：未登录 / token 无效 / 用户不存在

**插件端需要做的：**
- Popup 打开时调用此接口验证登录状态
- 若返回 401，清除本地存储的 token，显示登录表单

---

### 2. 文章解析预览

#### `POST /api/article-import/preview`

解析文本，返回 token 列表供插件渲染。

**请求：**
```http
POST /api/article-import/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "网页标题或URL（可选）",
  "content": "用户选中的英文文本..."
}
```

**限制：**
- `content` 最大长度：**20,000 字符**
- 超过限制返回 `413` 错误

**成功响应：**
```json
{
  "success": true,
  "tokens": [
    {
      "text": "The",
      "index": 0,
      "isWord": true,
      "lemma": "the",
      "inVocabulary": false,
      "sentence": "The quick brown fox jumps."
    },
    {
      "text": " ",
      "index": 1,
      "isWord": false
    },
    {
      "text": "quick",
      "index": 2,
      "isWord": true,
      "lemma": "quick",
      "inVocabulary": true,
      "sentence": "The quick brown fox jumps."
    }
  ],
  "sentenceCount": 3,
  "wordCount": 25
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `tokens[].text` | string | 原文文本，用于渲染 |
| `tokens[].index` | number | token 序号，点击选择时使用 |
| `tokens[].isWord` | boolean | 是否为可点击单词（标点/空白为 false） |
| `tokens[].lemma` | string? | 词形还原结果（仅单词有） |
| `tokens[].inVocabulary` | boolean | 该词是否已在全局词库中存在 |
| `tokens[].sentence` | string? | 所在句子上下文（用于后续保存） |

**错误响应：**
- `400`：content 为空
- `401`：未登录
- `413`：content 超过长度限制

**插件端需要做的：**
- 渲染 token 列表，保留原始格式（空格、换行）
- `isWord=true` 的 token 渲染为可点击元素
- `inVocabulary=true` 的 token 用绿色显示（表示已在词库）
- 点击单词时记录其 `index`、`lemma`、`sentence`

---

### 3. 提交保存

#### `POST /api/article-import/commit`

提交选中的生词，写入数据库。

**请求：**
```http
POST /api/article-import/commit
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "网页标题或URL（可选）",
  "content": "原始选区文本...",
  "selectedWords": [
    {
      "text": "running",
      "lemma": "run",
      "context": "I was running late for the meeting.",
      "tokenIndex": 12,
      "setPrimary": true
    },
    {
      "text": "jumps",
      "lemma": "jump",
      "context": "The quick brown fox jumps over the lazy dog.",
      "tokenIndex": 5,
      "setPrimary": true
    }
  ]
}
```

**请求字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 否 | 来源标题（网页标题或URL） |
| `content` | string | 是 | 原始文本内容 |
| `selectedWords` | array | 是 | 选中的单词列表 |
| `selectedWords[].text` | string | 是 | 原词形式 |
| `selectedWords[].lemma` | string | 是 | 词根（来自 preview 返回） |
| `selectedWords[].context` | string | 是 | 上下文句子（来自 preview 返回） |
| `selectedWords[].tokenIndex` | number | 是 | token 序号（来自 preview 返回） |
| `selectedWords[].setPrimary` | boolean | 否 | 是否设为主例句，默认 true |

**限制：**
- `content` 最大长度：**20,000 字符**
- `selectedWords` 最大数量：**200 个**
- 超过限制返回 `413` 错误

**成功响应：**
```json
{
  "success": true,
  "message": "成功添加 2 个单词",
  "sourceId": 123,
  "results": [
    {
      "word": "running",
      "lemma": "run",
      "status": "created",
      "wordId": 456
    },
    {
      "word": "jumps",
      "lemma": "jump",
      "status": "exists",
      "wordId": 789
    }
  ]
}
```

**status 字段说明：**

| 状态 | 说明 |
|------|------|
| `created` | 新词，已创建词条并关联用户 |
| `linked` | 词库已有，首次关联到用户 |
| `exists` | 用户已有该词记录，仅添加了新例句 |

**错误响应：**
- `400`：参数缺失
- `401`：未登录
- `413`：超过长度限制

**插件端需要做的：**
- 收集用户选中的所有单词信息
- 发送 commit 请求
- 显示成功/失败提示
- 可选：展示 `results` 中各词的处理状态

---

## 二、CORS 配置

主站已配置 CORS，支持 Chrome 插件跨域请求：

```http
Access-Control-Allow-Origin: chrome-extension://<extension-id>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

**插件端无需额外处理跨域问题。**

---

## 三、插件开发方开发清单

### 必须完成的功能

#### 1. 登录模块
- [ ] Popup 登录表单（邮箱 + 密码）
- [ ] 调用 `POST /api/auth/login` 获取 token
- [ ] 将 token 存储到 `chrome.storage.local`
- [ ] 登录成功后显示用户信息

#### 2. 登录状态验证
- [ ] Popup 打开时调用 `GET /api/auth/me`
- [ ] token 有效：显示主功能界面
- [ ] token 无效：显示登录表单

#### 3. 文本选择与解析
- [ ] 监听用户选中文本（右键菜单 / 快捷键 / Popup 按钮）
- [ ] 获取选中文本内容
- [ ] 调用 `POST /api/article-import/preview`
- [ ] 渲染 token 列表（保留格式）

#### 4. 单词选择交互
- [ ] 点击单词切换选中状态
- [ ] 已选中单词显示视觉反馈（高亮/标记）
- [ ] `inVocabulary=true` 的单词用绿色显示
- [ ] 显示已选数量统计

#### 5. 提交保存
- [ ] 收集选中单词的信息（text, lemma, context, tokenIndex）
- [ ] 调用 `POST /api/article-import/commit`
- [ ] 显示成功/失败提示
- [ ] 清空选择状态，准备下一次添加

### 可选功能

#### 6. 来源信息
- [ ] 自动获取当前页面标题
- [ ] 自动获取当前页面 URL
- [ ] 作为 `title` 字段传递

#### 7. 错误处理
- [ ] 网络错误提示
- [ ] 413 错误（文本过长）提示
- [ ] 401 错误自动跳转登录

#### 8. 用户体验优化
- [ ] 加载动画
- [ ] 批量选择/取消选择
- [ ] 预览已选单词列表
- [ ] 本地缓存 token

---

## 四、完整交互流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        插件交互流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 用户打开 Popup                                               │
│     ↓                                                           │
│  2. 调用 GET /api/auth/me                                       │
│     ├─ 200：显示主界面                                           │
│     └─ 401：显示登录表单                                         │
│                                                                 │
│  3. 用户在网页选中文本                                           │
│     ↓                                                           │
│  4. 调用 POST /api/article-import/preview                       │
│     ↓                                                           │
│  5. 渲染 token 列表                                              │
│     - 绿色：已存在词库                                           │
│     - 白色：新词                                                 │
│     ↓                                                           │
│  6. 用户点击单词选择生词                                          │
│     ↓                                                           │
│  7. 点击「添加」按钮                                              │
│     ↓                                                           │
│  8. 调用 POST /api/article-import/commit                        │
│     ↓                                                           │
│  9. 显示成功提示，清空选择                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、API 请求示例代码

### JavaScript (fetch)

```javascript
// 登录
async function login(email, password) {
  const response = await fetch('https://8qcfzhhw7t.coze.site/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (response.ok) {
    chrome.storage.local.set({ token: data.token });
    return data;
  }
  throw new Error(data.error);
}

// 验证登录状态
async function checkAuth() {
  const { token } = await chrome.storage.local.get('token');
  if (!token) return null;
  
  const response = await fetch('https://8qcfzhhw7t.coze.site/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.ok) {
    return await response.json();
  }
  chrome.storage.local.remove('token');
  return null;
}

// 解析文章
async function previewContent(content, title) {
  const { token } = await chrome.storage.local.get('token');
  const response = await fetch('https://8qcfzhhw7t.coze.site/api/article-import/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, title })
  });
  return await response.json();
}

// 提交生词
async function commitWords(content, title, selectedWords) {
  const { token } = await chrome.storage.local.get('token');
  const response = await fetch('https://8qcfzhhw7t.coze.site/api/article-import/commit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, title, selectedWords })
  });
  return await response.json();
}
```

---

## 六、常见问题

### Q1: token 有效期是多久？
目前 token 没有设置过期时间，但建议插件端在 `GET /api/auth/me` 返回 401 时重新登录。

### Q2: `inVocabulary` 是指用户已有该词，还是全局词库已有？
当前实现是 **全局词库已有**，即 `words` 表中存在该词条。若需要区分「用户已有」vs「全局已有」，请反馈。

### Q3: 主例句（is_primary）是如何处理的？
- 若 `setPrimary=true`（默认）：新例句会成为主例句，之前的例句变为非主例句
- 若 `setPrimary=false`：仅添加例句，不改变主例句

### Q4: 词库中没有的词如何处理？
主站会自动创建词条，`meaning` 字段设为「待补充释义」，用户后续可在主站编辑。

### Q5: 选中文本过长怎么办？
超过 20,000 字符会返回 413 错误，插件应提示用户选择较短的文本。

---

## 七、联系方式

如有 API 问题或需要新增接口，请联系主站开发团队。
