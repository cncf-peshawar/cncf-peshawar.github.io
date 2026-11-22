# Home Page Animation Specification (T-13 / Phase 1)
> Reference for T-40 & T-41 Motion Engineering in Phase 4. Governed by CTO Guide §4.1, §4.4, §5.1, and PD-1.

---

## 1. Core Motion Philosophy
The motion system mirrors the MotherDuck neo-brutalist technical-playful identity:
- **Mechanical, physical, tactile**: No floating ethereal drifts, no purple neon glows, no blurred glass transitions.
- **Hardware-accelerated only**: Animations strictly target `transform` and `opacity`. Zero layout shifts (`top`, `left`, `width`, `height`, `margin`, `padding` are strictly forbidden in animations to avoid CLS).
- **LCP Protection**: The hero display headline is static on initial mount. Absolutely no entrance animation, opacity fade, or blur is permitted on the primary `<h1>` text.
- **Accessibility & Reduced Motion**: Under `prefers-reduced-motion: reduce`, all spatial translations, transforms, digit flips, and continuous marquee scrolling are disabled; transitions drop to instant or opacity-only (≤ 150ms).

---

## 2. Animation Choreography by Component

### 2.1 Hero Section Entrance
- **Display Headline (`<h1>`)**: Static. 0ms delay, 0ms duration. Must render immediately in first paint to protect LCP metrics.
- **Eyebrow (`.hero__eyebrow`)**:
  - `transform: translateY(8px)` → `translateY(0)`
  - `opacity: 0` → `1`
  - Duration: `300ms`
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo)
  - Delay: `60ms`
- **Subheadline / Lede (`.hero__lede`)**:
  - `transform: translateY(8px)` → `translateY(0)`
  - `opacity: 0` → `1`
  - Duration: `300ms`
  - Delay: `120ms`
- **Primary & Secondary CTAs (`.hero__actions`)**:
  - Staggered entrance: Child buttons cascade in with `100ms` interval
  - `transform: translateY(12px)` → `translateY(0)`
  - `opacity: 0` → `1`
  - Duration: `350ms`
  - Delay: `180ms` (Button 1: `180ms`, Button 2: `280ms`, Text link: `360ms`)
- **Doodles & Mascot (`.doodle-cloud`, `.mascot-hero`, `.doodle-arrow`)**:
  - Cloud: slides down-right `translate(-16px, -12px)` → `translate(0, 0)`, opacity `0` → `1`, delay `240ms`, duration `450ms`
  - Snow Leopard Mascot: peeks in from right margin `translateX(32px)` → `translateX(0)`, opacity `0` → `1`, delay `300ms`, spring easing (`stiffness: 140, damping: 18`)
  - Curved Arrow: draws in or fades in with `scale(0.9)` → `scale(1)` at `380ms`

### 2.2 Tactile Button Press Mechanics (§4.4 Correction)
- **Rest State**:
  - Shadow: `rgb(56, 56, 56) -6px 6px 0px 0px`
  - `transform: translate(0, 0)`
- **Hover State (Desktop Pointer)**:
  - Slight physical anticipation: `transform: translate(1px, -1px)`
  - Shadow expands: `rgb(56, 56, 56) -7px 7px 0px 0px`
  - Transition: `120ms ease`
- **Active / Pressed State (`:active`)**:
  - Mechanical press directly into the shadow pocket: `transform: translate(-6px, 6px)`
  - Shadow collapses: `box-shadow: 0px 0px 0px 0px rgba(56, 56, 56, 0)`
  - Timing: `70ms cubic-bezier(0.2, 0, 0, 1)`
  - Focus Ring: `outline: 3px solid #383838; outline-offset: 3px;` (remains visible regardless of press state)

### 2.3 Marquee Strips (WCAG 2.2.2 Compliance)
- **Continuous Motion**:
  - Infinite horizontal linear translation `translateX(0%)` → `translateX(-50%)`
  - Loop Duration: `22s` linear
  - Pause Behavior:
    - Automatically pauses on `:hover`, `:focus-within`, and touch hold (`animation-play-state: paused`)
    - Dedicated interactive Pause/Play toggle button (`#marquee-pause-btn`, `aria-label="Pause marquee animation"`)
