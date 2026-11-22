# T-01 — Baseline Gate Record

## Environment
- Date: 2026-10-05
- Node: v24.18.0, npm: 11.16.0
- Astro: ^5.3.0
- Repo: cncf-peshawar.github.io-main @ commit e86ed53 (chore: import baseline for redesign)
- Branch: redesign/ui-motherduck

## Gate Results
| Step | Command | Exit | Verdict |
|---|---|---|---|
| check | npm run check | 0 | PASS |
| build | npm run build | 0 | PASS |
| test  | npm test      | 0 | PASS |
| links | npm run check:links | 0 | PASS |

## Failure Detail (per failed step)
*(None — all 4 gate steps passed cleanly with exit code 0)*

### Gate Command Logs Summary
#### npm run check
- Exit: 0
- Result: 43 files scanned, 0 errors, 0 warnings, 42 hints

#### npm run build
- Exit: 0
- Result: 16 page(s) built in 3.19s, static routes generated successfully

#### npm test
- Exit: 0
- Result: 119/119 passed across all 4 tiers (Tier 1: 49/49, Tier 2: 52/52, Tier 3: 12/12, Tier 4: 6/6)

#### npm run check:links
- Exit: 0
- Result: 16 HTML pages scanned, 488 internal links & assets verified, 0 broken links

## Build Artifacts
- dist/ size: 32M
- dist/ top-level: 404.html, _astro, admin, assets, blog, code-of-conduct, config.yml, events, favicon.svg, images, index.html, speak, sponsors, team
- dist/admin/ present: YES (config.yml, index.html present)

## Site-level observations
- Stale "Sep 26 2026 upcoming" in built HTML: YES
  - dist/events/index.html (`Sep 26, 2026`, `Upcoming Meetup (Capacity: 500)`)
  - dist/events/02-the-cloud-native-launchpad-docker-kubernetes-real-deployments/index.html (`Date: 2026-09-26`)
- theme-color meta: #0d00ff
- og:image: https://cncf-peshawar.github.io/images/og-default.svg
- twitter:card: summary_large_image

## package-lock drift
- npm ci succeeded: YES
- fallback to npm install: NO
- lockfile modified then reverted: NO

## Known baseline failures (carried forward, not fixed by redesign)
- None (baseline quality gate is 100% green: 4/4 passes)
