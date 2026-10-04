# CNCF Peshawar — Home Page Stitch Generation Prompt (T-13)

=== STITCH GENERATION PROMPT ===
Project: CNCF Peshawar — Cloud Native Computing Foundation chapter website
Design system: MotherDuck (bound as "Neo-Brutalist Terminal" in Stitch, asset `8d1e212b3585407c899652f6973e840f`)

LAYOUT (mobile 390px FIRST, then desktop 1280px):

1. HEADER (non-sticky)
   - Canvas background Cream Paper (#f4efea), full-width, 1px solid #383838 bottom border
   - Wordmark "CNCF Peshawar" in JetBrains Mono 500/600, charcoal #383838
   - 6 nav links: Home (/), Events (/events), Speak (/speak), Sponsors (/sponsors), Team (/team), Blog (/blog), plus Code of Conduct (/code-of-conduct) and CMS Portal (/admin/)
   - CTA button "Join on OCG" — sky #6fc2ff fill, charcoal #383838 text (§4.4 correction: NOT white text), 2px border, 2px radius
   - Mobile: hamburger button (#mobile-nav-toggle, aria-label="Toggle navigation menu", aria-expanded="false", aria-controls="mobile-nav-drawer") opens slide-in drawer (#mobile-nav-drawer, aria-hidden="true") from right, backdrop dim, focus-trapped

2. HERO (centered, max-width 800px)
   - Eyebrow: "00 // CNCF COMMUNITY CHAPTER" in JetBrains Mono 400, uppercase, letter-spaced, charcoal #383838
   - Headline: "BUILDING PESHAWAR'S CLOUD NATIVE FUTURE." in JetBrains Mono 300, uppercase, clamp(2rem, 6vw, 3.5rem), charcoal #383838
   - DO NOT animate headline (LCP element)
   - Lede: "Empowering local engineers, developers, and students through hands-on Kubernetes, distributed systems, and open-source collaboration in Khyber Pakhtunkhwa." (JetBrains Mono 400, 16px, charcoal)
   - Two CTAs: "Join Our Next Meetup" (sky #6fc2ff filled, charcoal #383838 text, 2px border, hard shadow rgb(56,56,56) -6px 6px 0 0) + "Explore Events" (white filled, charcoal #383838 2px border, hard shadow)
   - "Sponsor Us" as underlined text link below CTAs (targets /sponsors)
   - Honest Proof Note: "100% Free & Open Access · Powered by the Cloud Native Computing Foundation & community sponsors."
   - Snow leopard mascot (standing pose) peeking from right edge, bleeding past container (per §5.4)
   - Cloud doodle floating top-left, bleeding past container edge
   - Curved arrow doodle pointing from eyebrow to CTAs

3. MARQUEE STRIP (full-bleed, background #ffde00 yellow)
   - Text: "KUBERNETES · DEVOPS · MLOPS · AGENTIC AI · 100% FREE · OPEN TO ALL"
   - JetBrains Mono 500, charcoal text, 14px, uppercase, letter-spaced
   - Scrolls horizontally infinitely (20s duration)
   - Pauses on hover, focus, touch (WCAG 2.2.2)
   - Visible pause button (small, top-right of strip, aria-label="Pause marquee")
   - Static under prefers-reduced-motion: reduce

4. CHAPTER CHARTER BLOCK
   - White frame, 2px charcoal border, hard shadow (-6px 6px 0 #383838)
   - Inside: dark terminal (#1a1a1a background, JetBrains Mono 400, #54b4de text)
   - Lines: "GROUP: CNCF Peshawar" / "REGION: Khyber Pakhtunkhwa, Pakistan" / "PLATFORM: Cloud Native Computing Foundation" / "STATUS: Active CNCF Chapter" / "FOUNDED: September 2026 · Peshawar"
   - Yellow badge "ACTIVE CNCF CHAPTER" (#ffde00 bg, charcoal text, 2px border, 12px JetBrains Mono 600, uppercase)
   - Container-stack doodle placed near this block

5. KEY FACTS (4 cards in a row on desktop, 2x2 on tablet, 1 column on mobile)
   - Each card: white surface (#ffffff), 2px charcoal border, NO shadow (per §5.2)
   - Big mono numeral (JetBrains Mono 600, 2rem, charcoal #383838)
   - Label below (JetBrains Mono 400, 14px, muted #6b6b6b per §4.4 correction)
   - Facts: "100% Free & Open" (ACCESS), "Official CNCF Chapter" (AFFILIATION), "Hands-On & Practical" (MISSION), "Open Community" (COLLABORATION)
   - Card hover (desktop only): translateY(-2px) + subtle hover state

6. FEATURED MEETUP (canary-yellow card #ffde00)
   - Full-width card, 2px charcoal border, hard shadow (-6px 6px 0 #383838)
   - Title: "00 // UPCOMING MEETUP" eyebrow + "The Cloud Native Launchpad: Docker, Kubernetes & Real Deployments."
   - Real-time countdown card (.countdown-card, data-target="2026-09-26T15:00:00+05:00"):
     - 4 digit tiles (days/hours/mins/secs) in white mono tiles (#ffffff bg, 2px border, JetBrains Mono 600)
     - IDs: #cd-days, #cd-hours, #cd-mins, #cd-secs (frozen hooks)
     - Wrapper: #genesis-countdown
     - Live dot: #cd-live-dot (pulsing indicator)
     - Label: #cd-live-label ("COUNTDOWN TO THE CLOUD NATIVE LAUNCHPAD")
     - Date display: #cd-date-display ("SEP 26, 2026 · 07:00 PM - 09:00 PM PKT")
     - Actions container: #cd-actions
     - RSVP button: #cd-rsvp-btn (sky filled, charcoal text, button press animation translate(-6px, 6px) + shadow collapse)
     - View Details link to event detail page

7. PILLARS (2x2 grid on desktop, 1 column on mobile)
   - 4 cards with rainbow outline borders (cycle: lime #b3c419, peach #f5b161, mint #38c1b0, sky #6fc2ff — per §4.4 correction: rainbow borders on NON-INTERACTIVE tiles + charcoal focus ring when interactive)
   - Each: title (JetBrains Mono 600), description (JetBrains Mono 400, muted #6b6b6b)
   - Titles: "Production-Grade Deep Dives", "Hands-On Labs", "Mentorship & CFP", "Sponsor Visibility & Talent Bridge"

8. PAST MEETUPS (archive cards)
   - 3-column grid on desktop, 1 column on mobile
   - Each card: white surface, 2px border, NO shadow, date + title + summary + tags
   - "Read Details →" as underlined text link (not a button)

9. CFP BAND
   - Full-bleed strip, charcoal #383838 background, cream #f4efea text
   - "CALL FOR PROPOSALS (CFP) · ALWAYS OPEN"
   - Headline: "Have a Cloud Native Story or Architecture to Share?"
   - Format chips: 15-Min Lightning Talk, 40-Min Deep Dive, 90-Min Workshop
   - "Apply to Speak at CNCF Peshawar" button (sky filled, charcoal text, outlined 2px)
   - Curved arrow doodle pointing to button

10. SPONSORS STRIP
    - "05 // SPONSORS & PARTNERS" eyebrow + "Supported by Visionary Partners."
    - Real partners from baseline: GitHub (Event Sponsor Partner), National Incubation Center (NIC) Peshawar (Venue Partner), nsave (Event Sponsor Partner)
    - White cards, 2px border, no shadow
    - "Become a Community Sponsor" button (sky filled, charcoal text)

11. MARQUEE STRIP (repeat before footer)
    - Full-bleed #ffde00 yellow strip, repeated marquee with pause button

12. FOOTER (white surface, 1px #383838 top border, multi-column grid)
    - Brand Statement: "Building Peshawar's Cloud Native Future."
    - Columns: Community | Community Channels | Contact & Connect | Social Row
    - Social Links with aria-labels: "Open Community Groups", "CNCF Slack", "GitHub", "LinkedIn", "Instagram"
    - Legal line & trademarks
    - CMS Portal link (/admin/) and GitHub Repo link
    - Snow leopard mascot (sitting pose) in bottom-right corner

13. SPONSORSHIP BUILDER HOOKS (Preserved Contract Elements)
    - Section #email-builder and #tiers with form container #sponsor-form
    - Inputs: #org-name, #contact-name, #contact-email, #tier-select, #timeline-select, #org-website, #scope-notes
    - Output: #email-preview-text, #send-mailto-btn, #copy-template-btn, #copy-btn-text (aria-live="polite")

ANIMATION NOTES (home-animation-spec.md):
- Hero: eyebrow + CTAs stagger in (100ms apart, translateY(8px) + opacity)
- Headline: NO animation (LCP)
- Doodles: slide in from edges (200ms delay, ease-out)
- Marquee: infinite scroll, 20s duration, pause on hover/focus/touch
- Cards: scroll reveal via data-reveal (translateY(16px) + opacity, 400ms)
- Button press: translate(-6px, 6px) + shadow collapse (100ms)
- Countdown: digit-flip on change (rotateX(90deg) → 0)
- Mobile menu: slide-in from right (300ms spring), backdrop fade (200ms)
- All disabled under prefers-reduced-motion (opacity-only, max 200ms)

ACCESSIBILITY & WCAG AA CORRECTIONS:
- Skip link: #main-content (first focusable element)
- Focus: 3px solid #383838 outline on every interactive element
- Muted text: #6b6b6b (contrast ratio > 4.5:1 on white and cream; NOT #a1a1a1)
- Min caption: 12px
- Tap targets: 44x44px minimum on mobile
- aria-label on: nav toggle, social icons, external links
- aria-live="polite" on countdown and copy feedback

FROZEN HOOKS (ALL 42 from CONTRACT.md §5):
- #main-content, #email-builder, #tiers, #mobile-nav-toggle, #mobile-nav-drawer, .countdown-card, data-target, #genesis-countdown, #cd-days, #cd-hours, #cd-mins, #cd-secs, #cd-live-dot, #cd-live-label, #cd-date-display, #cd-actions, #cd-rsvp-btn, #sponsor-form, #org-name, #contact-name, #contact-email, #tier-select, #timeline-select, #org-website, #scope-notes, #email-preview-text, #send-mailto-btn, #copy-template-btn, #copy-btn-text
- 12 aria-* attributes
- All navigation hrefs: /, /events, /speak, /sponsors, /team, /blog, /code-of-conduct, /admin/
