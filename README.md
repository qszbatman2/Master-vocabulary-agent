# projects

这是一个基于 [Next.js 16](https://nextjs.org) + [shadcn/ui](https://ui.shadcn.com) 的全栈应用项目，由扣子编程 CLI 创建。

## 快速开始

### 启动开发服务器

```bash
coze dev
```

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看应用。

开发服务器支持热更新，修改代码后页面会自动刷新。

### 构建生产版本

```bash
coze build
```

### 启动生产服务器

```bash
coze start
```

## 项目结构

```
src/
├── app/                      # Next.js App Router 目录
│   ├── layout.tsx           # 根布局组件
│   ├── page.tsx             # 首页
│   ├── globals.css          # 全局样式（包含 shadcn 主题变量）
│   └── [route]/             # 其他路由页面
├── components/              # React 组件目录
│   └── ui/                  # shadcn/ui 基础组件（优先使用）
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/                     # 工具函数库
│   └── utils.ts            # cn() 等工具函数
└── hooks/                   # 自定义 React Hooks（可选）
```

## 核心开发规范

### 1. 组件开发

**优先使用 shadcn/ui 基础组件**

本项目已预装完整的 shadcn/ui 组件库，位于 `src/components/ui/` 目录。开发时应优先使用这些组件作为基础：

```tsx
// ✅ 推荐：使用 shadcn 基础组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>标题</CardHeader>
      <CardContent>
        <Input placeholder="输入内容" />
        <Button>提交</Button>
      </CardContent>
    </Card>
  );
}
```

**可用的 shadcn 组件清单**

- 表单：`button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
- 布局：`card`, `separator`, `tabs`, `accordion`, `collapsible`, `scroll-area`
- 反馈：`alert`, `alert-dialog`, `dialog`, `toast`, `sonner`, `progress`
- 导航：`dropdown-menu`, `menubar`, `navigation-menu`, `context-menu`
- 数据展示：`table`, `avatar`, `badge`, `hover-card`, `tooltip`, `popover`
- 其他：`calendar`, `command`, `carousel`, `resizable`, `sidebar`

详见 `src/components/ui/` 目录下的具体组件实现。

### 2. 路由开发

Next.js 使用文件系统路由，在 `src/app/` 目录下创建文件夹即可添加路由：

```bash
# 创建新路由 /about
src/app/about/page.tsx

# 创建动态路由 /posts/[id]
src/app/posts/[id]/page.tsx

# 创建路由组（不影响 URL）
src/app/(marketing)/about/page.tsx

# 创建 API 路由
src/app/api/users/route.ts
```

**页面组件示例**

```tsx
// src/app/about/page.tsx
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '关于我们',
  description: '关于页面描述',
};

export default function AboutPage() {
  return (
    <div>
      <h1>关于我们</h1>
      <Button>了解更多</Button>
    </div>
  );
}
```

**动态路由示例**

```tsx
// src/app/posts/[id]/page.tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <div>文章 ID: {id}</div>;
}
```

**API 路由示例**

```tsx
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ users: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### 3. 依赖管理

**必须使用 pnpm 管理依赖**

```bash
# ✅ 安装依赖
pnpm install

# ✅ 添加新依赖
pnpm add package-name

# ✅ 添加开发依赖
pnpm add -D package-name

# ❌ 禁止使用 npm 或 yarn
# npm install  # 错误！
# yarn add     # 错误！
```

项目已配置 `preinstall` 脚本，使用其他包管理器会报错。

### 4. 样式开发

**使用 Tailwind CSS v4**

本项目使用 Tailwind CSS v4 进行样式开发，并已配置 shadcn 主题变量。

```tsx
// 使用 Tailwind 类名
<div className="flex items-center gap-4 p-4 rounded-lg bg-background">
  <Button className="bg-primary text-primary-foreground">
    主要按钮
  </Button>
</div>

// 使用 cn() 工具函数合并类名
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className
)}>
  内容
</div>
```

**主题变量**

主题变量定义在 `src/app/globals.css` 中，支持亮色/暗色模式：

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### 5. 表单开发

推荐使用 `react-hook-form` + `zod` 进行表单开发：

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  username: z.string().min(2, '用户名至少 2 个字符'),
  email: z.string().email('请输入有效的邮箱'),
});

export default function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '' },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('username')} />
      <Input {...form.register('email')} />
      <Button type="submit">提交</Button>
    </form>
  );
}
```

### 6. 数据获取

**服务端组件（推荐）**

```tsx
// src/app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store', // 或 'force-cache'
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

**客户端组件**

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

## 常见开发场景

### 添加新页面

1. 在 `src/app/` 下创建文件夹和 `page.tsx`
2. 使用 shadcn 组件构建 UI
3. 根据需要添加 `layout.tsx` 和 `loading.tsx`

### 创建业务组件

1. 在 `src/components/` 下创建组件文件（非 UI 组件）
2. 优先组合使用 `src/components/ui/` 中的基础组件
3. 使用 TypeScript 定义 Props 类型

### 添加全局状态

推荐使用 React Context 或 Zustand：

