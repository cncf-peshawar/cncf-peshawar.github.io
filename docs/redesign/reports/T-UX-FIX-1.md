# T-UX-FIX-1 — execution report

**Date:** 14 November 2026 (Asia/Karachi)  
**Branch:** `redesign/ui-motherduck`  
**Status:** Resumed under CTO Amendment 1; Phases A–E complete. The Phase 0 stop and its evidence remain below as a historical record.

## Stop condition

The baseline test suite is red on an existing, non-T-CLEAN test. The directive permits amendments only for tests that assert the homepage duplicate builder and says to halt if any other test fails. No source file or test was changed, and no phase commit or push was made.

An unsandboxed `npm test` run reported **118 passed, 1 failed** out of 119. Its sole failure is `F1.2: Detects status automatically (upcoming for future, completed for past)`:

```text
Error: Future event should have upcoming status
+ actual - expected
+ 'completed'
- 'upcoming'
```

The test in `tests/tier1-feature-coverage.test.mjs` selects an event with a date later than `Date.now()`, **or** falls back to `upcomingEvents[1]`, then asserts that entry is `upcoming`. The fixture `tests/fixtures/ocg-portal-upcoming.html` dates its two events **September 4** and **October 15, 2026**. The local clock output was `2026-11-14T19:25:34+05:00`, so both fixture dates are past and the fallback is completed. This is a stale-date test fixture/expectation, not a failure introduced by T-UX-FIX-1. [Unsandboxed test output](../evidence/ux-fix1/phase0-tests-unsandboxed.log).

The first sandboxed `npm test` run reported 114 passed and 5 failed. Four of those failures came from the sandbox denying `spawnSync` with `EPERM` and empty captured stdout. A direct Node reproduction returned `{"status":0,"stdoutLength":0,"stderrLength":0,"error":"spawnSync node EPERM"}`. The unsandboxed rerun cleared those four failures. [Sandboxed test output](../evidence/ux-fix1/phase0-tests-sandbox.log).

## Phase 0 baseline captured before any implementation edit

| Check | Observed result |
| --- | --- |
| `npm run build` | Exit 0; Astro check: 0 errors, 0 warnings, 42 hints; 17 pages built. |
| `npm test` (unsandboxed, to allow child processes) | 118/119 pass; F1.2 fails. The test runner exits 0 despite reporting a failure. |
| `npm run check:links` | 17 pages; 698 internal links and assets verified; 0 broken. [Output](../evidence/ux-fix1/phase0-links.log). |
| Client JS gzip | 25,992 B (`gzip -c dist/_astro/*.js \| wc -c`). |

The directive's cited baseline values of 590 links and 25,896 B gzip do not match this worktree's current build. Those are recorded as baseline deltas, not attributed to this task.

The required `CNCF_REDESIGN_CTO_GUIDE_V5.md` was absent from the workspace and Downloads. The owner authorized using the workspace `CNCF_REDESIGN_CTO_GUIDE.md` instead. The motion spec, UX audit, package manifest, and available CTO guide were read; remaining Phase 0 hydration and anchor reproductions were not completed after the stop condition fired.

## Work status

- Phases A–G: not started.
- UX-01–UX-22 and K1/K3/K4/K5: unchanged.
- Directive copy, before/after captures, test amendments, commits, push, and Vercel verification: not performed.
- This report and the three Phase 0 log files are the only artifacts created by this attempt. Existing untracked audit and earlier report files were left untouched.

The owner and CTO supplied Amendment 1, lifting §10 for F1.2 only. The ruling is appended to [the in-repo directive](../directives/T-UX-FIX-1.md).

## Amendment 1 — test repair before Phase A

The pre-amendment `git status --porcelain` contained only existing untracked report/evidence files, including this Phase 0 stop report. `git diff --stat HEAD` was empty, proving no tracked source edits. [Status](../evidence/ux-fix1/amendment1-status-before.log) · [diff stat](../evidence/ux-fix1/amendment1-diffstat-before.log).

