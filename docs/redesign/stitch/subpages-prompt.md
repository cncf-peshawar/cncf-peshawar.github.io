# CNCF Peshawar — Subpages Stitch Generation Prompts (T-14)
> Canonical generation specification for all 10 remaining page types across mobile (390px) and desktop (1280px).
> Bound Stitch Project: `8961937842773735368` ("Neo-Brutalist Terminal", asset `8d1e212b3585407c899652f6973e840f`).

---

## 1. Global System Invariants

1. **Design Tokens & Palette**:
   - Canvas / Base: Cream Paper (`#f4efea`)
   - Card Backgrounds: Frost White (`#ffffff`), Chalk Gray (`#f8f8f7`), Ice Wash (`#ebf9ff`), Notebook Pale (`#f9fbe7`)
   - Ink & Text: Charcoal Ink (`#383838`), Muted Ink (`#6b6b6b`), Minimal Caption `12px`
   - Primary Action: Sky Crayon (`#6fc2ff`) filled button with Charcoal Ink (`#383838`) text (§4.4 correction: never white text)
   - Secondary Action: Frost White (`#ffffff`) button with 2px Charcoal border
   - Accents: Canary Banner (`#ffde00`), Duck Bill Orange (`#ff9538`), Coral (`#f38e84`), Peach (`#f5b161`), Mint (`#38c1b0`), Lilac (`#b291de`), Slate (`#84a6bc`), Periwinkle (`#7597ee`)
   - Dark Terminals: `#1a1a1a` background, `#38c1b0` (mint) live indicator dot
   - **Zero Cobalt**: Absolute ban on `#0d00ff` / `#0D00FF` across all markup, styles, SVGs, and attributes.
2. **Brutal Geometry & Tactile Feedback**:
   - Border radius: `2px` everywhere (`--radius-brutal: 2px`)
   - Hard shadow: `rgb(56, 56, 56) -6px 6px 0px 0px` (small: `-3px 3px 0px 0px`)
   - Button active press: `transform: translate(-6px, 6px); box-shadow: 0 0 0 0 rgba(56, 56, 56, 0);`
3. **Accessibility & Frozen Hooks**:
   - Skip to main content link: `<a href="#main-content" class="skip-link">`
   - Header navigation: `<nav aria-label="Main Navigation">` with `aria-current="page"` on current active route
   - Mobile navigation toggle: `#mobile-nav-toggle` with `aria-label="Toggle navigation menu"`, `aria-controls="mobile-nav-drawer"`, `aria-expanded="false"`
   - Mobile navigation drawer: `#mobile-nav-drawer` with `aria-hidden="true"`
   - Footer social links: `aria-label="Open Community Groups"`, `aria-label="CNCF Slack"`, `aria-label="GitHub"`, `aria-label="LinkedIn"`, `aria-label="Instagram"`
   - All decorative SVGs: `aria-hidden="true"`
   - Reduced motion: `@media (prefers-reduced-motion: reduce)` zeroing transition and animation durations.

---

## 2. Page Prompts by Route

### 2.1 Events Hub (`/events`)
- **Screens**: `events-mobile.html` (390px) & `events-desktop.html` (1280px)
- **Active Nav**: `/events` (`aria-current="page"`)
- **Hero**: Eyebrow `00 // SCHEDULE`, Headline "Events & Technical Labs.", Description of 100% free community gatherings.
- **Section 01 // UPCOMING**:
  - Upcoming Meetup Feature Card: Canary yellow background (`#ffde00`), 2px border, hard shadow.
  - Frozen countdown hooks: `.countdown-card`, `data-target="2026-10-24T15:00:00+05:00"`, `#genesis-countdown`, `#cd-days`, `#cd-hours`, `#cd-mins`, `#cd-secs`, `#cd-live-dot` (pulsing `#38c1b0` mint), `#cd-live-label` ("UPCOMING MEETUP"), `#cd-date-display`, `#cd-actions`, `#cd-rsvp-btn` (`href="https://community.cncf.io/events/details/cncf-peshawar-presents-cloud-native-peshawar-genesis/"`).
  - Inlined Mountain Pass doodle (`mountain-pass.svg`).
- **Section 02 // ARCHIVE**:
  - Archive cards for completed technical labs (e.g. Docker, Kubernetes & Real Deployments).
- **Section 03 // CFP BAND**:
  - Ice wash strip with CTAs to `/speak` and `/sponsors`. Curved arrow doodle (`arrow-curved.svg`).

