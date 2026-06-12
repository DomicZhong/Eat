/**
 * 数据管理页面 — 查看、编辑、导出、导入、清空所有数据
 *
 * 两大功能区：
 * 1. 决策选项编辑 — 增删改 food/activity/reward/relationship/private 类别下的选项
 * 2. 用户数据管理 — 查看/删除储蓄罐笔记、任务清单、决策历史
 *
 * 支持 JSON 导出/导入备份，以及一键清空（需二次确认）。
 */
import { load, remove, save } from "../store.js";
import { getOptions } from "../utils/helpers.js";
import { getTheme, setTheme, getThemeList } from "../main.js";

/** 决策选项类别配置 */
const OPTION_CATEGORIES = [
  { key: "food", label: "吃什么", icon: "🍽️" },
  { key: "activity", label: "做什么", icon: "🎯" },
  { key: "reward", label: "奖励", icon: "🎁" },
  { key: "relationship", label: "情感", icon: "💝" },
  { key: "private", label: "私密", icon: "🔥" },
];

/** 用户数据键名 */
const DATA_KEYS = [
  { key: "jar_notes", label: "储蓄罐笔记", icon: "🏺" },
  { key: "quests", label: "任务清单", icon: "📋" },
  { key: "decision_history", label: "决策历史", icon: "🎲" },
];

/** 所有需要导出/清空的键 */
const ALL_KEYS = [...DATA_KEYS.map((d) => d.key), "options", "jar_seen", "quests_counter"];

/** 展开状态 */
let expandedKey = null;

/**
 * 转义 HTML 防止 XSS
 * @param {string} str
 * @returns {string}
 */
const escHtml = (str) => {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
};

/**
 * 格式化时间戳
 * @param {number} ts
 * @returns {string}
 */
