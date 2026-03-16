# 从文章添加生词（MVP+ 方案）

本文档描述“粘贴英文文章 → 点选标记生词 → 加入待复习 → 复习优先展示原文上下文”的端到端方案，并与当前项目的 Next.js + Supabase 架构对齐。

## 1. 目标与非目标

### 1.1 目标

- 手机端网页交互优先：不依赖键盘快捷键，点击为主。
- 快速从外部英文文章导入生词：用户手动点选，批量加入待复习。
- 复习时优先显示用户记录的“原文上下文例句”，目标词高亮。
- 词形还原（surface → lemma）用于去重与合并，减少 run/running/runs 等重复词条。
- 重复导入同一 lemma 时，提供提示页面让用户选择使用哪段例句作为“优先例句”。

### 1.2 非目标（第一版不做）

- 词典释义、音标、TTS、自动推荐生词、短语卡、OCR。
- 完整的跨文章上下文管理（仅支持“保存来源文章 + 选择优先例句”，不做复杂检索/编辑）。

## 2. 用户流程（移动端）

### 2.1 入口

- 入口放在主页最底部，展示为一张功能卡片：从文章添加生词。
- 点击进入 `/article-import`。

### 2.2 粘贴文章页（/article-import）

- 文本框：粘贴英文文章（纯文本）。
- 可选标题：用于来源标识（例如 Economist 2026-03-16）。
- 下一步：进入标记页。

### 2.3 标记页（/article-import/mark）

- 文章按 token 渲染为可点击单词。
- 点击单词切换选中状态（高亮）。
- 底部浮条展示：已选 X 个生词 + 完成加入。

点击完成加入后：

- 调用 `POST /api/article-import/preview` 做词形还原 + 去重预判。
- 若无重复：直接 `POST /api/article-import/commit` 完成写入并返回成功提示。
- 若有重复：跳转到重复提示页。

### 2.4 重复提示页（/article-import/duplicates）

按 lemma 分组展示重复项，每组提供：

- 词条（lemma）+ 本次点选的 surface form（用于理解合并原因）。
- 例句卡片：
  - 已有优先例句（如果存在）
  - 本次文章例句
- 单选：使用已有 / 使用本次。
- 可选（默认关闭）：保留两条并轮换显示（如果后续要支持多上下文）。

确认后调用 `POST /api/article-import/commit`。

## 3. 数据模型（Supabase / PostgreSQL）

当前已有全局词条 `words` 与用户学习状态 `user_word_status`。本文新增两张用户侧表，用于保存来源文章与用户上下文例句。

### 3.1 user_text_sources（用户来源文章）

```sql
CREATE TABLE user_text_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_text_sources_user_id ON user_text_sources(user_id);
```

### 3.2 user_word_contexts（用户上下文例句）

```sql
CREATE TABLE user_word_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  word_id INTEGER NOT NULL REFERENCES words(id),
  source_id UUID REFERENCES user_text_sources(id),

  surface_form TEXT NOT NULL,
  lemma TEXT NOT NULL,
  context_text TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_word_contexts_user_word ON user_word_contexts(user_id, word_id);
CREATE INDEX idx_user_word_contexts_primary ON user_word_contexts(user_id, word_id, is_primary);
```

### 3.3 与现有表的关系与约束建议

- `words.word` 作为 lemma 存储（统一小写），导入时按 lemma 查找或创建 `words`。
- `user_word_status` 保持不变：导入新词时 upsert，保证进入待复习体系。
- 建议后续补充：对 `LOWER(words.word)` 的唯一性约束，减少全局重复词条。

## 4. API 设计（用户侧）

所有用户侧接口必须携带用户 token（与现有 `/api/auth/*` 一致），区别于管理接口的固定 admin token。

### 4.1 POST /api/article-import/preview

用途：保存来源文章、对选中词做词形还原、提前识别重复词，返回给前端渲染重复提示页。

请求体（示例）：

```json
{
  "title": "Economist 2026-03-16",
  "content": "full article text ...",
  "selections": [
    { "surface": "running", "offsetStart": 123, "offsetEnd": 130 }
  ]
}
```

响应体（示例）：

```json
{
  "sourceId": "uuid",
  "newWords": [
    { "lemma": "run", "surface": "running", "contextText": "..." }
  ],
  "duplicates": [
    {
      "lemma": "run",
      "wordId": 12345,
      "existingPrimaryContext": "existing ...",
      "newContextText": "new ..."
    }
  ]
}
```

### 4.2 POST /api/article-import/commit

用途：写入 `user_word_status` 与 `user_word_contexts`，并根据用户选择设置 `is_primary`。

请求体（示例）：

```json
{
  "sourceId": "uuid",
  "adds": [
    { "wordId": 12345, "lemma": "run", "surface": "running", "contextText": "..." }
  ],
  "duplicateResolutions": [
    { "wordId": 12345, "choose": "use_new" }
  ]
}
```

规则：

- `adds`：对每个 `wordId` upsert `user_word_status`。
- `choose = use_new`：新增一条 `user_word_contexts` 并设为 primary（同一 user_id + word_id 先清空旧 primary）。
- `choose = use_existing`：不变更 primary。

## 5. 复习优先展示上下文（与练习接口融合）

练习出题 `GET /api/practice` 的返回体建议附带：

- `preferred_context_text`：来自 `user_word_contexts` 中 `is_primary=true` 的 `context_text`
- fallback：全局 `words.example_sentence`（如果需要兜底）

前端 `/practice` 渲染时优先展示 `preferred_context_text`。

## 6. 词形还原（本地规则 + 火山方舟 LLM 兜底）

### 6.1 本地规则（默认路径）

适合绝大多数规则变化，成本低、延迟低、稳定可控：

- 规范化：去除首尾标点、统一小写、保留内部撇号（don't）。
- 名词复数：-s/-es/-ies。
- 动词：三单 -s/-es/-ies，过去式 -ed，进行时 -ing（含双写与去 e 的基础规则）。
- 形容词：比较级/最高级 -er/-est（可选）。

该路径目标是减少 run/runs/running、study/studies/studied/studying 等常见重复。

### 6.2 LLM 兜底（仅在不规则/不确定时调用）

触发条件建议：

- 本地规则无法确定（多个候选、或回退后仍疑似不规则）。
- 命中小型不规则表失败（例如 ran/seen/children）。

输入：surface form + 可选上下文句子（提高 disambiguation）。

输出：lemma（小写）+ 可选词性（pos）。

## 7. 火山方舟（Volcengine Ark）接入说明（用于 lemmatization 兜底）

推荐以“兼容 OpenAI 接口协议”的方式接入，在服务端统一封装 Ark 客户端。

- Base URL（OpenAI 协议）：`https://ark.cn-beijing.volces.com/api/coding/v3`
- API Key：从火山方舟控制台获取，注入服务端环境变量，不写入仓库。

建议环境变量：

- `ARK_BASE_URL`：Ark Base URL
- `ARK_API_KEY`：Ark API Key
- `ARK_MODEL`：模型名（例如 doubao / deepseek / kimi 等在控制台启用的模型）

安全建议：

- 不记录/打印 API Key。
- 为 lemmatization 兜底设置速率限制与超时。
- 缓存 LLM 结果（例如按 surface+pos 缓存），降低成本与延迟。

