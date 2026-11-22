# Execution Report: T-UI-6

> **Task ID:** `T-UI-6`  
> **Phase:** Wave C (Pre-merge owner-ordered fixes)  
> **Role:** Executor, single writer  
> **Objective:** Mobile hero CTA right-sizing — compact best-fit at 390px/360px via CSS-only, mobile-scoped rules. Desktop frozen byte-identical. Zero HTML, zero JS, zero new functionality. T-UI-1 evidence riders closed.  
> **Date:** 2026-10-14  

---

## 1. Executive Summary & Outputs First

- **Objective Met:** Homepage hero CTA buttons (`.hero-ctas`) right-sized for mobile viewports (390px and 360px):
  - In Ground Truth (`docs/redesign/stitch/home-mobile.html`), `.hero-ctas` specifies `flex-direction: column; align-items: center; gap: 14px;`.
  - Prior to fix, `.btn` inherited `white-space: nowrap` and desktop padding `10px 24px`, which caused the primary CTA ("JOIN CHAPTER ON OPEN COMMUNITY GROUPS (OCG)", 46 chars) to blow out to **485.5px width** in a 390px viewport, severely overflowing and clipping off-screen.
  - Fix applied: In `src/pages/index.astro` under `@media (max-width: 767px)` and `@media (max-width: 480px)`, collapsed `.hero-ctas` to centered column layout with `white-space: normal`, `text-align: center`, `min-height: 44px`, `max-width: 320px`, and compact padding `10px var(--spacing-16, 16px)`.
  - Tap target floor (≥44px) strictly preserved on both CTAs (`320×59.2px` and `320×44px`).
  - Desktop layout (1280px) is **100% byte-for-byte and computed-style identical** before vs after.
  - Zero HTML altered, zero JS altered, zero new dependencies.
- **Battery Status:** 100% GREEN:
  - Astro check: 71 files / 0 errors / 0 warnings / 42 hints
  - Static build: 17 pages built successfully
  - Tests: 119/119 E2E tests passed (100% pass rate; Tiers: 49/52/12/6)
  - Parity: 10/10 routes scanned, 10 successful, 0 failures (`exitCode: 0`)
  - Link check: 590 internal links verified, 0 broken (`590/0`)
  - Protected diff vs `a372314`: completely EMPTY
  - Hex scan on diff: 0 added hex codes
  - Client JS bundle gzip: exactly `25,896 B` (0% delta)
  - Lighthouse mobile audit: **Accessibility 100**, Best Practices 96, SEO 100, Agentic Browsing 100, Tap targets PASS.

---

## 2. Step 0: Session Boot & T-UI-1 Evidence Riders

### 0a. Stamped Line
```text
/home/alucard/Documents/CNCF/cncf-peshawar.github.io-main
65842959d0ba7f84c2761671193067a337132655
redesign/ui-motherduck
```
*(HEAD at boot: `6584295` T-UI-2, building on `a372314` T-UI-1)*

### 0b. RIDER-1 Forensic Diff
- Command: `wc -l /tmp/tui1-build.log /tmp/tui1-test.log && diff <(grep -v "warning ts" /tmp/tseo-r1-build.log 2>/dev/null) <(grep -v "warning ts" /tmp/tui1-build.log) | head -60`
- Raw output:
```text
  438 /tmp/tui1-build.log
  466 /tmp/tui1-test.log
  904 total
0a1,191
> Tue Oct 13 05:48:18 PM UTC 2026
> 
> > cncf-peshawar.github.io@1.0.0 check
> > astro check
> 
> 22:48:25 [content] Syncing content
> 22:48:25 [WARN] [glob-loader] No files found matching "**/*{.md,.mdx},!**/_*/**/*{.md,.mdx},!**/_*{.md,.mdx}" in directory "src/content/speakers"
> 22:48:25 [content] Synced content
> 22:48:25 [types] Generated 1.15s
> 22:48:25 [check] Getting diagnostics for Astro files in /home/alucard/Documents/CNCF/cncf-peshawar.github.io-main...
```

