# Visual Density & Typography Audit Report (T-UI-7)

> **Specification / Directive:** Task T-UI-7 — Visual density & typography audit of `/` and `/sponsors`  
> **Status:** READ-ONLY AUDIT COMPLETE (Zero code changes to `src/**`, `public/**`, or protected files)  
> **Date:** 2026-10-14  
> **Auditor Role:** Executor (Antigravity)  
> **Head Commit:** `0ae8e62332851d28ffbe859d9bdb45c05782092f` (`redesign/ui-motherduck`)  
> **Governing Standards:** `DESIGN.md`, `docs/redesign/md-motion-spec.md`, `docs/redesign/stitch/` (home & sponsors desktop/mobile), `improve-ui`, `antislop`, `antislop-ui`, `antislop-layoutmobile`, `Taste-Skill`

---

## 1. Executive Summary & Methodology

This audit evaluates the live visual density, spacing rhythm, typography, responsive behavior, touch targets, and color token conformance of the CNCF Peshawar redesign across the primary surface routes:
1. `/` (Homepage)
2. `/sponsors` (Sponsorship Prospectus & Inquiry Hub)

### Audit Matrix
Each route was evaluated across four standard device viewports using `chrome-devtools-mcp` with touch emulation on mobile/tablet viewports:
- **Desktop (1280×800):** 1280×800, DPR 1.0, mouse pointer
- **Tablet (768×1024):** 768×1024, DPR 2.0, touch emulation
- **Mobile Standard (390×844):** 390×844, DPR 3.0, mobile + touch emulation (iPhone 12/13/14 baseline)
- **Mobile Compact (360×740):** 360×740, DPR 3.0, mobile + touch emulation (Android compact baseline)

### Exclusion Scope
- **Section 05 on Homepage:** `section#email-builder` (`cid j7pv25f6`, "05 // INTAKE & CONTACT — Sponsorship Inquiry Generator") is a known pre-existing duplicate scheduled for deletion under `T-CLEAN`. In accordance with directives, it is excluded from all findings; a reference screenshot (`home-section-05-reference.png`) was captured and no fixes are proposed for it.

---

## 2. Evidence Artifacts & Checksums

All full-page screenshots were captured live via `chrome-devtools-mcp` on `http://localhost:4321` and saved to `docs/redesign/evidence/t-ui7/`.

| Evidence File | Route | Viewport | Sha256 Checksum | Description |
|---|---|---|---|---|
| `home-1280x800.png` | `/` | 1280×800 | `10beab92cbe65d3c88921bd0908481b32c0322875cfe444f5e146c25aefbae3f` | Full-page desktop screenshot of `/` |
| `home-768x1024.png` | `/` | 768×1024 | `3e5317457885cbe56923eecce5263f0c6e051cb78aa884f1b92f94c4985b5696` | Full-page tablet screenshot of `/` |
| `home-390x844.png` | `/` | 390×844 | `82ba9d194386b85983d5af78df2afee5c8acc5e6ab2d55a9ac30010c5cd91688` | Full-page iPhone mobile screenshot of `/` |
| `home-360x740.png` | `/` | 360×740 | `4581eb1b165ecb04006afd6b8391895fb055e67b051d346dcb730a793477aabc` | Full-page Android compact screenshot of `/` |
| `home-section-05-reference.png` | `/` | 1280×800 | `1bac3138b96b7a569cd6d9674638f409aaf913c0b547750400f6608996e8ed20` | Reference capture of Section 05 (T-CLEAN target) |
| `sponsors-1280x800.png` | `/sponsors` | 1280×800 | `693a8adc74b126f394a4b4dafea3c8ff781150de636f7e0ed4ca7d980a0b1616` | Full-page desktop screenshot of `/sponsors` |
| `sponsors-768x1024.png` | `/sponsors` | 768×1024 | `00992880694ab6168ac71274c031a3c88fc65a290fdcbb4c84388c486e9363c0` | Full-page tablet screenshot of `/sponsors` |
| `sponsors-390x844.png` | `/sponsors` | 390×844 | `8aa7493d9dcd4bc2c4b1aa18df1694c12bc268d95a1314f6184bdddd0bb4d88e` | Full-page iPhone mobile screenshot of `/sponsors` |
| `sponsors-360x740.png` | `/sponsors` | 360×740 | `67f422616496ec5c3e9b5c30c5357de412a77aca0143a3008888e5013d18c727` | Full-page Android compact screenshot of `/sponsors` |

