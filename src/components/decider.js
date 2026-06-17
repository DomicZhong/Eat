/**
 * 吃什么 — 美食随机决策器
 *
 * 特性:
 * - 按菜系分类Tab筛选 + 全部模式
 * - 从当前分类随机抽取
 * - 7天历史防重复提示
 * - 快速重抽（排除当前结果）
 * - 按分类增删改美食选项
 */
import { CATEGORIES, getAllFoods, getFoodsByCategory, saveAllFoods, getAllRestaurants, getRestaurantsByCategory, saveAllRestaurants, randomPick } from "../utils/helpers.js";
import { record, checkRecent } from "../utils/history.js";

/** 当前选中的分类 */
var selectedCategory = "全部";

/** 当前展示的结果 */
var currentResult = "";

/** 当前模式: "food" 菜式 | "restaurant" 餐厅 */
var mode = "restaurant";

/** 美食库展开状态 */
var listExpanded = false;

/** 餐厅库展开状态 */
var restListExpanded = false;

/** 当前主题 */
var theme = "night";

/** 各主题按钮的高亮类 */
var themeActiveClass = {
  night: "bg-indigo-600 text-white",
  sakura: "bg-rose-400 text-white",
  forest: "bg-emerald-600 text-white",
};
var themeInactiveClass = "text-slate-500 hover:text-slate-300";

/** 各主题下餐厅/菜式的配色方案 */
var themeColorSchemes = {
  night: {
    rest: { bg: "bg-indigo-600", hover: "hover:bg-indigo-500", name: "indigo", hex: "600", text: "text-indigo-400", hoverText: "hover:text-indigo-400", border: "border-indigo-600", focusBorder: "focus:border-indigo-600" },
    food: { bg: "bg-rose-600", hover: "hover:bg-rose-500", name: "rose", hex: "600", text: "text-rose-400", hoverText: "hover:text-rose-400", border: "border-rose-600", focusBorder: "focus:border-rose-600" },
  },
  sakura: {
    rest: { bg: "bg-rose-500", hover: "hover:bg-rose-400", name: "rose", hex: "500", text: "text-rose-400", hoverText: "hover:text-rose-400", border: "border-rose-500", focusBorder: "focus:border-rose-500" },
    food: { bg: "bg-emerald-600", hover: "hover:bg-emerald-500", name: "emerald", hex: "600", text: "text-emerald-400", hoverText: "hover:text-emerald-400", border: "border-emerald-600", focusBorder: "focus:border-emerald-600" },
  },
  forest: {
    rest: { bg: "bg-emerald-600", hover: "hover:bg-emerald-500", name: "emerald", hex: "600", text: "text-emerald-400", hoverText: "hover:text-emerald-400", border: "border-emerald-600", focusBorder: "focus:border-emerald-600" },
    food: { bg: "bg-amber-600", hover: "hover:bg-amber-500", name: "amber", hex: "600", text: "text-amber-400", hoverText: "hover:text-amber-400", border: "border-amber-600", focusBorder: "focus:border-amber-600" },
  },
};

/** 获取当前主题和模式下对应的高亮色 */
var getAccent = function () {
  var isRest = mode === "restaurant";
  var scheme = themeColorSchemes[theme];
  return isRest ? scheme.rest : scheme.food;
};

