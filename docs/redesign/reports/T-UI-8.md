# T-UI-8/R1 — Homepage Section 05 Rebuilt in Place to Canonical Builder Parity

> **Task:** T-UI-8/R1  
> **Status:** COMPLETE  
> **Date:** Wed Oct 14 14:48:30 UTC 2026 (PKT: 19:48:30)  
> **Branch:** `redesign/ui-motherduck`  
> **Boot Commit:** `49b8fc1c240c943443a9fb97a8a06f285e2022c7`  
> **Author:** Abdulmueez <abdulmueezawan333@gmail.com>  

---

## 1. Executive Summary & CTO Rulings

### 1a. Architecture Decision: Option B Adopted
During the T-UI-8 audit, importing `src/components/sponsors/SponsorshipEmailBuilder.astro` wholesale into `src/pages/index.astro` was provably blocked because the component hardcoded `<section id="email-builder">`, hardcoded `02 // INTAKE & CONTACT`, and lacked `<div id="tiers">`. Modifying the canonical component was strictly forbidden.

Per CTO Ruling for T-UI-8/R1:
1. **Option B Adopted:** `src/components/sponsors/SponsorshipEmailBuilder.astro` remains 100% BYTE-FROZEN and untouched (0 modifications).
2. **Cross-Page Tag Identity Retracted:** The previous cross-page element-type matching requirement was rescinded. The revised invariant is that each hook preserves the exact element type it held on its own page pre-task (`id="tiers"` remains `<div>` on `/`, and `<section>` on `/sponsors`).
3. **Homepage Eyebrow Preserved:** Stays `"05 // INTAKE & CONTACT"`.
4. **Permanent Component Status:** Per owner ruling, Section 05 is now permanent. The former marker `[KNOWN PRE-EXISTING, T-CLEAN target]` is retired; homepage builder hooks are canonical.

### 1b. Changes Executed
- Rebuilt Section 05 interior markup in `src/pages/index.astro` using canonical MotherDuck UI `Frame` components (`variant="window"` and `variant="terminal"`).
- Replaced stale builder CSS with canonical tokenized MotherDuck styling (0 hex codes, `border-radius: var(--radius-brutal)` (2px), charcoal focus rings with 3px offset, brutalist button physics, terminal dark theme).
- Deleted all 5 `placeholder="..."` attributes from homepage form inputs (`org-name`, `contact-name`, `contact-email`, `org-website`, `scope-notes`).
- Maintained client script parity with 0 extra client JS bundle bytes (gzip: 25,896 B, 0% delta).

---

## 2. Boot & Clean Status Verification

```text
PWD: /home/alucard/Documents/CNCF/cncf-peshawar.github.io-main
BOOT_HEAD: 49b8fc1c240c943443a9fb97a8a06f285e2022c7
BRANCH: redesign/ui-motherduck
GIT STATUS: Clean on tracked files at boot (only allowed wave evidence untracked).
```

Git log prior 5 commits:
```text
49b8fc1 T-UI-7A: zero placeholders in /sponsors intake form (100% verified)
0ae8e62 T-UI-7: declutter /sponsors intake form fields — remove all placeholder hints
777e565 Merge branch 'redesign/ui-motherduck' of github.com:cncf-peshawar/cncf-peshawar.github.io into redesign/ui-motherduck
70c1b48 T-UI-6: eliminate horizontal overflow on / at 360px & 390px viewports
6584295 T-UI-2: typography scale & spacing tokens harmonized
```

---

## 3. Hook Invariant Verification

### 3a. Homepage Hook Element-Type Preservation (`src/pages/index.astro`)
All 20 hooks in `src/pages/index.astro` retain their exact pre-task element types:

| Hook ID | Pre-task Element | Post-task Element | Status |
|---|---|---|---|
| `marquee-track` | `<div>` | `<div>` | UNCHANGED |
| `marquee-toggle-btn` | `<button>` | `<button>` | UNCHANGED |
| `charter-section` | `<section>` | `<section>` | UNCHANGED |
| `featured-meetup` | `<section>` | `<section>` | UNCHANGED |
| `past-meetups` | `<section>` | `<section>` | UNCHANGED |
| `sponsors-section` | `<section>` | `<section>` | UNCHANGED |
| `email-builder` | `<section>` | `<section>` | UNCHANGED |
| `tiers` | `<div>` | `<div>` | UNCHANGED |
| `sponsor-form` | `<form>` | `<form>` | UNCHANGED |
| `org-name` | `<input>` | `<input>` | UNCHANGED |
| `org-website` | `<input>` | `<input>` | UNCHANGED |
| `contact-name` | `<input>` | `<input>` | UNCHANGED |
| `contact-email` | `<input>` | `<input>` | UNCHANGED |
| `tier-select` | `<select>` | `<select>` | UNCHANGED |
| `timeline-select` | `<select>` | `<select>` | UNCHANGED |
| `scope-notes` | `<textarea>` | `<textarea>` | UNCHANGED |
| `email-preview-text` | `<pre>` | `<pre>` | UNCHANGED |
| `send-mailto-btn` | `<a>` | `<a>` | UNCHANGED |
| `copy-template-btn` | `<button>` | `<button>` | UNCHANGED |
| `copy-btn-text` | `<span>` | `<span>` | UNCHANGED |

### 3b. 23 Canonical Site-Wide CONTRACT Hooks in `dist/`
Command: Recursive scan across `dist/**/*.html`:
```text
HOOK [main-content]: dist/404.html (matches id="main-content")
HOOK [email-builder]: dist/index.html (matches id="email-builder")
HOOK [tiers]: dist/index.html (matches id="tiers")
HOOK [sponsor-form]: dist/index.html (matches id="sponsor-form")
HOOK [org-name]: dist/index.html (matches id="org-name")
HOOK [contact-name]: dist/index.html (matches id="contact-name")
HOOK [contact-email]: dist/index.html (matches id="contact-email")
HOOK [tier-select]: dist/index.html (matches id="tier-select")
HOOK [timeline-select]: dist/index.html (matches id="timeline-select")
HOOK [org-website]: dist/index.html (matches id="org-website")
HOOK [scope-notes]: dist/index.html (matches id="scope-notes")
HOOK [email-preview-text]: dist/index.html (matches id="email-preview-text")
HOOK [send-mailto-btn]: dist/index.html (matches id="send-mailto-btn")
HOOK [copy-template-btn]: dist/index.html (matches id="copy-template-btn")
HOOK [copy-btn-text]: dist/index.html (matches id="copy-btn-text")
HOOK [mobile-nav-toggle]: dist/404.html (matches id="mobile-nav-toggle")
HOOK [mobile-nav-drawer]: dist/404.html (matches id="mobile-nav-drawer")
HOOK [genesis-countdown]: dist/index.html (matches id="genesis-countdown")
HOOK [cd-days]: dist/index.html (matches id="cd-days")
HOOK [cd-hours]: dist/index.html (matches id="cd-hours")
HOOK [cd-mins]: dist/index.html (matches id="cd-mins")
HOOK [cd-secs]: dist/index.html (matches id="cd-secs")
HOOK [aria-label="Main Navigation"]: dist/404.html (matches aria-label="Main Navigation")
Canonical hooks result: 23/23 present.
```

### 3c. 14 Builder Hooks Parity Across `/` and `/sponsors`
Verified present in both `dist/index.html` and `dist/sponsors/index.html`:

