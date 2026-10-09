# MotherDuck Motion & Interaction Specification (Ground Truth & Implementation)

> **Specification ID:** `SPEC-MD-MOTION-01`  
> **Phase:** 1 — Base & Motion Reconnaissance (`T-1.3-RECON` → `T-1.3-EXECUTE`)  
> **Author Role:** `RECON`  
> **Date:** 2026-10-09  
> **Governing Standards:** `CONTRACT.md §5`, `DESIGN.md`, `docs/redesign/stitch/home-animation-spec.md`, `fixing-motion-performance` Skill

---

## 1. Executive Summary & Ground Truth Audit

This specification establishes the authoritative motion and physics rules for the MotherDuck redesign of CNCF Peshawar. Ground truth was extracted directly from live `https://motherduck.com` via `chrome-devtools-mcp` (CSSOM rule extraction, computed style sampling) and static stylesheet reverse-engineering.

### 1.1 Token Ground Truth Verification

| Token Name | Token Identifier | Live Site Computed Value | Match Status | Notes |
|---|---|---|---|---|
| **Cream Paper** | `--color-cream-paper` | `rgb(244, 239, 234)` (`#f4efea`) | **CONFIRMED** | Root body background surface |
| **Charcoal Ink** | `--color-charcoal-ink` | `rgb(56, 56, 56)` (`#383838`) | **CONFIRMED** | Universal border, text, and shadow color |
| **Sky Crayon** | `--color-sky-crayon` | `rgb(111, 194, 255)` (`#6fc2ff`) | **CONFIRMED** | Primary action hover, active fill, and link borders |
| **Brutal Shadow** | `--shadow-brutal` / `--shadow-subtle` | `rgb(56, 56, 56) -6px 6px 0px 0px` | **CONFIRMED** | Hard offset shadow (down-left pocket: -X, +Y) |
| **Card Shadow** | `--shadow-card` | `rgb(56, 56, 56) -4px 4px 0px 0px` | **CONFIRMED** | Card rest elevation, expanding to `-6px 6px` on hover |
| **Border Radius** | `--radius-brutal` | `2px` | **CONFIRMED** | Exact 2px radius on buttons, inputs, tags, and cards |
| **Typography** | `--font-display` / `--font-mono` | `"Aeonik Mono", monospace` | **CONFIRMED** | 400/500/600 weights, monospace-first hierarchy |

---

## 2. Live MotherDuck Motion Patterns (Observed in CSSOM)

From CSSOM rule inspection of `https://motherduck.com`:

1. **Button Hover & Active Physics**:
   - Rest: `transition: transform 120ms ease-in-out` on `.gDlxux`, `.flRsaA`.
   - Hover: `.kyYlyk:hover #styled-button-component { transform: translate(7px, -7px); }`
   - Active: `.kyYlyk #styled-button-component:active { transform: none; transition: transform 30ms ease-in-out; }`
   - Active Color: `.gDlxux:active { background-color: rgb(111, 194, 255); }`
2. **Card Hover Elevation**:
   - Rest: `.fWljBA { border: 2px solid rgb(56, 56, 56); box-shadow: rgb(56, 56, 56) -4px 4px 0px 0px; }`
   - Hover: `.ePTeby:hover { transform: translate(3px, -3px); box-shadow: rgb(56, 56, 56) -6px 6px 0px 0px; }`
   - Transition: `transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out;`
3. **Scroll Reveal Animations**:
   - Initial states:
     - `.scroll-animate-up { opacity: 0; transform: translate(0px, 100px); }`
     - `.scroll-animate-down { opacity: 0; transform: translate(0px, -100px); }`
     - `.scroll-animate-right { opacity: 0; transform: translate(-100px, 0px); }`
     - `.scroll-animate-left { opacity: 0; transform: translate(100px, 0px); }`
   - Active visible state: `.scroll-animate-visible { opacity: 1; transform: translate(0px); }`
4. **Link Underline Hover**:
   - `span { border-bottom: calc(0.09em + 1px) solid rgb(111, 194, 255); margin-bottom: 0px; }`
5. **Reduced Motion Gating**:
   - Continuous rotations and tickers are wrapped in `@media (prefers-reduced-motion: no-preference)`.

---