---

## 3. Findings Tables by Route × Viewport

### 3.1 Route: `/` (Homepage)

#### Viewport: 1280×800 (Desktop)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-HOME-D1` | `#marquee-toggle-btn` (`.marquee-pause-btn`) | `min-height`, `min-width` | `56px × 24px` | `min-height: 44px; min-width: 44px;` | P1 | In `src/pages/index.astro`, set `.marquee-pause-btn { min-height: 44px; padding: 10px 14px; }` |
| `F-HOME-D2` | `.btn--sm` (`.btn.btn-outline`, `#cd-rsvp-btn`) | `min-height` | `32px` (computed height `18px`–`22px`) | `min-height: 44px` | P1 | In `src/components/ui/Button.astro` & `LinkButton.astro`, upgrade `.btn--sm` to `min-height: 44px; padding: 10px 16px;` |
| `F-HOME-D3` | `.footer-summary` | `max-width`, line length | `1200px` (~182 chars/line) | `max-width: 680px` (~65–75 chars/line) | P2 | In `src/components/layout/Footer.astro`, set `.footer-summary { max-width: 680px; }` |
| `F-HOME-D4` | `.section-eyebrow` | `font-size` | `14px` (`--text-body`) | `12px` (`--text-caption` / Stitch GT) | P2 | In `src/pages/index.astro`, set `.section-eyebrow { font-size: 12px; }` to restore caption hierarchy |
| `F-HOME-D5` | `.pillar-card`, `.fact-card`, `.past-card` | `padding` | `22px 20px`, `20px 18px` | `20px 20px` or `24px 20px` | P3 | In `src/pages/index.astro`, align card padding tokens to multiples of 4px (`var(--spacing-20)` or `var(--spacing-24)`) |

#### Viewport: 768×1024 (Tablet)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-HOME-T1` | `#marquee-toggle-btn` | `min-height` | `24px` | `44px` | P1 | Set `.marquee-pause-btn { min-height: 44px; }` |
| `F-HOME-T2` | `.btn--sm` (`.btn.btn-outline`, `#cd-rsvp-btn`) | `min-height` | `18px`–`22px` | `44px` | P1 | Enforce `min-height: 44px;` on all interactive buttons/links |
| `F-HOME-T3` | `.section-eyebrow` | `font-size` | `14px` | `12px` | P2 | Set `.section-eyebrow { font-size: 12px; }` |
| `F-HOME-T4` | `.hero-mascot-container` | `padding-right` | `24px` (width: 600px) | `0px` (or symmetric `16px 16px`) | P3 | In `src/pages/index.astro`, remove asymmetric padding-right on `.hero-mascot-container` |

