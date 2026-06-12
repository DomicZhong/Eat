# UsTime

为 ISTP ♥ ISFJ 情侣构建的静态单页应用 — 消除决策疲劳，增强情感连接。

🔗 **在线地址**：[domiczhong.github.io/ustime](https://domiczhong.github.io/ustime/)

## 功能

### 🎲 随机决策器

吃什么、做什么、奖励、情感话题、私密奖励 —— 五个类别独立随机，也支持一键全局组合。

- 46 种饮食 × 50 种活动 × 32 种奖励 × 33 个情感话题 × 40+ 私密奖励
- **历史防重复**：7 天内重复选中会提示
- **快速重抽**：不满意点"换一个"，自动排除上次选项
- **一键复制**：结果复制到剪贴板
- **选项可自定义**：在数据管理页面增删改所有选项
- **特殊天数横幅**：100/365/520/1000/1314 天等里程碑在首页展示

### 💕 纪念日

- 天数大字渐变 + 时分秒实时流动
- ISTP ♥ ISFJ 个性化展示
- 始于 2023.10.08

### 🏺 默契储蓄罐

写入想说的话、小愿望、小秘密，随机抽取惊喜。

- **作者记忆**：自动记住上次选择的作者，下次打开默认不变
- **不重复抽取**：抽过的卡片不再出现，全抽完后自动洗牌
- **摇晃动效**：点击抽取后罐子摇晃 0.5 秒再揭晓，像拆礼物
- **导航栏角标**：储蓄罐图标显示未抽取数量
- **查看全部**：展开/折叠所有笔记列表
- 单条删除 + 时间戳

### 📋 协作清单

游戏化任务列表，追踪进度。

- **任务指派**：ISTP / ISFJ / 一起，颜色区分
- **快速连续添加**：添加后输入框不清空，可连续录入
- **分人统计**：各自完成进度独立显示
- 勾选完成、单条删除、清除已完成

### ⚙️ 数据管理

- **决策选项编辑**：增删改所有决策类别的选项，恢复默认值
- **用户数据查看**：储蓄罐笔记、任务清单、决策历史详情
- **导出/导入**：JSON 备份与恢复
- **清空数据**：二次确认防止误操作
- **🎨 三主题切换**：🌙 暗夜 / 🌸 暖樱 / 🌿 森林

## 技术栈

| 类别 | 选型 |
|---|---|
| 构建 | Vite 6 |
| 语言 | JavaScript (ES6 Modules) |
| 样式 | Tailwind CSS v4 + CSS 变量主题系统 |
| 路由 | 手动 Hash Router（动态 import 代码分割） |
| 存储 | LocalStorage（统一封装） |
| 部署 | GitHub Actions → GitHub Pages |

## 开发指南

### 前置条件

- [Node.js](https://nodejs.org/) 18+（推荐 20 LTS）
- [Git](https://git-scm.com/)

### 本地开发

```bash
git clone https://github.com/DomicZhong/ustime.git
cd ustime
npm install
npm run dev       # 启动 Vite 开发服务器，支持热更新
```

### 生产构建

```bash
npm run build     # 输出到 dist/
npm run preview   # 本地预览生产版本
```

### 发布

推送 `main` 分支后 GitHub Actions 自动构建部署到 GitHub Pages。

```bash
git push origin main
```

## 目录结构

```
├── .github/workflows/deploy.yml   # CI/CD 自动部署
├── src/
│   ├── components/
│   │   ├── decider.js             # 随机决策器
│   │   ├── anniversary.js         # 纪念日页面
│   │   ├── jar.js                 # 默契储蓄罐
│   │   ├── quests.js              # 协作清单
│   │   └── settings.js            # 数据管理 + 主题切换
│   ├── utils/
│   │   ├── helpers.js             # 数据源 + 工具函数 + 纪念日计算
│   │   └── history.js             # 决策历史记录（7天滑动窗口）
│   ├── styles/main.css            # Tailwind + 主题变量 + 动画
│   ├── store.js                   # LocalStorage CRUD 封装
│   ├── router.js                  # Hash Router
│   └── main.js                    # 应用入口 + 主题初始化
├── index.html                     # SPA 骨架 + 底部导航栏
├── vite.config.js                 # Vite 配置（base: '/ustime/'）
└── package.json
```