### 2.2 Event Detail (`/events/[slug]`)
- **Screens**: `event-detail-mobile.html` (390px) & `event-detail-desktop.html` (1280px)
- **Active Nav**: `/events` (`aria-current="page"`)
- **Breadcrumb**: `← Back to All Events` (`href="/events"`), badge `UPCOMING MEETUP`.
- **Layout**: 2 columns on desktop (prose left 1.8fr, sticky info card right 1.2fr); stacked single column on mobile.
- **Left Column**: Rendered Markdown prose (About this meetup, Session Agenda, Hands-on Lab Prerequisites, Speakers & Mentors). Mountain Pass doodle inlined.
- **Right Column**: Sticky Brutal Info Card with Date & Time, Venue & Location (IM|Sciences Hall B, Hayatabad), Capacity (70 Seats), `#cd-rsvp-btn` CTA and Luma event page link.

### 2.3 Speak Hub & CFP (`/speak`)
- **Screens**: `speak-mobile.html` (390px) & `speak-desktop.html` (1280px)
- **Active Nav**: `/speak` (`aria-current="page"`)
- **Hero**:
  - Eyebrow `00 // CALL FOR PROPOSALS`, Headline "Share Your Knowledge. Inspire Peshawar's Builders."
  - Primary CTA: `https://github.com/cncf-peshawar/cncf-peshawar.github.io/issues/new?template=cfp_proposal.yml`
  - Secondary CTA: `mailto:cncfpeshawar@gmail.com?subject=CNCF%20Peshawar%20CFP%20Inquiry`
  - **Snow Leopard Mascot**: Standing mentor mascot (`mascot-snow-leopard-standing.svg`) with inlined speech bubble doodle (`speech-bubble.svg`). Class `snow-leopard-mentor`.
- **Section 01 // TALK FORMATS**:
  - 3 Format Cards:
    - 15 Min Lightning Talk: Coral sketch (`#f38e84`) border & badge.
    - 40 Min Technical Deep Dive: Peach sketch (`#f5b161`) border & badge.
    - 90 Min Hands-on Workshop: Mint sketch (`#38c1b0`) border & badge.
- **Section 02 // SPEAKER SUPPORT**:
  - 4 Numbered Steps: 01 Proposal Review, 02 Slide Dry-Runs, 03 Equipment & AV, 04 Speaker Honor.
  - Inlined Laptop Terminal doodle (`laptop-terminal.svg`).

### 2.4 Sponsors Prospectus (`/sponsors`)
- **Screens**: `sponsors-mobile.html` (390px) & `sponsors-desktop.html` (1280px)
- **Active Nav**: `/sponsors` (`aria-current="page"`)
- **Hero**:
  - Eyebrow "SPONSORSHIP PROSPECTUS · 100% FREE COMMUNITY", Headline "Partner with CNCF Peshawar."
  - Buttons: `#email-builder` ("Draft Sponsorship Proposal"), `#tiers` ("Explore Tiers"), PDF prospectus download.
  - **Snow Leopard Mascot**: Sitting reading mascot (`mascot-snow-leopard-sitting.svg`) with inlined Chai Cup doodle (`chai-cup.svg`). Class `snow-leopard-sponsor-reading`.
- **Section 01 // PARTNERSHIP TIERS (`#tiers`)**:
  - 4 Package cards: Venue Host Partner (`#b291de` lilac), Refreshment Partner (`#ff9538` orange with `#ffde00` canary "MOST POPULAR" badge), Community Swag Partner (`#38c1b0` mint), Annual Ecosystem Partner (`#84a6bc` slate).
  - Each card links to `#email-builder` and prefills the select menu.
- **Section 02 // INTAKE & CONTACT (`#email-builder`)**:
  - 14 Preserved Builder Hooks:
    1. `#email-builder` (section ID)
    2. `#tiers` (anchor ID)
    3. `#sponsor-form` (form ID)
    4. `#org-name` (input)
    5. `#contact-name` (input)
    6. `#contact-email` (input)
    7. `#tier-select` (select)
    8. `#timeline-select` (select)
    9. `#org-website` (input)
    10. `#scope-notes` (textarea)
    11. `#email-preview-text` (pre block)
    12. `#send-mailto-btn` (anchor link)
    13. `#copy-template-btn` (button)
    14. `#copy-btn-text` (span with `aria-live="polite"`)
  - Live preview terminal panel (`#1a1a1a` dark terminal) and interactive script supporting real-time input sync, clipboard copying, and URL parameter `?tier=` preselection.