## 3. Detailed Component Motion & Physics Matrix

Reconciled with `home-animation-spec.md` and performance rules (`fixing-motion-performance`):

| Component / Behavior | Observed Live Site Value | Redesign Token Mapping | Implementation Engine | Reduced Motion Fallback (`prefers-reduced-motion: reduce`) |
|---|---|---|---|---|
| **3.1 Button & LinkButton Mechanics** (`Button.astro`, `LinkButton.astro`) | Hover: `transform: translate(7px, -7px); transition: transform 120ms ease-in-out;`<br>Active: `transform: none; transition: transform 30ms ease-in-out;` (snap-back onto shadow). | Rest shadow: `var(--shadow-brutal)` (`rgb(56, 56, 56) -6px 6px 0 0`)<br>Border: `2px solid var(--color-charcoal-ink)`<br>Radius: `var(--radius-brutal)` | **Pure CSS**<br>Hover: `transform: translate(7px, -7px); transition: transform 120ms ease-in-out;`<br>Active: `transform: none; transition: transform 30ms ease-in-out;` | Instant state change (0ms duration); no spatial translation (`transform: none`). Highlight color shift preserved. |
| **3.2 Nav CTA & Links** (`Header.astro`, `Nav.astro`) | Flat rest (no shadow).<br>Hover: sky underline `#6fc2ff`.<br>Active: background sky fill over 120ms. | Border: `1.5px solid var(--color-charcoal-ink)`<br>Text: `var(--color-charcoal-ink)`<br>Active fill: `var(--color-sky-crayon)` | **Pure CSS**<br>`transition: background-color 120ms ease-in-out, color 120ms ease-in-out` | Instant color shift (0ms). |
| **3.3 Marquee Strips** (`Marquee.astro`) | Swiper / CSS translate loop.<br>Speed: `22s`–`54s` linear infinite.<br>Pause on hover/focus. | Background: `var(--color-canary-banner)` (`#ffde00`)<br>Text: `var(--color-charcoal-ink)` in monospace | **Pure CSS Keyframes**<br>`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`<br>`animation: marquee 24s linear infinite;`<br>`:hover, :focus-within { animation-play-state: paused; }` | `animation: none !important;`<br>Content renders statically with horizontal scroll or clean wrap. |
| **3.4 Card & Bento Elevation** (`Card.astro`, `BentoGrid`) | Rest shadow: `-4px 4px 0 0 charcoal` (`--shadow-hard-sm`).<br>Hover: `translate(3px, -3px)` + shadow deepens to `-6px 6px`; `200ms ease-in-out`, compositor-only.<br>Active: `translate(0, 0)` over 60ms. | Surface: `var(--color-frost-white)`<br>Border: `2px solid var(--color-charcoal-ink)`<br>Shadow: `var(--shadow-hard-sm)` (`-4px 4px 0 0`) → `var(--shadow-brutal)` (`-6px 6px 0 0`) | **Pure CSS**<br>`transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out`<br>Compositor only (`transform`, `box-shadow`) | No translation (`transform: none`); border-color or static outline highlight only. |
| **3.5 Section & Card Scroll Reveals** (`[data-reveal]`) | `.scroll-animate-up`: `opacity: 0 / translateY(100px)` → `opacity: 1 / none`.<br>Trigger via Motion `inView`; stagger siblings via Motion `stagger`. | Easing: `cubic-bezier(0.16, 1, 0.3, 1)`<br>Initial: `opacity: 0; transform: translateY(100px);`<br>Active: `opacity: 1; transform: none;` | **Motion (`inView`, `animate`, `stagger`)**<br>Initialized via `src/scripts/motion.ts`. Safety rule: default CSS is `opacity: 1`, `.js-motion` sets initial state. | Elements render immediately at `opacity: 1; transform: none;` without waiting for observer. Lenis never initializes. |
| **3.6 Hero Headline & LCP Elements** (`index.astro`) | Immediate first paint; no entrance fade or delay. | Monospace Display: `var(--font-display)` at 56px | **Static Render (Zero Animation)**<br>Mandatory LCP protection rule. 0ms delay, 0ms duration, 0 opacity transitions on `<h1>`. | Identical static first paint. |
| **3.7 Hero Subhead & Eyebrow Entrance** | Eyebrow, buttons, and doodles animate on load via Motion; H1 headline excluded. | Eyebrow delay: `60ms`<br>Lede delay: `120ms`<br>Actions delay: `180ms` | **Motion (`animate`)**<br>`transform: translateY(8px)` → `0`<br>`opacity: 0` → `1` | `opacity: 1; transform: none;` immediately. |
| **3.8 Cloud & Doodle Floating Elements** | Loose sketch line art hovering around product screenshots. | Stroke: `var(--color-wet-cement)` (`#54b4de`) / `var(--color-charcoal-ink)` | **Pure CSS Keyframes**<br>Gentle 4px floating translation over 6s ease-in-out cycle. | Static positioning; zero floating animation. |
| **3.9 Countdown & Live Indicator** (`GenesisCountdown.astro`) | Live status dot pulsing ring; concluded state freezes to static gray. | Green pulse: `rgba(76, 209, 55, 0.7)`<br>Concluded: static neutral gray (`var(--color-pencil-gray)`) | **Pure CSS Keyframes** (`@keyframes live-pulse`) + Client JS delta timer. Zero DOM reads in tick loop. | Pulse ring disabled; solid static green/gray dot. |
| **3.10 Mobile Nav Drawer** (`Nav.astro`) | Drawer slides in from right; overlay washes over canvas. | Overlay: `rgba(56, 56, 56, 0.4)`<br>Drawer: `translateX(100%)` → `translateX(0)` | **Pure CSS + Vanilla JS Toggle**<br>`transform: translateX(100%)` → `translateX(0%)` over 300ms `cubic-bezier(0.16, 1, 0.3, 1)`. Body overflow locked. | Drawer toggles instantly without spatial sliding (0ms). |

