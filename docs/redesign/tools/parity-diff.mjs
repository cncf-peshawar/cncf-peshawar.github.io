#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const FROZEN_HOOK_IDS = new Set([
  'main-content',
  'email-builder',
  'tiers',
  'mobile-nav-toggle',
  'mobile-nav-drawer',
  'genesis-countdown',
  'cd-days',
  'cd-hours',
  'cd-mins',
  'cd-secs',
  'cd-live-dot',
  'cd-live-label',
  'cd-date-display',
  'cd-actions',
  'cd-rsvp-btn',
  'sponsor-form',
  'org-name',
  'contact-name',
  'contact-email',
  'tier-select',
  'timeline-select',
  'org-website',
  'scope-notes',
  'email-preview-text',
  'send-mailto-btn',
  'copy-template-btn',
  'copy-btn-text'
]);

const ALLOWED_META_EXCEPTIONS = new Set([
  'theme-color',
  'og:image',
  'twitter:image',
  'og:image:width',
  'og:image:height'
]);

function getMetaKey(m) {
  if (m.name) return `name:${m.name.toLowerCase()}`;
  if (m.property) return `prop:${m.property.toLowerCase()}`;
  if (m['http-equiv']) return `http:${m['http-equiv'].toLowerCase()}`;
  if (m.charset) return `charset:${m.charset.toLowerCase()}`;
  if (m.rel) return `rel:${m.rel.toLowerCase()}`;
  return JSON.stringify(m);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node parity-diff.mjs <baseline.json> <current.json>');
    process.exit(2);
  }
  return { baseFile: args[0], currFile: args[1] };
}