### 2.5 Team Leadership (`/team`)
- **Screens**: `team-mobile.html` (390px) & `team-desktop.html` (1280px)
- **Active Nav**: `/team` (`aria-current="page"`)
- **Hero**: Eyebrow `00 // LEADERSHIP`, Headline "The Team Behind Cloud Native Peshawar."
- **Section 01 // EXECUTIVE TEAM**:
  - Organizer cards (Muhammad Bilal, Farhan Khan, Hamza Tariq) with square-cropped monogram badges, LEAD badge, titles, bio, and social links.
- **Section 02 // WORKING GROUPS (`aria-label="Open Community Groups"`)**:
  - Container asserts `aria-label="Open Community Groups"`.
  - 4 Working Group cards:
    - Tech Team (`/team/tech-team`, `#b291de` lilac)
    - Events Team (`/team/events-team`, `#ff9538` orange)
    - Community & Outreach (`/team/community-outreach`, `#38c1b0` mint)
    - Design & Media (`/team/design-media`, `#7597ee` periwinkle)
  - Member count badges and deep links to `/team/[group]`.

### 2.6 Team Group (`/team/[group]`)
- **Screens**: `team-group-mobile.html` (390px) & `team-group-desktop.html` (1280px)
- **Active Nav**: `/team` (`aria-current="page"`)
- **Breadcrumb**: `← Back to All Teams` (`href="/team"`).
- **Header**: Squad badge `TT`, code `WG-01`, title "Tech Team", description, active volunteer count badge.
- **Member Grid**: Responsive grid of member cards with monogram avatars, roles, university/company affiliations, and LinkedIn & GitHub links.
- Inlined Laptop Terminal doodle (`laptop-terminal.svg`).

### 2.7 Blog Hub (`/blog`)
- **Screens**: `blog-mobile.html` (390px) & `blog-desktop.html` (1280px)
- **Active Nav**: `/blog` (`aria-current="page"`)
- **Hero**: Eyebrow `00 // RECAPS & ARTICLES`, Headline "Blog & Community Recaps."
- **Post Cards**: Brutal cards with rotating sketch color accent borders (`#f38e84` coral, `#38c1b0` mint, `#b291de` lilac), publication dates, author tags, post title links, summary excerpts, and topic tags.
- Inlined Chai Cup doodle (`chai-cup.svg`).

### 2.8 Blog Post (`/blog/[slug]`)
- **Screens**: `blog-post-mobile.html` (390px) & `blog-post-desktop.html` (1280px)
- **Active Nav**: `/blog` (`aria-current="page"`)
- **Breadcrumb**: `← Back to All Articles` (`href="/blog"`).
- **Header**: Badge `ANNOUNCEMENT`, reading time, post title, author avatar monogram and name.
- **Prose Measure**: `720px` max-width container, Inter proportional body font, JetBrains Mono headings and code blocks.
- Blockquote in Notebook Pale (`#f9fbe7`), terminal code blocks in `#1a1a1a`.
- Inlined Speech Bubble doodle (`speech-bubble.svg`).

### 2.9 Code of Conduct (`/code-of-conduct`)
- **Screens**: `code-of-conduct-mobile.html` (390px) & `code-of-conduct-desktop.html` (1280px)
- **Active Nav**: `/code-of-conduct` (`aria-current="page"`)
- **Header**: Badge `COMMUNITY STANDARDS`, title "Code of Conduct.", subtitle with inclusivity statement.
- **Prose Content**: 720px max-width container with 1. Our Pledge, 2. Our Standards (welcoming vs unacceptable behavior lists), 3. Enforcement & Incident Reporting (report contact box with `cncfpeshawar@gmail.com` and `conduct@cncf.io`), 4. Linux Foundation attribution.
- Inlined Cloud doodle (`cloud.svg`).

### 2.10 404 Not Found (`/404`)
- **Screens**: `404-mobile.html` (390px) & `404-desktop.html` (1280px)
- **Hero / Content**:
  - **Snow Leopard Mascot**: Leaping mascot (`mascot-snow-leopard-leaping.svg`) searching for missing container. Class `snow-leopard-404-leaping`.
  - Badge: `ERROR 404 // RESOURCE MISSING`
  - Headline: "Page Not Found."
  - Description: Route not registered in the cluster.
  - Terminal Diagnostics Box: `#1a1a1a` background, 2px border, monospace error status (`HTTP/1.1 404 Not Found`, `Cluster-Status: healthy`, `Error: Ingress route not registered`).
  - Action Buttons: "Return to Homepage" (`/`, Sky filled), "Explore Events" (`/events`, white outline), "Speaker Hub (CFP)" (`/speak`, white outline).
  - Inlined Mountain Pass doodle (`mountain-pass.svg`).
