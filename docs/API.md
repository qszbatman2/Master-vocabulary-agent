# 词库管理 API 文档

> **⚠️ 重要提示**：此 API 直接连接生产环境数据库，所有修改操作会立即生效！

## 基础信息

- **开发环境**: `http://localhost:5000`
- **生产环境**: `https://8qcfzhhw7t.coze.site`
- **授权方式**: Bearer Token
- **Content-Type**: `application/json`

### 授权 Header

所有请求必须携带：

```
Authorization: Bearer vocabulary-admin-2024
```

---

## 1. 获取单词列表

### 请求

```
GET /api/admin/words
```

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码，从1开始 |
| pageSize | number | 否 | 50 | 每页数量，最大1000 |
| category | string | 否 | - | 分类ID或名称 |
| search | string | 否 | - | 搜索单词或释义（模糊匹配） |
| hasEmptyExample | boolean | 否 | false | 只返回例句或翻译为空的单词 |

### 请求示例

```bash
# 生产环境
curl -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?page=1&pageSize=20"

# 开发环境
curl -H "Authorization: Bearer vocabulary-admin-2024" \
  "http://localhost:5000/api/admin/words?page=1&pageSize=20"

# 按分类筛选（使用分类ID）
curl -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?category=51"

# 按分类筛选（使用分类名称）
curl -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?category=GRE词汇"

# 搜索单词
curl -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?search=abandon"

# 只获取例句为空的单词（需要补充内容的）
curl -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?hasEmptyExample=true&pageSize=100"

# 组合查询：搜索 + 空例句筛选
curl -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?search=test&hasEmptyExample=true"
```

### 响应示例

