/**
 * 决策选项数据源
 * 包含五个类别：饮食、活动、奖励、情感话题、私密奖励
 * 选项可被用户自定义编辑，编辑后的数据存储在 LocalStorage 中
 */
import { load } from "../store.js";

/** 默认选项（内置数据，作为 fallback） */
const DEFAULT_OPTIONS = {
  food: [
    // 中式经典
    "火锅", "家常菜", "烧烤", "广东早茶", "麻辣烫", "酸菜鱼", "烤鱼", "小龙虾",
    "串串香", "兰州拉面", "饺子馄饨", "椰子鸡", "猪肚鸡", "北京烤鸭",
    "糖醋里脊", "干锅牛蛙", "螺蛳粉", "重庆小面", "潮汕牛肉火锅",
    // 日韩风味
    "日料", "韩料", "寿司刺身", "寿喜锅", "部队锅", "韩式烤肉", "日式拉面",
    "石锅拌饭", "章鱼小丸子", "大阪烧",
    // 西餐 & 异国
    "披萨", "牛排", "意面", "汉堡薯条", "墨西哥塔可", "越南河粉",
    "泰国冬阴功", "印度咖喱", "美式烤肉", "法式可丽饼",
    // 轻食 & 其他
    "轻食沙拉", "茶餐厅", "海鲜大餐", "自助餐", "素食料理",
    "brunch", "下午茶甜品", "夜市小吃", "自己在家做饭",
  ],
  activity: [
    // 宅家温馨
    "看电影", "看油管", "打游戏", "在家做饭", "Github", "做健身操",
    "看恐怖片", "看电影解说", "看纪录片", "写未来愿望清单",
    // 户外探索
    "City Walk", "骑行", "爬山看日出", "野餐", "露营", "逛公园",
    "海边散步", "游泳", "坐观光巴士", "跑步", "快走",
    // 文化体验
    "逛书店", "逛博物馆", "看展览画展", "看话剧音乐剧", "看演出",
    "逛图书馆", "逛古镇", "逛Shopping Mall", "逛花市", "泡咖啡馆",
    // 趣味互动
    "一起大扫除", "逛游乐园", "抓娃娃",
    "逛夜市", "坐摩天轮", "学跳双人舞",
    "泡温泉", "逛菜市场一起买菜", "看烟花",
  ],
  reward: [
    // 按摩放松
    "深情拥抱", "按摩 10 分钟", "按摩 15 分钟", "全身按摩 20 分钟",
    "头皮按摩 10 分钟", "一次泡泡浴体验",
    // 美食投喂
    "零食投喂权", "自制甜点一份", "烛光晚餐一次",
    "剥好水果喂着吃", "深夜泡面服务",
    // 选择权 & 特权
    "线下看电影", "一天国王/女王特权",
    "周末睡懒觉特权",
    // 情感 & 浪漫
    "手写情书一封", "送一束花", "放喜欢的歌", "讲睡前故事",
  ],
  relationship: [
    // 回忆 & 分享
    "一人讲一个笑话,看谁先笑", "回忆2023年的约会", "分享一个童年故事",
    "一起看旧照片", "向对方说一句最想说的话", "说说对方的三个优点",
    "回忆对方让你最感动的一刻",
    "谈谈人生中最大的成就", "分享最近一次尴尬的经历",
    "上次哭是什么时候？",
    // 未来 & 梦想
    "一起规划下次旅行", "讨论未来的家装风格",
    "如果能一起学一项新技能，想学什么？", "列出未来一年的三个共同目标",
    "如果能一起去任何地方旅行，最想去哪？", "讨论理想的退休生活",
    "用'我们'造三个句子", "你心目中完美的一天是什么样的？",
    "有没有一直想做但还没做的事？",
    // 深度连接
    "告诉对方一个你从未说过的欣赏点", "如果有一颗水晶球能看到未来，你最想知道什么？",
    "分享一件需要让对方知道的重要事情", "有没有什么话题你觉得不能开玩笑？",
    "如果可以改变成长中的一件事，会是什么？", "你觉得一段好的关系最重要的是什么？",
    "安静对视两分钟",
  ],
  private: [
    // 语言与调情类
    "耳边轻声低语或赞美", "发送性感语音或私密起床闹钟",
    "解锁特定亲昵称呼，如专属爱称",
    // 视觉与氛围类
    "烛光晚餐 + 对方精心挑选的性感睡衣", "对方为你专属打造的私人舞蹈",
    "共浴特权，允许在洗澡时提供擦背等服务",
    // 亲密接触类
    "浪漫的双人全身精油按摩", "十分钟不限区域的深度法式热吻",
    "在身上特定部位留下草莓印",
    // 升级版身体探索类
    "蒙眼感受对方的身体触觉敏感带", "脚部按摩或足底亲吻",
    "使用羽毛、丝巾或冰块等小道具的感官刺激",
    // 角色扮演与主导权类
    "一日伴侣体验卡，享受对方全天候的服侍",
    "解锁卧室主导权，由你决定今晚的姿势与节奏",
    "警察与犯人、秘书与老板等情景剧体验",
    // 特别专属福利类
    "无套路、无底线的求必应一次",
    "一起观看并讨论一部小众爱情或艺术电影",
    "解锁平时禁止触碰的绝对领域十分钟",
    // 默认精选
    "全身精油按摩 20 分钟", "一起泡个热水澡",
    "由对方主导亲吻 10 分钟", "角色扮演之夜", "穿对方喜欢的衣服",
    "一顿烛光晚餐后自由发挥",
    "在耳边低声说悄悄话 5 分钟", "互相涂抹身体乳",
    "给对方跳一支舞", "浴室共浴时光",
    "只开一盏小灯聊天到深夜", "从背后拥抱亲吻脖颈 5 分钟",
    "玩情侣真心话大冒险", "给对方拍一组私房照",
    "60 秒深情对视后亲吻", "互相用嘴喂水果/巧克力",
    "躺在床上聊聊各自的幻想",
    "给对方手写一封情书然后一起洗澡",
    "今晚一切由 ISTP 主导", "今晚一切由 ISFJ 主导",
  ],
};

