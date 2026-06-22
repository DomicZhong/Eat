/**
 * 吃什么 — 美食随机决策数据源
 * 按菜系分类，支持自定义编辑，数据存储在 LocalStorage
 */
import { load, save } from "../store.js";

/** 分类定义 */
export const CATEGORIES = {
  "中式经典": { emoji: "🥡", color: "rose" },
  "港式美食": { emoji: "🍜", color: "amber" },
  "日韩风味": { emoji: "🍣", color: "orange" },
  "东南亚风味": { emoji: "🍲", color: "emerald" },
  "西餐异国": { emoji: "🍝", color: "indigo" },
  "咖啡/茶饮": { emoji: "☕", color: "sky" },
  "轻食/其他": { emoji: "🥗", color: "teal" },
};

/** 默认美食数据 */
const DEFAULT_FOODS = {
  "中式经典": [
    "火锅", "家常菜", "烧烤", "饮茶点心", "麻辣烫", "酸菜鱼", "烤鱼", "小龙虾",
    "串串香", "兰州拉面", "饺子馄饨", "椰子鸡", "猪肚鸡", "北京烤鸭",
    "糖醋里脊", "干锅牛蛙", "螺蛳粉", "重庆小面", "潮汕牛肉火锅",
    "干炒牛河", "避风塘炒蟹", "豉汁蒸排骨", "白切鸡", "红烧乳鸽",
    "梅菜扣肉", "沙姜鸡", "椒盐豆腐", "剁椒鱼头", "毛血旺",
  ],
  "港式美食": [
    "港式茶餐厅", "烧味拼盘", "云吞面", "车仔面", "煲仔饭",
    "港式蛋挞", "菠萝油", "丝袜奶茶", "鸡蛋仔", "咖喱鱼蛋",
    "碗仔翅", "鱼蛋粉", "叉烧饭", "西多士", "烧鹅濑粉",
    "猪扒包", "鸡煲", "煎酿三宝", "杨枝甘露", "红豆冰",
    "冻柠茶", "焗猪扒饭", "沙嗲牛肉面", "餐蛋面", "肠粉",
    "虾饺烧卖", "凤爪排骨", "糯米鸡", "港式西餐", "煲仔菜",
  ],
  "日韩风味": [
    "日料", "韩料", "寿司刺身", "寿喜锅", "部队锅", "韩式烤肉",
    "日式拉面", "石锅拌饭", "章鱼小丸子", "大阪烧", "日式咖喱饭",
    "天妇罗", "铁板烧", "蛋包饭", "亲子丼", "鳗鱼饭", "味噌拉面",
    "炸猪排", "日式放题",
  ],
  "东南亚风味": [
    "海南鸡饭", "肉骨茶", "叻沙", "越南牛肉河粉", "泰式冬阴功",
    "泰式炒金边粉", "印尼炒饭", "炒粿条", "椰浆饭", "芒果糯米饭",
    "越式法包", "沙嗲串烧", "青木瓜沙拉", "泰式咖喱蟹", "马来咖喱",
    "新加坡喇沙", "泰式猪手饭", "印尼巴东牛肉",
  ],
  "西餐异国": [
    "披萨", "牛排", "意面", "汉堡薯条", "墨西哥塔可",
    "印度咖喱", "美式烤肉", "法式可丽饼", "英式炸鱼薯条",
    "葡国菜", "西班牙海鲜饭", "地中海沙拉", "生蚝海鲜盘",
    "德国猪手", "瑞士芝士火锅",
  ],
  "咖啡/茶饮": [
    "咖啡简餐", "手冲咖啡", "精品茶饮", "奶茶果茶", "冰滴咖啡",
  ],
  "轻食/其他": [
    "轻食沙拉", "海鲜大餐", "自助餐", "素食料理", "brunch",
    "下午茶甜品", "夜市小吃", "自己在家做饭", "粥粉面饭",
    "火锅放题", "素食自助餐", "私房菜", "大排档",
  ],
};

const FOODS_KEY = "foods";

/**
 * 获取全部美食数据（优先用户自定义，否则使用默认值）
 * @returns {object} { 分类名: string[] }
 */
