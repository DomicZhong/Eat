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
 * 更新导航栏储蓄罐角标
 */
const updateNavBadge = () => {
  const navJar = document.getElementById("nav-jar");
  if (!navJar) return;
  const notes = load(STORAGE_KEY, []);
  const seen = load(SEEN_KEY, []);
  const validIds = new Set(notes.map((n) => n.id));
  const unseen = notes.length - seen.filter((id) => validIds.has(id)).length;

  const old = navJar.querySelector(".nav-badge");
  if (old) old.remove();

  if (unseen > 0) {
    const badge = document.createElement("span");
    badge.className = "nav-badge absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 px-1";
    badge.textContent = unseen > 99 ? "99+" : String(unseen);
    navJar.appendChild(badge);
  }
};

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

    <!-- 随机抽取（移到列表上面） -->
    <button
      id="jar-btn-pick"
      class="w-full rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:from-rose-500 hover:to-amber-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none mb-4"
      ${notes.length === 0 ? "disabled" : ""}
    >
      <span id="jar-btn-pick-text">✨ 随机抽取一条${unseenCount === 0 && notes.length > 0 ? ' (全部已抽，重新洗牌)' : ''}</span>
    </button>

    <!-- 抽取结果（带摇晃揭晓动效） -->
    <div id="jar-pick-result" class="mb-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-5 text-center hidden">
      <div class="flex items-center justify-center gap-2 mb-2">
        <span id="jar-pick-author" class="text-xs font-medium px-1.5 py-0.5 rounded"></span>
        <span id="jar-pick-time" class="text-xs text-slate-500"></span>
      </div>
      <p id="jar-pick-text" class="text-lg leading-relaxed text-slate-200"></p>
    </div>

    <!-- 统计 & 操作栏 -->
    <div class="mb-3 flex items-center justify-between text-sm text-slate-400">
      <span>📝 已存 <strong id="jar-count" class="text-slate-200">${notes.length}</strong> 条 · 🆕 未抽 <strong class="text-amber-400">${unseenCount}</strong> 条</span>
      <div class="flex items-center gap-3">
        ${notes.length > 0 ? `
          <button id="jar-btn-toggle-list" class="text-slate-400 hover:text-emerald-400 transition-colors text-xs">
            查看全部 ▾
          </button>
          <button id="jar-btn-clear" class="text-slate-500 hover:text-rose-400 transition-colors text-xs">清空</button>
        ` : ""}
      </div>
    </div>

    <!-- 已存列表（默认折叠） -->
    ${notes.length > 0 ? `
      <div id="jar-notes-list" class="mb-4 max-h-60 space-y-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 p-2 hidden">
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
  </div>
`;

/**
 * 重新渲染整个组件，并触发角标更新
 * @param {HTMLElement} container
 */
const rerender = (container) => {
  render(container);
  // 触发导航栏角标更新
  window.dispatchEvent(new Event("hashchange"));
};

/** 当前选中的作者（从 LocalStorage 读取上次选择，默认为 ISTP） */
let currentAuthor = load("jar_last_author", "ISTP");

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

  // 作者切换（记住上次选择）
  const btnIstp = document.getElementById("jar-author-istp");
  const btnIsfj = document.getElementById("jar-author-isfj");
  if (btnIstp) btnIstp.addEventListener("click", () => { currentAuthor = "ISTP"; save("jar_last_author", "ISTP"); updateAuthorUI(); });
  if (btnIsfj) btnIsfj.addEventListener("click", () => { currentAuthor = "ISFJ"; save("jar_last_author", "ISFJ"); updateAuthorUI(); });

  // 存入
  if (btnSave && input) {
    btnSave.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) return;

      const notes = load(STORAGE_KEY, []);
      notes.push({ id: uid(), text, author: currentAuthor, ts: Date.now() });
      save(STORAGE_KEY, notes);
      updateNavBadge();
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

  // 查看全部（展开/折叠笔记列表）
  const btnToggle = document.getElementById("jar-btn-toggle-list");
  const notesList = document.getElementById("jar-notes-list");
  if (btnToggle && notesList) {
    btnToggle.addEventListener("click", () => {
      const isHidden = notesList.classList.contains("hidden");
      notesList.classList.toggle("hidden");
      btnToggle.textContent = isHidden ? "收起 ▴" : "查看全部 ▾";
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

  // 随机抽取（不重复抽取 + 摇晃动效）
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

      // 更新按钮
      const remaining = notes.filter((n) => !seen.includes(n.id)).length;
      const btnText = document.getElementById("jar-btn-pick-text");
      if (btnText) {
        btnText.textContent = remaining === 0 ? '✨ 全部抽完，再抽一次 (重新洗牌)' : '✨ 随机抽取一条';
      }

      // 🎁 摇晃动效：按钮抖动 → 显示结果（延迟揭晓）
      btnPick.classList.add("jar-shake");
      resultDiv.classList.add("hidden");

      setTimeout(() => {
        btnPick.classList.remove("jar-shake");

        // 显示结果
        resultText.textContent = `"${picked.text}"`;
        resultAuthor.textContent = picked.author;
        resultAuthor.className = `text-xs font-medium px-1.5 py-0.5 rounded ${picked.author === 'ISTP' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`;
        resultTime.textContent = fmtTime(picked.ts);
        resultDiv.classList.remove("hidden");
        resultDiv.classList.remove("page-enter");
        void resultDiv.offsetWidth;
        resultDiv.classList.add("page-enter");
      }, 500);

      // 更新导航栏角标
      updateNavBadge();
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
  return () => {};
};