const OPTIONS_KEY = "options";

/**
 * 获取当前生效的选项（优先用户自定义，否则使用默认值）
 * @returns {object} 选项对象
 */
export const getOptions = () => {
  const saved = load(OPTIONS_KEY, null);
  if (saved && typeof saved === "object") {
    // 合并：用户自定义的覆盖默认，确保所有类别都存在
    const merged = { ...DEFAULT_OPTIONS };
    for (const key of Object.keys(merged)) {
      if (Array.isArray(saved[key]) && saved[key].length > 0) {
        merged[key] = saved[key];
      }
    }
    return merged;
  }
  return { ...DEFAULT_OPTIONS };
};

/**
 * 决策选项（响应式：优先从 LocalStorage 读取用户自定义数据）
 * 外部读取 options.food / options.activity 等即可
 */
export const options = new Proxy({}, {
  get(_, prop) {
    return getOptions()[prop] || [];
  },
  ownKeys() {
    return Object.keys(getOptions());
  },
  getOwnPropertyDescriptor(_, prop) {
    const opts = getOptions();
    if (prop in opts) {
      return { enumerable: true, configurable: true };
    }
    return undefined;
  },
});

/**
 * 通用的随机选择函数，从数组中随机返回一个元素
 * @param {Array} arr - 输入数组
 * @returns {*} 随机选中的元素，若数组为空则返回 undefined
 */
export const randomPick = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Fisher-Yates 洗牌算法，返回一个新数组
 * @param {Array} arr - 输入数组
 * @returns {Array} 打乱顺序后的新数组
 */
