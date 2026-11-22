# CONTRACT.md — CNCF Peshawar Redesign Contract

Canonical contract establishing frozen routes, content schemas, CMS configuration, client hooks, test-asserted selectors, workflow triggers, and design tokens for the MotherDuck redesign.

---

## 1. Routes & URLs

The site defines 12 routes across `src/pages/`. All routing patterns, parameter keys, and data shaping are frozen.

| Source File | URL Pattern | Dynamic? | `getStaticPaths` Key | Frontmatter / Query Dependencies |
|---|---|---|---|---|
| `src/pages/index.astro` | `/` | No | — | `events` (upcoming, past), `speakers` (featured), `sponsors` |
| `src/pages/events/index.astro` | `/events` | No | — | `events` (upcoming, past) |
| `src/pages/events/[slug].astro` | `/events/[slug]` | Yes | `slug: event.slug` | `event.data.*`, `event.render()` |
| `src/pages/speak.astro` | `/speak` | No | — | `speakers` (featured, regular) |
| `src/pages/sponsors.astro` | `/sponsors` | No | — | `sponsors`, static `sponsorshipTiers` |
| `src/pages/team.astro` | `/team` | No | — | `team` (order), `members` (order), `workingGroups` |
| `src/pages/team/[group].astro` | `/team/[group]` | Yes | `group: group.slug` | `members`, `buildWorkingGroups` (`tech-team`, `events-team`, `community-outreach`, `design-media`) |
| `src/pages/blog/index.astro` | `/blog` | No | — | `blog` (non-draft, sorted by `publishDate` desc) |
| `src/pages/blog/[slug].astro` | `/blog/[slug]` | Yes | `slug: post.slug` | `post.data.*`, `post.render()` |
| `src/pages/code-of-conduct.astro` | `/code-of-conduct` | No | — | Static CNCF / Linux Foundation text |
| `src/pages/404.astro` | `/404.html` | No | — | Static 404 error page |
| `src/pages/admin/index.astro` | `/admin/` | No | — | Standalone Sveltia CMS shell (reads `./public/admin/config.yml`) |

---

## 2. Content Schema (Zod)

All collections are defined in `src/content/config.ts`. Schemas are frozen; redesign markup may not introduce required fields.

### 2.1 Collection: `events` (`src/content/events`)
| Field | Type | Requirement | Default | Description |
|---|---|---|---|---|
| `title` | `string` | Required | — | Event headline |
| `date` | `string` | Required | — | Date string (YYYY-MM-DD) |
| `time` | `string` | Required | — | Time range string (e.g. `03:00 PM - 07:00 PM PKT`) |
| `venue` | `string` | Required | — | Venue name |
| `location` | `string` | Optional | `'Peshawar, KPK, Pakistan'` | Location description / City |
| `status` | `enum` | Optional | `'upcoming'` | `'upcoming'` \| `'completed'` |
| `capacity` | `number` | Optional | `undefined` | Seat limit (e.g. 70, 500) |
| `rsvpUrl` | `string (url)` | Required | — | Canonical RSVP URL on OCG |
| `lumaUrl` | `string (url)` | Optional | `undefined` | Luma event page URL |
| `slidesUrl` | `string (url)` | Optional | `undefined` | Presentation slides URL |
| `recordingUrl` | `string (url)` | Optional | `undefined` | YouTube recording URL |
| `coverImage` | `string` | Optional | `undefined` | Custom event cover image path |
| `speakers` | `string[]` | Optional | `[]` | List of speaker name strings |
| `tags` | `string[]` | Optional | `[]` | Category tags |
| `summary` | `string` | Required | — | Event summary paragraph |

