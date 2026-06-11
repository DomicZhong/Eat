/**
 * 随机决策器 (The Decider) — 核心功能组件
 *
 * UI 结构:
 * - 结果展示区 + 重抽/复制按钮
 * - 5 个分类按钮 (3+2 Grid)
 * - 全局随机按钮
 *
 * 特性: 7天历史防重复提示、快速重抽(排除当前)、一键复制
 */
import { options, randomPick, categoryEmoji } from "../utils/helpers.js";
import { record, checkRecent } from "../utils/history.js";

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
let currentResult = { text: "", category: null, value: null, rawText: "", lastAll: null };

/**
 * 构建 Decider 组件的 HTML 结构
 * @returns {string}
 */
const html = () => `
  <div class="page-enter">
    <h1 class="text-2xl font-bold text-center mb-4 tracking-wide">
      🎲 <span class="text-emerald-400">Us</span><span class="text-rose-400">Time</span>
    </h1>

    <!-- 结果展示区（固定最小高度，避免文本长短跳动） -->
    <div id="decider-result" class="mb-4 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-center min-h-[120px] flex flex-col items-center justify-center">
      <p id="decider-result-text" class="text-base leading-relaxed text-slate-200">
        点击下方按钮开始随机决策 🎯
      </p>
      <p id="decider-result-sub" class="mt-1 text-xs text-slate-500 hidden"></p>
      <p id="decider-result-hint" class="mt-1 text-xs text-amber-400 hidden"></p>
    </div>

    <!-- 结果操作按钮（重抽 + 复制） -->
    <div id="decider-actions" class="mb-6 flex justify-center gap-3 hidden">
      <button id="decider-btn-reroll" class="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">
        🔄 换一个
      </button>
      <button id="decider-btn-copy" class="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">
        📋 复制
      </button>
    </div>

    <!-- 分类按钮 (3+2 布局) -->
    <div class="grid grid-cols-3 gap-2 mb-2">
      ${CATEGORIES.slice(0, 3).map((c) => `
        <button
          id="decider-btn-${c.key}"
          class="${c.color} rounded-xl px-2 py-2.5 text-sm font-semibold shadow-lg active:scale-95 transition-transform"
          data-category="${c.key}"
        >
          ${c.emoji} ${c.label}
        </button>
      `).join("")}
    </div>
    <div class="grid grid-cols-2 gap-2 mb-3">
      ${CATEGORIES.slice(3, 4).map((c) => `
        <button
          id="decider-btn-${c.key}"
          class="${c.color} rounded-xl px-3 py-2.5 text-sm font-semibold shadow-lg active:scale-95 transition-transform"
          data-category="${c.key}"
        >
          ${c.emoji} ${c.label}
        </button>
      `).join("")}
      <button
        id="decider-btn-private"
        class="btn-violet rounded-xl px-3 py-2.5 text-sm font-semibold shadow-lg active:scale-95 transition-transform"
      >
        🔥 私密
      </button>
    </div>

    <!-- 全局随机按钮 -->
    <button
      id="decider-btn-all"
      class="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-rose-600 px-4 py-2.5 text-base font-bold text-white shadow-lg hover:from-emerald-500 hover:to-rose-500 active:scale-[0.98] transition-all"
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
 * @param {string} html - 主文本（支持 HTML）
 * @param {string} [sub] - 副标题
 * @param {string|null} [category] - 类别
 * @param {string|null} [value] - 选中的值
 * @param {string} [rawText] - 纯文本版（用于复制）
 */
const updateResult = (html, sub = "", category = null, value = null, rawText = "") => {
  const main = document.getElementById("decider-result-text");
  const secondary = document.getElementById("decider-result-sub");
  if (main) main.innerHTML = html;
  if (secondary) {
    secondary.textContent = sub;
    secondary.classList.toggle("hidden", !sub);
  }
  currentResult = { text: html, category, value, rawText };
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

  const htmlText = `<span>🍽️ ${food}</span><br><span>🎯 ${activity}</span><br><span>🎁 ${reward}</span><br><span>💝 ${relationship}</span>`;
  const plainText = `${food}，${activity}，${reward}，${relationship}`;
  currentResult.lastAll = { food, activity, reward, relationship };
  updateResult(htmlText, "一键随机全局决策", "all", null, plainText);
};

/**
 * 全局重抽（每个类别排除当前值）
 */
const handleRandomAllReroll = () => {
  const last = currentResult.lastAll;
  const food = randomPickExcluding(options.food, last ? [last.food] : []);
  const activity = randomPickExcluding(options.activity, last ? [last.activity] : []);
  const reward = randomPickExcluding(options.reward, last ? [last.reward] : []);
  const relationship = randomPickExcluding(options.relationship, last ? [last.relationship] : []);
  record("food", food);
  record("activity", activity);
  record("reward", reward);
  record("relationship", relationship);

  const htmlText = `<span>🍽️ ${food}</span><br><span>🎯 ${activity}</span><br><span>🎁 ${reward}</span><br><span>💝 ${relationship}</span>`;
  const plainText = `${food}，${activity}，${reward}，${relationship}`;
  currentResult.lastAll = { food, activity, reward, relationship };
  updateResult(htmlText, "重抽 · 已排除上次各选项", "all", null, plainText);
};

/**
 * 复制结果到剪贴板
 */
const handleCopy = async () => {
  const text = currentResult.rawText || currentResult.text || "";
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
 * 渲染 Decider 组件到目标容器
 * @param {HTMLElement} container - 挂载目标
 */
export const render = (container) => {
  currentResult = { text: "", category: null, value: null, rawText: "", lastAll: null };
  container.innerHTML = html();
  bindEvents();
};
