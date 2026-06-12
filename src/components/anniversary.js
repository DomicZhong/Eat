/**
 * 纪念日页面 — 支持多个纪念日，左右滑动切换
 *
 * 每张卡片展示一个纪念日的天数 + 时分秒（每秒刷新），
 * 底部圆点指示器，支持触摸/鼠标拖拽和左右箭头切换。
 */
import { getAnniversaries, sinceDate, formatAnniversaryDate, formatAnniversaryDateFull, getSpecialDay, sinceTogether } from "../utils/helpers.js";

/** 计时器 ID */
let tickTimer = null;
/** 当前展示的纪念日索引 */
let currentIndex = 0;
/** 触摸/拖拽起始位置 */
let dragStartX = 0;
/** 总卡片数 */
let total = 0;

/**
 * 格式化单张卡片的显示数据
 * @param {{ id: string, name: string, date: string }} ann
 * @returns {{ id: string, name: string, dateStr: string, dateFull: string, days: number, time: string }}
 */
const cardData = (ann) => {
  const { days, time } = sinceDate(ann.date);
  return {
    id: ann.id,
    name: ann.name,
    dateStr: formatAnniversaryDate(ann.date),
    dateFull: formatAnniversaryDateFull(ann.date),
    days,
    time,
  };
};

/**
 * 构建 HTML
 * @returns {string}
 */
