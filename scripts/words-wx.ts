// W-X字母开头的单词
import { getSupabaseClient } from '../src/storage/database/supabase-client';
import { fetchAllFromSupabase } from '../src/lib/supabase-fetch-all';

const supabase = getSupabaseClient();
const WORDS_TABLE = 'words';
const CATEGORIES_TABLE = 'vocabulary_categories';

interface WordData {
  word: string;
  phonetic: string;
  meaning: string;
  category?: string;
}

const wordsWX: WordData[] = [
  // W 字母开头的单词
  { word: 'wage', phonetic: '/weɪdʒ/', meaning: 'n. 工资 v. 发动', category: '托福词汇' },
  { word: 'waggon', phonetic: '/ˈwæɡən/', meaning: 'n. 四轮马车', category: '托福词汇' },
  { word: 'waist', phonetic: '/weɪst/', meaning: 'n. 腰', category: '托福词汇' },
  { word: 'wait', phonetic: '/weɪt/', meaning: 'v. 等待 n. 等待', category: '日常词汇' },
  { word: 'waiter', phonetic: '/ˈweɪtər/', meaning: 'n. 服务员', category: '托福词汇' },
  { word: 'waitress', phonetic: '/ˈweɪtrəs/', meaning: 'n. 女服务员', category: '托福词汇' },
  { word: 'wake', phonetic: '/weɪk/', meaning: 'v. 醒来；唤醒', category: '日常词汇' },
  { word: 'walk', phonetic: '/wɔːk/', meaning: 'v. 走 n. 步行', category: '日常词汇' },
  { word: 'wall', phonetic: '/wɔːl/', meaning: 'n. 墙', category: '日常词汇' },
  { word: 'wallet', phonetic: '/ˈwɒlɪt/', meaning: 'n. 钱包', category: '托福词汇' },
  { word: 'wander', phonetic: '/ˈwɒndər/', meaning: 'v. 漫游；徘徊', category: 'GRE词汇' },
  { word: 'want', phonetic: '/wɒnt/', meaning: 'v. 想要 n. 需要', category: '日常词汇' },
  { word: 'war', phonetic: '/wɔːr/', meaning: 'n. 战争', category: '托福词汇' },
  { word: 'ward', phonetic: '/wɔːrd/', meaning: 'n. 病房；监护', category: 'GRE词汇' },
  { word: 'wardrobe', phonetic: '/ˈwɔːrdroʊb/', meaning: 'n. 衣柜', category: '托福词汇' },
  { word: 'warehouse', phonetic: '/ˈweərhaʊs/', meaning: 'n. 仓库', category: 'GRE词汇' },
  { word: 'warm', phonetic: '/wɔːrm/', meaning: 'adj. 温暖的 v. 变暖', category: '日常词汇' },
  { word: 'warmth', phonetic: '/wɔːrmθ/', meaning: 'n. 温暖；热情', category: '托福词汇' },
  { word: 'warn', phonetic: '/wɔːrn/', meaning: 'v. 警告', category: '托福词汇' },
  { word: 'warning', phonetic: '/ˈwɔːrnɪŋ/', meaning: 'n. 警告', category: '托福词汇' },
  { word: 'warrant', phonetic: '/ˈwɔːrənt/', meaning: 'n. 授权令；理由 v. 保证', category: 'GRE词汇' },
  { word: 'wash', phonetic: '/wɒʃ/', meaning: 'v. 洗 n. 洗涤', category: '日常词汇' },
  { word: 'waste', phonetic: '/weɪst/', meaning: 'n. 浪费；废物 v. 浪费', category: '托福词汇' },
  { word: 'watch', phonetic: '/wɒtʃ/', meaning: 'v. 观看 n. 手表', category: '日常词汇' },
  { word: 'water', phonetic: '/ˈwɔːtər/', meaning: 'n. 水 v. 浇水', category: '日常词汇' },
  { word: 'waterproof', phonetic: '/ˈwɔːtərpruːf/', meaning: 'adj. 防水的', category: '托福词汇' },
  { word: 'wave', phonetic: '/weɪv/', meaning: 'n. 波浪 v. 挥手', category: '托福词汇' },
  { word: 'wax', phonetic: '/wæks/', meaning: 'n. 蜡 v. 打蜡', category: '托福词汇' },
  { word: 'way', phonetic: '/weɪ/', meaning: 'n. 道路；方法', category: '日常词汇' },
  { word: 'we', phonetic: '/wiː/', meaning: 'pron. 我们', category: '日常词汇' },
  { word: 'weak', phonetic: '/wiːk/', meaning: 'adj. 弱的', category: '托福词汇' },
  { word: 'weakness', phonetic: '/ˈwiːknəs/', meaning: 'n. 弱点', category: '托福词汇' },
  { word: 'wealth', phonetic: '/welθ/', meaning: 'n. 财富', category: '托福词汇' },
  { word: 'wealthy', phonetic: '/ˈwelθi/', meaning: 'adj. 富有的', category: '托福词汇' },
  { word: 'weapon', phonetic: '/ˈwepən/', meaning: 'n. 武器', category: '托福词汇' },
  { word: 'wear', phonetic: '/weər/', meaning: 'v. 穿；戴', category: '日常词汇' },
  { word: 'weather', phonetic: '/ˈweðər/', meaning: 'n. 天气', category: '日常词汇' },
  { word: 'weave', phonetic: '/wiːv/', meaning: 'v. 编织', category: 'GRE词汇' },
  { word: 'web', phonetic: '/web/', meaning: 'n. 网；网络', category: '托福词汇' },
  { word: 'website', phonetic: '/ˈwebsaɪt/', meaning: 'n. 网站', category: '托福词汇' },
  { word: 'wedding', phonetic: '/ˈwedɪŋ/', meaning: 'n. 婚礼', category: '托福词汇' },
  { word: 'wedge', phonetic: '/wedʒ/', meaning: 'n. 楔子 v. 楔入', category: 'GRE词汇' },
  { word: 'Wednesday', phonetic: '/ˈwenzdeɪ/', meaning: 'n. 星期三', category: '日常词汇' },
  { word: 'weed', phonetic: '/wiːd/', meaning: 'n. 杂草 v. 除草', category: '托福词汇' },
  { word: 'week', phonetic: '/wiːk/', meaning: 'n. 星期', category: '日常词汇' },
  { word: 'weekday', phonetic: '/ˈwiːkdeɪ/', meaning: 'n. 工作日', category: '托福词汇' },
  { word: 'weekend', phonetic: '/ˈwiːkend/', meaning: 'n. 周末', category: '日常词汇' },
  { word: 'weekly', phonetic: '/ˈwiːkli/', meaning: 'adj. 每周的 adv. 每周', category: '托福词汇' },
  { word: 'weep', phonetic: '/wiːp/', meaning: 'v. 哭泣', category: '托福词汇' },
  { word: 'weigh', phonetic: '/weɪ/', meaning: 'v. 称重；权衡', category: '托福词汇' },
  { word: 'weight', phonetic: '/weɪt/', meaning: 'n. 重量；体重', category: '托福词汇' },
  { word: 'weird', phonetic: '/wɪrd/', meaning: 'adj. 怪异的', category: '托福词汇' },
  { word: 'welcome', phonetic: '/ˈwelkəm/', meaning: 'adj. 受欢迎的 v. 欢迎', category: '日常词汇' },
  { word: 'welfare', phonetic: '/ˈwelfeər/', meaning: 'n. 福利', category: 'GRE词汇' },
  { word: 'well', phonetic: '/wel/', meaning: 'adv. 好 n. 井', category: '日常词汇' },
  { word: 'well-known', phonetic: '/ˈwel noʊn/', meaning: 'adj. 著名的', category: '托福词汇' },
  { word: 'west', phonetic: '/west/', meaning: 'n. 西方 adj. 西方的', category: '托福词汇' },
  { word: 'western', phonetic: '/ˈwestərn/', meaning: 'adj. 西方的', category: '托福词汇' },
  { word: 'wet', phonetic: '/wet/', meaning: 'adj. 湿的 v. 弄湿', category: '托福词汇' },
  { word: 'whale', phonetic: '/weɪl/', meaning: 'n. 鲸鱼', category: '托福词汇' },
  { word: 'what', phonetic: '/wɒt/', meaning: 'pron. 什么 adj. 什么的', category: '日常词汇' },
  { word: 'whatever', phonetic: '/wɒtˈevər/', meaning: 'pron. 无论什么', category: '托福词汇' },
  { word: 'wheat', phonetic: '/wiːt/', meaning: 'n. 小麦', category: '托福词汇' },
  { word: 'wheel', phonetic: '/wiːl/', meaning: 'n. 轮子', category: '托福词汇' },
  { word: 'when', phonetic: '/wen/', meaning: 'adv. 什么时候 conj. 当...时', category: '日常词汇' },
  { word: 'whenever', phonetic: '/wenˈevər/', meaning: 'conj. 无论何时', category: '托福词汇' },
  { word: 'where', phonetic: '/weər/', meaning: 'adv. 哪里', category: '日常词汇' },
  { word: 'whereas', phonetic: '/weərˈæz/', meaning: 'conj. 然而', category: 'GRE词汇' },
  { word: 'wherever', phonetic: '/weərˈevər/', meaning: 'conj. 无论哪里', category: '托福词汇' },
  { word: 'whether', phonetic: '/ˈweðər/', meaning: 'conj. 是否', category: '托福词汇' },
  { word: 'which', phonetic: '/wɪtʃ/', meaning: 'pron. 哪一个', category: '日常词汇' },
  { word: 'whichever', phonetic: '/wɪtʃˈevər/', meaning: 'pron. 无论哪个', category: '托福词汇' },
  { word: 'while', phonetic: '/waɪl/', meaning: 'conj. 当...时；虽然 n. 一会儿', category: '托福词汇' },
  { word: 'whisper', phonetic: '/ˈwɪspər/', meaning: 'v./n. 低语', category: '托福词汇' },
  { word: 'white', phonetic: '/waɪt/', meaning: 'adj. 白色的 n. 白色', category: '日常词汇' },
  { word: 'who', phonetic: '/huː/', meaning: 'pron. 谁', category: '日常词汇' },
  { word: 'whoever', phonetic: '/huːˈevər/', meaning: 'pron. 无论谁', category: '托福词汇' },
  { word: 'whole', phonetic: '/hoʊl/', meaning: 'adj. 完整的 n. 整体', category: '托福词汇' },
  { word: 'wholly', phonetic: '/ˈhoʊlli/', meaning: 'adv. 完全地', category: 'GRE词汇' },
  { word: 'whom', phonetic: '/huːm/', meaning: 'pron. 谁（宾格）', category: '托福词汇' },
  { word: 'whose', phonetic: '/huːz/', meaning: 'pron. 谁的', category: '日常词汇' },
  { word: 'why', phonetic: '/waɪ/', meaning: 'adv. 为什么', category: '日常词汇' },
  { word: 'wicked', phonetic: '/ˈwɪkɪd/', meaning: 'adj. 邪恶的', category: 'GRE词汇' },
  { word: 'wide', phonetic: '/waɪd/', meaning: 'adj. 宽的', category: '托福词汇' },
  { word: 'widely', phonetic: '/ˈwaɪdli/', meaning: 'adv. 广泛地', category: '托福词汇' },
  { word: 'widen', phonetic: '/ˈwaɪdn/', meaning: 'v. 加宽', category: 'GRE词汇' },
  { word: 'widespread', phonetic: '/ˈwaɪdspred/', meaning: 'adj. 广泛的', category: 'GRE词汇' },
  { word: 'widow', phonetic: '/ˈwɪdoʊ/', meaning: 'n. 寡妇', category: '托福词汇' },
  { word: 'width', phonetic: '/wɪdθ/', meaning: 'n. 宽度', category: '托福词汇' },
  { word: 'wife', phonetic: '/waɪf/', meaning: 'n. 妻子', category: '日常词汇' },
  { word: 'wild', phonetic: '/waɪld/', meaning: 'adj. 野生的；疯狂的', category: '托福词汇' },
  { word: 'wildlife', phonetic: '/ˈwaɪldlaɪf/', meaning: 'n. 野生动物', category: '托福词汇' },
  { word: 'will', phonetic: '/wɪl/', meaning: 'aux. 将 n. 意志；遗嘱', category: '日常词汇' },
  { word: 'willing', phonetic: '/ˈwɪlɪŋ/', meaning: 'adj. 愿意的', category: '托福词汇' },
  { word: 'win', phonetic: '/wɪn/', meaning: 'v. 赢 n. 胜利', category: '日常词汇' },
  { word: 'wind', phonetic: '/wɪnd/', meaning: 'n. 风 v. 缠绕', category: '托福词汇' },
  { word: 'window', phonetic: '/ˈwɪndoʊ/', meaning: 'n. 窗户', category: '日常词汇' },
  { word: 'wine', phonetic: '/waɪn/', meaning: 'n. 葡萄酒', category: '托福词汇' },
  { word: 'wing', phonetic: '/wɪŋ/', meaning: 'n. 翅膀', category: '托福词汇' },
  { word: 'winner', phonetic: '/ˈwɪnər/', meaning: 'n. 获胜者', category: '托福词汇' },
  { word: 'winter', phonetic: '/ˈwɪntər/', meaning: 'n. 冬天', category: '日常词汇' },
  { word: 'wipe', phonetic: '/waɪp/', meaning: 'v. 擦', category: '托福词汇' },
  { word: 'wire', phonetic: '/waɪər/', meaning: 'n. 电线', category: '托福词汇' },
  { word: 'wisdom', phonetic: '/ˈwɪzdəm/', meaning: 'n. 智慧', category: '托福词汇' },
  { word: 'wise', phonetic: '/waɪz/', meaning: 'adj. 明智的', category: '托福词汇' },
  { word: 'wish', phonetic: '/wɪʃ/', meaning: 'v./n. 希望', category: '日常词汇' },
  { word: 'wit', phonetic: '/wɪt/', meaning: 'n. 机智；才智', category: 'GRE词汇' },
  { word: 'with', phonetic: '/wɪð/', meaning: 'prep. 和...一起', category: '日常词汇' },
  { word: 'withdraw', phonetic: '/wɪðˈdrɔː/', meaning: 'v. 撤回；取款', category: 'GRE词汇' },
  { word: 'within', phonetic: '/wɪˈðɪn/', meaning: 'prep. 在...之内', category: '托福词汇' },
  { word: 'without', phonetic: '/wɪˈðaʊt/', meaning: 'prep. 没有', category: '日常词汇' },
  { word: 'witness', phonetic: '/ˈwɪtnəs/', meaning: 'n. 目击者 v. 目击', category: '托福词汇' },
  { word: 'wolf', phonetic: '/wʊlf/', meaning: 'n. 狼', category: '托福词汇' },
  { word: 'woman', phonetic: '/ˈwʊmən/', meaning: 'n. 女人', category: '日常词汇' },
  { word: 'wonder', phonetic: '/ˈwʌndər/', meaning: 'v. 想知道 n. 奇迹', category: '托福词汇' },
  { word: 'wonderful', phonetic: '/ˈwʌndərfl/', meaning: 'adj. 美妙的', category: '托福词汇' },
  { word: 'wood', phonetic: '/wʊd/', meaning: 'n. 木头；树林', category: '托福词汇' },
  { word: 'wooden', phonetic: '/ˈwʊdn/', meaning: 'adj. 木制的', category: '托福词汇' },
  { word: 'wool', phonetic: '/wʊl/', meaning: 'n. 羊毛', category: '托福词汇' },
  { word: 'word', phonetic: '/wɜːrd/', meaning: 'n. 单词；话语', category: '日常词汇' },
  { word: 'work', phonetic: '/wɜːrk/', meaning: 'n. 工作 v. 工作', category: '日常词汇' },
  { word: 'worker', phonetic: '/ˈwɜːrkər/', meaning: 'n. 工人', category: '托福词汇' },
  { word: 'workforce', phonetic: '/ˈwɜːrkfɔːrs/', meaning: 'n. 劳动力', category: 'GRE词汇' },
  { word: 'workshop', phonetic: '/ˈwɜːrkʃɒp/', meaning: 'n. 车间；研讨会', category: '托福词汇' },
  { word: 'world', phonetic: '/wɜːrld/', meaning: 'n. 世界', category: '日常词汇' },
  { word: 'worldwide', phonetic: '/ˈwɜːrldwaɪd/', meaning: 'adj. 全世界的', category: '托福词汇' },
  { word: 'worm', phonetic: '/wɜːrm/', meaning: 'n. 虫子', category: '托福词汇' },
  { word: 'worry', phonetic: '/ˈwɜːri/', meaning: 'v./n. 担心', category: '日常词汇' },
  { word: 'worse', phonetic: '/wɜːrs/', meaning: 'adj. 更坏的', category: '托福词汇' },
  { word: 'worship', phonetic: '/ˈwɜːrʃɪp/', meaning: 'n./v. 崇拜', category: 'GRE词汇' },
  { word: 'worst', phonetic: '/wɜːrst/', meaning: 'adj. 最坏的', category: '托福词汇' },
  { word: 'worth', phonetic: '/wɜːrθ/', meaning: 'adj. 值得的 n. 价值', category: '托福词汇' },
  { word: 'worthless', phonetic: '/ˈwɜːrθləs/', meaning: 'adj. 无价值的', category: 'GRE词汇' },
  { word: 'worthwhile', phonetic: '/ˌwɜːrθˈwaɪl/', meaning: 'adj. 值得做的', category: '托福词汇' },
  { word: 'worthy', phonetic: '/ˈwɜːrði/', meaning: 'adj. 值得的', category: 'GRE词汇' },
  { word: 'wound', phonetic: '/wuːnd/', meaning: 'n. 伤口 v. 受伤', category: '托福词汇' },
  { word: 'wrap', phonetic: '/ræp/', meaning: 'v. 包裹', category: '托福词汇' },
  { word: 'wrath', phonetic: '/ræθ/', meaning: 'n. 愤怒', category: 'GRE词汇' },
  { word: 'wreck', phonetic: '/rek/', meaning: 'n. 残骸 v. 破坏', category: 'GRE词汇' },
  { word: 'wrist', phonetic: '/rɪst/', meaning: 'n. 手腕', category: '托福词汇' },
  { word: 'write', phonetic: '/raɪt/', meaning: 'v. 写', category: '日常词汇' },
  { word: 'writer', phonetic: '/ˈraɪtər/', meaning: 'n. 作家', category: '托福词汇' },
  { word: 'writing', phonetic: '/ˈraɪtɪŋ/', meaning: 'n. 写作；文字', category: '托福词汇' },
  { word: 'wrong', phonetic: '/rɒŋ/', meaning: 'adj. 错误的 adv. 错误地', category: '日常词汇' },
  
  // X 字母开头的单词
  { word: 'X-ray', phonetic: '/ˈeks reɪ/', meaning: 'n. X射线；X光片', category: '托福词汇' },
  { word: 'xenophobia', phonetic: '/ˌzenəˈfoʊbiə/', meaning: 'n. 排外心理', category: 'GRE词汇' },
  { word: 'xylophone', phonetic: '/ˈzaɪləfoʊn/', meaning: 'n. 木琴', category: '托福词汇' },
];