export const getAllFoods = function () {
  var saved = load(FOODS_KEY, null);
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    // 合并：确保所有默认分类都存在
    var merged = {};
    var cats = Object.keys(DEFAULT_FOODS);
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      merged[c] = (Array.isArray(saved[c]) && saved[c].length > 0)
        ? saved[c]
        : DEFAULT_FOODS[c].slice();
    }
    return merged;
  }
  // fallback: 深拷贝默认数据
  var fallback = {};
  var keys = Object.keys(DEFAULT_FOODS);
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    fallback[key] = DEFAULT_FOODS[key].slice();
  }
  return fallback;
};

/**
 * 获取指定分类的美食列表
 * @param {string} category - 分类名，"全部" 则返回所有合并
 * @returns {string[]}
 */
export const getFoodsByCategory = function (category) {
  var all = getAllFoods();
  if (category === "全部") {
    var result = [];
    var cats = Object.keys(all);
    for (var i = 0; i < cats.length; i++) {
      result = result.concat(all[cats[i]]);
    }
    return result;
  }
  return all[category] || [];
};

/**
 * 保存全部美食数据
 * @param {object} data - { 分类名: string[] }
 */
export const saveAllFoods = function (data) {
  save(FOODS_KEY, data);
};

// ====================== 餐厅数据 ======================

const RESTAURANTS_KEY = "restaurants";

/** 默认餐厅数据（尖沙咀及周边） */
const DEFAULT_RESTAURANTS = {
  "中式经典": [
    "北京水饺店", "云南铜锅米线", "唐宫小聚", "翡翠拉面小笼包", "上海姥姥",
    "麻辣鱼馆", "权发小厨", "台北栈", "千两",
  ],
  "港式美食": [
    "八月茶室", "澳门茶餐厅", "红茶冰室", "敏华冰厅",
    "澳洲牛奶公司", "兰芳园（重庆大厦）", "华嫂冰室（尖沙咀）","棋哥烧鹅",
    "翠华餐厅（加拿芬道）"
  ],
  "日韩风味": [
    "雪下觅炙", "Terrace in Seaside", "牛角日本烧肉", "852",
    "元气寿司", "寿司郎", "吉野家","温野菜",
    "一兰拉面（棉登径）"
  ],
  "东南亚风味": [
    "芽庄越南料理", "泰斗 Thai Master", "泰厨", "Lady Nara", "金不换"
  ],
  "西餐异国": [
    "Pici","Pizza Express","Pizza Hut","Pizza Maru"
  ],
  "咖啡/茶饮": [
    "吃茶三千", "星巴克", "Pacific Coffee", "Coffee Master", "NOC Coffee","Milksha 迷客夏 (加拿芬道)","HEYTEA 喜茶 (K11 Art Mall)"
  ],
  "轻食/其他":  [
    "CitySuper", "Lady M", "HashTag - B", "Bakehouse"
  ],
};

/**
 * 获取全部餐厅数据（优先用户自定义，否则使用默认值）
 * @returns {object} { 分类名: string[] }
 */
export var getAllRestaurants = function () {
  var saved = load(RESTAURANTS_KEY, null);
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    var merged = {};
    var cats = Object.keys(DEFAULT_RESTAURANTS);
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      merged[c] = (Array.isArray(saved[c]) && saved[c].length > 0)
        ? saved[c]
        : DEFAULT_RESTAURANTS[c].slice();
    }
    return merged;
  }
  var fallback = {};
  var keys = Object.keys(DEFAULT_RESTAURANTS);
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    fallback[key] = DEFAULT_RESTAURANTS[key].slice();
  }
  return fallback;
};

/**
 * 获取指定分类的餐厅列表
 * @param {string} category - 分类名，"全部" 则返回所有合并
 * @returns {string[]}
 */
export var getRestaurantsByCategory = function (category) {
  var all = getAllRestaurants();
  if (category === "全部") {
    var result = [];
    var cats = Object.keys(all);
    for (var i = 0; i < cats.length; i++) {
      result = result.concat(all[cats[i]]);
    }
    return result;
  }
  return all[category] || [];
};

/**
 * 保存全部餐厅数据
 * @param {object} data - { 分类名: string[] }
 */
export var saveAllRestaurants = function (data) {
  save(RESTAURANTS_KEY, data);
};

// ====================== 通用工具 ======================

/**
 * 通用的随机选择函数
 * @param {Array} arr
 * @returns {*} 随机选中的元素
 */
export const randomPick = function (arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};
