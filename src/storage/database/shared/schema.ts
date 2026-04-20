import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  serial,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 系统健康检查表（由 Supabase 创建，必须保留）
export const healthCheck = pgTable("health_check", {
  id: serial("id").primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 词库分类表
export const vocabularyCategories = pgTable(
  "vocabulary_categories",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 50 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("vocabulary_categories_name_idx").on(table.name)]
);

// 单词表
export const words = pgTable(
  "words",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    word: varchar("word", { length: 100 }).notNull(),
    phonetic: varchar("phonetic", { length: 100 }),
    meaning: text("meaning").notNull(),
    exampleSentence: text("example_sentence"),
    exampleSentenceCn: text("example_sentence_cn"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => vocabularyCategories.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("words_word_idx").on(table.word),
    index("words_category_id_idx").on(table.categoryId),
  ]
);

// 用户表
export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    nickname: varchar("nickname", { length: 100 }),
    dailyGoal: integer("daily_goal").default(200).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => [index("users_email_idx").on(table.email)]
);

// 用户单词学习状态表
export const userWordStatus = pgTable(
  "user_word_status",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id),
    isMastered: boolean("is_mastered").default(false).notNull(),
    totalPracticeCount: integer("total_practice_count").default(0).notNull(),
    correctCount: integer("correct_count").default(0).notNull(),
    wrongCount: integer("wrong_count").default(0).notNull(),
    consecutiveCorrect: integer("consecutive_correct").default(0).notNull(),
    // 新增：掌握进度相关字段
    dailyCorrectCount: integer("daily_correct_count").default(0).notNull(), // 有效答对天数（4天=掌握）
    lastCorrectDate: varchar("last_correct_date", { length: 10 }), // 最后一次有效答对日期 (YYYY-MM-DD)
    roundConsecutiveCorrect: integer("round_consecutive_correct").default(0).notNull(), // 本轮错题连续答对次数
    lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }),
    lastWrongAt: timestamp("last_wrong_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("user_word_status_user_id_idx").on(table.userId),
    index("user_word_status_word_id_idx").on(table.wordId),
    index("user_word_status_mastered_idx").on(table.isMastered),
    index("user_word_status_last_wrong_at_idx").on(table.lastWrongAt),
    // 用户+单词唯一约束
    index("user_word_status_unique_idx").on(table.userId, table.wordId),
  ]
);

// 每日练习统计表
// 注意：数据库中的 correct_count 是历史遗留物理列名，
// 在业务语义上应统一理解为“去重后的有效答对词数”。
export const dailyPracticeStats = pgTable(
  "daily_practice_stats",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    date: varchar("date", { length: 10 }).notNull(),
    totalPracticed: integer("total_practiced").default(0).notNull(),
    effectiveCompletedCount: integer("correct_count").default(0).notNull(),
    wrongCount: integer("wrong_count").default(0).notNull(),
    masteredCount: integer("mastered_count").default(0).notNull(),
    wrongWordIds: text("wrong_word_ids"),
    legacyCorrectWordIds: text("correct_word_ids"),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    isSettled: boolean("is_settled").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("daily_practice_stats_user_id_idx").on(table.userId),
    index("daily_practice_stats_date_idx").on(table.date),
    index("daily_practice_stats_user_date_idx").on(table.userId, table.date),
  ]
);

// 使用 createSchemaFactory 配置 date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Zod schemas for validation
export const insertVocabularyCategorySchema = createCoercedInsertSchema(
  vocabularyCategories
).pick({
  name: true,
  description: true,
});

export const insertWordSchema = createCoercedInsertSchema(words).pick({
  word: true,
  phonetic: true,
  meaning: true,
  exampleSentence: true,
  categoryId: true,
});

export const insertUserSchema = createCoercedInsertSchema(users).pick({
  email: true,
  password: true,
  nickname: true,
});

export const insertUserWordStatusSchema = createCoercedInsertSchema(
  userWordStatus
).pick({
  userId: true,
  wordId: true,
  isMastered: true,
  totalPracticeCount: true,
  correctCount: true,
  wrongCount: true,
  consecutiveCorrect: true,
});

// TypeScript types
export type VocabularyCategory = typeof vocabularyCategories.$inferSelect;
export type InsertVocabularyCategory = z.infer<
  typeof insertVocabularyCategorySchema
>;
export type Word = typeof words.$inferSelect;
export type InsertWord = z.infer<typeof insertWordSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserWordStatus = typeof userWordStatus.$inferSelect;
export type InsertUserWordStatus = z.infer<typeof insertUserWordStatusSchema>;
export type DailyPracticeStats = typeof dailyPracticeStats.$inferSelect;