async function getCategoryIds(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .select('id, name');
  
  if (error) return new Map();
  
  const map = new Map<string, number>();
  data?.forEach((cat: { id: number; name: string }) => map.set(cat.name, cat.id));
  return map;
}

async function getExistingWords(): Promise<Set<string>> {
  const { data, error } = await fetchAllFromSupabase(
    supabase.from(WORDS_TABLE).select('word')
  );
  
  if (error) return new Set();
  return new Set(data?.map((w: { word: string }) => w.word.toLowerCase()) || []);
}

async function insertWords(words: WordData[], categoryIds: Map<string, number>, existingSet: Set<string>): Promise<number> {
  const defaultCategoryId = categoryIds.get('日常词汇') || 1;
  let inserted = 0;
  const records: Array<{
    word: string;
    phonetic: string;
    meaning: string;
    example_sentence: string;
    category_id: number;
  }> = [];
  
  for (const w of words) {
    const wordLower = w.word.toLowerCase();
    if (existingSet.has(wordLower)) continue;
    
    const categoryId = categoryIds.get(w.category || '日常词汇') || defaultCategoryId;
    records.push({
      word: w.word,
      phonetic: w.phonetic,
      meaning: w.meaning,
      example_sentence: '',
      category_id: categoryId,
    });
    inserted++;
  }
  
  if (records.length > 0) {
    const { error } = await supabase.from(WORDS_TABLE).insert(records);
    if (error) {
      console.error('插入失败:', error.message);
      return 0;
    }
  }
  
  return inserted;
}

async function main() {
  console.log('=== 开始导入 W-X 字母开头的单词 ===');
  console.log(`预定义单词数量: ${wordsWX.length}`);
  
  const categoryIds = await getCategoryIds();
  const existingSet = await getExistingWords();
  console.log(`已存在单词: ${existingSet.size} 个`);
  
  const inserted = await insertWords(wordsWX, categoryIds, existingSet);
  
  console.log(`\n=== 导入完成 ===`);
  console.log(`本次导入: ${inserted} 个单词`);
}

main().catch(console.error);
