import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 所有单词数据 - 从脚本中提取的核心词汇
const ALL_WORDS = [
  // A
  { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃；抛弃', category: '托福词汇' },
  { word: 'ability', phonetic: '/əˈbɪləti/', meaning: 'n. 能力；才能', category: '托福词汇' },
  { word: 'abnormal', phonetic: '/æbˈnɔːml/', meaning: 'adj. 反常的；异常的', category: '托福词汇' },
  { word: 'aboard', phonetic: '/əˈbɔːd/', meaning: 'adv./prep. 在船/飞机上', category: '托福词汇' },
  { word: 'abolish', phonetic: '/əˈbɒlɪʃ/', meaning: 'v. 废除；废止', category: '托福词汇' },
  { word: 'abroad', phonetic: '/əˈbrɔːd/', meaning: 'adv. 在国外；到国外', category: '托福词汇' },
  { word: 'abrupt', phonetic: '/əˈbrʌpt/', meaning: 'adj. 突然的；唐突的', category: '托福词汇' },
  { word: 'absence', phonetic: '/ˈæbsəns/', meaning: 'n. 缺席；不在', category: '托福词汇' },
  { word: 'absent', phonetic: '/ˈæbsənt/', meaning: 'adj. 缺席的；不在的', category: '托福词汇' },
  { word: 'absolute', phonetic: '/ˈæbsəluːt/', meaning: 'adj. 绝对的；完全的', category: '托福词汇' },
  { word: 'absorb', phonetic: '/əbˈzɔːb/', meaning: 'v. 吸收；理解', category: '托福词汇' },
  { word: 'abstract', phonetic: '/ˈæbstrækt/', meaning: 'adj. 抽象的 n. 摘要', category: '托福词汇' },
  { word: 'abundant', phonetic: '/əˈbʌndənt/', meaning: 'adj. 丰富的；充裕的', category: '托福词汇' },
  { word: 'abuse', phonetic: '/əˈbjuːs/', meaning: 'n./v. 滥用；虐待', category: '托福词汇' },
  { word: 'academic', phonetic: '/ˌækəˈdemɪk/', meaning: 'adj. 学术的；学业的', category: '托福词汇' },
  { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'v. 加速；促进', category: '托福词汇' },
  { word: 'accent', phonetic: '/ˈæksent/', meaning: 'n. 口音；重音', category: '托福词汇' },
  { word: 'accept', phonetic: '/əkˈsept/', meaning: 'v. 接受；认可', category: '托福词汇' },
  { word: 'access', phonetic: '/ˈækses/', meaning: 'n. 通道；机会 v. 进入', category: '托福词汇' },
  { word: 'accident', phonetic: '/ˈæksɪdənt/', meaning: 'n. 事故；意外', category: '托福词汇' },
  { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', meaning: 'v. 容纳；适应', category: '托福词汇' },
  { word: 'accompany', phonetic: '/əˈkʌmpəni/', meaning: 'v. 陪伴；伴随', category: '托福词汇' },
  { word: 'accomplish', phonetic: '/əˈkʌmplɪʃ/', meaning: 'v. 完成；实现', category: '托福词汇' },
  { word: 'accord', phonetic: '/əˈkɔːd/', meaning: 'v. 符合；给予 n. 协议', category: '托福词汇' },
  { word: 'account', phonetic: '/əˈkaʊnt/', meaning: 'n. 账户；描述 v. 解释', category: '托福词汇' },
  { word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', meaning: 'v. 积累；积聚', category: '托福词汇' },
  { word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 准确的；精确的', category: '托福词汇' },
  { word: 'accuse', phonetic: '/əˈkjuːz/', meaning: 'v. 指控；谴责', category: '托福词汇' },
  { word: 'accustomed', phonetic: '/əˈkʌstəmd/', meaning: 'adj. 习惯的', category: '托福词汇' },
  { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 实现；达到', category: '托福词汇' },
  { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', meaning: 'v. 承认；确认', category: '托福词汇' },
  { word: 'acquire', phonetic: '/əˈkwaɪə/', meaning: 'v. 获得；学到', category: '托福词汇' },
  { word: 'adapt', phonetic: '/əˈdæpt/', meaning: 'v. 适应；改编', category: '托福词汇' },
  { word: 'adequate', phonetic: '/ˈædɪkwət/', meaning: 'adj. 足够的；适当的', category: '托福词汇' },
  { word: 'adjust', phonetic: '/əˈdʒʌst/', meaning: 'v. 调整；适应', category: '托福词汇' },
  { word: 'administration', phonetic: '/ədˌmɪnɪˈstreɪʃn/', meaning: 'n. 管理；行政', category: '托福词汇' },
  { word: 'admire', phonetic: '/ədˈmaɪə/', meaning: 'v. 钦佩；欣赏', category: '托福词汇' },
  { word: 'admit', phonetic: '/ədˈmɪt/', meaning: 'v. 承认；准许进入', category: '托福词汇' },
  { word: 'adolescent', phonetic: '/ˌædəˈlesnt/', meaning: 'n. 青少年 adj. 青春期的', category: '托福词汇' },
  { word: 'adopt', phonetic: '/əˈdɒpt/', meaning: 'v. 采用；收养', category: '托福词汇' },
  { word: 'adult', phonetic: '/ˈædʌlt/', meaning: 'n. 成年人 adj. 成年的', category: '托福词汇' },
  { word: 'advance', phonetic: '/ədˈvɑːns/', meaning: 'v. 前进；推进 n. 进步', category: '托福词汇' },
  { word: 'advantage', phonetic: '/ədˈvɑːntɪdʒ/', meaning: 'n. 优势；好处', category: '托福词汇' },
  { word: 'adventure', phonetic: '/ədˈventʃə/', meaning: 'n. 冒险；奇遇', category: '托福词汇' },
  { word: 'advertise', phonetic: '/ˈædvətaɪz/', meaning: 'v. 做广告；宣传', category: '托福词汇' },
  { word: 'advocate', phonetic: '/ˈædvəkeɪt/', meaning: 'v. 提倡 n. 提倡者', category: '托福词汇' },
  { word: 'affair', phonetic: '/əˈfeə/', meaning: 'n. 事务；事件', category: '托福词汇' },
  { word: 'affect', phonetic: '/əˈfekt/', meaning: 'v. 影响；感动', category: '托福词汇' },
  { word: 'afford', phonetic: '/əˈfɔːd/', meaning: 'v. 负担得起；提供', category: '托福词汇' },
  { word: 'agriculture', phonetic: '/ˈæɡrɪkʌltʃə/', meaning: 'n. 农业', category: '托福词汇' },
  // B
  { word: 'background', phonetic: '/ˈbækɡraʊnd/', meaning: 'n. 背景；经历', category: '托福词汇' },
  { word: 'balance', phonetic: '/ˈbæləns/', meaning: 'n. 平衡 v. 使平衡', category: '托福词汇' },
  { word: 'barrier', phonetic: '/ˈbæriə/', meaning: 'n. 障碍；屏障', category: '托福词汇' },
  { word: 'basis', phonetic: '/ˈbeɪsɪs/', meaning: 'n. 基础；根据', category: '托福词汇' },
  { word: 'behavior', phonetic: '/bɪˈheɪvjə/', meaning: 'n. 行为；举止', category: '托福词汇' },
  { word: 'beneficial', phonetic: '/ˌbenɪˈfɪʃl/', meaning: 'adj. 有益的', category: '托福词汇' },
  { word: 'benefit', phonetic: '/ˈbenɪfɪt/', meaning: 'n. 好处 v. 有益于', category: '托福词汇' },
  { word: 'beyond', phonetic: '/bɪˈjɒnd/', meaning: 'prep. 超过；在...之外', category: '托福词汇' },
  { word: 'boundary', phonetic: '/ˈbaʊndri/', meaning: 'n. 边界；界限', category: '托福词汇' },
  { word: 'brief', phonetic: '/briːf/', meaning: 'adj. 简短的 n. 摘要', category: '托福词汇' },
  // C
  { word: 'calculate', phonetic: '/ˈkælkjuleɪt/', meaning: 'v. 计算；估计', category: '托福词汇' },
  { word: 'capacity', phonetic: '/kəˈpæsəti/', meaning: 'n. 能力；容量', category: '托福词汇' },
  { word: 'capture', phonetic: '/ˈkæptʃə/', meaning: 'v. 捕获；夺取', category: '托福词汇' },
  { word: 'career', phonetic: '/kəˈrɪə/', meaning: 'n. 职业；生涯', category: '托福词汇' },
  { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: 'n. 挑战 v. 挑战', category: '托福词汇' },
  { word: 'characteristic', phonetic: '/ˌkærəktəˈrɪstɪk/', meaning: 'n. 特征 adj. 典型的', category: '托福词汇' },
  { word: 'circumstance', phonetic: '/ˈsɜːkəmstəns/', meaning: 'n. 情况；环境', category: '托福词汇' },
  { word: 'claim', phonetic: '/kleɪm/', meaning: 'v. 声称 n. 要求', category: '托福词汇' },
  { word: 'clarify', phonetic: '/ˈklærəfaɪ/', meaning: 'v. 澄清；阐明', category: '托福词汇' },
  { word: 'classify', phonetic: '/ˈklæsɪfaɪ/', meaning: 'v. 分类；归类', category: '托福词汇' },
  { word: 'colleague', phonetic: '/ˈkɒliːɡ/', meaning: 'n. 同事', category: '托福词汇' },
  { word: 'combine', phonetic: '/kəmˈbaɪn/', meaning: 'v. 结合；联合', category: '托福词汇' },
  { word: 'commitment', phonetic: '/kəˈmɪtmənt/', meaning: 'n. 承诺；投入', category: '托福词汇' },
  { word: 'communicate', phonetic: '/kəˈmjuːnɪkeɪt/', meaning: 'v. 沟通；交流', category: '托福词汇' },
  { word: 'community', phonetic: '/kəˈmjuːnəti/', meaning: 'n. 社区；社会', category: '托福词汇' },
  { word: 'compare', phonetic: '/kəmˈpeə/', meaning: 'v. 比较；对比', category: '托福词汇' },
  { word: 'compensate', phonetic: '/ˈkɒmpenseɪt/', meaning: 'v. 补偿；弥补', category: '托福词汇' },
  { word: 'compete', phonetic: '/kəmˈpiːt/', meaning: 'v. 竞争；比赛', category: '托福词汇' },
  { word: 'complex', phonetic: '/ˈkɒmpleks/', meaning: 'adj. 复杂的 n. 综合体', category: '托福词汇' },
  { word: 'component', phonetic: '/kəmˈpəʊnənt/', meaning: 'n. 成分；组件', category: '托福词汇' },
  { word: 'comprise', phonetic: '/kəmˈpraɪz/', meaning: 'v. 包含；组成', category: '托福词汇' },
  { word: 'concept', phonetic: '/ˈkɒnsept/', meaning: 'n. 概念；观念', category: '托福词汇' },
  { word: 'conclude', phonetic: '/kənˈkluːd/', meaning: 'v. 结束；得出结论', category: '托福词汇' },
  { word: 'concrete', phonetic: '/ˈkɒŋkriːt/', meaning: 'adj. 具体的 n. 混凝土', category: '托福词汇' },
  { word: 'conduct', phonetic: '/kənˈdʌkt/', meaning: 'v. 进行；引导', category: '托福词汇' },
  { word: 'confirm', phonetic: '/kənˈfɜːm/', meaning: 'v. 确认；证实', category: '托福词汇' },
  { word: 'conflict', phonetic: '/ˈkɒnflɪkt/', meaning: 'n. 冲突 v. 冲突', category: '托福词汇' },
  { word: 'consequence', phonetic: '/ˈkɒnsɪkwəns/', meaning: 'n. 结果；后果', category: '托福词汇' },
  { word: 'consider', phonetic: '/kənˈsɪdə/', meaning: 'v. 考虑；认为', category: '托福词汇' },
  { word: 'consistent', phonetic: '/kənˈsɪstənt/', meaning: 'adj. 一致的；始终如一的', category: '托福词汇' },
  { word: 'constant', phonetic: '/ˈkɒnstənt/', meaning: 'adj. 恒定的；不断的', category: '托福词汇' },
  { word: 'constitute', phonetic: '/ˈkɒnstɪtjuːt/', meaning: 'v. 构成；组成', category: '托福词汇' },
  { word: 'construct', phonetic: '/kənˈstrʌkt/', meaning: 'v. 建造；构建', category: '托福词汇' },
  { word: 'consult', phonetic: '/kənˈsʌlt/', meaning: 'v. 咨询；请教', category: '托福词汇' },
  { word: 'consume', phonetic: '/kənˈsjuːm/', meaning: 'v. 消费；消耗', category: '托福词汇' },
  { word: 'contact', phonetic: '/ˈkɒntækt/', meaning: 'n./v. 联系', category: '托福词汇' },
  { word: 'contemporary', phonetic: '/kənˈtempərəri/', meaning: 'adj. 当代的', category: '托福词汇' },
  { word: 'content', phonetic: '/ˈkɒntent/', meaning: 'n. 内容 adj. 满意的', category: '托福词汇' },
  { word: 'contest', phonetic: '/ˈkɒntest/', meaning: 'n. 比赛 v. 竞争', category: '托福词汇' },
  { word: 'context', phonetic: '/ˈkɒntekst/', meaning: 'n. 上下文；背景', category: '托福词汇' },
  { word: 'contract', phonetic: '/ˈkɒntrækt/', meaning: 'n. 合同 v. 收缩', category: '托福词汇' },
  { word: 'contradict', phonetic: '/ˌkɒntrəˈdɪkt/', meaning: 'v. 反驳；与...矛盾', category: '托福词汇' },
  { word: 'contrast', phonetic: '/ˈkɒntrɑːst/', meaning: 'n./v. 对比', category: '托福词汇' },
  { word: 'contribute', phonetic: '/kənˈtrɪbjuːt/', meaning: 'v. 贡献；捐献', category: '托福词汇' },
  { word: 'control', phonetic: '/kənˈtrəʊl/', meaning: 'v./n. 控制', category: '托福词汇' },
  { word: 'controversial', phonetic: '/ˌkɒntrəˈvɜːʃl/', meaning: 'adj. 有争议的', category: '托福词汇' },
  { word: 'convention', phonetic: '/kənˈvenʃn/', meaning: 'n. 惯例；大会', category: '托福词汇' },
  { word: 'convert', phonetic: '/kənˈvɜːt/', meaning: 'v. 转换；转变', category: '托福词汇' },
  { word: 'convey', phonetic: '/kənˈveɪ/', meaning: 'v. 传达；运输', category: '托福词汇' },
  { word: 'convince', phonetic: '/kənˈvɪns/', meaning: 'v. 说服；使确信', category: '托福词汇' },
  { word: 'cooperate', phonetic: '/kəʊˈɒpəreɪt/', meaning: 'v. 合作；协作', category: '托福词汇' },
  { word: 'coordinate', phonetic: '/kəʊˈɔːdɪnət/', meaning: 'v. 协调', category: '托福词汇' },
  { word: 'cope', phonetic: '/kəʊp/', meaning: 'v. 应对；处理', category: '托福词汇' },
  { word: 'core', phonetic: '/kɔː/', meaning: 'n. 核心 adj. 核心的', category: '托福词汇' },
  { word: 'corporate', phonetic: '/ˈkɔːpərət/', meaning: 'adj. 公司的；企业的', category: '托福词汇' },
  { word: 'correspond', phonetic: '/ˌkɒrɪˈspɒnd/', meaning: 'v. 对应；通信', category: '托福词汇' },
  { word: 'council', phonetic: '/ˈkaʊnsl/', meaning: 'n. 委员会；理事会', category: '托福词汇' },
  { word: 'counsel', phonetic: '/ˈkaʊnsl/', meaning: 'n./v. 建议；咨询', category: '托福词汇' },
  { word: 'counterpart', phonetic: '/ˈkaʊntəpɑːt/', meaning: 'n. 对应的人或物', category: '托福词汇' },
  { word: 'create', phonetic: '/kriˈeɪt/', meaning: 'v. 创造；创建', category: '托福词汇' },
  { word: 'creative', phonetic: '/kriˈeɪtɪv/', meaning: 'adj. 创造性的', category: '托福词汇' },
  { word: 'crisis', phonetic: '/ˈkraɪsɪs/', meaning: 'n. 危机', category: '托福词汇' },
  { word: 'criterion', phonetic: '/kraɪˈtɪəriən/', meaning: 'n. 标准；准则', category: '托福词汇' },
  { word: 'crucial', phonetic: '/ˈkruːʃl/', meaning: 'adj. 关键的；决定性的', category: '托福词汇' },
  { word: 'culture', phonetic: '/ˈkʌltʃə/', meaning: 'n. 文化', category: '托福词汇' },
  { word: 'curriculum', phonetic: '/kəˈrɪkjələm/', meaning: 'n. 课程', category: '托福词汇' },
  // D
  { word: 'data', phonetic: '/ˈdeɪtə/', meaning: 'n. 数据', category: '托福词汇' },
  { word: 'debate', phonetic: '/dɪˈbeɪt/', meaning: 'n./v. 辩论', category: '托福词汇' },
  { word: 'decade', phonetic: '/ˈdekeɪd/', meaning: 'n. 十年', category: '托福词汇' },
  { word: 'decline', phonetic: '/dɪˈklaɪn/', meaning: 'v. 下降；拒绝', category: '托福词汇' },
  { word: 'decrease', phonetic: '/dɪˈkriːs/', meaning: 'v./n. 减少', category: '托福词汇' },
  { word: 'define', phonetic: '/dɪˈfaɪn/', meaning: 'v. 定义；解释', category: '托福词汇' },
  { word: 'definite', phonetic: '/ˈdefɪnət/', meaning: 'adj. 明确的；确定的', category: '托福词汇' },
  { word: 'demonstrate', phonetic: '/ˈdemənstreɪt/', meaning: 'v. 证明；演示', category: '托福词汇' },
  { word: 'deny', phonetic: '/dɪˈnaɪ/', meaning: 'v. 否认；拒绝', category: '托福词汇' },
  { word: 'depend', phonetic: '/dɪˈpend/', meaning: 'v. 依赖；取决于', category: '托福词汇' },
  { word: 'deposit', phonetic: '/dɪˈpɒzɪt/', meaning: 'n. 存款 v. 存放', category: '托福词汇' },
  { word: 'depression', phonetic: '/dɪˈpreʃn/', meaning: 'n. 抑郁；萧条', category: '托福词汇' },
  { word: 'derive', phonetic: '/dɪˈraɪv/', meaning: 'v. 获得；源于', category: '托福词汇' },
  { word: 'describe', phonetic: '/dɪˈskraɪb/', meaning: 'v. 描述；形容', category: '托福词汇' },
  { word: 'deserve', phonetic: '/dɪˈzɜːv/', meaning: 'v. 值得；应得', category: '托福词汇' },
  { word: 'design', phonetic: '/dɪˈzaɪn/', meaning: 'v./n. 设计', category: '托福词汇' },
  { word: 'desire', phonetic: '/dɪˈzaɪə/', meaning: 'n./v. 渴望', category: '托福词汇' },
  { word: 'despite', phonetic: '/dɪˈspaɪt/', meaning: 'prep. 尽管', category: '托福词汇' },
  { word: 'destination', phonetic: '/ˌdestɪˈneɪʃn/', meaning: 'n. 目的地', category: '托福词汇' },
  { word: 'destroy', phonetic: '/dɪˈstrɔɪ/', meaning: 'v. 破坏；摧毁', category: '托福词汇' },
  { word: 'detail', phonetic: '/ˈdiːteɪl/', meaning: 'n. 细节', category: '托福词汇' },
  { word: 'detect', phonetic: '/dɪˈtekt/', meaning: 'v. 发现；检测', category: '托福词汇' },
  { word: 'determine', phonetic: '/dɪˈtɜːmɪn/', meaning: 'v. 决定；确定', category: '托福词汇' },
  { word: 'develop', phonetic: '/dɪˈveləp/', meaning: 'v. 发展；开发', category: '托福词汇' },
  { word: 'device', phonetic: '/dɪˈvaɪs/', meaning: 'n. 设备；装置', category: '托福词汇' },
  { word: 'devote', phonetic: '/dɪˈvəʊt/', meaning: 'v. 致力于；奉献', category: '托福词汇' },
  { word: 'differ', phonetic: '/ˈdɪfə/', meaning: 'v. 不同；有异议', category: '托福词汇' },
  { word: 'differentiate', phonetic: '/ˌdɪfəˈrenʃieɪt/', meaning: 'v. 区分；区别', category: '托福词汇' },
  { word: 'diffuse', phonetic: '/dɪˈfjuːz/', meaning: 'v. 扩散；传播', category: '托福词汇' },
  { word: 'dimension', phonetic: '/dɪˈmenʃn/', meaning: 'n. 维度；尺寸', category: '托福词汇' },
  { word: 'diminish', phonetic: '/dɪˈmɪnɪʃ/', meaning: 'v. 减少；削弱', category: '托福词汇' },
  { word: 'diploma', phonetic: '/dɪˈpləʊmə/', meaning: 'n. 文凭；证书', category: '托福词汇' },
  { word: 'direct', phonetic: '/dɪˈrekt/', meaning: 'adj. 直接的 v. 指导', category: '托福词汇' },
  { word: 'discipline', phonetic: '/ˈdɪsəplɪn/', meaning: 'n. 纪律；学科', category: '托福词汇' },
  { word: 'disclose', phonetic: '/dɪsˈkləʊz/', meaning: 'v. 揭露；披露', category: '托福词汇' },
  { word: 'discount', phonetic: '/ˈdɪskaʊnt/', meaning: 'n. 折扣', category: '托福词汇' },
  { word: 'discover', phonetic: '/dɪˈskʌvə/', meaning: 'v. 发现', category: '托福词汇' },
  { word: 'discriminate', phonetic: '/dɪˈskrɪmɪneɪt/', meaning: 'v. 歧视；区分', category: '托福词汇' },
  { word: 'discuss', phonetic: '/dɪˈskʌs/', meaning: 'v. 讨论', category: '托福词汇' },
  { word: 'dismiss', phonetic: '/dɪsˈmɪs/', meaning: 'v. 解雇；驳回', category: '托福词汇' },
  { word: 'disorder', phonetic: '/dɪsˈɔːdə/', meaning: 'n. 混乱；失调', category: '托福词汇' },
  { word: 'display', phonetic: '/dɪˈspleɪ/', meaning: 'v./n. 展示', category: '托福词汇' },
  { word: 'dispute', phonetic: '/dɪˈspjuːt/', meaning: 'n./v. 争议；争端', category: '托福词汇' },
  { word: 'dissolve', phonetic: '/dɪˈzɒlv/', meaning: 'v. 溶解；解散', category: '托福词汇' },
  { word: 'distinct', phonetic: '/dɪˈstɪŋkt/', meaning: 'adj. 明显的；独特的', category: '托福词汇' },
  { word: 'distinguish', phonetic: '/dɪˈstɪŋɡwɪʃ/', meaning: 'v. 区分；辨别', category: '托福词汇' },
  { word: 'distort', phonetic: '/dɪˈstɔːt/', meaning: 'v. 扭曲；歪曲', category: '托福词汇' },
  { word: 'distribute', phonetic: '/dɪˈstrɪbjuːt/', meaning: 'v. 分配；分发', category: '托福词汇' },
  { word: 'district', phonetic: '/ˈdɪstrɪkt/', meaning: 'n. 区域；行政区', category: '托福词汇' },
  { word: 'diverse', phonetic: '/daɪˈvɜːs/', meaning: 'adj. 多样的；不同的', category: '托福词汇' },
  { word: 'divert', phonetic: '/daɪˈvɜːt/', meaning: 'v. 转移；转移注意力', category: '托福词汇' },
  { word: 'division', phonetic: '/dɪˈvɪʒn/', meaning: 'n. 分割；部门', category: '托福词汇' },
  { word: 'document', phonetic: '/ˈdɒkjumənt/', meaning: 'n. 文件 v. 记录', category: '托福词汇' },
  { word: 'domain', phonetic: '/dəʊˈmeɪn/', meaning: 'n. 领域；范围', category: '托福词汇' },
  { word: 'domestic', phonetic: '/dəˈmestɪk/', meaning: 'adj. 国内的；家庭的', category: '托福词汇' },
  { word: 'dominant', phonetic: '/ˈdɒmɪnənt/', meaning: 'adj. 占主导地位的', category: '托福词汇' },
  { word: 'dominate', phonetic: '/ˈdɒmɪneɪt/', meaning: 'v. 支配；主导', category: '托福词汇' },
  { word: 'draft', phonetic: '/drɑːft/', meaning: 'n. 草稿 v. 起草', category: '托福词汇' },
  { word: 'dramatic', phonetic: '/drəˈmætɪk/', meaning: 'adj. 戏剧性的；巨大的', category: '托福词汇' },
  { word: 'drawback', phonetic: '/ˈdrɔːbæk/', meaning: 'n. 缺点；弊端', category: '托福词汇' },
  { word: 'dynamics', phonetic: '/daɪˈnæmɪks/', meaning: 'n. 动力学；动态', category: '托福词汇' },
  // E
  { word: 'earn', phonetic: '/ɜːn/', meaning: 'v. 赚得；获得', category: '托福词汇' },
  { word: 'economic', phonetic: '/ˌiːkəˈnɒmɪk/', meaning: 'adj. 经济的', category: '托福词汇' },
  { word: 'economy', phonetic: '/ɪˈkɒnəmi/', meaning: 'n. 经济', category: '托福词汇' },
  { word: 'edit', phonetic: '/ˈedɪt/', meaning: 'v. 编辑', category: '托福词汇' },
  { word: 'effect', phonetic: '/ɪˈfekt/', meaning: 'n. 效果 v. 引起', category: '托福词汇' },
  { word: 'effective', phonetic: '/ɪˈfektɪv/', meaning: 'adj. 有效的', category: '托福词汇' },
  { word: 'efficiency', phonetic: '/ɪˈfɪʃnsi/', meaning: 'n. 效率', category: '托福词汇' },
  { word: 'efficient', phonetic: '/ɪˈfɪʃnt/', meaning: 'adj. 高效的', category: '托福词汇' },
  { word: 'effort', phonetic: '/ˈefət/', meaning: 'n. 努力', category: '托福词汇' },
  { word: 'element', phonetic: '/ˈelɪmənt/', meaning: 'n. 元素；要素', category: '托福词汇' },
  { word: 'eliminate', phonetic: '/ɪˈlɪmɪneɪt/', meaning: 'v. 消除；排除', category: '托福词汇' },
  { word: 'embrace', phonetic: '/ɪmˈbreɪs/', meaning: 'v. 拥抱；接受', category: '托福词汇' },
  { word: 'emerge', phonetic: '/ɪˈmɜːdʒ/', meaning: 'v. 出现；浮现', category: '托福词汇' },
  { word: 'emergency', phonetic: '/ɪˈmɜːdʒənsi/', meaning: 'n. 紧急情况', category: '托福词汇' },
  { word: 'emit', phonetic: '/ɪˈmɪt/', meaning: 'v. 发出；发射', category: '托福词汇' },
  { word: 'emotion', phonetic: '/ɪˈməʊʃn/', meaning: 'n. 情绪', category: '托福词汇' },
  { word: 'emphasis', phonetic: '/ˈemfəsɪs/', meaning: 'n. 强调', category: '托福词汇' },
  { word: 'emphasize', phonetic: '/ˈemfəsaɪz/', meaning: 'v. 强调', category: '托福词汇' },
  { word: 'empirical', phonetic: '/ɪmˈpɪrɪkl/', meaning: 'adj. 经验的；实证的', category: '托福词汇' },
  { word: 'enable', phonetic: '/ɪˈneɪbl/', meaning: 'v. 使能够', category: '托福词汇' },
  { word: 'encounter', phonetic: '/ɪnˈkaʊntə/', meaning: 'v./n. 遇到；遭遇', category: '托福词汇' },
  { word: 'encourage', phonetic: '/ɪnˈkʌrɪdʒ/', meaning: 'v. 鼓励', category: '托福词汇' },
  { word: 'endeavor', phonetic: '/ɪnˈdevə/', meaning: 'n./v. 努力；尝试', category: '托福词汇' },
  { word: 'enhance', phonetic: '/ɪnˈhɑːns/', meaning: 'v. 增强；提高', category: '托福词汇' },
  { word: 'enormous', phonetic: '/ɪˈnɔːməs/', meaning: 'adj. 巨大的', category: '托福词汇' },
  { word: 'ensure', phonetic: '/ɪnˈʃʊə/', meaning: 'v. 确保', category: '托福词汇' },
  { word: 'enterprise', phonetic: '/ˈentəpraɪz/', meaning: 'n. 企业；事业', category: '托福词汇' },
  { word: 'enthusiasm', phonetic: '/ɪnˈθjuːziæzəm/', meaning: 'n. 热情', category: '托福词汇' },
  { word: 'entire', phonetic: '/ɪnˈtaɪə/', meaning: 'adj. 全部的', category: '托福词汇' },
  { word: 'entity', phonetic: '/ˈentəti/', meaning: 'n. 实体', category: '托福词汇' },
  { word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', meaning: 'n. 环境', category: '托福词汇' },
  { word: 'envision', phonetic: '/ɪnˈvɪʒn/', meaning: 'v. 设想；展望', category: '托福词汇' },
  { word: 'episode', phonetic: '/ˈepɪsəʊd/', meaning: 'n. 插曲；事件', category: '托福词汇' },
  { word: 'equal', phonetic: '/ˈiːkwəl/', meaning: 'adj. 相等的', category: '托福词汇' },
  { word: 'equip', phonetic: '/ɪˈkwɪp/', meaning: 'v. 装备；配备', category: '托福词汇' },
  { word: 'equivalent', phonetic: '/ɪˈkwɪvələnt/', meaning: 'adj. 相等的 n. 等价物', category: '托福词汇' },
  { word: 'era', phonetic: '/ˈɪərə/', meaning: 'n. 时代', category: '托福词汇' },
  { word: 'erode', phonetic: '/ɪˈrəʊd/', meaning: 'v. 侵蚀；腐蚀', category: '托福词汇' },
  { word: 'error', phonetic: '/ˈerə/', meaning: 'n. 错误', category: '托福词汇' },
  { word: 'essential', phonetic: '/ɪˈsenʃl/', meaning: 'adj. 必要的；本质的', category: '托福词汇' },
  { word: 'establish', phonetic: '/ɪˈstæblɪʃ/', meaning: 'v. 建立；确立', category: '托福词汇' },
  { word: 'estimate', phonetic: '/ˈestɪmət/', meaning: 'v./n. 估计', category: '托福词汇' },
  { word: 'evaluate', phonetic: '/ɪˈvæljueɪt/', meaning: 'v. 评估', category: '托福词汇' },
  { word: 'eventual', phonetic: '/ɪˈventʃuəl/', meaning: 'adj. 最终的', category: '托福词汇' },
  { word: 'evident', phonetic: '/ˈevɪdənt/', meaning: 'adj. 明显的', category: '托福词汇' },
  { word: 'evolve', phonetic: '/ɪˈvɒlv/', meaning: 'v. 进化；发展', category: '托福词汇' },
  { word: 'exceed', phonetic: '/ɪkˈsiːd/', meaning: 'v. 超过', category: '托福词汇' },
  { word: 'exception', phonetic: '/ɪkˈsepʃn/', meaning: 'n. 例外', category: '托福词汇' },
  { word: 'excess', phonetic: '/ɪkˈses/', meaning: 'n. 过量 adj. 过量的', category: '托福词汇' },
  { word: 'exchange', phonetic: '/ɪksˈtʃeɪndʒ/', meaning: 'v./n. 交换', category: '托福词汇' },
  { word: 'exclude', phonetic: '/ɪkˈskluːd/', meaning: 'v. 排除', category: '托福词汇' },
  { word: 'exclusive', phonetic: '/ɪkˈskluːsɪv/', meaning: 'adj. 独有的；排外的', category: '托福词汇' },
  { word: 'execute', phonetic: '/ˈeksɪkjuːt/', meaning: 'v. 执行；实施', category: '托福词汇' },
  { word: 'executive', phonetic: '/ɪɡˈzekjətɪv/', meaning: 'n. 高管 adj. 行政的', category: '托福词汇' },
  { word: 'exhibit', phonetic: '/ɪɡˈzɪbɪt/', meaning: 'v. 展出 n. 展品', category: '托福词汇' },
  { word: 'exist', phonetic: '/ɪɡˈzɪst/', meaning: 'v. 存在', category: '托福词汇' },
  { word: 'expand', phonetic: '/ɪkˈspænd/', meaning: 'v. 扩大；膨胀', category: '托福词汇' },
  { word: 'expansion', phonetic: '/ɪkˈspænʃn/', meaning: 'n. 扩大；扩张', category: '托福词汇' },
  { word: 'expectation', phonetic: '/ˌekspekˈteɪʃn/', meaning: 'n. 期望', category: '托福词汇' },
  { word: 'expenditure', phonetic: '/ɪkˈspendɪtʃə/', meaning: 'n. 支出；花费', category: '托福词汇' },
  { word: 'expense', phonetic: '/ɪkˈspens/', meaning: 'n. 费用；开销', category: '托福词汇' },
  { word: 'expert', phonetic: '/ˈekspɜːt/', meaning: 'n. 专家', category: '托福词汇' },
  { word: 'expertise', phonetic: '/ˌekspɜːˈtiːz/', meaning: 'n. 专业知识', category: '托福词汇' },
  { word: 'explicit', phonetic: '/ɪkˈsplɪsɪt/', meaning: 'adj. 明确的', category: '托福词汇' },
  { word: 'exploit', phonetic: '/ɪkˈsplɔɪt/', meaning: 'v. 开发；利用', category: '托福词汇' },
  { word: 'explore', phonetic: '/ɪkˈsplɔː/', meaning: 'v. 探索', category: '托福词汇' },
  { word: 'export', phonetic: '/ɪkˈspɔːt/', meaning: 'v./n. 出口', category: '托福词汇' },
  { word: 'expose', phonetic: '/ɪkˈspəʊz/', meaning: 'v. 暴露；揭露', category: '托福词汇' },
  { word: 'exposure', phonetic: '/ɪkˈspəʊʒə/', meaning: 'n. 暴露；曝光', category: '托福词汇' },
  { word: 'extend', phonetic: '/ɪkˈstend/', meaning: 'v. 延伸；扩展', category: '托福词汇' },
  { word: 'extension', phonetic: '/ɪkˈstenʃn/', meaning: 'n. 延伸；扩展', category: '托福词汇' },
  { word: 'extensive', phonetic: '/ɪkˈstensɪv/', meaning: 'adj. 广泛的', category: '托福词汇' },
  { word: 'extent', phonetic: '/ɪkˈstent/', meaning: 'n. 程度；范围', category: '托福词汇' },
  { word: 'external', phonetic: '/ɪkˈstɜːnl/', meaning: 'adj. 外部的', category: '托福词汇' },
  { word: 'extract', phonetic: '/ɪkˈstrækt/', meaning: 'v. 提取；摘录', category: '托福词汇' },
  { word: 'extreme', phonetic: '/ɪkˈstriːm/', meaning: 'adj. 极端的', category: '托福词汇' },
];

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

// 简单的授权检查
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY || 'vocabulary-admin-2024';
  return authHeader === `Bearer ${adminKey}`;
}

async function ensureCategories() {
  const categoryIds: Record<string, number> = {};
  
  for (const cat of CATEGORIES) {
    // 检查是否已存在
    const { data: existing } = await client
      .from('vocabulary_categories')
      .select('id')
      .eq('name', cat.name)
      .single();
    
    if (existing) {
      categoryIds[cat.name] = existing.id;
    } else {
      // 创建新分类
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
  // 获取当前状态
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
      : '数据库数据较少，请调用 POST /api/admin/init 执行初始化 (需要 Authorization header)',
  });
}

export async function POST(request: NextRequest) {
  // 授权检查
  if (!isAuthorized(request)) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      hint: 'Add Authorization header with value: Bearer vocabulary-admin-2024',
    }, { status: 401 });
  }
  
  try {
    // 获取当前单词数
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
    
    // 获取最新统计
    const { count: finalCount } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: '初始化完成',
      previousCount: currentCount,
      inserted,
      finalCount,
    });
    
  } catch (error) {
    console.error('初始化失败:', error);
    return NextResponse.json({
      error: '初始化失败',
      details: String(error),
    }, { status: 500 });
  }
}
