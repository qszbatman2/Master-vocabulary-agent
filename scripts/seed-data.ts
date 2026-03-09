import { getSupabaseClient } from '../src/storage/database/supabase-client';

const client = getSupabaseClient();

// 词库分类数据
const categories = [
  { name: '雅思词汇', description: 'IELTS雅思考试常用词汇' },
  { name: '托福词汇', description: 'TOEFL托福考试常用词汇' },
  { name: 'GRE词汇', description: 'GRE研究生入学考试词汇' },
  { name: '日常词汇', description: '日常生活常用词汇' },
];

// 单词数据
const wordsData: Record<string, Array<{
  word: string;
  phonetic: string;
  meaning: string;
  exampleSentence: string;
}>> = {
  '雅思词汇': [
    {
      word: 'academic',
      phonetic: '/ˌækəˈdemɪk/',
      meaning: 'adj. 学术的；学业的',
      exampleSentence: 'She has a strong academic background in physics.',
    },
    {
      word: 'environment',
      phonetic: '/ɪnˈvaɪrənmənt/',
      meaning: 'n. 环境',
      exampleSentence: 'We need to protect the natural environment.',
    },
    {
      word: 'significant',
      phonetic: '/sɪɡˈnɪfɪkənt/',
      meaning: 'adj. 重要的；显著的',
      exampleSentence: 'There has been a significant increase in sales.',
    },
    {
      word: 'consequence',
      phonetic: '/ˈkɒnsɪkwəns/',
      meaning: 'n. 结果；后果',
      exampleSentence: 'He suffered the consequences of his actions.',
    },
    {
      word: 'evaluate',
      phonetic: '/ɪˈvæljueɪt/',
      meaning: 'v. 评估；评价',
      exampleSentence: 'We need to evaluate the situation carefully.',
    },
    {
      word: 'potential',
      phonetic: '/pəˈtenʃl/',
      meaning: 'n. 潜力；可能性 adj. 潜在的',
      exampleSentence: 'She has the potential to become a great leader.',
    },
    {
      word: 'achievement',
      phonetic: '/əˈtʃiːvmənt/',
      meaning: 'n. 成就；完成',
      exampleSentence: 'Winning the competition was a great achievement.',
    },
    {
      word: 'contribute',
      phonetic: '/kənˈtrɪbjuːt/',
      meaning: 'v. 贡献；捐赠',
      exampleSentence: 'Everyone should contribute to the team effort.',
    },
    {
      word: 'establish',
      phonetic: '/ɪˈstæblɪʃ/',
      meaning: 'v. 建立；确立',
      exampleSentence: 'The company was established in 1990.',
    },
    {
      word: 'perspective',
      phonetic: '/pəˈspektɪv/',
      meaning: 'n. 观点；看法；透视',
      exampleSentence: 'From my perspective, this is a good decision.',
    },
  ],
  '托福词汇': [
    {
      word: 'analyze',
      phonetic: '/ˈænəlaɪz/',
      meaning: 'v. 分析',
      exampleSentence: 'Scientists analyze data to draw conclusions.',
    },
    {
      word: 'concept',
      phonetic: '/ˈkɒnsept/',
      meaning: 'n. 概念；观念',
      exampleSentence: 'The concept of freedom is important in philosophy.',
    },
    {
      word: 'demonstrate',
      phonetic: '/ˈdemənstreɪt/',
      meaning: 'v. 证明；示范',
      exampleSentence: 'The experiment demonstrates the theory.',
    },
    {
      word: 'fundamental',
      phonetic: '/ˌfʌndəˈmentl/',
      meaning: 'adj. 基本的；根本的',
      exampleSentence: 'Understanding grammar is fundamental to learning a language.',
    },
    {
      word: 'generate',
      phonetic: '/ˈdʒenəreɪt/',
      meaning: 'v. 产生；生成',
      exampleSentence: 'Solar panels generate electricity from sunlight.',
    },
    {
      word: 'hypothesis',
      phonetic: '/haɪˈpɒθəsɪs/',
      meaning: 'n. 假设；假说',
      exampleSentence: 'The hypothesis needs to be tested.',
    },
    {
      word: 'innovative',
      phonetic: '/ˈɪnəvətɪv/',
      meaning: 'adj. 创新的',
      exampleSentence: 'The company is known for its innovative products.',
    },
    {
      word: 'maintain',
      phonetic: '/meɪnˈteɪn/',
      meaning: 'v. 维持；保持',
      exampleSentence: 'It is important to maintain a healthy lifestyle.',
    },
    {
      word: 'objective',
      phonetic: '/əbˈdʒektɪv/',
      meaning: 'n. 目标 adj. 客观的',
      exampleSentence: 'The objective of the study is to find a cure.',
    },
    {
      word: 'perspective',
      phonetic: '/pəˈspektɪv/',
      meaning: 'n. 观点；看法',
      exampleSentence: 'Looking at the problem from a different perspective helps.',
    },
  ],
  'GRE词汇': [
    {
      word: 'aberration',
      phonetic: '/ˌæbəˈreɪʃn/',
      meaning: 'n. 偏差；反常现象',
      exampleSentence: 'This result is an aberration, not the norm.',
    },
    {
      word: 'catalyst',
      phonetic: '/ˈkætəlɪst/',
      meaning: 'n. 催化剂；促进因素',
      exampleSentence: 'The new policy acted as a catalyst for change.',
    },
    {
      word: 'dichotomy',
      phonetic: '/daɪˈkɒtəmi/',
      meaning: 'n. 二分法；对立',
      exampleSentence: 'There is a dichotomy between theory and practice.',
    },
    {
      word: 'empirical',
      phonetic: '/ɪmˈpɪrɪkl/',
      meaning: 'adj. 经验的；实证的',
      exampleSentence: 'The study is based on empirical evidence.',
    },
    {
      word: 'facetious',
      phonetic: '/fəˈsiːʃəs/',
      meaning: 'adj. 滑稽的；爱开玩笑的',
      exampleSentence: 'His facetious remark was not appreciated.',
    },
    {
      word: 'gregarious',
      phonetic: '/ɡrɪˈɡeəriəs/',
      meaning: 'adj. 群居的；爱社交的',
      exampleSentence: 'She is a gregarious person who loves parties.',
    },
    {
      word: 'hegemony',
      phonetic: '/hɪˈdʒeməni/',
      meaning: 'n. 霸权；领导权',
      exampleSentence: 'The country maintained its hegemony in the region.',
    },
    {
      word: 'iconoclast',
      phonetic: '/aɪˈkɒnəklæst/',
      meaning: 'n. 反对偶像崇拜者；反传统者',
      exampleSentence: 'He was an iconoclast who challenged traditional beliefs.',
    },
    {
      word: 'juxtapose',
      phonetic: '/ˌdʒʌkstəˈpəʊz/',
      meaning: 'v. 并列；并置',
      exampleSentence: 'The artist juxtaposes old and new elements.',
    },
    {
      word: 'kinetic',
      phonetic: '/kɪˈnetɪk/',
      meaning: 'adj. 运动的；动力学的',
      exampleSentence: 'Kinetic energy is the energy of motion.',
    },
  ],
  '日常词汇': [
    {
      word: 'beautiful',
      phonetic: '/ˈbjuːtɪfl/',
      meaning: 'adj. 美丽的',
      exampleSentence: 'The sunset is beautiful.',
    },
    {
      word: 'breakfast',
      phonetic: '/ˈbrekfəst/',
      meaning: 'n. 早餐',
      exampleSentence: 'I have breakfast at 7 am every day.',
    },
    {
      word: 'computer',
      phonetic: '/kəmˈpjuːtə/',
      meaning: 'n. 计算机；电脑',
      exampleSentence: 'I use my computer for work.',
    },
    {
      word: 'delicious',
      phonetic: '/dɪˈlɪʃəs/',
      meaning: 'adj. 美味的',
      exampleSentence: 'The food is delicious.',
    },
    {
      word: 'exercise',
      phonetic: '/ˈeksəsaɪz/',
      meaning: 'n./v. 运动；练习',
      exampleSentence: 'Exercise is good for your health.',
    },
    {
      word: 'friend',
      phonetic: '/frend/',
      meaning: 'n. 朋友',
      exampleSentence: 'She is my best friend.',
    },
    {
      word: 'happy',
      phonetic: '/ˈhæpi/',
      meaning: 'adj. 快乐的；幸福的',
      exampleSentence: 'I am very happy today.',
    },
    {
      word: 'important',
      phonetic: '/ɪmˈpɔːtnt/',
      meaning: 'adj. 重要的',
      exampleSentence: 'Family is important to me.',
    },
    {
      word: 'journey',
      phonetic: '/ˈdʒɜːni/',
      meaning: 'n. 旅程；旅行',
      exampleSentence: 'Life is a journey, not a destination.',
    },
    {
      word: 'knowledge',
      phonetic: '/ˈnɒlɪdʒ/',
      meaning: 'n. 知识；了解',
      exampleSentence: 'Knowledge is power.',
    },
  ],
};

