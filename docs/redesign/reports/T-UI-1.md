# Task Report: T-UI-1 — Homepage Card Physics Parity

**Task ID:** T-UI-1  
**Phase:** Wave C — pre-merge owner-ordered UI polish  
**Agent Role:** Executor, single writer  
**Date:** Tue Oct 13 2026  
**Target:** Bring every static card surface on `/` (`.pillar-card`, `.fact-card`, `.past-card`, `.sponsor-card`) to site-wide MotherDuck card physics per `md-motion-spec.md`.

---

## 1. Executive Summary & Outputs First

- **Objective Met:** All static card tile surfaces on the homepage now conform to MotherDuck card language:
  - Rest elevation: `--shadow-hard-sm` (`-4px 4px 0 0 rgb(56, 56, 56)`)
  - Hover lift: `translate(3px, -3px)` + `--shadow-hard` (`-6px 6px 0 0 rgb(56, 56, 56)`) @ `200ms ease-in-out`
  - Active snap: `transform: none` @ `30ms ease-in-out`
  - PRM fallback: `transform: none !important; transition: none !important;` (fully static)
  - Non-interactive cards retain default cursor (`auto`); zero fake-link affordances added.
- **Battery Status:** 100% GREEN (Astro check 0 errors / 42 hints; build 17 pages; 119/119 E2E tests pass; 10/10 route parity pass; 590/0 links verified; protected diff empty; 0 added hex; gzip 25,896 B [0% delta]).
- **Interaction Proofs:** Verified live via Chrome DevTools MCP at both 1280px desktop and 390px mobile viewports; 0 element overlaps detected; 4 screenshot artifacts sealed in `docs/redesign/evidence/t-ui1/`.

---

## 2. Step 2: Surface Audit Table (improve-ui)

Every card-like surface rendered on `/` was enumerated and audited via Chrome DevTools MCP computed style evaluation and compared against Stitch ground truth mockups:

| Surface Name | Selector | Count | Pre-Task Rest Box-Shadow | Pre-Task Transition | Pre-Task Hover State | Stitch GT Treatment | Task Disposition |
|---|---|---|---|---|---|---|---|
| **Core Pillars** | `.pillar-card` | 4 | `none` | Default `all 0s` | None / static | `box-shadow: none;` (static prototype) | **WORK SET** — Converted to MotherDuck physics |
| **Community Fundamentals** | `.fact-card` | 4 | `none` | Default `all 0s` | None / static | `box-shadow: none;` (static prototype) | **WORK SET** — Converted to MotherDuck physics |
| **Past Meetups Archive** | `.past-card` | 3 | `none` | Default `all 0s` | None / static | `box-shadow: none;` (static prototype) | **WORK SET** — Converted to MotherDuck physics |
| **Sponsors & Partners** | `.sponsor-card` | 3 | `none` | Default `all 0s` | None / static | `box-shadow: none;` (static prototype) | **WORK SET** — Converted to MotherDuck physics |
| **Charter Frame** | `.charter-card` | 1 | `-6px 6px 0 0 rgb(56, 56, 56)` | Default `all 0s` | None / static frame | `box-shadow: var(--shadow-brutal);` | **EXCLUDED** — Section-level feature frame holding terminal; already elevated |
| **Countdown Card** | `.countdown-card` | 1 | `-6px 6px 0 0 rgb(56, 56, 56)` | `box-shadow 0.1s` | Interactive internal CTA | `box-shadow: var(--shadow-brutal);` | **EXCLUDED** — GenesisCountdown component (frozen invariant) |
| **Builder Preview Card** | `.preview-card` | 1 | `none` | Default `all 0s` | None / static | `box-shadow: none;` | **EXCLUDED** — Section 05 dead builder copy (T-CLEAN deletion target) |

**Work Set Definition:** Exactly 14 card tiles across 4 homepage sections (`.pillar-card` [4], `.fact-card` [4], `.past-card` [3], `.sponsor-card` [3]). All other surfaces untouched.

---

## 3. Implementation Details