/** 切换主题 */
var switchTheme = function (t) {
  if (theme === t) return;
  theme = t;
  localStorage.setItem("theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
  // 更新主题按钮高亮
  var btns = document.querySelectorAll(".theme-btn");
  for (var i = 0; i < btns.length; i++) {
    var btn = btns[i];
    var btnTheme = btn.id.replace("theme-", "");
    if (btnTheme === theme) {
      btn.className = "theme-btn rounded-full px-2.5 py-1 text-xs transition-all " + themeActiveClass[theme];
    } else {
      btn.className = "theme-btn rounded-full px-2.5 py-1 text-xs transition-all " + themeInactiveClass;
    }
  }
  // 更新模式按钮、抽取按钮、分类 Tab 的配色
  updateAccentElements();
};

/** 更新所有依赖主题和模式的按钮/元素配色 */
var updateAccentElements = function () {
  var isRest = mode === "restaurant";
  var restScheme = themeColorSchemes[theme].rest;
  var foodScheme = themeColorSchemes[theme].food;
  var accent = getAccent();

  // 模式切换按钮
  var baseMode = "decider-mode-btn rounded-full px-5 py-1.5 text-xs font-semibold transition-all";
  var btnRest = document.getElementById("decider-mode-restaurant");
  var btnFood = document.getElementById("decider-mode-food");
  if (btnRest) {
    btnRest.className = baseMode + " " + (isRest ? restScheme.bg + " text-white" : "text-slate-500 hover:text-slate-300");
  }
  if (btnFood) {
    btnFood.className = baseMode + " " + (isRest ? "text-slate-500 hover:text-slate-300" : foodScheme.bg + " text-white");
  }

  // 抽取按钮
  var btnRoll = document.getElementById("decider-btn-roll");
  if (btnRoll) {
    btnRoll.className = "w-full rounded-xl " + accent.bg + " " + accent.hover + " px-6 py-5 text-lg font-bold text-white shadow-lg active:scale-[0.98] transition-all mb-6";
  }

  // 分类 Tab（只更新选中态）
  var tabs = document.querySelectorAll(".decider-tab");
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (tab.dataset.cat === selectedCategory) {
      tab.className = "decider-tab rounded-full border px-4 py-1.5 text-xs font-semibold transition-all " + accent.bg + " text-white border-" + accent.name + "-" + accent.hex;
    }
  }
};

/**
 * 导出数据（收集所有 localStorage ustime_ 前缀数据）
 */
var handleExport = function () {
  var data = {};
  // 导出当前完整数据（合并了默认值 + 用户自定义），确保不丢任何内容
  data["ustime_foods"] = getAllFoods();
  data["ustime_restaurants"] = getAllRestaurants();
  // 导出决策历史等其他 localStorage 键
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.indexOf("ustime_") === 0 && key !== "ustime_foods" && key !== "ustime_restaurants") {
      try { data[key] = JSON.parse(localStorage.getItem(key)); } catch (_e) { data[key] = localStorage.getItem(key); }
    }
  }
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "eat-data-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 导入数据：合并（不覆盖已有项，去重）
 */
var handleImport = function (file) {
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var imported = JSON.parse(e.target.result);
      var mergedCount = 0;
      var keys = Object.keys(imported);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.indexOf("ustime_") !== 0) continue;
        try {
          var incoming = typeof imported[k] === "string" ? JSON.parse(imported[k]) : imported[k];
          var existingRaw = localStorage.getItem(k);
          var existing = existingRaw ? JSON.parse(existingRaw) : null;

          if (k.indexOf("ustime_decision_history") === 0) {
            // 历史记录：直接合并数组
            if (Array.isArray(incoming)) {
              var history = Array.isArray(existing) ? existing : [];
              for (var h = 0; h < incoming.length; h++) {
                history.push(incoming[h]);
              }
              localStorage.setItem(k, JSON.stringify(history));
              mergedCount += incoming.length;
            }
          } else if (existing && typeof existing === "object" && !Array.isArray(existing)) {
            // 分类数据 (foods/restaurants): 合并各分类，去重
            var cats = Object.keys(incoming);
            for (var c = 0; c < cats.length; c++) {
              var cat = cats[c];
              if (!Array.isArray(incoming[cat])) continue;
              if (!existing[cat]) existing[cat] = [];
              for (var j = 0; j < incoming[cat].length; j++) {
                if (existing[cat].indexOf(incoming[cat][j]) === -1) {
                  existing[cat].push(incoming[cat][j]);
                  mergedCount++;
                }
              }
            }
            localStorage.setItem(k, JSON.stringify(existing));
          } else {
            // 简单值直接设置
            localStorage.setItem(k, typeof imported[k] === "string" ? imported[k] : JSON.stringify(incoming));
            mergedCount++;
          }
        } catch (_err) { /* 跳过损坏的键 */ }
      }
      showImportMsg("✅ 已合并 " + mergedCount + " 条数据，刷新中...");
      setTimeout(function () { refresh(); }, 600);
    } catch (_err) {
      showImportMsg("❌ 文件格式错误");
    }
  };
  reader.readAsText(file);
};