**F1.2 before:**

```js
const pastHtml = fs.readFileSync('tests/fixtures/ocg-portal-past.html', 'utf-8');
const pastEvents = parseOcgGroupHtml(pastHtml).embeddedEvents;
assert.equal(pastEvents.length, 1);
assert.equal(pastEvents[0].status, 'completed', 'Past event should automatically have completed status');

const upcomingHtml = fs.readFileSync('tests/fixtures/ocg-portal-upcoming.html', 'utf-8');
const upcomingEvents = parseOcgGroupHtml(upcomingHtml).embeddedEvents;
const futureEvent = upcomingEvents.find(e => new Date(e.date).getTime() > Date.now()) || upcomingEvents[1];
assert.equal(futureEvent.status, 'upcoming', 'Future event should have upcoming status');
```

**F1.2 after:** The test reads the existing OCG fixture, replaces its `data-starts` attributes in memory with dates 60 days ahead and 30 days behind the run clock, and asserts both events in both directions. No production source or fixture file changed.

```js
const fixtureHtml = fs.readFileSync('tests/fixtures/ocg-portal-upcoming.html', 'utf-8');
const withStartDate = (daysFromNow) => fixtureHtml.replace(
  /data-starts="[^"]+"/g,
  `data-starts="${new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString()}"`
);
const futureEvents = parseOcgGroupHtml(withStartDate(60)).embeddedEvents;
const pastEvents = parseOcgGroupHtml(withStartDate(-30)).embeddedEvents;
assert.equal(futureEvents.length, 2);
assert.equal(pastEvents.length, 2);
assert.ok(futureEvents.every(event => event.status === 'upcoming'), 'Future events should automatically have upcoming status');
assert.ok(pastEvents.every(event => event.status === 'completed'), 'Past events should automatically have completed status');
```

**Fixture diff:** none. **Full suite after amendment, before Phase A:** 119/119 passed; [raw unsandboxed output](../evidence/ux-fix1/amendment1-tests.log). Astro check: 0 errors, 0 warnings, 42 hints; [output](../evidence/ux-fix1/amendment1-check.log).

**K7:** The test runner prints failure counts but returns exit 0 when a test fails. Its code is untouched. Battery verdicts in this report use the printed passed/failed counts.

## Phase 0 anchor reproductions

Local Chrome on Astro preview at 390px reproduced all three anchors: UX-04 venue text `rgb(107, 107, 107)` on canary `rgb(255, 222, 0)`; UX-10 selected option width 362.35px in a 314px control with 14px padding on each side; UX-22 under reduced motion changed from `transform: none` at rest to `matrix(1, 0, 0, 1, 7, -7)` on hover. [Computed values](../evidence/ux-fix1/phase0-anchors.json) · [UX-04](../evidence/ux-fix1/UX-04-events-390-before.png) · [UX-10](../evidence/ux-fix1/UX-10-sponsors-390-before.png) · [UX-22](../evidence/ux-fix1/UX-22-home-390-before.png).

## Phase A — K1 / T-CLEAN

`src/pages/index.astro`: removed the complete duplicate builder section, its exclusive CSS, client handler, and unused `Frame` import. Home retains sponsor CTAs to `/sponsors`; the numbered sections end at `04 // SPONSORS & PARTNERS`, with no gap. No test asserted the homepage duplicate, so there was **no T-CLEAN test amendment**.

> “After deletion: no in-page links or anchors point at the removed section; homepage section numbering has no gap; `dist/index.html` contains zero builder hooks while `dist/sponsors/index.html` still contains all of them.”

