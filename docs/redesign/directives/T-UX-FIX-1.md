# T-UX-FIX-1 · EXECUTION DIRECTIVE

**CNCF Peshawar redesign — UX-AUDIT-1 remediation + MotherDuck motion polish**
Issued by: CTO (Loop Engineering) · 14 November 2026 · Branch: `redesign/ui-motherduck` · Executor: Codex

---

## 0 · Mission

One continuous session, seven ordered phases **A → G**. You will:

1. Execute pre-ratified **T-CLEAN** — delete the homepage duplicate sponsorship builder.
2. Fix **all 22 ratified findings** from `UX-AUDIT-1` (UX-01 … UX-22), with the CTO modifications below.
3. Close known items **K5** (Code of Conduct desktop nav) and **K4** (Blog hero doodle).
4. Apply one **bounded MotherDuck motion-polish pass** (Phase F list only).
5. Run the full battery, write the report, commit per phase, push once, verify deployment.

Nothing outside this directive changes. Every fix is independent and individually evidenced. The audit report and its evidence directory are **read-only reference** — do not modify them.

**CTO modifications to audit recommendations (binding):**

- **UX-03** — There is NO blank-template copy action. Both builder actions ("Copy Email Text", "Open in Email App") are validation-gated. Invalid input → no copy, no mailto; focus + describe the first invalid field.
- **UX-09** — Do NOT guess or web-search a replacement GitHub handle. Remove the broken GitHub link and broken avatar from `subhan-baig.md` (the initials fallback already renders). List the member follow-up in the report for the owner.
- **UX-01** — When no upcoming events remain, render a neutral empty state. Never fabricate events or dates.
- **UX-19** — The editorial update links only to real in-repo URLs (the Genesis event detail page). No invented "materials" links.
- **K2** — CLOSED by CTO as non-reproducible (audit frames evidence). No action; do not chase it.