/**
 * 显示导入结果提示
 */
var showImportMsg = function (msg) {
  var el = document.getElementById("decider-import-msg");
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(function () { el.classList.add("hidden"); }, 3000);
  }
};

/**
 * 转义 HTML
 */
var escHtml = function (str) {
  var map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, function (c) { return map[c]; });
};

/**
 * 根据当前模式获取数据源
 */
var getItemsByCategory = function (cat) {
  return mode === "restaurant" ? getRestaurantsByCategory(cat) : getFoodsByCategory(cat);
};
var getAllItems = function () {
  return mode === "restaurant" ? getAllRestaurants() : getAllFoods();
};
var saveAllItems = function (data) {
  return mode === "restaurant" ? saveAllRestaurants(data) : saveAllFoods(data);
};

// ====================== HTML 生成 ======================

/**
 * 生成分类 Tab HTML
 */
var tabsHtml = function () {
  var tabs = ["全部"];
  var cats = Object.keys(CATEGORIES);
  for (var i = 0; i < cats.length; i++) {
    tabs.push(cats[i]);
  }

  var parts = ['<div class="mb-6 flex flex-wrap justify-center gap-2">'];
  for (var t = 0; t < tabs.length; t++) {
    var tab = tabs[t];
    var isActive = tab === selectedCategory;
    var info = CATEGORIES[tab];
    var label = info ? (info.emoji + " " + tab) : ("🍽️ " + tab);
    var accent = getAccent();
    var activeClass = isActive
      ? accent.bg + " text-white border-" + accent.name + "-" + accent.hex
      : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500";
    parts.push(
      '<button class="decider-tab rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ' + activeClass + '" data-cat="' + tab + '">' + label + "</button>"
    );
  }
  parts.push("</div>");
  return parts.join("");
};

/**
 * 生成单个分类区块的 HTML
 */
var categoryBlockHtml = function (catName, items, blockMode) {
  var info = CATEGORIES[catName] || { emoji: "🍽️" };
  var isRest = blockMode === "restaurant";
  var itemLabel = isRest ? "餐厅" : "菜式";
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    rows.push(
      '<div class="flex items-center gap-2 border-b border-slate-800 px-3 py-2 group">' +
      '<span class="text-xs text-slate-600 w-5 text-right flex-shrink-0">' + (i + 1) + "</span>" +
      '<span class="flex-1 text-sm text-slate-300 truncate">' + escHtml(items[i]) + "</span>" +
      '<span class="decider-item-actions flex gap-1">' +
      '<button class="decider-edit-item text-slate-500 ' + getAccent().hoverText + ' text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity" data-cat="' + catName + '" data-idx="' + i + '">&#9998;</button>' +
      '<button class="decider-del-item text-slate-500 hover:text-rose-400 text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity" data-cat="' + catName + '" data-idx="' + i + '">&#10005;</button>' +
      "</span>" +
      "</div>"
    );
  }
  if (items.length === 0) {
    rows.push('<div class="px-3 py-3 text-center text-xs text-slate-600">暂无</div>');
  }

  return [
    '<div class="decider-cat-section border-b border-slate-700 last:border-b-0">',
    '<div class="flex items-center justify-between px-4 py-2 bg-slate-800/50">',
    '<span class="text-xs font-semibold text-slate-400">' + info.emoji + " " + catName + ' · <span class="text-slate-500">' + items.length + " 项</span></span>",
    '<button class="decider-toggle-cat text-xs text-slate-500 hover:text-slate-300 transition-colors" data-cat="' + catName + '">展开 ▾</button>',
    "</div>",
    '<div class="decider-cat-body hidden" data-cat-body="' + catName + '">',
    rows.join(""),
    // 添加输入行
    '<div class="border-t border-slate-800 p-3">',
    '<div class="flex gap-2">',
    '<input type="text" class="decider-add-input flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 outline-none ' + getAccent().focusBorder + ' placeholder-slate-600" placeholder="添加' + catName + itemLabel + '..." data-cat="' + catName + '" />',
    '<button class="decider-btn-add-cat rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-600 active:scale-95 transition-all whitespace-nowrap" data-cat="' + catName + '">+ 添加</button>',
    "</div>",
    "</div>",
    "</div>",
    "</div>",
  ].join("");
};