---

## 4. Performance & Compositor Rules (`fixing-motion-performance`)

All motion implementations in `T-1.3-EXECUTE` must strictly adhere to these 6 golden rules:

1. **Compositor Properties Only:**
   - ONLY animate `transform` and `opacity`.
   - Never animate layout properties: `top`, `left`, `right`, `bottom`, `width`, `height`, `margin`, `padding`.
   - Never use `transition: all`. Every transition must declare explicit properties (e.g. `transition: transform 120ms ease-in-out, box-shadow 120ms ease-in-out`).
2. **Zero Layout Thrashing:**
   - No interleaving of layout reads (`getBoundingClientRect()`, `offsetWidth`, `clientHeight`) and DOM writes.
   - All timer calculations in `GenesisCountdown` operate on timestamps (`Date.now()`), mutating only text content and class tokens.
3. **Scroll Timelines & Observers:**
   - Scroll reveals must use `IntersectionObserver` with an unobserve trigger (`observer.unobserve(el)` once revealed).
   - Never attach continuous `window.addEventListener('scroll', ...)` handlers for layout or style calculations.
4. **Surgical GPU Layer Allocation:**
   - `will-change: transform` may only be applied temporarily on active interactions (hover/drag/drawers), never left indefinitely on hundreds of DOM nodes.
5. **Strict LCP Protection:**
   - Primary hero headlines (`<h1>`) must never have opacity fades, blur-ins, or entrance delays. First paint is immediate.
6. **Universal WCAG 2.2.2 & 2.3.3 Reduced Motion Compliance:**
   - Every animation block must provide an explicit `@media (prefers-reduced-motion: reduce)` override setting `animation: none !important;` and `transition-duration: 0.01ms !important;`.

---

## 5. Execution Roadmap for `T-1.3-EXECUTE`

When `T-1.3-EXECUTE` begins:
1. **Marquee A11y & Physics**: Ensure pause on `:hover` and `:focus-within`, and verify accessible pause toggle `#marquee-pause-btn`.
2. **Scroll-Reveal Engine**: Implement a tiny zero-dependency `data-reveal` observer script in `BaseLayout.astro` targeting `.is-revealed` styles.
3. **Button & Card Physics**: Standardize tactile press tokens across `Button.astro` and `Card.astro` matching the -6px/+6px brutal pocket.
4. **Clean Codebase Cleanup**: Delete unreferenced `BentoPillars.astro` (verified 0 references); retain or migrate `TrackRecordStats.astro` in coordination with `src/pages/sponsors.astro`.
