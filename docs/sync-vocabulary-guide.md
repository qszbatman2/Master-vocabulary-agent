# 词库数据同步指南

## 概述

本文档说明如何将生产环境的词库数据全量同步到测试环境。

## 前置条件

1. **权限要求**
   - 需要生产环境和测试环境的管理员 Token（默认：`vocabulary-admin-2024`）

2. **环境要求**
   - Node.js 环境
   - 网络可访问生产环境和测试环境

## 同步步骤

### 方式一：使用同步脚本（推荐）

```bash
# 在项目根目录执行
node scripts/sync-vocabulary.js <生产环境URL> <测试环境URL>

# 示例：从生产环境同步到本地测试环境
node scripts/sync-vocabulary.js https://8qcfzhhw7t.coze.site http://localhost:5000

# 示例：从生产环境同步到另一个测试环境
node scripts/sync-vocabulary.js https://8qcfzhhw7t.coze.site https://test.coze.site
```

### 方式二：手动同步

#### 步骤1: 导出生产环境数据

```bash
curl -X GET \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  https://8qcfzhhw7t.coze.site/api/admin/export-vocabulary \
  -o vocabulary-export.json
```

导出数据格式：
```json
{
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "categories": [
    { "id": 1, "name": "托福词汇", "description": "TOEFL托福考试常用词汇" }
  ],
  "words": [
    {
      "id": 1,
      "word": "abandon",
      "phonetic": "/əˈbændən/",
      "meaning": "v. 放弃；抛弃",
      "example_sentence": "...",
      "example_sentence_cn": "...",
      "category_id": 1
    }
  ],
  "stats": {
    "totalCategories": 16,
    "totalWords": 5000
  }
}
```

#### 步骤2: 清空测试环境数据

```bash
curl -X POST \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d '{"deleteAll": true}' \
  http://localhost:5000/api/admin/delete-words
```

#### 步骤3: 导入数据到测试环境

**导入分类：**

```bash
curl -X POST \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d @- \
  http://localhost:5000/api/admin/batch-import <<EOF
{
  "mode": "categories",
  "categories": [
    {"name": "托福词汇", "description": "TOEFL托福考试常用词汇"},
    {"name": "雅思词汇", "description": "IELTS雅思考试常用词汇"}
  ]
}
EOF
```

**导入单词（分批）：**

```bash
# 从导出文件提取单词数据，分批导入（每批最多500个）
# 示例：导入第一批
curl -X POST \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d @- \
  http://localhost:5000/api/admin/update-words <<EOF
{
  "action": "upsert",
  "words": [
    {
      "word": "abandon",
      "phonetic": "/əˈbændən/",
      "meaning": "v. 放弃；抛弃",
      "example_sentence": "Never abandon your dreams.",
      "example_sentence_cn": "永远不要放弃你的梦想。",
      "category_id": 1
    }
  ]
}
EOF
```

#### 步骤4: 验证同步结果

```bash
curl -X GET \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  http://localhost:5000/api/admin/export-vocabulary
```

对比 `stats.totalCategories` 和 `stats.totalWords` 是否一致。

## API 参考

### 1. 导出词库数据

```
GET /api/admin/export-vocabulary
Headers: Authorization: Bearer <token>

Response:
{
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "categories": [...],
  "words": [...],
  "stats": {
    "totalCategories": 16,
    "totalWords": 5000
  }
}
```

### 2. 清空词库数据

```
POST /api/admin/delete-words
Headers: 
  Authorization: Bearer <token>
  Content-Type: application/json

Body: { "deleteAll": true }

Response:
{
  "success": true,
  "deletedWords": 5000,
  "deletedCategories": 16
}
```

### 3. 更新/导入单词

```
POST /api/admin/update-words
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "action": "upsert",  // upsert | insert | update | delete
  "words": [
    {
      "word": "example",
      "phonetic": "/ɪɡˈzæmpəl/",
      "meaning": "n. 例子；榜样",
      "example_sentence": "This is an example.",
      "example_sentence_cn": "这是一个例子。",
      "category_id": 1
    }
  ]
}

Response:
{
  "success": true,
  "action": "upsert",
  "results": {
    "total": 1,
    "inserted": 0,
    "updated": 1,
    "deleted": 0,
    "skipped": 0,
    "errors": []
  },
  "totalWords": 5000
}
```

## 注意事项

1. **数据安全**
   - 同步会**完全覆盖**测试环境数据
   - 建议先备份测试环境重要数据
   - 导出的数据会自动保存到 `exports/` 目录作为备份

2. **性能考虑**
   - 单词数量较多时（如5000+），导入可能需要几分钟
   - 脚本会自动分批导入（每批500个）
   - 建议在网络稳定的环境下执行

3. **故障处理**
   - 如果同步中断，可以重新运行脚本
   - 脚本会先清空目标环境再导入，不会产生重复数据
   - 查看错误日志排查问题

## 常见问题

**Q: 同步脚本报错 "Unauthorized"**
A: 检查 Authorization Token 是否正确，默认值为 `vocabulary-admin-2024`

**Q: 同步后单词数量不一致**
A: 可能原因：
   - 导入过程中部分单词格式错误
   - 检查 `results.errors` 字段查看具体错误
   - 可以重新运行同步脚本

**Q: 如何只同步部分词库？**
A: 可以手动编辑导出的 JSON 文件，删除不需要的分类或单词，然后手动导入

**Q: 如何定时自动同步？**
A: 可以使用 cron 任务定时执行同步脚本：
```bash
# 每天凌晨2点同步
0 2 * * * cd /path/to/project && node scripts/sync-vocabulary.js https://prod.coze.site http://localhost:5000 >> /var/log/sync-vocabulary.log 2>&1
```
