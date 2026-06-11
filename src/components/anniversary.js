/**
 * 纪念日页面 — 展示在一起的时间计数
 *
 * 宽松多行排版，每秒刷新天数 + 时分秒
 */
import { sinceTogether } from "../utils/helpers.js";

/** 计时器 ID，用于销毁 */
let tickTimer = null;

/**
 * 构建纪念日页面的 HTML 结构
 * @returns {string}
 */
const html = () => {
  const { days, time } = sinceTogether();
  return `
    <div class="page-enter flex flex-col items-center justify-center py-10 text-center">
      <!-- 图标 -->
      <p class="text-6xl mb-6">💕</p>

      <!-- 在一起 -->
      <p class="text-slate-400 text-lg mb-4 tracking-widest">在 一 起</p>

      <!-- 天数（大字突出） -->
      <p class="mb-3">
        <span id="anniversary-days" class="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-rose-400 bg-clip-text text-transparent tabular-nums">${days}</span>
        <span class="text-3xl text-slate-400 ml-2">天</span>
      </p>

      <!-- 时分秒（流动时间） -->
      <p id="anniversary-time" class="text-2xl text-slate-300 font-mono tracking-wider mb-8 tabular-nums">${time}</p>

      <!-- 分隔线 -->
      <div class="flex items-center gap-4 mb-6 w-48">
        <span class="flex-1 h-px bg-slate-700"></span>
        <span class="text-slate-600 text-xs">SINCE</span>
        <span class="flex-1 h-px bg-slate-700"></span>
      </div>

      <!-- 起始日期 -->
      <p class="text-slate-500 text-lg">2023.10.08</p>
      <p class="text-slate-600 text-xs mt-1">凌晨 01:03:02</p>

      <!-- 底部装饰文字 -->
      <p class="text-slate-700 text-xs mt-12 italic">"时间的流逝，是我爱你的证明"</p>
    </div>
  `;
};

/**
 * 启动计时器（每秒刷新）
 */
const startTicker = () => {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const daysEl = document.getElementById("anniversary-days");
    const timeEl = document.getElementById("anniversary-time");
    if (daysEl && timeEl) {
      const { days, time } = sinceTogether();
      daysEl.textContent = days;
      timeEl.textContent = time;
    }
  }, 1000);
};

/**
 * 渲染纪念日页面到目标容器
 * @param {HTMLElement} container - 挂载目标
 */
export const render = (container) => {
  container.innerHTML = html();
  startTicker();
};
