/**
 * Supabase 客户端初始化 & 云端数据同步服务
 * 用于在 Supabase 后端存储用户数据的 JSON 快照，实现多设备同步
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hwmvbqtbcjhpojdfmccv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ld4CYJTzEGIzbFeJnV06wg_B4QhTc7T";

/** 数据表名 */
const TABLE = "user_data";

/** 不需要同步到云端的 localStorage key */
const EXCLUDE_KEYS = new Set([
  "ustime_unlocked",
  "ustime_device_key",
  "ustime_last_sync",
]);

/**
 * 设备标识 key（密码 SHA-256 哈希，与 lock.js 中的 CORRECT_HASH 一致）
 * 硬编码确保上传和下载使用同一个 ID，不依赖 localStorage 状态
 */
const DEVICE_KEY = "a7a07e92f1ef764b6cbb49f0a2fb54eb934c92094e254eda52a8757d1aa6a116";

/** Supabase 客户端实例 */
let client = null;

/**
 * 初始化 Supabase 客户端
 * @returns {object} Supabase client
 */
const getClient = () => {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
};

/**
 * 收集当前所有 LocalStorage 中的数据
 * @returns {object}
 */
const collectLocalData = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("ustime_") && !EXCLUDE_KEYS.has(k)) {
      try {
        data[k] = JSON.parse(localStorage.getItem(k));
      } catch {
        data[k] = localStorage.getItem(k);
      }
    }
  }
  return data;
};

/**
 * 上传数据到 Supabase
 * 将当前所有 LocalStorage 数据打包成 JSON，upsert 到 user_data 表
 * @returns {Promise<{ ok: boolean, error?: string, updatedAt?: string }>}
 */
export const uploadToCloud = async () => {
  try {
    const data = collectLocalData();
    const now = new Date().toISOString();

    const client = getClient();
    const { error } = await client
      .from(TABLE)
      .upsert(
        { id: DEVICE_KEY, payload: data, updated_at: now },
        { onConflict: "id" }
      );

    if (error) return { ok: false, error: error.message };

    // 记录本地同步时间
    localStorage.setItem("ustime_last_sync", now);
    return { ok: true, updatedAt: now };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

/**
 * 获取上次本地同步时间
 * @returns {string|null}
 */
export const getLastSyncTime = () => {
  return localStorage.getItem("ustime_last_sync") || null;
};

/**
 * 从 Supabase 下载数据并写入 LocalStorage
 * @returns {Promise<{ ok: boolean, error?: string, imported?: number }>}
 */
export const downloadFromCloud = async () => {
  try {
    const client = getClient();

    const { data, error } = await client
      .from(TABLE)
      .select("payload, updated_at")
      .eq("id", DEVICE_KEY)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { ok: false, error: "云端暂无数据，请先上传备份" };
      }
      return { ok: false, error: error.message };
    }

    if (!data || !data.payload) {
      return { ok: false, error: "云端数据为空" };
    }

    // 写入 LocalStorage
    let imported = 0;
    const payload = data.payload;
    for (const [k, v] of Object.entries(payload)) {
      if (k.startsWith("ustime_") && !EXCLUDE_KEYS.has(k)) {
        localStorage.setItem(k, JSON.stringify(v));
        imported++;
      }
    }

    return { ok: true, imported, updatedAt: data.updated_at };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

/**
 * 获取云端数据时间戳
 * @returns {Promise<{ ok: boolean, updatedAt?: string, error?: string }>}
 */
export const getCloudInfo = async () => {
  try {
    const client = getClient();

    const { data, error } = await client
      .from(TABLE)
      .select("updated_at")
      .eq("id", DEVICE_KEY)
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, updatedAt: data?.updated_at || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};