async function seedData() {
  try {
    console.log('开始插入词库分类数据...');

    // 插入词库分类
    const { data: insertedCategories, error: categoryError } = await client
      .from('vocabulary_categories')
      .insert(categories)
      .select();

    if (categoryError) {
      console.error('插入词库分类失败:', categoryError);
      return;
    }

    console.log('词库分类插入成功:', insertedCategories?.length);

    // 创建词库分类映射
    const categoryMap: Record<string, number> = {};
    insertedCategories?.forEach((cat) => {
      categoryMap[cat.name] = cat.id;
    });

    // 插入单词数据
    console.log('开始插入单词数据...');
    let totalWords = 0;

    for (const [categoryName, words] of Object.entries(wordsData)) {
      const categoryId = categoryMap[categoryName];
      if (!categoryId) {
        console.error(`找不到词库分类: ${categoryName}`);
        continue;
      }

      const wordsWithCategoryId = words.map((word) => ({
        word: word.word,
        phonetic: word.phonetic,
        meaning: word.meaning,
        example_sentence: word.exampleSentence,
        category_id: categoryId,
      }));

      const { data: insertedWords, error: wordError } = await client
        .from('words')
        .insert(wordsWithCategoryId)
        .select();

      if (wordError) {
        console.error(`插入${categoryName}单词失败:`, wordError);
      } else {
        console.log(`${categoryName}单词插入成功:`, insertedWords?.length);
        totalWords += insertedWords?.length || 0;
      }
    }

    console.log(`\n数据导入完成！`);
    console.log(`- 词库分类: ${insertedCategories?.length} 个`);
    console.log(`- 单词总数: ${totalWords} 个`);
  } catch (error) {
    console.error('数据导入失败:', error);
  }
}

seedData();