The [hook log](../evidence/ux-fix1/phase-a-hooks.log) records zero occurrences of every one of 14 builder hooks on Home and all 14 on Sponsors, with the canonical element types (`section`, `form`, `input`, `select`, `textarea`, `pre`, `a`, `button`, `span`). Build produced 17 pages; Astro check remained 0/0/42; [build output](../evidence/ux-fix1/phase-a-build.log) · [check output](../evidence/ux-fix1/phase-a-check.log). The [unsandboxed test suite](../evidence/ux-fix1/phase-a-tests.log) printed 119/119 passed. The [link crawl](../evidence/ux-fix1/phase-a-links.log) verified 698 links/assets with 0 broken. [Before](../evidence/ux-fix1/K1-home-390-before.png) · [After 390](../evidence/ux-fix1/K1-home-390-after.png) · [After 1280](../evidence/ux-fix1/K1-home-1280-after.png).

## Phase B — content truth

**UX-01.** Files: `src/content/events/02-the-cloud-native-launchpad-docker-kubernetes-real-deployments.md`, `src/pages/index.astro`, `src/pages/events/index.astro`, `src/pages/events/[slug].astro`, `src/components/events/EventCard.astro`, and the permitted eyebrow in `src/components/GenesisCountdown.astro`. Launchpad status now uses Genesis's `completed` vocabulary. Home and Events filter upcoming records by status **and** schedule date; Home renders a neutral empty state when none remain. Events' featured format wording derives from venue/location. Detail and cards gate RSVP by status and date. The countdown client script is byte-identical to Phase A (`sha256 7578360674c65a408da2c6a970320f69e342c865ac04fc991fbd9a037d3a04d7`).

> “No view anywhere presents the Sept 26 Launchpad as upcoming or open for RSVP; the empty-state path is exercised if no upcoming events remain; the countdown component's script bytes are unchanged.”

The local route probe records Home's empty-state text, Events' empty state and archive, and **0** `OPEN REGISTRATION` or `RSVP on Open Community Groups` labels on Launchpad. [Route probe](../evidence/ux-fix1/phase-b-route-probes.json) · [status logic](../evidence/ux-fix1/phase-b-status-logic.log) · [countdown script comparison](../evidence/ux-fix1/phase-b-countdown-script.log) · [Home before](../evidence/ux-fix1/UX-01-home-390-before.png) / [after](../evidence/ux-fix1/UX-01-home-390-after.png) · [Events before](../evidence/ux-fix1/UX-01-events-390-before.png) / [after](../evidence/ux-fix1/UX-01-events-390-after.png) · [Launchpad before](../evidence/ux-fix1/UX-01-launchpad-390-before.png) / [after](../evidence/ux-fix1/UX-01-launchpad-390-after.png).

**UX-06.** File: `src/pages/index.astro`. Replaced hardcoded future eBPF and GitOps cards with a descending list from `completed` event records.

> “No ‘COMING’ cards remain; every archive card links to a real detail page.”

The Home probe lists two archive links, to Launchpad and Genesis; both returned local HTTP 200. [Route probe](../evidence/ux-fix1/phase-b-route-probes.json) · [HTTP probes](../evidence/ux-fix1/phase-b-archive-links.log) · [Before 1280](../evidence/ux-fix1/UX-06-home-1280-before.png) · [After 1280](../evidence/ux-fix1/UX-06-home-1280-after.png) · [After 390](../evidence/ux-fix1/UX-06-home-390-after.png).

**UX-12.** Files: `src/content/sponsors/nic-peshawar.md`, `src/content/sponsors/nsave.md`, `src/pages/index.astro`. Home now reads the two partner destinations from sponsor records; Sponsors already did.

> “Both partner cards on Home and Sponsors open the verified hosts (HTTP 200 via probe); the content records are the single source of truth.”

The four built hrefs resolve to `https://nicpeshawar.pk/` or `https://www.nsave.com/`. Both hosts returned HTTP 200. [Rendered hrefs and HTTP probes](../evidence/ux-fix1/phase-b-partner-links.log).

**UX-09.** File: `src/content/members/subhan-baig.md`. Removed the broken GitHub avatar and profile URL. The existing initials fallback renders `SB`.

> “No broken link or failing image on Tech Team; the card renders initials; the owner follow-up is listed in the report.”

