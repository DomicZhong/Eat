# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**UsTime** — a static SPA for a couple (ISTP + ISFJ). It eliminates decision fatigue through random selection and low-friction interaction. Deployed to GitHub Pages.

Full specification: [Requirement.md](Requirement.md).

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Production build into dist/
npm run preview  # Preview the production build locally
```

There is no test suite or linter configured yet.

## Tech Stack

| Concern | Choice |
|---|---|
| Build | Vite 6.x |
| Language | JavaScript (ES6 Modules) — no TypeScript |
| Framework | Vanilla JS (native DOM, no virtual DOM) |
| Styling | Tailwind CSS v4 (atomic CSS) |
| Routing | Manual hash-based router (`src/router.js`) |
| Persistence | LocalStorage via `src/store.js` abstraction |
| Deploy | GitHub Actions → GitHub Pages (`actions/deploy-pages@v4`) |

## Directory Structure

```
ustime/
├── .github/workflows/deploy.yml   # CI/CD: build + deploy to Pages
├── public/favicon.svg
├── src/
│   ├── assets/                    # Images / static assets
│   ├── components/
│   │   ├── decider.js             # Core: random decision maker
│   │   ├── jar.js                 # Memory jar (save & retrieve notes)
│   │   └── quests.js              # Collaborative quest/task list
│   ├── styles/main.css            # Tailwind directives + global styles
│   ├── utils/helpers.js           # Data (food, activity, reward, relationship) + randomPick, shuffle
│   ├── store.js                   # LocalStorage CRUD wrapper
│   ├── router.js                  # Hash router
│   └── main.js                    # App entry point, mounts router
├── index.html                     # SPA shell
├── vite.config.js                 # Base path MUST be '/ustime/' for Pages
└── package.json
```

## Architecture

- **Entry**: `index.html` loads `src/main.js` as an ES module. `main.js` initializes the hash router and mounts the current page component.
- **Routing**: `src/router.js` listens for `hashchange` and renders the matching component into the app shell. No library — manual `window.location.hash` parsing.
- **Data flow**: Components read/write through `src/store.js` (a thin LocalStorage wrapper). Decision data (food, activities, etc.) lives in `src/utils/helpers.js` as exported constants.
- **Styling**: Tailwind v4 via `src/styles/main.css`. Theme is Industrial Dark Mode: `slate-950` background, `slate-900` cards, `emerald-500` (ISTP) and `rose-500` (ISFJ) accent colors.

## Key Constraints

- **Vite `base`** must be `'/ustime/'` in `vite.config.js` for GitHub Pages to resolve assets correctly.
- GitHub Actions uses Node 20 on `ubuntu-latest`, builds with `npm run build`, deploys with `actions/deploy-pages@v4`.
- No `var`, no `console.log` in production code. Arrow functions preferred. Every function needs a JSDoc comment.
