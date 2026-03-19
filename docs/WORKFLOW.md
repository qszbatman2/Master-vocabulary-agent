# 开发工作流程规范

## Git 提交规范

### ⚠️ 强制要求

**每次修改代码后必须提交到 GitHub！**

### 提交方式

#### 方式一：静默脚本（推荐，省token）

```bash
./scripts/git-sync.sh "feat: 新功能"
# 输出仅一行: ✓ 已提交: abc123 [Coze]feat: 新功能
```

#### 方式二：详细脚本（调试用）

```bash
./scripts/git-push.sh "feat: 新功能"
# 输出变更文件列表等详情
```

### 提交信息规范

**所有来自 Coze Coding 的提交必须添加 `[Coze]` 前缀！**

格式：`[Coze]type: description`

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `[Coze]feat: 添加用户登录功能` |
| `fix` | 修复bug | `[Coze]fix: 修复登录验证问题` |
| `refactor` | 重构代码 | `[Coze]refactor: 优化数据库查询` |
| `docs` | 文档更新 | `[Coze]docs: 更新API文档` |
| `style` | 代码格式 | `[Coze]style: 格式化代码` |
| `chore` | 构建/工具 | `[Coze]chore: 更新依赖版本` |
| `test` | 测试相关 | `[Coze]test: 添加单元测试` |

### 提交时机

1. **任务结束时** - 必须确认已提交
2. **完成一个功能模块后** - 建议提交
3. **修复bug后** - 建议提交

### 工作流对比

| 方式 | 工具调用 | 输出 | 适用场景 |
|------|---------|------|---------|
| `git-sync.sh` | 1次 | 1行 | **日常提交（推荐）** |
| `git-push.sh` | 1次 | 多行 | 调试/查看详情 |

### 示例工作流

```
用户请求 → 分析需求 → 编写代码 → 测试验证 → 提交GitHub → 完成
                                    ↓
                              必须执行 git push！
```

## 安全区域规范

所有页面必须支持iOS安全区域：

### 全局CSS类

```css
.safe-area-top {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}

.safe-area-bottom {
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}
```

### 使用方式

- 页面容器或固定头部添加 `.safe-area-top`
- 固定底部区域添加 `.safe-area-bottom`

## 项目结构

```
/workspace/projects/
├── src/app/           # Next.js 页面
├── src/components/    # React 组件
├── src/lib/          # 工具库
├── scripts/          # 脚本工具
│   └── git-push.sh   # Git提交脚本
├── docs/             # 文档
│   └── WORKFLOW.md   # 本文档
└── .coze             # 部署配置
```
