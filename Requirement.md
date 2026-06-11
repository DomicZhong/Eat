# Role: 资深全栈工程师 & DevOps 专家

## 1. 项目愿景 (Vision)
构建一个名为 **"UsTime"** 的静态单页应用 (SPA)。
- **用户画像**: 我 ISTP (务实/逻辑/动手派) & 女朋友 ISFJ (细腻/守序/关怀派)。
- **核心价值**: 消除决策疲劳，提供低摩擦的互动方式，增强情感连接。随机决策、惊喜投递。
- **部署目标**: GitHub Pages (通过 GitHub Actions 自动部署)。

## 2. 技术栈与工程规范 (Tech Stack & Standards)
**原则**: 零后端依赖，纯前端逻辑，模块化，易维护。

| 类别 | 技术选型 | 备注 |
| :--- | :--- | :--- |
| **构建工具** | **Vite 6.x** | 极速热更新，简单的静态文件输出。 |
| **语言** | **JavaScript (ES6 Modules)** | 不使用 TypeScript，减少认知负荷。 |
| **框架** | **Vanilla JS** | 原生 DOM 操作，无虚拟 DOM 开销。 |
| **样式** | **Tailwind CSS v4** | 原子化 CSS，快速构建工业极简风界面。 |
| **路由** | **Hash Router** | 手动实现基于 `#` 的路由，无第三方库。 |
| **存储** | **LocalStorage** | 通过 `store.js` 统一封装 CRUD 逻辑。 |
| **部署** | **GitHub Actions** | 自动构建并部署 `dist/` 到 GitHub Pages。 |

## 3. 强制目录结构 (Mandatory Structure)
请严格遵循此结构生成代码，确保关注点分离：


ustime/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions 工作流配置
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/              # 图片等资源
│   ├── components/          # 页面级组件
│   │   ├── decider.js       # 随机决策器 (核心功能)
│   │   ├── jar.js           # 默契储蓄罐
│   │   └── quests.js        # 协作清单
│   ├── styles/
│   │   └── main.css         # Tailwind 指令及全局样式
│   ├── utils/
│   │   └── helpers.js       # 工具函数 (randomPick, shuffle 等)
│   ├── store.js             # LocalStorage 抽象层
│   ├── router.js            # Hash Router 逻辑
│   └── main.js              # 应用入口
├── index.html               # SPA 主入口
├── vite.config.js           # Vite 配置 (Base Path 至关重要)
├── package.json
└── README.md


## 4. 核心功能详解 (Feature Breakdown)

### A. 随机决策器 (The Decider) - 【核心功能】
UI 分为两部分：**分类随机** 和 **一键全局**。

*   **数据源 (`src/utils/helpers.js`)**:
    javascript
    export const options = {
      food: ["火锅", "日料", "家常菜", "烧烤"],
      activity: ["看电影", "拼模型", "散步", "打游戏"],
      reward: ["一个拥抱", "按摩10分钟", "免做家务券"],
      relationship: ["聊聊开心的事", "规划旅行", "回忆第一次约会"] // 专门给 ISFJ 的情感话题
    };


*   **UI 布局 (Grid 布局)**:
    1.  **顶部**: 大号字体显示当前结果。
    2.  **中部 (分类按钮)**: 四个独立的方形按钮，对应 Food, Activity, Reward, Relationship。
        *   *交互*: 点击哪个，就只随机那个类别的内容，并在顶部显示。
    3.  **底部 (全局按钮)**: 一个宽大的主按钮 "🎲 Random All"。
        *   *交互*: 从四个类别各抽一个，组合成一句话。
        *   *格式*: "今晚吃 [Food]，然后 [Activity]，结束时 [Reward]。别忘了 [Relationship]。"

### B. 默契储蓄罐 (Memory Jar)
*   **功能**: 输入文字存入 LocalStorage，点击随机读取一条。
*   **UI**: TextArea + Save Button + Display Area。

### C. 协作清单 (Quest Log)
*   **功能**: 类似游戏任务列表，添加任务，勾选完成，显示进度条。
*   **UI**: Input + Add Button + List (with checkboxes) + Progress Bar。

## 5. 设计系统 (Design System)
*   **主题**: **Industrial Dark Mode** (工业暗黑风)。
*   **色彩心理学**:
    *   **背景**: `slate-950` (极深灰，护眼)。
    *   **表面**: `slate-900` (卡片背景)。
    *   **边框**: `slate-700` (低对比度分割线)。
    *   **ISTP 主色**: `emerald-500` (沉稳的绿，用于 Activity/Reward 按钮)。
    *   **ISFJ 主色**: `rose-500` (温暖的红，用于 Relationship/Food 按钮)。
*   **排版**: 无衬线字体 (Inter/system-ui)，字重分明。

## 6. DevOps 与 GitHub Pages 配置 (Critical)
*   **Vite Base Path**: 必须在 `vite.config.js` 中设置 `base: '/ustime/'` (如果是根域名则为 `/`)。
*   **GitHub Actions**:
    *   使用 `ubuntu-latest` 环境。
    *   Node.js 版本: `20`.
    *   构建命令: `npm run build`.
    *   部署 Action: `actions/deploy-pages@v4`.

## 7. 开发指令 (Implementation Plan)
请按顺序执行以下步骤，每步结束后等待确认：

1.  **Step 1 (Setup)**: 生成 `package.json`, `vite.config.js`, 和 `.github/workflows/deploy.yml`。
2.  **Step 2 (HTML & CSS)**: 生成 `index.html` 和 `src/styles/main.css`，引入 Tailwind，搭建基础布局骨架。
3.  **Step 3 (Utils & Store)**: 生成 `src/utils/helpers.js` (包含数据和 `randomPick`) 和 `src/store.js` (LocalStorage 封装)。
4.  **Step 4 (Router & Main)**: 生成 `src/router.js` (Hash Router 逻辑) 和 `src/main.js` (挂载点)。
5.  **Step 5 (Components)**: 生成 `src/components/decider.js` (包含完整的 Grid 布局和事件监听)，然后是 `jar.js` 和 `quests.js`。

## 8. 代码风格要求
*   使用 `const` 和 `let`，严禁使用 `var`。
*   使用箭头函数 (`=>`) 简化上下文。
*   每个函数必须包含 JSDoc 注释，解释其用途。
*   代码必须整洁，无 `console.log` 残留。

**Please start now. Begin with Step 1.**