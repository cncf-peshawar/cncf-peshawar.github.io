# Component Audit & Enhancement Log (T-1.1-AUDIT)

Phase: 1 — Global Base Audit & Enhancement
Date: 2026-10-09

| Component / File | Identified Gap | Bounded Fix Applied | DESIGN.md / Contract Ref |
|---|---|---|---|
| `src/styles/tokens.css` | Missing backdrop overlay token for mobile drawer and dialogs | Added `--color-charcoal-overlay: rgba(56, 56, 56, 0.45);` | DESIGN.md §Tokens — Colors (Charcoal Ink overlay) |
| `src/styles/base.css` | Body lacked explicit 0.02em tracking and mono default face confirmation; `:focus-visible` lacked explicit 3px charcoal token; missing mono heading rules | Enforced `background-color: var(--color-cream-paper)`, `font-family: var(--font-mono)`, `letter-spacing: var(--letter-spacing-normal, 0.02em)`, `:focus-visible { outline: 3px solid var(--color-charcoal-ink); outline-offset: 3px; }`, and mono heading styles | DESIGN.md §Tokens — Typography (0.0200em tracking), §Do's and Don'ts (Aeonik Mono default), CTO §4.4 #3 |
| `src/layouts/BaseLayout.astro` | Legacy `global.css` was imported alongside `tokens.css` and `base.css`, causing font and component style contention | Removed `import '../styles/global.css';` | DESIGN.md §Architecture (tokens.css + base.css single source of truth) |
| `src/components/ui/Button.astro` | Rest lacked hover press physics towards shadow origin (`translate(-2px, 2px)`); active lacked `--shadow-hard-pressed` token; secondary/rainbow hover used chalk-gray instead of ice-wash | Added `.btn:hover:not(:disabled) { transform: translate(-2px, 2px); }`, active collapses shadow with `--shadow-hard-pressed`, and secondary/rainbow hover uses `var(--color-ice-wash)` | DESIGN.md §Components (Primary Action Button, Secondary Outlined Button, Rainbow Outline Button) & §Tokens — Colors (Ice Wash hover) |
| `src/components/ui/LinkButton.astro` | Hover/active physics and secondary hover tint did not mirror Button.astro | Added `transform: translate(-2px, 2px)` on hover, shadow collapse on active, and `var(--color-ice-wash)` hover for secondary/rainbow | DESIGN.md §Components (Secondary Outlined Button & Rainbow Outline Button) |
| `src/components/ui/Card.astro` | `shadow` defaulted to `true` (feature card treatment) instead of border-defined default; interactive card hover lacked directional transform and ice-wash tint | Set default `shadow = false`; interactive hover applies `translate(-2px, 2px)` and `var(--color-ice-wash)`; active collapses into shadow | DESIGN.md §Components (Community Tweet Card: border defines card edge; Testimonial Quote Card: hard shadow feature variant) |
| `src/components/ui/Badge.astro` | Border width was 2px instead of 1px | Changed border to `1px solid var(--color-charcoal-ink)` | DESIGN.md §Components (Yellow Status Badge: 1px border) |
| `src/components/ui/Input.astro` | Placeholder used pencil-gray instead of AA-corrected muted token; focus-visible did not shift border-color to sky | Changed placeholder to `var(--color-text-muted)`; added `border-color: var(--color-sky-crayon);` on `:focus-visible` | DESIGN.md §Components (Text Input / Search Bar: border color shift to sky) & CTO §4.4 #1 |
| `src/components/ui/Textarea.astro` | Placeholder used pencil-gray; focus-visible did not shift border-color to sky | Changed placeholder to `var(--color-text-muted)`; added `border-color: var(--color-sky-crayon);` on `:focus-visible` | DESIGN.md §Components (Text Input / Search Bar) & CTO §4.4 #1 |
| `src/components/ui/Select.astro` | Focus-visible did not shift border-color to sky | Added `border-color: var(--color-sky-crayon);` on `:focus-visible` | DESIGN.md §Components (Text Input / Search Bar) & CTO §4.4 #1 |
| `src/components/ui/Marquee.astro` | Carried 2px top and bottom borders contrary to spec; contained multiple hardcoded hex fallbacks; pause button focus ring was untokenized | Set `border: none;` per DESIGN.md; purged all fallback hexes; standardized pause button focus ring to `3px solid var(--color-charcoal-ink)` | DESIGN.md §Components (Marquee Banner: no border, no shadow, canary full-bleed) |
| `src/components/ui/SectionHeader.astro` | Contained fallback hex literals (`#6b6b6b`, `#383838`) | Replaced with `var(--color-text-muted)` and `var(--color-charcoal-ink)` | DESIGN.md §Tokens — Typography & Colors |
| `src/components/ui/Container.astro` | Fallback max-width used legacy container variable | Updated to explicitly consume `var(--page-max-width)` (1200px) with 24px/16px padding | DESIGN.md §Layout (Centered max-width container at 1200px) |
| `src/components/layout/Header.astro` | Contained fallback hex literals in inline SVG and CSS styles; badge had 1.5px border instead of 1px | Purged all fallback hexes; set badge border to 1px; aligned hover and active press physics to tokens; verified 44px tap targets | DESIGN.md §Components (Top Navigation Bar, Start Free Nav Button) & CONTRACT.md §5 |
| `src/components/layout/Nav.astro` | Contained fallback hex literals; CTA button hover shifted away from shadow instead of toward origin | Purged all fallback hexes; set CTA hover to `translate(-1px, 1px)` and active to `translate(-4px, 4px)` with shadow collapse; verified 44px tap targets | DESIGN.md §Components (Top Navigation Bar) & CTO Guide §4.4 #2 |
| `src/components/layout/MobileMenu.astro` | Overlay had hardcoded rgba; multiple fallback hexes in styles; button physics not aligned to tokens | Replaced overlay with `var(--color-charcoal-overlay)`; purged all fallback hexes; aligned close and CTA button press physics; verified 44px tap targets | DESIGN.md §Do's and Don'ts & CONTRACT.md §5 |
| `src/components/layout/Footer.astro` | Dividing rules had hardcoded rgba; social link buttons were smaller than 44x44px minimum tap target | Replaced dividing rules with `1px solid var(--color-graphite)`; added `min-height: 44px; min-width: 44px;` and `2px solid var(--color-charcoal-ink)` to `.social-btn` | DESIGN.md §Components (Footer) & Antislop-layoutmobile (Tap targets >= 44x44px) |

