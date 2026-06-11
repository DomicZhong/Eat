/**
 * 随机决策器 (The Decider) — 核心功能组件
 *
 * UI 结构:
 * - 纪念日倒计时
 * - 结果展示区 + 重抽/复制按钮
 * - 4 个分类按钮 (2x2 Grid)
 * - 全局随机按钮
 *
 * 特性: 7天历史防重复提示、快速重抽(排除当前)、一键复制、纪念日计数
 */
import { options, randomPick, categoryEmoji } from "../utils/helpers.js";
import { record, checkRecent } from "../utils/history.js";

/** 在一起的日子（零点开始） */
const ANNIVERSARY = new Date("2023-10-08T01:03:02");

/** 主分类配置 */
const CATEGORIES = [
  { key: "food", label: "吃什么", emoji: "🍽️", color: "btn-rose" },
  { key: "activity", label: "做什么", emoji: "🎯", color: "btn-emerald" },
  { key: "reward", label: "奖励", emoji: "🎁", color: "btn-emerald" },
  { key: "relationship", label: "情感", emoji: "💝", color: "btn-rose" },
];

/** 私密奖励（不参与 Random All） */
const PRIVATE_CATEGORY = { key: "private", label: "私密", emoji: "🔥", color: "btn-violet" };

/** 当前展示的结果状态（用于重抽和复制） */
let currentResult = { text: "", category: null, value: null };

/**
 * 计算在一起的时间（天 + HH:MM:SS），营造时间流动感
 * @returns {{ days: number, time: string }} 如 { days: 976, time: "14:32:07" }
 */