- **File Modified:** `src/pages/index.astro` ONLY.
- **Rationale for Scoping in `src/pages/index.astro`:**  
  The audited classes (`.pillar-card`, `.fact-card`, `.past-card`, `.sponsor-card`) exist solely on the homepage. Scoping their hover physics directly inside `src/pages/index.astro` avoided mutating global stylesheets (`base.css` / `motion.css`), eliminated risk of unintended side-effects on subpages, and maintained strict component-level encapsulation.
- **CSS Properties Added:**
  ```css
  .fact-card,
  .pillar-card,
  .past-card,
  .sponsor-card {
    box-shadow: var(--shadow-hard-sm);
    transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out;
  }

  .fact-card:hover,
  .pillar-card:hover,
  .past-card:hover,
  .sponsor-card:hover {
    transform: translate(3px, -3px) !important;
    box-shadow: var(--shadow-hard);
  }

  .fact-card:active,
  .pillar-card:active,
  .past-card:active,
  .sponsor-card:active {
    transform: none !important;
    transition: transform 30ms ease-in-out;
  }

  html.js-motion:not(.motion-reduced) .fact-card.is-revealed,
  html.js-motion:not(.motion-reduced) .pillar-card.is-revealed,
  html.js-motion:not(.motion-reduced) .past-card.is-revealed,
  html.js-motion:not(.motion-reduced) .sponsor-card.is-revealed {
    transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .fact-card,
    .fact-card:hover,
    .fact-card:active,
    .pillar-card,
    .pillar-card:hover,
    .pillar-card:active,
    .past-card,
    .past-card:hover,
    .past-card:active,
    .sponsor-card,
    .sponsor-card:hover,
    .sponsor-card:active {
      transform: none !important;
      transition: none !important;
    }
  }
  ```

---

## 4. Full Battery Verification (Doctrine Order)

### 4a. Astro Check & Production Build
- **Command:** `(date -u && npm run check && npm run build) 2>&1 | tee /tmp/tui1-build.log`
- **SHA-256:** `2ce36ae74a7a7032b05801c2a0d1dc1bc24f5ff7fa7cf12997d8fef0343b95d7`
- **Line Count:** `438`
- **Stdout Excerpt:**
  ```text
  Result (71 files): 
  - 0 errors
  - 0 warnings
  - 42 hints

  22:49:16 [build] 17 page(s) built in 11.16s
  22:49:16 [build] Complete!
  ```

### 4b. Master E2E Test Runner (`npm test`)
- **Command:** `(date -u && npm test) 2>&1 | tee /tmp/tui1-test.log`
- **SHA-256:** `3185361744e9060f4de0d886a628bcb382b6e5d17b7e74437f79d6913de56ca2`
- **Line Count:** `466`
- **Duration:** 26419ms
- **Stdout Summary:**
  ```text
  ================================================================================
  📊 MASTER E2E TEST EXECUTION SUMMARY
  ================================================================================
  | Tier                                     | Total | Passed | Failed | Duration |
  |------------------------------------------|-------|--------|--------|----------|
  | Tier 1: Feature Coverage                 |    49 |     49 |      0 |  25981ms |
  | Tier 2: Boundary & Corner Cases          |    52 |     52 |      0 |    118ms |
  | Tier 3: Cross-Feature Integration        |    12 |     12 |      0 |    231ms |
  | Tier 4: Real-World Scenarios             |     6 |      6 |      0 |     85ms |
  |------------------------------------------|-------|--------|--------|----------|
  | TOTAL / OVERALL                          |   119 |    119 |      0 |  26419ms |
  ================================================================================

  ✨ ALL 119 E2E TESTS PASSED SUCCESSFULLY! (100% Pass Rate)
  ⏱️ Total Execution Time: 26419ms
  ```