### 2.2 Collection: `speakers` (`src/content/speakers`)
| Field | Type | Requirement | Default | Description |
|---|---|---|---|---|
| `name` | `string` | Required | — | Full name |
| `role` | `string` | Required | — | Professional title |
| `organization`| `string` | Required | — | Company / University affiliation |
| `bio` | `string` | Required | — | Speaker biography |
| `avatar` | `string` | Optional | `undefined` | Avatar image path or URL |
| `topic` | `string` | Required | — | Presentation topic title |
| `slidesUrl` | `string (url)` | Optional | `undefined` | Slides link |
| `recordingUrl`| `string (url)` | Optional | `undefined` | Recording link |
| `github` | `string (url)` | Optional | `undefined` | GitHub profile URL |
| `linkedin` | `string (url)` | Optional | `undefined` | LinkedIn profile URL |
| `twitter` | `string (url)` | Optional | `undefined` | Twitter/X profile URL |
| `featured` | `boolean` | Optional | `false` | Highlighted on homepage |

### 2.3 Collection: `sponsors` (`src/content/sponsors`)
| Field | Type | Requirement | Default | Description |
|---|---|---|---|---|
| `name` | `string` | Required | — | Partner / Sponsor name |
| `tier` | `enum` | Required | — | `'Venue'` \| `'Refreshment'` \| `'Community'` \| `'Ecosystem'` \| `'Annual'` \| `'Event Sponsor'` |
| `logo` | `string` | Optional | `undefined` | Logo asset path |
| `website` | `string (url)` | Required | — | Official website URL |
| `description` | `string` | Required | — | Scope of sponsorship |
| `active` | `boolean` | Optional | `true` | Active partner status |
| `perks` | `string[]` | Optional | `[]` | Array of perk descriptions |

### 2.4 Collection: `team` (`src/content/team`)
| Field | Type | Requirement | Default | Description |
|---|---|---|---|---|
| `name` | `string` | Required | — | Full name |
| `role` | `string` | Required | — | Organizer title |
| `bio` | `string` | Required | — | Personal bio |
| `company` | `string` | Optional | `undefined` | Organization / Affiliation |
| `avatar` | `string` | Optional | `undefined` | Photo / Avatar image path |
| `email` | `string` | Optional | `undefined` | Contact email |
| `github` | `string (url)` | Optional | `undefined` | GitHub URL |
| `linkedin` | `string (url)` | Optional | `undefined` | LinkedIn URL |
| `instagram` | `string (url)` | Optional | `undefined` | Instagram URL |
| `twitter` | `string (url)` | Optional | `undefined` | Twitter/X URL |
| `linuxFoundationUser` | `string` | Optional | `undefined` | Linux Foundation ID |
| `isLead` | `boolean` | Optional | `false` | Core lead flag |
| `order` | `number` | Optional | `99` | Display sort priority |

### 2.5 Collection: `members` (`src/content/members`)
| Field | Type | Requirement | Default | Description |
|---|---|---|---|---|
| `name` | `string` | Required | — | Member full name |
| `role` | `string` | Optional | `undefined` | Working group role |
| `team` | `string` | Required | — | Target squad (`'Tech Team'`, `'Events Team'`, `'Community & Outreach'`, `'Design & Media'`) |
| `photo` | `string` | Optional | `undefined` | Photo image path |
| `avatar` | `string` | Optional | `undefined` | Avatar URL or asset |
| `university` | `string` | Optional | `undefined` | University name |
| `company` | `string` | Optional | `undefined` | Company affiliation |
| `email` | `string` | Optional | `undefined` | Contact email (published in HTML) |
| `github` | `string (url)` | Optional | `undefined` | GitHub profile URL |
| `linkedin` | `string (url)` | Optional | `undefined` | LinkedIn profile URL |
| `isLead` | `boolean` | Optional | `false` | Lead flag |
| `order` | `number` | Optional | `99` | Display sort order |

### 2.6 Collection: `blog` (`src/content/blog`)
| Field | Type | Requirement | Default | Description |
|---|---|---|---|---|
| `title` | `string` | Required | — | Article headline |
| `description` | `string` | Required | — | Meta description / excerpt |
| `publishDate` | `string` | Required | — | Publish date (YYYY-MM-DD) |
| `author` | `string` | Required | — | Author name |
| `authorRole` | `string` | Optional | `'CNCF Peshawar Organizer'` | Author title |
| `coverImage` | `string` | Optional | `undefined` | Header cover image |
| `tags` | `string[]` | Optional | `[]` | Article topic tags |
| `draft` | `boolean` | Optional | `false` | Draft flag (filtered in build) |