| Hook ID | Element Type | `dist/index.html` Element | `dist/sponsors/index.html` Element | Parity / CTO Status |
|---|---|---|---|---|
| `email-builder` | `<section>` | `<section>` | `<section>` | **MATCH** |
| `tiers` | `<div>` / `<section>` | `<div>` | `<section>` | **DIFF (CTO R1 Option B allowed: home=<div>, sponsors=<section>)** |
| `sponsor-form` | `<form>` | `<form>` | `<form>` | **MATCH** |
| `org-name` | `<input>` | `<input>` | `<input>` | **MATCH** |
| `contact-name` | `<input>` | `<input>` | `<input>` | **MATCH** |
| `contact-email` | `<input>` | `<input>` | `<input>` | **MATCH** |
| `tier-select` | `<select>` | `<select>` | `<select>` | **MATCH** |
| `timeline-select` | `<select>` | `<select>` | `<select>` | **MATCH** |
| `org-website` | `<input>` | `<input>` | `<input>` | **MATCH** |
| `scope-notes` | `<textarea>` | `<textarea>` | `<textarea>` | **MATCH** |
| `email-preview-text` | `<pre>` | `<pre>` | `<pre>` | **MATCH** |
| `send-mailto-btn` | `<a>` | `<a>` | `<a>` | **MATCH** |
| `copy-template-btn` | `<button>` | `<button>` | `<button>` | **MATCH** |
| `copy-btn-text` | `<span>` | `<span>` | `<span>` | **MATCH** |

Section count check: `grep -c 'id="email-builder"' dist/index.html` = **1**.

---

## 4. Full Quality Battery Results

| Check | Requirement | Result | Status |
|---|---|---|---|
| **1. Astro Check & Build** | 71 files, 0 errors, 0 warnings, 42 hints; 17 pages | 71 files, 0 errors, 0 warnings, 42 hints; 17 pages | **PASS** |
| **2. E2E Test Suite** | 119/119 passing (49/52/12/6) | 119/119 passing in 13.67s | **PASS** |
| **3. Sanctioned Parity Script** | `{"totalRoutesScanned":10,"successful":10,"failures":0,"exitCode":0}` | Exact match | **PASS** |
| **4. Link Integrity Check** | 590 internal links verified, 0 broken | 590 verified, 0 broken | **PASS** |
| **5. Protected Dirs Diff** | `public/admin oauth-worker src/content scripts .github tests astro.config.mjs .env .agents/mcp.json package.json` | Diff empty (0 lines) | **PASS** |
| **6. Hook/Attribute Diff** | `git diff 49b8fc1 -G"id=|aria-|href="` | All hook IDs preserved (0 missing, 0 added) | **PASS** |
| **7. Design Token Gate** | 0 added hex color codes | 0 added hex codes | **PASS** |
| **8. Hook Element Types** | 20 homepage hooks & 23 canonical hooks intact | 100% verified | **PASS** |
| **9. Clearance Gate** | 0 placeholders in `dist/index.html` & `dist/sponsors/index.html` | `dist/index.html`: 0, `dist/sponsors/index.html`: 0 | **PASS** |
| **10. Client JS Bundle Gzip** | Gzip size must equal 25,896 B (0% delta) | 25,896 B | **PASS** |

### Log Checksums
- `tui8r1-build.log`: `fab7e65554866830240d03b29884e24ff51e9c89dcb1e10fcc6a07ca99268b71`
- `tui8r1-test.log`: `418f594ffbcb7b96053c242681fa258a2e39ed1cf6156397b446408550b130e3`
- `tui8r1-links.log`: `fc1c457c70f4a8824f018313a603a624543210302c38bb7aa53f196f6df537f4`

---

## 5. Live DevTools MCP Verification

### 5a. Visual Parity & Evidence Screenshots
All evidence files stored in `docs/redesign/evidence/t-ui8/`:

| File | Description | SHA-256 |
|---|---|---|
| `home-1280x800-before.png` | Pre-task desktop homepage screenshot | `10beab92cbe65d3c88921bd0908481b32c0322875cfe444f5e146c25aefbae3f` |
| `home-1280x800-after.png` | Post-rebuild desktop homepage screenshot | `e29ad27808f461928134568eacc769032331e7ad63e94378dc15f7268b0d5e2b` |
| `home-form-1280x800-after.png` | Post-rebuild desktop Section 05 view | `3986d2f229ff9b8dc200c89f08a08c34c1b706833cd1bbed9d41c8c67ec72138` |
| `sponsors-form-1280x800.png` | Canonical `/sponsors` Section 02 view (parity check) | `466bedc75e1259e76ecf9f78bce5f2d6f07e9b89b7b5b6b9ad7f388ef3bce77a` |
| `home-390x844-before.png` | Pre-task mobile homepage screenshot | `82ba9d194386b85983d5af78df2afee5c8acc5e6ab2d55a9ac30010c5cd91688` |
| `home-390x844-after.png` | Post-rebuild mobile homepage screenshot | `a07482a5795d3370ee23aec34e34d885003cf67aff6372e49e79d4fdff02bd2b` |
| `home-form-390x844-after.png` | Post-rebuild mobile Section 05 view | `abc253402cea10b09b2523cafdf4b36e3ac6c0960ebd045eec51ed8aab948f80` |
| `home-section-05-before.png` | Pre-task Section 05 close-up | `1bac3138b96b7a569cd6d9674638f409aaf913c0b547750400f6608996e8ed20` |
| `lighthouse-mobile.json` | Lighthouse mobile audit JSON | `fa2cc1098486606cc6e0b47b8aee7e0c8416c2ed21e9211dd70713b930c90048` |
| `lighthouse-mobile.html` | Lighthouse mobile audit HTML report | `e0ee664ff281fdb3cc642e1244cbaea9f6f879aadcfe29d3156b80f62cc39aae` |

### 5b. Interactive Parity & Event Binding Proof
Tested live in browser via DevTools evaluate script:
- Simulated typing into `#org-name` ("Nexus Cloud Systems"), `#contact-name`, `#contact-email`, and selected Tier.
- Live DOM verification: `#email-preview-text` dynamically updated:
  `Subject: CNCF Peshawar Sponsorship Inquiry — Nexus Cloud Systems`
- Verified `#send-mailto-btn` href dynamically updated with encoded parameters:
  `mailto:cncfpeshawar@gmail.com?subject=CNCF%20Peshawar%20Sponsorship%20Inquiry%20%E2%80%94%20Nexus%20Cloud%20Systems&body=...`
- Verified `#copy-template-btn` interaction: clicked button updated label to `"Copied to Clipboard!"` via polite aria-live announcement.

### 5c. Style & Physics Conformance
Computed style audit via Chrome DevTools:
- **Input Focus:** `outline: rgb(56, 56, 56) solid 2.4px`, `outlineOffset: 2.4px`, `borderRadius: 2px` (token `var(--radius-brutal)`).
- **Buttons:** `boxShadow: rgb(56, 56, 56) -6px 6px 0px 0px` (token `var(--shadow-hard)`), `borderRadius: 2px`, `fontFamily: "JetBrains Mono", monospace`.
- **Labels:** `fontFamily: "JetBrains Mono", monospace`, `fontSize: 12px`, `textTransform: uppercase`.
- **Mobile Overflow:** Evaluated at 390px viewport; Section 05 `overflowCount = 0`, doc `hasDocOverflow = false`.

### 5d. Lighthouse Mobile Audit
Executed on `http://localhost:4321/`:
- **Accessibility:** **100**
- **Best Practices:** **96**
- **SEO:** **92**
- **Agentic Browsing:** **100**

---

## 6. Deviations & Notes

- **Deviations:** 0 deviations.
- **Rider Update:** Homepage Section 05 is now permanent. The marker `[KNOWN PRE-EXISTING, T-CLEAN target]` is officially retired across all documentation. `T-CLEAN` scope is reduced to deleting `dev-kit.astro`.

---

MEMORY: updated (/home/alucard/Documents/Antigraivty_Data/AI_memory.md, /home/alucard/Documents/CNCF/AI_memory.md)