### 4c. Sanctioned Parity Comparison (Full JSON)
- **Command:** `date -u && node -e "..."`
- **Stdout:**
  ```text
  Tue Oct 13 05:51:59 PM UTC 2026
  --- PER-ROUTE AUDIT ---
  PASS: / ("Cloud Native Peshawar — Official CNCF Community Group")
  PASS: /events/ ("Events & Meetups | CNCF Peshawar")
  PASS: /events/01-cncf-peshawar-genesis/ ("CNCF Peshawar Genesis | CNCF Peshawar")
  PASS: /events/02-the-cloud-native-launchpad-docker-kubernetes-real-deployments/ ("The Cloud Native Launchpad: Docker, Kubernetes & Real Deployments | CNCF Peshawar")
  PASS: /speak/ ("Speaker Hub & Call for Proposals | CNCF Peshawar")
  PASS: /sponsors/ ("Sponsorship Prospectus | CNCF Peshawar")
  PASS: /team/ ("Organizers & Team | CNCF Peshawar")
  PASS: /team/tech-team/ ("Tech Team | CNCF Peshawar Team")
  PASS: /blog/ ("Blog & Community Recaps | CNCF Peshawar")
  PASS: /code-of-conduct/ ("Code of Conduct | CNCF Peshawar")
  --- SUMMARY ---
  {"totalRoutesScanned":10,"successful":10,"failures":0,"exitCode":0}
  ```

### 4d. Internal Link Integrity
- **Command:** `date -u && npm run check:links`
- **Stdout:**
  ```text
  Tue Oct 13 05:52:05 PM UTC 2026

  > cncf-peshawar.github.io@1.0.0 check:links
  > node scripts/check-links.mjs

  🔍 Scanning static build output in "dist" for link & asset integrity...
  📄 Scanned 17 HTML pages.
  🔗 Verified 590 internal links and assets.

  ✅ 0 broken internal links! Static site integrity successfully verified.
  ```

### 4e. Protected Diff & Key Attribute Diff vs Pre-Task Commit (`30c8074`)
- **Command:**
  ```bash
  date -u && git diff 30c8074 -- public/admin oauth-worker src/content scripts .github tests astro.config.mjs .env .agents/mcp.json package.json && git diff 30c8074 -G"id=|aria-|href="
  ```
- **Stdout:**
  ```text
  Tue Oct 13 05:52:12 PM UTC 2026
  ```
  *(Output: empty — 0 bytes)*

### 4f. Raw Hex Code Scan on Touched Files
- **Command:** `date -u && git diff 30c8074 -- src/pages/index.astro | grep -E "^\+[^\+]" | grep -E "#[0-9a-fA-F]{3,8}" || true`
- **Stdout:**
  ```text
  Tue Oct 13 05:52:18 PM UTC 2026
  ```
  *(Output: empty — 0 added hex codes)*  
  *(Pre-existing exception at index.astro:62 `#ffffff` untouched)*

