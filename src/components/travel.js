/**
 * 旅行地图页面 — Leaflet 地图 + 时间线展示去过的地方
 *
 * 颜色按年份区分（🟦2023 🟩2024 🟧2025 🟪2026），
 * 地图标记点可点击查看城市+日期，时间线点击可定位到地图。
 */
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTravels } from "../utils/helpers.js";

/** 年份颜色映射 */
const YEAR_COLORS = {
  "2023": "#3b82f6", // blue
  "2024": "#10b981", // emerald
  "2025": "#f59e0b", // amber
  "2026": "#8b5cf6", // violet
};

/** 瓦片图层 URL */
const TILES = {
  dark:  { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: '&copy; <a href="https://carto.com/">CARTO</a>' },
  light: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
};
/** 当前瓦片模式 */
let tileMode = "dark";

/** 当前 Leaflet 地图实例 */
let map = null;
/** 当前瓦片图层 */
let tileLayer = null;
/** 当前城市标记点列表 */
let markers = [];

/**
 * 按年份分组
 * @param {Array} travels
 * @returns {object} { "2023": [...], "2024": [...] }
 */
const groupByYear = (travels) => {
  const groups = {};
  travels.forEach((t) => {
    const year = t.date.slice(0, 4);
    if (!groups[year]) groups[year] = [];
    groups[year].push(t);
  });
  return groups;
};

/**
 * 创建 Leaflet 自定义圆点图标
 * @param {string} color
 * @returns {L.DivIcon}
 */
const createIcon = (color) =>
  L.divIcon({
    className: "travel-marker",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

/**
 * 构建 HTML
 * @returns {string}
 */
const html = () => {
  const travels = getTravels();
  const groups = groupByYear(travels);
  const years = Object.keys(groups).sort();
  const count = travels.length;

  return `
    <div class="page-enter">
      <h1 class="text-2xl font-bold text-center mb-4 tracking-wide">
        🌍 <span class="text-emerald-400">我们的</span><span class="text-rose-400">足迹</span>
      </h1>

      <!-- 统计 -->
      <p class="text-center text-sm text-slate-400 mb-4">已打卡 <span class="text-amber-300 font-bold text-lg">${count}</span> 座城市</p>

      <!-- 地图区域 -->
      <div id="travel-map" class="w-full rounded-2xl border border-slate-700 overflow-hidden mb-4 relative" style="height: min(calc(100vh - 300px), 70vh); min-height: 300px;">
        <button id="travel-toggle-tiles" class="absolute top-2 right-2 z-[1000] rounded-lg bg-slate-900/80 backdrop-blur border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-all">
          ${tileMode === "dark" ? "🌙 暗色" : "☀️ 亮色"}
        </button>
      </div>

      <!-- 年份筛选圆点按钮 -->
      <div class="flex items-center justify-center gap-2 mb-4 flex-wrap">
        <button class="travel-filter-btn rounded-full px-3 py-1 text-xs font-medium border border-slate-600 text-slate-300 hover:border-slate-500 transition-all active:scale-95" data-year="all">
          ● 全部
        </button>
        ${years.map((y) => `
          <button class="travel-filter-btn rounded-full px-3 py-1 text-xs font-medium border transition-all active:scale-95"
            data-year="${y}"
            style="border-color:${YEAR_COLORS[y]};color:${YEAR_COLORS[y]};">
            ${y} · ${groups[y].length}
          </button>
        `).join("")}
      </div>

      <!-- 时间线 -->
      <div class="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
        <div class="max-h-[50vh] overflow-y-auto">
          ${years.map((year) => `
            <div class="travel-year-group" data-year="${year}">
              <div class="sticky top-0 z-10 px-4 py-2 font-bold text-sm border-b"
                style="background-color:${YEAR_COLORS[year]}22;color:${YEAR_COLORS[year]};border-color:${YEAR_COLORS[year]}44">
                ${year} · ${groups[year].length} 城
              </div>
              ${groups[year].map((t) => {
                const displayName = t.flag ? `${t.flag} ${t.city}` : t.city;
                const itemId = `travel-item-${t.id}`;
                return `
                  <div id="${itemId}" class="travel-timeline-item flex items-center gap-3 border-b border-slate-800 px-4 py-2.5 hover:bg-slate-800/50 transition-colors cursor-pointer"
                    data-lat="${t.lat}" data-lng="${t.lng}" data-city="${t.city}" data-date="${t.date}" data-id="${t.id}">
                    <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${YEAR_COLORS[year]};box-shadow:0 0 6px ${YEAR_COLORS[year]}44"></span>
                    <span class="text-xs text-slate-500 flex-shrink-0 w-14">${t.date.slice(5)}</span>
                    <span class="text-sm text-slate-300 flex-1">${displayName}</span>
                    <svg class="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </div>`;
              }).join("")}
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
};

/**
 * 初始化 Leaflet 地图
 */
const initMap = () => {
  const mapEl = document.getElementById("travel-map");
  if (!mapEl) return;

  map = L.map(mapEl, {
    center: [30, 112],
    zoom: 5,
    zoomControl: false,
    attributionControl: false,
  });

  // 默认暗色瓦片
  tileLayer = L.tileLayer(TILES[tileMode].url, {
    maxZoom: 18,
    attribution: TILES[tileMode].attr,
  }).addTo(map);

  // 缩放控件放在右下角
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // 加载标记点
  loadMarkers();

  // 初始化后刷新一下地图大小
  setTimeout(() => map.invalidateSize(), 100);
};

/**
 * 在地图上加载旅行标记点
 * @param {string} [filterYear] 可选年份过滤
 */
const loadMarkers = (filterYear) => {
  if (!map) return;
  // 清除旧标记
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  const travels = getTravels();
  travels.forEach((t) => {
    const year = t.date.slice(0, 4);
    if (filterYear && filterYear !== "all" && year !== filterYear) return;

    const color = YEAR_COLORS[year] || "#64748b";
    const displayName = t.flag ? `${t.flag} ${t.city}` : t.city;
    const marker = L.marker([t.lat, t.lng], { icon: createIcon(color) })
      .addTo(map)
      .bindPopup(`<div style="text-align:center;font-size:14px;"><b>${displayName}</b><br><span style="color:#94a3b8;font-size:12px;">${t.date}</span></div>`);
    // 存储 travel id 用于双向联动
    marker._travelId = t.id;
    marker.on("click", () => highlightTimelineItem(t.id));
    markers.push(marker);
  });

  // 缩放适配
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.flyToBounds(group.getBounds().pad(0.15), { animate: true, duration: 0.6, maxZoom: 11 });
  }
};

/**
 * 高亮时间线项并滚动到视图
 * @param {string} id - travel id
 */
const highlightTimelineItem = (id) => {
  // 清除之前的高亮
  document.querySelectorAll(".travel-timeline-item.travel-highlight").forEach((el) => {
    el.classList.remove("travel-highlight");
  });
  // 如果该年份组被隐藏，先恢复显示
  const item = document.getElementById(`travel-item-${id}`);
  if (!item) return;
  const yearGroup = item.closest(".travel-year-group");
  if (yearGroup) yearGroup.style.display = "";
  // 高亮并滚动
  item.classList.add("travel-highlight");
  item.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => item.classList.remove("travel-highlight"), 2000);
};

