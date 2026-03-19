# 开发工作流程规范

## Git 提交规范

### ⚠️ 强制要求

**每次修改代码后必须提交到 GitHub！**

### 提交方式

#### 方式一：使用脚本（推荐）

```bash
./scripts/git-push.sh "feat: 新功能描述"
./scripts/git-push.sh "fix: 修复问题描述"
./scripts/git-push.sh "refactor: 重构描述"
```

#### 方式二：手动提交

```bash
git add -A
git commit -m "feat: 新功能描述"
git push origin main
```

### 提交信息规范

遵循 Conventional Commits 格式：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加用户登录功能` |
| `fix` | 修复bug | `fix: 修复登录验证问题` |
| `refactor` | 重构代码 | `refactor: 优化数据库查询` |
| `docs` | 文档更新 | `docs: 更新API文档` |
| `style` | 代码格式 | `style: 格式化代码` |
| `chore` | 构建/工具 | `chore: 更新依赖版本` |
| `test` | 测试相关 | `test: 添加单元测试` |

### 提交时机

1. **完成一个功能模块后** - 立即提交
2. **修复bug后** - 立即提交
3. **重构代码后** - 立即提交
4. **更新文档后** - 立即提交
5. **任务结束时** - 必须确认已提交

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