## T-1.1-VERIFY & T-GLOBAL-FIX Verification Pass
Date: 2026-10-09

| Component / File | Identified Gap | Bounded Fix Applied | DESIGN.md / Contract Ref |
|---|---|---|---|
| `src/styles/tokens.css` | Missing dark terminal surface and syntax highlighting tokens | Added `--color-terminal-bg: #1a1a1a`, `--color-terminal-text: #54b4de`, `--color-terminal-muted: #818181` | DESIGN.md §Tokens — Colors & `docs/redesign/stitch/home-desktop.html` |
| `src/styles/global.css` | Legacy stylesheet with zero remaining references in `src/` | Deleted `src/styles/global.css` | Phase 1 Base Invariant: single source of truth (`tokens.css` + `base.css`) |
| `src/pages/index.astro` | Inline SVG doodles and component styles contained hex literals (`#ffde00`, `#383838`, `#ff9538`, `#54b4de`, `#1a1a1a`, `#818181`) and radius fallbacks | Fully tokenized all SVG fills/strokes to `var(--color-*)`, bound terminal to `--color-terminal-*`, and replaced all fallback hexes and radius px fallbacks with tokens | DESIGN.md §Tokens & §Do's and Don'ts |
| `docs/redesign/evidence/t11/` | Verification screenshots required for H2/H3 visual proof across viewports | Captured 10 full-page/viewport screenshots: `/dev-kit` (390, 768, 1280), `/` (390, 768, 1280), `/events` (390, 1280), `/team` (390, 1280) | Acceptance Criteria §6, §7 |

## T-1.3-RECON Motion & Component Readiness Pass
Date: 2026-10-09

