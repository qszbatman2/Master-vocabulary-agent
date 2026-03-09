import { getSupabaseClient } from '@/storage/database/supabase-client';

const CATEGORIES = [
  { id: 1, name: '雅思词汇', description: 'IELTS雅思考试常用词汇' },
  { id: 2, name: '托福词汇', description: 'TOEFL托福考试常用词汇' },
  { id: 3, name: 'GRE词汇', description: 'GRE研究生入学考试词汇' },
  { id: 4, name: '日常词汇', description: '日常生活常用词汇' },
];

// 雅思核心词汇
const IELTS_WORDS = [
  { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃；抛弃', example: 'Never abandon your dreams.' },
  { word: 'ability', phonetic: '/əˈbɪləti/', meaning: 'n. 能力；才能', example: 'She has the ability to succeed.' },
  { word: 'abnormal', phonetic: '/æbˈnɔːml/', meaning: 'adj. 反常的；异常的', example: 'The weather has been abnormal this year.' },
  { word: 'aboard', phonetic: '/əˈbɔːd/', meaning: 'adv./prep. 在船/飞机上', example: 'Welcome aboard!' },
  { word: 'abolish', phonetic: '/əˈbɒlɪʃ/', meaning: 'v. 废除；废止', example: 'Slavery was abolished in 1865.' },
  { word: 'abroad', phonetic: '/əˈbrɔːd/', meaning: 'adv. 在国外；到国外', example: 'He went abroad to study.' },
  { word: 'abrupt', phonetic: '/əˈbrʌpt/', meaning: 'adj. 突然的；唐突的', example: 'There was an abrupt change in the weather.' },
  { word: 'absence', phonetic: '/ˈæbsəns/', meaning: 'n. 缺席；不在', example: 'His absence was noticed by everyone.' },
  { word: 'absent', phonetic: '/ˈæbsənt/', meaning: 'adj. 缺席的；不在的', example: 'He was absent from school yesterday.' },
  { word: 'absolute', phonetic: '/ˈæbsəluːt/', meaning: 'adj. 绝对的；完全的', example: 'I have absolute confidence in you.' },
  { word: 'absorb', phonetic: '/əbˈzɔːb/', meaning: 'v. 吸收；理解', example: 'Plants absorb carbon dioxide.' },
  { word: 'abstract', phonetic: '/ˈæbstrækt/', meaning: 'adj. 抽象的 n. 摘要', example: 'The concept is too abstract to understand.' },
  { word: 'abundant', phonetic: '/əˈbʌndənt/', meaning: 'adj. 丰富的；充裕的', example: 'The country has abundant natural resources.' },
  { word: 'abuse', phonetic: '/əˈbjuːs/', meaning: 'n./v. 滥用；虐待', example: 'Drug abuse is a serious problem.' },
  { word: 'academic', phonetic: '/ˌækəˈdemɪk/', meaning: 'adj. 学术的；学业的', example: 'She has excellent academic performance.' },
  { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'v. 加速；促进', example: 'The government plans to accelerate growth.' },
  { word: 'accent', phonetic: '/ˈæksent/', meaning: 'n. 口音；重音', example: 'She speaks with a British accent.' },
  { word: 'accept', phonetic: '/əkˈsept/', meaning: 'v. 接受；认可', example: 'Please accept my apology.' },
  { word: 'access', phonetic: '/ˈækses/', meaning: 'n. 通道；机会 v. 进入', example: 'Students have access to the library.' },
  { word: 'accident', phonetic: '/ˈæksɪdənt/', meaning: 'n. 事故；意外', example: 'He was injured in a car accident.' },
  { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', meaning: 'v. 容纳；适应', example: 'The hotel can accommodate 500 guests.' },
  { word: 'accompany', phonetic: '/əˈkʌmpəni/', meaning: 'v. 陪伴；伴随', example: 'She asked me to accompany her.' },
  { word: 'accomplish', phonetic: '/əˈkʌmplɪʃ/', meaning: 'v. 完成；实现', example: 'We accomplished our goal.' },
  { word: 'accord', phonetic: '/əˈkɔːd/', meaning: 'v. 符合；给予 n. 协议', example: 'His actions accord with his words.' },
  { word: 'account', phonetic: '/əˈkaʊnt/', meaning: 'n. 账户；描述 v. 解释', example: 'Open a bank account.' },
  { word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', meaning: 'v. 积累；积聚', example: 'He accumulated great wealth.' },
  { word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 准确的；精确的', example: 'The data must be accurate.' },
  { word: 'accuse', phonetic: '/əˈkjuːz/', meaning: 'v. 指控；谴责', example: 'He was accused of theft.' },
  { word: 'accustomed', phonetic: '/əˈkʌstəmd/', meaning: 'adj. 习惯的', example: 'I am accustomed to getting up early.' },
  { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 实现；达到', example: 'She achieved her goal.' },
  { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', meaning: 'v. 承认；确认', example: 'He acknowledged his mistake.' },
  { word: 'acquire', phonetic: '/əˈkwaɪə/', meaning: 'v. 获得；学到', example: 'She acquired new skills.' },
  { word: 'adapt', phonetic: '/əˈdæpt/', meaning: 'v. 适应；改编', example: 'He adapted to the new environment.' },
  { word: 'adequate', phonetic: '/ˈædɪkwət/', meaning: 'adj. 足够的；适当的', example: 'We have adequate resources.' },
  { word: 'adjust', phonetic: '/əˈdʒʌst/', meaning: 'v. 调整；适应', example: 'Adjust the settings as needed.' },
  { word: 'administration', phonetic: '/ədˌmɪnɪˈstreɪʃn/', meaning: 'n. 管理；行政', example: 'The administration needs improvement.' },
  { word: 'admire', phonetic: '/ədˈmaɪə/', meaning: 'v. 钦佩；欣赏', example: 'I admire her courage.' },
  { word: 'admit', phonetic: '/ədˈmɪt/', meaning: 'v. 承认；准许进入', example: 'He admitted his guilt.' },
  { word: 'adolescent', phonetic: '/ˌædəˈlesnt/', meaning: 'n. 青少年 adj. 青春期的', example: 'Adolescents face many challenges.' },
  { word: 'adopt', phonetic: '/əˈdɒpt/', meaning: 'v. 采用；收养', example: 'They adopted a child.' },
  { word: 'adult', phonetic: '/ˈædʌlt/', meaning: 'n. 成年人 adj. 成年的', example: 'Adults should be responsible.' },
  { word: 'advance', phonetic: '/ədˈvɑːns/', meaning: 'v. 前进；推进 n. 进步', example: 'Technology continues to advance.' },
  { word: 'advantage', phonetic: '/ədˈvɑːntɪdʒ/', meaning: 'n. 优势；好处', example: 'This gives us an advantage.' },
  { word: 'adventure', phonetic: '/ədˈventʃə/', meaning: 'n. 冒险；奇遇', example: 'Life is full of adventures.' },
  { word: 'advertise', phonetic: '/ˈædvətaɪz/', meaning: 'v. 做广告；宣传', example: 'Companies advertise their products.' },
  { word: 'advocate', phonetic: '/ˈædvəkeɪt/', meaning: 'v. 提倡 n. 提倡者', example: 'He advocates for human rights.' },
  { word: 'affair', phonetic: '/əˈfeə/', meaning: 'n. 事务；事件', example: 'It is a private affair.' },
  { word: 'affect', phonetic: '/əˈfekt/', meaning: 'v. 影响；感动', example: 'The decision will affect everyone.' },
  { word: 'afford', phonetic: '/əˈfɔːd/', meaning: 'v. 负担得起；提供', example: 'I cannot afford a new car.' },
  { word: 'agriculture', phonetic: '/ˈæɡrɪkʌltʃə/', meaning: 'n. 农业', example: 'Agriculture is important to the economy.' },
  { word: 'aircraft', phonetic: '/ˈeəkrɑːft/', meaning: 'n. 飞行器；飞机', example: 'The aircraft landed safely.' },
];

// 托福核心词汇
const TOEFL_WORDS = [
  { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃；抛弃', example: 'Never abandon hope.' },
  { word: 'abide', phonetic: '/əˈbaɪd/', meaning: 'v. 遵守；忍受', example: 'Abide by the rules.' },
  { word: 'abnormal', phonetic: '/æbˈnɔːml/', meaning: 'adj. 异常的', example: 'The weather is abnormal.' },
  { word: 'abolish', phonetic: '/əˈbɒlɪʃ/', meaning: 'v. 废除', example: 'Slavery was abolished.' },
  { word: 'abound', phonetic: '/əˈbaʊnd/', meaning: 'v. 大量存在', example: 'Fish abound in this lake.' },
  { word: 'abroad', phonetic: '/əˈbrɔːd/', meaning: 'adv. 在国外', example: 'Study abroad.' },
  { word: 'abrupt', phonetic: '/əˈbrʌpt/', meaning: 'adj. 突然的', example: 'An abrupt change occurred.' },
  { word: 'absence', phonetic: '/ˈæbsəns/', meaning: 'n. 缺席', example: 'His absence was noted.' },
  { word: 'absorb', phonetic: '/əbˈzɔːb/', meaning: 'v. 吸收', example: 'Paper absorbs water.' },
  { word: 'abstract', phonetic: '/ˈæbstrækt/', meaning: 'adj. 抽象的', example: 'Abstract concepts are hard.' },
  { word: 'absurd', phonetic: '/əbˈsɜːd/', meaning: 'adj. 荒谬的', example: 'The idea was absurd.' },
  { word: 'abundance', phonetic: '/əˈbʌndəns/', meaning: 'n. 丰富', example: 'There is an abundance of food.' },
  { word: 'abuse', phonetic: '/əˈbjuːs/', meaning: 'n./v. 滥用', example: 'Drug abuse is dangerous.' },
  { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'v. 加速', example: 'Accelerate the process.' },
  { word: 'acceptable', phonetic: '/əkˈseptəbl/', meaning: 'adj. 可接受的', example: 'The offer is acceptable.' },
  { word: 'access', phonetic: '/ˈækses/', meaning: 'n. 通道 v. 接近', example: 'Gain access to the system.' },
  { word: 'accessible', phonetic: '/əkˈsesəbl/', meaning: 'adj. 可接近的', example: 'The library is accessible.' },
  { word: 'accessory', phonetic: '/əkˈsesəri/', meaning: 'n. 附件；从犯', example: 'Buy some accessories.' },
  { word: 'accident', phonetic: '/ˈæksɪdənt/', meaning: 'n. 事故', example: 'A car accident happened.' },
  { word: 'acclaim', phonetic: '/əˈkleɪm/', meaning: 'v. 称赞 n. 赞誉', example: 'The book was acclaimed.' },
  { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', meaning: 'v. 容纳；适应', example: 'Accommodate the guests.' },
  { word: 'accompany', phonetic: '/əˈkʌmpəni/', meaning: 'v. 陪伴', example: 'Accompany me to the door.' },
  { word: 'accomplice', phonetic: '/əˈkʌmplɪs/', meaning: 'n. 同谋', example: 'He was an accomplice.' },
  { word: 'accomplish', phonetic: '/əˈkʌmplɪʃ/', meaning: 'v. 完成', example: 'Accomplish the task.' },
  { word: 'accord', phonetic: '/əˈkɔːd/', meaning: 'v. 符合 n. 协议', example: 'They reached an accord.' },
  { word: 'account', phonetic: '/əˈkaʊnt/', meaning: 'n. 账户 v. 解释', example: 'Open an account.' },
  { word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', meaning: 'v. 积累', example: 'Accumulate wealth.' },
  { word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 准确的', example: 'Be accurate in your work.' },
  { word: 'accuse', phonetic: '/əˈkjuːz/', meaning: 'v. 指控', example: 'He was accused of theft.' },
  { word: 'accustomed', phonetic: '/əˈkʌstəmd/', meaning: 'adj. 习惯的', example: 'Be accustomed to hard work.' },
  { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 实现', example: 'Achieve your goals.' },
  { word: 'acid', phonetic: '/ˈæsɪd/', meaning: 'n. 酸 adj. 酸的', example: 'Acid rain is harmful.' },
  { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', meaning: 'v. 承认', example: 'Acknowledge your mistake.' },
  { word: 'acoustic', phonetic: '/əˈkuːstɪk/', meaning: 'adj. 声学的', example: 'Acoustic guitar sounds nice.' },
  { word: 'acquaint', phonetic: '/əˈkweɪnt/', meaning: 'v. 使了解', example: 'Acquaint yourself with the rules.' },
  { word: 'acquire', phonetic: '/əˈkwaɪə/', meaning: 'v. 获得', example: 'Acquire new skills.' },
  { word: 'acquisition', phonetic: '/ˌækwɪˈzɪʃn/', meaning: 'n. 获得', example: 'The acquisition was successful.' },
  { word: 'adequate', phonetic: '/ˈædɪkwət/', meaning: 'adj. 足够的', example: 'We have adequate supplies.' },
  { word: 'adhere', phonetic: '/ədˈhɪə/', meaning: 'v. 坚持；粘附', example: 'Adhere to the plan.' },
  { word: 'adjacent', phonetic: '/əˈdʒeɪsnt/', meaning: 'adj. 邻近的', example: 'The two buildings are adjacent.' },
  { word: 'adjust', phonetic: '/əˈdʒʌst/', meaning: 'v. 调整', example: 'Adjust the settings.' },
  { word: 'administer', phonetic: '/ədˈmɪnɪstə/', meaning: 'v. 管理', example: 'Administer the medicine.' },
  { word: 'administration', phonetic: '/ədˌmɪnɪˈstreɪʃn/', meaning: 'n. 管理', example: 'The administration is efficient.' },
  { word: 'admire', phonetic: '/ədˈmaɪə/', meaning: 'v. 钦佩', example: 'I admire your courage.' },
  { word: 'admit', phonetic: '/ədˈmɪt/', meaning: 'v. 承认', example: 'Admit your mistake.' },
  { word: 'adolescent', phonetic: '/ˌædəˈlesnt/', meaning: 'n. 青少年', example: 'Adolescents need guidance.' },
  { word: 'adopt', phonetic: '/əˈdɒpt/', meaning: 'v. 采用；收养', example: 'Adopt a new approach.' },
  { word: 'adore', phonetic: '/əˈdɔː/', meaning: 'v. 崇拜', example: 'She adores her children.' },
  { word: 'advance', phonetic: '/ədˈvɑːns/', meaning: 'v. 前进 n. 进步', example: 'Technology advances rapidly.' },
  { word: 'advantage', phonetic: '/ədˈvɑːntɪdʒ/', meaning: 'n. 优势', example: 'Take advantage of the opportunity.' },
];

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;
  
  const client = getSupabaseClient();
  
  try {
    // 检查分类是否存在
    const { data: existingCategories, error: catError } = await client
      .from('vocabulary_categories')
      .select('*');
    
    if (catError) {
      console.error('检查分类失败:', catError);
      return;
    }
    
    // 如果分类不存在，创建分类
    if (!existingCategories || existingCategories.length === 0) {
      console.log('初始化词库分类...');
      
      for (const cat of CATEGORIES) {
        const { error } = await client
          .from('vocabulary_categories')
          .insert(cat);
        
        if (error) {
          console.error(`创建分类 ${cat.name} 失败:`, error);
        }
      }
      
      // 导入雅思词汇
      console.log('导入雅思词汇...');
      const ieltsData = IELTS_WORDS.map(w => ({
        word: w.word,
        phonetic: w.phonetic,
        meaning: w.meaning,
        example_sentence: w.example,
        category_id: 1,
      }));
      
      const { error: ieltsError } = await client
        .from('words')
        .insert(ieltsData);
      
      if (ieltsError) {
        console.error('导入雅思词汇失败:', ieltsError);
      } else {
        console.log(`已导入 ${ieltsData.length} 个雅思词汇`);
      }
      
      // 导入托福词汇
      console.log('导入托福词汇...');
      const toeflData = TOEFL_WORDS.map(w => ({
        word: w.word,
        phonetic: w.phonetic,
        meaning: w.meaning,
        example_sentence: w.example,
        category_id: 2,
      }));
      
      const { error: toeflError } = await client
        .from('words')
        .insert(toeflData);
      
      if (toeflError) {
        console.error('导入托福词汇失败:', toeflError);
      } else {
        console.log(`已导入 ${toeflData.length} 个托福词汇`);
      }
      
      console.log('数据库初始化完成');
    } else {
      console.log('数据库已初始化，跳过');
    }
    
    initialized = true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}
