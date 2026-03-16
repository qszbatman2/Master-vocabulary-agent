# 英语单词学习平台 - 项目架构文档

> 本文档供 AI Agent 阅读理解项目架构，便于后续功能开发。

## 一、项目概述

基于 Next.js 的背单词应用，支持词库分类、无尽模式背单词、错题集筛选、学习进度追踪、每日目标设定等功能。

### 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19, TypeScript 5 |
| UI组件 | shadcn/ui (Radix UI) |
| 样式 | Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL) |
| LLM | coze-coding-dev-sdk (豆包/DeepSeek/Kimi) |
| 包管理 | pnpm (禁止使用 npm/yarn) |

### 设计规范

- **深色主题**：背景 `#12121e`，卡片 `#1e1e2e`
- **主色调**：渐变 `linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)`
- **大圆角**：24px
- **时区**：统一使用上海时区 (UTC+8)

---

## 二、功能模块

### 2.1 用户系统

| 功能 | 页面/API | 说明 |
|------|----------|------|
| 注册/登录 | `/login` | 邮箱+密码，支持登录/注册Tab切换 |
| 用户信息 | `/api/auth/me` | 获取当前用户信息 |
| 每日目标 | `/api/daily-progress` | 用户可自定义每日学习目标（默认200） |

### 2.2 词库管理

| 功能 | 页面/API | 说明 |
|------|----------|------|
| 词库浏览 | `/vocabulary` | 分页浏览、搜索、分类筛选 |
| 分类列表 | `/api/categories` | 16个预设分类（雅思/托福/GRE等） |
| 单词管理 | `/api/admin/words` | 管理员CRUD操作 |

### 2.3 背单词练习

| 功能 | 页面/API | 说明 |
|------|----------|------|
| 练习设置 | `/practice` | 选择词库、练习模式 |
| 获取题目 | `/api/practice` | 无尽模式，持续出题 |
| 提交答案 | `/api/practice/submit` | 记录答题结果，更新掌握状态 |
| 今日进度 | 顶部进度条 | 显示今日有效答对数/目标数 |

### 2.4 学习统计

| 功能 | 页面/API | 说明 |
|------|----------|------|
| 主页统计 | `/api/stats` | 今日/累计统计数据 |
| 今日进度 | `/api/daily-progress` | 每日目标完成情况 |

### 2.5 管理功能

| 功能 | API | 说明 |
|------|-----|------|
| 批量导入 | `/api/admin/batch-import` | 导入分类和单词 |
| 单词更新 | `/api/admin/update-words` | upsert/insert/update/delete |
| 数据去重 | `/api/admin/deduplicate` | 自动删除重复单词 |
| 数据导出 | `/api/admin/export-vocabulary` | 导出完整词库 |
| 用户诊断 | `/api/admin/user-stats` | 诊断和修复用户学习记录 |

---

## 三、数据库结构

### 3.1 表结构

#### users（用户表）

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  daily_goal INTEGER DEFAULT 200,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### vocabulary_categories（词库分类表）

```sql
CREATE TABLE vocabulary_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### words（单词表）

```sql
CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  meaning TEXT,
  example_sentence TEXT,
  example_sentence_cn TEXT,
  category_id INTEGER REFERENCES vocabulary_categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_words_word ON words(word);
CREATE INDEX idx_words_category_id ON words(category_id);
```

#### user_word_status（用户学习状态表）

```sql
CREATE TABLE user_word_status (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  word_id INTEGER REFERENCES words(id),
  is_mastered BOOLEAN DEFAULT FALSE,
  total_practice_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  daily_correct_count INTEGER DEFAULT 0,
  last_correct_date DATE,
  round_consecutive_correct INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP,
  last_wrong_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  
  UNIQUE(user_id, word_id)
);

-- 索引
CREATE INDEX idx_status_user_id ON user_word_status(user_id);
CREATE INDEX idx_status_word_id ON user_word_status(word_id);
CREATE INDEX idx_status_last_correct_date ON user_word_status(last_correct_date);
```

### 3.2 字段说明

#### user_word_status 关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `is_mastered` | BOOLEAN | 是否已掌握（4天有效答对） |
| `total_practice_count` | INTEGER | 总练习次数 |
| `correct_count` | INTEGER | 累计答对次数 |
| `wrong_count` | INTEGER | 累计答错次数 |
| `consecutive_correct` | INTEGER | 当前连续答对次数 |
| `daily_correct_count` | INTEGER | 有效答对天数（达到4即掌握） |
| `last_correct_date` | DATE | 最后一次有效答对的日期 |
| `round_consecutive_correct` | INTEGER | 本轮错题连续答对计数 |

---

## 四、核心业务逻辑

### 4.1 掌握状态判定规则

```
掌握条件：daily_correct_count >= 4

说明：
- 每天只能记录一次有效答对（last_correct_date 不同天）
- 需跨越4天都有有效答对才算掌握
- 手动标记掌握不计入 daily_correct_count
```

### 4.2 有效答对规则

```javascript
// 普通单词
if (!isToday(last_correct_date)) {
  daily_correct_count++;
  last_correct_date = today;
}

