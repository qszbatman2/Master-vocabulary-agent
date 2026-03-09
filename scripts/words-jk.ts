// J-K字母开头的单词 - Part 1/2
import { getSupabaseClient } from '../src/storage/database/supabase-client';

const supabase = getSupabaseClient();
const WORDS_TABLE = 'words';

const wordsJK = [
  // J字母开头
  { word: 'jab', phonetic: '/dʒæb/', meaning: 'v. 戳；n. 戳', category: 'GRE词汇' },
  { word: 'jack', phonetic: '/dʒæk/', meaning: 'n. 千斤顶', category: '托福词汇' },
  { word: 'jacket', phonetic: '/ˈdʒækɪt/', meaning: 'n. 夹克', category: '托福词汇' },
  { word: 'jade', phonetic: '/dʒeɪd/', meaning: 'n. 玉；翡翠', category: 'GRE词汇' },
  { word: 'jagged', phonetic: '/ˈdʒæɡɪd/', meaning: 'adj. 锯齿状的', category: 'GRE词汇' },
  { word: 'jail', phonetic: '/dʒeɪl/', meaning: 'n. 监狱；v. 监禁', category: '托福词汇' },
  { word: 'jailer', phonetic: '/ˈdʒeɪlər/', meaning: 'n. 狱卒', category: 'GRE词汇' },
  { word: 'jam', phonetic: '/dʒæm/', meaning: 'n. 果酱；v. 挤满', category: '托福词汇' },
  { word: 'janitor', phonetic: '/ˈdʒænɪtər/', meaning: 'n. 看门人', category: 'GRE词汇' },
  { word: 'january', phonetic: '/ˈdʒænjuəri/', meaning: 'n. 一月', category: '日常词汇' },
  { word: 'japan', phonetic: '/dʒəˈpæn/', meaning: 'n. 日本', category: '托福词汇' },
  { word: 'japanese', phonetic: '/ˌdʒæpəˈniːz/', meaning: 'adj. 日本的；n. 日本人', category: '托福词汇' },
  { word: 'jar', phonetic: '/dʒɑːr/', meaning: 'n. 罐子', category: '托福词汇' },
  { word: 'jargon', phonetic: '/ˈdʒɑːɡən/', meaning: 'n. 行话', category: '托福词汇' },
  { word: 'jaundice', phonetic: '/ˈdʒɔːndɪs/', meaning: 'n. 黄疸；偏见', category: '医学词汇' },
  { word: 'jaunt', phonetic: '/dʒɔːnt/', meaning: 'n. 短途旅行', category: 'GRE词汇' },
  { word: 'jaunty', phonetic: '/ˈdʒɔːnti/', meaning: 'adj. 得意的；活泼的', category: 'GRE词汇' },
  { word: 'javelin', phonetic: '/ˈdʒævlɪn/', meaning: 'n. 标枪', category: 'GRE词汇' },
  { word: 'jaw', phonetic: '/dʒɔː/', meaning: 'n. 下巴', category: '托福词汇' },
  { word: 'jay', phonetic: '/dʒeɪ/', meaning: 'n. 松鸦', category: 'GRE词汇' },
  { word: 'jazz', phonetic: '/dʒæz/', meaning: 'n. 爵士乐', category: '托福词汇' },
  { word: 'jazzy', phonetic: '/ˈdʒæzi/', meaning: 'adj. 爵士风格的', category: 'GRE词汇' },
  { word: 'jealous', phonetic: '/ˈdʒeləs/', meaning: 'adj. 嫉妒的', category: '托福词汇' },
  { word: 'jealousy', phonetic: '/ˈdʒeləsi/', meaning: 'n. 嫉妒', category: '托福词汇' },
  { word: 'jeans', phonetic: '/dʒiːnz/', meaning: 'n. 牛仔裤', category: '托福词汇' },
  { word: 'jeer', phonetic: '/dʒɪər/', meaning: 'v. 嘲笑；n. 嘲笑', category: 'GRE词汇' },
  { word: 'jelly', phonetic: '/ˈdʒeli/', meaning: 'n. 果冻', category: '托福词汇' },
  { word: 'jellyfish', phonetic: '/ˈdʒelifɪʃ/', meaning: 'n. 水母', category: '托福词汇' },
  { word: 'jeopardize', phonetic: '/ˈdʒepədaɪz/', meaning: 'v. 危及', category: '托福词汇' },
  { word: 'jeopardy', phonetic: '/ˈdʒepədi/', meaning: 'n. 危险', category: '托福词汇' },
  { word: 'jerk', phonetic: '/dʒɜːk/', meaning: 'v. 猛拉；n. 急拉', category: '托福词汇' },
  { word: 'jerky', phonetic: '/ˈdʒɜːki/', meaning: 'adj. 急拉的；不平稳的', category: 'GRE词汇' },
  { word: 'jest', phonetic: '/dʒest/', meaning: 'n. 笑话；v. 开玩笑', category: 'GRE词汇' },
  { word: 'jet', phonetic: '/dʒet/', meaning: 'n. 喷气机；v. 喷出', category: '托福词汇' },
  { word: 'jetlag', phonetic: '/ˈdʒetlæɡ/', meaning: 'n. 时差反应', category: '托福词汇' },
  { word: 'jewel', phonetic: '/ˈdʒuːəl/', meaning: 'n. 宝石', category: '托福词汇' },
  { word: 'jeweler', phonetic: '/ˈdʒuːələr/', meaning: 'n. 珠宝商', category: '托福词汇' },
  { word: 'jewelry', phonetic: '/ˈdʒuːəlri/', meaning: 'n. 珠宝', category: '托福词汇' },
  { word: 'jibe', phonetic: '/dʒaɪb/', meaning: 'v. 嘲笑；n. 嘲笑', category: 'GRE词汇' },
  { word: 'jigsaw', phonetic: '/ˈdʒɪɡsɔː/', meaning: 'n. 拼图', category: 'GRE词汇' },
  { word: 'jingle', phonetic: '/ˈdʒɪŋɡl/', meaning: 'v. 丁当作响；n. 叮当声', category: 'GRE词汇' },
  { word: 'jinx', phonetic: '/dʒɪŋks/', meaning: 'n. 厄运；v. 使倒霉', category: 'GRE词汇' },
  { word: 'jittery', phonetic: '/ˈdʒɪtəri/', meaning: 'adj. 紧张的', category: 'GRE词汇' },
  { word: 'job', phonetic: '/dʒɒb/', meaning: 'n. 工作', category: '托福词汇' },
  { word: 'jobless', phonetic: '/ˈdʒɒbləs/', meaning: 'adj. 失业的', category: '托福词汇' },
  { word: 'jockey', phonetic: '/ˈdʒɒki/', meaning: 'n. 骑师；v. 欺骗', category: 'GRE词汇' },
  { word: 'jog', phonetic: '/dʒɒɡ/', meaning: 'v. 慢跑；n. 慢跑', category: '托福词汇' },
  { word: 'jogger', phonetic: '/ˈdʒɒɡər/', meaning: 'n. 慢跑者', category: '托福词汇' },
  { word: 'join', phonetic: '/dʒɔɪn/', meaning: 'v. 加入；连接', category: '托福词汇' },
  { word: 'joint', phonetic: '/dʒɔɪnt/', meaning: 'n. 关节；adj. 共同的', category: '托福词汇' },
  { word: 'jointly', phonetic: '/ˈdʒɔɪntli/', meaning: 'adv. 共同地', category: '托福词汇' },
  { word: 'joke', phonetic: '/dʒəʊk/', meaning: 'n. 笑话；v. 开玩笑', category: '托福词汇' },
  { word: 'joker', phonetic: '/ˈdʒəʊkər/', meaning: 'n. 爱开玩笑的人', category: '托福词汇' },
  { word: 'jolly', phonetic: '/ˈdʒɒli/', meaning: 'adj. 快乐的', category: '托福词汇' },
  { word: 'jolt', phonetic: '/dʒəʊlt/', meaning: 'v. 震动；n. 震动', category: 'GRE词汇' },
  { word: 'jostle', phonetic: '/ˈdʒɒsl/', meaning: 'v. 推挤', category: 'GRE词汇' },
  { word: 'jot', phonetic: '/dʒɒt/', meaning: 'v. 匆匆记下', category: 'GRE词汇' },
  { word: 'journal', phonetic: '/ˈdʒɜːnl/', meaning: 'n. 日记；期刊', category: '托福词汇' },
  { word: 'journalism', phonetic: '/ˈdʒɜːnəlɪzəm/', meaning: 'n. 新闻业', category: '托福词汇' },
  { word: 'journalist', phonetic: '/ˈdʒɜːnəlɪst/', meaning: 'n. 新闻记者', category: '托福词汇' },
  { word: 'journey', phonetic: '/ˈdʒɜːni/', meaning: 'n. 旅程；v. 旅行', category: '托福词汇' },
  { word: 'jovial', phonetic: '/ˈdʒəʊviəl/', meaning: 'adj. 快乐的', category: 'GRE词汇' },
  { word: 'jowl', phonetic: '/dʒaʊl/', meaning: 'n. 下巴', category: 'GRE词汇' },
  { word: 'joy', phonetic: '/dʒɔɪ/', meaning: 'n. 喜悦', category: '托福词汇' },
  { word: 'joyful', phonetic: '/ˈdʒɔɪfl/', meaning: 'adj. 欢喜的', category: '托福词汇' },
  { word: 'joyous', phonetic: '/ˈdʒɔɪəs/', meaning: 'adj. 快乐的', category: 'GRE词汇' },
  { word: 'jubilant', phonetic: '/ˈdʒuːbɪlənt/', meaning: 'adj. 欢呼的', category: 'GRE词汇' },
  { word: 'jubilee', phonetic: '/ˈdʒuːbɪliː/', meaning: 'n. 周年庆典', category: 'GRE词汇' },
  { word: 'judgement', phonetic: '/ˈdʒʌdʒmənt/', meaning: 'n. 判断；判决', category: '托福词汇' },
  { word: 'judge', phonetic: '/dʒʌdʒ/', meaning: 'n. 法官；v. 判断', category: '托福词汇' },
  { word: 'judicial', phonetic: '/dʒuːˈdɪʃl/', meaning: 'adj. 司法的', category: '法律词汇' },
  { word: 'judiciary', phonetic: '/dʒuːˈdɪʃiəri/', meaning: 'n. 司法部门', category: '法律词汇' },
  { word: 'judicious', phonetic: '/dʒuːˈdɪʃəs/', meaning: 'adj. 明智的', category: 'GRE词汇' },
  { word: 'judo', phonetic: '/ˈdʒuːdəʊ/', meaning: 'n. 柔道', category: '托福词汇' },
  { word: 'jug', phonetic: '/dʒʌɡ/', meaning: 'n. 罐', category: '托福词汇' },
  { word: 'juggle', phonetic: '/ˈdʒʌɡl/', meaning: 'v. 玩杂耍；n. 杂耍', category: '托福词汇' },
  { word: 'jugular', phonetic: '/ˈdʒʌɡjələr/', meaning: 'adj. 颈的；n. 颈静脉', category: '医学词汇' },
  { word: 'juice', phonetic: '/dʒuːs/', meaning: 'n. 果汁', category: '托福词汇' },
  { word: 'juicy', phonetic: '/ˈdʒuːsi/', meaning: 'adj. 多汁的', category: '托福词汇' },
  { word: 'jujitsu', phonetic: '/dʒuːˈdʒɪtsuː/', meaning: 'n. 柔术', category: 'GRE词汇' },
  { word: 'jumble', phonetic: '/ˈdʒʌmbl/', meaning: 'v. 混杂；n. 杂乱', category: 'GRE词汇' },
  { word: 'jump', phonetic: '/dʒʌmp/', meaning: 'v. 跳跃；n. 跳跃', category: '托福词汇' },
  { word: 'jumper', phonetic: '/ˈdʒʌmpər/', meaning: 'n. 跳跃者；毛衣', category: '托福词汇' },
  { word: 'junction', phonetic: '/ˈdʒʌŋkʃn/', meaning: 'n. 连接点；交叉口', category: '托福词汇' },
  { word: 'juncture', phonetic: '/ˈdʒʌŋktʃər/', meaning: 'n. 时刻；连接点', category: 'GRE词汇' },
  { word: 'jungle', phonetic: '/ˈdʒʌŋɡl/', meaning: 'n. 丛林', category: '托福词汇' },
  { word: 'junior', phonetic: '/ˈdʒuːniər/', meaning: 'adj. 年幼的；n. 年少者', category: '托福词汇' },
  { word: 'juniper', phonetic: '/ˈdʒuːnɪpər/', meaning: 'n. 杜松', category: 'GRE词汇' },
  { word: 'junk', phonetic: '/dʒʌŋk/', meaning: 'n. 垃圾；v. 丢弃', category: '托福词汇' },
  { word: 'junker', phonetic: '/ˈdʒʌŋkər/', meaning: 'n. 破旧的东西', category: 'GRE词汇' },
  { word: 'junket', phonetic: '/ˈdʒʌŋkɪt/', meaning: 'n. 公费旅游', category: 'GRE词汇' },
  { word: 'junky', phonetic: '/ˈdʒʌŋki/', meaning: 'n. 吸毒者；adj. 廉价的', category: 'GRE词汇' },
  { word: 'jurisdiction', phonetic: '/ˌdʒʊərɪsˈdɪkʃn/', meaning: 'n. 管辖权', category: '法律词汇' },
  { word: 'juror', phonetic: '/ˈdʒʊərər/', meaning: 'n. 陪审员', category: '法律词汇' },
  { word: 'jury', phonetic: '/ˈdʒʊəri/', meaning: 'n. 陪审团', category: '法律词汇' },
  { word: 'just', phonetic: '/dʒʌst/', meaning: 'adj. 公正的；adv. 刚刚', category: '托福词汇' },
  { word: 'justice', phonetic: '/ˈdʒʌstɪs/', meaning: 'n. 正义；法官', category: '托福词汇' },
  { word: 'justifiable', phonetic: '/ˌdʒʌstɪˈfaɪəbl/', meaning: 'adj. 有正当理由的', category: 'GRE词汇' },
  { word: 'justification', phonetic: '/ˌdʒʌstɪfɪˈkeɪʃn/', meaning: 'n. 正当理由', category: '托福词汇' },
  { word: 'justify', phonetic: '/ˈdʒʌstɪfaɪ/', meaning: 'v. 辩解；证明正当', category: '托福词汇' },
  { word: 'justly', phonetic: '/ˈdʒʌstli/', meaning: 'adv. 公正地', category: '托福词汇' },
  { word: 'justness', phonetic: '/ˈdʒʌstnəs/', meaning: 'n. 公正', category: 'GRE词汇' },
  { word: 'jut', phonetic: '/dʒʌt/', meaning: 'v. 突出', category: 'GRE词汇' },
  { word: 'juvenile', phonetic: '/ˈdʒuːvənaɪl/', meaning: 'adj. 青少年的；n. 青少年', category: '托福词汇' },
  { word: 'juxtapose', phonetic: '/ˌdʒʌkstəˈpəʊz/', meaning: 'v. 并列', category: 'GRE词汇' },
  { word: 'juxtaposition', phonetic: '/ˌdʒʌkstəpəˈzɪʃn/', meaning: 'n. 并列', category: 'GRE词汇' },

  // K字母开头
  { word: 'keel', phonetic: '/kiːl/', meaning: 'n. 龙骨；v. 翻转', category: 'GRE词汇' },
  { word: 'keen', phonetic: '/kiːn/', meaning: 'adj. 敏锐的；热切的', category: '托福词汇' },
  { word: 'keenly', phonetic: '/ˈkiːnli/', meaning: 'adv. 敏锐地', category: '托福词汇' },
  { word: 'keep', phonetic: '/kiːp/', meaning: 'v. 保持', category: '托福词汇' },
  { word: 'keeper', phonetic: '/ˈkiːpər/', meaning: 'n. 看守人', category: '托福词汇' },
  { word: 'keg', phonetic: '/keɡ/', meaning: 'n. 小桶', category: 'GRE词汇' },
  { word: 'kelp', phonetic: '/kelp/', meaning: 'n. 海带', category: 'GRE词汇' },
  { word: 'kennel', phonetic: '/ˈkenl/', meaning: 'n. 狗窝', category: '托福词汇' },
  { word: 'kernel', phonetic: '/ˈkɜːnl/', meaning: 'n. 核心；仁', category: '托福词汇' },
  { word: 'kerosene', phonetic: '/ˈkerəsiːn/', meaning: 'n. 煤油', category: '科技词汇' },
  { word: 'kettle', phonetic: '/ˈketl/', meaning: 'n. 水壶', category: '托福词汇' },
  { word: 'key', phonetic: '/kiː/', meaning: 'n. 钥匙；关键', category: '托福词汇' },
  { word: 'keyboard', phonetic: '/ˈkiːbɔːd/', meaning: 'n. 键盘', category: '托福词汇' },
  { word: 'keyhole', phonetic: '/ˈkiːhəʊl/', meaning: 'n. 锁孔', category: '托福词汇' },
  { word: 'keynote', phonetic: '/ˈkiːnəʊt/', meaning: 'n. 主旨；基调', category: 'GRE词汇' },
  { word: 'keystone', phonetic: '/ˈkiːstəʊn/', meaning: 'n. 基石', category: 'GRE词汇' },
  { word: 'keyword', phonetic: '/ˈkiːwɜːd/', meaning: 'n. 关键词', category: '托福词汇' },
  { word: 'kick', phonetic: '/kɪk/', meaning: 'v. 踢；n. 踢', category: '托福词汇' },
  { word: 'kid', phonetic: '/kɪd/', meaning: 'n. 小孩；v. 开玩笑', category: '托福词汇' },
  { word: 'kidnap', phonetic: '/ˈkɪdnæp/', meaning: 'v. 绑架', category: '法律词汇' },
  { word: 'kidney', phonetic: '/ˈkɪdni/', meaning: 'n. 肾脏', category: '医学词汇' },
  { word: 'kill', phonetic: '/kɪl/', meaning: 'v. 杀死', category: '托福词汇' },
  { word: 'killer', phonetic: '/ˈkɪlər/', meaning: 'n. 杀手', category: '托福词汇' },
  { word: 'kilogram', phonetic: '/ˈkɪləɡræm/', meaning: 'n. 千克', category: '托福词汇' },
  { word: 'kilometer', phonetic: '/ˈkɪləmiːtər/', meaning: 'n. 千米', category: '托福词汇' },
  { word: 'kilowatt', phonetic: '/ˈkɪləwɒt/', meaning: 'n. 千瓦', category: '科技词汇' },
  { word: 'kilt', phonetic: '/kɪlt/', meaning: 'n. 苏格兰短裙', category: 'GRE词汇' },
  { word: 'kin', phonetic: '/kɪn/', meaning: 'n. 亲戚', category: 'GRE词汇' },
  { word: 'kind', phonetic: '/kaɪnd/', meaning: 'n. 种类；adj. 善良的', category: '托福词汇' },
  { word: 'kindle', phonetic: '/ˈkɪndl/', meaning: 'v. 点燃；激起', category: 'GRE词汇' },
  { word: 'kindliness', phonetic: '/ˈkaɪndlɪnəs/', meaning: 'n. 亲切', category: 'GRE词汇' },
  { word: 'kindly', phonetic: '/ˈkaɪndli/', meaning: 'adv. 和蔼地', category: '托福词汇' },
  { word: 'kindness', phonetic: '/ˈkaɪndnəs/', meaning: 'n. 善良', category: '托福词汇' },
  { word: 'kindred', phonetic: '/ˈkɪndrəd/', meaning: 'n. 亲戚；adj. 同类的', category: 'GRE词汇' },
  { word: 'kinetic', phonetic: '/kɪˈnetɪk/', meaning: 'adj. 运动的', category: '科技词汇' },
  { word: 'kinetics', phonetic: '/kɪˈnetɪks/', meaning: 'n. 动力学', category: '科技词汇' },
  { word: 'kinship', phonetic: '/ˈkɪnʃɪp/', meaning: 'n. 亲属关系', category: '托福词汇' },
  { word: 'kinsman', phonetic: '/ˈkɪnzmən/', meaning: 'n. 男性亲属', category: 'GRE词汇' },
  { word: 'kiosk', phonetic: '/ˈkiːɒsk/', meaning: 'n. 售货亭', category: '托福词汇' },
  { word: 'kiss', phonetic: '/kɪs/', meaning: 'v. 吻；n. 吻', category: '托福词汇' },
  { word: 'kit', phonetic: '/kɪt/', meaning: 'n. 工具箱', category: '托福词汇' },
  { word: 'kitchen', phonetic: '/ˈkɪtʃɪn/', meaning: 'n. 厨房', category: '托福词汇' },
  { word: 'kite', phonetic: '/kaɪt/', meaning: 'n. 风筝', category: '托福词汇' },
  { word: 'kitten', phonetic: '/ˈkɪtn/', meaning: 'n. 小猫', category: '托福词汇' },
  { word: 'kitty', phonetic: '/ˈkɪti/', meaning: 'n. 小猫；凑集的钱', category: '托福词汇' },
  { word: 'knack', phonetic: '/næk/', meaning: 'n. 诀窍', category: 'GRE词汇' },
  { word: 'knapsack', phonetic: '/ˈnæpsæk/', meaning: 'n. 背包', category: 'GRE词汇' },
  { word: 'knave', phonetic: '/neɪv/', meaning: 'n. 无赖', category: 'GRE词汇' },
  { word: 'knead', phonetic: '/niːd/', meaning: 'v. 揉捏', category: 'GRE词汇' },
  { word: 'knee', phonetic: '/niː/', meaning: 'n. 膝盖', category: '托福词汇' },
  { word: 'kneel', phonetic: '/niːl/', meaning: 'v. 跪下', category: '托福词汇' },
  { word: 'knickers', phonetic: '/ˈnɪkərz/', meaning: 'n. 灯笼裤', category: 'GRE词汇' },
  { word: 'knife', phonetic: '/naɪf/', meaning: 'n. 刀', category: '托福词汇' },
  { word: 'knight', phonetic: '/naɪt/', meaning: 'n. 骑士', category: '托福词汇' },
  { word: 'knit', phonetic: '/nɪt/', meaning: 'v. 编织', category: '托福词汇' },
  { word: 'knob', phonetic: '/nɒb/', meaning: 'n. 把手；旋钮', category: '托福词汇' },
  { word: 'knock', phonetic: '/nɒk/', meaning: 'v. 敲；n. 敲击', category: '托福词汇' },
  { word: 'knocker', phonetic: '/ˈnɒkər/', meaning: 'n. 门环', category: 'GRE词汇' },
  { word: 'knoll', phonetic: '/nəʊl/', meaning: 'n. 小山', category: 'GRE词汇' },
  { word: 'knot', phonetic: '/nɒt/', meaning: 'n. 结；v. 打结', category: '托福词汇' },
  { word: 'knotty', phonetic: '/ˈnɒti/', meaning: 'adj. 多结的；棘手的', category: 'GRE词汇' },
  { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', meaning: 'n. 知识', category: '托福词汇' },
  { word: 'knowledgeable', phonetic: '/ˈnɒlɪdʒəbl/', meaning: 'adj. 知识渊博的', category: '托福词汇' },
  { word: 'known', phonetic: '/nəʊn/', meaning: 'adj. 已知的', category: '托福词汇' },
  { word: 'knuckle', phonetic: '/ˈnʌkl/', meaning: 'n. 指关节', category: 'GRE词汇' },
  { word: 'kudos', phonetic: '/ˈkjuːdɒs/', meaning: 'n. 荣誉', category: 'GRE词汇' },
];

async function getCategoryIds(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('vocabulary_categories')
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

async function insertWords(words: typeof wordsJK, categoryIds: Map<string, number>, existingSet: Set<string>): Promise<number> {
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
    const word = w.word.toLowerCase().trim();
    if (!word || !w.meaning || existingSet.has(word)) continue;
    
    records.push({
      word,
      phonetic: w.phonetic || '',
      meaning: w.meaning.trim(),
      example_sentence: `This is an example using the word "${w.word}".`,
      category_id: categoryIds.get(w.category) || defaultCategoryId,
    });
    existingSet.add(word);
  }
  
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(WORDS_TABLE).insert(batch);
    if (!error) {
      inserted += batch.length;
      console.log(`已插入 ${inserted}/${records.length} 个单词`);
    }
  }
  
  return inserted;
}

async function getCurrentCount(): Promise<number> {
  const { count } = await supabase
    .from(WORDS_TABLE)
    .select('*', { count: 'exact', head: true });
  return count || 0;
}

async function main() {
  console.log('=== 开始导入 J-K 字母开头的单词 ===');
  console.log(`预定义单词数量: ${wordsJK.length}`);
  
  const categoryIds = await getCategoryIds();
  const existingSet = await getExistingWords();
  console.log(`已存在单词: ${existingSet.size} 个`);
  
  const inserted = await insertWords(wordsJK, categoryIds, existingSet);
  
  console.log(`\n=== 导入完成 ===`);
  console.log(`本次导入: ${inserted} 个单词`);
  console.log(`总单词数: ${await getCurrentCount()} 个`);
}

main().catch(console.error);