| Component / File | Identified Status | Action / Readiness for T-1.3-EXECUTE | Ground Truth / Contract Ref |
|---|---|---|---|
| `docs/redesign/md-motion-spec.md` | Motion ground truth extracted from motherduck.com | Authored complete motion & interaction spec covering buttons, cards, marquee, reveals, hero, and doodles | `docs/redesign/stitch/home-animation-spec.md` & DevTools CSSOM |
| `docs/redesign/external-tools/api-anything-review.md` | Security and utility audit of `goodnight000/api-anything` | Issued `REJECT` verdict for redesign project; documented comparison matrix vs `curl` + `chrome-devtools-mcp` | T-1.3-RECON Directive Part A |
| `src/components/BentoPillars.astro` | Codebase reference audit | Confirmed 0 references in `src/`; flagged as safe for clean deletion in `T-1.3-EXECUTE` | T-1.3-RECON Bounded Bonus |
| `src/components/TrackRecordStats.astro` | Codebase reference audit | Referenced in `src/pages/sponsors.astro:6` & `sponsors.astro:137`; MUST NOT be deleted until sponsors page is refactored | T-1.3-RECON Bounded Bonus |
| `src/components/GenesisCountdown.astro` | Logic integrity audit | Client script zero-state logic, timer delta, and DOM hooks verified 100% intact | CONTRACT.md §5 & T-1.3-RECON Bounded Bonus |

## T-1.3-EXECUTE Home Motion Integration Pass
Date: 2026-10-09

| Component / File | Identified Status | Bounded Implementation Applied | Ground Truth / Contract Ref |
|---|---|---|---|
| `package.json` | Motion libraries required | Added vanilla `"lenis": "^1.3.26"` and `"motion": "^14.0.0"` (only permitted touched lines) | T-1.3-EXECUTE Directive |
| `src/styles/tokens.css` | Card rest shadow token needed | Added `--shadow-hard-sm: -4px 4px 0px 0px var(--color-charcoal-ink);` (ADD-only) | T-1.3-EXECUTE Directive |
| `src/components/ui/Button.astro` | Live button physics needed calibration | Hover: `translate(7px, -7px); 120ms ease-in-out;` Active: `transform: none; 30ms ease-in-out;` (snap-back); PRM fallback | Measured motherduck.com values |
| `src/components/ui/LinkButton.astro` | LinkButton physics needed alignment with Button | Identical hover `translate(7px, -7px)` and active snap-back physics to Button.astro | Measured motherduck.com values |
| `src/components/ui/Card.astro` | Live card physics needed calibration | Rest shadow `--shadow-hard-sm` (-4px 4px); Hover `translate(3px, -3px)` + `--shadow-hard` (-6px 6px) in 200ms ease-in-out compositor-only; Active `translate(0, 0)` | Measured motherduck.com values |
| `src/styles/motion.css` | Motion stylesheet & safety scaffolding | Created stylesheet: imported `lenis/dist/lenis.css`; enforced default `opacity: 1; transform: none;` safety fallback; `html.js-motion:not(.motion-reduced)` reveal hiding; WCAG PRM static overrides | T-1.3-EXECUTE Directive & Safety Rule |
| `src/scripts/motion.ts` | Vanilla motion orchestration | Created script: Lenis smooth scroll (`autoRaf: true`, PRM disabled); anchor & skip-link interception with focus retention; inView section reveals & group stagger; hero entrance (H1 strictly excluded for LCP) | T-1.3-EXECUTE Directive & WCAG 2.4.1 |
| `src/layouts/BaseLayout.astro` | Motion script & styles wiring | Imported `motion.css` and added `<script src="../scripts/motion.ts"></script>` | BaseLayout architecture |
| `src/pages/index.astro` | Motion attributes wiring | Added hero entrance hooks (`data-hero-eyebrow`, `data-hero-lede`, `data-hero-actions`, `data-hero-doodle`); added `data-reveal`, `data-reveal-group`, `data-reveal-item` across sections; preserved all frozen contract hooks | CONTRACT.md §5 & T-1.3-EXECUTE Directive |
| `src/components/BentoPillars.astro` | Dead component with 0 references | Deleted file via `git rm` | T-1.3-EXECUTE Directive |
| `docs/redesign/evidence/t13/` | Visual & accessibility proof required | Captured 4 full-page screenshots: `home-390.png`, `home-768.png`, `home-1280.png`, `home-reduced-motion.png` | Acceptance Criteria & Evidence Gate |

## T-1.4-MASCOT Home Hero Mascot (Penguin) Pass
Date: 2026-10-09