---

## 3. CMS config.yml

Summary of `public/admin/config.yml`:
- **Backend:** `name: github`, `repo: cncf-peshawar/cncf-peshawar.github.io`, `branch: main`
- **Auth Endpoint:** `https://cncf-peshawar-oauth-worker.cncfpeshawar.workers.dev/auth` (methods: `token`, `oauth`)
- **Workflow:** `publish_mode: editorial_workflow` (creates PRs rather than direct pushes)
- **Local Backend:** `local_backend: true`
- **Media Paths:** `media_folder: "public/images/uploads"`, `public_folder: "/images/uploads"`
- **Configured Collections:** `events`, `speakers`, `sponsors`, `team`, `members`, `blog`
- **/admin Isolation:** See Section 10 (`ADMIN_STATIC_ONLY`).

---

## 4. Client-side JS hooks

All client-side JavaScript behaviors and their DOM hooks:

| Script / Component | File & Lines | Selectors Read | Selectors Written | Runtime Behaviour | RM-Safe? |
|---|---|---|---|---|---|
| `GenesisCountdown` | `src/components/GenesisCountdown.astro` (L246–313) | `.countdown-card` (container), `data-target`, `#cd-days`, `#cd-hours`, `#cd-mins`, `#cd-secs`, `#cd-live-dot`, `#cd-live-label`, `#cd-rsvp-btn` | `#cd-days` (innerText), `#cd-hours` (innerText), `#cd-mins` (innerText), `#cd-secs` (innerText), `#cd-live-label` (textContent), `#cd-live-dot` (classList), `.countdown-card` (classList), `#cd-rsvp-btn` (textContent & href) | 1s interval timer calculating delta to ISO date; switches to archived state when diff <= 0 | YES |
| `SponsorshipEmailBuilder` | `src/components/SponsorshipEmailBuilder.astro` (L143–271) | `#org-name`, `#contact-name`, `#contact-email`, `#tier-select`, `#timeline-select`, `#org-website`, `#scope-notes`, `#email-preview-text`, `#send-mailto-btn`, `#copy-template-btn`, `#copy-btn-text`, `window.location.search (?tier=)` | `#email-preview-text` (textContent), `#send-mailto-btn` (href), `#copy-btn-text` (textContent feedback), `navigator.clipboard` | Real-time form mirroring to mailto URL & preview pre block; copy button with feedback; URL parameter auto-selection | YES |
| `Nav` | `src/components/Nav.astro` (L307–371) | `#mobile-nav-toggle`, `#mobile-nav-drawer`, `.nav-wrapper`, drawer `a` tags | `#mobile-nav-toggle` (aria-expanded), `#mobile-nav-drawer` (aria-hidden, classList is-open), `document.body.style.overflow` ('hidden' \| '') | Mobile drawer open/close on button click, outside click, Escape key, or link click; scroll lock | YES |

### Internal Anchor Links (#id)
Validated by `scripts/check-links.mjs`:
1. `href="#main-content"` in `src/layouts/BaseLayout.astro:72` → targets `<main id="main-content">`
2. `href="#email-builder"` in `src/pages/sponsors.astro:102` → targets `<section id="email-builder">`
3. `href="#tiers"` in `src/pages/sponsors.astro:191` → targets `<section id="tiers">`

---

## 5. Frozen hooks (test-asserted selectors)

Master reference of all IDs, data attributes, ARIA attributes, classes, and hrefs asserted by client-side scripts, accessibility standards, or the link integrity runner.