/**
 * 生成美食库编辑面板 HTML
 */
var editPanelHtml = function (panelMode) {
  var isRest = panelMode === "restaurant";
  var all = isRest ? getAllRestaurants() : getAllFoods();
  var panelIcon = isRest ? "📍" : "🍽️";
  var panelLabel = isRest ? "餐厅库" : "美食库";
  var expanded = isRest ? restListExpanded : listExpanded;
  var toggleId = isRest ? "decider-btn-toggle-rest-list" : "decider-btn-toggle-list";
  var listId = isRest ? "decider-rests-list" : "decider-foods-list";
  var cats = Object.keys(CATEGORIES);
  var totalCount = 0;
  var blocks = [];
  for (var i = 0; i < cats.length; i++) {
    var c = cats[i];
    var items = all[c] || [];
    totalCount += items.length;
    blocks.push(categoryBlockHtml(c, items, panelMode));
  }

  return [
    '<div class="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">',
    '<div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">',
    '<span class="text-sm text-slate-400">' + panelIcon + " " + panelLabel + ' · ' + totalCount + " 项</span>",
    '<button id="' + toggleId + '" class="text-xs text-slate-500 ' + getAccent().hoverText + ' transition-colors">' + (expanded ? "收起 ▴" : "查看全部 ▾") + "</button>",
    "</div>",
    '<div id="' + listId + '" class="max-h-[60vh] overflow-y-auto' + (expanded ? "" : " hidden") + '">',
    blocks.join(""),
    "</div>",
    "</div>",
  ].join("");
};

/**
 * 构建完整 HTML
 */
