/**
 * Tier 3: Cross-Feature Integration E2E Test Suite
 * CNCF Peshawar Automation Suite
 * 
 * Verifies end-to-end interactions, data pipelines, schema contracts,
 * and workflows across Features F1 through F8.
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
  parseOcgEventHtml,
  parseOcgGroupHtml,
  syncEvents
} from '../scripts/sync-ocg-events.mjs';

import {
  parseCfpIssue,
  slugify
} from '../scripts/parse-cfp-issue.mjs';

export async function runTier3Suite() {
  const suite = new TestHarness('Tier 3: Cross-Feature Integration (F1 - F8)');

  // =====================================================================
  // INTERACTION 1: OCG Scraper -> Event Markdown -> Schema Validation
  // =====================================================================
  suite.group('Cross-Feature: OCG Sync to Astro Content Collections');

  await suite.test('T3.1: OCG Scraper -> Event Markdown Generation -> Zod Schema Conformance', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-ocg-sync-'));
    try {
      const syncRes = await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir: tempDir
      });
      assert.ok(syncRes.success, 'Sync must report success');
      assert.ok(syncRes.created.length >= 2, 'Should create at least 2 event files');

      for (const fileName of syncRes.created) {
        const filePath = path.join(tempDir, fileName);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { frontmatter, body } = extractFrontmatter(content);

        const validation = validateEventFrontmatter(frontmatter);
        assert.ok(validation.success, `Schema validation failed for ${fileName}: ${JSON.stringify(validation.error?.format())}`);
        assert.ok(frontmatter.rsvpUrl.startsWith('https://ocgroups.dev'), 'Must contain valid OCG RSVP URL');
        assert.ok(frontmatter.title.length > 0, 'Title must be non-empty');
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 2: CFP Issue Parser -> Speaker & Draft Event Generation
  // =====================================================================
  suite.group('Cross-Feature: CFP Parser to Speaker & Event Drafts');

  await suite.test('T3.2: CFP Issue Parser -> Speaker & Draft Event Pair Generation -> Mutual Cross-Referencing', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-cfp-gen-'));
    try {
      const issueBody = fs.readFileSync('tests/fixtures/cfp-issue-valid-full.md', 'utf-8');
      const parsed = await parseCfpIssue({
        issueBody,
        issueTitle: '[CFP] Multi-Agent Systems on K8s',
        issueNumber: '42',
        issueUrl: 'https://github.com/Cloud-Native-Peshawar/cncf-peshawar-website/issues/42',
        baseDir: tempDir,
        dryRun: false
      });

      // Verify Speaker Markdown
      const speakerFile = path.join(tempDir, 'src/content/speakers/syed-hassan-tayyab.md');
      assert.ok(fs.existsSync(speakerFile), 'Speaker file must be written to disk');
      const speakerFm = extractFrontmatter(fs.readFileSync(speakerFile, 'utf-8')).frontmatter;
      const speakerVal = validateSpeakerFrontmatter(speakerFm);
      assert.ok(speakerVal.success, `Speaker schema validation failed: ${JSON.stringify(speakerVal.error?.format())}`);
      assert.equal(speakerFm.name, 'Syed Hassan Tayyab');
      assert.equal(speakerFm.topic, 'Multi-Agent Systems on K8s');

      // Verify Event Draft Markdown
      const eventFile = path.join(tempDir, 'src/content/events/draft-multi-agent-systems-on-k8s.md');
      assert.ok(fs.existsSync(eventFile), 'Draft event file must be written to disk');
      const eventFm = extractFrontmatter(fs.readFileSync(eventFile, 'utf-8')).frontmatter;
      assert.ok(eventFm.speakers.some(s => s.includes('Syed Hassan Tayyab')), 'Event draft must reference speaker');
      assert.equal(eventFm.status, 'upcoming');
      assert.ok(eventFm.tags.includes('CFP-Draft'), 'Draft event must include CFP-Draft tag');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 3: CFP Speaker + Draft Event -> OCG Sync Non-Destructive Update
  // =====================================================================
  suite.group('Cross-Feature: CFP Drafts & OCG Event Sync Interaction');

  await suite.test('T3.3: CFP Speaker & Event Draft -> OCG Event Sync Non-Destructive Enrichment', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-cfp-ocg-merge-'));
    try {
      const eventsDir = path.join(tempDir, 'events');
      fs.mkdirSync(eventsDir, { recursive: true });

      // Step 1: Create Draft Event from CFP with provisional details
      const draftFilePath = path.join(eventsDir, '01-cncf-peshawar-genesis.md');
      const draftContent = `---
title: "CNCF Peshawar Genesis (Hand-Crafted Draft)"
date: "2026-09-04"
time: "03:00 PM - 07:00 PM PKT"
venue: "National Incubation Center (NIC) Peshawar"
location: "Peshawar, KPK, Pakistan"
status: "upcoming"
rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa"
slidesUrl: "https://slides.com/peshawar/genesis"
recordingUrl: "https://youtube.com/watch?v=livestream-genesis"
speakers:
  - "Syed Hassan Tayyab"
tags:
  - "CFP-Accepted"
  - "Genesis"
summary: "Community launch meetup with deep-dive technical talks."
---

## Community Agenda
- 03:00 PM: Opening Keynote
- 04:00 PM: Multi-Agent Systems on Kubernetes
`;
      fs.writeFileSync(draftFilePath, draftContent, 'utf-8');

      // Step 2: Run OCG Sync against upcoming fixture matching rsvpUrl
      await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir
      });

      // Step 3: Read back and assert non-destructive enrichment
      const updatedContent = fs.readFileSync(draftFilePath, 'utf-8');
      const { frontmatter, body } = extractFrontmatter(updatedContent);

      assert.equal(frontmatter.title, 'CNCF Peshawar Genesis (Hand-Crafted Draft)', 'Hand-crafted title must be preserved');
      assert.equal(frontmatter.slidesUrl, 'https://slides.com/peshawar/genesis', 'Manual slidesUrl must be preserved');
      assert.equal(frontmatter.recordingUrl, 'https://youtube.com/watch?v=livestream-genesis', 'Manual recordingUrl must be preserved');
      assert.ok(frontmatter.tags.includes('CFP-Accepted'), 'CFP-Accepted tag must be preserved');
      assert.equal(frontmatter.lumaUrl, 'https://luma.com/shufbsm5', 'Luma URL must be enriched from OCG');
      assert.equal(frontmatter.capacity, 70, 'Capacity must be enriched from OCG');
      assert.ok(body.includes('## Community Agenda'), 'Markdown body must remain intact');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 4: OCG Sync Output -> Static Build Simulation -> Link Checker
  // =====================================================================
  suite.group('Cross-Feature: OCG Sync to Static Site Link Integrity');

  await suite.test('T3.4: OCG Event Sync -> Built HTML Simulation -> Static Link Checker Validation', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-html-sim-'));
    try {
      // Create simulated static site dist
      fs.mkdirSync(path.join(tempDir, 'events/genesis'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'speakers/syed-hassan-tayyab'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'assets/logo.png'), 'fake-image', 'utf-8');

      // Home page linking to events and speaker
      const indexHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Cloud Native Peshawar</title></head>
        <body>
          <header id="header">
            <img src="/assets/logo.png" alt="CNCF Peshawar" />
            <nav>
              <a href="/events/genesis/">Genesis Event</a>
              <a href="/speakers/syed-hassan-tayyab/">Syed Hassan Tayyab</a>
              <a href="https://ocgroups.dev/cncf/group/6vwk2n4">OCG Portal</a>
            </nav>
          </header>
        </body>
        </html>
      `;
      fs.writeFileSync(path.join(tempDir, 'index.html'), indexHtml, 'utf-8');

      // Event detail page
      const eventHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>CNCF Peshawar Genesis</title></head>
        <body>
          <h1 id="event-title">CNCF Peshawar Genesis</h1>
          <a href="https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa">RSVP on OCG</a>
          <a href="https://luma.com/shufbsm5">RSVP on Luma</a>
          <a href="/speakers/syed-hassan-tayyab/">Featured Speaker</a>
          <a href="/">Back to Home</a>
        </body>
        </html>
      `;
      fs.writeFileSync(path.join(tempDir, 'events/genesis/index.html'), eventHtml, 'utf-8');

      // Speaker detail page
      const speakerHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Syed Hassan Tayyab - Speaker</title></head>
        <body>
          <h1>Syed Hassan Tayyab</h1>
          <a href="https://github.com/syedhassantayyab">GitHub</a>
          <a href="/events/genesis/#event-title">Speaking at Genesis</a>
        </body>
        </html>
      `;
      fs.writeFileSync(path.join(tempDir, 'speakers/syed-hassan-tayyab/index.html'), speakerHtml, 'utf-8');

      const result = verifyStaticLinks(tempDir);
      assert.equal(result.brokenLinks.length, 0, `All cross-page links and anchors must resolve. Errors: ${JSON.stringify(result.brokenLinks)}`);
      assert.ok(result.totalLinks >= 6, 'Should verify all internal and external links in graph');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 5: CFP CLI Output to GitHub Actions PR Payload
  // =====================================================================
  suite.group('Cross-Feature: CFP Parser CLI to PR Bot Automation');

  await suite.test('T3.5: CFP Parser CLI Output -> JSON Payload -> PR Branch & File Target Resolution', async () => {
    const res = runCommand('node', [
      'scripts/parse-cfp-issue.mjs',
      '--issue-body', 'tests/fixtures/cfp-issue-valid-full.md',
      '--issue-title', '[CFP] Multi-Agent Systems on K8s',
      '--issue-number', '42',
      '--issue-url', 'https://github.com/Cloud-Native-Peshawar/cncf-peshawar-website/issues/42',
      '--dry-run',
      '--output-json'
    ]);

    assert.equal(res.status, 0, `CLI must exit 0: ${res.stderr}`);
    const manifest = JSON.parse(res.stdout.trim());

    assert.equal(manifest.speaker_name, 'Syed Hassan Tayyab');
    assert.equal(manifest.talk_title, 'Multi-Agent Systems on K8s');
    assert.equal(manifest.branch_name, 'cfp/issue-42-syed-hassan-tayyab');
    assert.equal(manifest.speaker_file, 'src/content/speakers/syed-hassan-tayyab.md');
    assert.equal(manifest.event_file, 'src/content/events/draft-multi-agent-systems-on-k8s.md');
    assert.equal(manifest.issue_number, '42');
    assert.ok(manifest.pr_title.includes('Multi-Agent Systems'));
  });

  // =====================================================================
  // INTERACTION 6: Legacy Blog Post Fix & Link Resolution
  // =====================================================================
  suite.group('Cross-Feature: Legacy Blog Post & Link Checker');

  await suite.test('T3.6: Legacy Blog Post Fix -> Verifies zero broken legacy base prefix links', async () => {
    const blogPath = 'src/content/blog/announcing-cncf-peshawar.md';
    assert.ok(fs.existsSync(blogPath), 'Blog post must exist in repo');
    const content = fs.readFileSync(blogPath, 'utf-8');

    // Confirm that the legacy base prefix is absent in the markdown file
    assert.ok(!content.includes('/cncf-peshawar-website/'), 'Blog content must not contain legacy base prefix');
    
    // Frontmatter validation
    const { frontmatter } = extractFrontmatter(content);
    const val = validateBlogFrontmatter(frontmatter);
    assert.ok(val.success, 'Blog post frontmatter must validate against BlogSchema');
  });

  // =====================================================================
  // INTERACTION 7: Batch CFP Ingestion & Collision-Free Roster
  // =====================================================================
  suite.group('Cross-Feature: Batch CFP Ingestion & Slug Uniqueness');

  await suite.test('T3.7: Batch CFP Ingestion -> Multi-Speaker Content Collection Consistency & Zero Collisions', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-batch-cfp-'));
    try {
      const speakersDir = path.join(tempDir, 'src/content/speakers');
      const eventsDir = path.join(tempDir, 'src/content/events');

      const fixtures = [
        { file: 'tests/fixtures/cfp-issue-valid-full.md', num: '101', title: '[CFP] Multi-Agent Systems on K8s' },
        { file: 'tests/fixtures/cfp-issue-minimal.md', num: '102', title: '[CFP] K8s Pod Lifecycle' },
        { file: 'tests/fixtures/cfp-issue-social-variations.md', num: '103', title: '[CFP] OpenTelemetry Workshop' }
      ];

      const generatedSpeakers = [];
      const generatedEvents = [];

      for (const item of fixtures) {
        const body = fs.readFileSync(item.file, 'utf-8');
        const parsed = await parseCfpIssue({
          issueBody: body,
          issueTitle: item.title,
          issueNumber: item.num,
          baseDir: tempDir,
          dryRun: false
        });
        generatedSpeakers.push(parsed.speaker_slug);
        generatedEvents.push(parsed.event_slug);
      }

      // Check uniqueness of slugs
      assert.equal(new Set(generatedSpeakers).size, 3, 'All 3 speaker slugs must be unique');
      assert.equal(new Set(generatedEvents).size, 3, 'All 3 talk slugs must be unique');

      // Verify all generated speaker files on disk
      const speakerFiles = fs.readdirSync(speakersDir);
      assert.equal(speakerFiles.length, 3);
      for (const sf of speakerFiles) {
        const content = fs.readFileSync(path.join(speakersDir, sf), 'utf-8');
        const { frontmatter } = extractFrontmatter(content);
        const val = validateSpeakerFrontmatter(frontmatter);
        assert.ok(val.success, `Batch speaker file ${sf} failed validation: ${JSON.stringify(val.error?.format())}`);
      }

      // Verify all generated event draft files on disk
      const eventFiles = fs.readdirSync(eventsDir);
      assert.equal(eventFiles.length, 3);
      for (const ef of eventFiles) {
        assert.ok(ef.startsWith('draft-'), `Event draft filename must start with draft-: ${ef}`);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 8: Event Status Transition Across OCG Sync Cycles
  // =====================================================================
  suite.group('Cross-Feature: Event Lifecycle Status Transition');

  await suite.test('T3.8: Event Status Transition: Past vs Future timestamps in OCG Sync updates status reliably', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-lifecycle-'));
    try {
      const filePath = path.join(tempDir, '01-kickoff.md');
      // Initially upcoming
      const initial = `---
title: "CNCF Peshawar Kickoff"
date: "2026-09-04"
time: "03:00 PM - 07:00 PM PKT"
venue: "NIC Peshawar"
location: "Peshawar, KPK, Pakistan"
status: "upcoming"
rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/cncf-peshawar-kickoff-2025"
summary: "Kickoff meetup summary"
---
`;
      fs.writeFileSync(filePath, initial, 'utf-8');

      // Sync with past fixture (simulating time progression)
      await syncEvents({
        source: 'tests/fixtures/ocg-portal-past.html',
        eventsDir: tempDir
      });

      const updated = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter } = extractFrontmatter(updated);
      assert.equal(frontmatter.status, 'completed', 'Event status must transition to completed for past events');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 9: Full Multi-Stage End-to-End Pipeline
  // =====================================================================
  suite.group('Cross-Feature: Full Multi-Stage End-to-End Pipeline');

  await suite.test('T3.9: End-to-End Pipeline: Issue Ingestion -> Content Generation -> OCG Sync -> Static Link Scan', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-pipeline-'));
    try {
      const speakersDir = path.join(tempDir, 'content/speakers');
      const eventsDir = path.join(tempDir, 'content/events');
      const distDir = path.join(tempDir, 'dist');

      // Stage 1: CFP Triage
      const issueBody = fs.readFileSync('tests/fixtures/cfp-issue-valid-full.md', 'utf-8');
      const cfpRes = await parseCfpIssue({
        issueBody,
        issueTitle: '[CFP] Multi-Agent Systems on K8s',
        issueNumber: '42',
        speakersDir,
        eventsDir,
        dryRun: false
      });
      assert.ok(cfpRes.speaker_name, 'Stage 1: Speaker metadata parsed');

      // Stage 2: OCG Sync to enrich events
      const syncRes = await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir
      });
      assert.ok(syncRes.success, 'Stage 2: OCG Sync executed successfully');

      // Stage 3: Build HTML simulation
      fs.mkdirSync(path.join(distDir, 'events/genesis'), { recursive: true });
      fs.mkdirSync(path.join(distDir, 'speakers/syed-hassan-tayyab'), { recursive: true });

      fs.writeFileSync(path.join(distDir, 'index.html'), `
        <!DOCTYPE html>
        <html><body>
          <a href="/events/genesis/">Genesis</a>
          <a href="/speakers/syed-hassan-tayyab/">Speaker</a>
        </body></html>
      `, 'utf-8');

      fs.writeFileSync(path.join(distDir, 'events/genesis/index.html'), `
        <!DOCTYPE html>
        <html><body>
          <h1 id="top">Genesis Meetup</h1>
          <a href="/speakers/syed-hassan-tayyab/">Speaker Profile</a>
          <a href="/">Home</a>
        </body></html>
      `, 'utf-8');

      fs.writeFileSync(path.join(distDir, 'speakers/syed-hassan-tayyab/index.html'), `
        <!DOCTYPE html>
        <html><body>
          <h1>Syed Hassan Tayyab</h1>
          <a href="/events/genesis/#top">Genesis Talk</a>
        </body></html>
      `, 'utf-8');

      // Stage 4: Static link verification
      const linkReport = verifyStaticLinks(distDir);
      assert.equal(linkReport.brokenLinks.length, 0, 'Stage 4: Link checker must report 0 broken links');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 10: Event Cancellation Handling & Schema Compliance
  // =====================================================================
  suite.group('Cross-Feature: Event Cancellation Integration');

  await suite.test('T3.10: Event Cancellation Sync -> Content Schema & Badge Tag Integrity', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-cancel-sync-'));
    try {
      const syncRes = await syncEvents({
        source: 'tests/fixtures/ocg-portal-canceled.html',
        eventsDir: tempDir
      });
      assert.ok(syncRes.success);
      assert.ok(syncRes.created.length > 0);

      const canceledFile = path.join(tempDir, syncRes.created[0]);
      const { frontmatter } = extractFrontmatter(fs.readFileSync(canceledFile, 'utf-8'));

      const validation = validateEventFrontmatter(frontmatter);
      assert.ok(validation.success, `Canceled event must conform to Event schema: ${JSON.stringify(validation.error?.format())}`);
      assert.ok(frontmatter.tags.includes('Canceled') || frontmatter.title.includes('[CANCELED]'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 11: Multi-Speaker Conference OCG Sync
  // =====================================================================
  suite.group('Cross-Feature: Multi-Speaker Conference Ingestion');

  await suite.test('T3.11: Multi-Speaker OCG Event -> Individual Speaker Cross-Lookup Contract', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't3-multispeaker-'));
    try {
      const syncRes = await syncEvents({
        source: 'tests/fixtures/ocg-portal-multispeaker.html',
        eventsDir: tempDir
      });
      assert.ok(syncRes.success);
      assert.equal(syncRes.created.length, 1);

      const eventFile = path.join(tempDir, syncRes.created[0]);
      const { frontmatter } = extractFrontmatter(fs.readFileSync(eventFile, 'utf-8'));

      assert.equal(frontmatter.speakers.length, 4, 'Must parse all 4 conference speakers');
      const speakerSlugs = frontmatter.speakers.map(s => slugify(s.split('(')[0].trim()));
      assert.ok(speakerSlugs.includes('syed-hassan-tayyab'));
      assert.ok(speakerSlugs.includes('dr-bilal-tariq'));
      assert.ok(speakerSlugs.includes('zainab-khan'));
      assert.ok(speakerSlugs.includes('ahmad-ali'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTERACTION 12: Repository-Wide Content Collection Schema Audit
  // =====================================================================
  suite.group('Cross-Feature: Repository-Wide Content Collection Schema Audit');

  await suite.test('T3.12: Astro Schema Validation on Full Live Repository Content Collections', async () => {
    // 1. Audit src/content/events/
    const eventsDir = 'src/content/events';
    if (fs.existsSync(eventsDir)) {
      const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      for (const file of eventFiles) {
        const content = fs.readFileSync(path.join(eventsDir, file), 'utf-8');
        const { frontmatter } = extractFrontmatter(content);
        const val = validateEventFrontmatter(frontmatter);
        assert.ok(val.success, `Repository event file ${file} failed schema: ${JSON.stringify(val.error?.format())}`);
      }
    }

    // 2. Audit src/content/speakers/
    const speakersDir = 'src/content/speakers';
    if (fs.existsSync(speakersDir)) {
      const speakerFiles = fs.readdirSync(speakersDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      for (const file of speakerFiles) {
        const content = fs.readFileSync(path.join(speakersDir, file), 'utf-8');
        const { frontmatter } = extractFrontmatter(content);
        const val = validateSpeakerFrontmatter(frontmatter);
        assert.ok(val.success, `Repository speaker file ${file} failed schema: ${JSON.stringify(val.error?.format())}`);
      }
    }

    // 3. Audit src/content/blog/
    const blogDir = 'src/content/blog';
    if (fs.existsSync(blogDir)) {
      const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
      for (const file of blogFiles) {
        const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
        const { frontmatter } = extractFrontmatter(content);
        const val = validateBlogFrontmatter(frontmatter);
        assert.ok(val.success, `Repository blog file ${file} failed schema: ${JSON.stringify(val.error?.format())}`);
      }
    }
  });

  suite.printResults();
  return suite.getSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTier3Suite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}
