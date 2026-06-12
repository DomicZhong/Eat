/**
 * 应用入口 — 初始化路由系统、主题、启动 SPA
 */
import { initRouter } from "./router.js";
import { load, save } from "./store.js";

const THEME_KEY = "theme";
const THEMES = {
  night: { emoji: "🌙", label: "暗夜" },
  sakura: { emoji: "🌸", label: "暖樱" },
  forest: { emoji: "🌿", label: "森林" },
};

/**
 * 获取当前主题
 * @returns {string}
 */
export const getTheme = () => load(THEME_KEY, "night");

/**
 * 应用主题到 <html> 上
 * @param {string} theme
 */
const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

/**
 * 切换主题
 * @param {string} theme
 */
export const setTheme = (theme) => {
  if (!THEMES[theme]) return;
  save(THEME_KEY, theme);
  applyTheme(theme);
};

/**
 * 获取所有主题信息
 * @returns {Array<{ key: string, emoji: string, label: string }>}
 */
export const getThemeList = () =>
  Object.entries(THEMES).map(([key, val]) => ({ key, ...val }));

/**
 * 更新导航栏储蓄罐未抽取角标
 */
const updateJarBadge = () => {
  const navJar = document.getElementById("nav-jar");
  if (!navJar) return;
  const notes = load("jar_notes", []);
  const seen = load("jar_seen", []);
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

// 初始化主题
applyTheme(getTheme());

// 监听路由和存储变化来刷新角标
window.addEventListener("hashchange", () => setTimeout(updateJarBadge, 100));
window.addEventListener("storage", updateJarBadge);

initRouter();
setTimeout(updateJarBadge, 200);
