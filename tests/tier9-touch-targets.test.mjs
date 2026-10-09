/**
 * Tier 9: Mobile Touch Target Sizes (WCAG 2.5.8)
 * CNCF Peshawar Automation Suite
 *
 * Guards issue #12: every compact, icon-only, or high-frequency control keeps a
 * minimum 44x44px interactive area so the site is comfortable and reliable to
 * operate on a phone, while the visible icons stay visually compact.
 *
 * - The mobile navigation toggle meets the 44px requirement (acceptance #1)
 * - Icon-only buttons and chip/CTA actions are reviewed and enlarged where
 *   their touch targets were undersized (acceptance #2)
 * - Enlarged hit areas do not enlarge the visible icons (acceptance #3)
 * - Adjacent interactive controls are spaced so expanded hit areas do not
 *   overlap (acceptance #4)
 * - Focus visibility is retained for every updated control (acceptance #6)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TestHarness } from './test-utils.mjs';

const read = (rel) => fs.readFileSync(path.join('src', rel), 'utf-8');

const cssOf = (rel) => {
  const src = read(rel);
  const style = src.split('<style>')[1]?.split('</style>')[0] ?? '';
  return style;
};

// Extract a single declaration value for `selector` from a CSS source block.
// Comments are stripped first, since a declaration may be preceded by an
// explanatory comment, and the property is anchored to a declaration boundary so
// `max-height` cannot match `--drawer-max-height`.
const cssValue = (css, selector, property) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(rule, `Expected a "${selector}" rule in the CSS`);
  const body = rule[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const decl = new RegExp(`(?:^|[;{]\\s*)${property}\\s*:\\s*([^;]+)`).exec(body);
  return decl ? decl[1].trim() : null;
};

// Minimum target size for touch input (WCAG 2.5.8).
const MIN_TARGET = '44px';

export async function runTier9Suite() {
  const suite = new TestHarness('Tier 9: Mobile Touch Target Sizes');

  const navCss = cssOf('components/Nav.astro');
  const speakerCss = cssOf('components/SpeakerCard.astro');
  const footerCss = cssOf('components/Footer.astro');
  const eventCardCss = cssOf('components/EventCard.astro');
  const teamCss = cssOf('pages/team.astro');
  const groupCss = cssOf('pages/team/[group].astro');
  const blogIndexCss = cssOf('pages/blog/index.astro');
  const blogSlugCss = cssOf('pages/blog/[slug].astro');
  const eventSlugCss = cssOf('pages/events/[slug].astro');
  const sponsorsCss = cssOf('pages/sponsors.astro');
  const globalCss = read('styles/global.css');

  // =====================================================================
  // NAVIGATION (acceptance #1)
  // =====================================================================
  suite.group('Navigation: The Mobile Toggle is a 44px Target');

  await suite.test('T1: The mobile navigation toggle has a 44x44px interactive area', () => {
    assert.equal(cssValue(navCss, '.nav__toggle', 'width'), MIN_TARGET);
    assert.equal(cssValue(navCss, '.nav__toggle', 'height'), MIN_TARGET);
  });

  await suite.test('T2: The toggle icon stays compact inside the larger hit area', () => {
    assert.match(
      read('components/Nav.astro'),
      /svg class="nav__toggle-icon open"[^>]*width="20" height="20"/,
      'The hamburger glyph must remain 20px, visually smaller than the 44px target'
    );
  });

  // =====================================================================
  // ICON-ONLY BUTTONS (acceptance #2 + #3)
  // =====================================================================
  suite.group('Icon-Only Buttons: 44px Targets, Compact Glyphs');

  await suite.test('T3: Speaker social buttons keep a 44px target with a 16px glyph', () => {
    assert.equal(cssValue(speakerCss, '.social-icon-btn', 'width'), MIN_TARGET);
    assert.equal(cssValue(speakerCss, '.social-icon-btn', 'height'), MIN_TARGET);
    assert.match(
      read('components/SpeakerCard.astro'),
      /svg width="16" height="16"/,
      'Speaker social icons must remain 16px so the hit area is enlarged, not the icon'
    );
  });

  await suite.test('T4: Member card social links keep a 44px target with a 15px glyph', () => {
    assert.equal(cssValue(groupCss, '.member-card__links a', 'width'), MIN_TARGET);
    assert.equal(cssValue(groupCss, '.member-card__links a', 'height'), MIN_TARGET);
    assert.match(
      read('pages/team/[group].astro'),
      /svg width="15" height="15"/,
      'Member card social icons must remain 15px so the hit area is enlarged, not the icon'
    );
  });

  await suite.test('T5: Member card link rows wrap instead of shrinking each target', () => {
    assert.equal(cssValue(groupCss, '.member-card__links', 'flex-wrap'), 'wrap');
  });

  // =====================================================================
  // COMPACT HIGH-FREQUENCY ACTIONS (acceptance #2)
  // =====================================================================
  suite.group('Compact High-Frequency Actions: Minimum 44px Height');

  await suite.test('T6: All .btn variants guarantee a 44px target', () => {
    assert.equal(cssValue(globalCss, '.btn', 'min-height'), MIN_TARGET);
  });

  await suite.test('T7: Footer social chips and email link reach 44px', () => {
    assert.equal(cssValue(footerCss, '.social-btn', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(footerCss, '.footer__email-link', 'min-height'), MIN_TARGET);
  });

  await suite.test('T8: Team exec links and drawer CTA reach 44px', () => {
    assert.equal(cssValue(teamCss, '.exec-link', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(navCss, '.nav-drawer__link', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(navCss, '.nav-drawer__action .btn', 'min-height'), MIN_TARGET);
  });

  await suite.test('T9: Back links on article, event, and team pages reach 44px', () => {
    assert.equal(cssValue(blogSlugCss, '.back-link', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(eventSlugCss, '.back-link', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(groupCss, '.back-link', 'min-height'), MIN_TARGET);
  });

  await suite.test('T10: Read-more actions reach 44px', () => {
    assert.equal(cssValue(blogIndexCss, '.post-card__link', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(eventCardCss, '.event-card__detail-link', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(speakerCss, '.speaker-card__slides', 'min-height'), MIN_TARGET);
    assert.equal(cssValue(sponsorsCss, '.partner-link', 'min-height'), MIN_TARGET);
  });

  // =====================================================================
  // SEPARATION & FOCUS (acceptance #4 + #6)
  // =====================================================================
  suite.group('Spacing and Focus');

  await suite.test('T11: Adjacent icon buttons are spaced so hit areas do not overlap', () => {
    // Two 44px targets need a center-to-center distance of >= 44px. With two
    // 28px visual chips, that requires a gap >= 16px (var(--space-sm)).
    assert.equal(cssValue(speakerCss, '.speaker-card__links', 'gap'), 'var(--space-sm)');
  });

  await suite.test('T12: Every updated control keeps a visible keyboard focus state', () => {
    assert.match(
      globalCss,
      /a:focus-visible,[\s\S]*?button:focus-visible[\s\S]*?outline:\s*2px solid var\(--color-focus\)/,
      'Links and buttons must keep the shared visible focus ring'
    );
    assert.match(
      globalCss,
      /\.btn:focus-visible,[\s\S]*?\.btn\.is-focus[\s\S]*?outline:\s*2px solid var\(--color-focus\)/,
      'Buttons must keep their own visible focus ring'
    );
  });

  suite.printResults();
  return suite.getSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTier9Suite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}