Chrome found 0 images and 0 old GitHub links in Subhan's card, with visible initials `SB`. [Route probe](../evidence/ux-fix1/phase-b-route-probes.json) · [Before](../evidence/ux-fix1/UX-09-tech-390-before.png) / [after](../evidence/ux-fix1/UX-09-tech-390-after.png). **Owner follow-up:** ask Subhan Baig to confirm a public GitHub handle and avatar URL before restoring either.

**UX-18.** File: `src/content/events/02-the-cloud-native-launchpad-docker-kubernetes-real-deployments.md`. Replaced the run-on body with separate `##` sections and lists; summary is standalone and concise.

> “The detail page and the Events listing excerpt render scannable structure; the heading outline stays hierarchical.”

The rendered outline contains H1 followed by H2 `About This Event`, `What You’ll Learn`, `Live Hands-On Demonstration`, `Who Should Attend`, and `Event Details`; the route probe records it. [Outline](../evidence/ux-fix1/phase-b-route-probes.json) · [Before](../evidence/ux-fix1/UX-01-launchpad-390-before.png) / [after](../evidence/ux-fix1/UX-01-launchpad-390-after.png).

**UX-19.** File: `src/content/blog/announcing-cncf-peshawar.md`. Preserved the original August invitation and appended `Update (November 2026)` in the RSVP area, linking only to the in-repo Genesis detail page.

> “The update note is visible on the article; the original text is preserved; the link resolves.”

Chrome found the update and the Genesis link once each; the detail URL returned local HTTP 200. [Route probe](../evidence/ux-fix1/phase-b-route-probes.json) · [archive/detail HTTP probe](../evidence/ux-fix1/phase-b-archive-links.log) · [Before](../evidence/ux-fix1/UX-19-announcement-390-before.png) / [after](../evidence/ux-fix1/UX-19-announcement-390-after.png).

**Phase B battery:** [build](../evidence/ux-fix1/phase-b-build.log) 17 pages, Astro check 0 errors / 0 warnings / 42 hints; [unsandboxed tests](../evidence/ux-fix1/phase-b-tests.log) 119/119; [links](../evidence/ux-fix1/phase-b-links.log) 700 verified, 0 broken. No Phase B test amendment was needed. The link count rose by 2 from the rebased 698 baseline; the changed Home archive and event-state markup are the relevant source changes, but this count is not attributed to an individual link without a link-checker breakdown.

## Phase C — focus and keyboard

**UX-02.** File: `src/components/layout/MobileMenu.astro`. The drawer is a modal dialog, body siblings other than the dialog and overlay become inert while it is open, Tab and Shift+Tab wrap within its focusable controls, and Escape/overlay/trigger close paths restore focus to the trigger.

> “With the drawer open, a full tab cycle in both directions never lands on the covered page; focus returns to the trigger after close.”

At 390px, the Chrome probe recorded `role=dialog`, `aria-modal=true`, 7 inert background elements, 13 forward and 13 backward focus stops all inside the drawer, and trigger focus after Escape. [Full tab sequence](../evidence/ux-fix1/phase-c-probes.json) · [drawer after](../evidence/ux-fix1/UX-02-drawer-390-after.png) · [drawer before](../evidence/ux-audit/home-live-390-drawer-focus.png).

**UX-11.** File: `src/scripts/motion.ts`. A `.js-motion`-gated `focusin` handler immediately reveals a focused control's unrevealed section and card ancestors. Pending observers skip already-revealed items so they do not hide the focused item again; remaining cards retain their entrance animation.

> “Rapid Tab from the top with default motion never focuses a control whose ancestor reports `opacity: 0`.”

The 32-stop keyboard probe at 390px recorded **0** focused reveal ancestors with opacity below 1. [Every stop and ancestor opacity](../evidence/ux-fix1/phase-c-probes.json) · [pre-fix audit sequence](../evidence/ux-audit/reveal-followup.json).

**UX-16.** File: `src/components/layout/Header.astro`. The visible `PK` badge is decorative and the brand link's accessible name is `CNCF Peshawar PK Home`.

> “The Lighthouse label-in-name check clears on every sampled page.”