### 4g. 23 Canonical Hooks & 14 Builder Hooks Rider
- **23-Hook Grep Output:**
  ```text
  Tue Oct 13 05:53:01 PM UTC 2026
  HOOK [main-content]: dist/team/events-team/index.html:16:<main id="main-content" data-astro-cid-37fxchfa>
  HOOK [email-builder]: dist/index.html:25:<section id="email-builder" data-reveal data-astro-cid-j7pv25f6>
  HOOK [tiers]: dist/index.html:25:<div id="tiers" class="builder-frame" data-astro-cid-j7pv25f6>
  HOOK [sponsor-form]: dist/index.html:27:<form id="sponsor-form" onsubmit="return false;" data-astro-cid-j7pv25f6>
  HOOK [org-name]: dist/index.html:27:<input type="text" id="org-name" class="form-input" placeholder="e.g. Acme Cloud Corp" required data-astro-cid-j7pv25f6>
  HOOK [contact-name]: dist/index.html:27:<input type="text" id="contact-name" class="form-input" placeholder="e.g. Jane Doe, VP Engineering" required data-astro-cid-j7pv25f6>
  HOOK [contact-email]: dist/index.html:27:<input type="email" id="contact-email" class="form-input" placeholder="e.g. contact@acme.com" required data-astro-cid-j7pv25f6>
  HOOK [tier-select]: dist/index.html:27:<select id="tier-select" class="form-select" data-astro-cid-j7pv25f6>
  HOOK [timeline-select]: dist/index.html:27:<select id="timeline-select" class="form-select" data-astro-cid-j7pv25f6>
  HOOK [org-website]: dist/index.html:27:<input type="url" id="org-website" class="form-input" placeholder="e.g. https://acme.com" data-astro-cid-j7pv25f6>
  HOOK [scope-notes]: dist/index.html:27:<textarea id="scope-notes" class="form-textarea" rows="3" placeholder="e.g. We would like to provide refreshments for 120 attendees." data-astro-cid-j7pv25f6>
  HOOK [email-preview-text]: dist/index.html:27:<pre id="email-preview-text" data-astro-cid-j7pv25f6>
  HOOK [send-mailto-btn]: dist/index.html:49:<a id="send-mailto-btn" href="mailto:cncfpeshawar@gmail.com" class="btn btn-sky btn-sm" data-astro-cid-j7pv25f6>
  HOOK [copy-template-btn]: dist/index.html:49:<button type="button" id="copy-template-btn" class="btn btn-outline btn-sm" data-astro-cid-j7pv25f6>
  HOOK [copy-btn-text]: dist/index.html:49:<span id="copy-btn-text" aria-live="polite" data-astro-cid-j7pv25f6>
  HOOK [mobile-nav-toggle]: dist/team/events-team/index.html:14:<button id="mobile-nav-toggle" class="mobile-nav-toggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-nav-drawer" data-astro-cid-qlfjksao>
  HOOK [mobile-nav-drawer]: dist/team/events-team/index.html:14:<aside id="mobile-nav-drawer" class="mobile-nav-drawer" aria-hidden="true" aria-label="Mobile Navigation Drawer" data-astro-cid-ab2pytf6>
  HOOK [genesis-countdown]: dist/index.html:25:<div class="countdown-grid" id="genesis-countdown" data-astro-cid-4cj74g3c>
  HOOK [cd-days]: dist/index.html:25:<span id="cd-days" data-astro-cid-4cj74g3c>
  HOOK [cd-hours]: dist/index.html:25:<span id="cd-hours" data-astro-cid-4cj74g3c>
  HOOK [cd-mins]: dist/index.html:25:<span id="cd-mins" data-astro-cid-4cj74g3c>
  HOOK [cd-secs]: dist/index.html:25:<span id="cd-secs" data-astro-cid-4cj74g3c>
  HOOK [aria-label="Main Navigation"]: dist/team/events-team/index.html:10:<nav class="desktop-nav" aria-label="Main Navigation" data-astro-cid-afdttjsk>
  ```