#### Viewport: 390×844 (Mobile Standard)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-HOME-M1` | `#marquee-toggle-btn` | `min-height`, `min-width` | `56px × 24px` | `44px × 44px` minimum tap floor | P1 | Set `.marquee-pause-btn { min-height: 44px; min-width: 44px; }` |
| `F-HOME-M2` | `.btn--sm` (`.btn.btn-outline`, `#cd-rsvp-btn`) | `min-height` | `18px`–`22px` | `44px` touch target floor | P1 | Enforce `min-height: 44px;` in `Button.astro` / `LinkButton.astro` |
| `F-HOME-M3` | `#featured-meetup`, `#pillars-section`, `#past-meetups`, `#cfp-section` | `padding-block` | `50px / 50px`, `56px / 56px` | `36px / 36px` (Stitch `home-mobile.html`) | P2 | In `src/pages/index.astro`, add `@media (max-width: 768px)` scaling section padding to `36px var(--spacing-16, 16px)` |
| `F-HOME-M4` | `#facts-section` | `padding-block` | `40px / 60px` (asymmetric) | `36px / 36px` | P2 | Set `#facts-section { padding: 36px var(--spacing-16, 16px); }` under mobile media query |
| `F-HOME-M5` | `.section-eyebrow` | `font-size` | `14px` | `12px` | P2 | Set `.section-eyebrow { font-size: 12px; }` |

#### Viewport: 360×740 (Mobile Compact)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-HOME-C1` | `#marquee-toggle-btn` | `min-height` | `24px` | `44px` | P1 | Set `.marquee-pause-btn { min-height: 44px; min-width: 44px; }` |
| `F-HOME-C2` | `.btn--sm` (`.btn.btn-outline`, `#cd-rsvp-btn`) | `min-height` | `18px`–`22px` | `44px` | P1 | Enforce `min-height: 44px;` across all mobile buttons |
| `F-HOME-C3` | `#featured-meetup`, `#pillars-section`, `#past-meetups`, `#cfp-section` | `padding-block` | `50px / 50px`, `56px / 56px` | `36px / 36px` | P2 | Compact section padding on mobile to `36px var(--spacing-16, 16px)` |
| `F-HOME-C4` | `.section-eyebrow` | `font-size` | `14px` | `12px` | P2 | Set `.section-eyebrow { font-size: 12px; }` |

---

### 3.2 Route: `/sponsors` (Sponsorship Prospectus)

#### Viewport: 1280×800 (Desktop)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-SPON-D1` | `.form-input` (`#org-name`, `#org-website`, `#contact-name`, `#contact-email`) | `height` / `min-height` | `41.6px` | `44px` (`min-height: 44px`) | P1 | In `src/components/sponsors/SponsorshipEmailBuilder.astro`, add `min-height: 44px;` to `.form-input, .form-select` |
| `F-SPON-D2` | `.form-select` (`#tier-select`, `#timeline-select`) | `height` / `min-height` | `43.2px` | `44px` (`min-height: 44px`) | P1 | In `src/components/sponsors/SponsorshipEmailBuilder.astro`, add `min-height: 44px;` to `.form-select` |
| `F-SPON-D3` | `.section-wrap`, `#tiers`, `#email-builder` | `max-width` | `100%` / `none` (unconstrained) | `max-width: 1200px` (`--page-max-width`) | P2 | In `src/pages/sponsors.astro`, set `.section-inner { max-width: var(--page-max-width, 1200px); margin: 0 auto; }` |
| `F-SPON-D4` | `.page-hero-title` | `font-size`, `line-height` | `44.8px` / `53.76px` | `40px` / `48px` (`--text-heading-lg`) | P2 | In `src/pages/sponsors.astro`, map `.page-hero-title` to token `var(--text-heading-lg, 40px)` |
| `F-SPON-D5` | `.page-hero-lede` | `max-width`, `font-size` | `max-width: 760px; font-size: 17px;` | `max-width: 680px; font-size: 16px;` | P3 | In `src/pages/sponsors.astro`, align `.page-hero-lede` to token `var(--text-body-lg, 16px)` and `max-width: 680px` |

