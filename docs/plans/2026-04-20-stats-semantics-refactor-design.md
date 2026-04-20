# 统计口径重构归档

## 背景

本次重构的目标是统一学习统计的业务语义，解决首页、练习页、统计页、结算页之间的字段重复定义和口径漂移问题。

用户确认的业务规则如下：

1. 所有结算和累计统计统一使用“去重后的有效答对词数”。
2. 错词只有在连续答对 3 次后，才记为 1 次有效答对。
3. 打卡定义看“今天有没有进入学习状态”，即当天是否存在练习行为。
4. 不删除线上用户数据和已有物理字段；允许调整使用方式，但必须保留追溯记录。

## 本次修改

### 统一后的核心语义

- `effectiveCompletedCount`
  - 业务含义：当日去重后的有效答对词数。
  - 记录规则：普通词当天首次形成有效答对时 +1；错词需连续答对 3 次后才 +1。
- `hasStudyActivity`
  - 业务含义：当天是否进入学习状态。
  - 当前判定：`totalPracticed > 0`。

### 代码侧调整

- `src/app/api/practice/submit/route.ts`
  - 停止依赖 `correct_word_ids` 去重。
  - 改为仅在 `validCorrectRecorded === true` 时累加 `daily_practice_stats.correct_count`。
- `src/app/api/daily-progress/route.ts`
  - 今日累计进度改为直接读取 `daily_practice_stats.correct_count`。
- `src/app/api/stats/dashboard/route.ts`
  - 历史有效答对改为直接读取每日落库值。
  - 打卡改为基于 `hasStudyActivity`，不再依赖有效答对是否大于 0。
- `src/app/page.tsx`
  - 首页累计/连续打卡改为使用“进入学习状态”口径。
- `src/app/practice/page.tsx`
  - 顶部进度条和今日累计文案改为“今日完成”。
- `src/app/practice/summary/page.tsx`
  - 结算页文案改为“今日完成”。
- `src/app/stats/page.tsx`
  - 热力图达标判断统一使用 `effectiveCompletedCount`。
  - 打卡统计统一使用 `hasStudyActivity`。

## 遗留字段处理

### 保留但废弃的旧命名

- 数据库物理列 `daily_practice_stats.correct_count`
  - 保留原因：不删除线上字段，避免迁移风险。
  - 现状：仍然存储数据，但在业务层统一映射为 `effectiveCompletedCount`。
  - 约束：后续开发禁止把它解释为“答对题次数”。

- 数据库物理列 `daily_practice_stats.correct_word_ids`
  - 保留原因：兼容历史结构，避免直接删除字段。
  - 现状：本次重构后主提交流程不再依赖该字段。
  - 约束：后续开发禁止将其重新作为统计真源。

### 代码层禁止项

后续开发中，禁止新增以下直接用法：

- 直接在页面里使用 `correct_count` 作为“正确答题次数”解释。
- 直接在页面里使用 `completed` 作为模糊字段名。
- 通过 `user_word_status.last_correct_date` 反推整段历史每日完成数。
- 用“有效答对”来计算打卡。

## 推荐的后续命名规范

- 页面/API/TypeScript 类型层只使用以下业务名：
  - `effectiveCompletedCount`
  - `hasStudyActivity`
  - `totalPracticed`
  - `wrongCount`
  - `masteredCount`

- 数据库适配层允许保留旧物理列名，但必须在注释中写明业务映射关系。

## 影响范围

- 首页打卡展示
- 练习页今日累计进度
- 练习结算页文案与累计进度
- 统计页热力图、打卡、历史有效答对
- 每日结算接口

## 风险控制

- 本次未删除任何线上字段。
- 本次未清洗任何存量用户数据。
- 本次通过“业务命名替换 + 旧字段保留”的方式完成无损重构。
- 如后续要彻底替换数据库物理列名，应单独发起迁移，不与展示层改动混合。
