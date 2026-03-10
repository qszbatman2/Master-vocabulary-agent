import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 授权检查
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
  return authHeader === `Bearer ${adminKey}`;
}

// 分类数据
const CATEGORIES = [
  { name: '雅思词汇', description: 'IELTS雅思考试常用词汇' },
  { name: '托福词汇', description: 'TOEFL托福考试常用词汇' },
  { name: 'GRE词汇', description: 'GRE研究生入学考试词汇' },
  { name: '日常词汇', description: '日常生活常用词汇' },
  { name: '商务词汇', description: '商务英语常用词汇' },
  { name: '科技词汇', description: '科技领域专业词汇' },
  { name: '医学词汇', description: '医学领域专业词汇' },
  { name: '法律词汇', description: '法律领域专业词汇' },
];

// 完整单词数据 - A-Z 核心词汇
const ALL_WORDS = [
  // ========== A ==========
  { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃；抛弃', category: '托福词汇' },
  { word: 'abide', phonetic: '/əˈbaɪd/', meaning: 'v. 遵守；忍受', category: 'GRE词汇' },
  { word: 'ability', phonetic: '/əˈbɪləti/', meaning: 'n. 能力；才能', category: '托福词汇' },
  { word: 'abnormal', phonetic: '/æbˈnɔːml/', meaning: 'adj. 反常的；异常的', category: '托福词汇' },
  { word: 'aboard', phonetic: '/əˈbɔːd/', meaning: 'adv./prep. 在船/飞机上', category: '托福词汇' },
  { word: 'abolish', phonetic: '/əˈbɒlɪʃ/', meaning: 'v. 废除；废止', category: '托福词汇' },
  { word: 'abound', phonetic: '/əˈbaʊnd/', meaning: 'v. 大量存在', category: 'GRE词汇' },
  { word: 'abroad', phonetic: '/əˈbrɔːd/', meaning: 'adv. 在国外；到国外', category: '托福词汇' },
  { word: 'abrupt', phonetic: '/əˈbrʌpt/', meaning: 'adj. 突然的；唐突的', category: '托福词汇' },
  { word: 'absence', phonetic: '/ˈæbsəns/', meaning: 'n. 缺席；不在', category: '托福词汇' },
  { word: 'absent', phonetic: '/ˈæbsənt/', meaning: 'adj. 缺席的；不在的', category: '托福词汇' },
  { word: 'absolute', phonetic: '/ˈæbsəluːt/', meaning: 'adj. 绝对的；完全的', category: '托福词汇' },
  { word: 'absorb', phonetic: '/əbˈzɔːb/', meaning: 'v. 吸收；理解', category: '托福词汇' },
  { word: 'abstract', phonetic: '/ˈæbstrækt/', meaning: 'adj. 抽象的 n. 摘要', category: '托福词汇' },
  { word: 'absurd', phonetic: '/əbˈsɜːd/', meaning: 'adj. 荒谬的', category: 'GRE词汇' },
  { word: 'abundance', phonetic: '/əˈbʌndəns/', meaning: 'n. 丰富', category: '托福词汇' },
  { word: 'abundant', phonetic: '/əˈbʌndənt/', meaning: 'adj. 丰富的；充裕的', category: '托福词汇' },
  { word: 'abuse', phonetic: '/əˈbjuːs/', meaning: 'n./v. 滥用；虐待', category: '托福词汇' },
  { word: 'academic', phonetic: '/ˌækəˈdemɪk/', meaning: 'adj. 学术的；学业的', category: '托福词汇' },
  { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'v. 加速；促进', category: '托福词汇' },
  { word: 'accent', phonetic: '/ˈæksent/', meaning: 'n. 口音；重音', category: '托福词汇' },
  { word: 'accept', phonetic: '/əkˈsept/', meaning: 'v. 接受；认可', category: '托福词汇' },
  { word: 'acceptable', phonetic: '/əkˈseptəbl/', meaning: 'adj. 可接受的', category: '托福词汇' },
  { word: 'access', phonetic: '/ˈækses/', meaning: 'n. 通道；机会 v. 进入', category: '托福词汇' },
  { word: 'accessible', phonetic: '/əkˈsesəbl/', meaning: 'adj. 可接近的', category: '托福词汇' },
  { word: 'accessory', phonetic: '/əkˈsesəri/', meaning: 'n. 附件；从犯', category: '托福词汇' },
  { word: 'accident', phonetic: '/ˈæksɪdənt/', meaning: 'n. 事故；意外', category: '托福词汇' },
  { word: 'acclaim', phonetic: '/əˈkleɪm/', meaning: 'v. 称赞 n. 赞誉', category: 'GRE词汇' },
  { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', meaning: 'v. 容纳；适应', category: '托福词汇' },
  { word: 'accompaniment', phonetic: '/əˈkʌmpənimənt/', meaning: 'n. 伴奏；伴随物', category: '托福词汇' },
  { word: 'accompany', phonetic: '/əˈkʌmpəni/', meaning: 'v. 陪伴；伴随', category: '托福词汇' },
  { word: 'accomplice', phonetic: '/əˈkʌmplɪs/', meaning: 'n. 同谋', category: 'GRE词汇' },
  { word: 'accomplish', phonetic: '/əˈkʌmplɪʃ/', meaning: 'v. 完成；实现', category: '托福词汇' },
  { word: 'accord', phonetic: '/əˈkɔːd/', meaning: 'v. 符合；给予 n. 协议', category: '托福词汇' },
  { word: 'accordance', phonetic: '/əˈkɔːdns/', meaning: 'n. 一致；依照', category: '托福词汇' },
  { word: 'account', phonetic: '/əˈkaʊnt/', meaning: 'n. 账户；描述 v. 解释', category: '托福词汇' },
  { word: 'accountable', phonetic: '/əˈkaʊntəbl/', meaning: 'adj. 负有责任的', category: '托福词汇' },
  { word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', meaning: 'v. 积累；积聚', category: '托福词汇' },
  { word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 准确的；精确的', category: '托福词汇' },
  { word: 'accuse', phonetic: '/əˈkjuːz/', meaning: 'v. 指控；谴责', category: '托福词汇' },
  { word: 'accustomed', phonetic: '/əˈkʌstəmd/', meaning: 'adj. 习惯的', category: '托福词汇' },
  { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 实现；达到', category: '托福词汇' },
  { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', meaning: 'v. 承认；确认', category: '托福词汇' },
  { word: 'acquaint', phonetic: '/əˈkweɪnt/', meaning: 'v. 使了解', category: 'GRE词汇' },
  { word: 'acquaintance', phonetic: '/əˈkweɪntəns/', meaning: 'n. 熟人；了解', category: '托福词汇' },
  { word: 'acquire', phonetic: '/əˈkwaɪə/', meaning: 'v. 获得；学到', category: '托福词汇' },
  { word: 'acquisition', phonetic: '/ˌækwɪˈzɪʃn/', meaning: 'n. 获得；收购', category: '托福词汇' },
  { word: 'adapt', phonetic: '/əˈdæpt/', meaning: 'v. 适应；改编', category: '托福词汇' },
  { word: 'adaptation', phonetic: '/ˌædæpˈteɪʃn/', meaning: 'n. 适应；改编', category: '托福词汇' },
  { word: 'adequate', phonetic: '/ˈædɪkwət/', meaning: 'adj. 足够的；适当的', category: '托福词汇' },
  { word: 'adhere', phonetic: '/ədˈhɪə/', meaning: 'v. 坚持；粘附', category: 'GRE词汇' },
  { word: 'adjacent', phonetic: '/əˈdʒeɪsnt/', meaning: 'adj. 邻近的', category: '托福词汇' },
  { word: 'adjust', phonetic: '/əˈdʒʌst/', meaning: 'v. 调整；适应', category: '托福词汇' },
  { word: 'administer', phonetic: '/ədˈmɪnɪstə/', meaning: 'v. 管理；执行', category: '托福词汇' },
  { word: 'administration', phonetic: '/ədˌmɪnɪˈstreɪʃn/', meaning: 'n. 管理；行政', category: '托福词汇' },
  { word: 'admire', phonetic: '/ədˈmaɪə/', meaning: 'v. 钦佩；欣赏', category: '托福词汇' },
  { word: 'admit', phonetic: '/ədˈmɪt/', meaning: 'v. 承认；准许进入', category: '托福词汇' },
  { word: 'adolescent', phonetic: '/ˌædəˈlesnt/', meaning: 'n. 青少年 adj. 青春期的', category: '托福词汇' },
  { word: 'adopt', phonetic: '/əˈdɒpt/', meaning: 'v. 采用；收养', category: '托福词汇' },
  { word: 'adore', phonetic: '/əˈdɔː/', meaning: 'v. 崇拜；热爱', category: 'GRE词汇' },
  { word: 'adult', phonetic: '/ˈædʌlt/', meaning: 'n. 成年人 adj. 成年的', category: '托福词汇' },
  { word: 'advance', phonetic: '/ədˈvɑːns/', meaning: 'v. 前进；推进 n. 进步', category: '托福词汇' },
  { word: 'advantage', phonetic: '/ədˈvɑːntɪdʒ/', meaning: 'n. 优势；好处', category: '托福词汇' },
  { word: 'adventure', phonetic: '/ədˈventʃə/', meaning: 'n. 冒险；奇遇', category: '托福词汇' },
  { word: 'adverse', phonetic: '/ˈædvɜːs/', meaning: 'adj. 不利的；相反的', category: 'GRE词汇' },
  { word: 'advertise', phonetic: '/ˈædvətaɪz/', meaning: 'v. 做广告；宣传', category: '托福词汇' },
  { word: 'advocate', phonetic: '/ˈædvəkeɪt/', meaning: 'v. 提倡 n. 提倡者', category: '托福词汇' },
  { word: 'aesthetic', phonetic: '/iːsˈθetɪk/', meaning: 'adj. 美学的', category: 'GRE词汇' },
  { word: 'affair', phonetic: '/əˈfeə/', meaning: 'n. 事务；事件', category: '托福词汇' },
  { word: 'affect', phonetic: '/əˈfekt/', meaning: 'v. 影响；感动', category: '托福词汇' },
  { word: 'affection', phonetic: '/əˈfekʃn/', meaning: 'n. 喜爱；感情', category: '托福词汇' },
  { word: 'affiliate', phonetic: '/əˈfɪlieɪt/', meaning: 'v. 使附属 n. 附属机构', category: '托福词汇' },
  { word: 'affirm', phonetic: '/əˈfɜːm/', meaning: 'v. 肯定；确认', category: 'GRE词汇' },
  { word: 'affluent', phonetic: '/ˈæfluənt/', meaning: 'adj. 富裕的', category: 'GRE词汇' },
  { word: 'afford', phonetic: '/əˈfɔːd/', meaning: 'v. 负担得起；提供', category: '托福词汇' },
  { word: 'aggravate', phonetic: '/ˈæɡrəveɪt/', meaning: 'v. 加重；恶化', category: 'GRE词汇' },
  { word: 'aggregate', phonetic: '/ˈæɡrɪɡət/', meaning: 'n. 总计 v. 聚集', category: 'GRE词汇' },
  { word: 'aggressive', phonetic: '/əˈɡresɪv/', meaning: 'adj. 侵略的；有进取心的', category: '托福词汇' },
  { word: 'agitate', phonetic: '/ˈædʒɪteɪt/', meaning: 'v. 搅动；煽动', category: 'GRE词汇' },
  { word: 'agony', phonetic: '/ˈæɡəni/', meaning: 'n. 极大痛苦', category: 'GRE词汇' },
  { word: 'agreeable', phonetic: '/əˈɡriːəbl/', meaning: 'adj. 令人愉快的', category: 'GRE词汇' },
  { word: 'agriculture', phonetic: '/ˈæɡrɪkʌltʃə/', meaning: 'n. 农业', category: '托福词汇' },
  { word: 'aircraft', phonetic: '/ˈeəkrɑːft/', meaning: 'n. 飞行器；飞机', category: '托福词汇' },
  { word: 'alarm', phonetic: '/əˈlɑːm/', meaning: 'n. 警报 v. 使惊恐', category: '托福词汇' },
  { word: 'alien', phonetic: '/ˈeɪliən/', meaning: 'adj. 外国的 n. 外国人', category: '托福词汇' },
  { word: 'allegiance', phonetic: '/əˈliːdʒəns/', meaning: 'n. 忠诚', category: 'GRE词汇' },
  { word: 'alleviate', phonetic: '/əˈliːvieɪt/', meaning: 'v. 减轻；缓解', category: 'GRE词汇' },
  { word: 'allocate', phonetic: '/ˈæləkeɪt/', meaning: 'v. 分配；拨给', category: '托福词汇' },
  { word: 'allowance', phonetic: '/əˈlaʊəns/', meaning: 'n. 津贴；允许', category: '托福词汇' },
  { word: 'alter', phonetic: '/ˈɔːltə/', meaning: 'v. 改变', category: '托福词汇' },
  { word: 'alternate', phonetic: '/ɔːlˈtɜːnət/', meaning: 'v. 交替 adj. 交替的', category: '托福词汇' },
  { word: 'alternative', phonetic: '/ɔːlˈtɜːnətɪv/', meaning: 'n. 替代品 adj. 替代的', category: '托福词汇' },
  { word: 'amateur', phonetic: '/ˈæmətə/', meaning: 'n. 业余爱好者', category: '托福词汇' },
  { word: 'amaze', phonetic: '/əˈmeɪz/', meaning: 'v. 使惊奇', category: '托福词汇' },
  { word: 'ambassador', phonetic: '/æmˈbæsədə/', meaning: 'n. 大使', category: '托福词汇' },
  { word: 'ambiguity', phonetic: '/ˌæmbɪˈɡjuːəti/', meaning: 'n. 模糊；歧义', category: 'GRE词汇' },
  { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'adj. 模糊的；有歧义的', category: '托福词汇' },
  { word: 'ambition', phonetic: '/æmˈbɪʃn/', meaning: 'n. 雄心；野心', category: '托福词汇' },
  { word: 'ambitious', phonetic: '/æmˈbɪʃəs/', meaning: 'adj. 有雄心的', category: '托福词汇' },
  { word: 'amend', phonetic: '/əˈmend/', meaning: 'v. 修正；改进', category: 'GRE词汇' },
  { word: 'amiable', phonetic: '/ˈeɪmiəbl/', meaning: 'adj. 和蔼可亲的', category: 'GRE词汇' },
  { word: 'amid', phonetic: '/əˈmɪd/', meaning: 'prep. 在...之中', category: '托福词汇' },
  { word: 'amount', phonetic: '/əˈmaʊnt/', meaning: 'n. 数量 v. 总计', category: '托福词汇' },
  { word: 'ample', phonetic: '/ˈæmpl/', meaning: 'adj. 充足的', category: 'GRE词汇' },
  { word: 'amplify', phonetic: '/ˈæmplɪfaɪ/', meaning: 'v. 放大；增强', category: 'GRE词汇' },
  { word: 'amuse', phonetic: '/əˈmjuːz/', meaning: 'v. 使娱乐；使发笑', category: '托福词汇' },
  { word: 'analyse', phonetic: '/ˈænəlaɪz/', meaning: 'v. 分析', category: '托福词汇' },
  { word: 'analysis', phonetic: '/əˈnæləsɪs/', meaning: 'n. 分析', category: '托福词汇' },
  { word: 'ancestor', phonetic: '/ˈænsestə/', meaning: 'n. 祖先', category: '托福词汇' },
  { word: 'anchor', phonetic: '/ˈæŋkə/', meaning: 'n. 锚 v. 抛锚', category: '托福词汇' },
  { word: 'ancient', phonetic: '/ˈeɪnʃənt/', meaning: 'adj. 古代的', category: '托福词汇' },
  { word: 'anecdote', phonetic: '/ˈænɪkdəʊt/', meaning: 'n. 轶事', category: 'GRE词汇' },
  { word: 'angle', phonetic: '/ˈæŋɡl/', meaning: 'n. 角度', category: '托福词汇' },
  { word: 'anguish', phonetic: '/ˈæŋɡwɪʃ/', meaning: 'n. 痛苦', category: 'GRE词汇' },
  { word: 'animate', phonetic: '/ˈænɪmeɪt/', meaning: 'v. 使有生气 adj. 有生命的', category: 'GRE词汇' },
  { word: 'announce', phonetic: '/əˈnaʊns/', meaning: 'v. 宣布', category: '托福词汇' },
  { word: 'annoy', phonetic: '/əˈnɔɪ/', meaning: 'v. 使恼怒', category: '托福词汇' },
  { word: 'annual', phonetic: '/ˈænjuəl/', meaning: 'adj. 年度的 n. 年刊', category: '托福词汇' },
  { word: 'anonymous', phonetic: '/əˈnɒnɪməs/', meaning: 'adj. 匿名的', category: '托福词汇' },
  { word: 'antagonist', phonetic: '/ænˈtæɡənɪst/', meaning: 'n. 对抗者；反派', category: 'GRE词汇' },
  { word: 'anticipate', phonetic: '/ænˈtɪsɪpeɪt/', meaning: 'v. 预期；期望', category: '托福词汇' },
  { word: 'antique', phonetic: '/ænˈtiːk/', meaning: 'adj. 古老的 n. 古董', category: '托福词汇' },
  { word: 'anxiety', phonetic: '/æŋˈzaɪəti/', meaning: 'n. 焦虑', category: '托福词汇' },
  { word: 'anxious', phonetic: '/ˈæŋkʃəs/', meaning: 'adj. 焦虑的；渴望的', category: '托福词汇' },
  { word: 'apartment', phonetic: '/əˈpɑːtmənt/', meaning: 'n. 公寓', category: '托福词汇' },
  { word: 'apologize', phonetic: '/əˈpɒlədʒaɪz/', meaning: 'v. 道歉', category: '托福词汇' },
  { word: 'appall', phonetic: '/əˈpɔːl/', meaning: 'v. 使惊骇', category: 'GRE词汇' },
  { word: 'apparent', phonetic: '/əˈpærənt/', meaning: 'adj. 明显的；表面上的', category: '托福词汇' },
  { word: 'appeal', phonetic: '/əˈpiːl/', meaning: 'n./v. 呼吁；吸引', category: '托福词汇' },
  { word: 'appearance', phonetic: '/əˈpɪərəns/', meaning: 'n. 外表；出现', category: '托福词汇' },
  { word: 'appease', phonetic: '/əˈpiːz/', meaning: 'v. 平息；安抚', category: 'GRE词汇' },
  { word: 'appendix', phonetic: '/əˈpendɪks/', meaning: 'n. 附录；阑尾', category: '托福词汇' },
  { word: 'appetite', phonetic: '/ˈæpɪtaɪt/', meaning: 'n. 胃口；欲望', category: '托福词汇' },
  { word: 'applaud', phonetic: '/əˈplɔːd/', meaning: 'v. 鼓掌；称赞', category: '托福词汇' },
  { word: 'applicable', phonetic: '/əˈplɪkəbl/', meaning: 'adj. 适用的', category: '托福词汇' },
  { word: 'applicant', phonetic: '/ˈæplɪkənt/', meaning: 'n. 申请人', category: '托福词汇' },
  { word: 'application', phonetic: '/ˌæplɪˈkeɪʃn/', meaning: 'n. 申请；应用', category: '托福词汇' },
  { word: 'apply', phonetic: '/əˈplaɪ/', meaning: 'v. 申请；应用', category: '托福词汇' },
  { word: 'appoint', phonetic: '/əˈpɔɪnt/', meaning: 'v. 任命；指定', category: '托福词汇' },
  { word: 'appreciate', phonetic: '/əˈpriːʃieɪt/', meaning: 'v. 欣赏；感激', category: '托福词汇' },
  { word: 'apprehend', phonetic: '/ˌæprɪˈhend/', meaning: 'v. 逮捕；理解', category: 'GRE词汇' },
  { word: 'approach', phonetic: '/əˈprəʊtʃ/', meaning: 'v. 接近 n. 方法', category: '托福词汇' },
  { word: 'appropriate', phonetic: '/əˈprəʊpriət/', meaning: 'adj. 适当的 v. 挪用', category: '托福词汇' },
  { word: 'approval', phonetic: '/əˈpruːvl/', meaning: 'n. 批准；赞同', category: '托福词汇' },
  { word: 'approve', phonetic: '/əˈpruːv/', meaning: 'v. 批准；赞同', category: '托福词汇' },
  { word: 'approximate', phonetic: '/əˈprɒksɪmət/', meaning: 'adj. 大约的 v. 接近', category: '托福词汇' },
  { word: 'apt', phonetic: '/æpt/', meaning: 'adj. 恰当的；易于...的', category: 'GRE词汇' },
  { word: 'arbitrary', phonetic: '/ˈɑːbɪtrəri/', meaning: 'adj. 任意的；武断的', category: '托福词汇' },
  { word: 'arch', phonetic: '/ɑːtʃ/', meaning: 'n. 拱门 v. 弯曲', category: '托福词汇' },
  { word: 'architecture', phonetic: '/ˈɑːkɪtektʃə/', meaning: 'n. 建筑学', category: '托福词汇' },
  { word: 'arena', phonetic: '/əˈriːnə/', meaning: 'n. 竞技场；舞台', category: '托福词汇' },
  { word: 'argue', phonetic: '/ˈɑːɡjuː/', meaning: 'v. 争论；论证', category: '托福词汇' },
  { word: 'arise', phonetic: '/əˈraɪz/', meaning: 'v. 出现；产生', category: '托福词汇' },
  { word: 'aristocrat', phonetic: '/ˈærɪstəkræt/', meaning: 'n. 贵族', category: 'GRE词汇' },
  { word: 'arithmetic', phonetic: '/əˈrɪθmətɪk/', meaning: 'n. 算术', category: '托福词汇' },
  { word: 'armour', phonetic: '/ˈɑːmə/', meaning: 'n. 盔甲', category: '托福词汇' },
  { word: 'arouse', phonetic: '/əˈraʊz/', meaning: 'v. 引起；唤起', category: '托福词汇' },
  { word: 'arrange', phonetic: '/əˈreɪndʒ/', meaning: 'v. 安排；整理', category: '托福词汇' },
  { word: 'array', phonetic: '/əˈreɪ/', meaning: 'n. 一系列 v. 排列', category: '托福词汇' },
  { word: 'arrest', phonetic: '/əˈrest/', meaning: 'v./n. 逮捕', category: '托福词汇' },
  { word: 'arrogant', phonetic: '/ˈærəɡənt/', meaning: 'adj. 傲慢的', category: 'GRE词汇' },
  { word: 'articulate', phonetic: '/ɑːˈtɪkjələt/', meaning: 'adj. 清晰的 v. 清晰表达', category: 'GRE词汇' },
  { word: 'artificial', phonetic: '/ˌɑːtɪˈfɪʃl/', meaning: 'adj. 人造的', category: '托福词汇' },
  { word: 'artistic', phonetic: '/ɑːˈtɪstɪk/', meaning: 'adj. 艺术的', category: '托福词汇' },
  { word: 'ascend', phonetic: '/əˈsend/', meaning: 'v. 上升；攀登', category: 'GRE词汇' },
  { word: 'ascertain', phonetic: '/ˌæsəˈteɪn/', meaning: 'v. 查明', category: 'GRE词汇' },
  { word: 'ashamed', phonetic: '/əˈʃeɪmd/', meaning: 'adj. 惭愧的', category: '托福词汇' },
  { word: 'aspect', phonetic: '/ˈæspekt/', meaning: 'n. 方面；外观', category: '托福词汇' },
  { word: 'aspiration', phonetic: '/ˌæspəˈreɪʃn/', meaning: 'n. 渴望；抱负', category: '托福词汇' },
  { word: 'aspire', phonetic: '/əˈspaɪə/', meaning: 'v. 渴望', category: 'GRE词汇' },
  { word: 'assassinate', phonetic: '/əˈsæsɪneɪt/', meaning: 'v. 暗杀', category: 'GRE词汇' },
  { word: 'assault', phonetic: '/əˈsɔːlt/', meaning: 'n./v. 攻击', category: '托福词汇' },
  { word: 'assemble', phonetic: '/əˈsembl/', meaning: 'v. 集合；组装', category: '托福词汇' },
  { word: 'assembly', phonetic: '/əˈsembli/', meaning: 'n. 集会；装配', category: '托福词汇' },
  { word: 'assert', phonetic: '/əˈsɜːt/', meaning: 'v. 断言；主张', category: 'GRE词汇' },
  { word: 'assess', phonetic: '/əˈses/', meaning: 'v. 评估', category: '托福词汇' },
  { word: 'asset', phonetic: '/ˈæset/', meaning: 'n. 资产；优点', category: '托福词汇' },
  { word: 'assign', phonetic: '/əˈsaɪn/', meaning: 'v. 分配；指派', category: '托福词汇' },
  { word: 'assignment', phonetic: '/əˈsaɪnmənt/', meaning: 'n. 任务；作业', category: '托福词汇' },
  { word: 'assimilate', phonetic: '/əˈsɪmɪleɪt/', meaning: 'v. 同化；吸收', category: 'GRE词汇' },
  { word: 'assist', phonetic: '/əˈsɪst/', meaning: 'v. 帮助', category: '托福词汇' },
  { word: 'associate', phonetic: '/əˈsəʊʃieɪt/', meaning: 'v. 联想 n. 同事', category: '托福词汇' },
  { word: 'association', phonetic: '/əˌsəʊʃiˈeɪʃn/', meaning: 'n. 协会；关联', category: '托福词汇' },
  { word: 'assume', phonetic: '/əˈsjuːm/', meaning: 'v. 假定；承担', category: '托福词汇' },
  { word: 'assurance', phonetic: '/əˈʃʊərəns/', meaning: 'n. 保证；自信', category: '托福词汇' },
  { word: 'assure', phonetic: '/əˈʃʊə/', meaning: 'v. 保证；使确信', category: '托福词汇' },
  { word: 'astonish', phonetic: '/əˈstɒnɪʃ/', meaning: 'v. 使惊讶', category: '托福词汇' },
  { word: 'astronaut', phonetic: '/ˈæstrənɔːt/', meaning: 'n. 宇航员', category: '托福词汇' },
  { word: 'astronomy', phonetic: '/əˈstrɒnəmi/', meaning: 'n. 天文学', category: '托福词汇' },
  { word: 'athlete', phonetic: '/ˈæθliːt/', meaning: 'n. 运动员', category: '托福词汇' },
  { word: 'atmosphere', phonetic: '/ˈætməsfɪə/', meaning: 'n. 大气；气氛', category: '托福词汇' },
  { word: 'attach', phonetic: '/əˈtætʃ/', meaning: 'v. 附上；依恋', category: '托福词汇' },
  { word: 'attack', phonetic: '/əˈtæk/', meaning: 'v./n. 攻击', category: '托福词汇' },
  { word: 'attain', phonetic: '/əˈteɪn/', meaning: 'v. 获得；达到', category: '托福词汇' },
  { word: 'attempt', phonetic: '/əˈtempt/', meaning: 'n./v. 尝试', category: '托福词汇' },
  { word: 'attend', phonetic: '/əˈtend/', meaning: 'v. 出席；照顾', category: '托福词汇' },
  { word: 'attendant', phonetic: '/əˈtendənt/', meaning: 'n. 服务员 adj. 伴随的', category: '托福词汇' },
  { word: 'attention', phonetic: '/əˈtenʃn/', meaning: 'n. 注意', category: '托福词汇' },
  { word: 'attentive', phonetic: '/əˈtentɪv/', meaning: 'adj. 注意的；体贴的', category: '托福词汇' },
  { word: 'attitude', phonetic: '/ˈætɪtjuːd/', meaning: 'n. 态度', category: '托福词汇' },
  { word: 'attorney', phonetic: '/əˈtɜːni/', meaning: 'n. 律师', category: '托福词汇' },
  { word: 'attract', phonetic: '/əˈtrækt/', meaning: 'v. 吸引', category: '托福词汇' },
  { word: 'attraction', phonetic: '/əˈtrækʃn/', meaning: 'n. 吸引力', category: '托福词汇' },
  { word: 'attractive', phonetic: '/əˈtræktɪv/', meaning: 'adj. 有吸引力的', category: '托福词汇' },
  { word: 'attribute', phonetic: '/əˈtrɪbjuːt/', meaning: 'v. 归因 n. 属性', category: '托福词汇' },
  { word: 'auction', phonetic: '/ˈɔːkʃn/', meaning: 'n./v. 拍卖', category: 'GRE词汇' },
  { word: 'audience', phonetic: '/ˈɔːdiəns/', meaning: 'n. 观众；听众', category: '托福词汇' },
  { word: 'audit', phonetic: '/ˈɔːdɪt/', meaning: 'n./v. 审计', category: '托福词汇' },
  { word: 'augment', phonetic: '/ɔːɡˈment/', meaning: 'v. 增加', category: 'GRE词汇' },
  { word: 'authentic', phonetic: '/ɔːˈθentɪk/', meaning: 'adj. 真实的', category: '托福词汇' },
  { word: 'authority', phonetic: '/ɔːˈθɒrəti/', meaning: 'n. 权威；当局', category: '托福词汇' },
  { word: 'authorize', phonetic: '/ˈɔːθəraɪz/', meaning: 'v. 授权', category: '托福词汇' },
  { word: 'automatic', phonetic: '/ˌɔːtəˈmætɪk/', meaning: 'adj. 自动的', category: '托福词汇' },
  { word: 'autonomy', phonetic: '/ɔːˈtɒnəmi/', meaning: 'n. 自治', category: 'GRE词汇' },
  { word: 'available', phonetic: '/əˈveɪləbl/', meaning: 'adj. 可用的', category: '托福词汇' },
  { word: 'avalanche', phonetic: '/ˈævəlɑːnʃ/', meaning: 'n. 雪崩', category: 'GRE词汇' },
  { word: 'avenge', phonetic: '/əˈvendʒ/', meaning: 'v. 报复', category: 'GRE词汇' },
  { word: 'avenue', phonetic: '/ˈævənjuː/', meaning: 'n. 大街；途径', category: '托福词汇' },
  { word: 'average', phonetic: '/ˈævərɪdʒ/', meaning: 'n. 平均 adj. 平均的', category: '托福词汇' },
  { word: 'avert', phonetic: '/əˈvɜːt/', meaning: 'v. 避免；转移', category: 'GRE词汇' },
  { word: 'aviation', phonetic: '/ˌeɪviˈeɪʃn/', meaning: 'n. 航空', category: '托福词汇' },
  { word: 'avoid', phonetic: '/əˈvɔɪd/', meaning: 'v. 避免', category: '托福词汇' },
  { word: 'await', phonetic: '/əˈweɪt/', meaning: 'v. 等待', category: '托福词汇' },
  { word: 'awake', phonetic: '/əˈweɪk/', meaning: 'adj. 醒着的 v. 唤醒', category: '托福词汇' },
  { word: 'award', phonetic: '/əˈwɔːd/', meaning: 'n. 奖品 v. 授予', category: '托福词汇' },
  { word: 'aware', phonetic: '/əˈweə/', meaning: 'adj. 意识到的', category: '托福词汇' },
  { word: 'awe', phonetic: '/ɔː/', meaning: 'n. 敬畏', category: 'GRE词汇' },
  { word: 'awkward', phonetic: '/ˈɔːkwəd/', meaning: 'adj. 尴尬的；笨拙的', category: '托福词汇' },
  
  // ========== B ==========
  { word: 'bachelor', phonetic: '/ˈbætʃələ/', meaning: 'n. 学士；单身汉', category: '托福词汇' },
  { word: 'background', phonetic: '/ˈbækɡraʊnd/', meaning: 'n. 背景；经历', category: '托福词汇' },
  { word: 'backup', phonetic: '/ˈbækʌp/', meaning: 'n. 备份；支持', category: '托福词汇' },
  { word: 'backward', phonetic: '/ˈbækwəd/', meaning: 'adj. 向后的 adv. 向后', category: '托福词汇' },
  { word: 'bacteria', phonetic: '/bækˈtɪəriə/', meaning: 'n. 细菌', category: '科技词汇' },
  { word: 'badge', phonetic: '/bædʒ/', meaning: 'n. 徽章', category: '托福词汇' },
  { word: 'badly', phonetic: '/ˈbædli/', meaning: 'adv. 严重地；不好地', category: '托福词汇' },
  { word: 'baffle', phonetic: '/ˈbæfl/', meaning: 'v. 使困惑', category: 'GRE词汇' },
  { word: 'balance', phonetic: '/ˈbæləns/', meaning: 'n. 平衡 v. 使平衡', category: '托福词汇' },
  { word: 'balcony', phonetic: '/ˈbælkəni/', meaning: 'n. 阳台', category: '托福词汇' },
  { word: 'bald', phonetic: '/bɔːld/', meaning: 'adj. 秃的', category: '托福词汇' },
  { word: 'ballot', phonetic: '/ˈbælət/', meaning: 'n. 选票 v. 投票', category: 'GRE词汇' },
  { word: 'ban', phonetic: '/bæn/', meaning: 'v./n. 禁止', category: '托福词汇' },
  { word: 'bandage', phonetic: '/ˈbændɪdʒ/', meaning: 'n. 绷带 v. 包扎', category: '医学词汇' },
  { word: 'bankrupt', phonetic: '/ˈbæŋkrʌpt/', meaning: 'adj. 破产的', category: '商务词汇' },
  { word: 'banner', phonetic: '/ˈbænə/', meaning: 'n. 横幅', category: '托福词汇' },
  { word: 'banquet', phonetic: '/ˈbæŋkwɪt/', meaning: 'n. 宴会', category: '托福词汇' },
  { word: 'bar', phonetic: '/bɑː/', meaning: 'n. 酒吧；条 v. 阻挡', category: '托福词汇' },
  { word: 'barbarian', phonetic: '/bɑːˈbeəriən/', meaning: 'n. 野蛮人', category: 'GRE词汇' },
  { word: 'barbecue', phonetic: '/ˈbɑːbɪkjuː/', meaning: 'n. 烧烤', category: '日常词汇' },
  { word: 'barge', phonetic: '/bɑːdʒ/', meaning: 'n. 驳船 v. 闯入', category: 'GRE词汇' },
  { word: 'barren', phonetic: '/ˈbærən/', meaning: 'adj. 贫瘠的', category: 'GRE词汇' },
  { word: 'barrier', phonetic: '/ˈbæriə/', meaning: 'n. 障碍；屏障', category: '托福词汇' },
  { word: 'base', phonetic: '/beɪs/', meaning: 'n. 基础 v. 以...为基础', category: '托福词汇' },
  { word: 'baseball', phonetic: '/ˈbeɪsbɔːl/', meaning: 'n. 棒球', category: '日常词汇' },
  { word: 'basement', phonetic: '/ˈbeɪsmənt/', meaning: 'n. 地下室', category: '托福词汇' },
  { word: 'basic', phonetic: '/ˈbeɪsɪk/', meaning: 'adj. 基本的', category: '托福词汇' },
  { word: 'basis', phonetic: '/ˈbeɪsɪs/', meaning: 'n. 基础；根据', category: '托福词汇' },
  { word: 'batch', phonetic: '/bætʃ/', meaning: 'n. 一批', category: '托福词汇' },
  { word: 'battery', phonetic: '/ˈbætəri/', meaning: 'n. 电池', category: '科技词汇' },
  { word: 'battle', phonetic: '/ˈbætl/', meaning: 'n./v. 战斗', category: '托福词汇' },
  { word: 'beam', phonetic: '/biːm/', meaning: 'n. 光线 v. 发光', category: '托福词汇' },
  { word: 'bean', phonetic: '/biːn/', meaning: 'n. 豆', category: '日常词汇' },
  { word: 'bear', phonetic: '/beə/', meaning: 'v. 忍受 n. 熊', category: '托福词汇' },
  { word: 'beard', phonetic: '/bɪəd/', meaning: 'n. 胡须', category: '托福词汇' },
  { word: 'bearing', phonetic: '/ˈbeərɪŋ/', meaning: 'n. 举止；轴承', category: '托福词汇' },
  { word: 'beast', phonetic: '/biːst/', meaning: 'n. 野兽', category: '托福词汇' },
  { word: 'beat', phonetic: '/biːt/', meaning: 'v. 打败 n. 拍子', category: '托福词汇' },
  { word: 'behalf', phonetic: '/bɪˈhɑːf/', meaning: 'n. 利益；代表', category: '托福词汇' },
  { word: 'behave', phonetic: '/bɪˈheɪv/', meaning: 'v. 表现', category: '托福词汇' },
  { word: 'behavior', phonetic: '/bɪˈheɪvjə/', meaning: 'n. 行为；举止', category: '托福词汇' },
  { word: 'behind', phonetic: '/bɪˈhaɪnd/', meaning: 'prep. 在后面', category: '托福词汇' },
  { word: 'being', phonetic: '/ˈbiːɪŋ/', meaning: 'n. 存在；生物', category: '托福词汇' },
  { word: 'belief', phonetic: '/bɪˈliːf/', meaning: 'n. 信念；相信', category: '托福词汇' },
  { word: 'believe', phonetic: '/bɪˈliːv/', meaning: 'v. 相信', category: '托福词汇' },
  { word: 'belong', phonetic: '/bɪˈlɒŋ/', meaning: 'v. 属于', category: '托福词汇' },
  { word: 'beloved', phonetic: '/bɪˈlʌvɪd/', meaning: 'adj. 心爱的', category: '托福词汇' },
  { word: 'beneath', phonetic: '/bɪˈniːθ/', meaning: 'prep. 在...下面', category: '托福词汇' },
  { word: 'beneficial', phonetic: '/ˌbenɪˈfɪʃl/', meaning: 'adj. 有益的', category: '托福词汇' },
  { word: 'benefit', phonetic: '/ˈbenɪfɪt/', meaning: 'n. 好处 v. 有益于', category: '托福词汇' },
  { word: 'benevolent', phonetic: '/bəˈnevələnt/', meaning: 'adj. 仁慈的', category: 'GRE词汇' },
  { word: 'benign', phonetic: '/bɪˈnaɪn/', meaning: 'adj. 良性的；温和的', category: 'GRE词汇' },
  { word: 'bent', phonetic: '/bent/', meaning: 'adj. 弯曲的', category: '托福词汇' },
  { word: 'beside', phonetic: '/bɪˈsaɪd/', meaning: 'prep. 在...旁边', category: '托福词汇' },
  { word: 'besides', phonetic: '/bɪˈsaɪdz/', meaning: 'prep. 除...之外 adv. 而且', category: '托福词汇' },
  { word: 'besiege', phonetic: '/bɪˈsiːdʒ/', meaning: 'v. 围攻', category: 'GRE词汇' },
  { word: 'bestow', phonetic: '/bɪˈstəʊ/', meaning: 'v. 赠予', category: 'GRE词汇' },
  { word: 'bet', phonetic: '/bet/', meaning: 'v./n. 打赌', category: '托福词汇' },
  { word: 'betray', phonetic: '/bɪˈtreɪ/', meaning: 'v. 背叛；泄露', category: '托福词汇' },
  { word: 'beverage', phonetic: '/ˈbevərɪdʒ/', meaning: 'n. 饮料', category: '托福词汇' },
  { word: 'beware', phonetic: '/bɪˈweə/', meaning: 'v. 当心', category: '托福词汇' },
  { word: 'bewilder', phonetic: '/bɪˈwɪldə/', meaning: 'v. 使困惑', category: 'GRE词汇' },
  { word: 'beyond', phonetic: '/bɪˈjɒnd/', meaning: 'prep. 超过；在...之外', category: '托福词汇' },
  { word: 'bias', phonetic: '/ˈbaɪəs/', meaning: 'n. 偏见', category: '托福词汇' },
  { word: 'bible', phonetic: '/ˈbaɪbl/', meaning: 'n. 圣经', category: '托福词汇' },
  { word: 'bibliography', phonetic: '/ˌbɪbliˈɒɡrəfi/', meaning: 'n. 参考书目', category: '托福词汇' },
  { word: 'bid', phonetic: '/bɪd/', meaning: 'v./n. 出价；投标', category: '商务词汇' },
  { word: 'bilateral', phonetic: '/ˌbaɪˈlætərəl/', meaning: 'adj. 双边的', category: '托福词汇' },
  { word: 'bill', phonetic: '/bɪl/', meaning: 'n. 账单；法案', category: '托福词汇' },
  { word: 'billion', phonetic: '/ˈbɪljən/', meaning: 'n. 十亿', category: '托福词汇' },
  { word: 'bind', phonetic: '/baɪnd/', meaning: 'v. 捆绑；约束', category: '托福词汇' },
  { word: 'biography', phonetic: '/baɪˈɒɡrəfi/', meaning: 'n. 传记', category: '托福词汇' },
  { word: 'biology', phonetic: '/baɪˈɒlədʒi/', meaning: 'n. 生物学', category: '科技词汇' },
  { word: 'birth', phonetic: '/bɜːθ/', meaning: 'n. 出生', category: '托福词汇' },
  { word: 'bitter', phonetic: '/ˈbɪtə/', meaning: 'adj. 苦的；痛苦的', category: '托福词汇' },
  { word: 'bizarre', phonetic: '/bɪˈzɑː/', meaning: 'adj. 奇异的', category: 'GRE词汇' },
  { word: 'blackmail', phonetic: '/ˈblækmeɪl/', meaning: 'n./v. 勒索', category: 'GRE词汇' },
  { word: 'blade', phonetic: '/bleɪd/', meaning: 'n. 刀片', category: '托福词汇' },
  { word: 'blame', phonetic: '/bleɪm/', meaning: 'v./n. 责备', category: '托福词汇' },
  { word: 'blank', phonetic: '/blæŋk/', meaning: 'adj. 空白的 n. 空格', category: '托福词汇' },
  { word: 'blast', phonetic: '/blɑːst/', meaning: 'n. 爆炸 v. 爆破', category: '托福词汇' },
  { word: 'blaze', phonetic: '/bleɪz/', meaning: 'n. 火焰 v. 燃烧', category: 'GRE词汇' },
  { word: 'bleak', phonetic: '/bliːk/', meaning: 'adj. 荒凉的；黯淡的', category: 'GRE词汇' },
  { word: 'bleed', phonetic: '/bliːd/', meaning: 'v. 流血', category: '医学词汇' },
  { word: 'blend', phonetic: '/blend/', meaning: 'v. 混合 n. 混合物', category: '托福词汇' },
  { word: 'bless', phonetic: '/bles/', meaning: 'v. 保佑', category: '托福词汇' },
  { word: 'blind', phonetic: '/blaɪnd/', meaning: 'adj. 瞎的', category: '托福词汇' },
  { word: 'block', phonetic: '/blɒk/', meaning: 'n. 块；街区 v. 阻挡', category: '托福词汇' },
  { word: 'blond', phonetic: '/blɒnd/', meaning: 'adj. 金发的', category: '托福词汇' },
  { word: 'bloom', phonetic: '/bluːm/', meaning: 'n. 花 v. 开花', category: '托福词汇' },
  { word: 'blossom', phonetic: '/ˈblɒsəm/', meaning: 'n. 花 v. 开花', category: '托福词汇' },
  { word: 'blow', phonetic: '/bləʊ/', meaning: 'v. 吹 n. 打击', category: '托福词汇' },
  { word: 'blunder', phonetic: '/ˈblʌndə/', meaning: 'n. 大错 v. 犯错', category: 'GRE词汇' },
  { word: 'blunt', phonetic: '/blʌnt/', meaning: 'adj. 钝的；直率的', category: 'GRE词汇' },
  { word: 'blur', phonetic: '/blɜː/', meaning: 'n. 模糊 v. 使模糊', category: '托福词汇' },
  { word: 'blush', phonetic: '/blʌʃ/', meaning: 'v. 脸红', category: '托福词汇' },
  { word: 'board', phonetic: '/bɔːd/', meaning: 'n. 板；董事会 v. 登机', category: '托福词汇' },
  { word: 'boast', phonetic: '/bəʊst/', meaning: 'v. 自夸', category: '托福词汇' },
  { word: 'bold', phonetic: '/bəʊld/', meaning: 'adj. 大胆的', category: '托福词汇' },
  { word: 'bolt', phonetic: '/bəʊlt/', meaning: 'n. 螺栓 v. 冲出去', category: '托福词汇' },
  { word: 'bomb', phonetic: '/bɒm/', meaning: 'n. 炸弹 v. 轰炸', category: '托福词汇' },
  { word: 'bond', phonetic: '/bɒnd/', meaning: 'n. 债券；纽带 v. 结合', category: '托福词汇' },
  { word: 'bonus', phonetic: '/ˈbəʊnəs/', meaning: 'n. 奖金', category: '商务词汇' },
  { word: 'boom', phonetic: '/buːm/', meaning: 'n. 繁荣 v. 迅速发展', category: '托福词汇' },
  { word: 'boost', phonetic: '/buːst/', meaning: 'v./n. 促进；提高', category: '托福词汇' },
  { word: 'boot', phonetic: '/buːt/', meaning: 'n. 靴子', category: '托福词汇' },
  { word: 'border', phonetic: '/ˈbɔːdə/', meaning: 'n. 边界 v. 接壤', category: '托福词汇' },
  { word: 'bore', phonetic: '/bɔː/', meaning: 'v. 使厌烦 n. 令人厌烦的人', category: '托福词汇' },
  { word: 'boring', phonetic: '/ˈbɔːrɪŋ/', meaning: 'adj. 无聊的', category: '托福词汇' },
  { word: 'born', phonetic: '/bɔːn/', meaning: 'adj. 出生的', category: '托福词汇' },
  { word: 'borrow', phonetic: '/ˈbɒrəʊ/', meaning: 'v. 借', category: '托福词汇' },
  { word: 'bother', phonetic: '/ˈbɒðə/', meaning: 'v. 打扰', category: '托福词汇' },
  { word: 'bottom', phonetic: '/ˈbɒtəm/', meaning: 'n. 底部', category: '托福词汇' },
  { word: 'bounce', phonetic: '/baʊns/', meaning: 'v. 弹跳', category: '托福词汇' },
  { word: 'bound', phonetic: '/baʊnd/', meaning: 'adj. 必定的 n. 界限', category: '托福词汇' },
  { word: 'boundary', phonetic: '/ˈbaʊndri/', meaning: 'n. 边界；界限', category: '托福词汇' },
  { word: 'bow', phonetic: '/baʊ/', meaning: 'v. 鞠躬 n. 弓', category: '托福词汇' },
  { word: 'boycott', phonetic: '/ˈbɔɪkɒt/', meaning: 'v./n. 抵制', category: '托福词汇' },
  { word: 'brain', phonetic: '/breɪn/', meaning: 'n. 大脑', category: '托福词汇' },
  { word: 'brake', phonetic: '/breɪk/', meaning: 'n. 刹车 v. 刹车', category: '托福词汇' },
  { word: 'branch', phonetic: '/brɑːntʃ/', meaning: 'n. 树枝；分支', category: '托福词汇' },
  { word: 'brand', phonetic: '/brænd/', meaning: 'n. 品牌 v. 打烙印', category: '商务词汇' },
  { word: 'brandy', phonetic: '/ˈbrændi/', meaning: 'n. 白兰地', category: '日常词汇' },
  { word: 'brass', phonetic: '/brɑːs/', meaning: 'n. 黄铜', category: '托福词汇' },
  { word: 'brave', phonetic: '/breɪv/', meaning: 'adj. 勇敢的', category: '托福词汇' },
  { word: 'breach', phonetic: '/briːtʃ/', meaning: 'n. 违反 v. 违反', category: '法律词汇' },
  { word: 'breadth', phonetic: '/bredθ/', meaning: 'n. 宽度', category: '托福词汇' },
  { word: 'break', phonetic: '/breɪk/', meaning: 'v. 打破 n. 休息', category: '托福词汇' },
  { word: 'breakdown', phonetic: '/ˈbreɪkdaʊn/', meaning: 'n. 故障；崩溃', category: '托福词汇' },
  { word: 'breakthrough', phonetic: '/ˈbreɪkθruː/', meaning: 'n. 突破', category: '托福词汇' },
  { word: 'breast', phonetic: '/brest/', meaning: 'n. 胸部', category: '医学词汇' },
  { word: 'breath', phonetic: '/breθ/', meaning: 'n. 呼吸', category: '托福词汇' },
  { word: 'breathe', phonetic: '/briːð/', meaning: 'v. 呼吸', category: '托福词汇' },
  { word: 'breed', phonetic: '/briːd/', meaning: 'v. 繁殖 n. 品种', category: '托福词汇' },
  { word: 'breeze', phonetic: '/briːz/', meaning: 'n. 微风', category: '托福词汇' },
  { word: 'bribe', phonetic: '/braɪb/', meaning: 'n./v. 贿赂', category: '法律词汇' },
  { word: 'brick', phonetic: '/brɪk/', meaning: 'n. 砖', category: '托福词汇' },
  { word: 'bride', phonetic: '/braɪd/', meaning: 'n. 新娘', category: '托福词汇' },
  { word: 'bridgeroom', phonetic: '/ˈbraɪdɡruːm/', meaning: 'n. 新郎', category: '托福词汇' },
  { word: 'bridge', phonetic: '/brɪdʒ/', meaning: 'n. 桥 v. 架桥', category: '托福词汇' },
  { word: 'brief', phonetic: '/briːf/', meaning: 'adj. 简短的 n. 摘要', category: '托福词汇' },
  { word: 'briefcase', phonetic: '/ˈbriːfkeɪs/', meaning: 'n. 公文包', category: '商务词汇' },
  { word: 'bright', phonetic: '/braɪt/', meaning: 'adj. 明亮的；聪明的', category: '托福词汇' },
  { word: 'brilliant', phonetic: '/ˈbrɪliənt/', meaning: 'adj. 杰出的；明亮的', category: '托福词汇' },
  { word: 'brim', phonetic: '/brɪm/', meaning: 'n. 边缘', category: '托福词汇' },
  { word: 'bring', phonetic: '/brɪŋ/', meaning: 'v. 带来', category: '托福词汇' },
  { word: 'brink', phonetic: '/brɪŋk/', meaning: 'n. 边缘', category: 'GRE词汇' },
  { word: 'brisk', phonetic: '/brɪsk/', meaning: 'adj. 活泼的；轻快的', category: 'GRE词汇' },
  { word: 'bristle', phonetic: '/ˈbrɪsl/', meaning: 'n. 刚毛 v. 发怒', category: 'GRE词汇' },
  { word: 'brittle', phonetic: '/ˈbrɪtl/', meaning: 'adj. 易碎的', category: 'GRE词汇' },
  { word: 'broad', phonetic: '/brɔːd/', meaning: 'adj. 宽的；广泛的', category: '托福词汇' },
  { word: 'broadcast', phonetic: '/ˈbrɔːdkɑːst/', meaning: 'v./n. 广播', category: '托福词汇' },
  { word: 'brochure', phonetic: '/ˈbrəʊʃə/', meaning: 'n. 小册子', category: '托福词汇' },
  { word: 'broker', phonetic: '/ˈbrəʊkə/', meaning: 'n. 经纪人', category: '商务词汇' },
  { word: 'bronze', phonetic: '/brɒnz/', meaning: 'n. 青铜', category: '托福词汇' },
  { word: 'brook', phonetic: '/brʊk/', meaning: 'n. 小溪', category: '托福词汇' },
  { word: 'broom', phonetic: '/bruːm/', meaning: 'n. 扫帚', category: '托福词汇' },
  { word: 'brother', phonetic: '/ˈbrʌðə/', meaning: 'n. 兄弟', category: '托福词汇' },
  { word: 'brow', phonetic: '/braʊ/', meaning: 'n. 眉毛；额头', category: '托福词汇' },
  { word: 'brown', phonetic: '/braʊn/', meaning: 'adj. 棕色的', category: '托福词汇' },
  { word: 'browse', phonetic: '/braʊz/', meaning: 'v. 浏览', category: '托福词汇' },
  { word: 'bruise', phonetic: '/bruːz/', meaning: 'n. 瘀伤 v. 碰伤', category: '医学词汇' },
  { word: 'brush', phonetic: '/brʌʃ/', meaning: 'n. 刷子 v. 刷', category: '托福词汇' },
  { word: 'brutal', phonetic: '/ˈbruːtl/', meaning: 'adj. 残忍的', category: '托福词汇' },
  { word: 'bubble', phonetic: '/ˈbʌbl/', meaning: 'n. 气泡 v. 冒泡', category: '托福词汇' },
  { word: 'bucket', phonetic: '/ˈbʌkɪt/', meaning: 'n. 桶', category: '托福词汇' },
  { word: 'buckle', phonetic: '/ˈbʌkl/', meaning: 'n. 扣环 v. 扣住', category: '托福词汇' },
  { word: 'bud', phonetic: '/bʌd/', meaning: 'n. 芽 v. 发芽', category: '托福词汇' },
  { word: 'budget', phonetic: '/ˈbʌdʒɪt/', meaning: 'n. 预算', category: '商务词汇' },
  { word: 'buffer', phonetic: '/ˈbʌfə/', meaning: 'n. 缓冲；缓冲区', category: '科技词汇' },
  { word: 'buffet', phonetic: '/ˈbʊfeɪ/', meaning: 'n. 自助餐', category: '日常词汇' },
  { word: 'bug', phonetic: '/bʌɡ/', meaning: 'n. 虫子；故障', category: '托福词汇' },
  { word: 'build', phonetic: '/bɪld/', meaning: 'v. 建造', category: '托福词汇' },
  { word: 'building', phonetic: '/ˈbɪldɪŋ/', meaning: 'n. 建筑物', category: '托福词汇' },
  { word: 'bulb', phonetic: '/bʌlb/', meaning: 'n. 灯泡', category: '托福词汇' },
  { word: 'bulk', phonetic: '/bʌlk/', meaning: 'n. 大量；体积', category: '托福词汇' },
  { word: 'bull', phonetic: '/bʊl/', meaning: 'n. 公牛', category: '托福词汇' },
  { word: 'bullet', phonetic: '/ˈbʊlɪt/', meaning: 'n. 子弹', category: '托福词汇' },
  { word: 'bulletin', phonetic: '/ˈbʊlətɪn/', meaning: 'n. 公告', category: '托福词汇' },
  { word: 'bully', phonetic: '/ˈbʊli/', meaning: 'n. 欺凌者 v. 欺负', category: '托福词汇' },
  { word: 'bump', phonetic: '/bʌmp/', meaning: 'v. 撞 n. 肿块', category: '托福词汇' },
  { word: 'bunch', phonetic: '/bʌntʃ/', meaning: 'n. 束；群', category: '托福词汇' },
  { word: 'bundle', phonetic: '/ˈbʌndl/', meaning: 'n. 捆 v. 捆绑', category: '托福词汇' },
  { word: 'burden', phonetic: '/ˈbɜːdn/', meaning: 'n. 负担 v. 负担', category: '托福词汇' },
  { word: 'bureau', phonetic: '/ˈbjʊərəʊ/', meaning: 'n. 局；处', category: '托福词汇' },
  { word: 'bureaucracy', phonetic: '/bjʊˈrɒkrəsi/', meaning: 'n. 官僚制度', category: '托福词汇' },
  { word: 'burglar', phonetic: '/ˈbɜːɡlə/', meaning: 'n. 窃贼', category: '托福词汇' },
  { word: 'burial', phonetic: '/ˈberiəl/', meaning: 'n. 埋葬', category: '托福词汇' },
  { word: 'burn', phonetic: '/bɜːn/', meaning: 'v. 燃烧 n. 烧伤', category: '托福词汇' },
  { word: 'burst', phonetic: '/bɜːst/', meaning: 'v. 爆裂 n. 突然爆发', category: '托福词汇' },
  { word: 'bury', phonetic: '/ˈberi/', meaning: 'v. 埋葬', category: '托福词汇' },
  { word: 'bus', phonetic: '/bʌs/', meaning: 'n. 公共汽车', category: '托福词汇' },
  { word: 'bush', phonetic: '/bʊʃ/', meaning: 'n. 灌木', category: '托福词汇' },
  { word: 'business', phonetic: '/ˈbɪznəs/', meaning: 'n. 商业；生意', category: '托福词汇' },
  { word: 'bust', phonetic: '/bʌst/', meaning: 'n. 半身像 v. 打碎', category: '托福词汇' },
  { word: 'busy', phonetic: '/ˈbɪzi/', meaning: 'adj. 忙碌的', category: '托福词汇' },
  { word: 'butcher', phonetic: '/ˈbʊtʃə/', meaning: 'n. 屠夫', category: '托福词汇' },
  { word: 'butter', phonetic: '/ˈbʌtə/', meaning: 'n. 黄油', category: '托福词汇' },
  { word: 'butterfly', phonetic: '/ˈbʌtəflaɪ/', meaning: 'n. 蝴蝶', category: '托福词汇' },
  { word: 'button', phonetic: '/ˈbʌtn/', meaning: 'n. 按钮 v. 扣上', category: '托福词汇' },
  { word: 'buy', phonetic: '/baɪ/', meaning: 'v. 购买', category: '托福词汇' },
  { word: 'buzz', phonetic: '/bʌz/', meaning: 'v. 嗡嗡作响 n. 嗡嗡声', category: '托福词汇' },
  { word: 'bygones', phonetic: '/ˈbaɪɡɒnz/', meaning: 'n. 过去的事', category: '托福词汇' },
  { word: 'byproduct', phonetic: '/ˈbaɪˌprɒdʌkt/', meaning: 'n. 副产品', category: '科技词汇' },
  { word: 'bypass', phonetic: '/ˈbaɪpɑːs/', meaning: 'n. 旁路 v. 绕过', category: '托福词汇' },
];

async function ensureCategories() {
  const categoryIds: Record<string, number> = {};
  
  for (const cat of CATEGORIES) {
    const { data: existing } = await client
      .from('vocabulary_categories')
      .select('id')
      .eq('name', cat.name)
      .single();
    
    if (existing) {
      categoryIds[cat.name] = existing.id;
    } else {
      const { data, error } = await client
        .from('vocabulary_categories')
        .insert(cat)
        .select('id')
        .single();
      
      if (!error && data) {
        categoryIds[cat.name] = data.id;
      }
    }
  }
  
  return categoryIds;
}

export async function GET() {
  const { count: wordCount } = await client
    .from('words')
    .select('*', { count: 'exact', head: true });
  
  const { data: categories } = await client
    .from('vocabulary_categories')
    .select('id, name')
    .order('id');
  
  return NextResponse.json({
    status: 'ok',
    wordCount,
    categories: categories || [],
    message: wordCount && wordCount > 500 
      ? '数据库已有充足数据' 
      : '数据库数据较少，请调用 POST /api/admin/batch-import 执行批量导入',
    availableWords: ALL_WORDS.length,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      hint: 'Add Authorization header with value: Bearer vocabulary-admin-2024',
    }, { status: 401 });
  }
  
  try {
    const { count: currentCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });
    
    console.log(`当前单词数: ${currentCount}`);
    
    // 确保分类存在
    const categoryIds = await ensureCategories();
    console.log('分类ID映射:', categoryIds);
    
    // 获取已有单词
    const { data: existingWords } = await client
      .from('words')
      .select('word');
    
    const existingSet = new Set(existingWords?.map(w => w.word.toLowerCase()) || []);
    console.log(`已存在 ${existingSet.size} 个单词`);
    
    // 准备插入数据
    const defaultCategoryId = categoryIds['托福词汇'] || 1;
    const records: Array<{
      word: string;
      phonetic: string;
      meaning: string;
      example_sentence: string;
      category_id: number;
    }> = [];
    
    for (const w of ALL_WORDS) {
      const word = w.word.toLowerCase().trim();
      if (!word || existingSet.has(word)) continue;
      
      const categoryId = categoryIds[w.category] || defaultCategoryId;
      
      records.push({
        word,
        phonetic: w.phonetic || '',
        meaning: w.meaning.trim(),
        example_sentence: `This is an example using the word "${w.word}".`,
        category_id: categoryId,
      });
      existingSet.add(word);
    }
    
    console.log(`需要插入 ${records.length} 个新单词`);
    
    // 批量插入
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await client.from('words').insert(batch);
      if (!error) {
        inserted += batch.length;
      }
    }
    
    const { count: finalCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: '批量导入完成',
      previousCount: currentCount,
      inserted,
      finalCount,
    });
    
  } catch (error) {
    console.error('导入失败:', error);
    return NextResponse.json({
      error: '导入失败',
      details: String(error),
    }, { status: 500 });
  }
}
