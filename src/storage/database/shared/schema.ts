import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  serial,
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

// TypeScript types
export type VocabularyCategory = typeof vocabularyCategories.$inferSelect;
export type InsertVocabularyCategory = z.infer<
  typeof insertVocabularyCategorySchema
>;
export type Word = typeof words.$inferSelect;
export type InsertWord = z.infer<typeof insertWordSchema>;