### 0c. RIDER-2 Memory Protocol Verification
- Command: `rm -f AI_memory.md && ls AI_memory.md 2>&1`
- Raw output:
```text
ls: cannot access 'AI_memory.md': No such file or directory
```
- Canonical outside-repo copies:
  - `/home/alucard/Documents/Antigraivty_Data/AI_memory.md` (19,303 bytes)
  - `/home/alucard/Documents/CNCF/AI_memory.md` (19,303 bytes)
- Diff between canonical copies: **CLEAN** (0 bytes diff).

### 0d. RIDER-3 Log Archival
- Command: `cp /tmp/tui1-*.log docs/redesign/evidence/t-ui1/ && sha256sum docs/redesign/evidence/t-ui1/*.log`
- Raw output:
```text
2ce36ae74a7a7032b05801c2a0d1dc1bc24f5ff7fa7cf12997d8fef0343b95d7  docs/redesign/evidence/t-ui1/tui1-build.log
3185361744e9060f4de0d886a628bcb382b6e5d17b7e74437f79d6913de56ca2  docs/redesign/evidence/t-ui1/tui1-test.log
```

---

## 3. Step 2 & 5: Computed Metrics & Diagnosis (Numbers, Not Vibes)

### 3a. Mobile 390px Viewport Metrics Comparison Table

Evaluated live via Chrome DevTools MCP (`emulate` 390×844×1, mobile, touch):

| Element / Property | Ground Truth (`home-mobile.html`) | Pre-Task (Before) | Post-Task (After) | Delta (After vs Before) |
|---|---|---|---|---|
| **Container (`.hero-ctas`) Layout** | `display: flex; flex-direction: column` | `flex-direction: row; flex-wrap: wrap` | `flex-direction: column; flex-wrap: wrap` | Switched to GT column stack |
| **Container Gap** | `14px` | `14px` | `14px` | `0px` (GT parity) |
| **Container Width** | `100% / ~358px` | `358.4px` | `320px` | Centered 320px compact block |
| **Container Height** | `~110px` | `117.2px` (wrapped 2 rows) | `117.2px` (stacked 2 rows) | `0px` |
| **Primary CTA Width** | `~230px` ("Join Our Next Meetup") | **485.5px** (OVERFLOW by +95.5px!) | **320.0px** (fits viewport) | **-165.5px** (Zero overflow!) |
| **Primary CTA Height** | `44px` | `59.2px` | `59.2px` | Preserved (≥44px tap floor) |
| **Primary CTA Font Size** | `14px` | `14px` | `14px` (`var(--font-size-body)`) | `0px` |
| **Primary CTA Padding** | `11px 22px` | `10px 24px` | `10px 16px` (`var(--spacing-16)`) | -8px horizontal (compact) |
| **Primary CTA Line Height**| `normal` | `16.8px` (1.2) | `16.8px` (`var(--line-height-snug)`) | `0px` |
| **Secondary CTA Width** | N/A (single button in GT) | `181.8px` | **320.0px** (aligned block) | +138.2px (uniform visual rhythm) |
| **Secondary CTA Height** | N/A | `44.0px` | `44.0px` | `0px` (≥44px tap floor) |
| **Secondary CTA Font Size**| N/A | `14px` | `14px` (`var(--font-size-body)`) | `0px` |
| **Secondary CTA Padding** | N/A | `10px 24px` | `10px 16px` (`var(--spacing-16)`) | -8px horizontal |
| **Secondary CTA Line Ht** | N/A | `16.8px` | `16.8px` | `0px` |
| **Page Scroll Width** | `390px` | `390px` (clipped by body) | `390px` (natural containment) | Zero overflow leak |

### 3b. Mobile 360px Viewport Metrics (Tightest Mobile Target)

Evaluated live via Chrome DevTools MCP (`emulate` 360×740×1, mobile, touch):

| Element / Property | Measured Value at 360px | Invariant / Requirement | Conformance |
|---|---|---|---|
| Primary CTA Bounding Rect | `320px × 59.2px` (Left: 20px, Right: 340px) | `≥44px × ≥44px`, fits 360px | **PASS** (centered, 20px gutters) |
| Secondary CTA Bounding Rect | `320px × 44.0px` (Left: 20px, Right: 340px) | `≥44px × ≥44px`, fits 360px | **PASS** (centered, 20px gutters) |
| Document Scroll Width | `360px` | `scrollWidth ≤ 360px` | **PASS** (zero horizontal spill) |
| Text Truncation / Ellipsis | None (`white-space: normal`, clean 2-line wrap) | Zero truncated text | **PASS** |

