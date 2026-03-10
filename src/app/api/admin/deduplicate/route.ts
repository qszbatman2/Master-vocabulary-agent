import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 授权检查
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
  return authHeader === `Bearer ${adminKey}`;
}

/**
 * 去重单词 API
 * POST /api/admin/deduplicate
 * 
 * 功能：
 * 1. 找出同一分类中重复的单词（相同的 word 字段）
 * 2. 对于每组重复：
 *    - 如果有用户记录，将记录迁移到保留的单词（ID最小的）
 *    - 删除其他重复记录
 * 3. 返回去重结果
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      hint: 'Add Authorization header with value: Bearer vocabulary-admin-2024',
    }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // 默认是预览模式

    console.log(`开始去重分析 (dryRun: ${dryRun})...`);

    // 1. 获取所有单词
    const { data: allWords, error: wordsError } = await client
      .from('words')
      .select('id, word, category_id, created_at')
      .order('created_at', { ascending: true });

    if (wordsError) {
      return NextResponse.json({ error: wordsError.message }, { status: 500 });
    }

    console.log(`总单词数: ${allWords?.length || 0}`);

    // 2. 按分类和单词分组
    const grouped = new Map<string, typeof allWords>();
    
    for (const word of allWords || []) {
      const key = `${word.category_id}:${word.word.toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(word);
    }

    // 3. 找出重复的组
    const duplicates: Array<{
      word: string;
      categoryId: number;
      records: Array<{ id: number; createdAt: string }>;
      hasUserRecords: boolean;
      toDelete: number[];
      toKeep: number;
    }> = [];

    let totalDuplicates = 0;

    for (const [key, records] of grouped.entries()) {
      if (records.length > 1) {
        const [categoryId, word] = key.split(':');
        totalDuplicates += records.length - 1;

        // 按 ID 排序，保留最早的
        const sorted = records.sort((a, b) => a.id - b.id);
        const toKeep = sorted[0].id;
        const toDelete = sorted.slice(1).map(r => r.id);

        duplicates.push({
          word,
          categoryId: parseInt(categoryId),
          records: sorted.map(r => ({ id: r.id, createdAt: r.created_at })),
          hasUserRecords: false, // 后续检查
          toDelete,
          toKeep,
        });
      }
    }

    console.log(`发现 ${duplicates.length} 组重复，共 ${totalDuplicates} 条记录需要删除`);

    if (duplicates.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有发现重复数据',
        totalWords: allWords?.length || 0,
        uniqueWords: grouped.size,
      });
    }

    // 4. 检查用户记录
    const allIdsToDelete = duplicates.flatMap(d => d.toDelete);
    const allIdsToKeep = duplicates.map(d => d.toKeep);

    const { data: userRecords } = await client
      .from('user_word_status')
      .select('word_id')
      .in('word_id', [...allIdsToDelete, ...allIdsToKeep]);

    const userRecordIds = new Set(userRecords?.map(r => r.word_id) || []);

    // 标记哪些组有用户记录
    for (const dup of duplicates) {
      const hasRecords = [...dup.toDelete, dup.toKeep].some(id => userRecordIds.has(id));
      dup.hasUserRecords = hasRecords;
    }

    // 5. 如果是预览模式，返回分析结果
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        analysis: {
          totalWords: allWords?.length || 0,
          uniqueGroups: grouped.size,
          duplicateGroups: duplicates.length,
          recordsToDelete: totalDuplicates,
          affectedByUserRecords: duplicates.filter(d => d.hasUserRecords).length,
        },
        samples: duplicates.slice(0, 10).map(d => ({
          word: d.word,
          categoryId: d.categoryId,
          records: d.records.length,
          toKeep: d.toKeep,
          toDelete: d.toDelete.slice(0, 3),
          hasUserRecords: d.hasUserRecords,
        })),
      });
    }

    // 6. 执行去重
    let migrated = 0;
    let deleted = 0;

    for (const dup of duplicates) {
      // 如果有用户记录，先迁移
      if (dup.hasUserRecords) {
        // 将要删除单词的用户记录迁移到保留的单词
        for (const deleteId of dup.toDelete) {
          const { data: existingRecord } = await client
            .from('user_word_status')
            .select('*')
            .eq('word_id', deleteId)
            .single();

          if (existingRecord) {
            // 检查保留的单词是否已有记录
            const { data: keepRecord } = await client
              .from('user_word_status')
              .select('*')
              .eq('word_id', dup.toKeep)
              .single();

            if (keepRecord) {
              // 合并记录：取更高的正确次数等
              const mergedRecord = {
                user_id: existingRecord.user_id,
                word_id: dup.toKeep,
                is_mastered: existingRecord.is_mastered || keepRecord.is_mastered,
                consecutive_correct: Math.max(existingRecord.consecutive_correct, keepRecord.consecutive_correct),
                total_practice_count: existingRecord.total_practice_count + keepRecord.total_practice_count,
                correct_count: existingRecord.correct_count + keepRecord.correct_count,
                wrong_count: existingRecord.wrong_count + keepRecord.wrong_count,
              };

              // 更新保留的记录
              await client
                .from('user_word_status')
                .update(mergedRecord)
                .eq('word_id', dup.toKeep);

              // 删除旧的保留记录（如果有的话）
              await client
                .from('user_word_status')
                .delete()
                .eq('word_id', dup.toKeep);
              
              // 插入合并后的记录
              await client
                .from('user_word_status')
                .insert(mergedRecord);
            } else {
              // 直接更新 word_id
              await client
                .from('user_word_status')
                .update({ word_id: dup.toKeep })
                .eq('word_id', deleteId);
            }
            migrated++;
          }
        }
      }

      // 删除重复单词
      const { error: deleteError } = await client
        .from('words')
        .delete()
        .in('id', dup.toDelete);

      if (!deleteError) {
        deleted += dup.toDelete.length;
      }
    }

    // 7. 获取最终统计
    const { count: finalCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: '去重完成',
      before: allWords?.length || 0,
      after: finalCount || 0,
      deleted,
      userRecordsMigrated: migrated,
      duplicateGroupsProcessed: duplicates.length,
    });

  } catch (error) {
    console.error('去重操作失败:', error);
    return NextResponse.json({ error: '去重操作失败', details: String(error) }, { status: 500 });
  }
}

/**
 * 获取去重分析报告
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 获取所有单词
    const { data: allWords, count: totalCount } = await client
      .from('words')
      .select('id, word, category_id', { count: 'exact' });

    // 按分类和单词分组
    const grouped = new Map<string, number>();
    const categoryStats = new Map<number, { total: number; unique: number }>();

    for (const word of allWords || []) {
      const key = `${word.category_id}:${word.word.toLowerCase()}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);

      if (!categoryStats.has(word.category_id)) {
        categoryStats.set(word.category_id, { total: 0, unique: 0 });
      }
      const stats = categoryStats.get(word.category_id)!;
      stats.total++;
    }

    // 计算唯一单词
    const uniqueWords = new Set(allWords?.map(w => w.word.toLowerCase()) || []).size;

    // 统计重复
    const duplicates = [...grouped.entries()].filter(([_, count]) => count > 1);
    const recordsToDelete = duplicates.reduce((sum, [_, count]) => sum + count - 1, 0);

    return NextResponse.json({
      totalRecords: totalCount,
      uniqueWords,
      duplicateGroups: duplicates.length,
      recordsToDelete,
      categoryStats: Object.fromEntries(categoryStats),
    });

  } catch (error) {
    console.error('分析失败:', error);
    return NextResponse.json({ error: '分析失败', details: String(error) }, { status: 500 });
  }
}