| Selector | Type | Subsystem / Consumer | Redesign Must Preserve? | Rationale |
|---|---|---|---|---|
| `#main-content` | `id` | `BaseLayout.astro`, A11y, Link Checker | YES | Skip-to-content target; required for WCAG 2.4.1 |
| `#email-builder` | `id` | `sponsors.astro`, `SponsorshipEmailBuilder`, Link Checker | YES | Internal anchor target and form section ID |
| `#tiers` | `id` | `sponsors.astro`, Link Checker | YES | Partnership tiers anchor target |
| `#mobile-nav-toggle` | `id` | `Nav.astro` client script | YES | Hamburger menu toggle button hook |
| `#mobile-nav-drawer` | `id` | `Nav.astro` client script | YES | Mobile drawer navigation container hook |
| `.countdown-card` | `class` | `GenesisCountdown.astro` client script | YES | Root container for countdown listener |
| `data-target` | `data-*` | `GenesisCountdown.astro` client script | YES | Target ISO date read by countdown script |
| `#genesis-countdown` | `id` | `GenesisCountdown.astro` | YES | Countdown numbers wrapper container |
| `#cd-days` | `id` | `GenesisCountdown.astro` client script | YES | Days numerical output element |
| `#cd-hours` | `id` | `GenesisCountdown.astro` client script | YES | Hours numerical output element |
| `#cd-mins` | `id` | `GenesisCountdown.astro` client script | YES | Minutes numerical output element |
| `#cd-secs` | `id` | `GenesisCountdown.astro` client script | YES | Seconds numerical output element |
| `#cd-live-dot` | `id` | `GenesisCountdown.astro` client script | YES | Live indicator pulsing dot element |
| `#cd-live-label` | `id` | `GenesisCountdown.astro` client script | YES | State label element (switches to concluded) |
| `#cd-date-display` | `id` | `GenesisCountdown.astro` | YES | Formatted date display hook |
| `#cd-actions` | `id` | `GenesisCountdown.astro` | YES | Actions container hook |
| `#cd-rsvp-btn` | `id` | `GenesisCountdown.astro` client script | YES | Dynamic RSVP / Join OCG CTA button hook |
| `#sponsor-form` | `id` | `SponsorshipEmailBuilder.astro` | YES | Form element selector |
| `#org-name` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Organization name input hook |
| `#contact-name` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Contact person input hook |
| `#contact-email` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Contact email input hook |
| `#tier-select` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Tier select dropdown hook (`?tier=` handler) |
| `#timeline-select` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Timeline select dropdown hook |
| `#org-website` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Website URL input hook |
| `#scope-notes` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Scope notes textarea hook |
| `#email-preview-text` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Formatted proposal text preview element |
| `#send-mailto-btn` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Generated mailto link anchor element |
| `#copy-template-btn` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Copy template action button hook |
| `#copy-btn-text` | `id` | `SponsorshipEmailBuilder.astro` client script | YES | Copy button feedback span (`aria-live="polite"`) |
| `aria-label="Main Navigation"` | `aria-label` | `Nav.astro`, A11y | YES | Landmark navigation accessible label |
| `aria-label="Toggle navigation menu"` | `aria-label` | `Nav.astro`, A11y | YES | Mobile menu toggle button accessible label |
| `aria-expanded` | `aria-*` | `Nav.astro` client script | YES | Dynamic drawer expansion state |
| `aria-controls="mobile-nav-drawer"` | `aria-*` | `Nav.astro`, A11y | YES | Identifies drawer controlled by toggle |
| `aria-hidden` | `aria-*` | `Nav.astro` client script | YES | Drawer visibility state |
| `aria-current="page"` | `aria-*` | `Nav.astro`, A11y | YES | Active navigation link indicator |
| `aria-live="polite"` | `aria-*` | `SponsorshipEmailBuilder.astro`, A11y | YES | Live announcement for clipboard copy |
| `aria-label="Open Community Groups"` | `aria-label` | `Footer.astro`, A11y | YES | Social button accessible name |
| `aria-label="CNCF Slack"` | `aria-label` | `Footer.astro`, A11y | YES | Social button accessible name |
| `aria-label="GitHub"` | `aria-label` | `Footer.astro`, `SpeakerCard.astro`, A11y | YES | Social button accessible name |
| `aria-label="LinkedIn"` | `aria-label` | `Footer.astro`, `SpeakerCard.astro`, A11y | YES | Social button accessible name |
| `aria-label="Instagram"` | `aria-label` | `Footer.astro`, A11y | YES | Social button accessible name |
| `href` routes (`/`, `/events`, `/speak`, `/sponsors`, `/team`, `/blog`, `/code-of-conduct`, `/admin/`) | `href` | Link integrity tests (`check-links.mjs`) | YES | All primary navigation links |

