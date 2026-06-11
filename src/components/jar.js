/**
 * 默契储蓄罐 (Memory Jar) — 文字存入 LocalStorage，点击随机读取一条
 *
 * 特性:
 * - 作者标记 (ISTP / ISFJ)
 * - 不重复抽取（全部抽完自动重置）
 * - 单条删除 & 时间戳
 * - 抽取动画可重播
 */
import { load, save } from "../store.js";
import { randomPick } from "../utils/helpers.js";

const STORAGE_KEY = "jar_notes";
const SEEN_KEY = "jar_seen";

/**
 * 生成唯一 ID
 * @returns {string}
 */
const uid = () => crypto.randomUUID();

/**
 * 格式化时间戳为可读日期
 * @param {number} ts - 时间戳
 * @returns {string}
 */
const fmtTime = (ts) => {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * 转义 HTML 特殊字符
 * @param {string} str
 * @returns {string}
 */
const escHtml = (str) => {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
};

/**
 * 构建 Memory Jar 组件的 HTML 结构
 * @param {Array<{ id: string, text: string, author: string, ts: number }>} notes
 * @param {number} unseenCount - 未抽取数量
 * @returns {string}
 */
const html = (notes, unseenCount) => `
  <div class="page-enter">
    <h1 class="text-2xl font-bold text-center mb-6 tracking-wide">
      🏺 <span class="text-rose-400">默契</span>储蓄罐
    </h1>

    <!-- 输入区 -->
    <div class="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <textarea
        id="jar-input"
        class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-slate-500 transition-colors"
        rows="3"
        maxlength="280"
        placeholder="写下此刻想说的话、一个小愿望、或给对方的一条小秘密..."
      ></textarea>
      <div class="mt-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span id="jar-input-count" class="text-xs text-slate-500">0 / 280</span>
          <!-- 作者选择 -->
          <div class="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-0.5">
            <button id="jar-author-istp" class="rounded-md px-2 py-0.5 text-xs font-medium transition-colors bg-emerald-600 text-white">ISTP</button>
            <button id="jar-author-isfj" class="rounded-md px-2 py-0.5 text-xs font-medium transition-colors text-slate-400 hover:text-rose-400">ISFJ</button>
          </div>
        </div>
        <button
          id="jar-btn-save"
          class="rounded-lg bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-500 active:scale-95 transition-all"
        >
          💾 存入
        </button>
      </div>
    </div>

    <!-- 统计 -->
    <div class="mb-4 flex items-center justify-between text-sm text-slate-400">
      <span>📝 已存 <strong id="jar-count" class="text-slate-200">${notes.length}</strong> 条 · 🆕 未抽 <strong class="text-amber-400">${unseenCount}</strong> 条</span>
      ${notes.length > 0 ? `
        <button id="jar-btn-clear" class="text-slate-500 hover:text-rose-400 transition-colors">清空全部</button>
      ` : ""}
    </div>

    <!-- 已存列表 -->
    ${notes.length > 0 ? `
      <div class="mb-4 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 p-2">
        ${notes.map((n) => `
          <div class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-800/50 transition-colors group">
            <span class="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${n.author === 'ISTP' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}">${n.author}</span>
            <span class="flex-1 truncate text-slate-300">${escHtml(n.text)}</span>
            <span class="shrink-0 text-xs text-slate-600">${fmtTime(n.ts)}</span>
            <button
              id="jar-del-${n.id}"
              class="shrink-0 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        `).join("")}
      </div>
    ` : ""}

    <!-- 随机抽取 -->
    <button
      id="jar-btn-pick"
      class="w-full rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:from-rose-500 hover:to-amber-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
      ${notes.length === 0 ? "disabled" : ""}
    >
      ✨ 随机抽取一条${unseenCount === 0 && notes.length > 0 ? ' (全部已抽，重新洗牌)' : ''}
    </button>

    <div id="jar-pick-result" class="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-5 text-center hidden">
      <div class="flex items-center justify-center gap-2 mb-2">
        <span id="jar-pick-author" class="text-xs font-medium px-1.5 py-0.5 rounded"></span>
        <span id="jar-pick-time" class="text-xs text-slate-500"></span>
      </div>
      <p id="jar-pick-text" class="text-lg leading-relaxed text-slate-200"></p>
    </div>
  </div>
`;

/**
 * 重新渲染整个组件
 * @param {HTMLElement} container
 */
const rerender = (container) => {
  render(container);
};

/** 当前选中的作者 */
let currentAuthor = "ISTP";

/**
 * 更新作者选择器样式
 */
const updateAuthorUI = () => {
  const btnIstp = document.getElementById("jar-author-istp");
  const btnIsfj = document.getElementById("jar-author-isfj");
  if (btnIstp && btnIsfj) {
    if (currentAuthor === "ISTP") {
      btnIstp.className = "rounded-md px-2 py-0.5 text-xs font-medium transition-colors bg-emerald-600 text-white";
      btnIsfj.className = "rounded-md px-2 py-0.5 text-xs font-medium transition-colors text-slate-400 hover:text-rose-400";
    } else {
      btnIsfj.className = "rounded-md px-2 py-0.5 text-xs font-medium transition-colors bg-rose-600 text-white";
      btnIstp.className = "rounded-md px-2 py-0.5 text-xs font-medium transition-colors text-slate-400 hover:text-emerald-400";
    }
  }
};

/**
 * 绑定事件监听器
 * @param {HTMLElement} container
 */
const bindEvents = (container) => {
  const input = document.getElementById("jar-input");
  const countEl = document.getElementById("jar-input-count");
  const btnSave = document.getElementById("jar-btn-save");
  const btnClear = document.getElementById("jar-btn-clear");
  const btnPick = document.getElementById("jar-btn-pick");
  const resultDiv = document.getElementById("jar-pick-result");
  const resultText = document.getElementById("jar-pick-text");
  const resultAuthor = document.getElementById("jar-pick-author");
  const resultTime = document.getElementById("jar-pick-time");

  // 字数统计
  if (input && countEl) {
    input.addEventListener("input", () => {
      countEl.textContent = `${input.value.length} / 280`;
    });
  }

  // 作者切换
  const btnIstp = document.getElementById("jar-author-istp");
  const btnIsfj = document.getElementById("jar-author-isfj");
  if (btnIstp) btnIstp.addEventListener("click", () => { currentAuthor = "ISTP"; updateAuthorUI(); });
  if (btnIsfj) btnIsfj.addEventListener("click", () => { currentAuthor = "ISFJ"; updateAuthorUI(); });

  // 存入
  if (btnSave && input) {
    btnSave.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) return;

      const notes = load(STORAGE_KEY, []);
      notes.push({ id: uid(), text, author: currentAuthor, ts: Date.now() });
      save(STORAGE_KEY, notes);
      rerender(container);
    });
  }

  // 清空全部
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      save(STORAGE_KEY, []);
      save(SEEN_KEY, []);
      rerender(container);
    });
  }

  // 单条删除
  const notes = load(STORAGE_KEY, []);
  const seen = load(SEEN_KEY, []);
  notes.forEach((n) => {
    const delBtn = document.getElementById(`jar-del-${n.id}`);
    if (delBtn) {
      delBtn.addEventListener("click", () => {
        let notes = load(STORAGE_KEY, []);
        notes = notes.filter((item) => item.id !== n.id);
        save(STORAGE_KEY, notes);
        // 同步清理 seen 列表
        const seen = load(SEEN_KEY, []);
        save(SEEN_KEY, seen.filter((id) => id !== n.id));
        rerender(container);
      });
    }
  });

  // 随机抽取（不重复抽取）
  if (btnPick && resultDiv && resultText && resultAuthor && resultTime) {
    btnPick.addEventListener("click", () => {
      const notes = load(STORAGE_KEY, []);
      if (notes.length === 0) return;

      let seen = load(SEEN_KEY, []);
      // 筛选未被抽过的笔记
      let candidates = notes.filter((n) => !seen.includes(n.id));
      // 全部抽完则重置
      if (candidates.length === 0) {
        save(SEEN_KEY, []);
        seen = [];
        candidates = notes;
      }

      const picked = randomPick(candidates);
      seen.push(picked.id);
      save(SEEN_KEY, seen);

      // 显示结果（含作者标签）
      resultText.textContent = `"${picked.text}"`;
      resultAuthor.textContent = picked.author;
      resultAuthor.className = `text-xs font-medium px-1.5 py-0.5 rounded ${picked.author === 'ISTP' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`;
      resultTime.textContent = fmtTime(picked.ts);
      resultDiv.classList.remove("hidden");
      resultDiv.classList.remove("page-enter");
      void resultDiv.offsetWidth;
      resultDiv.classList.add("page-enter");

      // 更新按钮：全部抽完时显示重置提示
      const remaining = notes.filter((n) => !seen.includes(n.id)).length;
      btnPick.textContent = remaining === 0 ? '✨ 全部抽完，再抽一次 (重新洗牌)' : `✨ 随机抽取一条`;
    });
  }
};

/**
 * 渲染 Memory Jar 组件到目标容器
 * @param {HTMLElement} container - 挂载目标
 */
export const render = (container) => {
  const notes = load(STORAGE_KEY, []);
  const seen = load(SEEN_KEY, []);
  const unseenCount = notes.length - seen.filter((id) => notes.some((n) => n.id === id)).length;
  // 清理已删除笔记的 seen 记录
  const validIds = new Set(notes.map((n) => n.id));
  save(SEEN_KEY, seen.filter((id) => validIds.has(id)));

  container.innerHTML = html(notes, Math.max(0, unseenCount));
  bindEvents(container);
};
