/**
 * LocalStorage 统一封装层
 * 提供带命名空间前缀的键值存取，以及 JSON 序列化/反序列化
 */

// 注：前缀 ustime_ 为历史遗留，保持不变以兼容现有用户数据
const PREFIX = "ustime_";

/**
 * 从 LocalStorage 读取并解析 JSON 数据
 * @param {string} key - 存储键名（自动添加 ustime_ 前缀）
 * @param {*} fallback - 键不存在时的默认返回值
 * @returns {*} 解析后的数据，或 fallback
 */
export const load = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * 将数据 JSON 序列化后写入 LocalStorage
 * @param {string} key - 存储键名（自动添加 ustime_ 前缀）
 * @param {*} value - 要存储的值
 */
export const save = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // LocalStorage 满或不可用时静默失败
  }
};

/**
 * 删除指定键
 * @param {string} key - 存储键名（自动添加 ustime_ 前缀）
 */
export const remove = (key) => {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // 静默失败
  }
};