---

## 6. Workflow triggers

GitHub Actions workflows in `.github/workflows/`:

| Workflow File | Name | Triggers | Filtered Branches | Role / Actions Executed | Commits to `main`? |
|---|---|---|---|---|---|
| `deploy.yml` | Deploy CNCF Peshawar Website to GitHub Pages | `push: [main]`, `workflow_dispatch` | `main` only | Builds static site and publishes `dist/` to GitHub Pages CDN | NO (deploys on push) |
| `ci.yml` | CI Quality & Static Integrity Validation | `push: [main]`, `pull_request: [main]` | `main` | Runs `npm run check`, `npm test`, `npm run build`, `npm run check:links` | NO |
| `verify-pr.yml` | Pull Request Verification | `pull_request: [main]` | `main` | Runs type check, test suite, production build, link checker | NO |
| `event-sync.yml` | Scheduled OCG Event Sync | `schedule: '0 0 * * *'`, `workflow_dispatch` | None | Runs `sync-ocg-events.mjs`, checks schema, creates PR on `automated/ocg-events-sync` | NO (creates PR) |
| `cfp-triage.yml` | Speaker CFP Triage & Content PR Bot | `issues: [opened, labeled]` | None | Parses CFP markdown issue, generates draft speaker/event markdown, creates draft PR | NO (creates PR) |

> **Critical Safety Constraint:** `deploy.yml` executes ONLY on pushes to `main`. Pushing to redesign branches (e.g. `redesign/ui-motherduck`) will not trigger a deployment.

---

## 7. OCG sync script

Behavior of `scripts/sync-ocg-events.mjs`:
- **Data Source:** CNCF Open Community Groups (OCG) chapter portal (`https://ocgroups.dev/cncf/group/6vwk2n4`).
- **Fields Extracted:** `title`, `date`, `time`, `venue`, `location`, `status`, `capacity`, `rsvpUrl`, `lumaUrl`, `slidesUrl`, `recordingUrl`, `speakers` (from `<user-chip>` JSON), `tags`, `summary`, `description`, `isCanceled`.
- **Non-Destructive Merge Invariants:**
  - Strictly preserves existing hand-authored Markdown body (`## About This Event...`).
  - Strictly preserves manual `coverImage` overrides.
  - Strictly preserves manual `title` corrections (e.g. upstream typo fixes).
  - Preserves manual `venue`, `location`, `slidesUrl`, `recordingUrl`, `lumaUrl`, `summary`.
  - Unions speakers (merges new OCG speakers without duplicating existing entries).
  - Unions tags (combines existing and scraped tags).
- **Timezone & Status Automation:**
  - Converts UTC ISO timestamps to PKT (`Asia/Karachi`, UTC+5) format `YYYY-MM-DD` and `hh:mm A PKT`.
  - Automatically transitions event status to `'completed'` if `Date.now() > eventTimestamp + 6h`.
  - Retains `'upcoming'` for future dates.

---

## 8. Current design tokens (for T-10 mapping)

Mapping of existing OKLCH and brand tokens (`src/styles/tokens.css`) to the new MotherDuck design system (`DESIGN.md`):

