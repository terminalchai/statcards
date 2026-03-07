# StatCards

> Generate beautiful GitHub stats cards — enter a username, pick a theme, export as PNG.

**[🚀 Live Demo → statcards.vercel.app](https://statcards.vercel.app/)**

---

## Features

- **6 beautiful themes** — Midnight, Dracula, GitHub Dark, Tokyo Night, Nord, Solarized
- **Rich stats** — Stars, Repos, Forks, PRs, Followers + top languages bar
- **One-click export** — High-res PNG download or copy to clipboard
- **Fully local** — no backend, no API key, no uploads
- **CORS-safe** — avatar pre-converted to base64 for clean exports

## Tech Stack

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

- **GitHub REST API** — public endpoints, no auth required
- **[html-to-image](https://github.com/bubkoo/html-to-image)** — high-res PNG export
- **[Playwright](https://playwright.dev/)** — 42 automated tests across 3 viewports

## Run Locally

```bash
git clone https://github.com/terminalchai/statcards.git
cd statcards
npm install
npm run dev
```

## Tests

```bash
npx playwright test
```

42 tests across Desktop, Tablet, and Mobile viewports.

---

Built by [Terminal Chai](https://github.com/terminalchai)