- **Reduced Motion**:
  - When `prefers-reduced-motion: reduce`, CSS sets `animation: none !important;`
  - Content wraps statically with overflow hidden or horizontal touch scroll

### 2.4 Chapter Charter Terminal
- **Frame Entrance**: Scroll-revealed via `data-reveal`
- **Terminal Blinking Prompt / Active Dot (`.live-dot`)**:
  - Pulsing opacity: `opacity: 1` ↔ `opacity: 0.35`
  - Rhythm: `1.2s` step-based or ease-in-out cycle
  - Yellow Status Badge: Static with 2px hard border

### 2.5 Key Facts & Bento Cards
- **Scroll Reveal (`[data-reveal]`)**:
  - Trigger: Element reaches `15%` above viewport bottom
  - Initial state: `transform: translateY(20px); opacity: 0;`
  - Active state (`.is-revealed`): `transform: translateY(0); opacity: 1;`
  - Duration: `400ms`
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
  - Stagger delay between sibling cards in grid: `80ms` (card 1: 0ms, card 2: 80ms, card 3: 160ms, card 4: 240ms)
- **Hover Elevation (Desktop)**:
  - On hover: `transform: translateY(-3px);`
  - Cards without hard shadow maintain crisp hairline border transition (`border-color: #383838`)

### 2.6 Real-Time Countdown Card (`.countdown-card`)
- **Digit Tile Updates**:
  - Numerical updates (`#cd-days`, `#cd-hours`, `#cd-mins`, `#cd-secs`) trigger a micro-mechanical punch or flip:
    - Old digit flips out: `transform: rotateX(0deg)` → `rotateX(-90deg)`, duration `100ms`
    - New digit flips in: `transform: rotateX(90deg)` → `rotateX(0deg)`, duration `120ms`
  - Fallback in CSS: `transform: scale(1.08)` micro-pulse over `120ms` on innerText mutation
- **Live Indicator Dot (`#cd-live-dot`)**:
  - Green pulse ring: `box-shadow: 0 0 0 0 rgba(76, 209, 55, 0.7)` expanding to `0 0 0 6px rgba(76, 209, 55, 0)` over `1.8s` loop
  - Concluded State: Pulsing ceases; dot switches to static neutral gray (`.live-dot--concluded`)

### 2.7 Mobile Navigation Drawer (`#mobile-nav-drawer`)
- **Toggle Button (`#mobile-nav-toggle`)**:
  - Hamburger icon morphs to close icon via CSS stroke rotation (`transform: rotate(45deg)`) over `200ms`
- **Backdrop Overlay**:
  - `opacity: 0` → `1` (backdrop-filter is capped/restrained; solid tinted cream/charcoal wash `rgba(56, 56, 56, 0.4)`)
  - Timing: `200ms ease`
- **Drawer Panel**:
  - `transform: translateX(100%)` → `translateX(0%)`
  - Timing: `300ms cubic-bezier(0.16, 1, 0.3, 1)` (spring feel)
  - Links inside drawer cascade in with `40ms` stagger delay
  - Body scroll lock: `document.body.style.overflow = 'hidden'` on open

---

## 3. Smooth Scrolling & Anchor Navigation (PD-1 Mandate)
- **Lenis Smooth Scroll Framework**:
  - Gated initialization: Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. If true, Lenis MUST NOT initialize.
  - Smooth scroll loop runs via `requestAnimationFrame` (`autoRaf: true`).
- **Anchor Link Target Handling**:
  - All `#id` links (`#main-content`, `#email-builder`, `#tiers`, `#genesis-countdown`) must calculate exact offset factoring in non-sticky header boundaries.
  - Keyboard focus automatically shifts to targeted container (`tabindex="-1"` set dynamically on anchor targets) to maintain WCAG 2.4.1 / 2.4.3 focus compliance.

---

## 4. Performance Budget & Metrics
- **Frame Rate Target**: 60 FPS constant across mobile (iOS Safari 60Hz/120Hz ProMotion, Android Chrome) and desktop.
- **Layout Thrashing Prevention**: Zero reading of layout properties (`offsetWidth`, `clientHeight`) during animation cycles. All countdown measurements pre-calculated.
- **CSS `will-change` Policy**: Applied only during active interaction/hover on `.btn`, `.countdown-box`, and `#mobile-nav-drawer`, removed immediately at rest to minimize GPU layer memory overhead.
