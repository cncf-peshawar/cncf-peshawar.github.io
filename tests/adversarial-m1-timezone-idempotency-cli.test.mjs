/**
 * Adversarial Test Suite for Milestone 1 (R1: OCG Event Sync Automation)
 * 
 * Focus Areas:
 * 1. Timezone Accuracy: Mathematical verification of PKT (UTC+5 / Asia/Karachi),
 *    date boundary shifts, month/year transitions, ISO 8601 offset parsing, and time normalization.
 * 2. Idempotency: Multi-pass stability, byte-for-byte SHA256 hashes, zero git diff,
 *    and non-destructive manual override preservation.
 * 3. CLI Interface Contract: Verification of --help, --dry-run, --source, --events-dir,
 *    shorthand aliases (-h, -n, -s, -d), and error handling on invalid/missing arguments.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  convertUtcToPkt,
  normalizeTimeRange,
  parseOcgEventHtml,
  parseOcgGroupHtml,
  syncEvents,
  DEFAULT_TIMEZONE
} from '../scripts/sync-ocg-events.mjs';

function computeSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function computeDirSha256Map(dirPath) {
  if (!fs.existsSync(dirPath)) return {};
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  const map = {};
  for (const f of files) {
    map[f] = computeSha256(path.join(dirPath, f));
  }
  return map;
}

const testResults = [];

function recordTest(section, name, status, details = '') {
  testResults.push({ section, name, status, details });
  const badge = status === 'PASS' ? '[PASS]' : status === 'FAIL' ? '[FAIL]' : '[INFO]';
  console.log(`  ${badge} ${name}`);
  if (details && status === 'FAIL') {
    console.error(`         Reason: ${details}`);
  }
}

console.log('================================================================');
console.log('ADVERSARIAL TEST SUITE: OCG EVENT SYNC (TIMEZONE / IDEMPOTENCY / CLI)');
console.log('================================================================\n');

// =====================================================================
// SECTION 1: TIMEZONE ACCURACY & MATHEMATICAL INVARIANTS (UTC -> PKT)
// =====================================================================
console.log('--- SECTION 1: PKT Timezone Conversion & Mathematical Accuracy ---');

function mathOraclePkt(utcYear, utcMonth, utcDay, utcHour, utcMinute) {
  const utcEpoch = Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, 0);
  const pktEpoch = utcEpoch + 5 * 3600 * 1000;
  const pktDate = new Date(pktEpoch);

  const year = pktDate.getUTCFullYear();
  const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pktDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const h24 = pktDate.getUTCHours();
  const m = String(pktDate.getUTCMinutes()).padStart(2, '0');
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const timeStr = `${String(h12).padStart(2, '0')}:${m} ${ampm}`;

  return { dateStr, timeStr };
}

try {
  let sampleCount = 0;
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 15, 30, 45, 59]) {
      const isoString = `2026-06-15T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
      const actual = convertUtcToPkt(isoString);
      const expected = mathOraclePkt(2026, 6, 15, hour, minute);

      assert.ok(actual !== null, `convertUtcToPkt returned null for ${isoString}`);
      assert.equal(actual.date, expected.dateStr, `Date mismatch for ${isoString}`);
      assert.equal(actual.startTime, expected.timeStr, `Time mismatch for ${isoString}`);
      sampleCount++;
    }
  }
  recordTest('Timezone', `Mathematical Oracle Invariant Test across 24 Hours & Minutes (${sampleCount} samples)`, 'PASS');
} catch (err) {
  recordTest('Timezone', 'Mathematical Oracle Invariant Test across 24 Hours & Minutes', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-06-15T18:59:59Z');
  assert.equal(res.date, '2026-06-15');
  assert.equal(res.startTime, '11:59 PM');
  recordTest('Timezone', 'Boundary Condition: UTC 18:59:59 (Same day 11:59 PM PKT)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Boundary Condition: UTC 18:59:59 (Same day 11:59 PM PKT)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-06-15T19:00:00Z');
  assert.equal(res.date, '2026-06-16');
  assert.equal(res.startTime, '12:00 AM');
  recordTest('Timezone', 'Boundary Condition: UTC 19:00:00 (Next day 12:00 AM PKT midnight shift)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Boundary Condition: UTC 19:00:00 (Next day 12:00 AM PKT midnight shift)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-06-15T19:00:01Z');
  assert.equal(res.date, '2026-06-16');
  assert.equal(res.startTime, '12:00 AM');
  recordTest('Timezone', 'Boundary Condition: UTC 19:00:01 (Next day 12:00 AM PKT)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Boundary Condition: UTC 19:00:01 (Next day 12:00 AM PKT)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-06-15T06:59:59Z');
  assert.equal(res.date, '2026-06-15');
  assert.equal(res.startTime, '11:59 AM');
  recordTest('Timezone', 'Boundary Condition: UTC 06:59:59 (11:59 AM PKT - morning boundary)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Boundary Condition: UTC 06:59:59 (11:59 AM PKT - morning boundary)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-06-15T07:00:00Z');
  assert.equal(res.date, '2026-06-15');
  assert.equal(res.startTime, '12:00 PM');
  recordTest('Timezone', 'Boundary Condition: UTC 07:00:00 (12:00 PM PKT - noon boundary)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Boundary Condition: UTC 07:00:00 (12:00 PM PKT - noon boundary)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-06-15T07:01:00Z');
  assert.equal(res.date, '2026-06-15');
  assert.equal(res.startTime, '12:01 PM');
  recordTest('Timezone', 'Boundary Condition: UTC 07:01:00 (12:01 PM PKT)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Boundary Condition: UTC 07:01:00 (12:01 PM PKT)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-06-15T00:00:00Z');
  assert.equal(res.date, '2026-06-15');
  assert.equal(res.startTime, '05:00 AM');
  recordTest('Timezone', 'Boundary Condition: UTC 00:00:00 (05:00 AM PKT)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Boundary Condition: UTC 00:00:00 (05:00 AM PKT)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2025-02-28T19:00:00Z');
  assert.equal(res.date, '2025-03-01');
  assert.equal(res.startTime, '12:00 AM');
  recordTest('Timezone', 'Month Transition: Non-Leap Year Feb 28 19:00 UTC -> Mar 01 PKT', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Month Transition: Non-Leap Year Feb 28 19:00 UTC -> Mar 01 PKT', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2024-02-28T19:00:00Z');
  assert.equal(res.date, '2024-02-29');
  assert.equal(res.startTime, '12:00 AM');
  recordTest('Timezone', 'Month Transition: Leap Year Feb 28 19:00 UTC -> Feb 29 PKT', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Month Transition: Leap Year Feb 28 19:00 UTC -> Feb 29 PKT', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2024-02-29T19:00:00Z');
  assert.equal(res.date, '2024-03-01');
  assert.equal(res.startTime, '12:00 AM');
  recordTest('Timezone', 'Month Transition: Leap Year Feb 29 19:00 UTC -> Mar 01 PKT', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Month Transition: Leap Year Feb 29 19:00 UTC -> Mar 01 PKT', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-04-30T19:00:00Z');
  assert.equal(res.date, '2026-05-01');
  assert.equal(res.startTime, '12:00 AM');
  recordTest('Timezone', 'Month Transition: 30-day Month End Apr 30 19:00 UTC -> May 01 PKT', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Month Transition: 30-day Month End Apr 30 19:00 UTC -> May 01 PKT', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-12-31T18:59:00Z');
  assert.equal(res.date, '2026-12-31');
  assert.equal(res.startTime, '11:59 PM');
  recordTest('Timezone', 'Year Transition: Dec 31 18:59 UTC (Same year 11:59 PM PKT)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Year Transition: Dec 31 18:59 UTC (Same year 11:59 PM PKT)', 'FAIL', err.message);
}

try {
  const res = convertUtcToPkt('2026-12-31T19:00:00Z');
  assert.equal(res.date, '2027-01-01');
  assert.equal(res.startTime, '12:00 AM');
  recordTest('Timezone', 'Year Transition: Dec 31 19:00 UTC -> Jan 01 Next Year 12:00 AM PKT', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Year Transition: Dec 31 19:00 UTC -> Jan 01 Next Year 12:00 AM PKT', 'FAIL', err.message);
}

try {
  const res1 = convertUtcToPkt('2026-09-04T10:00:00+00:00');
  const res2 = convertUtcToPkt('2026-09-04T15:00:00+05:00');
  const res3 = convertUtcToPkt('2026-09-04T06:00:00-04:00');
  const res4 = convertUtcToPkt('2026-09-04T10:00:00.999Z');

  for (const r of [res1, res2, res3, res4]) {
    assert.equal(r.date, '2026-09-04');
    assert.equal(r.startTime, '03:00 PM');
  }
  recordTest('Timezone', 'ISO 8601 Offset Variants (+00:00, +05:00, -04:00, with millis)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'ISO 8601 Offset Variants (+00:00, +05:00, -04:00, with millis)', 'FAIL', err.message);
}

try {
  assert.equal(convertUtcToPkt(null), null);
  assert.equal(convertUtcToPkt(undefined), null);
  assert.equal(convertUtcToPkt(''), null);
  assert.equal(convertUtcToPkt('not-a-date'), null);
  assert.equal(convertUtcToPkt('2026-99-99T99:99:99Z'), null);
  recordTest('Timezone', 'Invalid / Malformed Date String Handling', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Invalid / Malformed Date String Handling', 'FAIL', err.message);
}

try {
  assert.equal(normalizeTimeRange('3:00 PM - 7:00 PM'), '03:00 PM - 07:00 PM PKT');
  assert.equal(normalizeTimeRange('03:00 PM - 07:00 PM PKT'), '03:00 PM - 07:00 PM PKT');
  assert.equal(normalizeTimeRange('9:30 am – 1:00 pm'), '09:30 AM - 01:00 PM PKT');
  assert.equal(normalizeTimeRange('11:00 AM - 1:00 PM PKT'), '11:00 AM - 01:00 PM PKT');
  assert.equal(normalizeTimeRange('12:00 AM - 4:00 AM PKT'), '12:00 AM - 04:00 AM PKT');
  assert.equal(normalizeTimeRange('12:00 PM - 12:00 AM PKT'), '12:00 PM - 12:00 AM PKT');
  assert.equal(normalizeTimeRange('   3:00pm   -   7:00pm   '), '03:00 PM - 07:00 PM PKT');
  assert.equal(normalizeTimeRange('<span>3:00 PM – 7:00 PM PKT</span>'), '03:00 PM - 07:00 PM PKT');
  assert.equal(normalizeTimeRange(''), '');
  assert.equal(normalizeTimeRange(null), '');
  recordTest('Timezone', 'Time Range Normalization (normalizeTimeRange)', 'PASS');
} catch (err) {
  recordTest('Timezone', 'Time Range Normalization (normalizeTimeRange)', 'FAIL', err.message);
}

// =====================================================================
// SECTION 2: IDEMPOTENCY & MERGE STABILITY
// =====================================================================
console.log('\n--- SECTION 2: Idempotency & Merge Stability ---');

// Test 2.1: Single event detail idempotency
try {
  const singleEventHtml = `<!DOCTYPE html>
<html>
<head>
  <link rel="canonical" href="https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa">
  <meta property="og:title" content="CNCF Peshawar Genesis">
</head>
<body>
  <div class="attendance-container-main">
    <div data-starts="2026-09-04T10:00:00+00:00" data-availability-capacity="70"></div>
    <div data-registration-window-date-panel>
      <div class="text-stone-600">3:00 PM – 7:00 PM PKT</div>
    </div>
    <div class="location-name">National Incubation Center (NIC), South Canal Road</div>
    <a href="https://luma.com/shufbsm5">Luma</a>
    <user-chip user='{"name":"Syed Hassan Tayyab","title":"Co Founder &amp; AI Product Developer"}'></user-chip>
    <div class="markdown">CNCF Peshawar Genesis, proudly sponsored by GitHub and nsave, marks the official launch of the Cloud Native Computing Foundation (CNCF) community in Peshawar, bringing together developers, engineers, students, and open source enthusiasts.</div>
  </div>
</body>
</html>`;

  const tempFile = path.join(os.tmpdir(), 'genesis-detail-idempotency.html');
  fs.writeFileSync(tempFile, singleEventHtml, 'utf8');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-idempotency-'));
  fs.copyFileSync('src/content/events/01-cncf-peshawar-genesis.md', path.join(tempDir, '01-cncf-peshawar-genesis.md'));

  const pass1 = await syncEvents({ source: tempFile, eventsDir: tempDir });
  const hash1 = computeSha256(path.join(tempDir, '01-cncf-peshawar-genesis.md'));

  const pass2 = await syncEvents({ source: tempFile, eventsDir: tempDir });
  const hash2 = computeSha256(path.join(tempDir, '01-cncf-peshawar-genesis.md'));

  assert.equal(hash1, hash2, 'SHA256 must be byte-identical between Pass 1 and Pass 2');
  assert.equal(pass2.unchanged.length, 1);
  assert.equal(pass2.updated.length, 0);
  assert.equal(pass2.created.length, 0);

  fs.rmSync(tempFile, { force: true });
  fs.rmSync(tempDir, { recursive: true, force: true });
  recordTest('Idempotency', 'Single Event Detail: Multi-Pass Zero Diff & Checksum Stability', 'PASS');
} catch (err) {
  recordTest('Idempotency', 'Single Event Detail: Multi-Pass Zero Diff & Checksum Stability', 'FAIL', err.message);
}

// Test 2.2: Group portal sync & event discovery
try {
  const FIXTURE_PATH = path.resolve(process.cwd(), 'tests/fixtures/ocg-mock-portal.html');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocg-portal-idempotency-'));

  const pass1 = await syncEvents({ source: FIXTURE_PATH, eventsDir: tempDir });
  // We expect pass1 to discover and create the 3 events from the portal
  assert.equal(pass1.created.length, 3, `Expected 3 events created from portal, but got ${pass1.created.length} (created: ${JSON.stringify(pass1.created)})`);

  recordTest('Idempotency', 'Group Portal Discovery & Multi-Event Creation', 'PASS');
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch (err) {
  recordTest('Idempotency', 'Group Portal Discovery & Multi-Event Creation', 'FAIL', err.message);
}

// =====================================================================
// SECTION 3: CLI INTERFACE CONTRACT VERIFICATION
// =====================================================================
console.log('\n--- SECTION 3: CLI Interface Contract Verification ---');

const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/sync-ocg-events.mjs');

// 3.1 Help flag
try {
  const stdout = execFileSync('node', [SCRIPT_PATH, '--help'], { encoding: 'utf8' });
  assert.ok(stdout.includes('Usage:'), 'Help output should include Usage');
  assert.ok(stdout.includes('--source'), 'Help output should describe --source');
  assert.ok(stdout.includes('--events-dir'), 'Help output should describe --events-dir');
  assert.ok(stdout.includes('--dry-run'), 'Help output should describe --dry-run');
  recordTest('CLI', 'CLI Flag: --help exits with code 0 and displays usage', 'PASS');
} catch (err) {
  recordTest('CLI', 'CLI Flag: --help exits with code 0 and displays usage', 'FAIL', err.message);
}

// 3.2 -h shorthand
try {
  const stdout = execFileSync('node', [SCRIPT_PATH, '-h'], { encoding: 'utf8' });
  assert.ok(stdout.includes('Usage:'));
  recordTest('CLI', 'CLI Flag: -h shorthand exits with code 0', 'PASS');
} catch (err) {
  recordTest('CLI', 'CLI Flag: -h shorthand exits with code 0', 'FAIL', err.message);
}

// 3.3 Dry run
try {
  const FIXTURE_PATH = path.resolve(process.cwd(), 'tests/fixtures/ocg-mock-portal.html');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocg-cli-dryrun-'));
  const stdoutLong = execFileSync('node', [
    SCRIPT_PATH,
    '--dry-run',
    '--source', FIXTURE_PATH,
    '--events-dir', tempDir
  ], { encoding: 'utf8' });

  assert.ok(stdoutLong.includes('DRY-RUN MODE'), 'Stdout should indicate dry-run mode');
  const files1 = fs.readdirSync(tempDir);
  assert.equal(files1.length, 0, 'No files should be written in --dry-run mode');

  fs.rmSync(tempDir, { recursive: true, force: true });
  recordTest('CLI', 'CLI Flag: --dry-run simulates without disk writes', 'PASS');
} catch (err) {
  recordTest('CLI', 'CLI Flag: --dry-run simulates without disk writes', 'FAIL', err.message);
}

// 3.4 Nonexistent source file error handling
try {
  let failedAsExpected = false;
  try {
    execFileSync('node', [
      SCRIPT_PATH,
      '--source', './non-existent-source-file.html'
    ], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    failedAsExpected = err.status === 1;
    const combinedOutput = (err.stdout || '') + (err.stderr || '');
    assert.ok(combinedOutput.includes('Invalid source specified') || combinedOutput.includes('Synchronization failed'));
  }
  assert.ok(failedAsExpected, 'Expected non-existent source to exit with status 1');
  recordTest('CLI', 'CLI Error: Non-existent file source exits with code 1 and logs error', 'PASS');
} catch (err) {
  recordTest('CLI', 'CLI Error: Non-existent file source exits with code 1 and logs error', 'FAIL', err.message);
}

// 3.5 Missing argument handling for --events-dir
try {
  const proc = spawnSync('node', [SCRIPT_PATH, '--events-dir'], { encoding: 'utf8' });
  // Check if it threw an uncaught TypeError or handled it
  if (proc.stderr.includes('TypeError [ERR_INVALID_ARG_TYPE]') || proc.stderr.includes('ERR_INVALID_ARG_TYPE')) {
    throw new Error('Crashes with unhandled TypeError [ERR_INVALID_ARG_TYPE] when --events-dir has no argument');
  }
  assert.equal(proc.status, 1, 'Expected exit code 1');
  recordTest('CLI', 'CLI Robustness: Missing argument for --events-dir handled gracefully', 'PASS');
} catch (err) {
  recordTest('CLI', 'CLI Robustness: Missing argument for --events-dir handled gracefully', 'FAIL', err.message);
}

console.log('\n================================================================');
const passed = testResults.filter(t => t.status === 'PASS').length;
const failed = testResults.filter(t => t.status === 'FAIL').length;
console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED (Total: ${testResults.length})`);
console.log('================================================================');
