# UsTime

为 ISTP & ISFJ 情侣构建的静态单页应用 — 消除决策疲劳，增强情感连接。

🔗 **在线地址**：[domiczhong.github.io/ustime](https://domiczhong.github.io/ustime/)

## 功能

### 🎲 随机决策器

吃什么、做什么、奖励、情感话题、私密奖励 —— 五个类别独立随机，也支持一键全局组合（不含私密）。

- 46 种饮食 × 50 种活动 × 32 种奖励 × 33 个情感话题 × 40+ 私密奖励
- **历史防重复**：7 天内重复选中会提示"最近已选过 X 次"
- **快速重抽**：不满意当前结果？点"换一个"自动排除上次选项
- **一键复制**：结果直接复制到剪贴板，发给对方
- Random All 四合一组合随机，多行 emoji 排版

### 💕 纪念日

独立纪念日页面，宽松多行排版，记录在一起的点滴。

- 天数大字突出 + 时分秒实时流动
- "时间的流逝，是我爱你的证明"
- 始于 2023.10.08 凌晨 01:03:02

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

## 协作者指南

### 前置条件

- [Node.js](https://nodejs.org/) 18+（推荐 20 LTS）
- [Git](https://git-scm.com/)
- 一个 GitHub 账号，并已被添加为仓库协作者

### 克隆项目

```bash
git clone https://github.com/DomicZhong/ustime.git
cd ustime
```

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev       # 启动 Vite 开发服务器，支持热更新
```

浏览器打开终端输出的地址（默认 `http://localhost:5173/ustime/`）即可预览。

### 生产构建

```bash
npm run build     # 输出到 dist/
npm run preview   # 本地预览生产版本
```

`npm run build` 会生成优化后的静态文件到 `dist/` 目录。

### 提交代码

```bash
# 创建功能分支
git checkout -b feature/你的功能名

# 修改代码后提交
git add .
git commit -m "feat: 描述你的改动"

# 推送到 GitHub
git push origin feature/你的功能名
```

然后在 GitHub 上创建 Pull Request 合并到 `main` 分支。

### 发布到 GitHub Pages

推送 `main` 分支后 GitHub Actions 会自动构建并部署，无需手动操作。

```bash
git checkout main
git pull origin main
git push origin main
```

部署流水线详见 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。部署完成后访问 [domiczhong.github.io/ustime](https://domiczhong.github.io/ustime/) 查看。

### 同步上游变更

```bash
git checkout main
git pull origin main
```

## 目录结构

```
├── .github/workflows/deploy.yml   # CI/CD 自动部署
├── src/
│   ├── components/
│   │   ├── decider.js             # 随机决策器
│   │   ├── anniversary.js         # 纪念日页面
│   │   ├── jar.js                 # 默契储蓄罐
│   │   └── quests.js              # 协作清单
│   ├── utils/
│   │   ├── helpers.js             # 数据源 + 工具函数 + 纪念日计算
│   │   ├── history.js             # 决策历史记录（7天滑动窗口）
│   │   └── store.js               # LocalStorage CRUD 封装
│   ├── styles/main.css            # Tailwind 指令 + 全局样式 + 按钮
│   ├── router.js                  # Hash Router（动态 import 代码分割）
│   └── main.js                    # 应用入口
├── index.html                     # SPA 骨架 + 底部导航栏
├── vite.config.js                 # Vite 配置（base: '/ustime/'）
└── package.json
```