const html = () => {
  const anniversaries = getAnniversaries();
  total = anniversaries.length;
  if (currentIndex >= total) currentIndex = total - 1;
  if (currentIndex < 0) currentIndex = 0;
  const cards = anniversaries.map((a) => cardData(a));
  const current = cards[currentIndex];
  const special = getSpecialDay();
  const { days: mainDays } = sinceTogether();

  return `
    <div class="page-enter flex flex-col items-center justify-center py-6 text-center overflow-hidden">
      <!-- 图标 -->
      <p class="text-5xl mb-4">💕</p>

      <!-- 特殊天数横幅 -->
      ${special ? `
      <div class="mb-4 w-full max-w-sm rounded-2xl bg-gradient-to-r from-rose-900/60 via-amber-900/40 to-emerald-900/60 border border-rose-700/50 p-4 text-center animate-pulse">
        <p class="text-3xl mb-1">${special.emoji}</p>
        <p class="text-lg font-bold text-rose-200">${special.text}</p>
        <p class="text-xs text-slate-400 mt-1">今天是第 <span class="text-amber-300 font-semibold">${mainDays}</span> 天</p>
      </div>
      ` : ""}

      <!-- 卡片区域（滑动容器） -->
      <div id="anniversary-slider" class="relative w-full max-w-sm mx-auto overflow-hidden select-none mb-4">
        <div id="anniversary-track"
          class="flex transition-transform duration-300 ease-out"
          style="transform: translateX(-${currentIndex * 100}%);"
        >
          ${cards.map((c) => `
            <div class="w-full flex-shrink-0 flex flex-col items-center px-4">
              <!-- 纪念日名称 -->
              <p class="text-slate-400 text-base mb-1 tracking-wider">${c.name}</p>
              <p class="text-slate-500 text-xs mb-3">
                <span class="text-emerald-400 font-medium">ISTP</span>
                <span class="mx-2 text-rose-400">♥</span>
                <span class="text-rose-400 font-medium">ISFJ</span>
              </p>

              <!-- 天数 -->
              <p class="mb-2">
                <span class="anniversary-days text-5xl font-bold bg-gradient-to-r from-emerald-400 to-rose-400 bg-clip-text text-transparent tabular-nums"
                  data-idx="${cards.indexOf(c)}">${c.days}</span>
                <span class="text-2xl text-slate-400 ml-1">天</span>
              </p>

              <!-- 时分秒 -->
              <p class="anniversary-time text-xl text-slate-300 font-mono tracking-wider mb-4 tabular-nums"
                data-idx="${cards.indexOf(c)}">${c.time}</p>

              <!-- 分隔线 -->
              <div class="flex items-center gap-3 mb-3 w-40">
                <span class="flex-1 h-px bg-slate-700"></span>
                <span class="text-slate-600 text-xs">SINCE</span>
                <span class="flex-1 h-px bg-slate-700"></span>
              </div>

              <!-- 起始日期 -->
              <p class="text-slate-500 text-sm">${c.dateStr}</p>
              <p class="text-slate-600 text-xs mt-0.5">${c.dateFull}</p>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- 圆点指示器 -->
      ${total > 1 ? `
      <div id="anniversary-dots" class="flex items-center gap-2 mb-6">
        ${cards.map((_, i) => `
          <button class="anniversary-dot rounded-full transition-all duration-300 ${i === currentIndex ? 'w-3 h-3 bg-emerald-400' : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'}"
            data-idx="${i}"></button>
        `).join("")}
      </div>
      ` : ""}

      <!-- 底部装饰文字 -->
      <p class="text-slate-700 text-xs mt-8 italic">"时间的流逝，是我爱你的证明"</p>
    </div>
  `;
};

/**
 * 滑动到指定索引
 * @param {number} idx
 */
const slideTo = (idx) => {
  if (idx < 0 || idx >= total) return;
  currentIndex = idx;

  const track = document.getElementById("anniversary-track");
  if (track) {
    track.style.transform = `translateX(-${idx * 100}%)`;
  }

  // 更新圆点
  document.querySelectorAll(".anniversary-dot").forEach((dot) => {
    const dotIdx = parseInt(dot.dataset.idx, 10);
    if (dotIdx === idx) {
      dot.className = "anniversary-dot rounded-full transition-all duration-300 w-3 h-3 bg-emerald-400";
    } else {
      dot.className = "anniversary-dot rounded-full transition-all duration-300 w-2 h-2 bg-slate-600 hover:bg-slate-500";
    }
  });
};

/**
 * 绑定滑动事件
 */
const bindSwipe = () => {
  if (total <= 1) return;
  const slider = document.getElementById("anniversary-slider");
  if (!slider) return;

  const getX = (e) => {
    if (e.touches) return e.touches[0].clientX;
    return e.clientX;
  };

  slider.addEventListener("touchstart", (e) => { dragStartX = getX(e); }, { passive: true });
  slider.addEventListener("mousedown", (e) => { dragStartX = getX(e); e.preventDefault(); });

  const onEnd = (e) => {
    const delta = dragStartX - getX(e);
    if (Math.abs(delta) > 50) {
      if (delta > 0 && currentIndex < total - 1) slideTo(currentIndex + 1);
      else if (delta < 0 && currentIndex > 0) slideTo(currentIndex - 1);
    }
    dragStartX = 0;
  };

  slider.addEventListener("touchend", onEnd);
  slider.addEventListener("mouseup", onEnd);
  slider.addEventListener("mouseleave", () => { dragStartX = 0; });

  // 圆点点击
  document.querySelectorAll(".anniversary-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.dataset.idx, 10);
      if (!isNaN(idx)) slideTo(idx);
    });
  });
};

/**
 * 启动计时器（每秒刷新所有卡片）
 */
const startTicker = () => {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const anniversaries = getAnniversaries();
    const daysEls = document.querySelectorAll(".anniversary-days");
    const timeEls = document.querySelectorAll(".anniversary-time");

    daysEls.forEach((el) => {
      const idx = parseInt(el.dataset.idx, 10);
      if (anniversaries[idx]) {
        const { days } = sinceDate(anniversaries[idx].date);
        el.textContent = days;
      }
    });
    timeEls.forEach((el) => {
      const idx = parseInt(el.dataset.idx, 10);
      if (anniversaries[idx]) {
        const { time } = sinceDate(anniversaries[idx].date);
        el.textContent = time;
      }
    });
  }, 1000);
};

/**
 * 渲染纪念日页面
 * @param {HTMLElement} container
 * @returns {() => void}
 */
export const render = (container) => {
  currentIndex = 0;
  container.innerHTML = html();
  bindSwipe();
  startTicker();
  return () => {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
};