var html = function () {
  var isRest = mode === "restaurant";
  return [
    '<div class="page-enter relative">',

    // 主题切换 — 右上角
    '<div class="absolute top-0 right-0">',
    '<div class="inline-flex rounded-full border border-slate-700 bg-slate-800 p-0.5">',
    '<button id="theme-night" class="theme-btn rounded-full px-2.5 py-1 text-xs transition-all ' + (theme === "night" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300") + '">🌙</button>',
    '<button id="theme-sakura" class="theme-btn rounded-full px-2.5 py-1 text-xs transition-all ' + (theme === "sakura" ? "bg-rose-400 text-white" : "text-slate-500 hover:text-slate-300") + '">🌸</button>',
    '<button id="theme-forest" class="theme-btn rounded-full px-2.5 py-1 text-xs transition-all ' + (theme === "forest" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-300") + '">🌿</button>',
    "</div>",
    "</div>",

    '<h1 class="text-3xl font-bold text-center mb-2 tracking-wide text-slate-100">',
    "🍽️ 吃什么",
    "</h1>",

    // 模式切换
    '<div class="mb-5 flex justify-center">',
    '<div class="inline-flex rounded-full border border-slate-700 bg-slate-800 p-0.5">',
    '<button id="decider-mode-restaurant" class="decider-mode-btn rounded-full px-5 py-1.5 text-xs font-semibold transition-all ' + (isRest ? themeColorSchemes[theme].rest.bg + " text-white" : "text-slate-500 hover:text-slate-300") + '">📍 餐厅</button>',
    '<button id="decider-mode-food" class="decider-mode-btn rounded-full px-5 py-1.5 text-xs font-semibold transition-all ' + (isRest ? "text-slate-500 hover:text-slate-300" : themeColorSchemes[theme].food.bg + " text-white") + '">🍽️ 菜式</button>',
    "</div>",
    "</div>",

    // 分类 Tab
    tabsHtml(),

    // 结果展示区
    '<div id="decider-result" class="mb-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center min-h-[120px] flex flex-col items-center justify-center">',
    '<p id="decider-result-text" class="text-2xl leading-relaxed text-slate-200">',
    isRest ? "点下面按钮，帮你抽一间餐厅 📍" : "点下面按钮，帮你决定吃什么 🎯",
    "</p>",
    '<p id="decider-result-hint" class="mt-2 text-xs text-amber-400 hidden"></p>',
    '<p id="decider-result-cat" class="mt-1 text-xs text-slate-500 hidden"></p>',
    "</div>",

    // 操作按钮
    '<div id="decider-actions" class="mb-6 flex justify-center gap-3 hidden">',
    '<button id="decider-btn-reroll" class="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">',
    "🔄 换一个",
    "</button>",
    '<button id="decider-btn-copy" class="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">',
    "📋 复制",
    "</button>",
    "</div>",

    // 随机按钮
    '<button id="decider-btn-roll" class="w-full rounded-xl ' + getAccent().bg + " " + getAccent().hover + ' px-6 py-5 text-lg font-bold text-white shadow-lg active:scale-[0.98] transition-all mb-6">',
    (isRest ? "🎲 " : "🎲 ") + (selectedCategory === "全部" ? (isRest ? "今天去哪吃？" : "今天吃什么？") : (isRest ? "去哪吃" + selectedCategory + "？" : "来份" + selectedCategory + "？")),
    "</button>",

    // 编辑面板
    editPanelHtml(mode),

    // 数据导入导出
    '<div class="mt-6 pt-4 border-t border-slate-700">',
    '<div class="flex items-center justify-between">',
    '<span class="text-xs text-slate-500">📤 数据同步 · 收集同事喜好</span>',
    '<div class="flex gap-2">',
    '<button id="decider-btn-export" class="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">📥 导出</button>',
    '<button id="decider-btn-import" class="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-95 transition-all">📤 导入</button>',
    "</div>",
    "</div>",
    '<input type="file" id="decider-import-file" accept=".json" class="hidden" />',
    '<p id="decider-import-msg" class="mt-2 text-xs text-slate-500 hidden"></p>',
    "</div>",

    "</div>",
  ].join("");
};

// ====================== 交互逻辑 ======================

/**
 * 触发弹跳动画
 */
var bounceResult = function () {
  var el = document.getElementById("decider-result");
  if (!el) return;
  el.classList.remove("result-bounce");
  void el.offsetWidth;
  el.classList.add("result-bounce");
};

/**
 * 显示操作按钮
 */
var showActions = function () {
  var actions = document.getElementById("decider-actions");
  if (actions) actions.classList.remove("hidden");
};

/**
 * 刷新整个组件
 */
var refresh = function () {
  var container = document.querySelector("#app");
  if (!container) return;
  render(container);
};

/**
 * 切换分类
 */
var switchCategory = function (cat) {
  if (selectedCategory === cat) return;
  selectedCategory = cat;
  currentResult = "";
  refresh();
};

/**
 * 执行随机
 */
var doRoll = function (exclude) {
  if (!exclude) exclude = [];
  var items = getItemsByCategory(selectedCategory);
  var candidates = items.filter(function (f) { return exclude.indexOf(f) === -1; });
  var pool = candidates.length > 0 ? candidates : items;
  var picked = randomPick(pool);
  if (!picked) return;

  currentResult = picked;
  var isRest = mode === "restaurant";
  record(isRest ? "restaurant" : "food", picked);

  var main = document.getElementById("decider-result-text");
  if (main) {
    var icon = isRest ? "📍" : "🍽️";
    var color = getAccent().text;
    main.innerHTML = icon + ' <span class="' + color + ' font-bold">' + escHtml(picked) + "</span>";
  }

  showActions();
  bounceResult();

  // 显示分类标签
  var catEl = document.getElementById("decider-result-cat");
  if (catEl && selectedCategory !== "全部") {
    var info = CATEGORIES[selectedCategory];
    catEl.textContent = (info ? info.emoji : "") + " " + selectedCategory;
    catEl.classList.remove("hidden");
  } else if (catEl) {
    catEl.classList.add("hidden");
  }

  var hint = checkRecent(isRest ? "restaurant" : "food", picked);
  var hintEl = document.getElementById("decider-result-hint");
  if (hintEl && hint.count > 1) {
    hintEl.textContent = "最近 " + hint.lastDate + " 已选过，共 " + hint.count + " 次";
    hintEl.classList.remove("hidden");
  } else if (hintEl) {
    hintEl.classList.add("hidden");
  }
};

/**
 * 复制结果
 */
var handleCopy = function () {
  if (!currentResult) return;
  try {
    navigator.clipboard.writeText(currentResult).then(function () {
      var btn = document.getElementById("decider-btn-copy");
      if (btn) {
        var orig = btn.innerHTML;
        btn.innerHTML = "✅ 已复制";
        btn.classList.add(getAccent().text);
        setTimeout(function () {
          btn.innerHTML = orig;
          btn.classList.remove(getAccent().text);
        }, 1500);
      }
    });
  } catch (_e) {
    var textEl = document.getElementById("decider-result-text");
    if (textEl) {
      var range = document.createRange();
      range.selectNodeContents(textEl);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
};

/**
 * 添加项目到指定分类（根据 mode 自动选数据源）
 */
var addItem = function (catName, value) {
  var v = value.trim();
  if (!v) return;
  var data = getAllItems();
  if (!data[catName]) data[catName] = [];
  data[catName].push(v);
  saveAllItems(data);
  refresh();
};

/**
 * 删除指定分类中的项目
 */
var delItem = function (catName, idx) {
  var data = getAllItems();
  if (!data[catName] || data[catName].length <= 1) return;
  data[catName].splice(idx, 1);
  saveAllItems(data);
  refresh();
};

/**
 * 编辑指定分类中的项目
 */
var editItem = function (catName, idx, newVal) {
  var v = newVal.trim();
  if (!v) return;
  var data = getAllItems();
  data[catName][idx] = v;
  saveAllItems(data);
  refresh();
};

// ====================== 事件绑定 ======================

/**
 * 设置事件委托（一次性）
 */
var setupDelegation = function () {
  var app = document.querySelector("#app");
  if (!app || app._deciderDelegated) return;
  app._deciderDelegated = true;

  app.addEventListener("click", function (e) {
    var target = e.target.closest("button");
    if (!target) return;

    // ===== 模式切换 =====
    if (target.classList.contains("decider-mode-btn")) {
      e.stopPropagation();
      var newMode = target.id === "decider-mode-restaurant" ? "restaurant" : "food";
      if (mode !== newMode) {
        mode = newMode;
        currentResult = "";
        refresh();
      }
      return;
    }

    // ===== 主题切换 =====
    if (target.classList.contains("theme-btn")) {
      e.stopPropagation();
      switchTheme(target.id.replace("theme-", ""));
      return;
    }

    // ===== 分类 Tab 切换 =====
    if (target.classList.contains("decider-tab")) {
      e.stopPropagation();
      switchCategory(target.dataset.cat);
      return;
    }

    // ===== 展开/折叠分类区块 =====
    if (target.classList.contains("decider-toggle-cat")) {
      e.stopPropagation();
      var catName = target.dataset.cat;
      var body = document.querySelector('[data-cat-body="' + catName + '"]');
      if (body) {
        var isHidden = body.classList.contains("hidden");
        body.classList.toggle("hidden");
        target.textContent = isHidden ? "收起 ▴" : "展开 ▾";
      }
      return;
    }

    // ===== 按分类添加 =====
    if (target.classList.contains("decider-btn-add-cat")) {
      e.stopPropagation();
      var cat = target.dataset.cat;
      var input = document.querySelector('.decider-add-input[data-cat="' + cat + '"]');
      if (input) {
        addItem(cat, input.value);
        input.value = "";
      }
      return;
    }

    // ===== 删除项目 =====
    if (target.classList.contains("decider-del-item")) {
      e.stopPropagation();
      delItem(target.dataset.cat, parseInt(target.dataset.idx, 10));
      return;
    }

    // ===== 编辑项目 — 进入内联编辑 =====
    if (target.classList.contains("decider-edit-item")) {
      e.stopPropagation();
      var idx = parseInt(target.dataset.idx, 10);
      var cat = target.dataset.cat;
      var row = target.closest(".flex.items-center");
      if (!row) return;
      var textSpan = row.querySelector("span.flex-1");
      if (!textSpan) return;

      var accent = getAccent();
      var currentVal = textSpan.textContent;
      textSpan.innerHTML =
        '<input type="text" class="decider-inline-edit w-full rounded border ' + accent.border + ' bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none" value="' +
        escHtml(currentVal) +
        '" />';
      var editInput = textSpan.querySelector("input");
      if (editInput) {
        editInput.focus();
        editInput.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter") editItem(cat, idx, editInput.value);
        });
      }

      var actionDiv = row.querySelector(".decider-item-actions");
      if (actionDiv) {
        actionDiv.innerHTML =
          '<button class="decider-confirm-edit ' + accent.text + ' text-xs px-1" data-cat="' + cat + '" data-idx="' + idx + '">&#10003;</button>' +
          '<button class="decider-cancel-edit text-slate-400 hover:text-slate-300 text-xs px-1">&#10005;</button>';
      }
      return;
    }

    // ===== 确认编辑 =====
    if (target.classList.contains("decider-confirm-edit")) {
      e.stopPropagation();
      var _idx = parseInt(target.dataset.idx, 10);
      var _cat = target.dataset.cat;
      var inlineInput = document.querySelector(".decider-inline-edit");
      if (inlineInput) editItem(_cat, _idx, inlineInput.value);
      return;
    }

    // ===== 取消编辑 =====
    if (target.classList.contains("decider-cancel-edit")) {
      e.stopPropagation();
      refresh();
      return;
    }
  });
};

/**
 * 绑定事件
 */
var bindEvents = function () {
  setupDelegation();

  // 随机按钮
  var btnRoll = document.getElementById("decider-btn-roll");
  if (btnRoll) btnRoll.addEventListener("click", function () { doRoll(); });

  // 重抽按钮
  var btnReroll = document.getElementById("decider-btn-reroll");
  if (btnReroll) btnReroll.addEventListener("click", function () { doRoll([currentResult]); });

  // 复制按钮
  var btnCopy = document.getElementById("decider-btn-copy");
  if (btnCopy) btnCopy.addEventListener("click", handleCopy);

  // 展开/折叠列表（菜式 / 餐厅）
  var bindToggle = function (toggleId, listId, expandedKey) {
    var btn = document.getElementById(toggleId);
    var list = document.getElementById(listId);
    if (!btn || !list) return;
    btn.addEventListener("click", function () {
      if (expandedKey === "restListExpanded") {
        restListExpanded = !restListExpanded;
        list.classList.toggle("hidden");
        btn.textContent = restListExpanded ? "收起 ▴" : "查看全部 ▾";
      } else {
        listExpanded = !listExpanded;
        list.classList.toggle("hidden");
        btn.textContent = listExpanded ? "收起 ▴" : "查看全部 ▾";
      }
    });
  };
  bindToggle("decider-btn-toggle-list", "decider-foods-list", "listExpanded");
  bindToggle("decider-btn-toggle-rest-list", "decider-rests-list", "restListExpanded");

  // 分类添加输入的 Enter 键
  var inputs = document.querySelectorAll(".decider-add-input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var btn = document.querySelector('.decider-btn-add-cat[data-cat="' + this.dataset.cat + '"]');
        if (btn) btn.click();
      }
    });
  }

  // 空格键快速抽取
  document.addEventListener("keydown", function (e) {
    if (e.key !== " " && e.code !== "Space") return;
    var tag = document.activeElement ? document.activeElement.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    e.preventDefault();
    doRoll();
  });

  // 导出按钮
  var btnExport = document.getElementById("decider-btn-export");
  if (btnExport) btnExport.addEventListener("click", handleExport);

  // 导入按钮 → 触发隐藏的 file input
  var btnImport = document.getElementById("decider-btn-import");
  var fileInput = document.getElementById("decider-import-file");
  if (btnImport && fileInput) {
    btnImport.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      if (fileInput.files.length > 0) {
        handleImport(fileInput.files[0]);
        fileInput.value = "";
      }
    });
  }
};

// ====================== 渲染入口 ======================

/**
 * 渲染组件到容器
 */
export var initTheme = function () {
  var saved = localStorage.getItem("theme");
  if (saved && (saved === "night" || saved === "sakura" || saved === "forest")) {
    theme = saved;
  }
  document.documentElement.setAttribute("data-theme", theme);
};

export var render = function (container) {
  currentResult = "";
  container.innerHTML = html();
  bindEvents();
  return function () {};
};