#### Viewport: 768×1024 (Tablet)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-SPON-T1` | `.form-input` (`#org-name`, `#org-website`, `#contact-name`, `#contact-email`) | `height` | `41.6px` | `44px` | P1 | Set `.form-input, .form-select { min-height: 44px; }` |
| `F-SPON-T2` | `.form-select` (`#tier-select`, `#timeline-select`) | `height` | `43.2px` | `44px` | P1 | Set `.form-select { min-height: 44px; }` |
| `F-SPON-T3` | `.form-row` | Degradation / Layout | `325.7px 325.7px` (2 cols) | Valid 2-col degradation (fits 664px) | Pass | No change required; 2-col grid fits tablet width cleanly |
| `F-SPON-T4` | `.page-hero` | `padding-block` | `60px / 60px` | `48px / 48px` | P3 | Minor rhythm tightening for tablet |

#### Viewport: 390×844 (Mobile Standard)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-SPON-M1` | `.form-input` (`#org-name`, `#org-website`, `#contact-name`, `#contact-email`) | `height` | `41.6px` | `44px` touch floor | P1 | Add `min-height: 44px;` in `SponsorshipEmailBuilder.astro` |
| `F-SPON-M2` | `.form-select` (`#tier-select`, `#timeline-select`) | `height` | `43.2px` | `44px` touch floor | P1 | Add `min-height: 44px;` in `SponsorshipEmailBuilder.astro` |
| `F-SPON-M3` | `.page-hero` | `padding-block` | `40px / 60px` (asymmetric) | `36px / 32px` (Stitch GT) | P2 | In `src/pages/sponsors.astro`, adjust mobile `.page-hero` to `padding: 36px var(--spacing-16, 16px) 32px;` |
| `F-SPON-M4` | `.form-row` | Grid columns degradation | `cols = 314.8px` (1 col) | Single column reflow | Pass | Degrades cleanly from 2 cols to 1 col below 600px |

#### Viewport: 360×740 (Mobile Compact)
| Finding ID | Selector | Property | Current Computed Value | Target Value | Severity | Proposed Minimal Fix |
|---|---|---|---|---|---|---|
| `F-SPON-C1` | `.form-input` (`#org-name`, `#org-website`, `#contact-name`, `#contact-email`) | `height` | `41.6px` | `44px` | P1 | Add `min-height: 44px;` to `.form-input` |
| `F-SPON-C2` | `.form-select` (`#tier-select`, `#timeline-select`) | `height` | `43.2px` | `44px` | P1 | Add `min-height: 44px;` to `.form-select` |
| `F-SPON-C3` | `.page-hero` | `padding-block` | `40px / 60px` | `36px / 32px` | P2 | Set mobile padding `36px var(--spacing-16, 16px) 32px` |
| `F-SPON-C4` | `.form-row` | Grid columns degradation | `cols = 284.8px` (1 col) | Single column reflow | Pass | Degrades cleanly on compact mobile |

---

## 4. Detailed Measurement Analysis (Items A through I)

### a) Section Padding-Block Values per Page Section
- **Homepage (`/`):**
  - `#hero-section`: Desktop `72px / 84px` (matches Stitch GT `padding: 72px 32px 84px`); Tablet `61.44px / 76.8px`; Mobile (390/360) `48px / 60px`.
  - `#marquee-strip`: `11px / 11px` across all viewports (matches Stitch GT).
  - `#charter-section`: Desktop `60px / 60px`; Tablet `46.08px / 46.08px`; Mobile `36px / 36px` (scales down appropriately).
  - `#facts-section`: `40px / 60px` across ALL viewports (unscaled on mobile; asymmetric).
  - `#featured-meetup`, `#pillars-section`, `#past-meetups`: `50px / 50px` across ALL viewports (50px is not on the 4px token scale, and does not scale down on mobile).
  - `#cfp-section`, `#sponsors-section`: `56px / 56px` across ALL viewports (does not scale down on mobile).
