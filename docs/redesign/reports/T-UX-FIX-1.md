# T-UX-FIX-1 — execution report

**Date:** 14 November 2026 (Asia/Karachi)  
**Branch:** `redesign/ui-motherduck`  
**Status:** Resumed under CTO Amendment 1; Phase A complete. The Phase 0 stop and its evidence remain below as a historical record.

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

## Remaining work

Phases B–G remain to be executed. The old stop report above describes the pre-amendment state and does not describe the current implementation status.
