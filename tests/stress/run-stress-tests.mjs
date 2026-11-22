import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { z } from 'astro/zod';
import {
  parseOcgEventHtml,
  parseOcgGroupHtml,
  syncEvents,
  stringifyFrontmatter,
  slugify,
  convertUtcToPkt,
  normalizeTimeRange,
  parseUserChips,
  loadExistingEvents
} from '../../scripts/sync-ocg-events.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const scratchDir = path.join(__dirname, 'scratch_events');

// Astro Event Schema from src/content/config.ts
const eventSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(1),
  venue: z.string().min(1),
  location: z.string().default('Peshawar, KPK, Pakistan'),
  status: z.enum(['upcoming', 'completed']).default('upcoming'),
  capacity: z.number().optional(),
  rsvpUrl: z.string().url(),
  lumaUrl: z.string().url().optional(),
  slidesUrl: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),
  coverImage: z.string().optional(),
  speakers: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  summary: z.string().min(1)
});

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error('  ❌ FAIL: ' + message);
    throw new Error(message);
  } else {
    passedTests++;
    console.log('  ✅ PASS: ' + message);
  }
}

function resetScratchDir() {
  if (fs.existsSync(scratchDir)) {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }
  fs.mkdirSync(scratchDir, { recursive: true });
}

async function runAllTests() {
  console.log('======================================================================');
  console.log('🚀 RUNNING EMPIRICAL ADVERSARIAL STRESS TEST SUITE FOR M1 EVENT SYNC');
  console.log('======================================================================\n');

  // TEST 1: Malformed & Unclosed HTML
  console.log('[TEST GROUP 1] Malformed & Cutoff HTML Fixtures');
  {
    resetScratchDir();
    const fixturePath = path.join(fixturesDir, '01_malformed_unclosed.html');
    const html = fs.readFileSync(fixturePath, 'utf8');
    
    let parsed;
    try {
      parsed = parseOcgEventHtml(html, 'https://ocgroups.dev/cncf/group/6vwk2n4/event/malformed1');
    } catch (e) {
      assert(false, 'parseOcgEventHtml crashed on malformed HTML: ' + e.message);
    }

    assert(parsed !== null, 'parseOcgEventHtml returned non-null object on truncated HTML');
    assert(parsed.title.includes('Malformed Event'), 'Title extracted despite cutoff HTML: ' + parsed.title);
    assert(parsed.capacity === 120, 'Capacity extracted: ' + parsed.capacity);
    assert(parsed.rsvpUrl === 'https://ocgroups.dev/cncf/group/6vwk2n4/event/malformed1', 'RSVP URL preserved');
    
    // Sync execution
    const syncRes = await syncEvents({ source: fixturePath, eventsDir: scratchDir });
    assert(syncRes.success === true, 'syncEvents completed successfully with malformed fixture');
    assert(syncRes.created.length === 1, '1 event file created in scratch: ' + syncRes.created[0]);
    
    const createdFilePath = path.join(scratchDir, syncRes.created[0]);
    const fileContent = fs.readFileSync(createdFilePath, 'utf8');
    const fmMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    assert(fmMatch !== null, 'Created file has valid YAML frontmatter delimiters');
    const parsedFm = YAML.parse(fmMatch[1]);
    const validated = eventSchema.safeParse(parsedFm);
    assert(validated.success, 'Frontmatter validates against Astro Zod Schema: ' + JSON.stringify(validated.error?.format() || {}));
  }

  // TEST 2: Missing Starts, Missing User-Chips, Invalid Timestamps
  console.log('\n[TEST GROUP 2] Missing Attributes & Corrupted Timestamps');
  {
    resetScratchDir();
    const fixturePath = path.join(fixturesDir, '02_missing_invalid_timestamps.html');
    const html = fs.readFileSync(fixturePath, 'utf8');
    
    const parsed = parseOcgEventHtml(html, 'https://ocgroups.dev/cncf/group/6vwk2n4/event/missing-attrs-99');
    assert(parsed !== null, 'parseOcgEventHtml handles missing starts and corrupt timestamps');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(parsed.date), 'Fallback date is valid YYYY-MM-DD: ' + parsed.date);
    assert(parsed.time.length > 0, 'Fallback time assigned: ' + parsed.time);
    assert(Array.isArray(parsed.speakers) && parsed.speakers.length === 0, 'Speakers gracefully empty array');
    
    const syncRes = await syncEvents({ source: fixturePath, eventsDir: scratchDir });
    assert(syncRes.success === true, 'syncEvents successfully ran on missing attributes fixture');
    const createdFilePath = path.join(scratchDir, syncRes.created[0]);
    const fileContent = fs.readFileSync(createdFilePath, 'utf8');
    const fmMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const parsedFm = YAML.parse(fmMatch[1]);
    const validated = eventSchema.safeParse(parsedFm);
    assert(validated.success, 'Missing attribute event conforms to Astro Zod schema');
  }

  // TEST 3: Canceled Event Handling
  console.log('\n[TEST GROUP 3] Canceled Event Flagging & Tagging');
  {
    resetScratchDir();
    const fixturePath = path.join(fixturesDir, '03_canceled_event.html');
    const syncRes = await syncEvents({ source: fixturePath, eventsDir: scratchDir });
    assert(syncRes.success === true, 'syncEvents handled canceled event');
    
    const createdFilePath = path.join(scratchDir, syncRes.created[0]);
    const fileContent = fs.readFileSync(createdFilePath, 'utf8');
    const fmMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const parsedFm = YAML.parse(fmMatch[1]);
    
    assert(parsedFm.tags.includes('Canceled'), 'Tags include Canceled: ' + JSON.stringify(parsedFm.tags));
    assert(parsedFm.summary.startsWith('[CANCELED]'), 'Summary starts with [CANCELED]: ' + parsedFm.summary);
    assert(eventSchema.safeParse(parsedFm).success, 'Canceled event frontmatter passes Astro schema');
  }

  // TEST 4: Unicode, Emojis, RTL & Special Characters
  console.log('\n[TEST GROUP 4] Unicode, Emojis, RTL Pashto/Arabic & Special Character Escaping');
  {
    resetScratchDir();
    const fixturePath = path.join(fixturesDir, '04_unicode_emojis_rtl.html');
    const syncRes = await syncEvents({ source: fixturePath, eventsDir: scratchDir });
    assert(syncRes.success === true, 'syncEvents processed Unicode and emojis');
    
    const createdFilePath = path.join(scratchDir, syncRes.created[0]);
    const fileContent = fs.readFileSync(createdFilePath, 'utf8');
    const fmMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const parsedFm = YAML.parse(fmMatch[1]);
    
    assert(parsedFm.title.includes('🚀'), 'Emoji 🚀 preserved in title');
    assert(parsedFm.title.includes('پښور کلاوډ نیټیو'), 'Pashto RTL text preserved in title');
    assert(parsedFm.title.includes('<Deep Dive>'), 'Angle brackets preserved in title');
    assert(parsedFm.speakers.some(s => s.includes('میاں علی خان 🇵🇰')), 'Urdu speaker name with flag emoji preserved');
    assert(parsedFm.speakers.some(s => s.includes('Dr. Sara Müller-Öztürk')), 'German umlauts in speaker name preserved');
    assert(parsedFm.speakers.some(s => s.includes('"Agentic Systems"')), 'Escaped double quotes in speaker title preserved');
    assert(parsedFm.tags.includes('پښتو'), 'Pashto tag preserved');
    assert(parsedFm.lumaUrl === 'https://luma.com/cncf-peshawar-unicode-2026', 'Luma URL extracted');
    assert(parsedFm.slidesUrl === 'https://docs.google.com/presentation/d/12345/edit', 'Slides URL extracted');
    assert(parsedFm.recordingUrl === 'https://youtube.com/watch?v=peshawar123', 'YouTube Recording URL extracted');
    
    const validated = eventSchema.safeParse(parsedFm);
    assert(validated.success, 'Unicode frontmatter passes Zod schema: ' + JSON.stringify(validated.error?.format() || {}));
  }

  // TEST 5: Multi-Event Group Portal Parsing
  console.log('\n[TEST GROUP 5] Multi-Event Group Page Scraper');
  {
    resetScratchDir();
    const fixturePath = path.join(fixturesDir, '05_multi_event_group_page.html');
    const syncRes = await syncEvents({ source: fixturePath, eventsDir: scratchDir });
    assert(syncRes.success === true, 'syncEvents successfully processed group page');
    assert(syncRes.created.length === 3, 'Created exactly 3 events from group page: ' + JSON.stringify(syncRes.created));
    
    const event1Path = path.join(scratchDir, syncRes.created[0]);
    const event2Path = path.join(scratchDir, syncRes.created[1]);
    const event3Path = path.join(scratchDir, syncRes.created[2]);
    
    const fm1 = YAML.parse(fs.readFileSync(event1Path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
    const fm2 = YAML.parse(fs.readFileSync(event2Path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
    const fm3 = YAML.parse(fs.readFileSync(event3Path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
    
    assert(fm1.title.includes('Event One: Cloud Native Microservices Architecture'), 'Event 1 title match');
    assert(fm1.lumaUrl === 'https://luma.com/cncf-pwr-event-1', 'Event 1 Luma URL match');
    assert(fm2.title.includes('Event Two: Cilium & eBPF Deep Dive'), 'Event 2 title match');
    assert(fm2.status === 'completed', 'Past event (April 2026) status correctly set to completed: ' + fm2.status);
    assert(fm2.slidesUrl === 'https://speakerdeck.com/ahmad/ebpf-cncf', 'Event 2 slides URL match');
    assert(fm2.recordingUrl === 'https://youtu.be/ebpf12345', 'Event 2 recording URL match');
    assert(fm3.tags.includes('Canceled'), 'Event 3 canceled tag match');
  }

  // TEST 6: Non-Destructive Merging & Complex Markdown Body Preservation Stress Test
  console.log('\n[TEST GROUP 6] Non-Destructive Merger & Markdown Body Delimiter Stress Test');
  {
    resetScratchDir();
    
    // Create an existing synthetic file with complex markdown body containing YAML delimiters inside code blocks
    const initialFrontmatter = {
      title: 'Genesis Community Kickoff (Manual Override Title)',
      date: '2026-09-04',
      time: '03:00 PM - 07:00 PM PKT',
      venue: 'National Incubation Center (NIC), Peshawar',
      location: 'Peshawar, KPK, Pakistan',
      status: 'upcoming',
      capacity: 100,
      rsvpUrl: 'https://ocgroups.dev/cncf/group/6vwk2n4/event/genesis-merge-test',
      coverImage: '/images/custom-manual-banner.webp',
      speakers: ['Initial Manual Speaker (Lead Dev)'],
      tags: ['Genesis', 'CustomManualTag'],
      summary: 'Manually curated event summary that must NEVER be overwritten.'
    };

    const complexMarkdownBody = [
      '## Detailed Agenda & Schedule',
      '',
      '| Time | Session Topic | Speaker |',
      '|---|---|---|',
      '| 03:00 PM | Keynote & CNCF Peshawar Introduction | Team |',
      '| 03:45 PM | Kubernetes in Production | Guest |',
      '| 04:30 PM | Hands-on Agentic AI Lab | Lead |',
      '',
      '---',
      '',
      '### Sample Configuration Files',
      '',
      'Here is an example Kubernetes manifest:',
      '',
      '```yaml',
      '---',
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: cncf-peshawar-demo',
      'spec:',
      '  replicas: 3',
      '  template:',
      '    metadata:',
      '      labels:',
      '        app: demo',
      '---',
      'apiVersion: v1',
      'kind: Service',
      'metadata:',
      '  name: demo-svc',
      '```',
      '',
      '### Raw HTML & Mathematical Formula',
      '',
      '<div class="custom-callout">',
      '  <strong>Important Note:</strong> Please bring your laptops!',
      '</div>',
      '',
      '---',
      '',
      '### Final Notes',
      'All attendees must agree to the CNCF Code of Conduct.'
    ].join('\n');

    const initialFileContent = stringifyFrontmatter(initialFrontmatter) + '\n\n' + complexMarkdownBody + '\n';
    const eventFileName = '01-genesis-merge-test.md';
    const eventFilePath = path.join(scratchDir, eventFileName);
    fs.writeFileSync(eventFilePath, initialFileContent, 'utf8');

    // Now create an incoming OCG event fixture that updates this same event
    const incomingOcgHtml = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="CNCF Peshawar Genesis Kickoff (OCG Upstream Title)">
  <link rel="canonical" href="https://ocgroups.dev/cncf/group/6vwk2n4/event/genesis-merge-test">
</head>
<body>
  <div class="attendance-container-main">
    <div data-starts="2026-09-04T10:00:00+00:00" data-availability-capacity="120">
      <user-chip user='{"name": "Syed Hassan Tayyab", "title": "AI Product Developer"}'></user-chip>
      <user-chip user='{"name": "Initial Manual Speaker", "title": "Lead Dev"}'></user-chip>
    </div>
    <a href="https://luma.com/genesis-merge-luma">Luma Link</a>
    <a href="https://speakerdeck.com/peshawar/genesis">Slides Link</a>
    <div>Tags</div>
    <div>
      <span>Kubernetes</span>
      <span>CloudNative</span>
    </div>
    <div class="markdown">OCG upstream auto-generated description.</div>
  </div>
</body>
</html>`;

    const fixtureFile = path.join(fixturesDir, '06_incoming_merge.html');
    fs.writeFileSync(fixtureFile, incomingOcgHtml, 'utf8');

    // Run sync against existing directory
    const syncRes = await syncEvents({ source: fixtureFile, eventsDir: scratchDir });
    assert(syncRes.success === true, 'syncEvents executed merge successfully');
    assert(syncRes.updated.includes(eventFileName), 'Event file ' + eventFileName + ' marked as updated');
    assert(syncRes.created.length === 0, 'No duplicate file created');

    // Inspect the updated file on disk
    const updatedFileContent = fs.readFileSync(eventFilePath, 'utf8');
    const updatedMatch = updatedFileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    assert(updatedMatch !== null, 'Updated file has valid YAML frontmatter');

    const updatedFm = YAML.parse(updatedMatch[1]);
    const updatedBody = updatedMatch[2].trim();

    // 1. Verify frontmatter preserves manual fields
    assert(updatedFm.title === 'Genesis Community Kickoff (Manual Override Title)', 'Manual title override preserved');
    assert(updatedFm.coverImage === '/images/custom-manual-banner.webp', 'Manual coverImage strictly preserved');
    assert(updatedFm.summary === 'Manually curated event summary that must NEVER be overwritten.', 'Manual summary preserved');
    
    // 2. Verify merged fields
    assert(updatedFm.capacity === 120, 'Capacity updated from OCG: ' + updatedFm.capacity);
    assert(updatedFm.lumaUrl === 'https://luma.com/genesis-merge-luma', 'Luma URL merged in');
    assert(updatedFm.slidesUrl === 'https://speakerdeck.com/peshawar/genesis', 'Slides URL merged in');
    assert(updatedFm.speakers.length === 2, 'Speakers merged without duplicates: ' + JSON.stringify(updatedFm.speakers));
    assert(updatedFm.speakers.includes('Initial Manual Speaker (Lead Dev)'), 'Original manual speaker preserved');
    assert(updatedFm.speakers.some(s => s.includes('Syed Hassan Tayyab')), 'New OCG speaker appended');
    assert(updatedFm.tags.includes('CustomManualTag'), 'Original manual tag preserved');
    assert(updatedFm.tags.includes('Kubernetes'), 'New OCG tag merged');

    // 3. Verify Astro Zod Schema Compliance
    const validated = eventSchema.safeParse(updatedFm);
    assert(validated.success, 'Merged frontmatter validates against Astro Zod Schema: ' + JSON.stringify(validated.error?.format() || {}));

    // 4. Verify STRICT MARKDOWN BODY PRESERVATION
    assert(updatedBody === complexMarkdownBody.trim(), 'Markdown body with tables, nested YAML code blocks, and horizontal rules is 100% PRESERVED byte-for-byte!');
  }

  // TEST 7: Idempotency & Unchanged Detection
  console.log('\n[TEST GROUP 7] Idempotency & Zero Diff Detection');
  {
    const fixtureFile = path.join(fixturesDir, '06_incoming_merge.html');
    const syncRes2 = await syncEvents({ source: fixtureFile, eventsDir: scratchDir });
    assert(syncRes2.success === true, 'Second sync completed');
    assert(syncRes2.unchanged.includes('01-genesis-merge-test.md'), 'Second sync recognized 0 diff and reported unchanged');
    assert(syncRes2.updated.length === 0, 'No files updated on second run');
    assert(syncRes2.created.length === 0, 'No files created on second run');
  }

  console.log('\n======================================================================');
  console.log('🎯 TEST SUMMARY: ' + passedTests + '/' + totalTests + ' assertions passed (' + failedTests + ' failed)');
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