- **Sponsors (`/sponsors`):**
  - `#page-hero`: Desktop `80px / 80px`; Tablet `60px / 60px`; Mobile `40px / 60px` (asymmetric on mobile; Stitch specifies `36px 20px 32px`).
  - `#stats-strip`: Desktop `48px / 48px`; Mobile `32px / 32px`.
  - `.section-wrap` (Why Support): Desktop `60px / 60px`; Mobile `36px / 36px`.
  - `#tiers` (Packages): Desktop `60px / 60px`; Mobile `36px / 36px`.
  - `#email-builder`: Desktop `64px / 64px`; Mobile `36px / 36px`.
  - `.section-wrap` (Partners): Desktop `60px / 60px`; Mobile `36px / 36px`.

### b) Container Max-Width and Side Gutters
- **Homepage (`/`):**
  - Desktop gutters: `32px` left/right across sections (matches Stitch GT `padding: 0 32px`).
  - Tablet gutters: `30.72px` (~30px).
  - Mobile gutters: `16px` left/right (`--spacing-16`, consistent across 390px and 360px).
  - `.hero-container`: `max-width: 800px`, centered.
- **Sponsors (`/sponsors`):**
  - Desktop gutters: `32px` left/right.
  - Mobile gutters: `16px` left/right.
  - `.stats-container`: `max-width: 1200px` (matches `--page-max-width: 1200px`).
  - `.section-wrap`, `#tiers`, `#email-builder`: `max-width: 100%` (lacks explicit 1200px max-width container wrapper; should constrain at wide viewports).

### c) Grid Gap per Card Grid & Internal Padding per Card Type
- **Grids:**
  - `.facts-grid`: 4 cols @ 1280 (gap 20px) -> 2 cols @ 768 (gap 20px) -> 1 col @ 390/360 (gap 20px).
  - `.countdown-grid`: 4 cols @ 1280 (gap 16px) -> 4 cols @ 768 (gap 16px) -> 4 cols @ 390/360 (gap 8px).
  - `.pillars-grid`: 2 cols @ 1280 (gap 24px) -> 1 col @ 768/390/360 (gap 24px).
  - `.past-grid` & `.sponsors-grid`: 3 cols @ 1280 (gap 20px) -> 1 col @ 768/390/360 (gap 20px).
  - `.tiers-grid` (`/sponsors`): 4 cols @ 1280 (gap 18px) -> 2 cols @ 768 (gap 18px) -> 1 col @ 390/360 (gap 18px).
- **Card Internal Padding:**
  - `.charter-card`: `32px 32px 32px 32px` (matches `--spacing-32`).
  - `.fact-card`: `20px 18px 20px 18px` (horizontal 18px is off-token; target `20px`).
  - `.pillar-card`: `22px 20px 22px 20px` (vertical 22px is off-token; target `24px 20px`).
  - `.past-card`, `.sponsor-card`: `20px 18px 20px 18px` (horizontal 18px is off-token; target `20px`).
  - `.fact-item` (`/sponsors`): `20px 20px 20px 20px` (matches `--spacing-20`).
  - `.card.card--white` (`/sponsors`): `24px 24px 24px 24px` (matches `--spacing-24`).

### d) H1 / H2 / Eyebrow Margins Above and Below
- **Homepage (`/`):**
  - `SPAN.hero-eyebrow`: `font-size: 12px; margin-bottom: 18px` (matches Stitch GT).
  - `H1.hero-headline`: `font-size: 54.4px; line-height: 62.56px; margin-bottom: 20px` (`--text-display: 56px`).
  - `H2.charter-title`: `font-size: 18px; margin-bottom: 14px`.
  - `SPAN.section-eyebrow`: `font-size: 14px; margin-bottom: 0px` (14px is too large for caption token; target 12px).
  - `H2.section-title`: `font-size: 21px; line-height: 33.6px; margin-top: 0px; margin-bottom: 0px` (handled by parent flexbox gap).
- **Sponsors (`/sponsors`):**
  - `DIV.page-hero-eyebrow`: `font-size: 12px; margin-bottom: 16px`.
  - `H1.page-hero-title`: `font-size: 44.8px; line-height: 53.76px; margin-bottom: 20px` (`--text-heading-lg`).
  - `SPAN.section-eyebrow`: `font-size: 12px; margin-bottom: 6px`.
  - `H2.section-headline`: `font-size: 35.2px; line-height: 56.32px; margin-bottom: 10px`.

