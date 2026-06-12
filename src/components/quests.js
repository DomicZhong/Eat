/**
 * 协作清单 (Quest Log) — 类似游戏任务列表
 *
 * 特性:
 * - 任务指派 (ISTP / ISFJ / 一起)
 * - 颜色区分 (emerald=ISTP, rose=ISFJ, amber=一起)
 * - 进度条 + 分人统计
 * - 复选框勾选、单条删除、清除已完成
 */
import { load, save } from "../store.js";

const STORAGE_KEY = "quests";

/**
 * 生成唯一 ID（单调计数器 + 时间戳，避免碰撞）
 * @returns {string}
 */
const uid = () => {
  const counter = load("quests_counter", 0) + 1;
  save("quests_counter", counter);
  return `${Date.now()}-${counter}`;
};

/**
 * 指派配置
 */
const ASSIGNEES = [
  { key: "ISTP", label: "ISTP", bg: "bg-emerald-900/40", text: "text-emerald-400", activeBg: "bg-emerald-600" },
  { key: "ISFJ", label: "ISFJ", bg: "bg-rose-900/40", text: "text-rose-400", activeBg: "bg-rose-600" },
  { key: "both", label: "一起", bg: "bg-amber-900/40", text: "text-amber-400", activeBg: "bg-amber-600" },
];

/** 当前选中的指派 */
let currentAssignee = "both";

/**
 * 构建 Quest Log 组件的 HTML 结构
 * @param {Array<{ id: string, text: string, done: boolean, assignee: string }>} quests
 * @returns {string}
 */