Chrome recorded visible text `CNCF Peshawar PK`, accessible name `CNCF Peshawar PK Home`, and `aria-hidden=true` on the badge. [Computed DOM probe](../evidence/ux-fix1/phase-c-probes.json). Lighthouse confirmation is part of Phase G.

**UX-22.** File: `src/pages/index.astro`. The ratified hero CTA transform overrides remain intact inside `prefers-reduced-motion: no-preference`; the reduced-motion color cue remains.

> “Reduce + hover → computed transform `none` while the color cue still applies; no-preference + hover → `(7,-7)` @ 120 ms with 30 ms snap.”

The local four-state probe records reduced rest/hover `none`, with blue → yellow background, and default-motion hover `matrix(1,0,0,1,7,-7)` with a 0.12s transition. [Computed states](../evidence/ux-fix1/phase-c-probes.json) · [reduced hover](../evidence/ux-fix1/UX-22-home-1280-reduce-after.png) · [default hover](../evidence/ux-fix1/UX-22-home-1280-no-preference-after.png) · [pre-fix](../evidence/ux-fix1/UX-22-home-390-before.png). Active snap and live deployment confirmation remain in Phase G.

**Phase C battery:** [build](../evidence/ux-fix1/phase-c-build.log) 17 pages, Astro check 0 errors / 0 warnings / 42 hints; [unsandboxed tests](../evidence/ux-fix1/phase-c-tests.log) 119/119; [links](../evidence/ux-fix1/phase-c-links.log) 700 verified, 0 broken. No Phase C test amendment was needed.

## Phase D — Sponsors builder

**UX-03.** File: `src/components/sponsors/SponsorshipEmailBuilder.astro`. Both Copy Email Text and Open in Email App validate company, contact, and email before acting. Invalid fields receive visible per-field errors, `aria-invalid`, `aria-describedby`, a polite status message, and first-invalid focus. The static and dynamic mailto href stays on the local builder anchor until all three fields are valid. Valid copy retains a success label and live-region message.

> “Empty or invalid input can never produce ‘Copied’ success or open a mailto; the first invalid field is identified to assistive-tech users; frozen hooks survive.”

At 390px, the empty-copy and empty-mailto attempts focused `org-name`, left the clipboard empty and the URL at `/sponsors/`, and exposed all three field descriptions. The `invalid-email` attempt focused `contact-email`, with no copy. A valid email produced a mailto with the entered values and copied the full text. [Interaction log](../evidence/ux-fix1/phase-d-probes.json) · [invalid after](../evidence/ux-fix1/UX-03-sponsors-390-invalid-after.png) · [valid after](../evidence/ux-fix1/UX-03-sponsors-390-after.png) · [before](../evidence/ux-fix1/UX-03-sponsors-390-before.png). The [grep element-type proof](../evidence/ux-fix1/phase-d-hooks.log) shows all 14 canonical hooks on Sponsors and zero on Home.

**UX-05.** Files: `src/pages/sponsors.astro`, `src/components/sponsors/SponsorshipEmailBuilder.astro`. Commitment text uses charcoal; all five marked field labels say `(required)` in words, with charcoal text.

> “Measured ratios ≥ 4.5:1 for commitments (on white AND the featured surface) and required indicators; every required field is named in words.”

Chrome measured 11.73:1 for commitments on white, 11.16:1 on the pale featured card, and 11.73:1 for each required label on white. [Computed ratios](../evidence/ux-fix1/phase-d-probes.json) · [before](../evidence/ux-fix1/UX-05-sponsors-390-before.png) / [after](../evidence/ux-fix1/UX-05-sponsors-390-after.png).

**UX-10.** File: `src/components/sponsors/SponsorshipEmailBuilder.astro`. Visible option labels now use the tier-card names; detailed qualifiers remain in option values for proposal text, and associated help text explains the options below the control.

> “At 390 and 360, the selected option's full label is visible with no clipping.”

