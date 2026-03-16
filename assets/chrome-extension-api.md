# Chrome Extension ↔ 主站对接确认清单（必须确认）

主站域名：`https://8qcfzhhw7t.coze.site`

本文面向“主站后端/前端负责人”，说明 Chrome 插件为什么需要这些能力、如果不支持会发生什么、以及需要主站提供哪些 API/返回结构/行为约束。目标是让插件端实现可稳定上线、并确保数据能进入现有背单词/练习链路。

## 0. 前因后果（为什么必须主站配合）

Chrome 插件本质是“外部采集入口”，负责：

- 从任意网页中读取用户选区文本（用户主动触发）
- 调主站接口做解析预览（tokenize + 词形还原 + 上下文提取 + 词库关联检测）
- 用户在插件里点选生词后，把结果写入主站数据库（落到用户账号）
- 回到主站练习时，优先使用用户收录的例句上下文展示

插件无法直接写 Supabase，也不应直接访问数据库；必须通过主站 API：

- 统一鉴权（归属到 user_id）
- 统一解析逻辑（tokenize、lemmatize、sentence extraction 的一致性）
- 统一数据落库（`user_text_sources / user_word_contexts / user_word_status`）

## 1. 域名与跨域（CORS）要求

插件的请求发起源为 `chrome-extension://<extension-id>`，与主站域名不同。主站需要允许插件 origin 访问用户侧 API。

必须满足：

- 允许 `Authorization` Header
- 允许 `Content-Type: application/json`
- 允许 `POST/GET/OPTIONS`

建议：

- 对允许的 origin 做白名单（插件正式发布后固定 extension id，再加到白名单）
- 所有写入接口必须校验 Bearer token，禁止匿名写入

## 2. 认证（必须）

插件不能读取主站网页的 localStorage/cookie；因此插件需要独立登录拿 token，并以 Bearer token 调用后续接口。

### 2.1 `POST /api/auth/login`

用途：
- 用户在插件 Popup 里输入邮箱/密码登录
- 主站返回 token，插件存储到 `chrome.storage.local`

