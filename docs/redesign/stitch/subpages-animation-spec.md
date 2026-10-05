# Subpages Animation Specification (T-14 / Phase 1)
> Canonical motion reference for T-40 & T-41 Motion Engineering in Phase 4. Governed by CTO Guide §4.1, §4.4, §5.1, and PD-1.

---

## 1. Motion Architecture & Invariants

All subpages inherit the MotherDuck neo-brutalist tactile motion system:
1. **Mechanical & Tactile**: Animations feel like physical switches, printing presses, and terminal displays. No blurry neon glows, no organic fades, no artificial parallax.
2. **Strict Layout Stability (Zero CLS)**: Animations exclusively animate `transform` and `opacity`. Properties triggering browser layout reflow (`top`, `left`, `margin`, `padding`, `width`, `height`) are strictly forbidden.
3. **LCP Immunity**: Primary page headings (`.page-hero-title`) are static on initial paint to safeguard Core Web Vitals (LCP < 2.5s).
4. **Reduced Motion Compliance**: When `@media (prefers-reduced-motion: reduce)` is active:
   - Infinite continuous animations (e.g. marquee, pulsing dots) are cancelled (`animation: none !important;`).
   - Transitions drop to instant or opacity-only (`≤ 150ms`).
   - Spatial translations (`translate`, `scale`, `rotate`) are zeroed out.

---

## 2. Component-Level Motion Specifications

### 2.1 Countdown Timer (`.countdown-card`) — `/events`
- **Digit Tile Updates (`#cd-days`, `#cd-hours`, `#cd-mins`, `#cd-secs`)**:
  - Trigger: Numerical change in countdown value.
  - Keyframe Effect: Mechanical micro-punch flip:
    - Exit: `transform: rotateX(0deg) scale(1)` → `rotateX(-90deg) scale(0.95)`, duration `90ms ease-in`
    - Entrance: `transform: rotateX(90deg) scale(0.95)` → `rotateX(0deg) scale(1)`, duration `110ms cubic-bezier(0.16, 1, 0.3, 1)`
  - Reduced Motion: Immediate numerical replacement without rotation.
- **Live Dot Indicator (`#cd-live-dot`)**:
  - Pulse Ring: Continuous rhythmic scale `transform: scale(1)` ↔ `scale(1.35)`, opacity `1` ↔ `0.55` over `2.0s ease-in-out` infinite loop.
  - Concluded state: Animation terminates (`animation: none`).

### 2.2 Mentor Mascot & Talk Format Cards — `/speak`
- **Standing Mentor Mascot (`.snow-leopard-mentor`)**:
  - Entrance: Slides in from right margin `transform: translateX(24px)` → `translateX(0)`, `opacity: 0` → `1`.
  - Timing: Duration `380ms`, delay `180ms`, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Speech Bubble Doodle: Pops in at `280ms` delay with `transform: scale(0.85)` → `scale(1)`.
- **Talk Format Cards (15m, 40m, 90m)**:
  - Hover: Micro physical lift `transform: translateY(-3px)`.
  - Active: Presses into brutal pocket `transform: translate(-3px, 3px)`, shadow collapses.

### 2.3 Interactive Email Builder & Clipboard Feedback — `/sponsors`
- **Live Terminal Preview Update (`#email-preview-text`)**:
  - Real-time text mutation emits a subtle `100ms` opacity tick (`opacity: 0.9` → `1`) indicating input sync.
- **Copy Button Feedback (`#copy-btn-text`)**:
  - Click Event: Text transforms to "Copied to Clipboard! ✓" with green flash.
  - Mechanical press: `transform: translate(-4px, 4px)`, `box-shadow: none`.
  - Reset: Automatically returns to "Copy Email Text" after `2500ms`.
- **Reading Mascot (`.snow-leopard-sponsor-reading`)**:
  - Gentle resting float: Subtle `transform: translateY(0)` ↔ `translateY(-4px)` over `4.0s ease-in-out` cycle.

### 2.4 Working Group Navigation Tabs — `/team`
- **Squad Card Hover State**:
  - Desktop pointer hover translates card `transform: translateX(4px) translateY(-2px)`.
  - Left accent stripe border transitions smoothly over `120ms ease`.
- **Member Avatars Stack**:
  - Hover expands avatar overlap from `-8px` margin to `-2px` margin over `150ms`.

### 2.5 404 Leaping Mascot — `/404`
- **Leaping Snow Leopard Mascot (`.snow-leopard-404-leaping`)**:
  - Entrance: Dynamic arc leap `transform: translateY(20px) rotate(-4deg)` → `translateY(0) rotate(0deg)`.
  - Duration: `450ms`, easing `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot).
- **Terminal Diagnostics Blinking Error**:
  - Error line pulses opacity every `1.5s` to simulate cluster terminal telemetry.

### 2.6 Global Tactile Button Press Mechanics (§4.4)
- **Rest State**: `box-shadow: rgb(56, 56, 56) -6px 6px 0px 0px; transform: translate(0, 0);`
- **Hover State**: `box-shadow: rgb(56, 56, 56) -7px 7px 0px 0px; transform: translate(1px, -1px); transition: 100ms ease;`
- **Active State (`:active`)**: `box-shadow: 0 0 0 0 rgba(56, 56, 56, 0); transform: translate(-6px, 6px); transition: 60ms ease-in;`
- **Focus State (`:focus-visible`)**: `outline: 3px solid #383838 !important; outline-offset: 3px !important;`

---

## 3. Motion Timing & Choreography Reference Table

| Component / Element | Selector | Trigger | Animated Properties | Duration | Easing | Delay | Reduced Motion Override |
|---|---|---|---|---|---|---|---|
| Page Hero Eyebrow | `.page-hero-eyebrow` | Page Load | `transform, opacity` | `300ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `60ms` | `none` (instant render) |
| Page Hero Title | `.page-hero-title` | First Paint | None (Static) | `0ms` | — | `0ms` | Static (LCP protection) |
| Hero Lede & Actions | `.page-hero-desc, .page-hero-actions` | Page Load | `transform, opacity` | `320ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `120ms` | `none` |
| Tactile Button Hover | `.btn:hover` | Pointer Enter | `transform, box-shadow` | `100ms` | `ease` | `0ms` | `none` |
| Tactile Button Press | `.btn:active` | Pointer Down | `transform, box-shadow` | `60ms` | `cubic-bezier(0.2, 0, 0, 1)` | `0ms` | Immediate color inversion |
| Marquee Strip | `.marquee-track` | Continuous | `transform` | `25s` | `linear` | `0ms` | `animation: none !important;` |
| Live Countdown Dot | `.pulse-dot` | Continuous | `transform, opacity` | `2.0s` | `ease-in-out` | `0ms` | `animation: none !important;` |
| Countdown Digit Update | `#cd-days, #cd-hours...` | Time Tick | `transform` | `200ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0ms` | Instant text swap |
| Mentor Mascot | `.snow-leopard-mentor` | Page Load | `transform, opacity` | `380ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `180ms` | `none` |
| Leaping Mascot (404) | `.snow-leopard-404-leaping` | Page Load | `transform, opacity` | `450ms` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `100ms` | `none` |
| Copy Feedback Badge | `#copy-btn-text` | Click | `opacity, transform` | `150ms` | `ease` | `0ms` | Instant text swap |
| Mobile Drawer Toggle | `#mobile-nav-toggle` | Click | `transform` (icon rotation) | `200ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0ms` | Instant state swap |
| Mobile Drawer Panel | `#mobile-nav-drawer` | Toggle Open | `transform, opacity` | `250ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `0ms` | Instant block display |
