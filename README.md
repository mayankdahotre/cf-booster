# CF Booster

A Chrome extension for competitive programmers on [Codeforces](https://codeforces.com). Track solved problems, contest history, patterns, mistakes, spaced-repetition reviews, and analytics — with a sidebar on Codeforces problem pages.

**Not affiliated with Codeforces.**

## Features

- **Dashboard** — rating goals, streak, daily tasks, heatmap, charts
- **Tasks** — daily and weekly practice plans with auto-generated goals
- **Codeforces sync** — import your AC submissions and contest history via handle
- **Solved Problems** — searchable table with tags, techniques, notes
- **Pattern Library** — add and organize recognition triggers and techniques
- **Mistake Log** — record what went wrong and lessons learned
- **Review Queue** — spaced repetition for problems you've solved
- **Analytics** — weak topics, solve distribution, usage stats
- **CF Sidebar** — log observations while solving on Codeforces

## Install (beta — Load unpacked)

You need [Node.js](https://nodejs.org/) 18+ and Google Chrome.

### 1. Get the code

```bash
git clone https://github.com/mayankdahotre/cf-booster.git
cd cf-booster
```

Or download the latest **Source code** zip from [Releases](https://github.com/mayankdahotre/cf-booster/releases) and extract it.

### 2. Build the extension

```bash
npm install
npm run build
```

This creates a `dist` folder with the compiled extension.

### 3. Load in Chrome

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist` folder inside this project

### 4. Connect your account

1. Click the CF Booster icon in the toolbar
2. Click **Open Dashboard**
3. Go to **Settings** → enter your Codeforces handle → **Connect**

Your solved problems and contests will sync from the public Codeforces API.

## Updating

After pulling new changes:

```bash
npm install
npm run build
```

Then go to `chrome://extensions` and click the **Reload** icon on CF Booster.

## Development

```bash
npm run dev      # watch mode — reload extension after each change
npm run build    # production build to dist/
npm run lint     # ESLint
npm run package  # build + zip dist/ for GitHub Releases
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+C` | Open dashboard |
| `Alt+Shift+S` | Open search |
| `Alt+Shift+B` | Toggle sidebar on Codeforces |
| `Ctrl+K` | Global search (in dashboard) |

## Data & privacy

- All data is stored **locally** in your browser (IndexedDB)
- Connecting your handle fetches **public** data from the Codeforces API
- No passwords, no accounts on our servers — there are no servers

See [PRIVACY.md](./PRIVACY.md) for details.

## Project structure

```
src/
  background/     Service worker (messages, badge)
  content/        Codeforces sidebar
  popup/          Toolbar popup
  pages/          Dashboard routes
  db/             Dexie (IndexedDB) schema
  services/       Codeforces API & sync
dist/             Built extension (load this in Chrome)
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank dashboard | Reload the extension after `npm run build` |
| Still shows demo data | Settings → Connect or **Sync now** with your handle |
| Sidebar missing on CF | Ensure you're on `codeforces.com` and the extension is enabled |
| Build fails | Use Node 18+, delete `node_modules`, run `npm install` again |

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

Issues and pull requests are welcome. For bugs, include Chrome version, steps to reproduce, and any console errors from the extension service worker (`chrome://extensions` → CF Booster → **Service worker**).