### 3c. Desktop 1280px Frozen Verification (Before vs After Side-by-Side)

Evaluated live via Chrome DevTools MCP (`emulate` 1280×800×1, desktop):

| Property | Desktop Before (Step 2) | Desktop After (Step 5) | Delta | Status |
|---|---|---|---|---|
| **Container Flex Direction** | `"row"` | `"row"` | `0` | **IDENTICAL** |
| **Container Gap** | `"14px"` | `"14px"` | `0` | **IDENTICAL** |
| **Container Flex Wrap** | `"wrap"` | `"wrap"` | `0` | **IDENTICAL** |
| **Container Width** | `800px` | `800px` | `0` | **IDENTICAL** |
| **Container Height** | `59.2px` | `59.2px` | `0` | **IDENTICAL** |
| **Primary CTA Width** | `485.475px` | `485.475px` | `0` | **IDENTICAL** |
| **Primary CTA Height** | `59.2px` | `59.2px` | `0` | **IDENTICAL** |
| **Primary CTA Font Size** | `14px` | `14px` | `0` | **IDENTICAL** |
| **Primary CTA Padding** | `10px 24px` | `10px 24px` | `0` | **IDENTICAL** |
| **Primary CTA Line Height**| `16.8px` | `16.8px` | `0` | **IDENTICAL** |
| **Secondary CTA Width** | `181.8125px` | `181.8125px` | `0` | **IDENTICAL** |
| **Secondary CTA Height** | `44px` | `44px` | `0` | **IDENTICAL** |
| **Secondary CTA Font Size**| `14px` | `14px` | `0` | **IDENTICAL** |
| **Secondary CTA Padding** | `10px 24px` | `10px 24px` | `0` | **IDENTICAL** |
| **Secondary CTA Line Ht** | `16.8px` | `16.8px` | `0` | **IDENTICAL** |

---

## 4. Interaction, Physics & A11y Proofs

1. **Tap Floor Proof (WCAG 2.5.5 / T-52 Invariant):**
   - CTA 1: `320px × 59.2px` (width ≥ 44px, height ≥ 44px) -> **PASS**
   - CTA 2: `320px × 44.0px` (width ≥ 44px, height ≥ 44px) -> **PASS**
2. **Button Physics Mechanics (`md-motion-spec.md`):**
   - Rest Transition: `transition: transform 120ms ease-in-out` confirmed.
   - Hover Translation: `.hero-ctas :global(.btn:hover)` -> `transform: translate(7px, -7px) !important;` confirmed in CSSOM.
   - Active Snap: `.hero-ctas :global(.btn:active)` -> `transform: none !important;` confirmed in CSSOM.
   - Focus-Visible Affordance: `.btn:focus-visible` -> `outline: 3px solid var(--color-charcoal-ink); outline-offset: 3px;` confirmed.
3. **PRM (Prefers-Reduced-Motion) Verification:**
   - Evaluated via `src/styles/motion.css` site-wide rule under `@media (prefers-reduced-motion: reduce)`:
     `[data-hero-actions]`, `button`, `.btn`, `.btn:hover`, `.btn:active` enforce `transform: none !important; transition: none !important;`.
4. **Element Collision / Overlap Check (390px):**
   - `ctasWithLede`: `false` (no bounding box overlap)
   - `ctasWithMascot`: `false` (mascot sits below CTAs at top: 590px, CTAs end at top: 570px)
   - `cta1WithCta2`: `false` (14px clean vertical gap between CTAs)

---

## 5. Lighthouse Mobile Quality Audit

Evaluated live via Chrome DevTools MCP `lighthouse_audit` on preview server at `http://localhost:4321/`:

```json
{
  "mode": "navigation",
  "device": "mobile",
  "url": "http://localhost:4321/",
  "categories": {
    "accessibility": 1.0,
    "best-practices": 0.96,
    "seo": 1.0,
    "agentic-browsing": 1.0
  },
  "tapTargetsAudit": {
    "score": 1.0,
    "status": "PASS"
  }
}
```

