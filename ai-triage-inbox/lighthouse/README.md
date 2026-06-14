# Lighthouse (desktop)

Run against the production preview (`pnpm build && pnpm preview`), desktop preset.

| Category       | Score |
| -------------- | ----- |
| Performance    | 100   |
| Best Practices | 100   |
| Accessibility  | 96    |

- `desktop-scores.png` — score summary screenshot
- `desktop-report.html` — full Lighthouse report (open in a browser)

## What changed to improve performance

- System font stack — no web-font network request or layout shift.
- Inline SVG favicon — removes an extra request and a 404 (also a Best Practices win).
- Small bundle (~63 KB gzipped JS) — Vite production build, no heavy deps, no runtime CSS-in-JS (CSS Modules).
- `React.memo` on inbox rows + a dedicated AI cache store (`useSyncExternalStore`) so streaming the draft re-renders only the AI panel, not the list.
- Debounced client-side search.

## What I intentionally did NOT optimize (and why)

- **No list virtualization** — only ~26 items; virtualization adds deps/complexity for no measurable gain at this scale. Memo boundaries are already in place for when the list grows.
- **No route-level code splitting** — single-view SPA; one small chunk is optimal.

## How to reproduce

```bash
pnpm build && pnpm preview     # serves dist/ (note the port)
# In Chrome: DevTools → Lighthouse → Desktop → Performance + Best Practices + Accessibility → Analyze
```
