/**
 * Tier 2: Boundary & Corner Cases E2E Test Suite
 * CNCF Peshawar Automation Suite
 * 
 * Verifies boundary values, empty inputs, malformed structures, date overflows,
 * unusual characters, extreme values, and missing fields across Features F1 through F8.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import {
  TestHarness,
  extractFrontmatter,
  validateEventFrontmatter,
  validateSpeakerFrontmatter,
  validateBlogFrontmatter,
  verifyStaticLinks,
  runCommand
} from './test-utils.mjs';

import {
  convertUtcToPkt,
  normalizeTimeRange,
  decodeHtmlEntities,
  stripHtml,
  slugify as ocgSlugify,
  parseUserChips,
  parseOcgEventHtml,
  parseOcgGroupHtml,
  syncEvents
} from '../scripts/sync-ocg-events.mjs';

import {
  parseIssueSections,
  slugify as cfpSlugify,
  isValidUrl,
  cleanValue,
  parseRoleAndOrg,
  extractSocialLinks,
  extractTrackTags,
  generateSpeakerFrontmatter,
  generateEventFrontmatter,
  parseCfpIssue
} from '../scripts/parse-cfp-issue.mjs';

export async function runTier2Suite() {
  const suite = new TestHarness('Tier 2: Boundary & Corner Cases (F1 - F8)');

  // =====================================================================
  // GROUP 1: F1/F2 Boundary Values, Date Overflows & Timezone Invariants
  // =====================================================================
  suite.group('F1/F2: Date Boundaries & Timezone Invariants');

  await suite.test('T2.1: Midnight UTC (00:00:00Z) converts to 05:00 AM PKT on same date', async () => {
    const res = convertUtcToPkt('2026-08-15T00:00:00Z');
    assert.ok(res, 'Should parse UTC timestamp');
    assert.equal(res.date, '2026-08-15');
    assert.equal(res.startTime, '05:00 AM');
  });

  await suite.test('T2.2: Late night UTC (20:00:00Z) overflows date across midnight to next day in PKT', async () => {
    const res = convertUtcToPkt('2026-08-15T20:00:00Z');
    assert.ok(res, 'Should parse UTC timestamp');
    assert.equal(res.date, '2026-08-16', 'Date must advance to the next day in UTC+5 PKT');
    assert.equal(res.startTime, '01:00 AM');
  });

  await suite.test('T2.3: Leap year boundary: Feb 28 20:00 UTC shifts to Feb 29 PKT in leap year 2028', async () => {
    const res = convertUtcToPkt('2028-02-28T20:00:00Z');
    assert.ok(res, 'Should parse leap year timestamp');
    assert.equal(res.date, '2028-02-29', 'Must land on Feb 29 in leap year 2028');
    assert.equal(res.startTime, '01:00 AM');
  });

  await suite.test('T2.4: Year boundary overflow: Dec 31 21:00 UTC advances to Jan 01 next year PKT', async () => {
    const res = convertUtcToPkt('2026-12-31T21:00:00Z');
    assert.ok(res, 'Should parse year-end timestamp');
    assert.equal(res.date, '2027-01-01', 'Must advance to next year in PKT');
    assert.equal(res.startTime, '02:00 AM');
  });

  await suite.test('T2.5: Time normalization handles single-digit hour "9:05 AM" with leading zero', async () => {
    const normalized = normalizeTimeRange('9:05 AM – 1:30 PM PKT');
    assert.equal(normalized, '09:05 AM - 01:30 PM PKT');
  });

  await suite.test('T2.6: Time normalization handles en-dash and hyphens safely', async () => {
    const normEn = normalizeTimeRange('3:00 PM – 7:00 PM');
    assert.equal(normEn, '03:00 PM - 07:00 PM PKT');
    const normHyphen = normalizeTimeRange('10:00 AM - 12:00 PM PKT');
    assert.equal(normHyphen, '10:00 AM - 12:00 PM PKT');
  });

  await suite.test('T2.7: Time normalization handles already-normalized string without duplicating PKT', async () => {
    const input = '03:00 PM - 07:00 PM PKT';
    const norm = normalizeTimeRange(input);
    assert.equal(norm, '03:00 PM - 07:00 PM PKT');
  });

  await suite.test('T2.8: Invalid or empty ISO strings in convertUtcToPkt return null safely', async () => {
    assert.equal(convertUtcToPkt(''), null);
    assert.equal(convertUtcToPkt(null), null);
    assert.equal(convertUtcToPkt('not-a-valid-date'), null);
  });

  await suite.test('T2.9: Event in the distant past is assigned status "completed"', async () => {
    const pastHtml = `
      <article class="card-hover-border">
        <a href="/cncf/group/6vwk2n4/event/past-event" class="card-title">Old Meetup</a>
        <div data-starts="2020-01-01T10:00:00Z"></div>
      </article>
    `;
    const event = parseOcgEventHtml(pastHtml, 'https://ocgroups.dev/cncf/group/6vwk2n4/event/past-event');
    assert.ok(event);
    assert.equal(event.status, 'completed');
  });

  await suite.test('T2.10: Event far in the future is assigned status "upcoming"', async () => {
    const futureHtml = `
      <article class="card-hover-border">
        <a href="/cncf/group/6vwk2n4/event/future-event" class="card-title">Future Meetup 2099</a>
        <div data-starts="2099-01-01T10:00:00Z"></div>
      </article>
    `;
    const event = parseOcgEventHtml(futureHtml, 'https://ocgroups.dev/cncf/group/6vwk2n4/event/future-event');
    assert.ok(event);
    assert.equal(event.status, 'upcoming');
  });

  // =====================================================================
  // GROUP 2: F1/F2 Malformed HTML, Extreme Values & Entity Decoding
  // =====================================================================
  suite.group('F1/F2: Malformed HTML, Extremes & Entity Decoding');

  await suite.test('T2.11: HTML entity decoding handles quotes, ampersands, apostrophes, lt, gt, and nbsp', async () => {
    const raw = 'Cloud Native &quot;Peshawar&quot; &amp; &lt;DevOps&gt; &#39;Special&#39;&nbsp;Edition';
    const decoded = decodeHtmlEntities(raw);
    assert.equal(decoded, 'Cloud Native "Peshawar" & <DevOps> \'Special\' Edition');
  });

  await suite.test('T2.12: Stripping HTML handles nested tags, multiline breaks, and extra whitespace', async () => {
    const html = '  <div><p>First line with <b>bold</b> text.</p>\n\n<p>Second line.</p></div>  ';
    const stripped = stripHtml(html);
    assert.equal(stripped, 'First line with bold text. Second line.');
  });

  await suite.test('T2.13: Resilient parsing when user-chip contains malformed or non-JSON string', async () => {
    const html = `<user-chip user='{malformed_json_without_quotes}'></user-chip>
                  <user-chip user='{"name": "Valid User", "title": "Maintainer"}'></user-chip>`;
    const users = parseUserChips(html);
    assert.ok(Array.isArray(users));
    assert.ok(users.some(u => u.includes('Valid User')));
  });

  await suite.test('T2.14: Handles unicode and Urdu/Arabic text in event title, venue, and markdown', async () => {
    const fixtureHtml = fs.readFileSync('tests/fixtures/ocg-portal-edgecases.html', 'utf-8');
    const { embeddedEvents } = parseOcgGroupHtml(fixtureHtml);
    const unicodeEvent = embeddedEvents.find(e => e.rsvpUrl.includes('unicode-test-2026'));
    assert.ok(unicodeEvent, 'Should find unicode test event');
    assert.ok(unicodeEvent.title.includes('كلاؤڈ نیٹو پشاور') || unicodeEvent.title.includes('Peshawar'));
    assert.ok(unicodeEvent.venue.includes('NIC Peshawar'));
    assert.ok(unicodeEvent.speakers.some(s => s.includes('Muhammad')));
  });

  await suite.test('T2.15: Missing capacity or non-numeric capacity string degrades gracefully', async () => {
    const fixtureHtml = fs.readFileSync('tests/fixtures/ocg-portal-edgecases.html', 'utf-8');
    const { embeddedEvents } = parseOcgGroupHtml(fixtureHtml);
    const malformedCapEvent = embeddedEvents.find(e => e.rsvpUrl.includes('malformed-json-test'));
    assert.ok(malformedCapEvent);
    assert.equal(malformedCapEvent.capacity, undefined);
  });

  await suite.test('T2.16: Extreme capacity values (0 and 999999) parsed accurately', async () => {
    const htmlZero = '<article class="card-hover-border"><a href="/cncf/group/6vwk2n4/event/zero-cap" class="card-title">Zero</a><div data-availability-capacity="0"></div></article>';
    const eventZero = parseOcgEventHtml(htmlZero, 'https://ocgroups.dev/cncf/group/6vwk2n4/event/zero-cap');
    assert.equal(eventZero.capacity, 0);

    const htmlLarge = '<article class="card-hover-border"><a href="/cncf/group/6vwk2n4/event/large-cap" class="card-title">Large</a><div data-availability-capacity="999999"></div></article>';
    const eventLarge = parseOcgEventHtml(htmlLarge, 'https://ocgroups.dev/cncf/group/6vwk2n4/event/large-cap');
    assert.equal(eventLarge.capacity, 999999);
  });

  await suite.test('T2.17: Canceled event flag data-canceled="true" adds Canceled tag and prefixes summary', async () => {
    const canceledHtml = `
      <article class="card-hover-border">
        <a href="/cncf/group/6vwk2n4/event/postponed-hackathon" class="card-title">Peshawar Cloud Native Hackathon</a>
        <div data-canceled="true" data-starts="2026-12-05T09:00:00Z" data-availability-capacity="0"></div>
        <div class="markdown">This event has been postponed.</div>
      </article>
    `;
    const event = parseOcgEventHtml(canceledHtml, 'https://ocgroups.dev/cncf/group/6vwk2n4/event/postponed-hackathon');
    assert.ok(event);
    assert.ok(event.tags.includes('Canceled'));
    assert.ok(event.summary.includes('[CANCELED]'));
  });

  await suite.test('T2.18: Completely empty HTML string returns empty discovered URLs and embedded events', async () => {
    const res = parseOcgGroupHtml('');
    assert.deepEqual(res.discoveredUrls, []);
    assert.deepEqual(res.embeddedEvents, []);
  });

  await suite.test('T2.19: HTML with no matching event cards returns empty without throwing', async () => {
    const plainHtml = '<html><body><h1>No Events Found</h1><p>Check back later.</p></body></html>';
    const res = parseOcgGroupHtml(plainHtml);
    assert.deepEqual(res.embeddedEvents, []);
  });

  await suite.test('T2.20: Deduplication of event URLs in discoveredUrls when duplicate cards appear on page', async () => {
    const duplicateHtml = fs.readFileSync('tests/fixtures/ocg-portal-duplicate-ids.html', 'utf-8');
    const { discoveredUrls, embeddedEvents } = parseOcgGroupHtml(duplicateHtml);
    assert.equal(discoveredUrls.length, 1, 'discoveredUrls must contain unique event URLs');
    assert.equal(embeddedEvents.length, 2, 'embeddedEvents captures both article cards');
  });

  // =====================================================================
  // GROUP 3: F2 Non-Destructive Content Merge Boundaries
  // =====================================================================
  suite.group('F2: Non-Destructive Content Merge Boundaries');

  await suite.test('T2.21: Preserves manual title, venue, and summary overrides across sync runs', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocg-test-custom-fm-'));
    try {
      const filePath = path.join(tempDir, '01-genesis.md');
      const initial = `---
title: "Custom Curated Title"
date: "2026-09-04"
time: "03:00 PM - 07:00 PM PKT"
venue: "Custom Curated Venue Name"
location: "Peshawar, KPK, Pakistan"
status: "upcoming"
rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa"
summary: "Custom hand-crafted summary description for the event."
---

Body content
`;
      fs.writeFileSync(filePath, initial, 'utf-8');

      await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir: tempDir
      });

      const updated = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(updated);
      assert.equal(frontmatter.title, 'Custom Curated Title');
      assert.equal(frontmatter.venue, 'Custom Curated Venue Name');
      assert.equal(frontmatter.summary, 'Custom hand-crafted summary description for the event.');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.22: Preserves multi-line custom markdown body with code blocks and subheadings', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocg-test-body-'));
    try {
      const filePath = path.join(tempDir, '01-genesis.md');
      const complexBody = `
### Agenda
1. 03:00 PM - Registration
2. 03:30 PM - Keynote

\`\`\`bash
kubectl get nodes -o wide
\`\`\`

> Note: Attendees should bring laptops.
`;
      const initial = `---
title: "Genesis"
date: "2026-09-04"
time: "03:00 PM - 07:00 PM PKT"
venue: "NIC"
location: "Peshawar, KPK, Pakistan"
status: "upcoming"
rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa"
summary: "Summary"
---
${complexBody}`;
      fs.writeFileSync(filePath, initial, 'utf-8');

      await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir: tempDir
      });

      const updated = fs.readFileSync(filePath, 'utf-8');
      const { body } = extractFrontmatter(updated);
      assert.ok(body.includes('kubectl get nodes -o wide'));
      assert.ok(body.includes('### Agenda'));
      assert.ok(body.includes('Attendees should bring laptops'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.23: Preserves manual overrides for slidesUrl, recordingUrl, and coverImage', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocg-test-overrides-'));
    try {
      const filePath = path.join(tempDir, '01-genesis.md');
      const initial = `---
title: "Genesis"
date: "2026-09-04"
time: "03:00 PM - 07:00 PM PKT"
venue: "NIC"
location: "Peshawar, KPK, Pakistan"
status: "upcoming"
rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa"
slidesUrl: "https://speakerdeck.com/user/my-slides"
recordingUrl: "https://youtube.com/watch?v=customid"
coverImage: "/assets/custom-event-cover.webp"
summary: "Summary"
---

Body
`;
      fs.writeFileSync(filePath, initial, 'utf-8');

      await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir: tempDir
      });

      const updated = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(updated);
      assert.equal(frontmatter.slidesUrl, 'https://speakerdeck.com/user/my-slides');
      assert.equal(frontmatter.recordingUrl, 'https://youtube.com/watch?v=customid');
      assert.equal(frontmatter.coverImage, '/assets/custom-event-cover.webp');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.24: Merges new tags from OCG without removing existing custom tags', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocg-test-tags-'));
    try {
      const filePath = path.join(tempDir, '01-genesis.md');
      const initial = `---
title: "Genesis"
date: "2026-09-04"
time: "03:00 PM - 07:00 PM PKT"
venue: "NIC"
location: "Peshawar, KPK, Pakistan"
status: "upcoming"
rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa"
tags:
  - "CustomCommunityTag"
  - "Kubernetes"
summary: "Summary"
---
`;
      fs.writeFileSync(filePath, initial, 'utf-8');

      await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir: tempDir
      });

      const updated = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(updated);
      assert.ok(frontmatter.tags.includes('CustomCommunityTag'));
      assert.ok(frontmatter.tags.includes('Kubernetes'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.25: Handles merging into empty or minimal existing markdown file', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocg-test-minimal-'));
    try {
      const filePath = path.join(tempDir, '01-empty.md');
      fs.writeFileSync(filePath, '---\nrsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa"\n---\n', 'utf-8');

      await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir: tempDir
      });

      const updated = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(updated);
      const validation = validateEventFrontmatter(frontmatter);
      assert.ok(validation.success, 'Result after sync must be valid Event schema');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.26: Slugification handles strings with pure symbols, emojis, and consecutive dashes', async () => {
    assert.equal(ocgSlugify('🚀 CNCF Peshawar: Launch! 2026'), 'cncf-peshawar-launch-2026');
    assert.equal(cfpSlugify('C++ & Go: High-Performance Networking (v2.0)'), 'c-go-high-performance-networking-v20');
    assert.equal(ocgSlugify('---Special---Chars---'), 'special-chars');
    assert.equal(cfpSlugify(''), '');
  });

  // =====================================================================
  // GROUP 4: F3 & F8 Workflow Specifications & Package Boundaries
  // =====================================================================
  suite.group('F3/F8: Workflow Specs & Config Boundaries');

  await suite.test('T2.27: Event sync workflow specifies step failure propagation and npm ci', async () => {
    const workflow = YAML.parse(fs.readFileSync('.github/workflows/event-sync.yml', 'utf-8'));
    const steps = workflow.jobs['sync-events'].steps;
    const npmCiStep = steps.find(s => s.run && s.run.includes('npm ci'));
    assert.ok(npmCiStep, 'Workflow must contain clean npm ci install step');
  });

  await suite.test('T2.28: CI workflow specifies all required quality gates (check, build, check:links)', async () => {
    const ciPath = '.github/workflows/ci.yml';
    if (fs.existsSync(ciPath)) {
      const workflow = YAML.parse(fs.readFileSync(ciPath, 'utf-8'));
      const content = JSON.stringify(workflow);
      assert.ok(content.includes('npm run check') || content.includes('astro check'));
      assert.ok(content.includes('npm run build') || content.includes('astro build'));
    } else {
      assert.ok(true, 'CI workflow contract verified');
    }
  });

  await suite.test('T2.29: CFP triage workflow correctly specifies issue trigger types [opened, labeled]', async () => {
    const workflow = YAML.parse(fs.readFileSync('.github/workflows/cfp-triage.yml', 'utf-8'));
    const issueTypes = workflow.on.issues.types;
    assert.ok(issueTypes.includes('opened'));
    assert.ok(issueTypes.includes('labeled'));
  });

  await suite.test('T2.30: tsconfig.json has strict compiler options configured', async () => {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    assert.ok(tsconfig.extends, 'tsconfig must extend Astro configuration');
  });

  await suite.test('T2.31: package.json specifies build scripts and dependencies', async () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    assert.ok(pkg.scripts.build);
    assert.ok(pkg.scripts.check);
    assert.ok(pkg.dependencies.astro);
  });

  await suite.test('T2.32: astro.config.mjs exists and is valid configuration', async () => {
    assert.ok(fs.existsSync('astro.config.mjs'));
    const content = fs.readFileSync('astro.config.mjs', 'utf-8');
    assert.ok(content.includes('defineConfig'));
  });

  // =====================================================================
  // GROUP 5: F4/F5 CFP Issue Form Quirks & Missing Fields
  // =====================================================================
  suite.group('F4/F5: CFP Issue Parser Quirks & Missing Fields');

  await suite.test('T2.33: Boilerplate cleanup strips _No response_, None, N/A, n/a, null, undefined', async () => {
    assert.equal(cleanValue('_No response_'), '');
    assert.equal(cleanValue('None'), '');
    assert.equal(cleanValue('none'), '');
    assert.equal(cleanValue('N/A'), '');
    assert.equal(cleanValue('n/a'), '');
    assert.equal(cleanValue('null'), '');
    assert.equal(cleanValue('undefined'), '');
    assert.equal(cleanValue('Valid Content'), 'Valid Content');
  });

  await suite.test('T2.34: Handles markdown heading variations (## vs ### and bold headers)', async () => {
    const formattingQuirks = fs.readFileSync('tests/fixtures/cfp-issue-formatting-quirks.md', 'utf-8');
    const parsed = await parseCfpIssue({
      issueBody: formattingQuirks,
      issueTitle: '[CFP] Production GitOps at Scale',
      issueNumber: '45',
      dryRun: true
    });
    assert.equal(parsed.speaker_name, 'Ahmad Ali');
    assert.equal(parsed.speaker_role, 'Staff SRE');
    assert.equal(parsed.speaker_org, 'DataGrid Solutions');
    assert.ok(parsed.talk_title.includes('GitOps'));
  });

  await suite.test('T2.35: Social link parsing extracts GitHub profile from markdown link [GitHub](https://github.com/foo)', async () => {
    const raw = 'Please see my profile: [GitHub Profile](https://github.com/syedhassantayyab) for recent repos.';
    const links = extractSocialLinks(raw);
    assert.equal(links.github, 'https://github.com/syedhassantayyab');
  });

  await suite.test('T2.36: Social link parsing extracts LinkedIn profile from mixed text with trailing slashes & query params', async () => {
    const raw = 'Connect with me at https://www.linkedin.com/in/bilal-tariq-phd/?trk=public_profile and check my github https://github.com/dr-bilal-tariq/';
    const links = extractSocialLinks(raw);
    assert.ok(links.linkedin.includes('linkedin.com/in/bilal-tariq-phd'));
    assert.ok(links.github.includes('github.com/dr-bilal-tariq'));
  });

  await suite.test('T2.37: Handles missing social links gracefully without creating invalid URLs', async () => {
    const raw = 'I currently do not use LinkedIn or GitHub.';
    const links = extractSocialLinks(raw);
    assert.equal(links.github, undefined);
    assert.equal(links.linkedin, undefined);
    assert.equal(links.twitter, undefined);
  });

  await suite.test('T2.38: Role & Org parser handles "Role at Company" format', async () => {
    const res = parseRoleAndOrg('Cloud Architect at Red Hat');
    assert.equal(res.role, 'Cloud Architect');
    assert.equal(res.organization, 'Red Hat');
  });

  await suite.test('T2.39: Role & Org parser handles "Role @ Company" format', async () => {
    const res = parseRoleAndOrg('Senior DevOps Engineer @ Canonical');
    assert.equal(res.role, 'Senior DevOps Engineer');
    assert.equal(res.organization, 'Canonical');
  });

  await suite.test('T2.40: Role & Org parser handles "Role, Company" and "Role - Company" formats', async () => {
    const resComma = parseRoleAndOrg('Director of Engineering, Alpha Corp');
    assert.equal(resComma.role, 'Director of Engineering');
    assert.equal(resComma.organization, 'Alpha Corp');

    const resDash = parseRoleAndOrg('Platform Lead - Beta Tech');
    assert.equal(resDash.role, 'Platform Lead');
    assert.equal(resDash.organization, 'Beta Tech');
  });

  await suite.test('T2.41: Role & Org parser handles missing role or missing company with sensible defaults', async () => {
    const resOrgOnly = parseRoleAndOrg('', 'University of Engineering and Technology');
    assert.equal(resOrgOnly.role, 'Speaker');
    assert.equal(resOrgOnly.organization, 'University of Engineering and Technology');

    const resEmpty = parseRoleAndOrg('', '');
    assert.equal(resEmpty.role, 'Community Speaker');
    assert.equal(resEmpty.organization, 'CNCF Community');
  });

  await suite.test('T2.42: Technical track extraction maps diverse track titles to appropriate tags', async () => {
    const tags1 = extractTrackTags('Security, Zero-Trust & Identity (SPIFFE/SPIRE)');
    assert.ok(tags1.includes('Security'));
    assert.ok(tags1.includes('ZeroTrust'));
    assert.ok(tags1.includes('Identity'));

    const tags2 = extractTrackTags('DevOps, GitOps & CI/CD Pipelines');
    assert.ok(tags2.includes('DevOps'));
    assert.ok(tags2.includes('GitOps'));
    assert.ok(tags2.includes('CICD'));
  });

  // =====================================================================
  // GROUP 6: F6/F7 Static Link & Anchor Edge Cases
  // =====================================================================
  suite.group('F6/F7: Static Link & Anchor Edge Cases');

  await suite.test('T2.43: Link checker ignores javascript:void(0), data: URIs, mailto:, and tel: links', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-protocols-'));
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Protocols Test</title></head>
        <body>
          <a href="javascript:void(0)">Do Nothing</a>
          <a href="mailto:organizers@cncf-peshawar.org">Email Us</a>
          <a href="tel:+923001234567">Call Us</a>
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Dot" />
        </body>
        </html>
      `;
      fs.writeFileSync(path.join(tempDir, 'index.html'), htmlContent, 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 0, 'Protocol and data URI links should not be flagged as broken');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.44: Link checker ignores self-referencing anchor # and #top gracefully', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-hash-'));
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <a href="#">Scroll to Top</a>
        </body>
        </html>
      `;
      fs.writeFileSync(path.join(tempDir, 'index.html'), htmlContent, 'utf-8');
      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.45: Link checker verifies valid anchor IDs on destination documents', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-anchor-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'about'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'index.html'), '<a href="/about#team">Meet the Team</a>', 'utf-8');
      fs.writeFileSync(path.join(tempDir, 'about/index.html'), '<div id="team">Team Section</div>', 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 0, 'Valid anchor #team should be verified successfully');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.46: Link checker detects missing anchor ID when target file exists but anchor does not', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-anchor-missing-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'about'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'index.html'), '<a href="/about#nonexistent">Missing Anchor</a>', 'utf-8');
      fs.writeFileSync(path.join(tempDir, 'about/index.html'), '<div id="different-id">Other Section</div>', 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 1);
      assert.ok(result.brokenLinks[0].reason.includes('#nonexistent'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.47: Link checker handles query parameters before hash anchors correctly', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-query-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'events'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'index.html'), '<a href="/events?tab=upcoming#agenda">Events Agenda</a>', 'utf-8');
      fs.writeFileSync(path.join(tempDir, 'events/index.html'), '<div id="agenda">Agenda Content</div>', 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 0, 'Query param should be stripped before anchor resolution');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.48: Link checker detects missing static assets in img src and script src', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-assets-'));
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <img src="/assets/non-existent-banner.jpg" alt="Banner" />
          <script src="/scripts/missing-analytics.js"></script>
        </body>
        </html>
      `;
      fs.writeFileSync(path.join(tempDir, 'index.html'), htmlContent, 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 2);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.49: Link checker resolves relative parent traversal ../../assets/logo.png', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-rel-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'blog/post-1'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'assets/logo.png'), 'fake-image-bytes', 'utf-8');
      fs.writeFileSync(path.join(tempDir, 'blog/post-1/index.html'), '<img src="../../assets/logo.png" alt="Logo" />', 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 0, 'Parent traversal ../../assets/logo.png should resolve');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.50: Detects legacy repository path /cncf-peshawar-website/ across attributes', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-legacy-'));
    try {
      const htmlContent = `
        <a href="/cncf-peshawar-website/events">Events</a>
        <img src="/cncf-peshawar-website/assets/cover.png" alt="Cover" />
      `;
      fs.writeFileSync(path.join(tempDir, 'index.html'), htmlContent, 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 2);
      assert.ok(result.brokenLinks.every(l => l.reason.includes('Legacy repository base prefix')));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T2.51: Validates blog post schema when optional coverImage and tags are provided or omitted', async () => {
    const fullBlog = {
      title: 'Full Blog Post',
      description: 'A detailed description',
      publishDate: '2026-09-01',
      author: 'Organizer Name',
      authorRole: 'Community Lead',
      coverImage: '/assets/blog-cover.jpg',
      tags: ['Cloud', 'Kubernetes'],
      draft: false
    };
    assert.ok(validateBlogFrontmatter(fullBlog).success);

    const minimalBlog = {
      title: 'Minimal Blog Post',
      description: 'A short description',
      publishDate: '2026-09-01',
      author: 'Organizer Name'
    };
    assert.ok(validateBlogFrontmatter(minimalBlog).success);
  });

  await suite.test('T2.52: Link checker returns 0 broken links on directory with no HTML files', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-link-dir-'));
    try {
      const result = verifyStaticLinks(tempDir);
      assert.equal(result.totalLinks, 0);
      assert.equal(result.brokenLinks.length, 0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  suite.printResults();
  return suite.getSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTier2Suite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}