### e) Paragraph Max Line Length and Line-Height
- `.hero-lede` on `/`: `max-width: 680px`, width `680px`, `font-size: 17px`, `line-height: 27.2px` (1.6), approx 73 chars/line.
- `.page-hero-lede` on `/sponsors`: `max-width: 760px`, width `760px`, `font-size: 17px`, `line-height: 27.2px`, approx 81 chars/line (slightly long; target 680px / 75 chars).
- `.footer-summary`: `width: 1200px` unconstrained (`max-width: none`), font-size `12px`, approx 182 chars/line (excessive line length, flag for remediation).
- Card body paragraphs: widths range between `230px` and `340px`, approx 35–50 chars/line, line-height 1.4–1.6 (comfortable density).

### f) `/sponsors` Intake Form Audit
- **Label-to-Input Vertical Gap:** Computed at exactly `6px` (`var(--spacing-6)`), consistent across all form fields.
- **Fieldset Group Spacing:** `.form-group-label` margin-bottom is `10px`; `.form-row` gap is `12px`; `.mt-fieldset` margin-top is `12px`.
- **Input Heights:**
  - `#org-name` (text input): `41.6px` — **FLAGGED (< 44px)**
  - `#org-website` (url input): `41.6px` — **FLAGGED (< 44px)**
  - `#contact-name` (text input): `41.6px` — **FLAGGED (< 44px)**
  - `#contact-email` (email input): `41.6px` — **FLAGGED (< 44px)**
  - `#tier-select` (dropdown): `43.2px` — **FLAGGED (< 44px)**
  - `#timeline-select` (dropdown): `43.2px` — **FLAGGED (< 44px)**
  - `#scope-notes` (textarea): `82.0px` — PASS (>= 44px)
- **Two-Column Field Rows Degradation:**
  - 1280px (Desktop): 2 columns (`grid-template-columns: 287px 287px`, gap 12px) — PASS.
  - 768px (Tablet): 2 columns (`grid-template-columns: 325.7px 325.7px`, gap 12px, container width 664px) — PASS.
  - 390px (Mobile Standard): 1 column (`grid-template-columns: 314.8px`, gap 12px) — PASS (degrades cleanly).
  - 360px (Mobile Compact): 1 column (`grid-template-columns: 284.8px`, gap 12px) — PASS (degrades cleanly).

### g) Text Muted Color Verification
- Ground truth rule: `#a1a1a1` is borders/outlines only; muted text MUST be `#6b6b6b`.
- Across all audited text elements on both `/` and `/sponsors`:
  - Elements using `#6b6b6b` (`rgb(107, 107, 107)`): 30 occurrences on `/`, 30 occurrences on `/sponsors`.
  - Elements using `#a1a1a1` (`rgb(161, 161, 161)`) for text: **0 occurrences** (100% compliant).
  - Terminal code labels use `#818181` (`--color-graphite`).

### h) Horizontal Overflow Check
- `document.documentElement.scrollWidth <= window.innerWidth` across ALL 8 runs (zero page horizontal scroll leak).
- `#mobile-nav-drawer` is positioned with `transform: translateX(100%)` offscreen by design without triggering document-level scroll.
- `#marquee-track` overflows its internal bounding box (`~2615px` wide) inside an `overflow: hidden` strip without viewport leak.

### i) Tap Targets Under 44×44px
- On `/`:
  1. `#marquee-toggle-btn`: `56px × 24px` (height 24px < 44px)
  2. `.btn.btn-outline` ("Explore Lab Repositories"): `209px × 18px` (height 18px < 44px)
  3. `.btn.btn-outline` ("View Details →"): `122px × 22px` (height 22px < 44px)
  4. `#cd-rsvp-btn` ("Join OCG Group"): `122px × 22px` (height 22px < 44px)
  5. `.past-link.link-highlight`: height `21px` (< 44px)
  6. `.sponsor-link.link-highlight`: height `19px` (< 44px)
  7. `.btn.btn--sm` buttons: height `32px` (< 44px)
