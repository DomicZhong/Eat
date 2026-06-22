/**
 * 决策历史记录模块
 * 记录每次随机决策，支持 7 天内重复检测
 */
import { load, save } from "../store.js";

const HISTORY_KEY = "decision_history";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

/**
 * 添加一条决策记录
 * @param {string} category - 类别 (food|restaurant)
 * @param {string} value - 选中的值
 */
export const record = (category, value) => {
  const history = load(HISTORY_KEY, []);
  // 清理超过 7 天的记录
  const now = Date.now();
  const recent = history.filter((h) => now - h.ts < MAX_AGE_MS);
  recent.push({ category, value, ts: now });
  save(HISTORY_KEY, recent);
};

/**
 * 检查某个选项在最近 7 天内是否已被选过
 * @param {string} category - 类别
 * @param {string} value - 待检查的值
 * @returns {{ count: number, lastDate: string | null }} 最近命中次数和最近一次日期
 */
export const checkRecent = (category, value) => {
  const history = load(HISTORY_KEY, []);
  const now = Date.now();
  const matches = history.filter(
    (h) => h.category === category && h.value === value && now - h.ts < MAX_AGE_MS
  );
  if (matches.length === 0) return { count: 0, lastDate: null };

  const last = matches[matches.length - 1];
  const d = new Date(last.ts);
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
  return { count: matches.length, lastDate: dateStr };
};

/**
 * 获取指定类别最近 7 天选过的所有值（用于重抽时排除）
 * @param {string} category - 类别
 * @returns {string[]} 最近选过的值列表
 */
export const getRecentValues = (category) => {
  const history = load(HISTORY_KEY, []);
  const now = Date.now();
  return history
    .filter((h) => h.category === category && now - h.ts < MAX_AGE_MS)
    .map((h) => h.value);
};

/**
 * 获取完整历史记录（7天内，按时间倒序）
 * @returns {Array<{category: string, value: string, ts: number}>}
 */
export const getHistory = () => {
  const history = load(HISTORY_KEY, []);
  const now = Date.now();
  return history.filter((h) => now - h.ts < MAX_AGE_MS).reverse();
};
