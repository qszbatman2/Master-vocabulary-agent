// P-Q字母开头的单词
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const supabase = getSupabaseClient();
const WORDS_TABLE = 'words';
const CATEGORIES_TABLE = 'vocabulary_categories';

interface WordData {
  word: string;
  phonetic: string;
  meaning: string;
  category?: string;
}

const wordsPQ: WordData[] = [
  // P 字母开头的单词
  { word: 'pace', phonetic: '/peɪs/', meaning: 'n. 速度；步伐 v. 踱步', category: '托福词汇' },
  { word: 'pacific', phonetic: '/pəˈsɪfɪk/', meaning: 'adj. 和平的；太平洋的', category: '托福词汇' },
  { word: 'pack', phonetic: '/pæk/', meaning: 'n. 包；一群 v. 打包', category: '日常词汇' },
  { word: 'package', phonetic: '/ˈpækɪdʒ/', meaning: 'n. 包裹；软件包', category: '托福词汇' },
  { word: 'packet', phonetic: '/ˈpækɪt/', meaning: 'n. 小包；数据包', category: '托福词汇' },
  { word: 'pad', phonetic: '/pæd/', meaning: 'n. 垫；便签本 v. 填充', category: '托福词汇' },
  { word: 'page', phonetic: '/peɪdʒ/', meaning: 'n. 页；网页', category: '日常词汇' },
  { word: 'pain', phonetic: '/peɪn/', meaning: 'n. 痛苦；疼痛', category: '托福词汇' },
  { word: 'painful', phonetic: '/ˈpeɪnfl/', meaning: 'adj. 痛苦的；困难的', category: '托福词汇' },
  { word: 'paint', phonetic: '/peɪnt/', meaning: 'n. 油漆 v. 绘画', category: '托福词汇' },
  { word: 'painter', phonetic: '/ˈpeɪntər/', meaning: 'n. 画家；油漆工', category: '托福词汇' },
  { word: 'painting', phonetic: '/ˈpeɪntɪŋ/', meaning: 'n. 绘画；画作', category: '托福词汇' },
  { word: 'pair', phonetic: '/peər/', meaning: 'n. 一对；一双', category: '日常词汇' },
  { word: 'palace', phonetic: '/ˈpæləs/', meaning: 'n. 宫殿', category: '托福词汇' },
  { word: 'pale', phonetic: '/peɪl/', meaning: 'adj. 苍白的；浅色的', category: '托福词汇' },
  { word: 'palm', phonetic: '/pɑːm/', meaning: 'n. 手掌；棕榈树', category: '托福词汇' },
  { word: 'pan', phonetic: '/pæn/', meaning: 'n. 平底锅', category: '日常词汇' },
  { word: 'panel', phonetic: '/ˈpænl/', meaning: 'n. 面板；专家小组', category: '托福词汇' },
  { word: 'panic', phonetic: '/ˈpænɪk/', meaning: 'n. 恐慌 v. 惊慌', category: '托福词汇' },
  { word: 'pants', phonetic: '/pænts/', meaning: 'n. 裤子', category: '日常词汇' },
  { word: 'paper', phonetic: '/ˈpeɪpər/', meaning: 'n. 纸；论文；报纸', category: '日常词汇' },
  { word: 'parade', phonetic: '/pəˈreɪd/', meaning: 'n. 游行；阅兵', category: '托福词汇' },
  { word: 'paragraph', phonetic: '/ˈpærəɡræf/', meaning: 'n. 段落', category: '托福词汇' },
  { word: 'parallel', phonetic: '/ˈpærəlel/', meaning: 'adj. 平行的 n. 平行线', category: 'GRE词汇' },
  { word: 'parcel', phonetic: '/ˈpɑːrsl/', meaning: 'n. 包裹', category: '托福词汇' },
  { word: 'pardon', phonetic: '/ˈpɑːrdn/', meaning: 'n./v. 原谅；赦免', category: '托福词汇' },
  { word: 'parent', phonetic: '/ˈpeərənt/', meaning: 'n. 父母', category: '日常词汇' },
  { word: 'park', phonetic: '/pɑːrk/', meaning: 'n. 公园 v. 停车', category: '日常词汇' },
  { word: 'parliament', phonetic: '/ˈpɑːrləmənt/', meaning: 'n. 议会；国会', category: 'GRE词汇' },
  { word: 'part', phonetic: '/pɑːrt/', meaning: 'n. 部分；角色', category: '托福词汇' },
  { word: 'participate', phonetic: '/pɑːrˈtɪsɪpeɪt/', meaning: 'v. 参加；参与', category: '托福词汇' },
  { word: 'particular', phonetic: '/pərˈtɪkjələr/', meaning: 'adj. 特定的；挑剔的', category: '托福词汇' },
  { word: 'particularly', phonetic: '/pərˈtɪkjələrli/', meaning: 'adv. 特别；尤其', category: '托福词汇' },
  { word: 'partly', phonetic: '/ˈpɑːrtli/', meaning: 'adv. 部分地', category: '托福词汇' },
  { word: 'partner', phonetic: '/ˈpɑːrtnər/', meaning: 'n. 伙伴；搭档', category: '托福词汇' },
  { word: 'party', phonetic: '/ˈpɑːrti/', meaning: 'n. 聚会；政党', category: '日常词汇' },
  { word: 'pass', phonetic: '/pæs/', meaning: 'v. 通过；传递 n. 通行证', category: '托福词汇' },
  { word: 'passage', phonetic: '/ˈpæsɪdʒ/', meaning: 'n. 通道；段落', category: '托福词汇' },
  { word: 'passenger', phonetic: '/ˈpæsɪndʒər/', meaning: 'n. 乘客', category: '托福词汇' },
  { word: 'passion', phonetic: '/ˈpæʃn/', meaning: 'n. 激情；热情', category: '托福词汇' },
  { word: 'passive', phonetic: '/ˈpæsɪv/', meaning: 'adj. 被动的；消极的', category: 'GRE词汇' },
  { word: 'passport', phonetic: '/ˈpæspɔːrt/', meaning: 'n. 护照', category: '托福词汇' },
  { word: 'past', phonetic: '/pæst/', meaning: 'adj. 过去的 n. 过去 prep. 经过', category: '日常词汇' },
  { word: 'patent', phonetic: '/ˈpætnt/', meaning: 'n. 专利 v. 获得专利', category: 'GRE词汇' },
  { word: 'path', phonetic: '/pæθ/', meaning: 'n. 路径；小路', category: '托福词汇' },
  { word: 'patience', phonetic: '/ˈpeɪʃn/', meaning: 'n. 耐心', category: '托福词汇' },
  { word: 'patient', phonetic: '/ˈpeɪʃn/', meaning: 'n. 病人 adj. 耐心的', category: '托福词汇' },
  { word: 'pattern', phonetic: '/ˈpætərn/', meaning: 'n. 模式；图案', category: '托福词汇' },
  { word: 'pause', phonetic: '/pɔːz/', meaning: 'n./v. 暂停', category: '托福词汇' },
  { word: 'pave', phonetic: '/peɪv/', meaning: 'v. 铺设；铺路', category: 'GRE词汇' },
  { word: 'paw', phonetic: '/pɔː/', meaning: 'n. 爪子', category: '托福词汇' },
  { word: 'pay', phonetic: '/peɪ/', meaning: 'v. 支付 n. 工资', category: '日常词汇' },
  { word: 'payment', phonetic: '/ˈpeɪmənt/', meaning: 'n. 支付；付款', category: '托福词汇' },
  { word: 'peace', phonetic: '/piːs/', meaning: 'n. 和平；安静', category: '托福词汇' },
  { word: 'peaceful', phonetic: '/ˈpiːsfl/', meaning: 'adj. 和平的；平静的', category: '托福词汇' },
  { word: 'peak', phonetic: '/piːk/', meaning: 'n. 山峰；顶点 adj. 高峰的', category: '托福词汇' },
  { word: 'peanut', phonetic: '/ˈpiːnʌt/', meaning: 'n. 花生', category: '日常词汇' },
  { word: 'pear', phonetic: '/peər/', meaning: 'n. 梨', category: '日常词汇' },
  { word: 'peasant', phonetic: '/ˈpeznt/', meaning: 'n. 农民', category: '托福词汇' },
  { word: 'peer', phonetic: '/pɪr/', meaning: 'n. 同龄人；同辈 v. 凝视', category: 'GRE词汇' },
  { word: 'pen', phonetic: '/pen/', meaning: 'n. 钢笔；围栏', category: '日常词汇' },
  { word: 'penalty', phonetic: '/ˈpenəlti/', meaning: 'n. 惩罚；罚金', category: '托福词汇' },
  { word: 'pencil', phonetic: '/ˈpensl/', meaning: 'n. 铅笔', category: '日常词汇' },
  { word: 'penny', phonetic: '/ˈpeni/', meaning: 'n. 便士', category: '托福词汇' },
  { word: 'pension', phonetic: '/ˈpenʃn/', meaning: 'n. 养老金；退休金', category: '托福词汇' },
  { word: 'people', phonetic: '/ˈpiːpl/', meaning: 'n. 人们；民族', category: '日常词汇' },
  { word: 'pepper', phonetic: '/ˈpepər/', meaning: 'n. 胡椒；辣椒', category: '日常词汇' },
  { word: 'per', phonetic: '/pɜːr/', meaning: 'prep. 每；每一', category: '托福词汇' },
  { word: 'perceive', phonetic: '/pərˈsiːv/', meaning: 'v. 感知；认识到', category: 'GRE词汇' },
  { word: 'percent', phonetic: '/pərˈsent/', meaning: 'n. 百分比', category: '托福词汇' },
  { word: 'percentage', phonetic: '/pərˈsentɪdʒ/', meaning: 'n. 百分比；比例', category: '托福词汇' },
  { word: 'perception', phonetic: '/pərˈsepʃn/', meaning: 'n. 感知；看法', category: 'GRE词汇' },
  { word: 'perfect', phonetic: '/ˈpɜːrfɪkt/', meaning: 'adj. 完美的 v. 完善', category: '托福词汇' },
  { word: 'perform', phonetic: '/pərˈfɔːrm/', meaning: 'v. 表演；执行', category: '托福词汇' },
  { word: 'performance', phonetic: '/pərˈfɔːrməns/', meaning: 'n. 表演；表现', category: '托福词汇' },
  { word: 'perhaps', phonetic: '/pərˈhæps/', meaning: 'adv. 也许；可能', category: '日常词汇' },
  { word: 'period', phonetic: '/ˈpɪriəd/', meaning: 'n. 时期；课时；句号', category: '托福词汇' },
  { word: 'permanent', phonetic: '/ˈpɜːrmənənt/', meaning: 'adj. 永久的', category: '托福词汇' },
  { word: 'permission', phonetic: '/pərˈmɪʃn/', meaning: 'n. 许可；允许', category: '托福词汇' },
  { word: 'permit', phonetic: '/pərˈmɪt/', meaning: 'v. 允许 n. 许可证', category: '托福词汇' },
  { word: 'person', phonetic: '/ˈpɜːrsn/', meaning: 'n. 人', category: '日常词汇' },
  { word: 'personal', phonetic: '/ˈpɜːrsənl/', meaning: 'adj. 个人的；私人的', category: '托福词汇' },
  { word: 'personality', phonetic: '/ˌpɜːrsəˈnæləti/', meaning: 'n. 个性；人格', category: '托福词汇' },
  { word: 'personnel', phonetic: '/ˌpɜːrsəˈnel/', meaning: 'n. 人员；人事部门', category: 'GRE词汇' },
  { word: 'perspective', phonetic: '/pərˈspektɪv/', meaning: 'n. 视角；透视法', category: 'GRE词汇' },
  { word: 'persuade', phonetic: '/pərˈsweɪd/', meaning: 'v. 说服；劝服', category: '托福词汇' },
  { word: 'pet', phonetic: '/pet/', meaning: 'n. 宠物', category: '日常词汇' },
  { word: 'petrol', phonetic: '/ˈpetrəl/', meaning: 'n. 汽油', category: '托福词汇' },
  { word: 'phase', phonetic: '/feɪz/', meaning: 'n. 阶段；时期', category: '托福词汇' },
  { word: 'phenomenon', phonetic: '/fəˈnɒmɪnən/', meaning: 'n. 现象', category: 'GRE词汇' },
  { word: 'philosophy', phonetic: '/fɪˈlɒsəfi/', meaning: 'n. 哲学', category: 'GRE词汇' },
  { word: 'phone', phonetic: '/foʊn/', meaning: 'n. 电话 v. 打电话', category: '日常词汇' },
  { word: 'photo', phonetic: '/ˈfoʊtoʊ/', meaning: 'n. 照片', category: '日常词汇' },
  { word: 'phrase', phonetic: '/freɪz/', meaning: 'n. 短语；词组', category: '托福词汇' },
  { word: 'physical', phonetic: '/ˈfɪzɪkl/', meaning: 'adj. 身体的；物理的', category: '托福词汇' },
  { word: 'physician', phonetic: '/fɪˈzɪʃn/', meaning: 'n. 医生', category: 'GRE词汇' },
  { word: 'physics', phonetic: '/ˈfɪzɪks/', meaning: 'n. 物理学', category: '托福词汇' },
  { word: 'piano', phonetic: '/piˈænoʊ/', meaning: 'n. 钢琴', category: '日常词汇' },
  { word: 'pick', phonetic: '/pɪk/', meaning: 'v. 挑选；采摘', category: '日常词汇' },
  { word: 'picnic', phonetic: '/ˈpɪknɪk/', meaning: 'n. 野餐', category: '日常词汇' },
  { word: 'picture', phonetic: '/ˈpɪktʃər/', meaning: 'n. 图片；画面', category: '日常词汇' },
  { word: 'pie', phonetic: '/paɪ/', meaning: 'n. 馅饼', category: '日常词汇' },
  { word: 'piece', phonetic: '/piːs/', meaning: 'n. 片；块；件', category: '日常词汇' },
  { word: 'pig', phonetic: '/pɪɡ/', meaning: 'n. 猪', category: '日常词汇' },
  { word: 'pile', phonetic: '/paɪl/', meaning: 'n. 堆 v. 堆积', category: '托福词汇' },
  { word: 'pill', phonetic: '/pɪl/', meaning: 'n. 药丸', category: '托福词汇' },
  { word: 'pillar', phonetic: '/ˈpɪlər/', meaning: 'n. 柱子；支柱', category: 'GRE词汇' },
  { word: 'pillow', phonetic: '/ˈpɪloʊ/', meaning: 'n. 枕头', category: '日常词汇' },
  { word: 'pilot', phonetic: '/ˈpaɪlət/', meaning: 'n. 飞行员 v. 驾驶', category: '托福词汇' },
  { word: 'pin', phonetic: '/pɪn/', meaning: 'n. 大头针；别针 v. 固定', category: '托福词汇' },
  { word: 'pine', phonetic: '/paɪn/', meaning: 'n. 松树', category: '托福词汇' },
  { word: 'pink', phonetic: '/pɪŋk/', meaning: 'adj. 粉红色的 n. 粉红色', category: '日常词汇' },
  { word: 'pioneer', phonetic: '/ˌpaɪəˈnɪr/', meaning: 'n. 先驱；开拓者', category: '托福词汇' },
  { word: 'pipe', phonetic: '/paɪp/', meaning: 'n. 管子；烟斗', category: '托福词汇' },
  { word: 'pity', phonetic: '/ˈpɪti/', meaning: 'n. 怜悯；遗憾', category: '托福词汇' },
  { word: 'pizza', phonetic: '/ˈpiːtsə/', meaning: 'n. 比萨饼', category: '日常词汇' },
  { word: 'place', phonetic: '/pleɪs/', meaning: 'n. 地方；位置 v. 放置', category: '日常词汇' },
  { word: 'plain', phonetic: '/pleɪn/', meaning: 'adj. 平的；朴素的 n. 平原', category: '托福词汇' },
  { word: 'plan', phonetic: '/plæn/', meaning: 'n. 计划 v. 计划', category: '日常词汇' },
  { word: 'plane', phonetic: '/pleɪn/', meaning: 'n. 飞机；平面', category: '日常词汇' },
  { word: 'planet', phonetic: '/ˈplænɪt/', meaning: 'n. 行星', category: '托福词汇' },
  { word: 'plant', phonetic: '/plænt/', meaning: 'n. 植物；工厂 v. 种植', category: '托福词汇' },
  { word: 'plastic', phonetic: '/ˈplæstɪk/', meaning: 'n. 塑料 adj. 塑料的', category: '托福词汇' },
  { word: 'plate', phonetic: '/pleɪt/', meaning: 'n. 盘子；板块', category: '日常词汇' },
  { word: 'platform', phonetic: '/ˈplætfɔːrm/', meaning: 'n. 平台；站台', category: '托福词汇' },
  { word: 'play', phonetic: '/pleɪ/', meaning: 'v. 玩；演奏 n. 戏剧', category: '日常词汇' },
  { word: 'player', phonetic: '/ˈpleɪər/', meaning: 'n. 玩家；选手', category: '托福词汇' },
  { word: 'playground', phonetic: '/ˈpleɪɡraʊnd/', meaning: 'n. 操场；游乐场', category: '日常词汇' },
  { word: 'pleasant', phonetic: '/ˈpleznt/', meaning: 'adj. 令人愉快的', category: '托福词汇' },
  { word: 'please', phonetic: '/pliːz/', meaning: 'v. 使高兴 adv. 请', category: '日常词汇' },
  { word: 'pleased', phonetic: '/pliːzd/', meaning: 'adj. 高兴的；满意的', category: '托福词汇' },
  { word: 'pleasure', phonetic: '/ˈpleʒər/', meaning: 'n. 快乐；乐趣', category: '托福词汇' },
  { word: 'plenty', phonetic: '/ˈplenti/', meaning: 'n. 充足；大量', category: '托福词汇' },
  { word: 'plot', phonetic: '/plɒt/', meaning: 'n. 情节；阴谋 v. 密谋', category: 'GRE词汇' },
  { word: 'plug', phonetic: '/plʌɡ/', meaning: 'n. 插头；塞子 v. 堵塞', category: '托福词汇' },
  { word: 'plunge', phonetic: '/plʌndʒ/', meaning: 'v. 跳入；骤降', category: 'GRE词汇' },
  { word: 'plural', phonetic: '/ˈplʊərəl/', meaning: 'adj. 复数的 n. 复数', category: '托福词汇' },
  { word: 'plus', phonetic: '/plʌs/', meaning: 'prep. 加 n. 加号 adj. 正的', category: '托福词汇' },
  { word: 'pocket', phonetic: '/ˈpɒkɪt/', meaning: 'n. 口袋 adj. 袖珍的', category: '托福词汇' },
  { word: 'poem', phonetic: '/ˈpoʊəm/', meaning: 'n. 诗', category: '托福词汇' },
  { word: 'poet', phonetic: '/ˈpoʊət/', meaning: 'n. 诗人', category: '托福词汇' },
  { word: 'poetry', phonetic: '/ˈpoʊətri/', meaning: 'n. 诗歌', category: '托福词汇' },
  { word: 'point', phonetic: '/pɔɪnt/', meaning: 'n. 点；要点 v. 指向', category: '托福词汇' },
  { word: 'poison', phonetic: '/ˈpɔɪzn/', meaning: 'n. 毒药 v. 毒害', category: 'GRE词汇' },
  { word: 'poisonous', phonetic: '/ˈpɔɪzənəs/', meaning: 'adj. 有毒的', category: 'GRE词汇' },
  { word: 'pole', phonetic: '/poʊl/', meaning: 'n. 杆；极', category: '托福词汇' },
  { word: 'police', phonetic: '/pəˈliːs/', meaning: 'n. 警察', category: '日常词汇' },
  { word: 'policeman', phonetic: '/pəˈliːsmən/', meaning: 'n. 警察', category: '日常词汇' },
  { word: 'policy', phonetic: '/ˈpɒləsi/', meaning: 'n. 政策；方针', category: '托福词汇' },
  { word: 'polite', phonetic: '/pəˈlaɪt/', meaning: 'adj. 礼貌的', category: '托福词汇' },
  { word: 'political', phonetic: '/pəˈlɪtɪkl/', meaning: 'adj. 政治的', category: '托福词汇' },
  { word: 'politician', phonetic: '/ˌpɒləˈtɪʃn/', meaning: 'n. 政治家', category: '托福词汇' },
  { word: 'politics', phonetic: '/ˈpɒlətɪks/', meaning: 'n. 政治；政治学', category: '托福词汇' },
  { word: 'poll', phonetic: '/poʊl/', meaning: 'n. 民意测验 v. 投票', category: 'GRE词汇' },
  { word: 'pollute', phonetic: '/pəˈluːt/', meaning: 'v. 污染', category: '托福词汇' },
  { word: 'pollution', phonetic: '/pəˈluːʃn/', meaning: 'n. 污染', category: '托福词汇' },
  { word: 'pond', phonetic: '/pɒnd/', meaning: 'n. 池塘', category: '托福词汇' },
  { word: 'pool', phonetic: '/puːl/', meaning: 'n. 水池；池塘 v. 集中', category: '日常词汇' },
  { word: 'poor', phonetic: '/pʊr/', meaning: 'adj. 贫穷的；可怜的', category: '托福词汇' },
  { word: 'pop', phonetic: '/pɒp/', meaning: 'adj. 流行的 n. 流行音乐 v. 突然出现', category: '托福词汇' },
  { word: 'popular', phonetic: '/ˈpɒpjələr/', meaning: 'adj. 流行的；受欢迎的', category: '托福词汇' },
  { word: 'population', phonetic: '/ˌpɒpjuˈleɪʃn/', meaning: 'n. 人口', category: '托福词汇' },
  { word: 'porcelain', phonetic: '/ˈpɔːrsəlɪn/', meaning: 'n. 瓷器', category: 'GRE词汇' },
  { word: 'port', phonetic: '/pɔːrt/', meaning: 'n. 港口；端口', category: '托福词汇' },
  { word: 'portable', phonetic: '/ˈpɔːrtəbl/', meaning: 'adj. 便携的', category: '托福词汇' },
  { word: 'porter', phonetic: '/ˈpɔːrtər/', meaning: 'n. 搬运工', category: '托福词汇' },
  { word: 'portion', phonetic: '/ˈpɔːrʃn/', meaning: 'n. 部分；一份', category: 'GRE词汇' },
  { word: 'portrait', phonetic: '/ˈpɔːrtreɪt/', meaning: 'n. 肖像', category: 'GRE词汇' },
  { word: 'pose', phonetic: '/poʊz/', meaning: 'v. 摆姿势 n. 姿势', category: '托福词汇' },
  { word: 'position', phonetic: '/pəˈzɪʃn/', meaning: 'n. 位置；职位', category: '托福词汇' },
  { word: 'positive', phonetic: '/ˈpɒzətɪv/', meaning: 'adj. 积极的；肯定的', category: '托福词汇' },
  { word: 'possess', phonetic: '/pəˈzes/', meaning: 'v. 拥有；占有', category: 'GRE词汇' },
  { word: 'possession', phonetic: '/pəˈzeʃn/', meaning: 'n. 拥有；财产', category: '托福词汇' },
  { word: 'possibility', phonetic: '/ˌpɒsəˈbɪləti/', meaning: 'n. 可能性', category: '托福词汇' },
  { word: 'possible', phonetic: '/ˈpɒsəbl/', meaning: 'adj. 可能的', category: '托福词汇' },
  { word: 'possibly', phonetic: '/ˈpɒsəbli/', meaning: 'adv. 可能地', category: '托福词汇' },
  { word: 'post', phonetic: '/poʊst/', meaning: 'n. 邮件；柱子；职位 v. 邮寄；发布', category: '托福词汇' },
  { word: 'postage', phonetic: '/ˈpoʊstɪdʒ/', meaning: 'n. 邮费', category: '托福词汇' },
  { word: 'postcard', phonetic: '/ˈpoʊstkɑːrd/', meaning: 'n. 明信片', category: '托福词汇' },
  { word: 'postman', phonetic: '/ˈpoʊstmən/', meaning: 'n. 邮递员', category: '托福词汇' },
  { word: 'postpone', phonetic: '/poʊstˈpoʊn/', meaning: 'v. 推迟', category: '托福词汇' },
  { word: 'pot', phonetic: '/pɒt/', meaning: 'n. 锅；壶', category: '日常词汇' },
  { word: 'potato', phonetic: '/pəˈteɪtoʊ/', meaning: 'n. 土豆', category: '日常词汇' },
  { word: 'potential', phonetic: '/pəˈtenʃl/', meaning: 'adj. 潜在的 n. 潜力', category: '托福词汇' },
  { word: 'pound', phonetic: '/paʊnd/', meaning: 'n. 英镑；磅 v. 重击', category: '托福词汇' },
  { word: 'pour', phonetic: '/pɔːr/', meaning: 'v. 倒；倾泻', category: '托福词汇' },
  { word: 'poverty', phonetic: '/ˈpɒvərti/', meaning: 'n. 贫穷', category: '托福词汇' },
  { word: 'powder', phonetic: '/ˈpaʊdər/', meaning: 'n. 粉末', category: '托福词汇' },
  { word: 'power', phonetic: '/ˈpaʊər/', meaning: 'n. 力量；权力；电力', category: '托福词汇' },
  { word: 'powerful', phonetic: '/ˈpaʊərfl/', meaning: 'adj. 强大的', category: '托福词汇' },
  { word: 'practical', phonetic: '/ˈpræktɪkl/', meaning: 'adj. 实际的；实用的', category: '托福词汇' },
  { word: 'practice', phonetic: '/ˈpræktɪs/', meaning: 'n. 实践；练习 v. 练习', category: '托福词汇' },
  { word: 'praise', phonetic: '/preɪz/', meaning: 'v./n. 赞扬', category: '托福词汇' },
  { word: 'pray', phonetic: '/preɪ/', meaning: 'v. 祈祷', category: '托福词汇' },
  { word: 'prayer', phonetic: '/preər/', meaning: 'n. 祈祷；祷告', category: '托福词汇' },
  { word: 'precious', phonetic: '/ˈpreʃəs/', meaning: 'adj. 珍贵的', category: '托福词汇' },
  { word: 'precise', phonetic: '/prɪˈsaɪs/', meaning: 'adj. 精确的', category: 'GRE词汇' },
  { word: 'precision', phonetic: '/prɪˈsɪʒn/', meaning: 'n. 精确；精密度', category: 'GRE词汇' },
  { word: 'predict', phonetic: '/prɪˈdɪkt/', meaning: 'v. 预测', category: '托福词汇' },
  { word: 'prefer', phonetic: '/prɪˈfɜːr/', meaning: 'v. 更喜欢', category: '托福词汇' },
  { word: 'preference', phonetic: '/ˈprefrəns/', meaning: 'n. 偏好', category: '托福词汇' },
  { word: 'pregnant', phonetic: '/ˈpreɡnənt/', meaning: 'adj. 怀孕的', category: '托福词汇' },
  { word: 'prejudice', phonetic: '/ˈpredʒədɪs/', meaning: 'n. 偏见', category: 'GRE词汇' },
  { word: 'premier', phonetic: '/prɪˈmɪr/', meaning: 'adj. 首要的 n. 总理', category: 'GRE词汇' },
  { word: 'premise', phonetic: '/ˈpremɪs/', meaning: 'n. 前提', category: 'GRE词汇' },
  { word: 'premium', phonetic: '/ˈpriːmiəm/', meaning: 'n. 保险费；溢价 adj. 高级的', category: 'GRE词汇' },
  { word: 'preparation', phonetic: '/ˌprepəˈreɪʃn/', meaning: 'n. 准备', category: '托福词汇' },
  { word: 'prepare', phonetic: '/prɪˈpeər/', meaning: 'v. 准备', category: '托福词汇' },
  { word: 'prescribe', phonetic: '/prɪˈskraɪb/', meaning: 'v. 开药；规定', category: 'GRE词汇' },
  { word: 'prescription', phonetic: '/prɪˈskrɪpʃn/', meaning: 'n. 处方；药方', category: 'GRE词汇' },
  { word: 'presence', phonetic: '/ˈprezns/', meaning: 'n. 出席；存在', category: '托福词汇' },
  { word: 'present', phonetic: '/ˈpreznt/', meaning: 'adj. 出席的；现在的 n. 礼物 v. 呈现', category: '托福词汇' },
  { word: 'presentation', phonetic: '/ˌpreznˈteɪʃn/', meaning: 'n. 展示；报告', category: '托福词汇' },
  { word: 'preserve', phonetic: '/prɪˈzɜːrv/', meaning: 'v. 保护；保存', category: '托福词汇' },
  { word: 'president', phonetic: '/ˈprezɪdənt/', meaning: 'n. 总统；总裁', category: '托福词汇' },
  { word: 'press', phonetic: '/pres/', meaning: 'v. 按；压 n. 出版业；新闻界', category: '托福词汇' },
  { word: 'pressure', phonetic: '/ˈpreʃər/', meaning: 'n. 压力', category: '托福词汇' },
  { word: 'presumably', phonetic: '/prɪˈzuːməbli/', meaning: 'adv. 大概；可能', category: 'GRE词汇' },
  { word: 'pretend', phonetic: '/prɪˈtend/', meaning: 'v. 假装', category: '托福词汇' },
  { word: 'pretty', phonetic: '/ˈprɪti/', meaning: 'adj. 漂亮的 adv. 相当', category: '日常词汇' },
  { word: 'prevail', phonetic: '/prɪˈveɪl/', meaning: 'v. 盛行；获胜', category: 'GRE词汇' },
  { word: 'prevent', phonetic: '/prɪˈvent/', meaning: 'v. 防止；阻止', category: '托福词汇' },
  { word: 'previous', phonetic: '/ˈpriːviəs/', meaning: 'adj. 先前的', category: '托福词汇' },
  { word: 'price', phonetic: '/praɪs/', meaning: 'n. 价格 v. 定价', category: '日常词汇' },
  { word: 'pride', phonetic: '/praɪd/', meaning: 'n. 骄傲；自豪', category: '托福词汇' },
  { word: 'priest', phonetic: '/priːst/', meaning: 'n. 牧师', category: '托福词汇' },
  { word: 'primary', phonetic: '/ˈpraɪmeri/', meaning: 'adj. 主要的；初级的', category: '托福词汇' },
  { word: 'prime', phonetic: '/praɪm/', meaning: 'adj. 主要的；最好的 n. 全盛期', category: 'GRE词汇' },
  { word: 'primitive', phonetic: '/ˈprɪmətɪv/', meaning: 'adj. 原始的', category: 'GRE词汇' },
  { word: 'prince', phonetic: '/prɪns/', meaning: 'n. 王子', category: '托福词汇' },
  { word: 'princess', phonetic: '/ˈprɪnses/', meaning: 'n. 公主', category: '托福词汇' },
  { word: 'principal', phonetic: '/ˈprɪnsəpl/', meaning: 'adj. 主要的 n. 校长', category: 'GRE词汇' },
  { word: 'principle', phonetic: '/ˈprɪnsəpl/', meaning: 'n. 原则；原理', category: '托福词汇' },
  { word: 'print', phonetic: '/prɪnt/', meaning: 'v. 打印 n. 印刷品', category: '托福词汇' },
  { word: 'printer', phonetic: '/ˈprɪntər/', meaning: 'n. 打印机', category: '托福词汇' },
  { word: 'prior', phonetic: '/ˈpraɪər/', meaning: 'adj. 先前的；优先的', category: 'GRE词汇' },
  { word: 'priority', phonetic: '/praɪˈɒrəti/', meaning: 'n. 优先权', category: '托福词汇' },
  { word: 'prison', phonetic: '/ˈprɪzn/', meaning: 'n. 监狱', category: '托福词汇' },
  { word: 'prisoner', phonetic: '/ˈprɪznər/', meaning: 'n. 囚犯', category: '托福词汇' },
  { word: 'private', phonetic: '/ˈpraɪvət/', meaning: 'adj. 私人的；私有的', category: '托福词汇' },
  { word: 'privilege', phonetic: '/ˈprɪvəlɪdʒ/', meaning: 'n. 特权', category: 'GRE词汇' },
  { word: 'prize', phonetic: '/praɪz/', meaning: 'n. 奖品 v. 珍视', category: '托福词汇' },
  { word: 'probability', phonetic: '/ˌprɒbəˈbɪləti/', meaning: 'n. 可能性；概率', category: 'GRE词汇' },
  { word: 'probable', phonetic: '/ˈprɒbəbl/', meaning: 'adj. 可能的', category: '托福词汇' },
  { word: 'probably', phonetic: '/ˈpɒbəbli/', meaning: 'adv. 大概；可能', category: '日常词汇' },
  { word: 'probe', phonetic: '/proʊb/', meaning: 'n. 探针 v. 探查', category: 'GRE词汇' },
  { word: 'problem', phonetic: '/ˈprɒbləm/', meaning: 'n. 问题', category: '日常词汇' },
  { word: 'procedure', phonetic: '/prəˈsiːdʒər/', meaning: 'n. 程序；步骤', category: 'GRE词汇' },
  { word: 'proceed', phonetic: '/prəˈsiːd/', meaning: 'v. 继续进行', category: 'GRE词汇' },
  { word: 'process', phonetic: '/ˈprəʊses/', meaning: 'n. 过程；程序 v. 处理', category: '托福词汇' },
  { word: 'procession', phonetic: '/prəˈseʃn/', meaning: 'n. 队伍；行列', category: 'GRE词汇' },
  { word: 'proclaim', phonetic: '/prəˈkleɪm/', meaning: 'v. 宣布；声明', category: 'GRE词汇' },
  { word: 'produce', phonetic: '/prəˈduːs/', meaning: 'v. 生产 n. 农产品', category: '托福词汇' },
  { word: 'producer', phonetic: '/prəˈduːsər/', meaning: 'n. 生产者；制片人', category: '托福词汇' },
  { word: 'product', phonetic: '/ˈprɒdʌkt/', meaning: 'n. 产品；产物', category: '托福词汇' },
  { word: 'production', phonetic: '/prəˈdʌkʃn/', meaning: 'n. 生产；制作', category: '托福词汇' },
  { word: 'profession', phonetic: '/prəˈfeʃn/', meaning: 'n. 职业', category: '托福词汇' },
  { word: 'professional', phonetic: '/prəˈfeʃənl/', meaning: 'adj. 专业的 n. 专业人士', category: '托福词汇' },
  { word: 'professor', phonetic: '/prəˈfesər/', meaning: 'n. 教授', category: '托福词汇' },
  { word: 'proficiency', phonetic: '/prəˈfɪʃnsi/', meaning: 'n. 精通；熟练', category: 'GRE词汇' },
  { word: 'profile', phonetic: '/ˈproʊfaɪl/', meaning: 'n. 侧面像；简介', category: '托福词汇' },
  { word: 'profit', phonetic: '/ˈprɒfɪt/', meaning: 'n. 利润 v. 获利', category: '托福词汇' },
  { word: 'profitable', phonetic: '/ˈprɒfɪtəbl/', meaning: 'adj. 有利可图的', category: 'GRE词汇' },
  { word: 'profound', phonetic: '/prəˈfaʊnd/', meaning: 'adj. 深刻的；深远的', category: 'GRE词汇' },
  { word: 'program', phonetic: '/ˈproʊɡræm/', meaning: 'n. 程序；计划 v. 编程', category: '托福词汇' },
  { word: 'programme', phonetic: '/ˈproʊɡræm/', meaning: 'n. 节目；计划', category: '托福词汇' },
  { word: 'progress', phonetic: '/ˈprɒɡres/', meaning: 'n. 进步 v. 前进', category: '托福词汇' },
  { word: 'progressive', phonetic: '/prəˈɡresɪv/', meaning: 'adj. 进步的；渐进的', category: 'GRE词汇' },
  { word: 'prohibit', phonetic: '/prəˈhɪbɪt/', meaning: 'v. 禁止', category: 'GRE词汇' },
  { word: 'project', phonetic: '/ˈprɒdʒekt/', meaning: 'n. 项目 v. 投射', category: '托福词汇' },
  { word: 'prominent', phonetic: '/ˈprɒmɪnənt/', meaning: 'adj. 杰出的；突出的', category: 'GRE词汇' },
  { word: 'promise', phonetic: '/ˈprɒmɪs/', meaning: 'n./v. 承诺', category: '托福词汇' },
  { word: 'promote', phonetic: '/prəˈmoʊt/', meaning: 'v. 促进；提升', category: '托福词汇' },
  { word: 'promotion', phonetic: '/prəˈmoʊʃn/', meaning: 'n. 晋升；促销', category: '托福词汇' },
  { word: 'prompt', phonetic: '/prɒmpt/', meaning: 'adj. 迅速的 v. 促使', category: 'GRE词汇' },
  { word: 'pronoun', phonetic: '/ˈproʊnaʊn/', meaning: 'n. 代词', category: '托福词汇' },
  { word: 'pronounce', phonetic: '/prəˈnaʊns/', meaning: 'v. 发音；宣布', category: '托福词汇' },
  { word: 'pronunciation', phonetic: '/prəˌnʌnsiˈeɪʃn/', meaning: 'n. 发音', category: '托福词汇' },
  { word: 'proof', phonetic: '/pruːf/', meaning: 'n. 证据；证明', category: '托福词汇' },
  { word: 'proper', phonetic: '/ˈprɒpər/', meaning: 'adj. 适当的；正确的', category: '托福词汇' },
  { word: 'properly', phonetic: '/ˈprɒpərli/', meaning: 'adv. 适当地', category: '托福词汇' },
  { word: 'property', phonetic: '/ˈprɒpərti/', meaning: 'n. 财产；性质', category: '托福词汇' },
  { word: 'proportion', phonetic: '/prəˈpɔːrʃn/', meaning: 'n. 比例；部分', category: 'GRE词汇' },
  { word: 'proposal', phonetic: '/prəˈpoʊzl/', meaning: 'n. 提议；求婚', category: '托福词汇' },
  { word: 'propose', phonetic: '/prəˈpoʊz/', meaning: 'v. 提议；求婚', category: '托福词汇' },
  { word: 'prospect', phonetic: '/ˈprɒspekt/', meaning: 'n. 前景；展望', category: 'GRE词汇' },
  { word: 'prosperity', phonetic: '/prɒˈsperəti/', meaning: 'n. 繁荣', category: 'GRE词汇' },
  { word: 'prosperous', phonetic: '/ˈprɒspərəs/', meaning: 'adj. 繁荣的', category: 'GRE词汇' },
  { word: 'protect', phonetic: '/prəˈtekt/', meaning: 'v. 保护', category: '托福词汇' },
  { word: 'protection', phonetic: '/prəˈtekʃn/', meaning: 'n. 保护', category: '托福词汇' },
  { word: 'protective', phonetic: '/prəˈtektɪv/', meaning: 'adj. 保护的', category: 'GRE词汇' },
  { word: 'protein', phonetic: '/ˈproʊtiːn/', meaning: 'n. 蛋白质', category: '托福词汇' },
  { word: 'protest', phonetic: '/ˈproʊtest/', meaning: 'n./v. 抗议', category: '托福词汇' },
  { word: 'proud', phonetic: '/praʊd/', meaning: 'adj. 骄傲的；自豪的', category: '托福词汇' },
  { word: 'prove', phonetic: '/pruːv/', meaning: 'v. 证明', category: '托福词汇' },
  { word: 'provide', phonetic: '/prəˈvaɪd/', meaning: 'v. 提供', category: '托福词汇' },
  { word: 'provided', phonetic: '/prəˈvaɪdɪd/', meaning: 'conj. 假如', category: 'GRE词汇' },
  { word: 'province', phonetic: '/ˈprɒvɪns/', meaning: 'n. 省；领域', category: '托福词汇' },
  { word: 'provision', phonetic: '/prəˈvɪʒn/', meaning: 'n. 条款；供应', category: 'GRE词汇' },
  { word: 'provoke', phonetic: '/prəˈvoʊk/', meaning: 'v. 激怒；引起', category: 'GRE词汇' },
  { word: 'psychological', phonetic: '/ˌsaɪkəˈlɒdʒɪkl/', meaning: 'adj. 心理的', category: 'GRE词汇' },
  { word: 'psychology', phonetic: '/saɪˈkɒlədʒi/', meaning: 'n. 心理学', category: 'GRE词汇' },
  { word: 'pub', phonetic: '/pʌb/', meaning: 'n. 酒吧', category: '托福词汇' },
  { word: 'public', phonetic: '/ˈpʌblɪk/', meaning: 'adj. 公共的 n. 公众', category: '托福词汇' },
  { word: 'publication', phonetic: '/ˌpʌblɪˈkeɪʃn/', meaning: 'n. 出版物；出版', category: 'GRE词汇' },
  { word: 'publicity', phonetic: '/pʌˈblɪsəti/', meaning: 'n. 宣传；公众关注', category: 'GRE词汇' },
  { word: 'publish', phonetic: '/ˈpʌblɪʃ/', meaning: 'v. 出版；发布', category: '托福词汇' },
  { word: 'publisher', phonetic: '/ˈpʌblɪʃər/', meaning: 'n. 出版商', category: '托福词汇' },
  { word: 'pull', phonetic: '/pʊl/', meaning: 'v. 拉；拖 n. 拉；吸引力', category: '托福词汇' },
  { word: 'pulse', phonetic: '/pʌls/', meaning: 'n. 脉搏', category: '托福词汇' },
  { word: 'pump', phonetic: '/pʌmp/', meaning: 'n. 泵 v. 抽；泵', category: '托福词汇' },
  { word: 'punch', phonetic: '/pʌntʃ/', meaning: 'v. 猛击 n. 拳打；打孔器', category: '托福词汇' },
  { word: 'punctual', phonetic: '/ˈpʌŋktʃuəl/', meaning: 'adj. 准时的', category: '托福词汇' },
  { word: 'punish', phonetic: '/ˈpʌnɪʃ/', meaning: 'v. 惩罚', category: '托福词汇' },
  { word: 'punishment', phonetic: '/ˈpʌnɪʃmənt/', meaning: 'n. 惩罚', category: '托福词汇' },
  { word: 'pupil', phonetic: '/ˈpjuːpl/', meaning: 'n. 学生；瞳孔', category: '托福词汇' },
  { word: 'puppet', phonetic: '/ˈpʌpɪt/', meaning: 'n. 木偶', category: 'GRE词汇' },
  { word: 'puppy', phonetic: '/ˈpʌpi/', meaning: 'n. 小狗', category: '托福词汇' },
  { word: 'purchase', phonetic: '/ˈpɜːrtʃəs/', meaning: 'v./n. 购买', category: '托福词汇' },
  { word: 'pure', phonetic: '/pjʊr/', meaning: 'adj. 纯的；纯洁的', category: '托福词汇' },
  { word: 'purple', phonetic: '/ˈpɜːrpl/', meaning: 'adj. 紫色的 n. 紫色', category: '托福词汇' },
  { word: 'purpose', phonetic: '/ˈpɜːrpəs/', meaning: 'n. 目的；意图', category: '托福词汇' },
  { word: 'purse', phonetic: '/pɜːrs/', meaning: 'n. 钱包', category: '托福词汇' },
  { word: 'pursue', phonetic: '/pərˈsuː/', meaning: 'v. 追求；从事', category: '托福词汇' },
  { word: 'pursuit', phonetic: '/pərˈsuːt/', meaning: 'n. 追求；追赶', category: 'GRE词汇' },
  { word: 'push', phonetic: '/pʊʃ/', meaning: 'v. 推；推动 n. 推', category: '托福词汇' },
  { word: 'put', phonetic: '/pʊt/', meaning: 'v. 放置', category: '日常词汇' },
  { word: 'puzzle', phonetic: '/ˈpʌzl/', meaning: 'n. 谜；难题 v. 使困惑', category: '托福词汇' },
  { word: 'pyramid', phonetic: '/ˈpɪrəmɪd/', meaning: 'n. 金字塔', category: '托福词汇' },
  
  // Q 字母开头的单词
  { word: 'qualification', phonetic: '/ˌkwɒlɪfɪˈkeɪʃn/', meaning: 'n. 资格；条件', category: '托福词汇' },
  { word: 'qualify', phonetic: '/ˈkwɒlɪfaɪ/', meaning: 'v. 使有资格；限定', category: '托福词汇' },
  { word: 'quality', phonetic: '/ˈkwɒləti/', meaning: 'n. 质量；品质', category: '托福词汇' },
  { word: 'quantity', phonetic: '/ˈkwɒntəti/', meaning: 'n. 数量', category: '托福词汇' },
  { word: 'quarrel', phonetic: '/ˈkwɒrəl/', meaning: 'n./v. 争吵', category: '托福词汇' },
  { word: 'quarter', phonetic: '/ˈkwɔːrtər/', meaning: 'n. 四分之一；一刻钟', category: '托福词汇' },
  { word: 'queen', phonetic: '/kwiːn/', meaning: 'n. 女王；王后', category: '托福词汇' },
  { word: 'query', phonetic: '/ˈkwɪəri/', meaning: 'n. 查询；疑问 v. 查询', category: 'GRE词汇' },
  { word: 'quest', phonetic: '/kwest/', meaning: 'n. 探索；追求', category: 'GRE词汇' },
  { word: 'question', phonetic: '/ˈkwestʃən/', meaning: 'n. 问题 v. 质问', category: '日常词汇' },
  { word: 'queue', phonetic: '/kjuː/', meaning: 'n. 队列 v. 排队', category: '托福词汇' },
  { word: 'quick', phonetic: '/kwɪk/', meaning: 'adj. 快的 adv. 快速地', category: '日常词汇' },
  { word: 'quiet', phonetic: '/ˈkwaɪət/', meaning: 'adj. 安静的 n. 安静', category: '日常词汇' },
  { word: 'quit', phonetic: '/kwɪt/', meaning: 'v. 辞职；放弃', category: '托福词汇' },
  { word: 'quite', phonetic: '/kwaɪt/', meaning: 'adv. 相当；完全', category: '日常词汇' },
  { word: 'quiz', phonetic: '/kwɪz/', meaning: 'n. 测验；问答比赛', category: '托福词汇' },
  { word: 'quota', phonetic: '/ˈkwoʊtə/', meaning: 'n. 配额；定额', category: 'GRE词汇' },
  { word: 'quotation', phonetic: '/kwoʊˈteɪʃn/', meaning: 'n. 引用；报价', category: 'GRE词汇' },
  { word: 'quote', phonetic: '/kwoʊt/', meaning: 'v. 引用 n. 引语；报价', category: '托福词汇' },
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
  const { data, error } = await supabase
    .from(WORDS_TABLE)
    .select('word');
  
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
  console.log('=== 开始导入 P-Q 字母开头的单词 ===');
  console.log(`预定义单词数量: ${wordsPQ.length}`);
  
  const categoryIds = await getCategoryIds();
  const existingSet = await getExistingWords();
  console.log(`已存在单词: ${existingSet.size} 个`);
  
  const inserted = await insertWords(wordsPQ, categoryIds, existingSet);
  
  console.log(`\n=== 导入完成 ===`);
  console.log(`本次导入: ${inserted} 个单词`);
}

main().catch(console.error);
