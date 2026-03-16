-- 文章导入功能相关表
-- 执行方式：通过 Supabase 控制台或 API 执行

-- 用户来源文章表
CREATE TABLE IF NOT EXISTS user_text_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_text_sources_user_id ON user_text_sources(user_id);

-- 用户上下文例句表
CREATE TABLE IF NOT EXISTS user_word_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  source_id UUID REFERENCES user_text_sources(id) ON DELETE CASCADE,
  
  surface_form TEXT NOT NULL,      -- 原始形态（用户选中的词）
  lemma TEXT NOT NULL,             -- 词元（还原后的词根）
  context_text TEXT NOT NULL,      -- 上下文例句
  is_primary BOOLEAN DEFAULT FALSE,-- 是否为优先例句
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_word_contexts_user_word ON user_word_contexts(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_user_word_contexts_primary ON user_word_contexts(user_id, word_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_user_word_contexts_lemma ON user_word_contexts(lemma);

-- 添加注释
COMMENT ON TABLE user_text_sources IS '用户导入的来源文章';
COMMENT ON TABLE user_word_contexts IS '用户收录的单词上下文例句';
COMMENT ON COLUMN user_word_contexts.surface_form IS '用户选中的原始词形';
COMMENT ON COLUMN user_word_contexts.lemma IS '词形还原后的词元';
COMMENT ON COLUMN user_word_contexts.context_text IS '包含该词的上下文例句';
COMMENT ON COLUMN user_word_contexts.is_primary IS '是否为该单词的优先展示例句';