```tsx
// src/lib/store.ts
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 集成数据库

推荐使用 Prisma 或 Drizzle ORM，在 `src/lib/db.ts` 中配置。

## 技术栈

- **框架**: Next.js 16.1.1 (App Router)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS v4
- **表单**: React Hook Form + Zod
- **图标**: Lucide React
- **字体**: Geist Sans & Geist Mono
- **包管理器**: pnpm 9+
- **TypeScript**: 5.x

## 参考文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)

## 重要提示

1. **必须使用 pnpm** 作为包管理器
2. **优先使用 shadcn/ui 组件** 而不是从零开发基础组件
3. **遵循 Next.js App Router 规范**，正确区分服务端/客户端组件
4. **使用 TypeScript** 进行类型安全开发
5. **使用 `@/` 路径别名** 导入模块（已配置）


## 开发经验与常见问题

### 数据脚本开发规范

#### 类型安全：数据字段与类型定义必须一致

**问题描述**：在编写数据导入脚本时，尝试访问数据对象中不存在的属性，导致 TypeScript 编译错误。

**错误示例**：
```typescript
// 数据定义中没有 example_sentence 字段
const words = [
  { word: 'earnest', phonetic: '/ˈɜːnɪst/', meaning: 'adj. 认真的', category: '托福词汇' },
  // ...
];

// 但代码中尝试访问该字段 ❌
records.push({
  word,
  phonetic: w.phonetic || '',
  meaning: w.meaning.trim(),
  example_sentence: w.example_sentence || `This is an example...`, // ❌ 类型错误！
  category_id: categoryIds.get(w.category) || defaultCategoryId,
});
```

**正确做法**：
```typescript
// 方案1：如果数据中没有该字段，直接使用默认值 ✅
records.push({
  word,
  phonetic: w.phonetic || '',
  meaning: w.meaning.trim(),
  example_sentence: `This is an example using the word "${w.word}".`, // ✅
  category_id: categoryIds.get(w.category) || defaultCategoryId,
});

// 方案2：如果需要可选字段，在数据类型定义中声明 ✅
interface WordData {
  word: string;
  phonetic: string;
  meaning: string;
  category: string;
  example_sentence?: string; // 可选字段
}
```

**经验总结**：
1. 编写数据脚本前，先确认数据结构的类型定义
2. 使用 `w.example_sentence || defaultValue` 前需确保类型定义中包含该字段
3. TypeScript 的严格类型检查会在构建时捕获此类错误
4. 部署前务必运行 `npx tsc --noEmit` 进行类型检查

#### 脚本文件命名规范

| 文件类型 | 命名规则 | 用途 |
|---------|---------|------|
| 数据导入脚本 | `import-*.ts` | 从外部源导入数据 |
| 数据生成脚本 | `words-*.ts` | 生成单词数据 |
| 工具脚本 | `utils-*.ts` | 辅助工具函数 |
| 迁移脚本 | `migrate-*.ts` | 数据库迁移 |

#### 脚本执行注意事项

1. **数据库表名**：使用 `vocabulary_categories` 而非 `categories`
2. **分类字段**：使用 `category_id` (外键) 而非 `category` (字符串)
3. **批量插入**：建议每批 100 条，避免单次插入过多数据
4. **错误处理**：批量失败时降级为逐条插入

#### 部署后数据初始化

**问题**：部署完成后数据库数据未自动更新，词库只有少量初始数据。

**原因**：数据导入脚本需要手动执行，不会在部署时自动运行。

**解决方案**：创建批量导入脚本 `scripts/import-all-words.ts`：

```typescript
// 批量执行所有数据导入脚本
const SCRIPTS = [
  'seed-data.ts',
  'words-data-part1.ts',
  'words-data-part2.ts',
  // ... 其他脚本
];

for (const script of SCRIPTS) {
  await execAsync(`npx tsx scripts/${script}`);
}
```

**执行命令**：
```bash
npx tsx scripts/import-all-words.ts
```

#### 重复分类数据处理

**问题**：多次执行导入脚本后，出现重复的分类记录（如两个"托福词汇"）。

**原因**：每次运行 `seed-data.ts` 都会插入新分类，不会检查是否已存在。

**解决方案**：创建修复脚本 `scripts/fix-duplicate-categories-v2.ts`：

```typescript
// 1. 找出重复分类（同名但不同ID）
// 2. 将单词迁移到保留的分类ID
// 3. 删除重复分类
for (const [name, ids] of Object.entries(nameToIds)) {
  if (ids.length > 1) {
    const keepId = ids[0];  // 保留最小ID
    // 迁移单词
    await supabase.from('words').update({ category_id: keepId }).eq('category_id', removeId);
    // 删除重复分类
    await supabase.from('vocabulary_categories').delete().eq('id', removeId);
  }
}
```

**预防措施**：在 `seed-data.ts` 中添加分类存在性检查：
```typescript
// 先检查分类是否已存在
const { data: existing } = await supabase
  .from('vocabulary_categories')
  .select('id')
  .eq('name', categoryName)
  .single();

if (!existing) {
  // 不存在才插入
  await supabase.from('vocabulary_categories').insert({ name, description });
}
```

### 部署常见错误排查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Property 'xxx' does not exist on type` | 访问未定义的属性 | 检查类型定义，添加字段或移除访问 |
| `Could not find table 'public.xxx'` | 表名错误 | 确认数据库实际表名 |
| `Transform failed with error` | 语法错误 | 检查文件末尾是否有残留数据 |
| 部署后数据库数据缺失 | 脚本未执行 | 运行 `npx tsx scripts/import-all-words.ts` |
| 分类重复/单词分散 | 多次执行种子脚本 | 运行 `npx tsx scripts/fix-duplicate-categories-v2.ts` |

### 代码提交前检查清单

- [ ] 运行 `npx tsc --noEmit` 无类型错误
- [ ] 检查新增脚本的数据类型定义完整性
- [ ] 确认数据库表名和字段名正确
- [ ] 验证服务运行正常 `curl -I http://localhost:5000`
- [ ] 部署后执行数据导入脚本（如有新数据）
- [ ] 检查数据库数据是否完整更新