Every label fit the conservative control inner width, including the longest `Annual Ecosystem Partner` at 202.20px against 266px at 390 and 236px at 360. [Width measurements](../evidence/ux-fix1/phase-d-probes.json) · [audit before](../evidence/ux-fix1/UX-10-sponsors-390-audit-before.png) · [after 390](../evidence/ux-fix1/UX-10-sponsors-390-after.png) · [after 360](../evidence/ux-fix1/UX-10-sponsors-360-after.png).

**UX-21.** Files: `src/components/sponsors/SponsorshipEmailBuilder.astro`, `src/scripts/motion.ts`. The preserved `section#email-builder` now sits in a stable, non-revealing wrapper. The existing deep-link URL remains intact; Lenis scrolls the wrapper with a 24px top offset, and native scrolling gets `scroll-margin-top`.

> “Heading top `y ≥ 0` after settle, for both navigation paths, @390.”

After both direct `?tier=Venue%20Host%20Partner#email-builder` load and a settled tier-CTA click, Chrome measured section y=23.66px, eyebrow y=59.66px, heading y=84.84px, with the correct tier selected. [Bounds and URL](../evidence/ux-fix1/phase-d-probes.json) · [direct after](../evidence/ux-fix1/UX-21-sponsors-direct-390-after.png) · [CTA after](../evidence/ux-fix1/UX-21-sponsors-cta-390-after.png) · [before](../evidence/ux-fix1/UX-21-sponsors-390-before.png).

**Phase D battery:** [build](../evidence/ux-fix1/phase-d-build.log) 17 pages, Astro check 0 errors / 0 warnings / 42 hints; [unsandboxed tests](../evidence/ux-fix1/phase-d-tests.log) 119/119; [links](../evidence/ux-fix1/phase-d-links.log) 701 verified, 0 broken. No Phase D test amendment was needed. The +1 link-count delta is consistent with the builder's new local fragment href; no link-checker per-link breakdown was captured.

## Remaining work

Phases F–G remain to be executed. The old stop report above describes the pre-amendment state and does not describe the current implementation status.

## Phase E — affordance, structure, contrast, CTAs

**UX-04.** `src/components/events/EventCard.astro`: the featured card's venue uses charcoal. “Measured ≥ 4.5:1 (expect ~8.8).” Chrome measured `rgb(56,56,56)` on canary `rgb(255,222,0)` at **8.77:1**. With no future event currently scheduled, the browser probe applied the featured class to an archive card to exercise the same CSS state. [Computed ratio](../evidence/ux-fix1/phase-e-probe2.json) · [screenshot](../evidence/ux-fix1/phase-e-venue-390.png).

**UX-07.** `src/pages/index.astro`, `src/components/ui/Marquee.astro`, and the five Team/Blog/article/Conduct/404 pages: six formerly unpausable placements now use the shared Marquee; the Home upper custom control now keeps its text, accessible name, and `aria-pressed` in sync. “All six placements have a working persistent stop with accurate naming; under reduce, no running animation anywhere and no orphan controls.” Chrome exercised all seven controls (two on Home): each changed PAUSE/false to PLAY/true with a distinct accessible name. Under reduced motion every track's animation computed `none`, and every control computed `display:none`. [Control and reduced-motion states](../evidence/ux-fix1/phase-e-probe.json) · [Home reduced screenshot](../evidence/ux-fix1/phase-e-reduce-home.png).

**UX-08.** `src/pages/index.astro`, `src/components/CfpBand.astro`: Home prospectus goes directly to the Sponsors PDF with matching download filename; the CFP band has one speaker CTA. “No two differently-labeled CTAs share a destination on Home/Events; the prospectus CTA returns HTTP 200 `application/pdf`.” The link probe found the PDF href and a single “Apply to Speak at CNCF Peshawar” CTA; local HTTP returned 200 and `application/pdf`. [Link probe](../evidence/ux-fix1/phase-e-probe.json) · [PDF response](../evidence/ux-fix1/phase-e-pdf-head.log).

