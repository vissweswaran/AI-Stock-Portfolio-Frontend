# AI Stock Portfolio — Frontend Guide (AGENTS.md)

This file documents the frontend for AI coding agents and humans: what is implemented,
how it is structured, the rules it follows, and exactly where to add or fix things.

Read this file before changing anything. Follow the existing patterns — do not introduce
new frameworks, state libraries, CSS systems, or folder layouts.

---

## 1. What This App Is

A personal stock portfolio management and analysis UI. It lets the user record buy
transactions, view current holdings, run fundamental-rule analysis on their stocks,
track dividends, see portfolio summaries, and get "Portfolio Intelligence" insights.

It is a pure SPA client. All data comes from the backend REST API
(repo: `AI-Stock-Portfolio`, expected at `http://localhost:5000`).
There is no auth, no persistence, and no direct database access from this app.

---

## 2. Tech Stack (do not change without explicit instruction)

| Concern        | Choice                                   | Why |
|----------------|------------------------------------------|-----|
| Framework      | React 19 (JavaScript JSX, **not** TypeScript) | Project was scaffolded as the JS Vite template |
| Build tool     | Vite 8 (`@vitejs/plugin-react`, Oxc-based) | Fast HMR, zero-config |
| Styling        | Tailwind CSS v4 via `@tailwindcss/vite` plugin | Utility classes only; there are no CSS modules or styled-components |
| Routing        | `react-router-dom` v7 (`BrowserRouter`) | Client-side routes defined only in `src/App.jsx` |
| HTTP           | `axios` (single configured instance) | Central base URL + timeout in one place |
| Charts         | `recharts` | Used by `PortfolioCharts.jsx` |
| Toasts         | `react-hot-toast` (`Toaster` mounted in `App.jsx`, top-right) | Success/error feedback |
| Icons          | `react-icons/fi` (Feather icons) | Sidebar menu + buttons |
| Linter         | `oxlint` (config: `.oxlintrc.json`) | `npm run lint` must stay clean of NEW errors |

Package manager: **npm** (`package-lock.json` exists — use `npm ci`).
Node: developed against Node 24. No `engines` field is declared.

---

## 3. Commands

```bash
npm install        # first setup (or: npm ci for clean lockfile install)
npm run dev        # start dev server -> http://localhost:5173 (binds 0.0.0.0 for LAN)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run lint       # oxlint
```

There is **no test script and no test framework** on the frontend.
Do not add one unless asked.

The dev server proxies `/api/*` to the backend:

```js
// vite.config.js
server: {
  host: true,      // 0.0.0.0 so LAN devices can reach it
  port: 5173,
  proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true,
                     rewrite: (path) => path.replace(/^\/api/, '') } },
}
```

**Rule:** the backend strips the `/api` prefix itself is done HERE — backend routes have
no `/api` prefix. If you change the prefix, you must change the rewrite AND nothing else.

---

## 4. Environment Variables

| Variable            | Required | Default   | Meaning |
|---------------------|----------|-----------|---------|
| `VITE_API_BASE_URL` | No       | `/api`    | Axios base URL. Leave unset in dev (uses the Vite proxy). Only set for production deploys where the API lives on another origin. |

There are no `.env*` files committed and none are required for local development.
Never invent secrets/API keys here — the frontend holds none.

---

## 5. Directory Map (where everything lives)