- On `/sponsors`:
  1. `#org-name`: `41.6px` height (< 44px)
  2. `#org-website`: `41.6px` height (< 44px)
  3. `#contact-name`: `41.6px` height (< 44px)
  4. `#contact-email`: `41.6px` height (< 44px)
  5. `#tier-select`: `43.2px` height (< 44px)
  6. `#timeline-select`: `43.2px` height (< 44px)

---

## 5. Ranked Remediation Shortlist (Max 10 Items)

This shortlist prioritizes high-impact, single-file fixes for the follow-up remediation task:

| Rank | Priority | File Target | Remediation Item | Target Value | Impact |
|---|---|---|---|---|---|
| **1** | **P1** | `src/components/sponsors/SponsorshipEmailBuilder.astro` | Enforce 44px tap floor on form inputs & selects (`.form-input, .form-select`) | `min-height: 44px;` | Eliminates WCAG 2.5.5 tap target violations on all 6 inquiry form fields. |
| **2** | **P1** | `src/pages/index.astro` | Enforce 44px tap target floor on marquee pause button (`.marquee-pause-btn`) | `min-height: 44px; min-width: 44px; padding: 10px 14px;` | Eliminates mobile touch tap failure on 24px marquee control. |
| **3** | **P1** | `src/components/ui/Button.astro` & `LinkButton.astro` | Upgrade `.btn--sm` size definition from 32px to 44px touch floor | `min-height: 44px; padding: 10px 16px;` | Resolves undersized CTA buttons across homepage and subpages. |
| **4** | **P2** | `src/pages/index.astro` | Add mobile section padding scaling for stacked homepage sections | `@media (max-width: 768px) { padding: 36px var(--spacing-16, 16px); }` | Decongests excessive vertical whitespace on mobile (50px/56px -> 36px). |
| **5** | **P2** | `src/pages/sponsors.astro` | Align mobile hero padding on `/sponsors` with Stitch GT | `padding: 36px var(--spacing-16, 16px) 32px;` | Harmonizes top/bottom hero spacing on mobile devices. |
| **6** | **P2** | `src/pages/sponsors.astro` | Constrain wide desktop content width on `/sponsors` sections | `.section-inner { max-width: var(--page-max-width, 1200px); margin: 0 auto; }` | Prevents packages and inquiry builder from stretching unconstrained on >1200px screens. |
| **7** | **P2** | `src/components/layout/Footer.astro` | Constrain footer summary paragraph line-length | `.footer-summary { max-width: 680px; }` | Fixes 182-character unconstrained line length to standard typographic range (65–75ch). |
| **8** | **P2** | `src/pages/index.astro` | Correct homepage section eyebrow font-size hierarchy | `.section-eyebrow { font-size: var(--text-caption, 11px); }` (or `12px`) | Corrects optical inversion where 14px eyebrow matched body copy size. |
| **9** | **P3** | `src/pages/index.astro` | Normalize homepage card internal paddings to base-4 tokens | `.fact-card, .past-card, .sponsor-card { padding: 20px; }` · `.pillar-card { padding: 24px 20px; }` | Replaces off-scale 18px/22px values with strict 4px token multiples (`--spacing-20`, `--spacing-24`). |
| **10** | **P3** | `src/pages/sponsors.astro` | Align lede typography token on `/sponsors` hero | `.page-hero-lede { font-size: var(--text-body-lg, 16px); max-width: 680px; }` | Replaces non-standard 17px font-size and 760px width with standard design tokens. |

---

MEMORY: updated (Current state, Open items).
