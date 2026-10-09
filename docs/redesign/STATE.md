---
project: CNCF Peshawar UI Redesign (MotherDuck style)
base_branch: redesign/ui-motherduck
cto_guide: CNCF_REDESIGN_CTO_GUIDE.md
executor_guide: CNCF_REDESIGN_ANTIGRAVITY_GUIDE.md
design_ref: DESIGN.md
---
## Master Goal
Replace look/layout/motion of https://cncf-peshawar.github.io/ with the
MotherDuck design system. UI only. All routes, content, CMS, data flow,
automation, and tests frozen.
## Locked Decisions
D1=adopt DESIGN.md | D2=doodle kit + chapter mascot (mascot at H1) |
D3=keep all nav | D4=Lenis on (off reduced-motion) | D5=GSAP off default,
CTO may enable per-screen at H1 | D6=drop dark mode | D7=local preview |
D8=no fixed cap, 5-hour rolling reset, escalate if task > 50k tokens.
Secret: 21st.dev key rotated (rotated on 2026-10-05 by human).
## Active Queue
T-MERGE-A COMPLETE (Sequentially merged redesign/t-31, redesign/t-32, and redesign/t-34 into redesign/ui-motherduck with full 4-gate battery validation after each merge; redesign/t-33 held for Wave B. Check & build 17 pages PASS; 119/119 tests PASS; parity exit 0; check:links 0 broken; zero hex slop; prose.css import pattern confirmed; dev-kit remains excluded from parity/H4 PR).
## Attempt Counters
T-MERGE-A: 0
T-3.4-BLOG: 0
T-3.2-SPONSORS: 0
T-3.1-SPEAK: 0
T-3.0-PREP: 0
T-2.2-EVENT-DETAIL: 0
T-2.1-EVENTS: 0
T-1.4-MASCOT: 0
T-1.3-EXECUTE: 0
T-1.3-RECON: 0
T-1.1-VERIFY: 0
T-GLOBAL-FIX: 0
T-00: 0
T-01: 0
T-02: 0
T-03: 0
T-10: 0
T-11: 0
T-12: 0
T-13: 0
T-14: 0
T-15: 0
T-20: 0
T-21: 0
T-22: 0
T-23: 0
T-MERGE-02: 0
T-MERGE-PHASE2: 0
## Verification Evidence
T-00: workspace/branch/exclusions/spine established · protected diff: empty · branch: redesign/ui-motherduck
T-01: baseline gate recorded in docs/redesign/baseline.md · gate state: 4/4 pass
T-02: CONTRACT.md written (286 lines) · 12 routes · 6 collections · 42 frozen hooks · 5 workflows · /admin verdict: ADMIN_STATIC_ONLY
T-03: parity.mjs (335 lines) + parity-diff.mjs (431 lines) written · baseline.json (227329 bytes, 15 routes) captured · screenshots: YES (24 captured) · safety.md: EXISTS
T-10: tokens.css + base.css + fonts.css written · 7 woff2 self-hosted fonts downloaded · build: PASS (16 pages) · check: PASS (0 err, 0 warn) · parity diff: 0 FAILs, 15 LINK warnings · protected diff: empty · branch: redesign/t-10
T-11: src/styles/prose.css written (309 lines) · check: PASS (0 err, 0 warn) · build: PASS (16 pages) · parity diff: 0 FAILs, 15 LINK warnings · protected diff: empty · zero hex/rgb/hsl literals · zero px border-radius · branch: redesign/ui-motherduck
T-12: Stitch project created (8961937842773735368) · DESIGN.md bound as Neo-Brutalist Terminal (8d1e212b3585407c899652f6973e840f) · 11 baseline screens imported · project-config.json & stitch-report.md written · protected diff: empty · branch: redesign/t-12
T-13: home-mobile.html (77181 bytes) + home-desktop.html (77280 bytes) + home-prompt.md + home-animation-spec.md generated in Stitch (mobile: f337fa8371d34cf3ba3536b9fd235ce5, desktop: 15f0734656d547659c902f6d88e1adec) · 42/42 frozen hooks present · mascot & doodles placed · §4.4 corrections applied · protected diff: empty · branch: redesign/t-13
T-14: 20 static HTML screens generated (10 remaining page types x mobile/desktop) in docs/redesign/stitch/ + subpages-prompt.md + subpages-animation-spec.md · Stitch project 8961937842773735368 · all 42 frozen hooks + 14 sponsor builder hooks preserved · mobile-nav-toggle/drawer on all screens · aria-current="page" on all screens · snow-leopard mascots and doodles placed per §5.3 · zero cobalt #0d00ff · zero non-token literals (#00d084 purged -> var(--color-mint-sketch) #38c1b0) · DESIGN.md tokens only · check: PASS (0 err, 0 warn) · build: PASS (16 pages) · parity diff: 0 FAILs · protected diff: empty · branch: redesign/t-14 merged into redesign/ui-motherduck
T-15: 7 doodle SVGs + 3 snow leopard mascot SVGs + mascot-concept-sheet.md written · SVGs: 10/10 valid · aria-hidden: 10/10 · no cobalt/gradients/blur · protected diff: empty · branch: redesign/t-15
T-MERGE-02: T-10 + T-13 merged into redesign/ui-motherduck · build: PASS (16 pages) · parity diff: 0 FAILs, 15 LINK warnings · worktrees cleaned (only main worktree remains)
T-MERGE-03: T-14 merged into redesign/ui-motherduck via --no-ff (commit 3d01ccb) · build: PASS (16 pages) · worktree ../cncf-t14 pruned
T-21: BaseLayout.astro shell, Header.astro, Nav.astro, MobileMenu.astro · non-sticky 1px border header, 6 routes + CTA, full-height drawer, min 44x44px tap targets · Reticle live verification PASS (open, Escape close, /events nav) · merged into redesign/ui-motherduck
T-22: src/components/layout/Footer.astro · 3-col responsive grid, social ARIA labels, /admin/ and GitHub links · merged into redesign/ui-motherduck
T-20: 9 MotherDuck UI primitives in src/components/ui/ + dev-kit.astro showcase · 2px brutal radius, -6px 6px shadow press, 8 sketch rainbow cycling · merged into redesign/ui-motherduck
T-23: Container.astro, SectionHeader.astro, Marquee.astro · CSS-only keyframes, reduced-motion, accessible pause button · merged into redesign/ui-motherduck
T-MERGE-PHASE2: Sequential merges of T-21, T-22, T-20, T-23 into redesign/ui-motherduck (4/4 PASS, 0 conflicts) · check: PASS (0 err, 0 warn) · build: PASS (17 pages, exit 0) · parity: PASS (7 routes, exit 0)
T-1.1-VERIFY: T-GLOBAL-FIX folded and verified · frontmatter & countdown logic intact · extended slop scan: 0 unjustified hits · tokens.css added terminal tokens · global.css deleted (0 imports) · npm run check && npm run build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity on 7 routes: PASS · check:links: 0 broken · all 6 contract hooks present in dist/index.html · protected diff: empty · 10 screenshots in docs/redesign/evidence/t11/
T-1.3-RECON: api-anything evaluated in /tmp/api-anything-review (read-only audit, verdict: REJECT for this project, docs/redesign/external-tools/api-anything-review.md written) · MotherDuck ground truth extracted via DevTools CSSOM + computed styles (tokens confirmed: #f4efea, #383838, #6fc2ff, -6px 6px shadow, 2px radius; docs/redesign/md-motion-spec.md written) · BentoPillars 0 references (deletion ready) · TrackRecordStats used in sponsors.astro (must retain) · GenesisCountdown logic verified 100% intact · zero edits to src/**
T-1.3-EXECUTE: lenis & motion installed · Button hover translate(7px,-7px) active snap-back · Card rest shadow --shadow-hard-sm hover translate(3px,-3px)+deepen · motion.css default opacity:1 safety fallback + PRM static overrides · motion.ts Lenis smooth scroll + anchor/skip-link keyboard focus + inView section reveals + hero entrance (H1 static) · BentoPillars deleted · client bundle JS gzip: 25.95 KB (<= 35 KB gate) · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity on 7 routes: PASS (exit 0) · check:links: PASS (0 broken) · protected diff: empty · package.json diff: lenis+motion only · 4 screenshots in docs/redesign/evidence/t13/
T-1.4-MASCOT: page-mascot license audit: VERDICT SHIP (MIT, free, commercial OK) · penguin webp assets downloaded to public/mascots/ (214.5 KB <= 300 KB) · Mascot.astro ported with vanilla Astro & zero npm dependencies (3x3 sprite sheets, rAF pointer angle tracking, boop squash reaction, 2.2s idle bob, strict PRM static front pose, root aria-hidden) · Hero placement: right flank >=1024px with canary bubble '100% free & open to all', mobile <1024px below CTAs, 390px between CTAs & Sponsor Us with 0 overflow · robot doodle balanced to left flank (desktop) and hidden on mobile (<768px) · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity: PASS (exit 0) · check:links: PASS (0 broken) · protected diff: empty · package.json: untouched (0 new deps) · JS bundle gzip delta: 0 KB (25.29 KB) · LCP confirmed text (h1) · 8 screenshots in docs/redesign/evidence/t14/
T-2.1-EVENTS: /events rebuilt per Stitch ground truth · shared CfpBand.astro extracted and used across / and /events · EventCard.astro created with MotherDuck card physics · Badge.astro added white and lilac variants · frontmatter 100% byte-identical functionally · brutalist empty states for upcoming and archive · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity: PASS (7 routes, exit 0) · check:links: PASS (0 broken) · protected diff: empty · zero hardcoded hex literals · client bundle JS gzip: 25.95 KB (0 KB delta) · 4 screenshots in docs/redesign/evidence/t21/
T-2.2-EVENT-DETAIL: /events/[slug] rebuilt per Stitch ground truth with two-column prose & sticky info card · frontmatter 100% byte-identical · all hooks and links preserved (OCG, Luma, slides, recording, RSVP, speakers, back-link) · sticky info card verified under Lenis at top: 32px · single-column in-flow on <1024px with 0 overflow at 390px · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity: PASS (9 routes including detail routes, exit 0) · check:links: PASS (571 links, 0 broken) · protected diff: empty · zero hardcoded hex literals · client bundle JS gzip: 25.95 KB (0 KB delta) · 5 screenshots in docs/redesign/evidence/t22/ (including bonus home-post-cfpband.png confirming zero drift)
T-3.0-PREP: UI primitives pre-staged for parallel page wave (tokens.css, Badge, Card, Frame, Tag, Button, LinkButton, Container) · dev-kit.astro updated and cataloged · zero edits to target pages or protected files · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity: PASS (7 routes, exit 0) · check:links: PASS (575 links, 0 broken) · protected diff: empty · zero hardcoded hex literals · client bundle JS gzip: 25.95 KB (0 KB delta)
T-3.1-SPEAK: /speak rebuilt per Stitch ground truth · 2 CTAs (GitHub issue form + mailto fallback) · MentorDoodle.astro created · 100% token styling (0 hex, 0 px radii) · #main-content and CONTRACT §5 hooks grep-verified in dist · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity: PASS (exit 0) · check:links: PASS (577 links, 0 broken) · client bundle JS gzip: 25.29 KB · 4 screenshots in docs/redesign/evidence/t31/
T-3.2-SPONSORS: /sponsors rebuilt per Stitch ground truth · 4 package cards with canary Most Popular badge on Refreshment · prospectus download preserved · TrackRecordStats restyled to tokens · SponsorshipEmailBuilder restyled inside window/terminal Frames preserving all 12 frozen form hooks + deep-link ?tier= · partner logos deviation: CMS frontmatter lacks logo fields → hand-authored inline currentColor SVG wordmarks (GithubLogo, NicLogo, NsaveLogo), magic-21st not used · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity: PASS (exit 0) · check:links: PASS (578 links, 0 broken) · client bundle JS gzip: 25.29 KB · 4 screenshots in docs/redesign/evidence/t32/
T-3.4-BLOG: /blog, /blog/[slug], /code-of-conduct, and 404 rebuilt per Stitch ground truth · byte-identical frontmatter across all 4 routes · prose.css audit confirmed 1 canonical file with 3 page-scoped consumers; ADD-only extensions for .prose--article centering, accessible focus rings, word break, pre bounds, table scroll · live 404 proof on bogus URL (404-bogus-proof.png) · check && build: PASS (17 pages, exit 0) · npm test: PASS (119/119) · parity: PASS (exit 0) · check:links: PASS (586 links, 0 broken) · client bundle JS gzip: 25.29 KB · 17 screenshots in docs/redesign/evidence/t34/
T-MERGE-A: Sequential merge of Wave A branches (redesign/t-31, redesign/t-32, redesign/t-34) into redesign/ui-motherduck with full 4-gate battery verified after EACH merge (3× clean builds of 17 pages, 3× 119/119 tests, 3× parity exit 0, 3× 0 broken links) · redesign/t-33 held for Wave B · /dev-kit confirmed excluded from parity and kept out of H4 PR.
## Human Escalation Log
(none yet)