```
index.html                  Vite entry HTML (title: portfolio-ai-frontend, <div id="root">)
vite.config.js              Plugins (react, tailwindcss) + dev server + /api proxy
.oxlintrc.json              Lint rules (react/hooks + oxc)
public/                     Static assets served at root (favicon.svg, icons.svg)
src/
  main.jsx                  React root render. NOTE: imports StrictMode but does NOT use it (known lint warning — leave unless asked)
  App.jsx                   Router + Toaster + layout wrapper. ALL routes live here.
  index.css                 Tailwind entry (@import "tailwindcss")
  layouts/
    MainLayout.jsx          Sidebar nav + header + <Outlet/>. The menu array at the top defines sidebar items.
  pages/                    One file per route. Pages own data fetching, forms, modals.
    DashboardPage.jsx             "/"        Portfolio overview + summary cards + charts, buy opportunities
    TransactionsPage.jsx          "/transactions"  CRUD for buy transactions (modal form + StockSearch autocomplete)
    HoldingsPage.jsx              "/holdings"      Current aggregated holdings
    AnalysisPage.jsx              "/analysis"      Run/view fundamental analysis results
    SmartAnalysisPage.jsx         "/smart-analysis"  Sector-aware analysis UI (decision, valuation, DCF, rankings)
    PortfolioIntelligencePage.jsx "/portfolio-intelligence"  AI-style insights (strength, suitability, thesis, opportunities, sell watch)
    DividendsPage.jsx             "/dividends"     Dividend history per year
  components/               Reusable presentational building blocks (PascalCase files)
    Button.jsx Card.jsx cardThemes.js DataTable.jsx EmptyState.jsx ErrorMessage.jsx
    Input.jsx Loader.jsx Modal.jsx ConfirmDialog.jsx SearchBox.jsx StockSearch.jsx
    StockDataSync.jsx PortfolioCharts.jsx
  hooks/
    useApi.js               THE data-fetching hook. Returns { data, loading, error, refetch, setData }.
  services/
    api.js                  Single axios instance + apiService object with ONE method per endpoint.
  utils/
    formatters.js           formatDate / formatMoney / formatNumber helpers. Always use these for display.
  assets/                   Images (hero.png, vite.svg, react.svg)
```

---

## 6. Core Patterns (how things are done here)

### 6.1 Data fetching — always through `useApi` + `apiService`

```jsx
import useApi from '../hooks/useApi'
import apiService from '../services/api'

const { data, loading, error, refetch } = useApi(() => apiService.getHoldings(), [])
```

Rules:
- Never call `axios` directly from a component.
- Never hardcode URLs. Every endpoint gets a named method in `src/services/api.js`.
- Pass reactive values in the dependency array (2nd arg) so `useApi` refetches when they change.
- `error` already contains `apiError.response?.data?.message || apiError.message`.
  Render it with `<ErrorMessage />`; do not swallow it silently.
- For mutations (POST/PUT/DELETE): call `apiService.xxx(...)` directly in the handler,
  show a toast, then call `refetch()` (see any save/delete function in `TransactionsPage.jsx`).

### 6.2 Page anatomy

Every page follows the same shape (copy an existing page when adding one):
1. `useApi` for the list/data.
2. `useState` for local UI state (search text, modal open, editing row, form fields, errors).
3. `useMemo` for filtered/derived lists.
4. Local `validateForm(form)` helper returning an errors object.
5. Render: `<Loader />` while loading, `<ErrorMessage />` on error,
   `<EmptyState />` when empty, `<DataTable />` for tables, `<Modal />` +
   `<Input />`/`<StockSearch />` for create/edit, `<ConfirmDialog />` for deletes.
6. Formatting ONLY via `utils/formatters.js`.

### 6.3 Styling

Tailwind utility classes inline in JSX. Slate palette for neutrals, blue-600 as the
primary accent (see `MainLayout.jsx`). Reusable visual variants live in
`components/cardThemes.js`. Do not add global CSS beyond `index.css`.

### 6.4 Backend connectivity

Dev request path:
`component -> apiService (axios baseURL '/api') -> Vite dev proxy (:5173) ->
http://localhost:5000/<path-without-/api> -> Express`

If pages show network errors, check the BACKEND first (it must be running on :5000).

---

## 7. What Is Implemented (page <-> endpoint map)

| Page (route) | apiService methods used | Backend endpoints consumed |
|---|---|---|
| Dashboard `/` | `getDashboard()`, `getSummary()`, `getAnalysisPortfolio()` | GET `/dashboard`, GET `/summary`, GET `/analysis/portfolio` |
| Transactions `/transactions` | `getTransactions()`, `createTransaction()`, `updateTransaction()`, `deleteTransaction()` | GET/POST `/transactions`, PUT/DELETE `/transactions/:id` |
| Holdings `/holdings` | `getHoldings()` | GET `/holdings` |
| Analysis `/analysis` | `runAnalysis()`, `getScores()`, `getScoreBySymbol()` | POST `/analyze`, GET `/score`, GET `/score/:symbol` |
| Smart Analysis `/smart-analysis` | `getDashboard()`, `getAnalysisPortfolio()`, `analyzeAnalysisPortfolio()`, `syncPortfolioData()`, `getAnalysisReadiness(symbol)`, `getMergedAnalysis(symbol)` | GET `/dashboard`, GET `/analysis/portfolio`, POST `/analysis/analyze`, POST `/portfolio/sync`, GET `/analysis/readiness/:symbol`, GET `/analysis/:symbol` |
| Intelligence `/portfolio-intelligence` | `getPortfolioIntelligence()`, `getPortfolioIntelligenceBySymbol()`, `syncPortfolioData()` | GET `/portfolio/intelligence[/:symbol]`, POST `/portfolio/sync` |
| Dividends `/dividends` | `getDividends(year)`, `getDividendBySymbol(symbol, year)` | GET `/dividends`, GET `/dividends/:symbol` |