| Token Category | Current Token Name | Current Value | New DESIGN.md Token & Value |
|---|---|---|---|
| **Canvas** | `--color-paper` | `var(--brand-cloud)` (`oklch(1 0 0)`) | `--color-cream-paper`: `#f4efea` (Cream Paper) |
| **Card Surface** | `--color-paper-card` | `oklch(1 0 0)` (#ffffff) | `--color-frost-white`: `#ffffff` (Frost White) |
| **Subtle Surface**| `--color-paper-subtle` | `oklch(0.965 0.012 265)` | `--color-chalk-gray`: `#f8f8f7` (Chalk Gray) |
| **Primary Text** | `--color-ink` | `var(--brand-ink)` (`oklch(0.10 0.03 278)`) | `--color-charcoal-ink`: `#383838` (Charcoal Ink) |
| **Muted Text** | `--color-ink-muted` | `oklch(0.40 0.05 278)` | `--color-text-muted`: `#6b6b6b` (AA correction) |
| **Pencil Gray** | `--color-ink-subtle`| `oklch(0.38 0.05 278)` | `--color-pencil-gray`: `#a1a1a1` |
| **Primary Accent**| `--color-accent` | `var(--brand-blue)` (`oklch(0.45 0.32 265)`, `#0d00ff`) | `--color-sky-crayon`: `#6fc2ff` (Sky Crayon) |
| **Text on Sky** | `--color-accent-contrast`| `var(--brand-cloud)` (#ffffff) | `--color-on-sky`: `#383838` (Mandatory contrast fix) |
| **Marquee Strip** | — (none) | — | `--color-canary-banner`: `#ffde00` |
| **Illustration** | — (none) | — | `--color-duck-bill-orange`: `#ff9538`, `--color-wet-cement`: `#54b4de` |
| **Rainbow Border**| — (none) | — | Coral `#f38e84`, Peach `#f5b161`, Mint `#38c1b0`, Lilac `#b291de`, Lime `#b3c419`, Periwinkle `#7597ee`, Slate `#84a6bc`, Marigold `#e1c427` |
| **Display Font** | `--font-display` | `Satoshi`, `General Sans`, `Poppins` | `JetBrains Mono` / `Aeonik Mono` (300/400/500/600) |
| **Body Font** | `--font-body` | `General Sans`, `Poppins`, `Satoshi` | `JetBrains Mono` / `Aeonik Mono` 400 (or `Inter`) |
| **Mono Font** | `--font-mono` | `Google Sans`, `Poppins`, monospace | `JetBrains Mono` / `Aeonik Mono` 400 |
| **Spacing Grid** | `--space-3xs`–`--space-3xl` | 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px | 4-pt grid (4, 8, 12, 16, 20, 24, 32, 40, 60, 64, 80, 100, 120, 140, 200px) |
| **Border Radius** | `--radius-xs`–`--radius-lg` | 4px, 8px, 12px, 18px, 9999px | `2px` universally (buttons, cards, inputs, tags) |
| **Shadow** | `--shadow-md`, `--shadow-glow` | Ambient soft blur + blue glow | Hard offset shadow `rgb(56, 56, 56) -6px 6px 0px 0px` (`--shadow-subtle`) |
| **Focus Ring** | `--color-focus` | `var(--brand-blue)` 2px | `--focus-ring`: `3px solid #383838`, offset: `3px` |

---

## 9. Known baseline quirks (carried from T-01)

- **Stale Sep 26 2026 meetup in built HTML:** Present in `dist/events/index.html` and `dist/events/02-the-cloud-native-launchpad-docker-kubernetes-real-deployments/index.html`. Status is frozen in collection markdown until refreshed by OCG sync; redesign maintains existing data without manual date edits.
- **Theme color `#0d00ff` change:** Current meta tag is `<meta name="theme-color" content="#0d00ff">`. Will transition to DESIGN.md palette per D1.
- **Team group pages personal emails:** `src/pages/team/[group].astro` renders `member.data.email` mailto links directly into HTML (intentional community content decision).
- **Empty `speakers` collection:** Repo contains only `src/content/speakers/.gitkeep`. Astro build outputs warning `The collection "speakers" does not exist or is empty`. This is expected baseline behavior; E2E tests populate mock speakers in fixtures.

---

## 10. /admin isolation verdict

- **Verdict:** `ADMIN_STATIC_ONLY`
- **Evidence:**
  1. `src/pages/admin.astro` does not exist (`ADMIN_STATIC_ONLY` confirmed by probe).
  2. The CMS entrypoint is `src/pages/admin/index.astro`. It renders a self-contained HTML document (`<!doctype html>`) that loads only Sveltia CMS (`unpkg.com/@sveltia/cms`) and inlines `config.yml`.
  3. `src/pages/admin/index.astro` does NOT import `BaseLayout.astro`, `global.css`, `tokens.css`, or any shared site component.
  4. Build artifact `dist/admin/index.html` has zero style dependencies on the main site bundle.
  5. The MotherDuck redesign cannot leak styles, tokens, or script changes into `/admin`.
