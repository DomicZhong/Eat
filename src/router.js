/**
 * Hash Router — 基于 window.location.hash 的 SPA 路由
 * 监听 hashchange 事件，动态加载对应页面组件并渲染到 #app
 */

/** @type {HTMLElement | null} */
const app = document.getElementById("app");

/** 当前组件的销毁函数（用于切换时清理） */
let currentDestroy = null;

/** 路由表：hash 路径 → 组件渲染函数 */
const routes = {
  decider: () => import("./components/decider.js"),
  jar: () => import("./components/jar.js"),
  quests: () => import("./components/quests.js"),
  anniversary: () => import("./components/anniversary.js"),
  travel: () => import("./components/travel.js"),
  settings: () => import("./components/settings.js"),
};

/** 页面标题映射 */
const titles = {
  decider: "🎲 UsTime · 扭蛋机",
  jar: "🏺 UsTime · 漂流瓶",
  quests: "📋 UsTime · 小本本",
  anniversary: "💕 UsTime · 纪念日",
  travel: "🌍 UsTime · 旅行地图",
  settings: "⚙️ UsTime · 数据管理",
};

/** 默认路由（首页重定向） */
const DEFAULT_ROUTE = "decider";

/**
 * 解析当前 hash，返回路由名称
 * 例如 "#/jar" → "jar"，"#/decider" → "decider"
 * @returns {string} 路由名称
 */
const getRoute = () => {
  const hash = window.location.hash.slice(1); // 去掉 #
  return hash.replace(/^\/+/, "") || DEFAULT_ROUTE;
};

/**
 * 高亮当前页对应的导航项
 * @param {string} name - 当前路由名称
 */
const highlightNav = (name) => {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.id === `nav-${name}`);
  });
};

/**
 * 渲染当前路由对应的页面组件
 * 组件不存在时显示 404 提示
 * @returns {Promise<void>}
 */
const render = async () => {
  const name = getRoute();
  const loader = routes[name];

  if (!app) return;

  // 旅行页面撑满宽度，其他页面限制 512px
  if (name === "travel") {
    app.classList.add("md:max-w-none");
    app.classList.add("md:px-8");
    app.classList.remove("max-w-lg");
  } else {
    app.classList.add("max-w-lg");
    app.classList.remove("md:max-w-none", "md:px-8");
  }

  // 更新浏览器标题
  document.title = titles[name] || "UsTime";

  // 更新导航高亮
  highlightNav(name);

  if (!loader) {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <p class="text-5xl mb-4">🧭</p>
        <p class="text-slate-400 text-lg">页面不存在</p>
        <a href="#/decider" class="mt-4 text-emerald-400 underline">返回首页</a>
      </div>`;
    window.scrollTo(0, 0);
    return;
  }

  // 显示加载状态
  app.innerHTML = `
    <div class="flex items-center justify-center py-20">
      <p class="text-slate-500 animate-pulse">加载中...</p>
    </div>`;
  window.scrollTo(0, 0);

  try {
    const module = await loader();
    if (module.render) {
      // 切换前清理上一个组件
      if (currentDestroy) {
        currentDestroy();
        currentDestroy = null;
      }
      const destroy = await module.render(app);
      if (typeof destroy === "function") currentDestroy = destroy;
    }
    window.scrollTo(0, 0);
  } catch (err) {
    if (currentDestroy) {
      currentDestroy();
      currentDestroy = null;
    }
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <p class="text-5xl mb-4">⚠️</p>
        <p class="text-slate-400 text-lg">页面加载失败</p>
        <a href="#/decider" class="mt-4 text-emerald-400 underline">返回首页</a>
      </div>`;
    window.scrollTo(0, 0);
  }
};

/**
 * 初始化路由：绑定事件并渲染当前页面
 */
export const initRouter = () => {
  window.addEventListener("hashchange", render);
  render();
};