// 错题（本轮错误过的单词）
round_consecutive_correct++;
if (round_consecutive_correct >= 3 && !isToday(last_correct_date)) {
  daily_correct_count++;
  last_correct_date = today;
  round_consecutive_correct = 0;
}
```

### 4.3 今日进度计算

```sql
-- 查询今天有效答对的单词数
SELECT COUNT(*) FROM user_word_status 
WHERE user_id = ? 
  AND last_correct_date = '今天日期（上海时区）'
```

### 4.4 出题逻辑（Fisher-Yates 洗牌）

```javascript
// 1. 数据库查询候选单词
// 2. 排除今天已有效答对的单词
// 3. 立即洗牌打断默认排序
function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
```

---

## 五、API 接口清单

### 5.1 用户认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，返回 token |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 5.2 词库相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 获取分类列表 |
| GET | `/api/vocabulary` | 分页获取单词 |
| GET | `/api/stats` | 获取学习统计 |

### 5.3 练习相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/practice` | 获取练习题目 |
| POST | `/api/practice/submit` | 提交答案 |
| GET | `/api/daily-progress` | 获取今日进度 |
| POST | `/api/daily-progress` | 更新每日目标 |

### 5.4 管理接口（需 Authorization: Bearer vocabulary-admin-2024）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/words` | 分页获取所有单词 |
| POST | `/api/admin/update-words` | 批量更新单词 |
| POST | `/api/admin/batch-import` | 批量导入 |
| POST | `/api/admin/deduplicate` | 去重 |
| GET | `/api/admin/export-vocabulary` | 导出词库 |
| DELETE | `/api/admin/delete-words` | 删除单词 |

---

## 六、文件结构

```
src/
├── app/
│   ├── page.tsx                 # 首页
│   ├── login/page.tsx           # 登录页
│   ├── practice/
│   │   ├── page.tsx             # 练习页
│   │   └── summary/page.tsx     # 结算页
│   ├── vocabulary/page.tsx      # 词库页
│   └── api/
│       ├── auth/                # 认证接口
│       ├── categories/          # 分类接口
│       ├── practice/            # 练习接口
│       ├── daily-progress/      # 每日进度
│       ├── stats/               # 统计接口
│       ├── vocabulary/          # 词库接口
│       └── admin/               # 管理接口
├── components/ui/               # shadcn/ui 组件
├── contexts/AuthContext.tsx     # 认证上下文
├── storage/database/            # 数据库连接
└── lib/utils.ts                 # 工具函数
```

---

## 七、开发规范

### 7.1 认证方式

```javascript
// 前端发送请求时携带 token
const response = await fetch('/api/xxx', {
  headers: { authorization: `Bearer ${token}` }
});

// 后端解析 token 获取 userId
function getUserIdFromToken(token: string): number | null {
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  return parseInt(decoded.split(':')[0]);
}
```

### 7.2 时区处理

```javascript
// 统一使用上海时区 (UTC+8)
function getTodayDateString(): string {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return shanghaiTime.toISOString().split('T')[0];
}
```

### 7.3 UI 组件使用

```tsx
// 使用 shadcn/ui 组件
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 样式规范
<div style={{ background: '#1e1e2e', color: 'white' }}>
  <Button style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff)' }}>
    按钮
  </Button>
</div>
```

---

## 八、新增功能开发指南

### 8.1 添加新页面的步骤

1. 创建 `src/app/新路径/page.tsx`
2. 使用 `useAuth()` 获取用户状态
3. 遵循设计规范（深色主题、渐变色、大圆角）
4. 添加导航入口（首页或侧边栏）

### 8.2 添加新 API 的步骤

1. 创建 `src/app/api/路径/route.ts`
2. 引入 `getSupabaseClient()` 获取数据库连接
3. 实现认证检查（如需要）
4. 使用上海时区处理日期
5. 返回 `NextResponse.json()` 格式响应

### 8.3 添加新数据表的步骤

1. 在 Supabase 控制台创建表
2. 添加必要的索引和约束
3. 创建对应的 API 接口
4. 更新本文档

### 8.4 修改掌握逻辑的注意事项

核心文件：`src/app/api/practice/submit/route.ts`

修改时需确保：
- `daily_correct_count` 只在有效答对时增加
- `last_correct_date` 记录正确的日期
- 错题逻辑（`round_consecutive_correct`）正确处理
- 时区一致性（上海时区）

---

## 九、常见问题

### Q1: 今日进度显示为 0？

检查时区是否一致，所有日期计算应使用上海时区。

### Q2: 单词重复出现？

检查是否正确排除 `last_correct_date = 今天` 的单词。

### Q3: 掌握状态不正确？

检查 `daily_correct_count` 是否正确累加，`last_correct_date` 是否正确更新。

---

## 十、版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-03 | 初始版本，基础背单词功能 |
| v1.1 | 2026-03 | 添加错题集、掌握状态 |
| v1.2 | 2026-03 | 添加每日目标、今日进度条 |
| v1.3 | 2026-03 | 时区修复、数据同步功能 |
