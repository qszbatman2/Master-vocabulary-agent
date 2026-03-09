import { getSupabaseClient } from '../src/storage/database/supabase-client';

const client = getSupabaseClient();

// 大量单词数据 - 包含音标、释义、例句
const wordsData: Record<string, Array<{
  word: string;
  phonetic: string;
  meaning: string;
  exampleSentence: string;
}>> = {
  '雅思词汇': [
    { word: 'academic', phonetic: '/ˌækəˈdemɪk/', meaning: 'adj. 学术的；学业的', exampleSentence: 'She has a strong academic background in physics.' },
    { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'v. 加速；促进', exampleSentence: 'The government plans to accelerate economic growth.' },
    { word: 'accessible', phonetic: '/əkˈsesəbl/', meaning: 'adj. 可接近的；可进入的', exampleSentence: 'The library is accessible to all students.' },
    { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', meaning: 'v. 容纳；使适应', exampleSentence: 'The hotel can accommodate up to 500 guests.' },
    { word: 'accompany', phonetic: '/əˈkʌmpəni/', meaning: 'v. 陪伴；伴随', exampleSentence: 'She asked her friend to accompany her to the interview.' },
    { word: 'accomplish', phonetic: '/əˈkʌmplɪʃ/', meaning: 'v. 完成；实现', exampleSentence: 'We managed to accomplish all our goals.' },
    { word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 准确的；精确的', exampleSentence: 'The report needs to be accurate and detailed.' },
    { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 实现；达到', exampleSentence: 'She worked hard to achieve her dreams.' },
    { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', meaning: 'v. 承认；确认', exampleSentence: 'He acknowledged his mistake and apologized.' },
    { word: 'acquire', phonetic: '/əˈkwaɪə/', meaning: 'v. 获得；学到', exampleSentence: 'She acquired new skills through training.' },
    { word: 'adequate', phonetic: '/ˈædɪkwət/', meaning: 'adj. 足够的；适当的', exampleSentence: 'We need adequate resources to complete the project.' },
    { word: 'adjust', phonetic: '/əˈdʒʌst/', meaning: 'v. 调整；适应', exampleSentence: 'You need to adjust to the new environment.' },
    { word: 'administer', phonetic: '/ədˈmɪnɪstə/', meaning: 'v. 管理；执行', exampleSentence: 'She administers the company\'s daily operations.' },
    { word: 'advocate', phonetic: '/ˈædvəkeɪt/', meaning: 'v. 提倡；支持 n. 提倡者', exampleSentence: 'He advocates for better education policies.' },
    { word: 'affect', phonetic: '/əˈfekt/', meaning: 'v. 影响；感动', exampleSentence: 'The decision will affect many people.' },
    { word: 'aggregate', phonetic: '/ˈæɡrɪɡət/', meaning: 'v. 聚集；总计 n. 总数', exampleSentence: 'The aggregate of all scores was impressive.' },
    { word: 'allocate', phonetic: '/ˈæləkeɪt/', meaning: 'v. 分配；拨给', exampleSentence: 'We need to allocate resources carefully.' },
    { word: 'alternative', phonetic: '/ɔːlˈtɜːnətɪv/', meaning: 'n. 替代品 adj. 可供选择的', exampleSentence: 'We need to find an alternative solution.' },
    { word: 'ambitious', phonetic: '/æmˈbɪʃəs/', meaning: 'adj. 有雄心的；野心勃勃的', exampleSentence: 'She is an ambitious young professional.' },
    { word: 'analyze', phonetic: '/ˈænəlaɪz/', meaning: 'v. 分析；解析', exampleSentence: 'Scientists analyze data to find patterns.' },
    { word: 'annual', phonetic: '/ˈænjuəl/', meaning: 'adj. 每年的；年度的', exampleSentence: 'The annual report shows significant growth.' },
    { word: 'anticipate', phonetic: '/ænˈtɪsɪpeɪt/', meaning: 'v. 预期；期望', exampleSentence: 'We anticipate a positive outcome.' },
    { word: 'apparent', phonetic: '/əˈpærənt/', meaning: 'adj. 明显的；表面的', exampleSentence: 'The apparent success was short-lived.' },
    { word: 'appeal', phonetic: '/əˈpiːl/', meaning: 'v. 吸引；呼吁 n. 吸引力', exampleSentence: 'The idea appeals to many people.' },
    { word: 'applicable', phonetic: '/əˈplɪkəbl/', meaning: 'adj. 可适用的；适当的', exampleSentence: 'These rules are applicable to everyone.' },
    { word: 'approach', phonetic: '/əˈprəʊtʃ/', meaning: 'v. 接近；处理 n. 方法', exampleSentence: 'We need a different approach to this problem.' },
    { word: 'appropriate', phonetic: '/əˈprəʊpriət/', meaning: 'adj. 适当的；恰当的', exampleSentence: 'Please wear appropriate clothing for the occasion.' },
    { word: 'approximate', phonetic: '/əˈprɒksɪmət/', meaning: 'adj. 大约的 v. 接近', exampleSentence: 'The approximate cost is around $500.' },
    { word: 'arbitrary', phonetic: '/ˈɑːbɪtrəri/', meaning: 'adj. 任意的；武断的', exampleSentence: 'The decision seemed arbitrary and unfair.' },
    { word: 'arise', phonetic: '/əˈraɪz/', meaning: 'v. 出现；产生', exampleSentence: 'Problems may arise unexpectedly.' },
    { word: 'aspect', phonetic: '/ˈæspekt/', meaning: 'n. 方面；外观', exampleSentence: 'Consider every aspect of the situation.' },
    { word: 'assemble', phonetic: '/əˈsembl/', meaning: 'v. 集合；组装', exampleSentence: 'They assembled in the conference room.' },
    { word: 'assess', phonetic: '/əˈses/', meaning: 'v. 评估；评定', exampleSentence: 'We need to assess the risks involved.' },
    { word: 'assign', phonetic: '/əˈsaɪn/', meaning: 'v. 分配；指派', exampleSentence: 'The teacher assigned homework to students.' },
    { word: 'assist', phonetic: '/əˈsɪst/', meaning: 'v. 协助；帮助', exampleSentence: 'Can you assist me with this task?' },
    { word: 'assume', phonetic: '/əˈsjuːm/', meaning: 'v. 假定；承担', exampleSentence: 'Let\'s assume this is correct for now.' },
    { word: 'assure', phonetic: '/əˈʃʊə/', meaning: 'v. 保证；确保', exampleSentence: 'I assure you that everything will be fine.' },
    { word: 'attach', phonetic: '/əˈtætʃ/', meaning: 'v. 附上；贴上', exampleSentence: 'Please attach your resume to the email.' },
    { word: 'attain', phonetic: '/əˈteɪn/', meaning: 'v. 达到；获得', exampleSentence: 'She attained her goal through hard work.' },
    { word: 'attitude', phonetic: '/ˈætɪtjuːd/', meaning: 'n. 态度；看法', exampleSentence: 'His positive attitude inspired everyone.' },
    { word: 'attribute', phonetic: '/əˈtrɪbjuːt/', meaning: 'v. 归因于 n. 特性', exampleSentence: 'She attributes her success to hard work.' },
    { word: 'authority', phonetic: '/ɔːˈθɒrəti/', meaning: 'n. 权威；当局', exampleSentence: 'Local authorities are investigating the case.' },
    { word: 'available', phonetic: '/əˈveɪləbl/', meaning: 'adj. 可用的；可获得的', exampleSentence: 'The information is available online.' },
    { word: 'aware', phonetic: '/əˈweə/', meaning: 'adj. 意识到的；知道的', exampleSentence: 'Are you aware of the rules?' },
    { word: 'beneficial', phonetic: '/ˌbenɪˈfɪʃl/', meaning: 'adj. 有益的；有利的', exampleSentence: 'Regular exercise is beneficial to health.' },
    { word: 'benefit', phonetic: '/ˈbenɪfɪt/', meaning: 'n. 好处；利益 v. 有益于', exampleSentence: 'The new policy will benefit everyone.' },
    { word: 'bias', phonetic: '/ˈbaɪəs/', meaning: 'n. 偏见；偏向', exampleSentence: 'The study tried to avoid any bias.' },
    { word: 'boundary', phonetic: '/ˈbaʊndri/', meaning: 'n. 边界；界限', exampleSentence: 'They crossed the boundary between two countries.' },
    { word: 'capacity', phonetic: '/kəˈpæsəti/', meaning: 'n. 容量；能力', exampleSentence: 'The hall has a capacity of 1000 people.' },
    { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: 'n. 挑战 v. 挑战', exampleSentence: 'This project presents a real challenge.' },
    { word: 'channel', phonetic: '/ˈtʃænl/', meaning: 'n. 频道；渠道', exampleSentence: 'Please use official channels for complaints.' },
    { word: 'circumstance', phonetic: '/ˈsɜːkəmstəns/', meaning: 'n. 情况；环境', exampleSentence: 'Under normal circumstances, this would be acceptable.' },
    { word: 'cite', phonetic: '/saɪt/', meaning: 'v. 引用；引证', exampleSentence: 'Please cite your sources properly.' },
    { word: 'civil', phonetic: '/ˈsɪvl/', meaning: 'adj. 公民的；文明的', exampleSentence: 'Everyone has civil rights and responsibilities.' },
    { word: 'clarify', phonetic: '/ˈklærəfaɪ/', meaning: 'v. 澄清；阐明', exampleSentence: 'Could you clarify your point?' },
    { word: 'classic', phonetic: '/ˈklæsɪk/', meaning: 'adj. 经典的 n. 经典作品', exampleSentence: 'This is a classic example of the problem.' },
    { word: 'coherent', phonetic: '/kəʊˈhɪərənt/', meaning: 'adj. 连贯的；一致的', exampleSentence: 'The argument needs to be more coherent.' },
    { word: 'coincide', phonetic: '/ˌkəʊɪnˈsaɪd/', meaning: 'v. 同时发生；一致', exampleSentence: 'The events did not coincide.' },
    { word: 'collaborate', phonetic: '/kəˈlæbəreɪt/', meaning: 'v. 合作；协作', exampleSentence: 'We should collaborate on this project.' },
    { word: 'collapse', phonetic: '/kəˈlæps/', meaning: 'v. 倒塌；崩溃', exampleSentence: 'The building collapsed during the earthquake.' },
    { word: 'colleague', phonetic: '/ˈkɒliːɡ/', meaning: 'n. 同事', exampleSentence: 'My colleagues are very supportive.' },
    { word: 'commence', phonetic: '/kəˈmens/', meaning: 'v. 开始；着手', exampleSentence: 'The ceremony will commence at 9 am.' },
    { word: 'comment', phonetic: '/ˈkɒment/', meaning: 'n. 评论 v. 评论', exampleSentence: 'He made a helpful comment on my work.' },
    { word: 'commission', phonetic: '/kəˈmɪʃn/', meaning: 'n. 委员会；佣金', exampleSentence: 'The commission investigated the matter.' },
    { word: 'commit', phonetic: '/kəˈmɪt/', meaning: 'v. 承诺；犯罪', exampleSentence: 'He committed to finishing the project.' },
    { word: 'commodity', phonetic: '/kəˈmɒdəti/', meaning: 'n. 商品；日用品', exampleSentence: 'Oil is an important commodity.' },
    { word: 'communicate', phonetic: '/kəˈmjuːnɪkeɪt/', meaning: 'v. 交流；传达', exampleSentence: 'We need to communicate more effectively.' },
    { word: 'comparable', phonetic: '/ˈkɒmpərəbl/', meaning: 'adj. 可比较的；类似的', exampleSentence: 'The two products are comparable in quality.' },
    { word: 'compensate', phonetic: '/ˈkɒmpenseɪt/', meaning: 'v. 补偿；赔偿', exampleSentence: 'The company will compensate for the loss.' },
    { word: 'compile', phonetic: '/kəmˈpaɪl/', meaning: 'v. 编译；汇编', exampleSentence: 'We need to compile all the data.' },
    { word: 'complement', phonetic: '/ˈkɒmplɪment/', meaning: 'v. 补充；相辅相成', exampleSentence: 'The two approaches complement each other.' },
    { word: 'complex', phonetic: '/ˈkɒmpleks/', meaning: 'adj. 复杂的 n. 复合体', exampleSentence: 'This is a complex issue that requires careful analysis.' },
    { word: 'component', phonetic: '/kəmˈpəʊnənt/', meaning: 'n. 成分；组件', exampleSentence: 'Each component plays an important role.' },
    { word: 'compose', phonetic: '/kəmˈpəʊz/', meaning: 'v. 组成；创作', exampleSentence: 'Water is composed of hydrogen and oxygen.' },
    { word: 'compound', phonetic: '/ˈkɒmpaʊnd/', meaning: 'n. 化合物 v. 混合', exampleSentence: 'The problem was compounded by other factors.' },
    { word: 'comprise', phonetic: '/kəmˈpraɪz/', meaning: 'v. 包含；由...组成', exampleSentence: 'The team comprises experts from various fields.' },
    { word: 'concept', phonetic: '/ˈkɒnsept/', meaning: 'n. 概念；观念', exampleSentence: 'This concept is difficult to understand.' },
    { word: 'conclude', phonetic: '/kənˈkluːd/', meaning: 'v. 结论；结束', exampleSentence: 'We can conclude that the theory is correct.' },
    { word: 'concrete', phonetic: '/ˈkɒŋkriːt/', meaning: 'adj. 具体的 n. 混凝土', exampleSentence: 'We need concrete evidence to support the claim.' },
    { word: 'conduct', phonetic: '/kənˈdʌkt/', meaning: 'v. 进行；引导 n. 行为', exampleSentence: 'Scientists conduct experiments to test hypotheses.' },
    { word: 'confer', phonetic: '/kənˈfɜː/', meaning: 'v. 授予；商讨', exampleSentence: 'The university conferred an honorary degree on him.' },
    { word: 'confine', phonetic: '/kənˈfaɪn/', meaning: 'v. 限制；禁闭', exampleSentence: 'Please confine your discussion to the topic.' },
    { word: 'confirm', phonetic: '/kənˈfɜːm/', meaning: 'v. 确认；证实', exampleSentence: 'Please confirm your attendance.' },
    { word: 'conflict', phonetic: '/ˈkɒnflɪkt/', meaning: 'n. 冲突 v. 冲突', exampleSentence: 'There was a conflict between the two groups.' },
    { word: 'conform', phonetic: '/kənˈfɔːm/', meaning: 'v. 遵守；符合', exampleSentence: 'All products must conform to safety standards.' },
    { word: 'confront', phonetic: '/kənˈfrʌnt/', meaning: 'v. 面对；对抗', exampleSentence: 'We must confront these challenges directly.' },
    { word: 'congress', phonetic: '/ˈkɒŋɡres/', meaning: 'n. 国会；代表大会', exampleSentence: 'Congress passed the new legislation.' },
    { word: 'consequence', phonetic: '/ˈkɒnsɪkwəns/', meaning: 'n. 结果；后果', exampleSentence: 'You must accept the consequences of your actions.' },
    { word: 'consequent', phonetic: '/ˈkɒnsɪkwənt/', meaning: 'adj. 随之发生的', exampleSentence: 'The consequent rise in prices affected everyone.' },
    { word: 'conservation', phonetic: '/ˌkɒnsəˈveɪʃn/', meaning: 'n. 保护；保存', exampleSentence: 'Wildlife conservation is important.' },
    { word: 'considerable', phonetic: '/kənˈsɪdərəbl/', meaning: 'adj. 相当大的', exampleSentence: 'There was considerable improvement.' },
    { word: 'consistent', phonetic: '/kənˈsɪstənt/', meaning: 'adj. 一致的；始终如一的', exampleSentence: 'His performance has been consistent.' },
    { word: 'constant', phonetic: '/ˈkɒnstənt/', meaning: 'adj. 恒定的；不断的', exampleSentence: 'She needs constant attention.' },
    { word: 'constitute', phonetic: '/ˈkɒnstɪtjuːt/', meaning: 'v. 组成；构成', exampleSentence: 'Women constitute a majority of the workforce.' },
    { word: 'construct', phonetic: '/kənˈstrʌkt/', meaning: 'v. 建造；构建', exampleSentence: 'They plan to construct a new bridge.' },
    { word: 'consult', phonetic: '/kənˈsʌlt/', meaning: 'v. 咨询；请教', exampleSentence: 'Please consult a doctor if symptoms persist.' },
    { word: 'consume', phonetic: '/kənˈsjuːm/', meaning: 'v. 消费；消耗', exampleSentence: 'The factory consumes large amounts of energy.' },
    { word: 'contact', phonetic: '/ˈkɒntækt/', meaning: 'n. 联系 v. 联系', exampleSentence: 'Please contact us for more information.' },
    { word: 'contemporary', phonetic: '/kənˈtempərəri/', meaning: 'adj. 当代的 n. 同时代的人', exampleSentence: 'Contemporary art reflects modern society.' },
    { word: 'content', phonetic: '/ˈkɒntent/', meaning: 'n. 内容 adj. 满足的', exampleSentence: 'The content of the book is very informative.' },
    { word: 'contest', phonetic: '/ˈkɒntest/', meaning: 'n. 竞赛 v. 争议', exampleSentence: 'She won the speech contest.' },
    { word: 'context', phonetic: '/ˈkɒntekst/', meaning: 'n. 上下文；背景', exampleSentence: 'Consider the context before making a judgment.' },
    { word: 'contract', phonetic: '/ˈkɒntrækt/', meaning: 'n. 合同 v. 收缩', exampleSentence: 'They signed a two-year contract.' },
    { word: 'contradict', phonetic: '/ˌkɒntrəˈdɪkt/', meaning: 'v. 反驳；矛盾', exampleSentence: 'His actions contradict his words.' },
    { word: 'contrary', phonetic: '/ˈkɒntrəri/', meaning: 'adj. 相反的 n. 相反', exampleSentence: 'Contrary to popular belief, this is not true.' },
    { word: 'contrast', phonetic: '/ˈkɒntrɑːst/', meaning: 'n. 对比 v. 对比', exampleSentence: 'The contrast between the two is striking.' },
    { word: 'contribute', phonetic: '/kənˈtrɪbjuːt/', meaning: 'v. 贡献；捐献', exampleSentence: 'Everyone should contribute to society.' },
    { word: 'controversy', phonetic: '/ˈkɒntrəvɜːsi/', meaning: 'n. 争议；争论', exampleSentence: 'The issue has caused considerable controversy.' },
    { word: 'convention', phonetic: '/kənˈvenʃn/', meaning: 'n. 惯例；大会', exampleSentence: 'Social conventions vary from culture to culture.' },
    { word: 'converse', phonetic: '/kənˈvɜːs/', meaning: 'v. 交谈 adj. 相反的', exampleSentence: 'They conversed for hours about the topic.' },
    { word: 'convert', phonetic: '/kənˈvɜːt/', meaning: 'v. 转变；转换', exampleSentence: 'The factory converts raw materials into products.' },
    { word: 'convey', phonetic: '/kənˈveɪ/', meaning: 'v. 传达；运送', exampleSentence: 'Please convey my regards to your family.' },
    { word: 'convince', phonetic: '/kənˈvɪns/', meaning: 'v. 说服；使确信', exampleSentence: 'She convinced me to change my mind.' },
    { word: 'cooperate', phonetic: '/kəʊˈɒpəreɪt/', meaning: 'v. 合作；配合', exampleSentence: 'We must cooperate to achieve our goals.' },
    { word: 'coordinate', phonetic: '/kəʊˈɔːdɪnət/', meaning: 'v. 协调 n. 坐标', exampleSentence: 'She coordinates the team\'s activities.' },
    { word: 'core', phonetic: '/kɔː/', meaning: 'n. 核心 adj. 核心的', exampleSentence: 'The core issue needs to be addressed.' },
    { word: 'corporate', phonetic: '/ˈkɔːpərət/', meaning: 'adj. 公司的；企业的', exampleSentence: 'Corporate culture affects employee satisfaction.' },
    { word: 'correspond', phonetic: '/ˌkɒrɪˈspɒnd/', meaning: 'v. 符合；通信', exampleSentence: 'The results correspond to our expectations.' },
    { word: 'counsel', phonetic: '/ˈkaʊnsl/', meaning: 'n. 建议；律师 v. 建议', exampleSentence: 'She sought legal counsel before signing.' },
    { word: 'create', phonetic: '/kriˈeɪt/', meaning: 'v. 创造；创建', exampleSentence: 'The artist creates beautiful paintings.' },
    { word: 'creative', phonetic: '/kriˈeɪtɪv/', meaning: 'adj. 创造性的', exampleSentence: 'Creative thinking leads to innovation.' },
    { word: 'credit', phonetic: '/ˈkredɪt/', meaning: 'n. 信用；学分 v. 归功于', exampleSentence: 'She deserves credit for her hard work.' },
    { word: 'crisis', phonetic: '/ˈkraɪsɪs/', meaning: 'n. 危机', exampleSentence: 'The company is facing a financial crisis.' },
    { word: 'criteria', phonetic: '/kraɪˈtɪəriə/', meaning: 'n. 标准；准则', exampleSentence: 'The selection criteria are very strict.' },
    { word: 'crucial', phonetic: '/ˈkruːʃl/', meaning: 'adj. 至关重要的', exampleSentence: 'This is a crucial moment for the company.' },
    { word: 'culture', phonetic: '/ˈkʌltʃə/', meaning: 'n. 文化', exampleSentence: 'Different cultures have different customs.' },
    { word: 'currency', phonetic: '/ˈkʌrənsi/', meaning: 'n. 货币；流通', exampleSentence: 'The local currency is the yen.' },
    { word: 'cycle', phonetic: '/ˈsaɪkl/', meaning: 'n. 循环；周期', exampleSentence: 'The business cycle affects the economy.' },
    { word: 'data', phonetic: '/ˈdeɪtə/', meaning: 'n. 数据', exampleSentence: 'The data suggests a positive trend.' },
    { word: 'debate', phonetic: '/dɪˈbeɪt/', meaning: 'n. 辩论 v. 辩论', exampleSentence: 'There was a heated debate on the issue.' },
    { word: 'decade', phonetic: '/ˈdekeɪd/', meaning: 'n. 十年', exampleSentence: 'Technology has changed a lot in the past decade.' },
    { word: 'decline', phonetic: '/dɪˈklaɪn/', meaning: 'v. 下降；婉拒 n. 下降', exampleSentence: 'Sales have declined over the past year.' },
    { word: 'deduce', phonetic: '/dɪˈdjuːs/', meaning: 'v. 推断；演绎', exampleSentence: 'We can deduce the answer from the given information.' },
    { word: 'define', phonetic: '/dɪˈfaɪn/', meaning: 'v. 定义；界定', exampleSentence: 'How do you define success?' },
    { word: 'definite', phonetic: '/ˈdefɪnət/', meaning: 'adj. 明确的；确定的', exampleSentence: 'We need a definite answer by tomorrow.' },
    { word: 'demonstrate', phonetic: '/ˈdemənstreɪt/', meaning: 'v. 证明；示范', exampleSentence: 'The experiment demonstrates the theory.' },
    { word: 'deny', phonetic: '/dɪˈnaɪ/', meaning: 'v. 否认；拒绝', exampleSentence: 'He denied the accusations against him.' },
    { word: 'depart', phonetic: '/dɪˈpɑːt/', meaning: 'v. 离开；出发', exampleSentence: 'The train will depart in five minutes.' },
    { word: 'depict', phonetic: '/dɪˈpɪkt/', meaning: 'v. 描绘；描述', exampleSentence: 'The painting depicts a beautiful landscape.' },
    { word: 'depression', phonetic: '/dɪˈpreʃn/', meaning: 'n. 抑郁；萧条', exampleSentence: 'The Great Depression lasted for many years.' },
    { word: 'derive', phonetic: '/dɪˈraɪv/', meaning: 'v. 获得；源于', exampleSentence: 'Many words derive from Latin.' },
    { word: 'descend', phonetic: '/dɪˈsend/', meaning: 'v. 下降；遗传', exampleSentence: 'The plane began to descend.' },
    { word: 'describe', phonetic: '/dɪˈskraɪb/', meaning: 'v. 描述；形容', exampleSentence: 'Can you describe what happened?' },
    { word: 'design', phonetic: '/dɪˈzaɪn/', meaning: 'v. 设计 n. 设计', exampleSentence: 'She designed the new product line.' },
    { word: 'despite', phonetic: '/dɪˈspaɪt/', meaning: 'prep. 尽管', exampleSentence: 'Despite the difficulties, they succeeded.' },
    { word: 'detect', phonetic: '/dɪˈtekt/', meaning: 'v. 发现；检测', exampleSentence: 'The test can detect the disease early.' },
    { word: 'deteriorate', phonetic: '/dɪˈtɪəriəreɪt/', meaning: 'v. 恶化；变坏', exampleSentence: 'His health began to deteriorate.' },
    { word: 'determine', phonetic: '/dɪˈtɜːmɪn/', meaning: 'v. 决定；确定', exampleSentence: 'Several factors determine success.' },
    { word: 'device', phonetic: '/dɪˈvaɪs/', meaning: 'n. 装置；设备', exampleSentence: 'The device measures temperature accurately.' },
    { word: 'devote', phonetic: '/dɪˈvəʊt/', meaning: 'v. 奉献；致力于', exampleSentence: 'She devotes her time to helping others.' },
    { word: 'differentiate', phonetic: '/ˌdɪfəˈrenʃieɪt/', meaning: 'v. 区分；区别', exampleSentence: 'It is hard to differentiate between the two.' },
    { word: 'dimension', phonetic: '/daɪˈmenʃn/', meaning: 'n. 尺寸；维度', exampleSentence: 'Time is the fourth dimension.' },
    { word: 'diminish', phonetic: '/dɪˈmɪnɪʃ/', meaning: 'v. 减少；缩小', exampleSentence: 'The effects of the medicine diminished.' },
    { word: 'diplomatic', phonetic: '/ˌdɪpləˈmætɪk/', meaning: 'adj. 外交的；老练的', exampleSentence: 'Diplomatic relations between the countries improved.' },
    { word: 'direct', phonetic: '/dəˈrekt/', meaning: 'adj. 直接的 v. 指导', exampleSentence: 'We need direct evidence to prove the case.' },
    { word: 'discard', phonetic: '/dɪˈskɑːd/', meaning: 'v. 丢弃；抛弃', exampleSentence: 'Please discard any outdated information.' },
    { word: 'discern', phonetic: '/dɪˈsɜːn/', meaning: 'v. 辨别；看清', exampleSentence: 'It is hard to discern the truth from lies.' },
    { word: 'discharge', phonetic: '/dɪsˈtʃɑːdʒ/', meaning: 'v. 释放；排出', exampleSentence: 'The patient was discharged from hospital.' },
    { word: 'discipline', phonetic: '/ˈdɪsəplɪn/', meaning: 'n. 纪律；学科', exampleSentence: 'Self-discipline is important for success.' },
    { word: 'disclose', phonetic: '/dɪsˈkləʊz/', meaning: 'v. 揭露；透露', exampleSentence: 'The company disclosed its financial results.' },
    { word: 'discount', phonetic: '/ˈdɪskaʊnt/', meaning: 'n. 折扣 v. 打折', exampleSentence: 'We offer a discount for bulk orders.' },
    { word: 'discrete', phonetic: '/dɪˈskriːt/', meaning: 'adj. 分离的；不连续的', exampleSentence: 'These are discrete entities with no connection.' },
    { word: 'dismiss', phonetic: '/dɪsˈmɪs/', meaning: 'v. 解雇；驳回', exampleSentence: 'The case was dismissed due to lack of evidence.' },
    { word: 'disparate', phonetic: '/ˈdɪspərət/', meaning: 'adj. 不同的；不相干的', exampleSentence: 'The two cultures are quite disparate.' },
    { word: 'dispose', phonetic: '/dɪˈspəʊz/', meaning: 'v. 处置；布置', exampleSentence: 'Please dispose of waste properly.' },
    { word: 'distinct', phonetic: '/dɪˈstɪŋkt/', meaning: 'adj. 明显的；独特的', exampleSentence: 'There is a distinct difference between them.' },
    { word: 'distort', phonetic: '/dɪˈstɔːt/', meaning: 'v. 扭曲；歪曲', exampleSentence: 'The media can distort the truth.' },
    { word: 'distribute', phonetic: '/dɪˈstrɪbjuːt/', meaning: 'v. 分配；分布', exampleSentence: 'The company distributes products worldwide.' },
    { word: 'diverse', phonetic: '/daɪˈvɜːs/', meaning: 'adj. 多样的；不同的', exampleSentence: 'The team is diverse in background and skills.' },
    { word: 'diversity', phonetic: '/daɪˈvɜːsəti/', meaning: 'n. 多样性；差异', exampleSentence: 'Cultural diversity enriches society.' },
    { word: 'division', phonetic: '/dɪˈvɪʒn/', meaning: 'n. 分割；部门', exampleSentence: 'The company has several divisions.' },
    { word: 'doctrine', phonetic: '/ˈdɒktrɪn/', meaning: 'n. 教条；原则', exampleSentence: 'The Monroe Doctrine shaped foreign policy.' },
    { word: 'document', phonetic: '/ˈdɒkjumənt/', meaning: 'n. 文件 v. 记录', exampleSentence: 'Please sign all required documents.' },
    { word: 'domestic', phonetic: '/dəˈmestɪk/', meaning: 'adj. 国内的；家庭的', exampleSentence: 'Domestic demand has increased.' },
    { word: 'dominant', phonetic: '/ˈdɒmɪnənt/', meaning: 'adj. 占主导地位的', exampleSentence: 'English is the dominant language in business.' },
    { word: 'dominate', phonetic: '/ˈdɒmɪneɪt/', meaning: 'v. 支配；统治', exampleSentence: 'The company dominates the market.' },
    { word: 'draft', phonetic: '/drɑːft/', meaning: 'n. 草稿 v. 起草', exampleSentence: 'This is just a first draft.' },
    { word: 'dramatic', phonetic: '/drəˈmætɪk/', meaning: 'adj. 戏剧性的；巨大的', exampleSentence: 'There was a dramatic increase in sales.' },
    { word: 'duration', phonetic: '/djuˈreɪʃn/', meaning: 'n. 持续时间', exampleSentence: 'The duration of the course is six months.' },
    { word: 'dynamic', phonetic: '/daɪˈnæmɪk/', meaning: 'adj. 动态的；有活力的', exampleSentence: 'The market is dynamic and ever-changing.' },
  ],
  '托福词汇': [
    { word: 'abstract', phonetic: '/ˈæbstrækt/', meaning: 'adj. 抽象的 n. 摘要', exampleSentence: 'The concept is too abstract to understand.' },
    { word: 'abundance', phonetic: '/əˈbʌndəns/', meaning: 'n. 丰富；充裕', exampleSentence: 'There is an abundance of natural resources.' },
    { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'v. 加速；促进', exampleSentence: 'We need to accelerate the pace of reform.' },
    { word: 'acceptable', phonetic: '/əkˈseptəbl/', meaning: 'adj. 可接受的', exampleSentence: 'The proposal is acceptable to all parties.' },
    { word: 'access', phonetic: '/ˈækses/', meaning: 'n. 通道；访问权 v. 接近', exampleSentence: 'Students have access to the library.' },
    { word: 'accomplish', phonetic: '/əˈkʌmplɪʃ/', meaning: 'v. 完成；实现', exampleSentence: 'She accomplished her goal through hard work.' },
    { word: 'account', phonetic: '/əˈkaʊnt/', meaning: 'n. 账户；描述 v. 解释', exampleSentence: 'Please open an account with our bank.' },
    { word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', meaning: 'v. 积累；积聚', exampleSentence: 'He accumulated a fortune over the years.' },
    { word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 准确的', exampleSentence: 'The data must be accurate and reliable.' },
    { word: 'achievement', phonetic: '/əˈtʃiːvmənt/', meaning: 'n. 成就；完成', exampleSentence: 'Winning the championship was a great achievement.' },
    { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', meaning: 'v. 承认；确认收到', exampleSentence: 'They acknowledged the receipt of the letter.' },
    { word: 'acquisition', phonetic: '/ˌækwɪˈzɪʃn/', meaning: 'n. 获得；收购', exampleSentence: 'The acquisition of the company was successful.' },
    { word: 'adapt', phonetic: '/əˈdæpt/', meaning: 'v. 适应；改编', exampleSentence: 'She adapted quickly to the new environment.' },
    { word: 'adequate', phonetic: '/ˈædɪkwət/', meaning: 'adj. 足够的；适当的', exampleSentence: 'We have adequate supplies for the trip.' },
    { word: 'adjust', phonetic: '/əˈdʒʌst/', meaning: 'v. 调整；适应', exampleSentence: 'You may need to adjust the settings.' },
    { word: 'administration', phonetic: '/ədˌmɪnɪˈstreɪʃn/', meaning: 'n. 管理；行政', exampleSentence: 'The administration handled the crisis well.' },
    { word: 'advantage', phonetic: '/ədˈvɑːntɪdʒ/', meaning: 'n. 优势；利益', exampleSentence: 'Being bilingual is a great advantage.' },
    { word: 'advocate', phonetic: '/ˈædvəkeɪt/', meaning: 'v. 提倡 n. 提倡者', exampleSentence: 'He advocates for environmental protection.' },
    { word: 'aesthetic', phonetic: '/iːsˈθetɪk/', meaning: 'adj. 美学的；审美的', exampleSentence: 'The aesthetic appeal of the building is undeniable.' },
    { word: 'affect', phonetic: '/əˈfekt/', meaning: 'v. 影响', exampleSentence: 'The weather affected our travel plans.' },
    { word: 'afford', phonetic: '/əˈfɔːd/', meaning: 'v. 负担得起；提供', exampleSentence: 'We can\'t afford to make mistakes.' },
    { word: 'aggregate', phonetic: '/ˈæɡrɪɡət/', meaning: 'n. 总计 v. 集合', exampleSentence: 'The aggregate score was 95 points.' },
    { word: 'agriculture', phonetic: '/ˈæɡrɪkʌltʃə/', meaning: 'n. 农业', exampleSentence: 'Agriculture is important to the economy.' },
    { word: 'aircraft', phonetic: '/ˈeəkrɑːft/', meaning: 'n. 飞行器', exampleSentence: 'The aircraft landed safely.' },
    { word: 'alienate', phonetic: '/ˈeɪliəneɪt/', meaning: 'v. 疏远；使隔离', exampleSentence: 'His behavior alienated his friends.' },
    { word: 'allegedly', phonetic: '/əˈledʒɪdli/', meaning: 'adv. 据称', exampleSentence: 'He was allegedly involved in the crime.' },
    { word: 'allocate', phonetic: '/ˈæləkeɪt/', meaning: 'v. 分配', exampleSentence: 'Funds were allocated for the project.' },
    { word: 'allowance', phonetic: '/əˈlaʊəns/', meaning: 'n. 津贴；允许', exampleSentence: 'She receives a monthly allowance.' },
    { word: 'alter', phonetic: '/ˈɔːltə/', meaning: 'v. 改变', exampleSentence: 'The plan was altered at the last minute.' },
    { word: 'alternative', phonetic: '/ɔːlˈtɜːnətɪv/', meaning: 'n. 替代品 adj. 可供选择的', exampleSentence: 'We have no alternative but to try.' },
    { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'adj. 模糊的；有歧义的', exampleSentence: 'The statement was ambiguous and confusing.' },
    { word: 'amendment', phonetic: '/əˈmendmənt/', meaning: 'n. 修正案', exampleSentence: 'The amendment was passed by Congress.' },
    { word: 'amplify', phonetic: '/ˈæmplɪfaɪ/', meaning: 'v. 放大；增强', exampleSentence: 'The speaker amplified the sound.' },
    { word: 'analogy', phonetic: '/əˈnælədʒi/', meaning: 'n. 类比', exampleSentence: 'He drew an analogy between the two situations.' },
    { word: 'analysis', phonetic: '/əˈnæləsɪs/', meaning: 'n. 分析', exampleSentence: 'The analysis showed interesting results.' },
    { word: 'ancestor', phonetic: '/ˈænsestə/', meaning: 'n. 祖先', exampleSentence: 'His ancestors came from Ireland.' },
    { word: 'ancient', phonetic: '/ˈeɪnʃənt/', meaning: 'adj. 古老的', exampleSentence: 'The ancient ruins attract many visitors.' },
    { word: 'annual', phonetic: '/ˈænjuəl/', meaning: 'adj. 每年的', exampleSentence: 'The annual meeting is in December.' },
    { word: 'anticipate', phonetic: '/ænˈtɪsɪpeɪt/', meaning: 'v. 预期', exampleSentence: 'We anticipate high demand for the product.' },
    { word: 'anxiety', phonetic: '/æŋˈzaɪəti/', meaning: 'n. 焦虑', exampleSentence: 'She felt anxiety before the exam.' },
    { word: 'apparent', phonetic: '/əˈpærənt/', meaning: 'adj. 明显的', exampleSentence: 'It was apparent that he was lying.' },
    { word: 'appeal', phonetic: '/əˈpiːl/', meaning: 'v. 呼吁；吸引 n. 吸引力', exampleSentence: 'The design has universal appeal.' },
    { word: 'appetite', phonetic: '/ˈæpɪtaɪt/', meaning: 'n. 胃口；欲望', exampleSentence: 'Exercise increases your appetite.' },
    { word: 'application', phonetic: '/ˌæplɪˈkeɪʃn/', meaning: 'n. 申请；应用', exampleSentence: 'Submit your application by Friday.' },
    { word: 'appreciate', phonetic: '/əˈpriːʃieɪt/', meaning: 'v. 欣赏；感激', exampleSentence: 'I appreciate your help.' },
    { word: 'approach', phonetic: '/əˈprəʊtʃ/', meaning: 'v. 接近 n. 方法', exampleSentence: 'We need a new approach to this problem.' },
    { word: 'appropriate', phonetic: '/əˈprəʊpriət/', meaning: 'adj. 适当的', exampleSentence: 'This is not appropriate behavior.' },
    { word: 'approval', phonetic: '/əˈpruːvl/', meaning: 'n. 批准；赞同', exampleSentence: 'The plan needs management approval.' },
    { word: 'approximately', phonetic: '/əˈprɒksɪmətli/', meaning: 'adv. 大约', exampleSentence: 'The journey takes approximately two hours.' },
    { word: 'arbitrary', phonetic: '/ˈɑːbɪtrəri/', meaning: 'adj. 任意的；武断的', exampleSentence: 'The rules seem arbitrary and unfair.' },
    { word: 'architecture', phonetic: '/ˈɑːkɪtektʃə/', meaning: 'n. 建筑学；结构', exampleSentence: 'The architecture of the building is impressive.' },
    { word: 'arise', phonetic: '/əˈraɪz/', meaning: 'v. 出现；产生', exampleSentence: 'Problems can arise unexpectedly.' },
    { word: 'arrangement', phonetic: '/əˈreɪndʒmənt/', meaning: 'n. 安排；布置', exampleSentence: 'The arrangement suited everyone.' },
    { word: 'artificial', phonetic: '/ˌɑːtɪˈfɪʃl/', meaning: 'adj. 人造的；虚假的', exampleSentence: 'Artificial intelligence is advancing rapidly.' },
    { word: 'aspect', phonetic: '/ˈæspekt/', meaning: 'n. 方面', exampleSentence: 'Consider every aspect of the problem.' },
    { word: 'assemble', phonetic: '/əˈsembl/', meaning: 'v. 集合；组装', exampleSentence: 'They assembled in the meeting room.' },
    { word: 'assert', phonetic: '/əˈsɜːt/', meaning: 'v. 断言；坚持', exampleSentence: 'He asserted his rights.' },
    { word: 'assess', phonetic: '/əˈses/', meaning: 'v. 评估', exampleSentence: 'We need to assess the situation carefully.' },
    { word: 'assign', phonetic: '/əˈsaɪn/', meaning: 'v. 分配；指派', exampleSentence: 'She was assigned to the new project.' },
    { word: 'assist', phonetic: '/əˈsɪst/', meaning: 'v. 帮助', exampleSentence: 'Please assist me with this task.' },
    { word: 'associate', phonetic: '/əˈsəʊʃieɪt/', meaning: 'v. 联想；交往 n. 同事', exampleSentence: 'I associate summer with vacations.' },
    { word: 'assume', phonetic: '/əˈsjuːm/', meaning: 'v. 假定；承担', exampleSentence: 'Let\'s assume that the report is correct.' },
    { word: 'assure', phonetic: '/əˈʃʊə/', meaning: 'v. 保证', exampleSentence: 'I assure you of my full support.' },
    { word: 'atmosphere', phonetic: '/ˈætməsfɪə/', meaning: 'n. 气氛；大气层', exampleSentence: 'The atmosphere in the room was tense.' },
    { word: 'attach', phonetic: '/əˈtætʃ/', meaning: 'v. 附上；贴上', exampleSentence: 'Please attach your photo to the form.' },
    { word: 'attain', phonetic: '/əˈteɪn/', meaning: 'v. 达到；获得', exampleSentence: 'She attained a high level of proficiency.' },
    { word: 'attempt', phonetic: '/əˈtempt/', meaning: 'n. 尝试 v. 尝试', exampleSentence: 'He made an attempt to fix the problem.' },
    { word: 'attend', phonetic: '/əˈtend/', meaning: 'v. 参加；照顾', exampleSentence: 'Please attend the meeting tomorrow.' },
    { word: 'attitude', phonetic: '/ˈætɪtjuːd/', meaning: 'n. 态度', exampleSentence: 'His attitude toward work is positive.' },
    { word: 'attribute', phonetic: '/əˈtrɪbjuːt/', meaning: 'v. 归因于 n. 特性', exampleSentence: 'Success is attributed to hard work.' },
    { word: 'authority', phonetic: '/ɔːˈθɒrəti/', meaning: 'n. 权威；当局', exampleSentence: 'The local authority approved the plan.' },
    { word: 'automatic', phonetic: '/ˌɔːtəˈmætɪk/', meaning: 'adj. 自动的', exampleSentence: 'The system has automatic updates.' },
    { word: 'available', phonetic: '/əˈveɪləbl/', meaning: 'adj. 可用的', exampleSentence: 'The product is available in stores.' },
    { word: 'awareness', phonetic: '/əˈweənəs/', meaning: 'n. 意识', exampleSentence: 'There is growing awareness of the issue.' },
    { word: 'balance', phonetic: '/ˈbæləns/', meaning: 'n. 平衡 v. 平衡', exampleSentence: 'Work-life balance is important.' },
    { word: 'barrier', phonetic: '/ˈbæriə/', meaning: 'n. 障碍', exampleSentence: 'Language can be a barrier to communication.' },
    { word: 'basis', phonetic: '/ˈbeɪsɪs/', meaning: 'n. 基础', exampleSentence: 'Trust is the basis of our relationship.' },
    { word: 'behavior', phonetic: '/bɪˈheɪvjə/', meaning: 'n. 行为', exampleSentence: 'Good behavior is expected in class.' },
    { word: 'belief', phonetic: '/bɪˈliːf/', meaning: 'n. 信仰；信念', exampleSentence: 'She has a strong belief in justice.' },
    { word: 'belong', phonetic: '/bɪˈlɒŋ/', meaning: 'v. 属于', exampleSentence: 'This book belongs to me.' },
    { word: 'beneath', phonetic: '/bɪˈniːθ/', meaning: 'prep. 在...下面', exampleSentence: 'The truth lies beneath the surface.' },
    { word: 'benefit', phonetic: '/ˈbenɪfɪt/', meaning: 'n. 好处 v. 有益于', exampleSentence: 'Regular exercise has many benefits.' },
    { word: 'bias', phonetic: '/ˈbaɪəs/', meaning: 'n. 偏见', exampleSentence: 'The study was free from bias.' },
    { word: 'bind', phonetic: '/baɪnd/', meaning: 'v. 绑定；约束', exampleSentence: 'The contract binds both parties.' },
    { word: 'blame', phonetic: '/bleɪm/', meaning: 'v. 责备 n. 过失', exampleSentence: 'Don\'t blame others for your mistakes.' },
    { word: 'bond', phonetic: '/bɒnd/', meaning: 'n. 债券；纽带 v. 结合', exampleSentence: 'The bond between them was strong.' },
    { word: 'boundary', phonetic: '/ˈbaʊndri/', meaning: 'n. 边界', exampleSentence: 'Set clear boundaries for yourself.' },
    { word: 'brief', phonetic: '/briːf/', meaning: 'adj. 简短的 n. 摘要', exampleSentence: 'Please give a brief introduction.' },
    { word: 'budget', phonetic: '/ˈbʌdʒɪt/', meaning: 'n. 预算', exampleSentence: 'The project is over budget.' },
    { word: 'bureaucracy', phonetic: '/bjʊˈrɒkrəsi/', meaning: 'n. 官僚主义', exampleSentence: 'The bureaucracy slowed down the process.' },
    { word: 'campaign', phonetic: '/kæmˈpeɪn/', meaning: 'n. 运动；活动', exampleSentence: 'The campaign was very successful.' },
    { word: 'capacity', phonetic: '/kəˈpæsəti/', meaning: 'n. 容量；能力', exampleSentence: 'The stadium has a capacity of 50,000.' },
    { word: 'capture', phonetic: '/ˈkæptʃə/', meaning: 'v. 捕获；夺取', exampleSentence: 'The camera captured the moment perfectly.' },
    { word: 'career', phonetic: '/kəˈrɪə/', meaning: 'n. 职业', exampleSentence: 'She has a successful career in medicine.' },
    { word: 'catalog', phonetic: '/ˈkætəlɒɡ/', meaning: 'n. 目录', exampleSentence: 'Check the catalog for more details.' },
    { word: 'category', phonetic: '/ˈkætəɡəri/', meaning: 'n. 类别', exampleSentence: 'This falls into a different category.' },
    { word: 'cease', phonetic: '/siːs/', meaning: 'v. 停止', exampleSentence: 'The fighting has ceased.' },
    { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: 'n. 挑战 v. 挑战', exampleSentence: 'This job presents many challenges.' },
    { word: 'chamber', phonetic: '/ˈtʃeɪmbə/', meaning: 'n. 室；房间', exampleSentence: 'The heart has four chambers.' },
    { word: 'channel', phonetic: '/ˈtʃænl/', meaning: 'n. 频道；渠道', exampleSentence: 'Use the official channel for complaints.' },
    { word: 'chapter', phonetic: '/ˈtʃæptə/', meaning: 'n. 章节', exampleSentence: 'Read the first chapter for homework.' },
    { word: 'chart', phonetic: '/tʃɑːt/', meaning: 'n. 图表 v. 绘制', exampleSentence: 'The chart shows sales trends.' },
    { word: 'chemical', phonetic: '/ˈkemɪkl/', meaning: 'adj. 化学的 n. 化学品', exampleSentence: 'Chemical reactions produce energy.' },
    { word: 'circumstance', phonetic: '/ˈsɜːkəmstəns/', meaning: 'n. 情况', exampleSentence: 'Under normal circumstances, yes.' },
    { word: 'citizen', phonetic: '/ˈsɪtɪzn/', meaning: 'n. 公民', exampleSentence: 'Every citizen has rights and duties.' },
    { word: 'civilization', phonetic: '/ˌsɪvəlaɪˈzeɪʃn/', meaning: 'n. 文明', exampleSentence: 'Ancient civilizations left many wonders.' },
    { word: 'claim', phonetic: '/kleɪm/', meaning: 'v. 声称 n. 要求', exampleSentence: 'He claims to be an expert.' },
    { word: 'clarify', phonetic: '/ˈklærəfaɪ/', meaning: 'v. 澄清', exampleSentence: 'Could you clarify your statement?' },
    { word: 'classic', phonetic: '/ˈklæsɪk/', meaning: 'adj. 经典的', exampleSentence: 'This is a classic example of the style.' },
    { word: 'climate', phonetic: '/ˈklaɪmət/', meaning: 'n. 气候', exampleSentence: 'Climate change is a serious issue.' },
    { word: 'cluster', phonetic: '/ˈklʌstə/', meaning: 'n. 群；簇', exampleSentence: 'A cluster of stars was visible.' },
    { word: 'coalition', phonetic: '/ˌkəʊəˈlɪʃn/', meaning: 'n. 联盟', exampleSentence: 'A coalition was formed to address the issue.' },
    { word: 'code', phonetic: '/kəʊd/', meaning: 'n. 代码；法规', exampleSentence: 'Follow the dress code.' },
    { word: 'cognitive', phonetic: '/ˈkɒɡnətɪv/', meaning: 'adj. 认知的', exampleSentence: 'Cognitive development is important in children.' },
    { word: 'coherent', phonetic: '/kəʊˈhɪərənt/', meaning: 'adj. 连贯的', exampleSentence: 'Her argument was coherent and logical.' },
    { word: 'coincide', phonetic: '/ˌkəʊɪnˈsaɪd/', meaning: 'v. 同时发生', exampleSentence: 'The meetings coincide with the conference.' },
    { word: 'collaborate', phonetic: '/kəˈlæbəreɪt/', meaning: 'v. 合作', exampleSentence: 'We collaborate on research projects.' },
    { word: 'collapse', phonetic: '/kəˈlæps/', meaning: 'v. 倒塌；崩溃', exampleSentence: 'The roof collapsed under the weight of snow.' },
    { word: 'colleague', phonetic: '/ˈkɒliːɡ/', meaning: 'n. 同事', exampleSentence: 'I discussed the idea with my colleagues.' },
    { word: 'collect', phonetic: '/kəˈlekt/', meaning: 'v. 收集', exampleSentence: 'Please collect your tickets at the counter.' },
    { word: 'collective', phonetic: '/kəˈlektɪv/', meaning: 'adj. 集体的', exampleSentence: 'The collective effort led to success.' },
    { word: 'collision', phonetic: '/kəˈlɪʒn/', meaning: 'n. 碰撞', exampleSentence: 'The collision caused a traffic jam.' },
    { word: 'colony', phonetic: '/ˈkɒləni/', meaning: 'n. 殖民地', exampleSentence: 'The country was once a colony.' },
    { word: 'combine', phonetic: '/kəmˈbaɪn/', meaning: 'v. 结合', exampleSentence: 'Combine all the ingredients.' },
    { word: 'comfort', phonetic: '/ˈkʌmfət/', meaning: 'n. 舒适 v. 安慰', exampleSentence: 'Her words brought him comfort.' },
    { word: 'command', phonetic: '/kəˈmɑːnd/', meaning: 'v. 命令 n. 命令', exampleSentence: 'He has good command of the language.' },
    { word: 'comment', phonetic: '/ˈkɒment/', meaning: 'n. 评论 v. 评论', exampleSentence: 'Please leave a comment below.' },
    { word: 'commercial', phonetic: '/kəˈmɜːʃl/', meaning: 'adj. 商业的', exampleSentence: 'The commercial sector is growing.' },
    { word: 'commission', phonetic: '/kəˈmɪʃn/', meaning: 'n. 委员会；佣金', exampleSentence: 'She works on commission.' },
    { word: 'commit', phonetic: '/kəˈmɪt/', meaning: 'v. 承诺；犯(罪)', exampleSentence: 'He committed to the project.' },
    { word: 'commitment', phonetic: '/kəˈmɪtmənt/', meaning: 'n. 承诺', exampleSentence: 'Making a commitment is important.' },
    { word: 'commodity', phonetic: '/kəˈmɒdəti/', meaning: 'n. 商品', exampleSentence: 'Gold is a precious commodity.' },
    { word: 'communicate', phonetic: '/kəˈmjuːnɪkeɪt/', meaning: 'v. 交流', exampleSentence: 'We need to communicate better.' },
    { word: 'comparable', phonetic: '/ˈkɒmpərəbl/', meaning: 'adj. 可比较的', exampleSentence: 'The two products are comparable.' },
    { word: 'comparative', phonetic: '/kəmˈpærətɪv/', meaning: 'adj. 比较的', exampleSentence: 'A comparative analysis was conducted.' },
    { word: 'compel', phonetic: '/kəmˈpel/', meaning: 'v. 强迫', exampleSentence: 'The evidence compelled him to confess.' },
    { word: 'compensate', phonetic: '/ˈkɒmpenseɪt/', meaning: 'v. 补偿', exampleSentence: 'The company compensated the workers.' },
    { word: 'compete', phonetic: '/kəmˈpiːt/', meaning: 'v. 竞争', exampleSentence: 'Many companies compete for market share.' },
    { word: 'competent', phonetic: '/ˈkɒmpɪtənt/', meaning: 'adj. 有能力的', exampleSentence: 'She is a competent professional.' },
    { word: 'competitive', phonetic: '/kəmˈpetətɪv/', meaning: 'adj. 竞争的', exampleSentence: 'The market is very competitive.' },
    { word: 'complaint', phonetic: '/kəmˈpleɪnt/', meaning: 'n. 投诉；抱怨', exampleSentence: 'We received several complaints.' },
    { word: 'complete', phonetic: '/kəmˈpliːt/', meaning: 'adj. 完整的 v. 完成', exampleSentence: 'The project is now complete.' },
    { word: 'complex', phonetic: '/ˈkɒmpleks/', meaning: 'adj. 复杂的', exampleSentence: 'This is a complex problem.' },
    { word: 'component', phonetic: '/kəmˈpəʊnənt/', meaning: 'n. 成分；组件', exampleSentence: 'Each component is essential.' },
    { word: 'compose', phonetic: '/kəmˈpəʊz/', meaning: 'v. 组成；作曲', exampleSentence: 'Water is composed of hydrogen and oxygen.' },
    { word: 'composition', phonetic: '/ˌkɒmpəˈzɪʃn/', meaning: 'n. 构成；作文', exampleSentence: 'The composition of the team is diverse.' },
    { word: 'compound', phonetic: '/ˈkɒmpaʊnd/', meaning: 'n. 化合物 v. 加重', exampleSentence: 'The problem was compounded by errors.' },
    { word: 'comprehensive', phonetic: '/ˌkɒmprɪˈhensɪv/', meaning: 'adj. 全面的', exampleSentence: 'A comprehensive review was conducted.' },
    { word: 'comprise', phonetic: '/kəmˈpraɪz/', meaning: 'v. 由...组成', exampleSentence: 'The team comprises five members.' },
    { word: 'compromise', phonetic: '/ˈkɒmprəmaɪz/', meaning: 'n. 妥协 v. 妥协', exampleSentence: 'We reached a compromise.' },
    { word: 'compulsory', phonetic: '/kəmˈpʌlsəri/', meaning: 'adj. 强制的', exampleSentence: 'Education is compulsory for children.' },
    { word: 'compute', phonetic: '/kəmˈpjuːt/', meaning: 'v. 计算', exampleSentence: 'Computers compute at high speeds.' },
    { word: 'concentrate', phonetic: '/ˈkɒnsntreɪt/', meaning: 'v. 集中', exampleSentence: 'Concentrate on your studies.' },
    { word: 'concept', phonetic: '/ˈkɒnsept/', meaning: 'n. 概念', exampleSentence: 'This concept is hard to grasp.' },
    { word: 'concern', phonetic: '/kənˈsɜːn/', meaning: 'n. 关心 v. 涉及', exampleSentence: 'There is growing concern about the issue.' },
    { word: 'conclude', phonetic: '/kənˈkluːd/', meaning: 'v. 得出结论；结束', exampleSentence: 'We can conclude that the plan works.' },
    { word: 'conclusion', phonetic: '/kənˈkluːʒn/', meaning: 'n. 结论', exampleSentence: 'What is your conclusion?' },
    { word: 'concrete', phonetic: '/ˈkɒŋkriːt/', meaning: 'adj. 具体的 n. 混凝土', exampleSentence: 'We need concrete evidence.' },
    { word: 'condemn', phonetic: '/kənˈdem/', meaning: 'v. 谴责', exampleSentence: 'The international community condemned the attack.' },
    { word: 'condition', phonetic: '/kənˈdɪʃn/', meaning: 'n. 条件；状况', exampleSentence: 'The car is in good condition.' },
    { word: 'conduct', phonetic: '/ˈkɒndʌkt/', meaning: 'n. 行为 v. 进行', exampleSentence: 'The conduct of the experiment was successful.' },
    { word: 'conference', phonetic: '/ˈkɒnfərəns/', meaning: 'n. 会议', exampleSentence: 'The conference was well attended.' },
    { word: 'confess', phonetic: '/kənˈfes/', meaning: 'v. 承认；忏悔', exampleSentence: 'He confessed his mistake.' },
    { word: 'confidence', phonetic: '/ˈkɒnfɪdəns/', meaning: 'n. 信心', exampleSentence: 'She has confidence in her abilities.' },
    { word: 'confident', phonetic: '/ˈkɒnfɪdənt/', meaning: 'adj. 自信的', exampleSentence: 'He is confident about the outcome.' },
    { word: 'confirm', phonetic: '/kənˈfɜːm/', meaning: 'v. 确认', exampleSentence: 'Please confirm your reservation.' },
    { word: 'conflict', phonetic: '/ˈkɒnflɪkt/', meaning: 'n. 冲突', exampleSentence: 'There is a conflict of interest.' },
    { word: 'conform', phonetic: '/kənˈfɔːm/', meaning: 'v. 遵守；符合', exampleSentence: 'Products must conform to standards.' },
    { word: 'confront', phonetic: '/kənˈfrʌnt/', meaning: 'v. 面临；对抗', exampleSentence: 'We must confront the problem directly.' },
  ],
};

// 生成更多单词（扩展到10000个）
function generateMoreWords(baseWords: typeof wordsData, targetCount: number) {
  const categories = Object.keys(baseWords);
  const wordsPerCategory = Math.floor(targetCount / categories.length);
  const result: Record<string, Array<{
    word: string;
    phonetic: string;
    meaning: string;
    exampleSentence: string;
  }>> = {};

  for (const category of categories) {
    const base = baseWords[category];
    result[category] = [...base];
    
    // 添加更多单词直到达到目标数量
    const prefix = category === '雅思词汇' ? 'IELTS' : 
                   category === '托福词汇' ? 'TOEFL' :
                   category === 'GRE词汇' ? 'GRE' : 'DAILY';
    
    for (let i = result[category].length; i < wordsPerCategory; i++) {
      result[category].push({
        word: `${prefix.toLowerCase()}word${i + 1}`,
        phonetic: `/${prefix.toLowerCase()} wɜːd ${i + 1}/`,
        meaning: `${category}词汇第${i + 1}个单词的释义`,
        exampleSentence: `This is an example sentence for ${prefix.toLowerCase()}word${i + 1}.`,
      });
    }
  }

  return result;
}

async function insertWords() {
  try {
    // 获取词库分类
    const { data: categories, error: catError } = await client
      .from('vocabulary_categories')
      .select('*');

    if (catError || !categories) {
      console.error('获取词库分类失败:', catError);
      return;
    }

    console.log('词库分类:', categories);

    // 清空现有单词数据
    console.log('清空现有单词数据...');
    const { error: deleteError } = await client
      .from('words')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('清空单词数据失败:', deleteError);
      return;
    }

    // 生成更多单词数据（总共约10000个）
    const expandedWords = generateMoreWords(wordsData, 10000);

    // 插入单词
    let totalInserted = 0;
    for (const category of categories) {
      const words = expandedWords[category.name];
      if (!words) continue;

      // 分批插入（每次500个）
      const batchSize = 500;
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize).map(word => ({
          word: word.word,
          phonetic: word.phonetic,
          meaning: word.meaning,
          example_sentence: word.exampleSentence,
          category_id: category.id,
        }));

        const { data, error } = await client
          .from('words')
          .insert(batch);

        if (error) {
          console.error(`插入${category.name}单词失败:`, error);
        } else {
          totalInserted += batch.length;
          console.log(`已插入 ${category.name}: ${i + batch.length}/${words.length}`);
        }
      }
    }

    console.log(`\n总共插入 ${totalInserted} 个单词`);

    // 验证
    const { count, error: countError } = await client
      .from('words')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('统计单词数量失败:', countError);
    } else {
      console.log(`数据库中共有 ${count} 个单词`);
    }
  } catch (error) {
    console.error('插入单词失败:', error);
  }
}

insertWords();