- **14 Builder Hooks Rider Output:**
  ```text
  Tue Oct 13 05:53:09 PM UTC 2026
  === HOOK: email-builder ===
  dist/index.html:25:<section id="email-builder" data-reveal data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:30:<section id="email-builder" class="section-wrap email-builder-section" data-reveal data-astro-cid-dipowmmf>
  === HOOK: tiers ===
  dist/index.html:25:<div id="tiers" class="builder-frame" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:26:<section id="tiers" class="section-wrap tiers-section" data-reveal data-astro-cid-3z6uernf>
  === HOOK: sponsor-form ===
  dist/index.html:27:<form id="sponsor-form" onsubmit="return false;" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:32:<form id="sponsor-form" class="form-stack" onsubmit="return false;" data-astro-cid-dipowmmf>
  === HOOK: org-name ===
  dist/index.html:27:<input type="text" id="org-name" class="form-input" placeholder="e.g. Acme Cloud Corp" required data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:33:<input type="text" id="org-name" placeholder="e.g. Acme Cloud Corp / Peshawar University" class="form-input" required data-astro-cid-dipowmmf>
  === HOOK: contact-name ===
  dist/index.html:27:<input type="text" id="contact-name" class="form-input" placeholder="e.g. Jane Doe, VP Engineering" required data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:36:<input type="text" id="contact-name" placeholder="e.g. John Doe, VP Engineering" class="form-input" required data-astro-cid-dipowmmf>
  === HOOK: contact-email ===
  dist/index.html:27:<input type="email" id="contact-email" class="form-input" placeholder="e.g. contact@acme.com" required data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:37:<input type="email" id="contact-email" placeholder="e.g. contact@acme.com" class="form-input" required data-astro-cid-dipowmmf>
  === HOOK: tier-select ===
  dist/index.html:27:<select id="tier-select" class="form-select" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:38:<select id="tier-select" class="form-select" data-astro-cid-dipowmmf>
  === HOOK: timeline-select ===
  dist/index.html:27:<select id="timeline-select" class="form-select" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:39:<select id="timeline-select" class="form-select" data-astro-cid-dipowmmf>
  === HOOK: org-website ===
  dist/index.html:27:<input type="url" id="org-website" class="form-input" placeholder="e.g. https://acme.com" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:35:<input type="url" id="org-website" placeholder="e.g. https://acme.com" class="form-input" data-astro-cid-dipowmmf>
  === HOOK: scope-notes ===
  dist/index.html:27:<textarea id="scope-notes" class="form-textarea" rows="3" placeholder="e.g. We would like to provide refreshments for 120 attendees." data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:41:<textarea id="scope-notes" rows="3" placeholder="e.g. Venue space for 150 attendees, networking table at entrance." class="form-textarea" data-astro-cid-dipowmmf>
  === HOOK: email-preview-text ===
  dist/index.html:27:<pre id="email-preview-text" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:41:<pre id="email-preview-text" class="email-preview-content" data-astro-cid-dipowmmf>
  === HOOK: send-mailto-btn ===
  dist/index.html:49:<a id="send-mailto-btn" href="mailto:cncfpeshawar@gmail.com" class="btn btn-sky btn-sm" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:41:<a id="send-mailto-btn" href="mailto:cncfpeshawar@gmail.com" class="btn btn-sky" data-astro-cid-dipowmmf>
  === HOOK: copy-template-btn ===
  dist/index.html:49:<button type="button" id="copy-template-btn" class="btn btn-outline btn-sm" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:41:<button type="button" id="copy-template-btn" class="btn btn-outline" data-astro-cid-dipowmmf>
  === HOOK: copy-btn-text ===
  dist/index.html:49:<span id="copy-btn-text" aria-live="polite" data-astro-cid-j7pv25f6> [KNOWN PRE-EXISTING, T-CLEAN target]
  dist/sponsors/index.html:41:<span id="copy-btn-text" aria-live="polite" data-astro-cid-dipowmmf>
  grep -c 'id="email-builder"' dist/index.html:
  1
  ```

### 4h. Canonical Client JS Bundle Gzip Loop
- **Command:**
  ```bash
  date -u
  for f in dist/_astro/*.js; do
    gz_size=$(gzip -c "$f" | wc -c)
    raw_size=$(wc -c < "$f")
    echo "$f: raw $raw_size B | gzip $gz_size B"
  done
  ```
- **Stdout:**
  ```text
  Tue Oct 13 05:53:15 PM UTC 2026
  dist/_astro/BaseLayout.astro_astro_type_script_index_0_lang.OX6IP19n.js: raw 76241 B | gzip 25896 B
  ```
  *(Exactly 1 client JS bundle at 25,896 B — 0% delta vs pre-task baseline)*

---

## 5. Interaction Proofs (Chrome DevTools MCP)

Live runtime evaluation on preview server (`http://localhost:4321/`) at both 1280px desktop and 390px mobile viewports.

### 5a. 1280px Desktop Viewport Computed Styles

- **Rest State (Pillar Card):**
  - `transition`: `transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out`
  - `boxShadow`: `rgb(56, 56, 56) -4px 4px 0px 0px` (resolves to `--shadow-hard-sm`)
  - `transform`: `matrix(1, 0, 0, 1, 0, 0)`
  - `cursor`: `auto`

- **Rest State (Fact / Stat Card):**
  - `transition`: `transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out`
  - `boxShadow`: `rgb(56, 56, 56) -4px 4px 0px 0px` (resolves to `--shadow-hard-sm`)
  - `transform`: `matrix(1, 0, 0, 1, 0, 0)`
  - `cursor`: `auto`