- **Accessibility Score:** **100 / 100** (Primacy gate passed)
- **Target Size Audit (`target-size`):** **1.0 PASS** (Zero undersized touch targets)
- **Best Practices:** 96 / 100
- **SEO:** 100 / 100

---

## 6. Step 4: Full Battery Verification

### 4a. Astro Check & Build
- Command: `npm run check && npm run build` (tee'd to `/tmp/tui6-build.log`)
- Log Line Count: **247 lines** (exact match to ~247 canon)
- SHA-256: `5c2b1836caaa5137a920a602344c25abe4c1729f9647571423974dff3a9f7158`
- Result: 71 files checked, 0 errors, 0 warnings, 42 hints; 17 static HTML pages built; speakers collection warning present.

### 4b. Test Suite Execution
- Command: `npm test` (tee'd to `/tmp/tui6-test.log`)
- Log Line Count: **465 lines** (exact match to ~465 canon)
- SHA-256: `5f64a8dcc40eef1278c3fc961d0eac5fe4c5ddb87e1a6faf1e9df892fb75b8e9`
- Result: **119/119 E2E tests passed** (100% pass rate)
  - Tier 1: 49 passed
  - Tier 2: 52 passed
  - Tier 3: 12 passed
  - Tier 4: 6 passed

### 4c. Route Parity Audit
- Command: Sanctioned `parity.mjs` execution against `baseline.json` across 10 canonical routes
- Result:
```json
{"totalRoutesScanned":10,"successful":10,"failures":0,"exitCode":0}
```

### 4d. Link Integrity Check
- Command: `npm run check:links`
- Result: Scanned 17 HTML pages, verified 590 internal links and assets, **0 broken internal links** (`590/0`).

### 4e. Protected Diff & Frozen Contract
- Command: `git diff a372314 -- public/admin oauth-worker src/content scripts .github tests astro.config.mjs .env .agents/mcp.json package.json`
- Output: Empty (0 bytes).
- Command: `git diff -G"id=|aria-|href=" src/pages/index.astro`
- Output: Empty (0 bytes).
- Raw Diff on `src/pages/index.astro`:
```diff
diff --git a/src/pages/index.astro b/src/pages/index.astro
index 25aca8d..7de2385 100644
--- a/src/pages/index.astro
+++ b/src/pages/index.astro
@@ -578,6 +578,41 @@ Best regards,`
     .hero-doodle-robot {
       display: none;
     }
+
+    .hero-ctas {
+      flex-direction: column;
+      align-items: center;
+      gap: 14px;
+    }
+
+    .hero-ctas :global(.btn) {
+      white-space: normal;
+      text-align: center;
+      box-sizing: border-box;
+      max-width: 100%;
+      min-height: 44px;
+    }
+
+    .hero-doodle-arrow {
+      flex-shrink: 0;
+    }
+  }
+
+  @media (max-width: 480px) {
+    .hero-ctas {
+      width: 100%;
+      max-width: 320px;
+      margin-left: auto;
+      margin-right: auto;
+    }
+
+    .hero-ctas :global(.btn) {
+      width: 100%;
+      max-width: 100%;
+      padding: 10px var(--spacing-16, 16px);
+      font-size: var(--font-size-body, 0.875rem);
+      line-height: var(--line-height-snug, 1.2);
+    }
   }
 
   .hero-doodle-cloud {
```

### 4f. Hex Code Scan
- Command: `git diff HEAD -- src/pages/index.astro | grep -E "^\+[^\+]" | grep -E "#[0-9a-fA-F]{3,8}" || true`
- Output: Empty (0 added hex codes).

### 4g. 23 Canonical Hooks & 14 Builder Hooks Rider
- All 23 canonical hooks resolved in `dist/`.
- All 14 builder hooks resolved in both `dist/index.html` and `dist/sponsors/index.html` (`[KNOWN PRE-EXISTING, T-CLEAN target]`).
- Count of `email-builder` in `dist/index.html`: exactly `1`.

### 4h. Client JS Bundle Gzip Size
- Command:
```bash
for f in dist/_astro/*.js; do
  gz_size=$(gzip -c "$f" | wc -c)
  raw_size=$(wc -c < "$f")
  echo "$f: raw $raw_size B | gzip $gz_size B"
done
```
- Output:
```text
dist/_astro/BaseLayout.astro_astro_type_script_index_0_lang.OX6IP19n.js: raw 76241 B | gzip 25896 B
```
*(Exact match: 25,896 B; 0% delta).*

---

## 7. Explicit Deviations (≤3)

1. **Owner-Supersedes-GT Ruling (Mobile Hero CTA Sizing):**  
   - *Deviation:* Under `@media (max-width: 480px)`, buttons constrained to `max-width: 320px` with horizontal padding reduced from desktop `24px` to token `16px` (`var(--spacing-16, 16px)`) and `white-space: normal`, rather than overflowing with `white-space: nowrap` (which caused a 485px blowout against 390px viewport).  
   - *Rationale:* Stitch Ground Truth (`docs/redesign/stitch/home-mobile.html`) used short button text ("Join Our Next Meetup" — 20 chars), whereas production markup contains 46 characters ("Join Chapter on Open Community Groups (OCG)"). Enforcing `flex-direction: column` from GT combined with compact padding and wrapping right-sizes the CTAs cleanly while strictly preserving the ≥44px tap floor and button physics.

---

## 8. Evidence Artifacts Table

| Artifact Path | Description | SHA-256 Checksum |
|---|---|---|
| `docs/redesign/evidence/t-ui6/before-mobile-390.png` | Pre-task hero CTA at 390px showing 485px button clipping | `61b25176c017dd8a320ce73ce4c38ac968781299322e7aea921e2fe71b0b7430` |
| `docs/redesign/evidence/t-ui6/after-mobile-390.png` | Post-task hero CTA at 390px showing compact right-sized buttons | `2b6c1b48de4951213c25f29898cadd1ec84eb68a002cb5769789bd813332f468` |
| `docs/redesign/evidence/t-ui6/after-mobile-390-full.png` | Post-task full-page capture at 390px viewport | `2959a9f2f1f2aaadd73541546e895efc85699dea65c465fc6353f408b2a7eb2b` |
| `docs/redesign/evidence/t-ui6/after-mobile-360.png` | Post-task hero CTA at 360px viewport | `6599877f27021c6f07cdf08dff1f164c093d1109b13fee76e7ee4cc84d6ae4f3` |
| `docs/redesign/evidence/t-ui6/after-desktop-1280.png` | Post-task desktop capture at 1280px (100% frozen) | `3eae39c66ef14416c595d33068e09ffcec3212d3799d91ab6114763bf701232c` |
| `docs/redesign/evidence/t-ui6/lh-report.html` | Lighthouse audit HTML report (A11y 100) | `d220fa1ad4237791ff9e6775b0fd4f8e0256ce88e56fe7f2526afd0896251a0b` |
| `docs/redesign/evidence/t-ui6/lh-report.json` | Lighthouse audit JSON report (A11y 100, tap target pass) | `93e778b71defc8b310aee0801bc12567668dd5ffaccf9ccb6e5c573bf7bb3048` |
| `docs/redesign/evidence/t-ui6/tui6-build.log` | Astro check and build log (247 lines) | `5c2b1836caaa5137a920a602344c25abe4c1729f9647571423974dff3a9f7158` |
| `docs/redesign/evidence/t-ui6/tui6-test.log` | Master test runner log (465 lines, 119/119 tests) | `5f64a8dcc40eef1278c3fc961d0eac5fe4c5ddb87e1a6faf1e9df892fb75b8e9` |
| `docs/redesign/evidence/t-ui1/tui1-build.log` | Archived T-UI-1 build log (RIDER-3) | `2ce36ae74a7a7032b05801c2a0d1dc1bc24f5ff7fa7cf12997d8fef0343b95d7` |
| `docs/redesign/evidence/t-ui1/tui1-test.log` | Archived T-UI-1 test log (RIDER-3) | `3185361744e9060f4de0d886a628bcb382b6e5d17b7e74437f79d6913de56ca2` |
