# UsTime

为 ISTP & ISFJ 情侣构建的静态单页应用 — 消除决策疲劳，增强情感连接。

🔗 **在线地址**：[domiczhong.github.io/ustime](https://domiczhong.github.io/ustime/)

## 功能

### 🎲 随机决策器

吃什么、做什么、奖励、情感话题 —— 四个类别独立随机，也支持一键全局组合。

- 46 种饮食 × 50 种活动 × 32 种奖励 × 33 个情感话题，从互联网广泛搜集
- **历史防重复**：7 天内重复选中会提示"最近已选过 X 次"
- **快速重抽**：不满意当前结果？点"换一个"自动排除上次选项
- **一键复制**：结果直接复制到剪贴板，发给对方
- **纪念日倒计时**：`💕 在一起 956 天 14时32分07秒`，每秒刷新

### 🏺 默契储蓄罐

写入想说的话、小愿望、小秘密，随机抽取惊喜。

- **作者标记**：ISTP / ISFJ 身份标签，知道是谁写的
- **不重复抽取**：抽过的卡片不再出现，全抽完后自动洗牌
- 单条删除 + 时间戳，精细管理

### 📋 协作清单

游戏化任务列表，追踪进度。

- **任务指派**：ISTP / ISFJ / 一起，颜色区分
- **分人统计**：各自完成进度独立显示
- 勾选完成、单条删除、清除已完成

## 技术栈

| 类别 | 选型 |
|---|---|
| 构建 | Vite 6 |
| 语言 | JavaScript (ES6 Modules) |
| 样式 | Tailwind CSS v4 |
| 路由 | 手动 Hash Router（动态 import） |
| 存储 | LocalStorage（统一封装） |
| 部署 | GitHub Actions → GitHub Pages |

## 本地开发

```bash
npm install
npm run dev       # 热更新开发服务器
npm run build     # 生产构建 → dist/
npm run preview   # 本地预览生产版本
```

## 部署

推送 `main` 分支后 GitHub Actions 自动构建部署。详见 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。

```bash
git push origin main
```

## 目录结构

```
├── .github/workflows/deploy.yml   # CI/CD
├── src/
│   ├── components/
│   │   ├── decider.js             # 决策器
│   │   ├── jar.js                 # 储蓄罐
│   │   └── quests.js              # 任务清单
│   ├── utils/
│   │   ├── helpers.js             # 数据源 + 工具函数
│   │   └── history.js             # 决策历史记录
│   ├── styles/main.css            # Tailwind + 全局样式
│   ├── store.js                   # LocalStorage 封装
│   ├── router.js                  # Hash Router
│   └── main.js                    # 入口
├── index.html                     # SPA 骨架
└── vite.config.js                 # Vite 配置
```