**CTO-verified contrast targets** (computed with the same WCAG method that reproduces the audit's 3.98:1 and 4.47:1 measurements — executor must still measure and evidence the shipped values):

| Pair | Ratio |
| --- | --- |
| `#383838` (charcoal) on `#ffde00` (canary) — UX-04 | **8.77:1** |
| `#383838` on `#ffffff` — UX-05 | **11.73:1** |
| `#383838` on `#f4efea` (cream) — UX-05 | **10.26:1** |
| `#858585` on `#1a1a1a` (terminal) — UX-20 candidate | **4.72:1** |

---

## 1 · Absolute constraints (obey throughout)

1. **`package.json` is FROZEN.** No new dependencies of any kind. Exactly two client deps remain (`lenis@1.3.26`, `motion@14.0.0`). All new behavior is vanilla CSS/TS inside existing files.
2. **Scoped freeze amendments (this session only):**
   - `src/components/sponsors/SponsorshipEmailBuilder.astro` — edits authorized for UX-03, UX-05, UX-10, UX-13, UX-21 only. The **frozen test hooks** that live in the Sponsors build must survive in identity (tag + id/class, per the grep -oP element-type proofs). The component's client script MAY change for validation logic.
   - `src/components/GenesisCountdown.astro` — markup/label edits authorized for the UX-01 eyebrow only. Its client script stays byte-identical; the countdown's concluded state is accepted and untouched.
   - `src/components/layout/Nav.astro` — markup-only edit authorized for K5. Its client script stays byte-identical.
3. **Motion authority:** `docs/redesign/md-motion-spec.md` governs all timing (buttons hover `translate(7px,-7px)` @ 120 ms / snap @ 30 ms; cards `(-4px,4px)` → `(3,-3)` + `(-6px,6px)` @ 200 ms). Hero H1 is never animated (LCP). The `.js-motion` gate rules all JS-triggered motion. `prefers-reduced-motion` resets all spatial motion; color cues remain.
4. **The `!important` tech-debt on hero CTAs + homepage cards is RATIFIED — never remove it, never add new instances.** UX-22 moves one transform inside a media rule without deleting the ratified overrides' intent.
5. **Credential rule (zero tolerance):** discover a credential/token/key → do not use it, do not print it, STOP, report. Push only with `GIT_TERMINAL_PROMPT=0 git push -u origin redesign/ui-motherduck`.
6. **Fabrication = strike.** Every claim in your report needs a command + real output. Two strikes = halt. Papering over contradictory battery results = strike.
7. **Scope fence:** no drive-by refactors, renames, reformatting, or unspecified "improvements". Diffs must be minimal and reviewable per fix. Functionality changes are sanctioned ONLY as specified in this directive.
8. **Git:** one commit per phase (A…G) on `redesign/ui-motherduck`, author email `abdulmueezawan333@gmail.com`. Push once, at the very end, with the sanctioned command.
9. **Evidence directory:** `docs/redesign/evidence/ux-fix1/`, naming `<fixID>-<target>-<width>-{before|after}.png` (plus `.json`/`.log` for computed-style and probe outputs). Before/after captures for every visual fix.

---

## 2 · Phase 0 — Hydration (mandatory before any edit)

Read completely, in this order — `view_file` anything skill-referenced:

1. `CNCF_REDESIGN_CTO_GUIDE_V5.md` — all of §0–§11 + Appendix A (session boot), B (Loop Engineering preamble incl. credential rule), C (battery canon).
2. `docs/redesign/md-motion-spec.md`.
3. `UX-AUDIT-1.md` + the evidence files it cites for the findings you will fix.
4. `AI_memory.md` and `STATE.md`.
5. `docs/redesign/reports/` — at minimum T-SEO, T-UI-1, T-UI-6, T-55 (for battery commands and conventions).
6. Source you will touch: `src/styles/tokens.css`, `motion.css`, `base.css`, `src/scripts/motion.ts`, `src/components/ui/{Card,LinkButton,Marquee}.astro`, `src/components/layout/{Header,MobileMenu,Nav,Footer}.astro`, `src/components/events/EventCard.astro`, `src/components/GenesisCountdown.astro`, `src/components/CfpBand.astro`, `src/pages/index.astro`, `src/pages/events/index.astro`, `src/pages/events/[slug].astro`, `src/pages/sponsors.astro`, `src/pages/team/[group].astro`, `src/pages/speak.astro`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/code-of-conduct.astro`, `src/pages/404.astro`, `src/content/events/*`, `src/content/members/subhan-baig.md`, `src/content/sponsors/{nic-peshawar,nsave}.md`, `src/content/blog/announcing-cncf-peshawar.md`.
7. `package.json` (observe the freeze).

**Skill mandate:** before using any skill, hydrate it with `view_file`. Relevant candidates: `improve-ui`, `fixing-motion-performance`, `antislop-layoutmobile`, `phase-gated-debugging`, `debugging-toolkit-smart-debug`, `fixing-metadata`. Log which skill served which fix in the report.

**Anchor reproductions (environment parity check):** before editing, reproduce three audit anchors — UX-04 (venue `#6b6b6b` on `#ffde00` = 3.98:1), UX-10 (select clips "Refreshment Partner (Community" at 390), UX-22 (`prefers-reduced-motion: reduce` + hero hover = `matrix(1,0,0,1,7,-7)`). If one fails to reproduce, record it and continue with the rest.

**Baseline:** run `npm run build` + preview and record the baseline battery snapshot (astro check, tests, parity, links, client JS gzip size) so Phase G can show before/after. Copy this directive into `docs/redesign/directives/T-UX-FIX-1.md` (create the directory) before your first commit.

---

## 3 · Phase A — T-CLEAN (do this FIRST)

**Delete the homepage duplicate "Sponsorship Inquiry Generator" (Section 05, cid `j7pv25f6`) from `src/pages/index.astro`**, including its duplicate handler (~line 1525) and every style rule that serves only that section.

- The canonical builder lives only on `/sponsors`. Home keeps its sponsor CTAs into `/sponsors`.
- After deletion: no in-page links or anchors point at the removed section; homepage section numbering has no gap (renumber or drop numbers); `dist/index.html` contains **zero** builder hooks while `dist/sponsors/index.html` still contains **all** of them (prove with the same grep used for the frozen-hook proofs).
- **Test amendment authority (pre-authorized, this scope only):** if a test fails because it asserted the homepage duplicate, update it to assert hooks present on `/sponsors/` and absent on `/` — and list every amendment in the report with before/after assertion text. Any other test failure is a STOP condition (§10).

Commit: `T-CLEAN: remove homepage duplicate sponsorship builder (K1, UX-03 home scope)`.

---

## 4 · Phase B — Content truth

### B1 · UX-01 — close Launchpad registration everywhere

**Anchor:** event front matter line 7 (`src/content/events/02-the-cloud-native-launchpad-docker-kubernetes-real-deployments.md`), `src/pages/events/index.astro:15` and `:47`, `src/pages/events/[slug].astro:123`, `src/components/GenesisCountdown.astro:37`.

**Change:** Launchpad front-matter status → the exact completed vocabulary Genesis uses (read Genesis's front matter first). Events index buckets by status AND schedule date; the featured section's format label derives from the event's own venue/format data (virtual → online wording) — no hardcoded "In-Person" copy; if no upcoming events exist, render a neutral empty state such as "New meetups are on the way — catch up on past events below." The detail page's "OPEN REGISTRATION"/RSVP is gated by status + date; concluded events reuse the concluded treatment Genesis's detail page already has. The GenesisCountdown eyebrow becomes status-driven (concluded → concluded wording consistent with the Events listing).

**Acceptance:** no view anywhere presents the Sept 26 Launchpad as upcoming or open for RSVP; the empty-state path is exercised if no upcoming events remain; the countdown component's script bytes are unchanged.

**Evidence:** before/after screenshots (home, events, detail @390) + the status-logic excerpt.

### B2 · UX-06 — archive from completed events only

**Anchor:** `src/pages/index.astro:295`.

**Change:** "Past Meetups & Technical Labs" renders data-driven cards from completed events (Genesis + Launchpad after B1). Delete the hardcoded October eBPF and November GitOps "COMING" cards.

**Acceptance:** no "COMING" cards remain; every archive card links to a real detail page.

**Evidence:** screenshots 1280 + 390 + link probes for each archive card.

### B3 · UX-12 — verified partner URLs

**Anchor:** `src/content/sponsors/nic-peshawar.md:4`, `src/content/sponsors/nsave.md:4`, `src/pages/index.astro:335`.

**Change:** NIC Peshawar → `https://nicpeshawar.pk/`, nsave → `https://www.nsave.com/` (both audit-verified live). The homepage reads destinations from the sponsor records instead of hardcoding.

**Acceptance:** both partner cards on Home and Sponsors open the verified hosts (HTTP 200 via probe); the content records are the single source of truth.

**Evidence:** link probe outputs for all four card destinations.

### B4 · UX-09 — Subhan Baig broken profile

**Anchor:** `src/content/members/subhan-baig.md:8`, `src/pages/team/[group].astro:98`.

**Change:** remove the 404 GitHub link and the failing avatar URL; the initials fallback renders. Do NOT guess a handle (CTO modification).

**Acceptance:** no broken link or failing image on Tech Team; the card renders initials; the owner follow-up is listed in the report.

**Evidence:** card screenshot + absence of the removed URLs in the built page.

### B5 · UX-18 — Launchpad agenda structure

**Anchor:** event `.md` line 20 (summary) and line 25 (body).

**Change:** rewrite the body with real headings/paragraphs/lists — "What You'll Learn", "Live Hands-On Demonstration", "Who Should Attend" as separate blocks, matching the structure and heading levels of the Genesis detail body. Write a concise standalone summary (no title repetition, no run-on concatenation).

**Acceptance:** the detail page and the Events listing excerpt render scannable structure; the heading outline stays hierarchical (reference the audit's `heading-outlines.txt`).

**Evidence:** before/after detail screenshots + rendered outline excerpt.

### B6 · UX-19 — announcement editorial update

**Anchor:** `src/content/blog/announcing-cncf-peshawar.md:28`.

**Change:** keep the dated invitation text intact; add a clearly dated "Update (November 2026)" note in the RSVP area stating Genesis has concluded, linking to its event detail page. No invented materials links (CTO modification).

**Acceptance:** the update note is visible on the article; the original text is preserved; the link resolves.

**Evidence:** article screenshot + link probe.

Commit: `T-UX-FIX-1/B: content truth — event status, archive, partner links, member record, launchpad structure, announcement update`.

---

## 5 · Phase C — Focus & keyboard

### C1 · UX-02 — mobile drawer as modal

**Anchor:** `src/components/layout/MobileMenu.astro:24` and `:249`.

**Change:** the aside becomes a modal dialog (`role="dialog"`, `aria-modal="true"`); while open, the background page is made inert; Tab/Shift+Tab are contained within the drawer; the existing Escape, outside-tap, and trigger-restore behaviors are preserved.

**Acceptance:** with the drawer open, a full tab cycle in both directions never lands on the covered page; focus returns to the trigger after close.

**Evidence:** tab-sequence logs, both directions, @390.

### C2 · UX-11 — focus reveals immediately

**Anchor:** `src/styles/motion.css:21`, `src/scripts/motion.ts:106`.

**Change:** on `focusin`, if the focused element or any of its ancestors is an unrevealed reveal target, reveal that chain immediately (no waiting for the observer or animation). Respect the `.js-motion` gate. Includes staggered cards — reveal the focused card and its ancestor section.

**Acceptance:** rapid Tab from the top with default motion never focuses a control whose ancestor reports `opacity: 0` (re-run the audit's reveal-followup probe).

**Evidence:** focus-sequence log with ancestor opacity values at each stop.

### C3 · UX-16 — label in name

**Anchor:** `src/components/layout/Header.astro:16`.

**Change:** the "PK" badge is marked decorative (`aria-hidden="true"`); the brand link's accessible name contains the full visible text "CNCF Peshawar PK" (it may append "Home" after it).

**Acceptance:** the Lighthouse label-in-name check clears on every sampled page.

**Evidence:** computed accessible-name probe + Lighthouse a11y entries.

### C4 · UX-22 — reduced-motion hero hover

**Anchor:** `src/pages/index.astro:609`.

**Change:** the spatial hover transform moves inside `@media (prefers-reduced-motion: no-preference)`; hover color/fill cues remain under reduce. Keep the ratified `!important` overrides' intent — do not delete them (constraint 4).

**Acceptance:** reduce + hover → computed transform `none` while the color cue still applies; no-preference + hover → `(7,-7)` @ 120 ms with 30 ms snap; the other primary-route samples keep their resting position.

**Evidence:** computed-style probe for all four combinations (preference × hover), live + local.

Commit: `T-UX-FIX-1/C: focus & keyboard — drawer containment, focus reveal, label-in-name, reduced-motion hero`.

---

## 6 · Phase D — Sponsors builder (post-T-CLEAN, the only builder)

### D1 · UX-03 — validation-gated actions

**Anchor:** `src/components/sponsors/SponsorshipEmailBuilder.astro:24`, `:188`, `:243`.

**Change:** both actions validate the required fields (company, contact, valid email) first. Invalid → no copy, no mailto; focus the first invalid field, describe it via per-field error text (`aria-describedby`) and a polite live region. Valid → proceed; the success message is preserved (polished in Phase F). No blank-template copy action exists (CTO modification).

**Acceptance:** empty or invalid input can never produce "Copied" success or open a mailto; the first invalid field is identified to assistive-tech users; frozen hooks survive per constraint 2.

**Evidence:** interaction logs — empty copy attempt, `invalid-email` attempt, valid copy — @390.

### D2 · UX-05 — legible commitments + required markers

**Anchor:** `src/pages/sponsors.astro:656`, `SponsorshipEmailBuilder.astro:420` (the `index.astro:1342` copy died in Phase A).

**Change:** tier commitment labels → charcoal (CTO target 11.73:1 on white, 10.26:1 on cream; measure the actual pale featured surface too). Required fields are indicated in words — "(required)" in the label text — and any retained marker is charcoal.

**Acceptance:** measured ratios ≥ 4.5:1 for commitments (on white AND the featured surface) and required indicators; every required field is named in words.

**Evidence:** computed-color ratio log + screenshots.

### D3 · UX-10 — select labels fit

**Anchor:** `SponsorshipEmailBuilder.astro:89` and `:424`.

**Change:** option labels are the tier names shown on the cards; parenthetical qualifiers move to associated help text under the control.

**Acceptance:** at 390 and 360, the selected option's full label is visible with no clipping (measured text width vs control inner width).

**Evidence:** screenshots + width measurements at both widths.

### D4 · UX-21 — stable anchor landing

**Anchor:** `src/pages/sponsors.astro:271`, `SponsorshipEmailBuilder.astro:7`, `src/scripts/motion.ts:24`.

**Change:** tier CTAs anchor to a stable wrapper so the builder section's eyebrow and heading land fully in view after both direct deep-link loads and in-page CTA clicks (account for the Lenis 60 ms fragment behavior at `motion.ts:24`).

**Acceptance:** heading top `y ≥ 0` after settle, for both navigation paths, @390.

**Evidence:** bounds measurements for direct load and CTA click.

Commit: `T-UX-FIX-1/D: sponsors builder — validation, contrast, select labels, anchor`.

---

## 7 · Phase E — Affordance, structure, contrast, CTAs

### E1 · UX-04 — venue contrast on canary

**Anchor:** `src/components/events/EventCard.astro:150` and `:228`. **Change:** venue text on the canary featured card → charcoal (CTO target 8.77:1). **Acceptance:** measured ≥ 4.5:1 (expect ~8.8). **Evidence:** computed ratio + screenshot.

### E2 · UX-07 — every moving ticker has a persistent, accurate stop

**Anchors:** `src/pages/index.astro:532` (lower strip) and handler `:1516`; inline rules in `src/pages/team.astro:873`, `src/pages/blog/index.astro:409`, `src/pages/blog/[slug].astro:348`, `src/pages/code-of-conduct.astro:254`, `src/pages/404.astro:308`; shared `src/components/ui/Marquee.astro:52`.

**Change:** adopt the shared Marquee component on all six placements (persistent pause control, accurately announced state — `aria-pressed` + a label that matches the visible text). Fix the Home upper control's stale "Pause marquee" name while showing "PLAY". Under `prefers-reduced-motion`: static presentation, control not shown. If a page ends up with more than one marquee control, their accessible names are distinguishable.

**Acceptance:** all six placements have a working persistent stop with accurate naming; under reduce, no running animation anywhere and no orphan controls.

**Evidence:** per-placement control probe (name/state) + reduced-motion screenshots.

### E3 · UX-08 — honest CTA destinations

**Anchor:** `src/pages/index.astro:344`, `src/components/CfpBand.astro:14` (reference target: `src/pages/sponsors.astro:140`).

**Change:** "View Sponsorship Prospectus" links to the same PDF the Sponsors page uses, mirroring its attributes; the CFP band keeps ONE accurately named CTA into the speaker flow ("Apply to Speak" → `/speak`) — remove the duplicate-labeled link.

**Acceptance:** no two differently-labeled CTAs share a destination on Home/Events; the prospectus CTA returns HTTP 200 `application/pdf`.

**Evidence:** link probes + screenshots.

### E4 · UX-13 — 44px mobile targets

**Anchors:** `src/pages/index.astro:812` (pause button), countdown action buttons, joint sponsor actions, event-detail back links, `src/styles/base.css:294`, `src/components/ui/LinkButton.astro:87`, builder fields (`SponsorshipEmailBuilder.astro:424`).

**Change:** at ≤ 768px, the standalone interactive controls get `min-height: 44px` — ticker pause button, countdown actions, joint sponsor actions, "Back to All Events", builder text inputs, the small-button and small-LinkButton variants. Preserve the compact visual language via padding. The T-UI-6 hero pair already conforms — do not inflate it.

**Acceptance:** computed heights ≥ 44px at 390 and 360 for every listed control; no reflow damage (document scroll width equals viewport on all routes).

**Evidence:** geometry log @390 + 360.

### E5 · UX-14 — roster H2

**Anchor:** `src/pages/team/[group].astro:75` and `:115`. **Change:** add an H2 before each working-group member grid; member names stay H3. **Acceptance:** outline H1 → H2 → H3 on all four group pages. **Evidence:** heading outlines.

### E6 · UX-15 — honest affordance

**Anchor:** `src/pages/speak.astro:73`, `src/pages/sponsors.astro:232`. **Change:** remove the `interactive` treatment from the Speak format cards and Sponsors tier cards (static presentation — no pointer, no lift on the card surface); the real actions (e.g., Draft Proposal link) keep the tactile treatment. **Acceptance:** cursor and computed transform on card centers are default/none; actions remain interactive. **Evidence:** cursor/element probe + hover measurements.

### E7 · UX-17 — 200ms card hover parity

**Anchor:** `src/styles/motion.css:28`, `src/pages/team.astro:166`, `src/pages/team/[group].astro:79`.

**Change:** separate entrance transitions from hover transforms (e.g., settle/cleanup after the entrance completes, or move the entrance transform to a wrapper) so revealed cards' hover lift runs at the spec's 200 ms. The entrance animation itself is unchanged.

**Acceptance:** post-reveal, computed transform transition-duration on Team executive, working-group, member and Blog cards = 200 ms; entrance still animates.

**Evidence:** computed rest/hover values on both targets.

### E8 · UX-20 — terminal label contrast

**Anchor:** `src/pages/index.astro:910`, `src/styles/tokens.css:29`. **Change:** lighten the 13px terminal metadata labels to ≥ 4.5:1 on `#1a1a1a` (CTO candidate `#858585` = 4.72:1; current `#818181` = 4.47:1). Scope the change so no other surface regresses. **Acceptance:** measured ≥ 4.5:1 live + local; the values beside the labels are unaffected. **Evidence:** computed ratio log.

### E9 · K5 — Code of Conduct in desktop nav

**Anchor:** `src/components/layout/Nav.astro` (markup-only; client script byte-identical per constraint 2). **Change:** add "Code of Conduct" as the final desktop nav item (fall back to "Conduct" only if the full label wraps below 1100px — then say so in the report). **Acceptance:** visible at 1280 and 1024 with no wrap or overflow; mobile drawer and footer unchanged (already present). **Evidence:** nav screenshots at 1280/1024/768.

Commit: `T-UX-FIX-1/E: affordance & structure — venue contrast, marquee stops, CTA destinations, 44px targets, roster H2, pointer honesty, hover parity, terminal labels, CoC desktop nav`.

---

## 8 · Phase F — MotherDuck motion polish (sanctioned list ONLY)

All additions: pure CSS or the existing `motion.ts`; timing tokens from the motion spec (120 ms buttons/links, 200 ms cards, 30 ms snap); `.js-motion`-gated if JS-triggered; under `prefers-reduced-motion` only color cues remain; hero H1 untouched; no new `!important`.

1. **Copy-success micro-feedback (builder):** on successful copy, the action's label morphs to a confirmed state (e.g., "Copied ✓") with a 120 ms transition, reverting after ~2 s; the polite live-region message is preserved. (Pairs with D1.)
2. **Text-link hover motion (nav, footer, inline text links):** color + underline transition at 120 ms (color-only under reduced motion).
3. **Builder input focus ring:** a consistent tactile focus-visible treatment (2px charcoal offset ring, matching the site's focus language) on all builder fields.
4. **K4 — Blog hero doodle:** add a decorative hand-drawn SVG doodle to the Blog hero matching the Sponsors pencil-doodle pattern (inline SVG, `aria-hidden`, no external assets, stroke style consistent with existing doodles).

Anything not on this list is out of scope (constraint 7).

Commit: `T-UX-FIX-1/F: MotherDuck motion polish — copy feedback, link hovers, focus rings, blog doodle`.

---

## 9 · Phase G — Battery, sweep, report, push

**Battery — every row reported before/after against the Phase 0 baseline; explain every delta:**

| Row | Requirement |
| --- | --- |
| `astro check` | 0 errors / 0 warnings (hints may move — report the count) |
| Routes | 17 pages (no route changes) |
| Tests | All green after ONLY the pre-authorized T-CLEAN amendments (each amendment listed with before/after assertion text) |
| Parity | 10/10 routes, 0 failures, exit 0 |
| Links | Full crawl, 0 failures; report the new total (baseline 590 — the removed GitHub link and changed partner URLs will move it) |
| Client JS gzip | Before/after (baseline 25,896 B); justify the delta (focus-in handler, marquee adoption, validation logic); flag if > +2 KiB |
| Lighthouse mobile ×5 | Home, Events, Sponsors, Team, Blog on local preview: perf ≥ 95; a11y target 100 everywhere (Events 96 → 100 expected from UX-04 + UX-16) |

**New proofs to capture:** contrast ratios (UX-04, UX-05, UX-20 ≥ 4.5:1), drawer focus-trap log, keyboard reveal log, reduced-motion hero probe, marquee control probes ×6, select-fit measurements, 44px geometry log, anchor-landing bounds.

**Report:** `docs/redesign/reports/T-UX-FIX-1.md` — per fix: ID · files changed · diff summary · each acceptance criterion quoted with its evidence pointer. Plus: the battery table, all deltas, the test-amendment list, owner follow-ups (Subhan Baig's handle; any links you could not verify), and the skills used per fix. Include a known-items ledger: K1 resolved by Phase A; K2 closed by CTO (no action); K3 resolved by Phase D; K4 resolved by Phase F; K5 resolved by Phase E; K6 previously landed. Update `AI_memory.md` (canonical file, then copy to the CNCF location) and `STATE.md`.

**Git & deploy:** commits per phase; a single push at the end: `GIT_TERMINAL_PROMPT=0 git push -u origin redesign/ui-motherduck`. Then verify the Vercel deployment picked up the push — spot-check live (homepage builder gone, Events venue contrast, drawer trap) and record the deployment state; if propagation is still pending, document that and rely on the local-verification results.

---

## 10 · STOP conditions

Halt and report — do not improvise a violating workaround — if:

- Any credential, token, or key is discovered (constraint 5).
- A second fabrication strike occurs (first strike: log it and self-correct with evidence).
- Any test fails outside the pre-authorized T-CLEAN amendment scope.
- A P1 fix cannot be completed within the constraints — complete the remaining work first, then report the blocker with evidence.
- The battery stays red after the authorized amendments.
- The push is refused for authentication — report it; never touch credentials.

**End of directive. — CTO**

---

# CTO RULING · T-UX-FIX-1 / AMENDMENT 1 — §10 stop lifted for F1.2 only

**Stop handling: RATIFIED. Zero source edits, honest sandbox/EPERM and baseline-delta reporting. Ledger clean.**

**F1.2 classification: PRE-EXISTING time-bomb failure, not caused by T-UX-FIX-1.** `tests/fixtures/ocg-portal-upcoming.html` hardcodes 2026-09-04 / 2026-10-15; the clock passed 2026-10-15, so the fallback event correctly computes `completed` and the `upcoming` assertion is unpassable on any later date. The 119/119 canon predates that date.

**AMENDMENT 1 (authorized, bounded):**

1. **Before amending: prove the worktree is clean —** `git status --porcelain` and `git diff --stat HEAD` output into the amendment evidence.
2. **Amend the test and/or fixture so scenario dates are computed relative to the run date (e.g., fixture generated at runtime: future = now + 60 days, past = now − 30 days; comfortable offsets only, never ±1 day — no boundary flake).**
3. **Preserve and STRENGTHEN intent: the amended test must assert BOTH directions — future-dated → `upcoming`, past-dated → `completed`.**
4. **Forbidden: skip/xfail/todo, weakening or snapshot-asserting current behavior, production-source changes under this amendment, re-hardcoding absolute dates.**
5. **Test-side only. Production status logic stays B1 (UX-01) territory; the amended test must remain meaningful for B1.**
6. **File it in the report's test-amendments section: before/after test code + fixture diff + full-suite rerun (unsandboxed, per the established environment constraint) showing 119/119 — and reach 119/119 BEFORE starting Phase A, so T-CLEAN's amendment accounting starts from green.**
7. **Runner exit-code masking (`npm test` exits 0 despite failure) is recorded as new known defect K7 — do NOT fix the runner this session (scope fence). Battery verdict = printed pass/fail counts, not exit code.**
8. **Narrow extension of pre-authorized amendments: tests whose assertions contradict ratified directive behavior (B1 status/date bucketing and derived format labels; D1 validation gating) may be amended to assert the ratified behavior — each with before/after assertion text in the report. All other failures = STOP.**

**BASELINE RE-BASE (ratified):** today's untouched-worktree numbers supersede the directive's cited canon for all Phase G deltas — astro check 0/0/42 hints; 17 pages; tests 119/119 after amendments; links 698 verified / 0 broken; client JS gzip 25,992 B. The drift from the old canon (590 links, 25,896 B) is pre-existing, attributable to commits since T-SEO — not to T-UX-FIX-1.

**Guide substitution (workspace `CNCF_REDESIGN_CTO_GUIDE.md`):** accepted, owner's call. Operative canon this session = the directive + `md-motion-spec.md` + UX-AUDIT-1; where they differ, the directive governs.

**RESUME:** finish Phase 0 hydration + the three anchor reproductions (UX-04, UX-10, UX-22), append this amendment verbatim to `docs/redesign/directives/T-UX-FIX-1.md`, then execute Phases A → G. One commit per phase; push once at the end; verify deployment. §10 remains in force for everything else.