export const shuffle = (arr) => {
  if (!Array.isArray(arr)) return [];
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 从 options 的四个主类别中各随机抽取一个，返回组合结果（不含私密）
 * @returns {{ food: string, activity: string, reward: string, relationship: string }}
 */
export const randomAll = () => {
  return {
    food: randomPick(options.food),
    activity: randomPick(options.activity),
    reward: randomPick(options.reward),
    relationship: randomPick(options.relationship),
  };
};

/**
 * 获取指定类别的 emoji 图标
 * @param {string} category - 类别名
 * @returns {string} emoji
 */
/** 纪念日存储 key */
const ANNIVERSARY_KEY = "anniversaries";

/** 默认纪念日 */
const DEFAULT_ANNIVERSARIES = [
  { id: "1", name: "在一起", date: "2023-10-08T01:03:02" },
];

/**
 * 获取所有纪念日列表
 * @returns {Array<{ id: string, name: string, date: string }>}
 */
export const getAnniversaries = () => {
  const saved = load(ANNIVERSARY_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) return saved;
  return [...DEFAULT_ANNIVERSARIES];
};

/**
 * 计算从某个日期到现在的时间
 * @param {string} dateStr - ISO 日期字符串 "2023-10-08T01:03:02"
 * @returns {{ days: number, time: string }}
 */
export const sinceDate = (dateStr) => {
  const start = new Date(dateStr).getTime();
  const diff = Date.now() - start;
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const remain = totalSec % 86400;
  const h = Math.floor(remain / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  return { days, time: `${h}时${m}分${s}秒` };
};

/**
 * 计算在一起的时间（默认取第一个纪念日）
 * @returns {{ days: number, time: string }}
 */
export const sinceTogether = () => {
  const anniversaries = getAnniversaries();
  const main = anniversaries[0] || DEFAULT_ANNIVERSARIES[0];
  return sinceDate(main.date);
};

/**
 * 格式化日期为展示文本
 * @param {string} dateStr
 * @returns {string} "2023.10.08"
 */
export const formatAnniversaryDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * 格式化日期为详细展示
 * @param {string} dateStr
 * @returns {string} "2023.10.08 凌晨 01:03:02"
 */
export const formatAnniversaryDateFull = (dateStr) => {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${date} ${time}`;
};

/**
 * 特殊天数配置（天数 → 提示文案 + emoji）
 */
const SPECIAL_DAYS = {
  100: { emoji: "💯", text: "100 天啦！" },
  200: { emoji: "💕", text: "200 天，越来越懂彼此" },
  300: { emoji: "🌟", text: "300 天的默契与陪伴" },
  365: { emoji: "🎂", text: "一周年！365 天快乐" },
  400: { emoji: "💖", text: "400 天，爱意更浓" },
  500: { emoji: "🔥", text: "500 天！热恋如初" },
  520: { emoji: "💝", text: "520 天！我爱你" },
  600: { emoji: "✨", text: "600 天，每一天都是礼物" },
  666: { emoji: "😈", text: "666 天，一切都超顺！" },
  700: { emoji: "💫", text: "700 天，依然心动" },
  730: { emoji: "🌹", text: "两周年！730 天快乐" },
  800: { emoji: "💎", text: "800 天，坚如磐石" },
  888: { emoji: "🧧", text: "888 天，发发发！" },
  900: { emoji: "🎯", text: "900 天，长长久久" },
  978: { emoji: "👑", text: "978 天，久栖吧" },
  999: { emoji: "👑", text: "999 天，天长地久" },
  1000: { emoji: "🏆", text: "1000 天！里程碑达成" },
  1095: { emoji: "🎉", text: "三周年！1095 天" },
  1314: { emoji: "💍", text: "1314 天，一生一世" },
};

/**
 * 检查今天是否为特殊纪念日（取第一个纪念日的天数）
 * @returns {{ emoji: string, text: string } | null} 特殊天数信息，或 null
 */
export const getSpecialDay = () => {
  const { days } = sinceTogether();
  return SPECIAL_DAYS[days] || null;
};

export const categoryEmoji = (category) => {
  const map = {
    food: "🍽️",
    activity: "🎯",
    reward: "🎁",
    relationship: "💝",
    private: "🔥",
  };
  return map[category] || "✨";
};

// ==================== 旅行数据 ====================

/** 旅行数据存储 key */
const TRAVELS_KEY = "travels";

/** 默认旅行数据 */
const DEFAULT_TRAVELS = [
  { id: "1",  city: "香港",     date: "2023-08-20", lat: 22.3193,  lng: 114.1694 },
  { id: "2",  city: "深圳",     date: "2023-09-24", lat: 22.5431,  lng: 114.0579 },
  { id: "3",  city: "广州",     date: "2023-10-07", lat: 23.1291,  lng: 113.2644 },
  { id: "4",  city: "潮州",     date: "2023-10-22", lat: 23.6568,  lng: 116.6226 },
  { id: "5",  city: "汕头",     date: "2023-10-22", lat: 23.3540,  lng: 116.6820 },
  { id: "6",  city: "赣州",     date: "2023-12-22", lat: 25.8310,  lng: 114.9350 },
  { id: "7",  city: "瑞金",     date: "2023-12-23", lat: 25.8856,  lng: 116.0271 },
  { id: "8",  city: "丹阳",     date: "2023-12-26", lat: 31.9998,  lng: 119.6065 },
  { id: "9",  city: "常州",     date: "2023-12-28", lat: 31.8107,  lng: 119.9741 },
  { id: "10", city: "苏州",     date: "2023-12-28", lat: 31.2990,  lng: 120.5853 },
  { id: "11", city: "福州",     date: "2023-12-29", lat: 26.0745,  lng: 119.2965 },
  { id: "12", city: "清远",     date: "2024-01-06", lat: 23.6820,  lng: 113.0560 },
  { id: "13", city: "泰国·曼谷", date: "2024-03-01", lat: 13.7563,  lng: 100.5018, flag: "🇹🇭" },
  { id: "14", city: "铜仁",     date: "2024-07-27", lat: 27.6907,  lng: 109.1809 },
  { id: "15", city: "遵义",     date: "2024-07-28", lat: 27.7214,  lng: 106.9270 },
  { id: "16", city: "六盘水",   date: "2024-07-30", lat: 26.5934,  lng: 104.8302 },
  { id: "17", city: "沈阳",     date: "2024-12-21", lat: 41.8057,  lng: 123.4315 },
  { id: "18", city: "哈尔滨",   date: "2024-12-23", lat: 45.8038,  lng: 126.5345 },
  { id: "19", city: "长春",     date: "2024-12-26", lat: 43.8171,  lng: 125.3235 },
  { id: "20", city: "长白山",   date: "2024-12-27", lat: 42.0078,  lng: 128.0563 },
  { id: "21", city: "武汉",     date: "2025-04-18", lat: 30.5928,  lng: 114.3055 },
  { id: "22", city: "丹阳",     date: "2025-04-18", lat: 31.9998,  lng: 119.6065 },
  { id: "23", city: "无锡",     date: "2025-04-20", lat: 31.4912,  lng: 120.3119 },
  { id: "24", city: "扬州",     date: "2025-04-21", lat: 32.3946,  lng: 119.4129 },
  { id: "25", city: "惠州",     date: "2025-07-01", lat: 23.1118,  lng: 114.4168 },
  { id: "26", city: "澳门",     date: "2025-11-30", lat: 22.1987,  lng: 113.5439 },
  { id: "27", city: "上海",     date: "2025-12-24", lat: 31.2304,  lng: 121.4737 },
  { id: "28", city: "黄山",     date: "2025-12-28", lat: 30.0734,  lng: 118.1662 },
  { id: "29", city: "泉州",     date: "2026-04-03", lat: 24.8748,  lng: 118.6759 },
  { id: "30", city: "漳州",     date: "2026-04-06", lat: 24.5132,  lng: 117.6474 },
];

/**
 * 获取旅行数据（优先用户自定义，否则使用默认值）
 * @returns {Array}
 */
export const getTravels = () => {
  const saved = load(TRAVELS_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) return saved;
  return [...DEFAULT_TRAVELS];
};