请求：

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "..."
}
```

返回（必须至少包含 token）：

```json
{
  "token": "base64(userId:...)" 
}
```

兼容返回（可选）：

```json
{ "data": { "token": "..." } }
```

错误返回（建议）：

- `401`：账号或密码错误
- `429`：尝试次数过多

### 2.2 `GET /api/auth/me`

用途：
- 插件启动/打开 Popup 时校验 token 是否有效
- token 失效则回到登录态

请求：

```http
GET /api/auth/me
Authorization: Bearer <token>
```

返回（字段可自由，但必须 200 表示有效）：

```json
{
  "id": 123,
  "email": "you@example.com",
  "nickname": "..."
}
```

错误返回：

- `401`：token 无效/过期

## 3. 文章导入：预览解析（强烈建议支持）

插件的“段落点词选择”交互需要主站返回 token 列表（带 lemma、句子上下文、是否已存在词库等）。插件端可以做本地解析兜底，但最终以主站返回为准，确保与移动端/主站导入行为一致。

### 3.1 `POST /api/article-import/preview`

用途：
- 输入一段英文文本（通常来自网页选区）
- 返回 token 列表，供插件渲染为可点击单词
- 提供 `sentenceCount/wordCount` 作为 UI 元信息

请求：

```http
POST /api/article-import/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "网页标题 (url)",
  "content": "用户选区文本..."
}
```

返回（必须字段）：

```json
{
  "success": true,
  "tokens": [
    {
      "text": "running",
      "index": 12,
      "isWord": true,
      "lemma": "run",
      "inVocabulary": false,
      "sentence": "I was running late for the meeting."
    },
    { "text": " ", "index": 13, "isWord": false }
  ],
  "sentenceCount": 2,
  "wordCount": 17
}
```

字段解释（主站需保证语义）：

- `tokens[].text`：用于渲染原文
- `tokens[].index`：token 序号（稳定，点击选择用）
- `tokens[].isWord`：是否可点击选择（标点/空白必须为 false）
- `tokens[].lemma`：词形还原结果（小写）
- `tokens[].inVocabulary`：
  - 语义 A（推荐）：该 lemma 是否已在全局 `words` 表中存在
  - 语义 B（可选）：该用户是否已在 `user_word_status` 存在（更贴合“重复收录”）
  - 二者不同，务必确认到底是哪一种；否则 UI 的“已存在”提示会误导用户
- `tokens[].sentence`：该 token 所在句子上下文（用于提交时保存到 `user_word_contexts.context_text`）

失败返回（建议）：

- `400`：content 为空或过长
- `401`：未登录

## 4. 文章导入：提交写入（必须支持）

插件最终要把勾选结果落到用户账号下的待复习体系；必须有 commit 接口完成落库与去重策略。

### 4.1 `POST /api/article-import/commit`

用途：
- 创建来源文章（`user_text_sources`）
- 对每个选中的词：
  - 关联或创建全局词条 `words`（word=lemma）
  - upsert `user_word_status`（确保进入待复习）
  - 插入 `user_word_contexts`（保存上下文例句）
  - 设置优先例句（`is_primary=true`）或按策略更新

请求（插件发送）：

```http
POST /api/article-import/commit
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "网页标题 (url)",
  "content": "用户选区文本...",
  "selectedWords": [
    {
      "text": "running",
      "lemma": "run",
      "context": "I was running late for the meeting.",
      "tokenIndex": 12,
      "setPrimary": true
    }
  ]
}
```

主站需要确认的行为（关键）：

1. **如何识别“重复收录”**  
   - 以 `user_id + word_id` 是否已存在于 `user_word_status` 为准（推荐）
   - 或以 `user_id + word_id + context_text` 判断（更细，但会更复杂）

2. **重复收录时如何处理 `user_word_contexts.is_primary`**  
   插件目前发送 `setPrimary: true`，期望：
   - 新上下文写入，并将该词的主例句切到本次 context
   - 同时保证同一用户同一词只有 1 条 `is_primary=true`

   如果主站不希望默认覆盖主例句，需要主站返回“重复列表”让插件提示用户选择（见第 5 节）。

3. **是否允许全局 `words` 出现“释义为空”的词条**  
   插件/导入场景往往不会带释义；主站需确认：
   - 是否允许插入 `words(word=lemma, meaning=NULL/空)`；还是必须走管理员词库
   - 若不允许，需提供“用户私有词条表”或 `words` 的最小占位策略

返回（至少要有 success + message，可带结果列表）：

```json
{
  "success": true,
  "message": "成功添加 3 个单词",
  "sourceId": "uuid-or-number",
  "results": [
    { "lemma": "run", "status": "created|linked|exists", "wordId": 456 }
  ]
}
```

错误返回（建议）：

- `401`：未登录
- `413`：content 过长
- `429`：频率限制

## 5. 重复词选择（推荐支持一种即可）

插件 UI 目前未实现完整的“重复提示页”（可以补），但主站需要确认重复策略走哪条：

### 方案 A（主站自动策略，插件不选择）

- commit 永远成功落库
- `setPrimary=true` 时将主例句切换为最新 context
- 插件仅展示结果，无需额外交互

优点：插件最简单  
缺点：用户无法保留旧主例句

### 方案 B（主站返回 duplicates，插件提示用户选择）

需要在 commit 或新增接口返回如下结构：

```json
{
  "success": true,
  "needsResolve": true,
  "duplicates": [
    {
      "lemma": "run",
      "wordId": 456,
      "existingPrimaryContext": "He ran toward the exit.",
      "newContext": "I was running late for the meeting."
    }
  ],
  "sourceId": "..."
}
```

然后插件二次提交：

```json
{
  "sourceId": "...",
  "duplicateResolutions": [
    { "wordId": 456, "choose": "use_new|use_existing" }
  ]
}
```

优点：符合“用户选择哪段例句”为主例句  
缺点：主站与插件要实现二阶段提交

## 6. 练习/背单词侧融合（主站必须确认的展示策略）

插件导入完成后，用户的预期是“练习时优先显示我收录的例句上下文”。

因此主站在练习出题 `GET /api/practice`（或练习渲染的数据源）需要支持：

- 若该用户该词存在 `user_word_contexts.is_primary=true`：
  - 优先返回 `preferred_context_text = context_text`
- 否则回退全局例句：
  - `words.example_sentence`

另外，若主站希望做“主动收录词优先练习/可筛选”，需要接口支持：

- `has_user_context` 字段或过滤参数 `filter=collected`

这些能力已经在 `article-import-feature.md` 中有集成设想，主站需确认是否接受。

## 7. 频控与长度限制（必须明确）

插件的选区文本长度不可控，主站必须明确：

- `content` 最大长度（建议例如 8,000~20,000 字符）
- 单次 `selectedWords` 最大数量（建议例如 200）
- 频率限制（例如每分钟 N 次 preview/commit）

否则容易触发：

- 请求超时
- 数据库写入压力
- 被恶意滥用

## 8. 最小可用对接验收（建议）

以下 6 条全部通过，即可认为主站对接完成：

1. 插件登录成功并拿到 token
2. `/api/auth/me` 校验 token 正常
3. preview 返回 tokens，可渲染为可点击单词（标点/空白 isWord=false）
4. commit 能写入：来源文章 + 用户待复习状态 + 用户上下文例句
5. 重复词处理策略明确且符合预期（自动覆盖或二阶段选择）
6. 练习侧优先展示用户 `is_primary` 上下文例句（否则导入价值大幅下降）