Also available in `api.js`: `searchStocks(query)` -> GET `/stocks/search?q=`
(used by `StockSearch.jsx` autocomplete inside the transaction modal),
`getHealth()` -> GET `/health`, and the per-stock/per-dataset sync methods
`syncMarketData(symbol?)` / `syncFinancialData(symbol?)` / `syncOwnershipData(symbol?)` /
`syncCorporateActions(symbol?)` -> POST `/market-data/sync[/:symbol]`,
`/financial-data/sync[/:symbol]`, `/ownership/sync[/:symbol]`, `/corporate-actions/sync[/:symbol]`
(used by `StockDataSync.jsx` inside the Smart Analysis expanded stock rows).

---

## 8. How to Add a Feature (step-by-step, in order)

Adding a page that shows new backend data:

1. `src/services/api.js` — add one method to `apiService`
   (e.g. `getWatchlist: () => get('/watchlist')`). One line, named clearly.
2. Create `src/pages/WatchlistPage.jsx` — copy the closest existing page and adapt.
   Fetch via `useApi`, render with existing components only.
3. Register route in `src/App.jsx` inside the `<Route element={<MainLayout />}>` group.
4. Add the sidebar item to the `menu` array in `src/layouts/MainLayout.jsx`
   (label, path, icon from `react-icons/fi`).
5. Use `formatDate/formatMoney/formatNumber` from `utils/formatters.js` for all values.
6. Run `npm run lint` — do not introduce new warnings/errors.
7. Verify against a running backend (`npm run dev` in `AI-Stock-Portfolio` first).

Adding a reusable UI element: new file in `src/components/` (PascalCase),
props-driven, Tailwind classes, no data fetching inside components (pages fetch).

Adding a derived value/formatter: extend `src/utils/formatters.js`, never inline money/date math in pages.

---

## 9. Project Rules (hard rules for agents)

1. JavaScript only — do not convert to TypeScript, do not add `tsconfig.json`.
2. Keep npm dependencies exactly as they are; never bump versions opportunistically.
3. Do not swap Tailwind for another styling system; do not add CSS frameworks.
4. All routing changes happen ONLY in `src/App.jsx` (+ `MainLayout.jsx` menu).
5. All API access happens ONLY via `src/services/api.js`.
6. Do not change request/response shapes the backend returns — they are owned by the backend repo.
7. Do not add auth, global state managers (Redux/Zustand), or server-state libraries (React Query). `useApi` is the pattern.
8. Keep components dumb: fetching belongs in pages via `useApi`.
9. Lint must pass (`npm run lint`) after your change; pre-existing warnings in
   `useApi.js`, `StockSearch.jsx`, `main.jsx` may remain but don't add new ones.
10. `npm run build` must succeed after your change.
11. Do not edit `vite.config.js` proxy/port unless the task is explicitly about connectivity.

---

## 10. Known Gotchas

- **Blank page / all requests fail**: backend isn't running. Start it first
  (`npm run dev` in `../AI-Stock-Portfolio`, listens on :5000). Check `GET :5000/health`.
- **`main.jsx` imports `StrictMode` without rendering with it** — intentional template leftover;
  produces a known oxlint warning. Leave it alone unless asked to clean up.
- **Chunk-size warning on build** (~728 kB JS) — known, non-blocking, do not "fix" casually.
- **Dates** come from the backend as ISO strings; always slice/format via formatters
  (`transaction.buyDate.slice(0, 10)` for date inputs is the established pattern).
- **Symbols include exchange suffixes** (e.g. `CASTROLIND.NS`) — do not strip them in the UI;
  the backend uses them to resolve market data.
