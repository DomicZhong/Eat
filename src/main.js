/**
 * 应用入口 — 直接渲染吃什么决策器
 */
import { render, initTheme } from "./components/decider.js";

const app = document.getElementById("app");

/**
 * 初始化应用
 */
const init = () => {
  if (!app) return;
  initTheme();
  render(app);
};

init();