**UX-13.** `src/pages/index.astro`, `src/styles/base.css`, `src/components/ui/LinkButton.astro`, `src/components/sponsors/SponsorshipEmailBuilder.astro`, `src/pages/events/[slug].astro`: listed small controls and inputs have 44px mobile minimums. The event-detail page's local 34px override was found in the first browser probe and corrected. “Computed heights ≥ 44px at 390 and 360 for every listed control; no reflow damage (document scroll width equals viewport on all routes).” Home ticker, both joint sponsor actions, Sponsors inputs/selects, and detail back link measure 44px at both widths; sampled routes have zero horizontal overflow. The countdown actions are absent in today's empty-state path, but their shared `btn-sm` rule has the same 44px mobile minimum. Full-route overflow sweep follows in Phase G. [Initial and final geometry](../evidence/ux-fix1/phase-e-probe2.json) · [detail correction](../evidence/ux-fix1/phase-e-final-probe.json).

**UX-14.** `src/pages/team/[group].astro`: added a section H2 before the member grid while keeping names H3. “Outline H1 → H2 → H3 on all four group pages.” All four group routes match that sequence. [Heading outlines](../evidence/ux-fix1/phase-e-probe2.json).

**UX-15.** `src/pages/speak.astro`, `src/pages/sponsors.astro`, `src/styles/base.css`: removed the interactive Card treatment from Speak formats and Sponsor tiers, and neutralized the old global tier hover lift. “Cursor and computed transform on card centers are default/none; actions remain interactive.” Chrome measured `cursor:auto` and `transform:none` before and after hover on both card types. Their nested action links retain their button classes and pointer behavior. [Computed card states](../evidence/ux-fix1/phase-e-probe.json).

**UX-17.** `src/scripts/motion.ts`, `src/styles/motion.css`: reveal targets gain `reveal-settled` after the existing 400ms entrance completes, then card hover uses 200ms; keyboard-immediate reveals settle at once. “Post-reveal, computed transform transition-duration on Team executive, working-group, member and Blog cards = 200 ms; entrance still animates.” Chrome measured `0.2s` on all four card classes and a 3px/-3px hover lift on executive, member, and Blog samples. The entrance's `duration: 0.4` code is unchanged. [Card timings](../evidence/ux-fix1/phase-e-probe.json) · [working-group timing](../evidence/ux-fix1/phase-e-probe2.json).

**UX-20.** `src/pages/index.astro`: terminal metadata labels use `#858585` locally; adjacent values are unchanged. “Measured ≥ 4.5:1 live + local; the values beside the labels are unaffected.” The local label computes `rgb(133,133,133)` against `#1a1a1a`, **4.72:1**, versus the old `#818181` **4.47:1**. Live verification follows the push. [Computed color](../evidence/ux-fix1/phase-e-final-probe.json).

**K5.** `src/components/layout/Nav.astro`: added the full “Code of Conduct” desktop link as the final item; this component has no client script. “Visible at 1280 and 1024 with no wrap or overflow; mobile drawer and footer unchanged.” Chrome measured all desktop items at y=12px at both widths, with the final link ending at x=957.94/829.94 and document widths exactly 1280/1024. The desktop nav hides at 768; mobile drawer source was untouched. [Nav bounds](../evidence/ux-fix1/phase-e-probe.json) · [1280 screenshot](../evidence/ux-fix1/phase-e-nav-1280.png) · [1024 screenshot](../evidence/ux-fix1/phase-e-nav-1024.png).

**Phase E battery:** [build](../evidence/ux-fix1/phase-e-build.log) 17 pages; [Astro check](../evidence/ux-fix1/phase-e-check.log) 0 errors / 0 warnings / 42 hints; [unsandboxed tests](../evidence/ux-fix1/phase-e-tests.log) 119/119; [links](../evidence/ux-fix1/phase-e-links.log) 715 verified / 0 broken. The +14 links from Phase D are consistent with the new Code of Conduct desktop-nav link on static pages; the crawler output does not give a per-link breakdown. No Phase E test amendment was needed.