/**
 * 定位到某个城市
 * @param {number} lat
 * @param {number} lng
 */
const flyToCity = (lat, lng) => {
  if (!map) return;
  map.setView([lat, lng], 10, { animate: true });
  // 找到最近的标记点打开弹窗
  markers.forEach((m) => {
    const pos = m.getLatLng();
    if (Math.abs(pos.lat - lat) < 0.01 && Math.abs(pos.lng - lng) < 0.01) {
      m.openPopup();
    }
  });
};

/**
 * 绑定事件
 */
const bindEvents = () => {
  // 底图切换
  const toggleBtn = document.getElementById("travel-toggle-tiles");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      tileMode = tileMode === "dark" ? "light" : "dark";
      toggleBtn.innerHTML = tileMode === "dark" ? "🌙 暗色" : "☀️ 亮色";
      if (map && tileLayer) {
        map.removeLayer(tileLayer);
        tileLayer = L.tileLayer(TILES[tileMode].url, {
          maxZoom: 18,
          attribution: TILES[tileMode].attr,
        }).addTo(map);
      }
    });
  }

  // 时间线点击 -> 地图定位 + 自高亮
  document.querySelectorAll(".travel-timeline-item").forEach((item) => {
    item.addEventListener("click", () => {
      const lat = parseFloat(item.dataset.lat);
      const lng = parseFloat(item.dataset.lng);
      const id = item.dataset.id;
      if (id) highlightTimelineItem(id);
      if (!isNaN(lat) && !isNaN(lng)) flyToCity(lat, lng);
    });
  });

  // 年份筛选
  document.querySelectorAll(".travel-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const year = btn.dataset.year;
      // 高亮当前按钮
      document.querySelectorAll(".travel-filter-btn").forEach((b) => {
        b.style.opacity = b === btn ? "1" : "0.5";
      });
      // 筛选地图标记
      loadMarkers(year === "all" ? null : year);
      // 筛选时间线
      document.querySelectorAll(".travel-year-group").forEach((group) => {
        group.style.display = (year === "all" || group.dataset.year === year) ? "" : "none";
      });
    });
  });
};

/**
 * 渲染旅行地图页面
 * @param {HTMLElement} container
 * @returns {() => void}
 */
export const render = (container) => {
  container.innerHTML = html();
  bindEvents();
  // 延迟初始化地图（确保 DOM 渲染完毕）
  setTimeout(initMap, 50);
  return () => {
    if (map) {
      map.remove();
      map = null;
      tileLayer = null;
    }
    markers = [];
  };
};