const sinceTogether = () => {
  const diff = Date.now() - ANNIVERSARY.getTime();
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const remain = totalSec % 86400;
  const h = Math.floor(remain / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  return { days, time: `${h}时${m}分${s}秒` };
};

/** 计时器 ID，用于销毁 */
let tickTimer = null;

/**
 * 构建 Decider 组件的 HTML 结构
 * @returns {string}
 */
const html = () => `
  <div class="page-enter">
    <!-- 纪念日倒计时（单行，天数 + 时:分:秒 流动） -->
    <div class="mb-6 flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm">
      <span>💕</span>
      <span class="text-slate-400">在一起</span>
      <span id="days-counter" class="font-bold min-w-[9ch] text-center bg-gradient-to-r from-emerald-400 to-rose-400 bg-clip-text text-transparent tabular-nums">${sinceTogether().days} 天 ${sinceTogether().time}</span>
      <span class="text-slate-600">·</span>
      <span class="text-slate-500 text-xs">始于2023.10.8</span>
    </div>

    <h1 class="text-2xl font-bold text-center mb-6 tracking-wide">
      🎲 <span class="text-emerald-400">Us</span><span class="text-rose-400">Time</span>
    </h1>

    <!-- 结果展示区 -->
    <div id="decider-result" class="mb-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center min-h-[130px] flex flex-col items-center justify-center">
      <p id="decider-result-text" class="text-xl leading-relaxed text-slate-200">
        点击下方按钮开始随机决策 🎯
      </p>
      <p id="decider-result-sub" class="mt-2 text-sm text-slate-500 hidden"></p>
      <p id="decider-result-hint" class="mt-2 text-xs text-amber-400 hidden"></p>
    </div>

    <!-- 结果操作按钮（重抽 + 复制） -->
    <div id="decider-actions" class="mb-6 flex justify-center gap-3 hidden">
      <button id="decider-btn-reroll" class="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">
        🔄 换一个
      </button>
      <button id="decider-btn-copy" class="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">
        📋 复制
      </button>
    </div>

    <!-- 分类按钮 (3+2 布局) -->
    <div class="grid grid-cols-3 gap-3 mb-3">
      ${CATEGORIES.slice(0, 3).map((c) => `
        <button
          id="decider-btn-${c.key}"
          class="${c.color} rounded-xl px-3 py-5 text-base font-semibold shadow-lg active:scale-95 transition-transform"
          data-category="${c.key}"
        >
          ${c.emoji} ${c.label}
        </button>
      `).join("")}
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      ${CATEGORIES.slice(3, 4).map((c) => `
        <button
          id="decider-btn-${c.key}"
          class="${c.color} rounded-xl px-4 py-5 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
          data-category="${c.key}"
        >
          ${c.emoji} ${c.label}
        </button>
      `).join("")}
      <button
        id="decider-btn-private"
        class="btn-violet rounded-xl px-4 py-5 text-lg font-semibold shadow-lg active:scale-95 transition-transform"
      >
        🔥 私密
      </button>
    </div>

    <!-- 全局随机按钮 -->
    <button
      id="decider-btn-all"
      class="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-rose-600 px-6 py-4 text-xl font-bold text-white shadow-lg hover:from-emerald-500 hover:to-rose-500 active:scale-[0.98] transition-all"
    >
      🎲 Random All
    </button>
  </div>
`;

/**
 * 触发结果区弹跳动画
 */
const bounceResult = () => {
  const el = document.getElementById("decider-result");
  if (!el) return;
  el.classList.remove("result-bounce");
  void el.offsetWidth;
  el.classList.add("result-bounce");
};

/**
 * 显示操作按钮（重抽 + 复制）
 */
const showActions = () => {
  const actions = document.getElementById("decider-actions");
  if (actions) actions.classList.remove("hidden");
};

/**
 * 更新结果展示区
 * @param {string} text - 主文本
 * @param {string} [sub] - 副标题
 * @param {string|null} [category] - 类别
 * @param {string|null} [value] - 选中的值
 */
const updateResult = (text, sub = "", category = null, value = null) => {
  const main = document.getElementById("decider-result-text");
  const secondary = document.getElementById("decider-result-sub");
  if (main) main.textContent = text;
  if (secondary) {
    secondary.textContent = sub;
    secondary.classList.toggle("hidden", !sub);
  }
  currentResult = { text, category, value };
  showActions();
  bounceResult();
  if (category && value) showHistoryHint(category, value);
};

/**
 * 从数组中排除某些值后随机选取
 * @param {string[]} arr - 选项数组
 * @param {string[]} exclude - 要排除的值
 * @returns {string}
 */
const randomPickExcluding = (arr, exclude) => {
  const candidates = arr.filter((v) => !exclude.includes(v));
  // 如果全部被排除，回退到全部选项
  const pool = candidates.length > 0 ? candidates : arr;
  return randomPick(pool);
};

/**
 * 分类随机
 * @param {string} category - 类别 key
 */
const handleCategory = (category) => {
  const picked = randomPick(options[category]);
  const emoji = categoryEmoji(category);
  const allCats = [...CATEGORIES, PRIVATE_CATEGORY];
  const label = allCats.find((c) => c.key === category)?.label || category;
  record(category, picked);
  updateResult(`${emoji} ${picked}`, `从「${label}」中随机选中`, category, picked);
};

/**
 * 分类重抽（排除当前值）
 * @param {string} category
 * @param {string} excludeValue
 */
const handleCategoryReroll = (category, excludeValue) => {
  const picked = randomPickExcluding(options[category], [excludeValue]);
  const emoji = categoryEmoji(category);
  const allCats = [...CATEGORIES, PRIVATE_CATEGORY];
  const label = allCats.find((c) => c.key === category)?.label || category;
  record(category, picked);
  updateResult(`${emoji} ${picked}`, `从「${label}」重抽 · 已排除上次结果`, category, picked);
};

/**
 * 全局随机
 */
const handleRandomAll = () => {
  const food = randomPick(options.food);
  const activity = randomPick(options.activity);
  const reward = randomPick(options.reward);
  const relationship = randomPick(options.relationship);
  record("food", food);
  record("activity", activity);
  record("reward", reward);
  record("relationship", relationship);

  const text = `今晚：${food}，之后：${activity}，结束：${reward}。别忘了——${relationship}。`;
  updateResult(text, "一键随机全局决策", "all", null);
};

/**
 * 全局重抽（每个类别排除当前值）
 */
const handleRandomAllReroll = () => {
  // 解析上一次的全局结果，提取各类别的值
  const prev = currentResult.text || "";
  const foodMatch = prev.match(/今晚：(.+?)，之后/);
  const actMatch = prev.match(/之后：(.+?)，结束/);
  const rwdMatch = prev.match(/结束：(.+?)。别忘了/);
  const relMatch = prev.match(/别忘了——(.+?)。?$/);

  const food = randomPickExcluding(options.food, foodMatch ? [foodMatch[1]] : []);
  const activity = randomPickExcluding(options.activity, actMatch ? [actMatch[1]] : []);
  const reward = randomPickExcluding(options.reward, rwdMatch ? [rwdMatch[1]] : []);
  const relationship = randomPickExcluding(options.relationship, relMatch ? [relMatch[1]] : []);
  record("food", food);
  record("activity", activity);
  record("reward", reward);
  record("relationship", relationship);

  const text = `今晚：${food}，之后：${activity}，结束：${reward}。别忘了——${relationship}。`;
  updateResult(text, "重抽 · 已排除上次各选项", "all", null);
};

/**
 * 复制结果到剪贴板
 */
const handleCopy = async () => {
  const text = currentResult.text || "";
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("decider-btn-copy");
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = "✅ 已复制";
      btn.classList.add("text-emerald-400");
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove("text-emerald-400");
      }, 1500);
    }
  } catch {
    // fallback: 选中文本让用户手动复制
    const range = document.createRange();
    const textEl = document.getElementById("decider-result-text");
    if (textEl) {
      range.selectNodeContents(textEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
};

/**
 * 重抽按钮点击处理（根据当前结果类型分发）
 */
const handleReroll = () => {
  if (currentResult.category === "all") {
    handleRandomAllReroll();
  } else if (currentResult.category && currentResult.value) {
    handleCategoryReroll(currentResult.category, currentResult.value);
  }
};

/**
 * 绑定事件监听器
 */
const bindEvents = () => {
  // 主分类按钮
  CATEGORIES.forEach((c) => {
    const btn = document.getElementById(`decider-btn-${c.key}`);
    if (btn) {
      btn.addEventListener("click", () => handleCategory(c.key));
    }
  });

  // 私密奖励按钮
  const btnPrivate = document.getElementById("decider-btn-private");
  if (btnPrivate) {
    btnPrivate.addEventListener("click", () => handleCategory(PRIVATE_CATEGORY.key));
  }

  // 全局随机按钮（不包含私密）
  const btnAll = document.getElementById("decider-btn-all");
  if (btnAll) {
    btnAll.addEventListener("click", handleRandomAll);
  }

  // 重抽按钮
  const btnReroll = document.getElementById("decider-btn-reroll");
  if (btnReroll) {
    btnReroll.addEventListener("click", handleReroll);
  }

  // 复制按钮
  const btnCopy = document.getElementById("decider-btn-copy");
  if (btnCopy) {
    btnCopy.addEventListener("click", handleCopy);
  }
};

/**
 * 启动纪念日计时器（每秒刷新天数 + 时分秒）
 */
const startTicker = () => {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const el = document.getElementById("days-counter");
    if (el) {
      const { days, time } = sinceTogether();
      el.textContent = `${days} 天 ${time}`;
    }
  }, 1000);
};

/**
 * 渲染 Decider 组件到目标容器
 * @param {HTMLElement} container - 挂载目标
 */
export const render = (container) => {
  currentResult = { text: "", category: null, value: null };
  container.innerHTML = html();
  bindEvents();
  startTicker();
};
