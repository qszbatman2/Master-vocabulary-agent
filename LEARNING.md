# 开发经验备忘

## 1. Supabase 数据查询限制
**问题**：Supabase 默认每页最多返回 1000 条记录。
**解决**：必须使用分页（range）循环获取所有数据。
```typescript
// ❌ 错误 - 只返回前1000条
const { data } = await client.from('words').select('*');

// ✅ 正确 - 分页获取所有数据
const allData = [];
const pageSize = 1000;
let offset = 0;
while (true) {
  const { data: batch } = await client
    .from('words')
    .select('*')
    .range(offset, offset + pageSize - 1);
  if (!batch?.length) break;
  allData.push(...batch);
  if (batch.length < pageSize) break;
  offset += pageSize;
}
```

## 2. TypeScript 构建错误 - 变量重复声明
**问题**：多个 TypeScript 文件在全局作用域声明同名变量，构建时报错 "Cannot redeclare block-scoped variable"。
**解决**：
- 临时脚本文件放到 scripts 目录外（如 /tmp）
- 或使用 IIFE 包裹避免全局作用域污染
- 或每个脚本使用唯一的变量命名

## 3. 环境区分
**问题**：沙箱环境和生产环境使用不同的数据库。
- 沙箱环境：开发数据库（COZE_PROJECT_ENV=DEV）
- 生产环境：独立的生产数据库
**解决**：操作生产环境数据时，必须通过生产环境 API 或直接连接生产数据库。

## 4. 临时脚本管理
**问题**：临时分析/调试脚本留在代码库中会导致构建失败。
**解决**：
- 临时脚本用完后立即删除
- 或放在不参与构建的目录（如 /tmp）
- 或添加到 .gitignore 和 tsconfig exclude

## 5. 构建前自检清单
- [ ] 删除所有临时分析脚本
- [ ] 检查 Supabase 查询是否需要分页
- [ ] 运行 `npx tsc --noEmit` 确保无类型错误
- [ ] 运行 `pnpm run build` 确保构建成功
