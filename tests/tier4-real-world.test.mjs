/**
 * Tier 4: Real-World Scenarios E2E Test Suite
 * CNCF Peshawar Automation Suite
 * 
 * Simulates complete, realistic community lifecycles:
 * - CFP-to-Event end-to-end community workflow
 * - Multi-speaker flagship conference ingestion and roster cross-linking
 * - Legacy site migration and full-graph static link integrity
 * - Idempotent multi-pass continuous sync with organizer manual overrides
 * - High-variability batch CFP triage with diverse submissions
 * - Emergency event cancellation and rescheduling workflow
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

export async function runTier4Suite() {
  const suite = new TestHarness('Tier 4: Real-World Community Lifecycle Scenarios');

  // =====================================================================
  // SCENARIO 1: Full Community CFP-to-Event Lifecycle
  // =====================================================================
  suite.group('Scenario 1: CFP-to-Event Community Lifecycle');

  await suite.test('S1: Complete Community CFP-to-Event Lifecycle from Issue submission to OCG Portal Enrichment', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 's1-cfp-lifecycle-'));
    try {
      const speakersDir = path.join(tempDir, 'src/content/speakers');
      const eventsDir = path.join(tempDir, 'src/content/events');

      // Step 1: Speaker submits CFP issue via GitHub Issue template
      const issueBody = fs.readFileSync('tests/fixtures/cfp-issue-valid-full.md', 'utf-8');
      const triageResult = await parseCfpIssue({
        issueBody,
        issueTitle: '[CFP] Multi-Agent Systems on K8s',
        issueNumber: '42',
        issueUrl: 'https://github.com/Cloud-Native-Peshawar/cncf-peshawar-website/issues/42',
        baseDir: tempDir,
        dryRun: false
      });

      assert.equal(triageResult.speaker_name, 'Syed Hassan Tayyab');
      assert.equal(triageResult.branch_name, 'cfp/issue-42-syed-hassan-tayyab');

      // Step 2: Verify Speaker Profile created and schema valid
      const speakerPath = path.join(speakersDir, 'syed-hassan-tayyab.md');
      assert.ok(fs.existsSync(speakerPath), 'Speaker file must exist on disk');
      const speakerFm = extractFrontmatter(fs.readFileSync(speakerPath, 'utf-8')).frontmatter;
      assert.ok(validateSpeakerFrontmatter(speakerFm).success, 'Speaker frontmatter must be valid');
      assert.equal(speakerFm.github, 'https://github.com/syedhassantayyab');

      // Step 3: Organizers schedule event on OCG portal (matching rsvpUrl)
      // We simulate existing draft having the OCG RSVP link
      const draftPath = path.join(eventsDir, 'draft-multi-agent-systems-on-k8s.md');
      assert.ok(fs.existsSync(draftPath), 'Draft event must exist on disk');

      // Set matching RSVP URL for OCG sync
      const draftContent = fs.readFileSync(draftPath, 'utf-8');
      const updatedDraft = draftContent.replace(
        'rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4"',
        'rsvpUrl: "https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa"'
      );
      fs.writeFileSync(draftPath, updatedDraft, 'utf-8');

      // Step 4: OCG Sync automation runs scheduled poll
      const syncResult = await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir
      });

      assert.ok(syncResult.success);
      assert.ok(syncResult.updated.includes('draft-multi-agent-systems-on-k8s.md'), 'Draft event must be updated non-destructively');

      // Step 5: Verify final enriched event file
      const finalContent = fs.readFileSync(draftPath, 'utf-8');
      const { frontmatter: finalFm, body: finalBody } = extractFrontmatter(finalContent);

      assert.ok(validateEventFrontmatter(finalFm).success, 'Enriched event must validate against EventSchema');
      assert.equal(finalFm.date, '2026-09-04', 'Date must be normalized from OCG');
      assert.equal(finalFm.time, '03:00 PM - 07:00 PM PKT', 'Time must be normalized in PKT');
      assert.equal(finalFm.lumaUrl, 'https://luma.com/shufbsm5', 'Luma link must be enriched');
      assert.equal(finalFm.capacity, 70, 'Capacity must be enriched');
      assert.ok(finalFm.speakers.some(s => s.includes('Syed Hassan Tayyab')), 'Speaker must be preserved');
      assert.ok(finalBody.includes('Session Abstract'), 'CFP session abstract must be preserved in markdown body');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SCENARIO 2: Multi-Speaker Flagship Regional Conference
  // =====================================================================
  suite.group('Scenario 2: Multi-Speaker Flagship Conference Ingestion');

  await suite.test('S2: Ingests Multi-Speaker Conference with 4 Diverse Speakers and Validates Roster & Slugs', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 's2-multispeaker-'));
    try {
      const eventsDir = path.join(tempDir, 'src/content/events');
      const speakersDir = path.join(tempDir, 'src/content/speakers');
      fs.mkdirSync(eventsDir, { recursive: true });
      fs.mkdirSync(speakersDir, { recursive: true });

      // Step 1: Run OCG Sync on multi-speaker fixture
      const syncResult = await syncEvents({
        source: 'tests/fixtures/ocg-portal-multispeaker.html',
        eventsDir
      });

      assert.ok(syncResult.success);
      assert.equal(syncResult.created.length, 1);

      const eventFile = path.join(eventsDir, syncResult.created[0]);
      const { frontmatter } = extractFrontmatter(fs.readFileSync(eventFile, 'utf-8'));

      assert.equal(frontmatter.speakers.length, 4, 'Must parse all 4 speakers from user chips');
      assert.ok(frontmatter.speakers.some(s => s.includes('Syed Hassan Tayyab')));
      assert.ok(frontmatter.speakers.some(s => s.includes('Dr. Bilal Tariq')));
      assert.ok(frontmatter.speakers.some(s => s.includes('Zainab Khan')));
      assert.ok(frontmatter.speakers.some(s => s.includes('Ahmad Ali')));

      // Step 2: Create speaker profiles for each parsed speaker
      for (const spk of frontmatter.speakers) {
        const nameOnly = spk.split('(')[0].trim();
        const roleAndOrg = spk.includes('(') ? spk.match(/\((.*?)\)/)?.[1] || 'Speaker' : 'Speaker';
        const spkSlug = slugify(nameOnly);

        const speakerMarkdown = `---
name: ${JSON.stringify(nameOnly)}
role: ${JSON.stringify(roleAndOrg)}
organization: "Cloud Native Peshawar"
bio: "Speaker at Cloud Native AI Conference 2026."
topic: ${JSON.stringify(frontmatter.title)}
featured: true
---

# ${nameOnly}
Profile details for ${nameOnly}.
`;
        fs.writeFileSync(path.join(speakersDir, `${spkSlug}.md`), speakerMarkdown, 'utf-8');
      }

      // Step 3: Validate all created speaker files
      const createdSpeakerFiles = fs.readdirSync(speakersDir);
      assert.equal(createdSpeakerFiles.length, 4, 'Must create 4 individual speaker files');
      for (const sf of createdSpeakerFiles) {
        const content = fs.readFileSync(path.join(speakersDir, sf), 'utf-8');
        const { frontmatter: spkFm } = extractFrontmatter(content);
        assert.ok(validateSpeakerFrontmatter(spkFm).success, `Speaker ${sf} failed validation`);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SCENARIO 3: Legacy Site Migration & Link Integrity
  // =====================================================================
  suite.group('Scenario 3: Legacy Site Migration & Static Link Integrity');

  await suite.test('S3: Audits and Verifies Link Integrity across Entire Static Site Graph (Home, Events, Speakers, Blog)', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 's3-link-graph-'));
    try {
      // Build directory tree
      fs.mkdirSync(path.join(tempDir, 'events/genesis'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'events/cloud-native-ai'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'speakers/syed-hassan-tayyab'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'speakers/dr-bilal-tariq'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'blog/announcing-cncf-peshawar'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'about'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'assets/images'), { recursive: true });

      // Assets
      fs.writeFileSync(path.join(tempDir, 'assets/images/logo.svg'), '<svg></svg>', 'utf-8');
      fs.writeFileSync(path.join(tempDir, 'assets/images/genesis-cover.webp'), 'fake-image', 'utf-8');

      // Home page
      fs.writeFileSync(path.join(tempDir, 'index.html'), `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Cloud Native Peshawar</title></head>
        <body>
          <header id="main-header">
            <img src="/assets/images/logo.svg" alt="CNCF Logo" />
            <nav>
              <a href="/events/genesis/">Genesis Event</a>
              <a href="/events/cloud-native-ai/">AI Conference</a>
              <a href="/speakers/syed-hassan-tayyab/">Speakers</a>
              <a href="/blog/announcing-cncf-peshawar/">Blog</a>
              <a href="/about/#organizers">About Us</a>
              <a href="https://ocgroups.dev/cncf/group/6vwk2n4">Join Chapter</a>
            </nav>
          </header>
        </body>
        </html>
      `, 'utf-8');

      // About page with anchor
      fs.writeFileSync(path.join(tempDir, 'about/index.html'), `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>About Cloud Native Peshawar</h1>
          <section id="organizers">
            <h2>Organizers</h2>
            <p>Community Team</p>
          </section>
        </body>
        </html>
      `, 'utf-8');

      // Genesis event page
      fs.writeFileSync(path.join(tempDir, 'events/genesis/index.html'), `
        <!DOCTYPE html>
        <html>
        <body>
          <h1 id="event-header">CNCF Peshawar Genesis</h1>
          <img src="/assets/images/genesis-cover.webp" alt="Genesis Cover" />
          <a href="/speakers/syed-hassan-tayyab/">Speaker Profile</a>
          <a href="https://luma.com/shufbsm5">Luma Registration</a>
          <a href="/">Home</a>
        </body>
        </html>
      `, 'utf-8');

      // AI conference event page
      fs.writeFileSync(path.join(tempDir, 'events/cloud-native-ai/index.html'), `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Cloud Native AI Conference</h1>
          <a href="/speakers/dr-bilal-tariq/">Keynote Speaker</a>
          <a href="/events/genesis/">Previous Event</a>
        </body>
        </html>
      `, 'utf-8');

      // Speaker 1
      fs.writeFileSync(path.join(tempDir, 'speakers/syed-hassan-tayyab/index.html'), `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Syed Hassan Tayyab</h1>
          <a href="/events/genesis/#event-header">Talk at Genesis</a>
          <a href="https://github.com/syedhassantayyab">GitHub</a>
        </body>
        </html>
      `, 'utf-8');

      // Speaker 2
      fs.writeFileSync(path.join(tempDir, 'speakers/dr-bilal-tariq/index.html'), `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Dr. Bilal Tariq</h1>
          <a href="/events/cloud-native-ai/">Speaking at AI Conference</a>
          <a href="https://linkedin.com">LinkedIn</a>
        </body>
        </html>
      `, 'utf-8');

      // Blog page (post-migration clean link structure)
      fs.writeFileSync(path.join(tempDir, 'blog/announcing-cncf-peshawar/index.html'), `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Announcing Cloud Native Peshawar</h1>
          <a href="/events/genesis/">Check our upcoming Genesis Meetup</a>
          <a href="/about/#organizers">Meet the team</a>
          <a href="https://ocgroups.dev/cncf/group/6vwk2n4">OCG Portal</a>
        </body>
        </html>
      `, 'utf-8');

      // Run link checker on full graph
      const report = verifyStaticLinks(tempDir);
      assert.equal(report.brokenLinks.length, 0, `Entire site graph must have 0 broken links. Found: ${JSON.stringify(report.brokenLinks)}`);
      assert.ok(report.totalLinks >= 15, 'Must verify all internal, anchor, asset, and external links');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SCENARIO 4: Idempotent Multi-Pass Continuous Sync
  // =====================================================================
  suite.group('Scenario 4: Idempotent Multi-Pass Continuous Sync');

  await suite.test('S4: Idempotent Continuous Sync across 3 successive passes with organizer manual overrides', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 's4-idempotent-sync-'));
    try {
      const eventsDir = path.join(tempDir, 'src/content/events');
      fs.mkdirSync(eventsDir, { recursive: true });

      // Pass 1: Initial Sync from upcoming fixture
      const pass1 = await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir
      });
      assert.equal(pass1.created.length, 2, 'Pass 1 should create 2 events');

      const targetEventPath = path.join(eventsDir, '01-cncf-peshawar-genesis.md');
      assert.ok(fs.existsSync(targetEventPath));

      // Organizer manually enriches event with slides, recording, coverImage, and detailed markdown notes
      const initialFm = extractFrontmatter(fs.readFileSync(targetEventPath, 'utf-8')).frontmatter;
      const customBody = `
## Preparation Guidelines for Attendees
1. Bring your laptop with Docker Desktop or Minikube installed.
2. Clone repository: \`git clone https://github.com/Cloud-Native-Peshawar/genesis-workshop.git\`.

### Workshop Leads
- Syed Hassan Tayyab
`;
      const enrichedEvent = `---
title: "CNCF Peshawar Genesis (Inaugural Meetup)"
date: "${initialFm.date}"
time: "${initialFm.time}"
venue: "National Incubation Center (NIC) Peshawar - Main Auditorium"
location: "Peshawar, KPK, Pakistan"
status: "upcoming"
capacity: ${initialFm.capacity}
rsvpUrl: "${initialFm.rsvpUrl}"
lumaUrl: "${initialFm.lumaUrl}"
slidesUrl: "https://speakerdeck.com/cncfpeshawar/genesis-deck"
recordingUrl: "https://youtube.com/watch?v=genesis-full-recording"
coverImage: "/assets/genesis-official-cover.webp"
speakers:
  - "Syed Hassan Tayyab"
tags:
  - "Genesis"
  - "OfficialLaunch"
  - "Kubernetes"
summary: "Inaugural community meetup with deep technical sessions on Cloud Native architectures."
---
${customBody}`;
      fs.writeFileSync(targetEventPath, enrichedEvent, 'utf-8');

      // Pass 2: Continuous Sync run against same source
      const pass2 = await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir
      });
      assert.ok(pass2.success);

      // Verify that Pass 2 preserved all organizer overrides and body
      const pass2Content = fs.readFileSync(targetEventPath, 'utf-8');
      const { frontmatter: pass2Fm, body: pass2Body } = extractFrontmatter(pass2Content);

      assert.equal(pass2Fm.title, 'CNCF Peshawar Genesis (Inaugural Meetup)', 'Manual title override preserved');
      assert.equal(pass2Fm.venue, 'National Incubation Center (NIC) Peshawar - Main Auditorium', 'Manual venue preserved');
      assert.equal(pass2Fm.slidesUrl, 'https://speakerdeck.com/cncfpeshawar/genesis-deck', 'Manual slidesUrl preserved');
      assert.equal(pass2Fm.recordingUrl, 'https://youtube.com/watch?v=genesis-full-recording', 'Manual recordingUrl preserved');
      assert.equal(pass2Fm.coverImage, '/assets/genesis-official-cover.webp', 'Manual coverImage preserved');
      assert.ok(pass2Fm.tags.includes('OfficialLaunch'), 'Custom tag preserved');
      assert.ok(pass2Body.includes('Preparation Guidelines for Attendees'), 'Manual markdown body preserved');

      // Pass 3: Another sync run with no changes (idempotency check)
      const pass3 = await syncEvents({
        source: 'tests/fixtures/ocg-portal-upcoming.html',
        eventsDir
      });
      assert.ok(pass3.unchanged.includes('01-cncf-peshawar-genesis.md'), 'Pass 3 must report event as unchanged (0 diff)');

      const pass3Content = fs.readFileSync(targetEventPath, 'utf-8');
      assert.equal(pass3Content, pass2Content, 'Pass 3 file content must be byte-for-byte identical to Pass 2');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SCENARIO 5: High-Variability CFP Submissions Batch Triage
  // =====================================================================
  suite.group('Scenario 5: Batch CFP Triage with Diverse Formats');

  await suite.test('S5: Triages 4 Diverse CFP Submissions in Batch and Validates Schema & Unique Slugs', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 's5-batch-triage-'));
    try {
      const fixtures = [
        {
          file: 'tests/fixtures/cfp-issue-valid-full.md',
          title: '[CFP] Multi-Agent Systems on K8s',
          number: 51,
          expectedName: 'Syed Hassan Tayyab',
          expectedSlug: 'syed-hassan-tayyab'
        },
        {
          file: 'tests/fixtures/cfp-issue-minimal.md',
          title: '[CFP] K8s Pod Lifecycle',
          number: 52,
          expectedName: 'Zainab Khan',
          expectedSlug: 'zainab-khan'
        },
        {
          file: 'tests/fixtures/cfp-issue-social-variations.md',
          title: '[CFP] OpenTelemetry Workshop',
          number: 53,
          expectedName: 'Dr. Bilal Tariq',
          expectedSlug: 'dr-bilal-tariq'
        },
        {
          file: 'tests/fixtures/cfp-issue-formatting-quirks.md',
          title: '[CFP] Production GitOps at Scale',
          number: 54,
          expectedName: 'Ahmad Ali',
          expectedSlug: 'ahmad-ali'
        }
      ];

      const results = [];
      for (const item of fixtures) {
        const body = fs.readFileSync(item.file, 'utf-8');
        const res = await parseCfpIssue({
          issueBody: body,
          issueTitle: item.title,
          issueNumber: item.number,
          baseDir: tempDir,
          dryRun: false
        });
        results.push(res);
      }

      // Verify all 4 results
      assert.equal(results.length, 4);
      for (let i = 0; i < 4; i++) {
        assert.equal(results[i].speaker_name, fixtures[i].expectedName);
        assert.equal(results[i].speaker_slug, fixtures[i].expectedSlug);
        assert.equal(results[i].branch_name, `cfp/issue-${fixtures[i].number}-${fixtures[i].expectedSlug}`);
      }

      // Verify all speaker files on disk
      const speakersDir = path.join(tempDir, 'src/content/speakers');
      const speakerFiles = fs.readdirSync(speakersDir);
      assert.equal(speakerFiles.length, 4);

      for (const sf of speakerFiles) {
        const content = fs.readFileSync(path.join(speakersDir, sf), 'utf-8');
        const { frontmatter } = extractFrontmatter(content);
        const val = validateSpeakerFrontmatter(frontmatter);
        assert.ok(val.success, `Speaker ${sf} schema error: ${JSON.stringify(val.error?.format())}`);
      }

      // Verify all event draft files on disk
      const eventsDir = path.join(tempDir, 'src/content/events');
      const eventFiles = fs.readdirSync(eventsDir);
      assert.equal(eventFiles.length, 4);

      for (const ef of eventFiles) {
        const content = fs.readFileSync(path.join(eventsDir, ef), 'utf-8');
        const { frontmatter } = extractFrontmatter(content);
        const val = validateEventFrontmatter(frontmatter);
        assert.ok(val.success, `Event draft ${ef} schema error: ${JSON.stringify(val.error?.format())}`);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SCENARIO 6: Event Cancellation Workflow
  // =====================================================================
  suite.group('Scenario 6: Emergency Event Cancellation Workflow');

  await suite.test('S6: Syncs Canceled Event from OCG Portal, Updates Tags & Summary, and Confirms Schema Conformance', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 's6-cancellation-'));
    try {
      const eventsDir = path.join(tempDir, 'src/content/events');
      fs.mkdirSync(eventsDir, { recursive: true });

      const syncResult = await syncEvents({
        source: 'tests/fixtures/ocg-portal-canceled.html',
        eventsDir
      });

      assert.ok(syncResult.success);
      assert.equal(syncResult.created.length, 1);

      const eventPath = path.join(eventsDir, syncResult.created[0]);
      const { frontmatter, body } = extractFrontmatter(fs.readFileSync(eventPath, 'utf-8'));

      assert.ok(validateEventFrontmatter(frontmatter).success, 'Canceled event must satisfy EventSchema');
      assert.ok(frontmatter.title.includes('[CANCELED]'), 'Title must reflect cancellation');
      assert.ok(frontmatter.summary.toLowerCase().includes('cancel') || frontmatter.summary.toLowerCase().includes('rescheduled'), 'Summary must reflect status');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  suite.printResults();
  return suite.getSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTier4Suite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}
