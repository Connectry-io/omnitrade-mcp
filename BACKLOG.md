
## Security / Dependency Maintenance

- **npm audit — 3 moderate vulnerabilities in `blessed-contrib` (via `xml2js`):** Fix requires `npm audit fix --force` which may break the TUI dashboard. Revisit when blessed-contrib releases a patch or when we upgrade the TUI library. Low urgency (moderate only, CLI tool, no untrusted input). Added 2026-02-18.

## Phase 2 — QA Follow-ups (non-blocking)

- **Cost basis fee tracking:** `holding.totalCost` excludes buy fees — per-holding P&L is ~0.1% optimistic per buy. Total portfolio P&L is accurate. Fix: include fee in `totalCost` on buy.
- **`paper reset` missing from top-level help:** Shows in `omnitrade paper help` but not the main `omnitrade help` screen. Cosmetic fix.
- **SVG gradient ID collision:** IDs use `symbol.replace(/\//g, '_')` — fine for standalone use, could conflict if multiple charts embedded in same HTML page. Low priority.