const formatTime = (ts) => {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * 渲染决策选项编辑区域
 * @returns {string}
 */
const renderOptionSection = () => {
  const opts = getOptions();
  return `
    <div class="mb-6">
      <h2 class="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
        <span class="h-px flex-1 bg-slate-800"></span>
        🎲 决策选项
        <span class="h-px flex-1 bg-slate-800"></span>
      </h2>
      <div class="space-y-3">
        ${OPTION_CATEGORIES.map(({ key, label, icon }) => {
          const items = opts[key] || [];
          return `
          <div>
            <button class="settings-card w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-left hover:border-slate-600 active:scale-[0.99] transition-all" data-key="option-${key}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span>${icon}</span>
                  <span class="text-sm font-semibold text-slate-200">${label}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-slate-400">${items.length} 项</span>
                  <span class="text-xs text-slate-600">${expandedKey === "option-" + key ? "▲" : "▼"}</span>
                </div>
              </div>
            </button>
            <div id="settings-detail-option-${key}" class="${expandedKey === "option-" + key ? "" : "hidden"}">
              ${expandedKey === "option-" + key ? renderOptionDetail(key, items) : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
      <!-- 恢复默认 -->
      <button id="settings-reset-options"
        class="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-amber-700 bg-amber-900/20 px-4 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-900/40 hover:border-amber-600 active:scale-[0.98] transition-all">
        🔄 恢复所有选项为默认值
      </button>
    </div>`;
};

/**
 * 渲染单个决策选项的详情（可编辑列表）
 * @param {string} key
 * @param {string[]} items
 * @returns {string}
 */
const renderOptionDetail = (key, items) => `
  <div class="mt-2 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
    <div class="max-h-72 overflow-y-auto">
      ${items.map((item, i) => `
        <div class="flex items-center gap-2 border-b border-slate-800 px-3 py-2 group">
          <span class="text-xs text-slate-600 w-5 text-right flex-shrink-0">${i + 1}</span>
          <span class="flex-1 text-sm text-slate-300 truncate">${escHtml(item)}</span>
          <div class="flex gap-1 flex-shrink-0">
            <button class="settings-edit-option-btn text-slate-500 hover:text-emerald-400 text-xs px-2 py-1" data-cat="${key}" data-idx="${i}">✎</button>
            <button class="settings-delete-option-btn text-slate-500 hover:text-rose-400 text-xs px-2 py-1" data-cat="${key}" data-idx="${i}">✕</button>
          </div>
        </div>
      `).join("")}
      ${items.length === 0 ? '<div class="px-3 py-6 text-center text-sm text-slate-500">暂无选项，点击下方添加</div>' : ""}
    </div>
    <!-- 添加新选项 -->
    <div class="border-t border-slate-700 p-3">
      <div class="flex gap-2">
        <input type="text" id="settings-new-option-${key}" class="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 placeholder-slate-600" placeholder="输入新选项..." />
        <button class="settings-add-option-btn rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all whitespace-nowrap" data-cat="${key}">+ 添加</button>
      </div>
    </div>
  </div>`;

/**
 * 渲染用户数据区域
 * @param {{ key: string, label: string, icon: string, count: number, size: string }[]} stats
 * @returns {string}
 */
const renderDataSection = (stats) => `
  <div>
    <h2 class="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
      <span class="h-px flex-1 bg-slate-800"></span>
      💾 用户数据
      <span class="h-px flex-1 bg-slate-800"></span>
    </h2>
    <div class="space-y-3">
      ${stats.map(({ key, label, icon, count, size }) => `
        <div>
          <button class="settings-card w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-left hover:border-slate-600 active:scale-[0.99] transition-all" data-key="${key}">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>${icon}</span>
                <span class="text-sm font-semibold text-slate-200">${label}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-400">${count}</span>
                <span class="text-xs text-slate-600">${expandedKey === key ? "▲" : "▼"}</span>
              </div>
            </div>
          </button>
          <div id="settings-detail-${key}" class="${expandedKey === key ? "" : "hidden"}">
            ${expandedKey === key ? renderDataDetail(key) : ""}
          </div>
        </div>
      `).join("")}
    </div>
  </div>`;

/**
 * 渲染用户数据详情
 * @param {string} key
 * @returns {string}
 */
const renderDataDetail = (key) => {
  const data = load(key, []);
  if (!Array.isArray(data) || data.length === 0) {
    return `<div class="mt-2 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center text-sm text-slate-500">暂无数据</div>`;
  }
  const items = key === "decision_history" ? [...data].reverse() : data;
  return `
    <div class="mt-2 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
      <div class="max-h-64 overflow-y-auto">
        ${items.map((item) => renderDataItem(key, item)).join("")}
      </div>
    </div>`;
};

/**
 * 渲染单条用户数据
 * @param {string} key
 * @param {*} item
 * @returns {string}
 */
const renderDataItem = (key, item) => {
  const deleteBtn = (id) => `<button class="settings-delete-btn flex-shrink-0 text-slate-600 hover:text-rose-400 transition-colors text-xs px-1" data-key="${key}" data-id="${escHtml(String(id))}">✕</button>`;

  switch (key) {
    case "jar_notes":
      return `
        <div class="flex items-start justify-between gap-2 border-b border-slate-800 px-3 py-2 text-sm">
          <div class="min-w-0 flex-1">
            <p class="text-slate-300 truncate">${escHtml(item.text)}</p>
            <p class="text-xs text-slate-500 mt-0.5">${item.author === "ISTP" ? "🛠️ ISTP" : "💖 ISFJ"} · ${formatTime(item.ts)}</p>
          </div>
          ${deleteBtn(item.id)}
        </div>`;
    case "quests":
      return `
        <div class="flex items-start justify-between gap-2 border-b border-slate-800 px-3 py-2 text-sm">
          <div class="min-w-0 flex-1">
            <p class="text-slate-300 truncate ${item.done ? "line-through text-slate-500" : ""}">${escHtml(item.text)}</p>
            <p class="text-xs text-slate-500 mt-0.5">${item.assignee === "ISTP" ? "🛠️ ISTP" : item.assignee === "ISFJ" ? "💖 ISFJ" : "🤝 一起"} · ${item.done ? "✅ 已完成" : "⏳ 待办"}</p>
          </div>
          ${deleteBtn(item.id)}
        </div>`;
    case "decision_history":
      return `
        <div class="flex items-start justify-between gap-2 border-b border-slate-800 px-3 py-2 text-sm">
          <div class="min-w-0 flex-1">
            <p class="text-slate-300 truncate"><span class="text-slate-500">[${escHtml(item.category)}]</span> ${escHtml(item.value)}</p>
            <p class="text-xs text-slate-500 mt-0.5">${formatTime(item.ts)}</p>
          </div>
          ${deleteBtn(item.ts)}
        </div>`;
    default:
      return `<div class="border-b border-slate-800 px-3 py-2 text-sm text-slate-400">${escHtml(JSON.stringify(item))}</div>`;
  }
};

/**
 * 构建完整页面 HTML
 * @param {{ key: string, label: string, icon: string, count: number, size: string }[]} stats
 * @returns {string}
 */
const html = (stats) => {
  const currentTheme = getTheme();
  const themes = getThemeList();
  return `
  <div class="page-enter">
    <h1 class="text-2xl font-bold text-center mb-4 tracking-wide">
      ⚙️ <span class="text-emerald-400">数据</span><span class="text-slate-300">管理</span>
    </h1>

    <!-- 主题切换 -->
    <div class="mb-6">
      <h2 class="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
        <span class="h-px flex-1 bg-slate-800"></span>
        🎨 界面主题
        <span class="h-px flex-1 bg-slate-800"></span>
      </h2>
      <div class="grid grid-cols-3 gap-2">
        ${themes.map(({ key, emoji, label }) => `
          <button
            class="settings-theme-btn rounded-xl border px-3 py-3 text-center transition-all active:scale-95 ${key === currentTheme ? 'border-emerald-500 bg-emerald-900/30' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}"
            data-theme="${key}"
          >
            <p class="text-2xl mb-1">${emoji}</p>
            <p class="text-xs font-medium ${key === currentTheme ? 'text-emerald-400' : 'text-slate-400'}">${label}</p>
          </button>
        `).join("")}
      </div>
    </div>

    ${renderOptionSection()}
    ${renderDataSection(stats)}

    <!-- 操作按钮区 -->
    <div class="space-y-3 mt-6">
      <button id="settings-btn-export"
        class="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-600 active:scale-[0.98] transition-all">
        📤 导出备份
      </button>
      <button id="settings-btn-import"
        class="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:border-slate-500 active:scale-[0.98] transition-all">
        📥 导入恢复
      </button>
      <input type="file" id="settings-import-file" accept=".json" class="hidden" />
      <div class="flex items-center gap-3 py-2">
        <span class="flex-1 h-px bg-slate-800"></span>
        <span class="text-xs text-slate-600">危险操作</span>
        <span class="flex-1 h-px bg-slate-800"></span>
      </div>
      <button id="settings-btn-clear"
        class="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-800 bg-rose-900/30 px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-900/50 hover:border-rose-700 active:scale-[0.98] transition-all">
        🗑️ 清空所有数据
      </button>
      <p id="settings-clear-confirm" class="text-center text-xs text-rose-500 hidden">
        再次点击确认清空，此操作不可撤销！
      </p>
    </div>
  </div>
`;};

/**
 * 格式化字节数为可读大小
 * @param {number} bytes
 * @returns {string}
 */
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * 收集用户数据统计
 * @returns {{ key: string, label: string, icon: string, count: number, size: string }[]}
 */
const collectStats = () =>
  DATA_KEYS.map(({ key, label, icon }) => {
    const data = load(key, []);
    const count = Array.isArray(data) ? data.length : 0;
    const raw = localStorage.getItem(`ustime_${key}`) || "";
    const size = formatSize(new Blob([raw]).size);
    return { key, label, icon, count, size };
  });

// ==================== 决策选项编辑操作 ====================

/**
 * 获取用户自定义的选项（仅 LocalStorage 中的）
 * @returns {object}
 */
const getUserOptions = () => load("options", {});

/**
 * 保存用户自定义选项
 * @param {object} opts
 */
const saveUserOptions = (opts) => save("options", opts);

/**
 * 添加一个决策选项
 * @param {string} category
 * @param {string} value
 */
const addOption = (category, value) => {
  if (!value.trim()) return;
  const opts = getUserOptions();
  if (!opts[category]) opts[category] = [...getOptions()[category]];
  opts[category].push(value.trim());
  saveUserOptions(opts);
  refreshPage();
};

/**
 * 删除一个决策选项
 * @param {string} category
 * @param {number} index
 */
const deleteOption = (category, index) => {
  const opts = getUserOptions();
  if (!opts[category]) opts[category] = [...getOptions()[category]];
  opts[category].splice(index, 1);
  saveUserOptions(opts);
  refreshPage();
};

/**
 * 编辑一个决策选项
 * @param {string} category
 * @param {number} index
 * @param {string} newValue
 */
const editOption = (category, index, newValue) => {
  if (!newValue.trim()) return;
  const opts = getUserOptions();
  if (!opts[category]) opts[category] = [...getOptions()[category]];
  opts[category][index] = newValue.trim();
  saveUserOptions(opts);
  refreshPage();
};

/**
 * 恢复所有决策选项为默认值
 */
const resetOptions = () => {
  remove("options");
  refreshPage();
};

// ==================== 用户数据操作 ====================

/**
 * 删除单条用户数据
 * @param {string} key
 * @param {string} id
 */
const deleteItem = (key, id) => {
  const data = load(key, []);
  if (!Array.isArray(data)) return;
  let filtered;
  if (key === "jar_notes" || key === "quests") {
    filtered = data.filter((item) => item.id !== id);
  } else if (key === "decision_history") {
    filtered = data.filter((item) => String(item.ts) !== id);
  } else {
    filtered = data.filter((item) => String(item) !== id);
  }
  save(key, filtered);
  refreshPage();
};

// ==================== 导出 / 导入 / 清空 ====================

const handleExport = () => {
  const data = {};
  ALL_KEYS.forEach((key) => {
    const raw = localStorage.getItem(`ustime_${key}`);
    if (raw !== null) {
      try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
    }
  });
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ustime-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  const btn = document.getElementById("settings-btn-export");
  if (btn) {
    const original = btn.innerHTML;
    btn.innerHTML = "✅ 导出成功";
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  }
};

const handleImport = (file) => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      let imported = 0;
      ALL_KEYS.forEach((key) => {
        if (key in data) {
          localStorage.setItem(`ustime_${key}`, JSON.stringify(data[key]));
          imported++;
        }
      });
      const btn = document.getElementById("settings-btn-import");
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = imported > 0 ? `✅ 已导入 ${imported} 项数据` : "⚠️ 无有效数据";
        setTimeout(() => { btn.innerHTML = original; }, 2000);
      }
      expandedKey = null;
      refreshPage();
    } catch {
      const btn = document.getElementById("settings-btn-import");
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = "❌ 文件格式错误";
        setTimeout(() => { btn.innerHTML = original; }, 2000);
      }
    }
  };
  reader.readAsText(file);
};

let clearConfirmed = false;
const handleClear = () => {
  const confirmEl = document.getElementById("settings-clear-confirm");
  if (!clearConfirmed) {
    clearConfirmed = true;
    if (confirmEl) confirmEl.classList.remove("hidden");
    setTimeout(() => {
      clearConfirmed = false;
      if (confirmEl) confirmEl.classList.add("hidden");
    }, 3000);
    return;
  }
  ALL_KEYS.forEach((key) => remove(key));
  clearConfirmed = false;
  if (confirmEl) confirmEl.classList.add("hidden");
  const btn = document.getElementById("settings-btn-clear");
  if (btn) {
    btn.innerHTML = "✅ 已清空";
    setTimeout(() => { btn.innerHTML = "🗑️ 清空所有数据"; }, 2000);
  }
  // 移除储蓄罐角标
  const navJar = document.getElementById("nav-jar");
  if (navJar) {
    const badge = navJar.querySelector(".nav-badge");
    if (badge) badge.remove();
  }
  expandedKey = null;
  refreshPage();
};

// ==================== 展开/折叠 & 刷新 ====================

const toggleDetail = (key) => {
  expandedKey = expandedKey === key ? null : key;
  refreshPage();
};

const refreshPage = () => {
  const container = document.querySelector("#app");
  if (!container) return;
  const stats = collectStats();
  container.innerHTML = html(stats);
  bindEvents();
};

// ==================== 事件绑定 ====================

const bindEvents = () => {
  // 主题切换
  document.querySelectorAll(".settings-theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      if (theme) {
        setTheme(theme);
        refreshPage();
      }
    });
  });

  // 卡片展开/折叠
  document.querySelectorAll(".settings-card").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.dataset.key;
      if (key) toggleDetail(key);
    });
  });

  // 添加决策选项
  document.querySelectorAll(".settings-add-option-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cat = btn.dataset.cat;
      const input = document.getElementById(`settings-new-option-${cat}`);
      if (cat && input) {
        addOption(cat, input.value);
        input.value = "";
      }
    });
  });

  // 添加选项的输入框回车键
  document.querySelectorAll("[id^='settings-new-option-']").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cat = input.id.replace("settings-new-option-", "");
        addOption(cat, input.value);
        input.value = "";
      }
    });
  });

  // 编辑决策选项 — 切换为内联编辑模式（事件委托在 #app 上）
  // 确认/取消编辑也通过事件委托处理
  // 注意：这些按钮是动态创建的，不能直接用 querySelectorAll 绑定
  const app = document.querySelector("#app");
  if (!app) return;

  // 使用事件委托统一处理所有动态按钮
  if (!app._settingsDelegated) {
    app._settingsDelegated = true;
    app.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;

      // 编辑按钮 — 进入内联编辑模式
      if (target.classList.contains("settings-edit-option-btn")) {
        e.stopPropagation();
        const cat = target.dataset.cat;
        const idx = parseInt(target.dataset.idx, 10);
        const row = target.closest(".flex.items-center");
        const textSpan = row?.querySelector("span.flex-1");
        if (!row || !textSpan || !cat || isNaN(idx)) return;

        const currentVal = textSpan.textContent;
        textSpan.innerHTML = `<input type="text" class="settings-inline-edit w-full rounded border border-emerald-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none" value="${escHtml(currentVal)}" data-cat="${cat}" data-idx="${idx}" />`;
        const input = textSpan.querySelector("input");
        if (input) {
          input.focus();
          input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
              editOption(cat, idx, input.value);
            }
          });
        }

        const actionDiv = row.querySelector(".flex.gap-1.flex-shrink-0, .flex.gap-1");
        if (actionDiv) {
          actionDiv.innerHTML = `
            <button class="settings-confirm-edit text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1" data-cat="${cat}" data-idx="${idx}">✓</button>
            <button class="settings-cancel-edit text-slate-400 hover:text-slate-300 text-xs px-2 py-1">✕</button>
          `;
        }
        return;
      }

      // 确认编辑
      if (target.classList.contains("settings-confirm-edit")) {
        e.stopPropagation();
        const cat = target.dataset.cat;
        const idx = parseInt(target.dataset.idx, 10);
        const input = document.querySelector(`.settings-inline-edit[data-cat="${cat}"][data-idx="${idx}"]`);
        if (input && cat && !isNaN(idx)) {
          editOption(cat, idx, input.value);
        }
        return;
      }

      // 取消编辑
      if (target.classList.contains("settings-cancel-edit")) {
        e.stopPropagation();
        refreshPage();
        return;
      }
    });
  }

  // 删除决策选项
  document.querySelectorAll(".settings-delete-option-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cat = btn.dataset.cat;
      const idx = parseInt(btn.dataset.idx, 10);
      if (cat && !isNaN(idx)) deleteOption(cat, idx);
    });
  });

  // 恢复默认选项
  const btnReset = document.getElementById("settings-reset-options");
  if (btnReset) {
    btnReset.addEventListener("click", (e) => {
      e.stopPropagation();
      resetOptions();
    });
  }

  // 删除用户数据
  document.querySelectorAll(".settings-delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.key;
      const id = btn.dataset.id;
      if (key && id) deleteItem(key, id);
    });
  });

  // 导出
  const btnExport = document.getElementById("settings-btn-export");
  if (btnExport) btnExport.addEventListener("click", handleExport);

  // 导入
  const btnImport = document.getElementById("settings-btn-import");
  const fileInput = document.getElementById("settings-import-file");
  if (btnImport && fileInput) {
    btnImport.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        handleImport(fileInput.files[0]);
        fileInput.value = "";
      }
    });
  }

  // 清空
  const btnClear = document.getElementById("settings-btn-clear");
  if (btnClear) btnClear.addEventListener("click", handleClear);
};

/**
 * 渲染数据管理页面
 * @param {HTMLElement} container
 * @returns {() => void}
 */
export const render = (container) => {
  clearConfirmed = false;
  expandedKey = null;
  const stats = collectStats();
  container.innerHTML = html(stats);
  bindEvents();
  return () => {};
};
