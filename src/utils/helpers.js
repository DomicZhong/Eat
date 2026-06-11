/**
 * 决策选项数据源
 * 包含四个类别：饮食、活动、奖励、情感话题
 */
export const options = {
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
};

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
 * 从 options 的四个类别中各随机抽取一个，返回组合结果
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
 * @param {string} category - 类别名 (food|activity|reward|relationship)
 * @returns {string} emoji
 */
export const categoryEmoji = (category) => {
  const map = {
    food: "🍽️",
    activity: "🎯",
    reward: "🎁",
    relationship: "💝",
  };
  return map[category] || "✨";
};