```json
{
  "success": true,
  "words": [
    {
      "id": 38915,
      "word": "abandon",
      "phonetic": "/əˈbændən/",
      "meaning": "v. 放弃；抛弃 n. 放纵",
      "example_sentence": "He abandoned his plan.",
      "example_sentence_cn": "他放弃了他的计划。",
      "category_id": 51,
      "category_name": "GRE词汇",
      "created_at": "2026-03-10T16:43:29.558911+08:00"
    },
    {
      "id": 38916,
      "word": "ability",
      "phonetic": "/əˈbɪləti/",
      "meaning": "n. 能力；才能",
      "example_sentence": "",
      "example_sentence_cn": "",
      "category_id": 51,
      "category_name": "GRE词汇",
      "created_at": "2026-03-10T16:43:29.558911+08:00"
    }
  ],
  "total": 13220,
  "page": 1,
  "pageSize": 20,
  "totalPages": 661,
  "categories": [
    { "id": 51, "name": "GRE词汇" },
    { "id": 52, "name": "TOEFL词汇" },
    { "id": 53, "name": "商务词汇" },
    { "id": 54, "name": "四级词汇" },
    { "id": 55, "name": "医学词汇" },
    { "id": 56, "name": "法律词汇" },
    { "id": 57, "name": "互联网" },
    { "id": 58, "name": "六级词汇" },
    { "id": 59, "name": "计算机" },
    { "id": 60, "name": "雅思核心词汇" },
    { "id": 61, "name": "考研词汇" },
    { "id": 62, "name": "经济学" },
    { "id": 63, "name": "项目管理" },
    { "id": 64, "name": "高考词汇" },
    { "id": 65, "name": "SAT词汇" },
    { "id": 66, "name": "专升本词汇" }
  ]
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 请求是否成功 |
| words | array | 单词列表 |
| words[].id | number | 单词ID（用于更新操作） |
| words[].word | string | 单词文本 |
| words[].phonetic | string | 音标 |
| words[].meaning | string | 中文释义 |
| words[].example_sentence | string | 英文例句（可能为空） |
| words[].example_sentence_cn | string | 例句中文翻译（可能为空） |
| words[].category_id | number | 分类ID |
| words[].category_name | string | 分类名称 |
| total | number | 总记录数 |
| page | number | 当前页码 |
| pageSize | number | 每页数量 |
| totalPages | number | 总页数 |
| categories | array | 所有分类列表 |

---

## 2. 更新单个单词

### 请求

```
PUT /api/admin/words
```

### 请求体

```json
{
  "id": 38915,
  "word": "abandon",
  "phonetic": "/əˈbændən/",
  "meaning": "v. 放弃；抛弃",
  "example_sentence": "She abandoned her career.",
  "example_sentence_cn": "她放弃了她的职业生涯。",
  "category_id": 51
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | ✅ | 单词ID（从获取列表API获得） |
| word | string | 否 | 单词文本（会自动转小写） |
| phonetic | string | 否 | 音标 |
| meaning | string | 否 | 中文释义 |
| example_sentence | string | 否 | 英文例句 |
| example_sentence_cn | string | 否 | 例句中文翻译 |
| category_id | number | 否 | 分类ID |

### 请求示例

```bash
# 只更新例句和翻译
curl -X PUT \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 38915,
    "example_sentence": "Never abandon your dreams.",
    "example_sentence_cn": "永远不要放弃你的梦想。"
  }' \
  "https://8qcfzhhw7t.coze.site/api/admin/words"

# 更新完整信息
curl -X PUT \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 38915,
    "word": "abandon",
    "phonetic": "/əˈbændən/",
    "meaning": "v. 放弃；抛弃；遗弃 n. 放纵",
    "example_sentence": "He abandoned his family.",
    "example_sentence_cn": "他抛弃了他的家人。"
  }' \
  "https://8qcfzhhw7t.coze.site/api/admin/words"
```

### 响应示例

**成功：**
```json
{
  "success": true,
  "word": {
    "id": 38915,
    "word": "abandon",
    "phonetic": "/əˈbændən/",
    "meaning": "v. 放弃；抛弃；遗弃 n. 放纵",
    "example_sentence": "He abandoned his family.",
    "example_sentence_cn": "他抛弃了他的家人。",
    "category_id": 51
  },
  "message": "更新成功"
}
```

**失败：**
```json
{
  "error": "缺少单词ID"
}
```

---

## 3. 批量更新单词

### 请求

```
PATCH /api/admin/words
```

### 请求体

```json
{
  "updates": [
    {
      "id": 38915,
      "example_sentence": "Sentence 1",
      "example_sentence_cn": "翻译1"
    },
    {
      "id": 38916,
      "example_sentence": "Sentence 2",
      "example_sentence_cn": "翻译2"
    }
  ]
}
```

### 请求示例

```bash
curl -X PATCH \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      { "id": 38915, "example_sentence": "New sentence 1", "example_sentence_cn": "新翻译1" },
      { "id": 38916, "example_sentence": "New sentence 2", "example_sentence_cn": "新翻译2" },
      { "id": 38917, "example_sentence": "New sentence 3", "example_sentence_cn": "新翻译3" }
    ]
  }' \
  "https://8qcfzhhw7t.coze.site/api/admin/words"
```

### 响应示例

```json
{
  "success": true,
  "total": 3,
  "updated": 3,
  "failed": 0,
  "errors": []
}
```

如果有失败：
```json
{
  "success": true,
  "total": 3,
  "updated": 2,
  "failed": 1,
  "errors": ["ID 38917: 更新失败原因"]
}
```

---

## 4. 错误响应

### 401 未授权

```json
{
  "error": "Unauthorized"
}
```

**原因**：缺少 Authorization header 或 token 错误

### 400 参数错误

```json
{
  "error": "缺少单词ID"
}
```

```json
{
  "error": "没有需要更新的字段"
}
```

### 500 服务器错误

```json
{
  "error": "服务器错误"
}
```

---

## 5. 使用场景示例

### 场景1：补充例句为空的单词

**步骤1：获取需要补充的单词**
```bash
curl -s -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?hasEmptyExample=true&pageSize=50" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'共 {data[\"total\"]} 个单词需要补充例句')"
```

**步骤2：逐个补充**
```bash
# 获取第一个需要补充的单词
WORD_ID=$(curl -s -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?hasEmptyExample=true&pageSize=1" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['words'][0]['id'])")

echo "准备更新单词ID: $WORD_ID"

# 补充例句
curl -X PUT \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d "{\"id\": $WORD_ID, \"example_sentence\": \"This is an example.\", \"example_sentence_cn\": \"这是一个例子。\"}" \
  "https://8qcfzhhw7t.coze.site/api/admin/words"
```

### 场景2：批量修正某一分类的单词

```bash
# 1. 获取该分类的所有单词
curl -s -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?category=GRE词汇&pageSize=1000" \
  > gre_words.json

# 2. 处理后批量更新
curl -X PATCH \
  -H "Authorization: Bearer vocabulary-admin-2024" \
  -H "Content-Type: application/json" \
  -d @updates.json \
  "https://8qcfzhhw7t.coze.site/api/admin/words"
```

### 场景3：备份所有单词

```bash
# 导出所有单词
curl -s -H "Authorization: Bearer vocabulary-admin-2024" \
  "https://8qcfzhhw7t.coze.site/api/admin/words?pageSize=15000" \
  > words_backup_$(date +%Y%m%d).json

echo "备份完成，文件大小: $(ls -lh words_backup_*.json | tail -1)"
```

---

## 6. Python 脚本示例

### 自动补充例句脚本

```python
#!/usr/bin/env python3
import requests
import time

# 开发环境: http://localhost:5000
# 生产环境: https://8qcfzhhw7t.coze.site
BASE_URL = "https://8qcfzhhw7t.coze.site"
HEADERS = {
    "Authorization": "Bearer vocabulary-admin-2024",
    "Content-Type": "application/json"
}

def get_words_without_example(page=1, page_size=50):
    """获取例句为空的单词"""
    response = requests.get(
        f"{BASE_URL}/api/admin/words",
        headers=HEADERS,
        params={
            "hasEmptyExample": "true",
            "page": page,
            "pageSize": page_size
        }
    )
    return response.json()

def update_word(word_id, example_sentence, example_sentence_cn):
    """更新单词例句"""
    response = requests.put(
        f"{BASE_URL}/api/admin/words",
        headers=HEADERS,
        json={
            "id": word_id,
            "example_sentence": example_sentence,
            "example_sentence_cn": example_sentence_cn
        }
    )
    return response.json()

def main():
    # 获取需要补充的单词总数
    data = get_words_without_example(page=1, page_size=1)
    total = data["total"]
    print(f"共有 {total} 个单词需要补充例句")
    
    # 遍历所有需要补充的单词
    page = 1
    page_size = 50
    updated_count = 0
    
    while True:
        data = get_words_without_example(page=page, page_size=page_size)
        words = data.get("words", [])
        
        if not words:
            break
        
        for word in words:
            word_id = word["id"]
            word_text = word["word"]
            
            # 这里可以接入AI生成例句
            example_en = f"This is an example for {word_text}."
            example_cn = f"这是 {word_text} 的例句。"
            
            result = update_word(word_id, example_en, example_cn)
            
            if result.get("success"):
                updated_count += 1
                print(f"[{updated_count}/{total}] 已更新: {word_text}")
            else:
                print(f"更新失败: {word_text} - {result.get('error')}")
            
            time.sleep(0.1)  # 避免请求过快
        
        page += 1
    
    print(f"\n完成！共更新 {updated_count} 个单词")

if __name__ == "__main__":
    main()
```

---

## 7. 注意事项

1. **数据安全**：所有修改直接生效，建议操作前先备份
2. **请求频率**：批量操作时建议添加适当延迟，避免请求过快
3. **字段验证**：
   - `word` 字段会自动转为小写
   - 空字符串和 `null` 都可以清空字段
4. **分类管理**：分类列表从获取单词API的 `categories` 字段获得
5. **分页限制**：`pageSize` 最大建议不超过1000

---

## 8. 数据库统计

| 统计项 | 数量 |
|--------|------|
| 总单词数 | 13,220 |
| 分类数 | 16 |
| 例句为空的单词 | （使用API查询） |

### 分类列表

| ID | 分类名称 |
|----|----------|
| 51 | GRE词汇 |
| 52 | TOEFL词汇 |
| 53 | 商务词汇 |
| 54 | 四级词汇 |
| 55 | 医学词汇 |
| 56 | 法律词汇 |
| 57 | 互联网 |
| 58 | 六级词汇 |
| 59 | 计算机 |
| 60 | 雅思核心词汇 |
| 61 | 考研词汇 |
| 62 | 经济学 |
| 63 | 项目管理 |
| 64 | 高考词汇 |
| 65 | SAT词汇 |
| 66 | 专升本词汇 |