export function diffSnapshots(baseJson, currJson) {
  const baseRoutes = Object.keys(baseJson).sort();
  const currRoutes = Object.keys(currJson).sort();

  const missingRoutes = baseRoutes.filter((r) => !currJson[r]);
  const extraRoutes = currRoutes.filter((r) => !baseJson[r]);

  if (missingRoutes.length > 0 || extraRoutes.length > 0) {
    const errorMsg = [
      'Route mismatch detected:',
      missingRoutes.length > 0 ? `  Missing in current: ${missingRoutes.join(', ')}` : '',
      extraRoutes.length > 0 ? `  Extra in current: ${extraRoutes.join(', ')}` : ''
    ].filter(Boolean).join('\n');
    return {
      routeMismatch: true,
      errorMsg,
      categories: {},
      details: [],
      exitCode: 2
    };
  }

  const categoryNames = [
    'ANCHORS',
    'IDS',
    'DATA_ATTRS',
    'ARIA_ATTRS',
    'META',
    'TITLE',
    'FORMS',
    'HEADINGS_TEXT',
    'HEADINGS_LEVEL',
    'IMAGES',
    'SCRIPTS',
    'LINKS'
  ];

  const categories = {};
  for (const cat of categoryNames) {
    categories[cat] = { added: 0, removed: 0, changed: 0, fails: 0, warnings: 0 };
  }

  const details = [];

  for (const route of baseRoutes) {
    const b = baseJson[route];
    const c = currJson[route];

    // 1. TITLE
    if (b.title !== c.title) {
      categories.TITLE.changed++;
      categories.TITLE.fails++;
      details.push(`FAIL: ${route} title changed: "${b.title}" → "${c.title}"`);
    }

    // 2. META
    const bMetaMap = new Map();
    for (const m of (b.meta || [])) {
      bMetaMap.set(getMetaKey(m), m);
    }
    const cMetaMap = new Map();
    for (const m of (c.meta || [])) {
      cMetaMap.set(getMetaKey(m), m);
    }

    for (const [key, bM] of bMetaMap.entries()) {
      const isExempt = (bM.name && ALLOWED_META_EXCEPTIONS.has(bM.name.toLowerCase())) ||
                       (bM.property && ALLOWED_META_EXCEPTIONS.has(bM.property.toLowerCase()));
      if (!cMetaMap.has(key)) {
        categories.META.removed++;
        if (!isExempt) {
          categories.META.fails++;
          details.push(`FAIL: ${route} meta tag removed: ${key}`);
        } else {
          categories.META.warnings++;
          details.push(`WARNING: ${route} exempt meta tag removed: ${key}`);
        }
      } else {
        const cM = cMetaMap.get(key);
        const bVal = bM.content || bM.href || bM.charset || '';
        const cVal = cM.content || cM.href || cM.charset || '';
        if (bVal !== cVal) {
          categories.META.changed++;
          if (!isExempt) {
            categories.META.fails++;
            details.push(`FAIL: ${route} meta content changed for ${key}: "${bVal}" → "${cVal}"`);
          } else {
            categories.META.warnings++;
            details.push(`WARNING: ${route} allowed meta update for ${key}: "${bVal}" → "${cVal}"`);
          }
        }
      }
    }
    for (const [key, cM] of cMetaMap.entries()) {
      if (!bMetaMap.has(key)) {
        categories.META.added++;
        const isExempt = (cM.name && ALLOWED_META_EXCEPTIONS.has(cM.name.toLowerCase())) ||
                         (cM.property && ALLOWED_META_EXCEPTIONS.has(cM.property.toLowerCase()));
        if (!isExempt) {
          categories.META.warnings++;
          details.push(`WARNING: ${route} new meta tag added: ${key}`);
        }
      }
    }

    // 3. LINKS (stylesheets, icons, etc.)
    const bLinks = new Set((b.links || []).map((l) => `${l.rel}:${l.href}`));
    const cLinks = new Set((c.links || []).map((l) => `${l.rel}:${l.href}`));
    for (const l of bLinks) {
      if (!cLinks.has(l)) {
        categories.LINKS.removed++;
        categories.LINKS.warnings++;
        details.push(`WARNING: ${route} link removed: ${l}`);
      }
    }
    for (const l of cLinks) {
      if (!bLinks.has(l)) {
        categories.LINKS.added++;
        categories.LINKS.warnings++;
        details.push(`WARNING: ${route} link added: ${l}`);
      }
    }

    // 4. SCRIPTS
    const bScripts = new Set((b.scripts || []).map((s) => s.src));
    const cScripts = new Set((c.scripts || []).map((s) => s.src));
    for (const s of bScripts) {
      if (!cScripts.has(s)) {
        categories.SCRIPTS.removed++;
        categories.SCRIPTS.warnings++;
        details.push(`WARNING: ${route} script src removed: ${s}`);
      }
    }
    for (const s of cScripts) {
      if (!bScripts.has(s)) {
        categories.SCRIPTS.added++;
        categories.SCRIPTS.warnings++;
        details.push(`WARNING: ${route} script src added: ${s}`);
      }
    }

    // 5. ANCHORS (unique hrefs)
    const bHrefs = new Set((b.anchors || []).map((a) => a.href));
    const cHrefs = new Set((c.anchors || []).map((a) => a.href));
    for (const h of bHrefs) {
      if (!cHrefs.has(h)) {
        categories.ANCHORS.removed++;
        categories.ANCHORS.fails++;
        details.push(`FAIL: ${route} anchor href="${h}" was removed`);
      }
    }
    for (const h of cHrefs) {
      if (!bHrefs.has(h)) {
        categories.ANCHORS.added++;
        categories.ANCHORS.fails++;
        details.push(`FAIL: ${route} anchor href="${h}" was added`);
      }
    }

    // 6. IDS
    const bIds = new Set(b.ids || []);
    const cIds = new Set(c.ids || []);
    for (const id of bIds) {
      if (!cIds.has(id)) {
        categories.IDS.removed++;
        if (FROZEN_HOOK_IDS.has(id)) {
          categories.IDS.fails++;
          details.push(`FAIL: ${route} frozen hook id="#${id}" was removed`);
        } else {
          categories.IDS.warnings++;
          details.push(`WARNING: ${route} non-frozen id="#${id}" was removed`);
        }
      }
    }
    for (const id of cIds) {
      if (!bIds.has(id)) {
        categories.IDS.added++;
        categories.IDS.warnings++;
        details.push(`WARNING: ${route} id="#${id}" was added`);
      }
    }

    // 7. DATA_ATTRS
    const bDataMap = new Map();
    for (const d of (b.dataAttrs || [])) {
      for (const [k, v] of Object.entries(d.attrs)) {
        bDataMap.set(`${d.selector}[${k}]`, v);
      }
    }
    const cDataMap = new Map();
    for (const d of (c.dataAttrs || [])) {
      for (const [k, v] of Object.entries(d.attrs)) {
        cDataMap.set(`${d.selector}[${k}]`, v);
      }
    }
    for (const [key, bVal] of bDataMap.entries()) {
      if (!cDataMap.has(key)) {
        categories.DATA_ATTRS.removed++;
        categories.DATA_ATTRS.fails++;
        details.push(`FAIL: ${route} data attribute removed: ${key}`);
      } else if (cDataMap.get(key) !== bVal) {
        categories.DATA_ATTRS.changed++;
        categories.DATA_ATTRS.fails++;
        details.push(`FAIL: ${route} data attribute changed for ${key}: "${bVal}" → "${cDataMap.get(key)}"`);
      }
    }
    for (const key of cDataMap.keys()) {
      if (!bDataMap.has(key)) {
        categories.DATA_ATTRS.added++;
        categories.DATA_ATTRS.fails++;
        details.push(`FAIL: ${route} data attribute added: ${key}`);
      }
    }

    // 8. ARIA_ATTRS
    const bAriaMap = new Map();
    for (const a of (b.ariaAttrs || [])) {
      for (const [k, v] of Object.entries(a.attrs)) {
        bAriaMap.set(`${a.selector}[${k}]`, v);
      }
    }
    const cAriaMap = new Map();
    for (const a of (c.ariaAttrs || [])) {
      for (const [k, v] of Object.entries(a.attrs)) {
        cAriaMap.set(`${a.selector}[${k}]`, v);
      }
    }
    for (const [key, bVal] of bAriaMap.entries()) {
      if (!cAriaMap.has(key)) {
        categories.ARIA_ATTRS.removed++;
        categories.ARIA_ATTRS.fails++;
        details.push(`FAIL: ${route} aria attribute removed: ${key}`);
      } else if (cAriaMap.get(key) !== bVal) {
        categories.ARIA_ATTRS.changed++;
        categories.ARIA_ATTRS.fails++;
        details.push(`FAIL: ${route} aria attribute changed for ${key}: "${bVal}" → "${cAriaMap.get(key)}"`);
      }
    }
    for (const key of cAriaMap.keys()) {
      if (!bAriaMap.has(key)) {
        categories.ARIA_ATTRS.added++;
        categories.ARIA_ATTRS.fails++;
        details.push(`FAIL: ${route} aria attribute added: ${key}`);
      }
    }

    // 9. FORMS
    const bForms = b.forms || [];
    const cForms = c.forms || [];
    if (bForms.length !== cForms.length) {
      categories.FORMS.changed++;
      categories.FORMS.fails++;
      details.push(`FAIL: ${route} form count mismatch: baseline has ${bForms.length}, current has ${cForms.length}`);
    } else {
      for (let i = 0; i < bForms.length; i++) {
        const bf = bForms[i];
        const cf = cForms[i];
        const bfFields = JSON.stringify(bf.fields);
        const cfFields = JSON.stringify(cf.fields);
        if (bf.id !== cf.id || bf.action !== cf.action || bf.method !== cf.method || bfFields !== cfFields) {
          categories.FORMS.changed++;
          categories.FORMS.fails++;
          details.push(`FAIL: ${route} form #${bf.id || i} structure or fields changed`);
        }
      }
    }

    // 10. HEADINGS (TEXT & LEVEL)
    const bHeadings = b.headings || [];
    const cHeadings = c.headings || [];
    const bHeadTextMap = new Map();
    for (const h of bHeadings) {
      bHeadTextMap.set(h.text, h.level);
    }
    const cHeadTextMap = new Map();
    for (const h of cHeadings) {
      cHeadTextMap.set(h.text, h.level);
    }

    for (const [text, bLevel] of bHeadTextMap.entries()) {
      if (!cHeadTextMap.has(text)) {
        categories.HEADINGS_TEXT.removed++;
        categories.HEADINGS_TEXT.fails++;
        details.push(`FAIL: ${route} heading text removed: "${text}"`);
      } else {
        const cLevel = cHeadTextMap.get(text);
        if (bLevel !== cLevel) {
          categories.HEADINGS_LEVEL.changed++;
          categories.HEADINGS_LEVEL.warnings++;
          details.push(`WARNING: ${route} heading level h${bLevel}→h${cLevel} for text "${text}"`);
        }
      }
    }
    for (const text of cHeadTextMap.keys()) {
      if (!bHeadTextMap.has(text)) {
        categories.HEADINGS_TEXT.added++;
        categories.HEADINGS_TEXT.fails++;
        details.push(`FAIL: ${route} heading text added: "${text}"`);
      }
    }

    // 11. IMAGES
    const bImgs = new Set((b.images || []).map((img) => `${img.src}::${img.alt}`));
    const cImgs = new Set((c.images || []).map((img) => `${img.src}::${img.alt}`));
    for (const img of bImgs) {
      if (!cImgs.has(img)) {
        categories.IMAGES.removed++;
        categories.IMAGES.fails++;
        details.push(`FAIL: ${route} image removed or altered: ${img}`);
      }
    }
    for (const img of cImgs) {
      if (!bImgs.has(img)) {
        categories.IMAGES.added++;
        categories.IMAGES.fails++;
        details.push(`FAIL: ${route} image added: ${img}`);
      }
    }
  }

  let totalFails = 0;
  for (const cat of Object.values(categories)) {
    totalFails += cat.fails;
  }

  const exitCode = totalFails > 0 ? 1 : 0;
  return {
    routeMismatch: false,
    categories,
    details,
    exitCode
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { baseFile, currFile } = parseArgs();

  const baseJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), baseFile), 'utf8'));
  const currJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), currFile), 'utf8'));

  const result = diffSnapshots(baseJson, currJson);

  if (result.routeMismatch) {
    console.error(result.errorMsg);
    process.exit(result.exitCode);
  }

  // Summary Table
  console.log('| Category | Added | Removed | Changed | Verdict |');
  console.log('|---|---|---|---|---|');
  for (const [catName, stats] of Object.entries(result.categories)) {
    let verdict = 'PASS';
    if (stats.fails > 0) {
      verdict = 'FAIL';
    } else if (stats.warnings > 0 || (['SCRIPTS', 'LINKS', 'HEADINGS_LEVEL'].includes(catName) && (stats.added > 0 || stats.removed > 0 || stats.changed > 0))) {
      verdict = 'WARNING';
    }
    console.log(`| ${catName} | ${stats.added} | ${stats.removed} | ${stats.changed} | ${verdict} |`);
  }

  if (result.details.length > 0) {
    console.log('\n### Diff Details');
    for (const line of result.details) {
      console.log(line);
    }
  } else {
    console.log('\nZero differences detected between snapshots.');
  }

  process.exit(result.exitCode);
}