| Component / File | Identified Status | Bounded Implementation Applied | Ground Truth / Contract Ref |
|---|---|---|---|
| `docs/redesign/external-tools/page-mascot-license.md` | Upstream license & asset audit | Audited `page-mascot` (`nilbuild/page-mascot` by Kamran Ahmed, `koboyo.com`). Confirmed MIT license, free public redistribution, commercial use permitted. Stamped VERDICT: SHIP. | T-1.4-MASCOT Step 0 |
| `public/mascots/` | Mascot assets needed | Downloaded `penguin-directions.webp` (100,424 bytes) and `penguin-reactions.webp` (119,244 bytes). Total size = 214.5 KB ($\le 300\text{KB}$ limit). | T-1.4-MASCOT Step 2 |
| `src/components/ui/Mascot.astro` | Vanilla Astro component port | Ported React component to vanilla Astro with zero external npm dependencies. Div-based 3x3 sprite sheets (`background-size: 300% 300%`). Direction framing via cursor angle & hysteresis; click reaction ("boop") with squash keyframes; idle bob (`translateY ±3px` ~2.2s); strict PRM static front pose; root `aria-hidden="true"`. | T-1.4-MASCOT Step 3 |
| `src/pages/index.astro` (Hero placement & Doodles) | Mascot integration & layout balance | Integrated `<Mascot />` with canary speech bubble (`100% free & open to all`). $\ge 1024\text{px}$: right flank aligned with headline/lede; $< 1024\text{px}$: below CTA row, right-aligned, 100px size; 390px: between CTAs and "Sponsor Us" link with hidden bubble and 0 overflow. Rebalanced robot doodle to left flank (desktop) and hidden on mobile ($< 768\text{px}$) to avoid crowding. | T-1.4-MASCOT Step 4 |
| `docs/redesign/evidence/t14/` | Visual & behavioral proof | Captured 8 screenshots: `home-1280.png`, `home-768.png`, `home-390.png`, `home-reduced-motion.png`, `penguin-dir-left.png`, `penguin-dir-down-left.png`, `penguin-dir-up-left.png`, `penguin-reaction.png`. | T-1.4-MASCOT Step 5 |

## T-2.1-EVENTS Events List Page Rebuild Pass
Date: 2026-10-09

| Component / File | Identified Status | Bounded Implementation Applied | Ground Truth / Contract Ref |
|---|---|---|---|
| `src/components/ui/Badge.astro` | Variant expansion needed for event status/tag badges | Added `white` (`var(--color-frost-white)`) and `lilac` (`var(--color-lilac-sketch)`) variants | DESIGN.md §Yellow Status Badge & Stitch ground truth |
| `src/components/CfpBand.astro` | Extracted CFP callout band | Created shared component extracted from `src/pages/index.astro`. Features MotherDuck charcoal container, canary eyebrow, frost-white copy, chips, and sky/outline buttons with standard MotherDuck physics (`translate(7px, -7px)` hover, snap-back active). Used across `/` and `/events`. | T-2.1-EVENTS Directive & CONTRACT.md §5 |
| `src/pages/index.astro` | CFP band deduplication | Replaced inline CFP band markup and scoped CSS with `<CfpBand />` import. Preserved exact DOM structure, IDs, and classes. | T-2.1-EVENTS Directive |
| `src/components/events/EventCard.astro` | Shared event card component | Built brutalist event card tile. Features `-4px 4px` rest shadow, `translate(3px, -3px)` hover, canary background for upcoming / frost-white for completed events, tabular-nums ISO date formatting, metadata badges, venue indicator, and responsive action buttons. | Stitch `events-desktop.html` / `events-mobile.html` ground truth |
| `src/pages/events/index.astro` | Events list page rebuild | Rebuilt to MotherDuck brutalist design. Preserved 100% functionally byte-identical frontmatter (`getCollection('events')`, sorting, filtering). Features brutalist hero with Schedule badge, upcoming events list with designed brutalist empty state (`empty-upcoming-card`), 2-column responsive past meetups archive grid, `<CfpBand />`, marquee, and motion reveal hooks (`data-reveal`, `data-reveal-group`, `data-reveal-item`). | Stitch ground truth & CONTRACT.md §5 |
| `docs/redesign/evidence/t21/` | Visual & accessibility proof | Captured 4 full-page screenshots: `events-1280.png`, `events-768.png`, `events-390.png`, `events-reduced-motion.png`. | Acceptance Criteria & Evidence Gate |




