/**
 * Tier 10: Mobile Nav Drawer Keyboard & Assistive-Technology Accessibility
 * CNCF Peshawar Automation Suite
 *
 * Guards the mobile navigation drawer's keyboard and AT contract (issue #11):
 * - Opening hands focus to the first navigation link inside the drawer
 * - Escape, the toggle, an outside click, and drawer links all close the drawer
 *   and every close path leaves focus in a predictable, usable location
 * - Keyboard focus is trapped inside the open drawer so it cannot wander into the
 *   obscured page behind it, and the closed drawer is inert
 * - aria-expanded / aria-hidden track every open and closed state
 * - Body scrolling is locked while the drawer scrolls independently
 * - Repeated Astro page transitions never stack duplicate handlers
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TestHarness } from './test-utils.mjs';

const navSrc = fs.readFileSync('src/components/Nav.astro', 'utf-8');

const markup = navSrc.split('<style>')[0];
const navCss = navSrc.split('<style>')[1]?.split('</style>')[0] ?? '';
const navScript = navSrc.split('<script>')[1]?.split('</script>')[0] ?? '';

// Extract a single declaration value for `selector` from a CSS source block.
const cssValue = (css, selector, property) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(rule, `Expected a "${selector}" rule in the component CSS`);
  const body = rule[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const decl = new RegExp(`(?:^|[;{]\\s*)${property}\\s*:\\s*([^;]+)`).exec(body);
  return decl ? decl[1].trim() : null;
};

export async function runTier10Suite() {
  const suite = new TestHarness('Tier 10: Mobile Nav Drawer Keyboard Accessibility');

  // =====================================================================
  // OPENING (criterion #1)
  // =====================================================================
  suite.group('Opening: Focus Lands on a Defined Target Inside the Drawer');

  await suite.test('K1: Opening the drawer moves focus to the first navigation link', () => {
    assert.match(
      navScript,
      /function openDrawer\(\)[\s\S]{0,2200}drawer\.querySelector[\s\S]{0,80}\.nav-drawer__link'\)\?\.focus\(\)/,
      'openDrawer must hand focus to the first drawer navigation link'
    );
    assert.match(
      markup,
      /class=\{`nav-drawer__link/,
      'The drawer must actually render navigation links for that target to exist'
    );
  });

  // =====================================================================
  // CLOSING (criteria #2, #3, #6)
  // =====================================================================
  suite.group('Closing: Every Path Returns Focus to a Predictable Location');

  await suite.test('K2: Escape closes the drawer and returns focus to the toggle', () => {
    assert.match(
      navScript,
      /e\.key === 'Escape'[^}]*closeDrawer\(\{\s*restoreFocus:\s*true\s*\}\)/s,
      'Escape must close the drawer and hand focus back to the menu toggle'
    );
    assert.match(navScript, /if \(e\.key === 'Escape' && drawer\.classList\.contains\('is-open'\)\)/);
  });

  await suite.test('K3: Toggle click closes while focus already rests on the toggle', () => {
    assert.match(
      navScript,
      /if \(isExpanded\) \{\s*closeDrawer\(\);\s*\}\s*else \{\s*openDrawer\(\);/,
      'The click handler must close without redirecting focus, since the toggle already holds it'
    );
    assert.match(
      navScript,
      /toggleBtn\.addEventListener\('click',[\s\S]{0,40}e\.stopPropagation\(\)/,
      'The toggle click must stop propagation so the outside-click handler cannot double-close'
    );
  });

  await suite.test('K4: Outside click closes and returns focus to the toggle', () => {
    assert.match(
      navScript,
      /!navWrapper\?\.contains[\s\S]{0,160}closeDrawer\(\{ restoreFocus: true \}\)/,
      'Clicking the obscured page must close the drawer and restore focus to the toggle'
    );
    assert.match(
      navScript,
      /drawer\.classList\.contains\('is-open'\) && !navWrapper\?\.contains/,
      'The outside-click close must only run while the drawer is actually open'
    );
  });

  await suite.test('K5: Activating a drawer link closes the drawer before navigation', () => {
    assert.match(
      navScript,
      /const drawerLinks = drawer\.querySelectorAll\('a'\)/,
      'Every drawer link must be wired for the close-on-activate behaviour'
    );
    assert.match(
      navScript,
      /link\.addEventListener\('click', \(\) => \{\s*closeDrawer\(\);/,
      'Activating a drawer link must close the drawer synchronously so navigation leaves a clean state'
    );
  });

  // =====================================================================
  // FOCUS CONTAINMENT (criterion #4)
  // =====================================================================
  suite.group('Containment: Focus Cannot Enter the Obscured Page');

  await suite.test('K6: Tab is trapped inside the open drawer and the toggle', () => {
    assert.match(
      navScript,
      /e\.key !== 'Tab' \|\| !drawer\.classList\.contains\('is-open'\)/,
      'The trap must be active only while the drawer is open'
    );
    assert.match(
      navScript,
      /const focusables = \[toggleBtn, \.\.\.drawer\.querySelectorAll[^\]]*\]/s,
      'The only focusable set while open is the toggle plus drawer controls'
    );
    assert.match(
      navScript,
      /e\.preventDefault\(\);[\s\S]{0,60}last\.focus\(\)/,
      'Shift+Tab past the first control must wrap back inside the drawer'
    );
    assert.match(
      navScript,
      /!e\.shiftKey && document\.activeElement === last[\s\S]{0,80}first\.focus\(\)/,
      'Tab past the last control must wrap forward instead of escaping to the page'
    );
  });

  await suite.test('K7: The closed drawer is inert so hidden links never take focus', () => {
    assert.match(
      markup,
      /id="mobile-nav-drawer"[^>]*aria-hidden="true"[^>]*\binert\b/,
      'The closed drawer must ship aria-hidden together with inert'
    );
    assert.match(
      navScript,
      /drawer\.removeAttribute\('inert'\)/,
      'Opening must lift inert so the drawer controls can be focused'
    );
    assert.match(
      navScript,
      /drawer\.setAttribute\('inert',\s*''\)/,
      'Closing must restore inert so nothing focusable is left behind the overlay'
    );
  });

  // =====================================================================
  // ARIA STATE (criterion #5)
  // =====================================================================
  suite.group('ARIA Sync: Expanded and Hidden States Never Drift');

  await suite.test('K8: Every open and close path updates aria-expanded and aria-hidden', () => {
    assert.match(
      navScript,
      /function closeDrawer\([\s\S]{0,120}aria-expanded', 'false'[\s\S]{0,120}aria-hidden', 'true'/,
      'Closing must set aria-expanded=false and aria-hidden=true together'
    );
    assert.match(
      navScript,
      /aria-expanded', 'true'[\s\S]{0,120}aria-hidden', 'false'/,
      'Opening must set aria-expanded=true and aria-hidden=false together'
    );
  });

  await suite.test('K9: The static markup ships consistent, inspectable initial states', () => {
    assert.match(
      markup,
      /id="mobile-nav-toggle"[^>]*aria-label="Open navigation menu"/,
      'The toggle must expose a clear accessible name for its closed state'
    );
    assert.match(
      markup,
      /aria-expanded="false"/,
      'The unopened toggle must be marked expanded=false in the initial HTML'
    );
    assert.match(
      markup,
      /aria-hidden="true"/,
      'The unopened drawer must be marked hidden in the initial HTML'
    );
  });

  // =====================================================================
  // SCROLL LOCK (criterion #7)
  // =====================================================================
  suite.group('Scroll Lock: Page Frozen, Drawer Scrolls');

  await suite.test('K10: Body scrolling is disabled while the drawer scrolls on its own', () => {
    assert.match(
      navCss,
      /html:has\(\.nav-drawer\.is-open\)\s*\{[^}]*overflow:\s*hidden/s,
      'The document overflow must be hidden so the page cannot scroll behind the open drawer'
    );
    assert.match(
      navCss,
      /html:has\(\.nav-drawer\.is-open\)\s*\{[^}]*overscroll-behavior:\s*none/s,
      'Overscroll must be disabled on the frozen page'
    );
    assert.equal(cssValue(navCss, '.nav-drawer', 'overflow-y'), 'auto', 'The drawer must keep its own scroll container');
    assert.equal(
      cssValue(navCss, '.nav-drawer', 'overscroll-behavior'),
      'contain',
      'Overscroll from the drawer must not chain into the locked page'
    );
    assert.equal(
      cssValue(navCss, '.nav-drawer__link', 'min-height'),
      '44px',
      'Keyboard-focusable links must stay comfortably tabbable and scrollable'
    );
  });

  // =====================================================================
  // ASTRO PAGE TRANSITIONS (criterion #8)
  // =====================================================================
  suite.group('Astro Transitions: Handlers Register Once, Never Duplicate');

  await suite.test('K11: A re-entrancy guard stops duplicate handlers across transitions', () => {
    assert.match(
      navScript,
      /if \(drawer\.dataset\.navReady === 'true'\) return;/,
      'A second setup on the same drawer must bail out before wiring anything'
    );
    assert.match(
      navScript,
      /drawer\.dataset\.navReady = 'true';/,
      'The first setup must mark the drawer as wired'
    );
    assert.match(
      navScript,
      /const drawerLinks = drawer\.querySelectorAll\('a'\)[\s\S]*?drawerLinks\.forEach/, 
      'Link wiring must be inside the guarded setup so it cannot run twice'
    );
  });

  await suite.test('K12: The setup is reachable on initial load and after page-load swaps', () => {
    assert.match(
      navScript,
      /document\.addEventListener\('astro:page-load', setupMobileNav\);/,
      'Astro navigations must re-sync the drawer state on the new page'
    );
    assert.match(
      navScript,
      /if \(document\.readyState === 'loading'\)[\s\S]{0,160}setupMobileNav\(\);/,
      'The initial load must also run the same, guarded setup'
    );
  });

  suite.printResults();
  return suite.getSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTier10Suite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}