- **Hover State (`:hover` via DevTools cursor hover):**
  - `Fact Card transform`: `matrix(1, 0, 0, 1, 3, -3)` (exact `translate(3px, -3px)`)
  - `Fact Card boxShadow`: `rgb(56, 56, 56) -6px 6px 0px 0px` (exact `--shadow-hard`)
  - `Pillar Card transform`: `matrix(1, 0, 0, 1, 3, -3)` (exact `translate(3px, -3px)`)
  - `Pillar Card boxShadow`: `rgb(56, 56, 56) -6px 6px 0px 0px` (exact `--shadow-hard`)

- **Active Snap State (`:active`):**
  - `Fact Card transform`: `none` (!important)
  - `Fact Card transition`: `transform 30ms ease-in-out`
  - `Pillar Card transform`: `none` (!important)
  - `Pillar Card transition`: `transform 30ms ease-in-out`

- **PRM Invariant (`@media (prefers-reduced-motion: reduce)`):**
  - Rule selector: `.fact-card, .fact-card:hover, .fact-card:active, .pillar-card, .pillar-card:hover, .pillar-card:active, .past-card, .past-card:hover, .past-card:active, .sponsor-card, .sponsor-card:hover, .sponsor-card:active`
  - `transform`: `none !important`
  - `transition`: `none !important`

### 5b. 390px Mobile Viewport Computed Styles

- **Rest State (Fact / Stat Card at 390px):**
  - `transition`: `transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out`
  - `boxShadow`: `rgb(56, 56, 56) -4px 4px 0px 0px`
  - `transform`: `matrix(1, 0, 0, 1, 0, 0)`
  - `cursor`: `auto`

- **Hover State (`:hover` at 390px):**
  - `Fact Card transform`: `matrix(1, 0, 0, 1, 3, -3)`
  - `Fact Card boxShadow`: `rgb(56, 56, 56) -6px 6px 0px 0px`

- **Overlap Collision Proof:**
  - Evaluated cross-element collisions between cards, grid siblings, and hero elements at 1280px and 390px:
  - 1280px: `0 overlaps detected, collisions: []`
  - 390px: `0 overlaps detected, collisions: []`

### 5c. Evidence Files Sealed
- `docs/redesign/evidence/t-ui1/desktop-rest.png` (325,985 B)
- `docs/redesign/evidence/t-ui1/desktop-hover.png` (329,709 B)
- `docs/redesign/evidence/t-ui1/mobile-rest.png` (255,112 B)
- `docs/redesign/evidence/t-ui1/mobile-hover.png` (255,029 B)

---

## 6. Explicit Deviations (≤3)

1. **`!important` Specificity on Scoped Card `:hover` and `:active` CSS:**  
   *Rationale:* `src/scripts/motion.ts` runs entrance animations on `[data-reveal-group] [data-reveal-item]`, injecting runtime inline `style="opacity: 1; transform: translateY(0px);"` on card completion. In CSS cascade specificity, inline styles override standard stylesheet pseudo-classes (`specificity 1,0,0,0 > 0,2,0`). Adding `!important` to `:hover` and `:active` rules guarantees standard MotherDuck hover lift without touching frozen client scripts, exactly following the ratified T-HERO-B precedent.
2. **Work Set Scope Extension to `.past-card` and `.sponsor-card`:**  
   *Rationale:* Directive instructed to bring "every static-looking card surface on the homepage (CORE PILLARS cards, community-facts/stat cards, and any other card surfaces found in the audit)" to parity. The Step 2 audit revealed that `.past-card` and `.sponsor-card` were identical static tiles with zero rest shadow and zero hover. Unifying all 4 homepage card grids guarantees complete visual and interactive consistency across `/`.

---

## 7. Status & Handoff

- **Commit Ready:** `src/pages/index.astro`, `docs/redesign/reports/T-UI-1.md`, `docs/redesign/evidence/t-ui1/`
- **Next Task:** T-UI-2 (or T-CLEAN per CTO queue)