const html = (quests) => {
  const total = quests.length;
  const done = quests.filter((q) => q.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  // 分人统计
  const stats = (key) => {
    const all = quests.filter((q) => q.assignee === key);
    const fin = all.filter((q) => q.done).length;
    return { total: all.length, done: fin };
  };

  return `
    <div class="page-enter">
      <h1 class="text-2xl font-bold text-center mb-6 tracking-wide">
        📋 <span class="text-emerald-400">协作</span>清单
      </h1>

      <!-- 添加区 -->
      <div class="mb-6 space-y-2">
        <div class="flex gap-2">
          <input
            id="quests-input"
            class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
            type="text"
            maxlength="100"
            placeholder="添加一个新任务..."
          />
          <button
            id="quests-btn-add"
            class="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500 active:scale-95 transition-all shrink-0"
          >
            ➕ 添加
          </button>
        </div>
        <!-- 指派选择器 -->
        <div class="flex items-center gap-1">
          <span class="text-xs text-slate-500 mr-1">指派给：</span>
          ${ASSIGNEES.map((a) => `
            <button
              id="quests-assign-${a.key}"
              class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${a.key === currentAssignee ? `${a.activeBg} text-white` : `border border-slate-700 text-slate-400 hover:${a.text}`}"
            >${a.label}</button>
          `).join("")}
        </div>
      </div>

      <!-- 进度条 -->
      <div class="mb-4">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-slate-400">进度</span>
          <span class="text-slate-500">${done} / ${total} (${percent}%)</span>
        </div>
        <div class="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            id="quests-progress-bar"
            class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-rose-500 transition-all duration-300"
            style="width: ${percent}%"
          ></div>
        </div>
        <!-- 分人统计 -->
        ${total > 0 ? `
          <div class="flex gap-3 mt-2 text-xs text-slate-500">
            ${ASSIGNEES.filter((a) => stats(a.key).total > 0).map((a) => {
              const s = stats(a.key);
              const pct = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
              return `<span><span class="${a.text}">${a.label}</span> ${s.done}/${s.total} (${pct}%)</span>`;
            }).join(" · ")}
          </div>
        ` : ""}
      </div>

      <!-- 任务列表 -->
      <ul id="quests-list" class="space-y-2">
        ${quests.length === 0
          ? `<li class="text-center text-slate-500 py-8">还没有任务，来添加一个吧 ✨</li>`
          : quests
              .map((q) => {
                const a = ASSIGNEES.find((a) => a.key === q.assignee) || ASSIGNEES[2];
                return `
            <li
              id="quest-${q.id}"
              class="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 transition-colors ${q.done ? "opacity-50" : ""}"
            >
              <input
                type="checkbox"
                id="quest-cb-${q.id}"
                class="h-5 w-5 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                ${q.done ? "checked" : ""}
              />
              <span class="flex-1 text-slate-200 text-sm ${q.done ? "line-through text-slate-500" : ""}">${escHtml(q.text)}</span>
              <span class="shrink-0 text-xs px-1.5 py-0.5 rounded ${a.bg} ${a.text}">${a.label}</span>
              <button
                id="quest-del-${q.id}"
                class="text-slate-600 hover:text-rose-400 transition-colors text-sm shrink-0"
              >
                ✕
              </button>
            </li>
          `;
              })
              .join("")}
      </ul>

      ${quests.length > 0 ? `
        <div class="mt-4 text-center">
          <button id="quests-btn-clear-done" class="text-sm text-slate-500 hover:text-rose-400 transition-colors">
            清除已完成
          </button>
        </div>
      ` : ""}
    </div>
  `;
};

/**
 * 转义 HTML 特殊字符，防止 XSS
 * @param {string} str
 * @returns {string}
 */
const escHtml = (str) => {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
};

/**
 * 重新渲染整个组件
 * @param {HTMLElement} container
 */
const rerender = (container) => {
  render(container);
};

/**
 * 更新指派选择器样式
 */
const updateAssigneeUI = () => {
  ASSIGNEES.forEach((a) => {
    const btn = document.getElementById(`quests-assign-${a.key}`);
    if (!btn) return;
    if (a.key === currentAssignee) {
      btn.className = `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${a.activeBg} text-white`;
    } else {
      btn.className = `rounded-md px-2.5 py-1 text-xs font-medium transition-colors border border-slate-700 text-slate-400 hover:${a.text}`;
    }
  });
};

/**
 * 绑定事件监听器
 * @param {HTMLElement} container
 */
const bindEvents = (container) => {
  const input = document.getElementById("quests-input");
  const btnAdd = document.getElementById("quests-btn-add");
  const btnClearDone = document.getElementById("quests-btn-clear-done");

  /**
   * 添加新任务（快速连续添加：不清除输入框，保持焦点）
   */
  const addQuest = () => {
    const text = input?.value.trim();
    if (!text) return;

    const quests = load(STORAGE_KEY, []);
    quests.push({ id: uid(), text, done: false, assignee: currentAssignee });
    save(STORAGE_KEY, quests);
    input.value = "";
    input.focus();
    rerender(container);
  };

  // 点击添加
  if (btnAdd) {
    btnAdd.addEventListener("click", addQuest);
  }

  // 回车添加
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addQuest();
    });
  }

  // 指派选择器
  ASSIGNEES.forEach((a) => {
    const btn = document.getElementById(`quests-assign-${a.key}`);
    if (btn) {
      btn.addEventListener("click", () => {
        currentAssignee = a.key;
        updateAssigneeUI();
      });
    }
  });

  // 绑定复选框和删除按钮
  const quests = load(STORAGE_KEY, []);
  quests.forEach((q) => {
    const cb = document.getElementById(`quest-cb-${q.id}`);
    const del = document.getElementById(`quest-del-${q.id}`);

    if (cb) {
      cb.addEventListener("change", () => {
        const quests = load(STORAGE_KEY, []);
        const target = quests.find((item) => item.id === q.id);
        if (target) {
          target.done = cb.checked;
          save(STORAGE_KEY, quests);
          rerender(container);
        }
      });
    }

    if (del) {
      del.addEventListener("click", () => {
        let quests = load(STORAGE_KEY, []);
        quests = quests.filter((item) => item.id !== q.id);
        save(STORAGE_KEY, quests);
        rerender(container);
      });
    }
  });

  // 清除已完成
  if (btnClearDone) {
    btnClearDone.addEventListener("click", () => {
      let quests = load(STORAGE_KEY, []);
      quests = quests.filter((item) => !item.done);
      save(STORAGE_KEY, quests);
      rerender(container);
    });
  }
};

/**
 * 渲染 Quest Log 组件到目标容器
 * @param {HTMLElement} container - 挂载目标
 */
export const render = (container) => {
  currentAssignee = "both";
  const quests = load(STORAGE_KEY, []);
  container.innerHTML = html(quests);
  bindEvents(container);
  return () => {};
};
