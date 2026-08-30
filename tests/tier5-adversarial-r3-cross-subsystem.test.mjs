/**
 * Tier 5 Adversarial Stress Test Suite: R3 Static Link Checker & Cross-Subsystem Integration
 * CNCF Peshawar Automation Suite
 *
 * Empirical validation of:
 * 1. Deeply nested directories & complex path structures in dist/
 * 2. Fragment anchors, unicode anchors, URL-encoded anchors, duplicate IDs, and uppercase tag variations
 * 3. Broken link detection accuracy, asset integrity, and ignored schemes
 * 4. Missing dist handling, empty directories, and CLI flag options
 * 5. Scale & performance stress testing (1,000+ links, large HTML files, anchor caching)
 * 6. Cross-subsystem end-to-end pipeline (OCG Sync -> CFP Parse -> Astro Check -> Astro Build -> Link Check)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkLinks,
  parseArgs,
  extractLinksFromHtml,
  extractElementIdentifiers,
  isExternalOrIgnored,
  resolveTargetFile
} from '../scripts/check-links.mjs';
import { syncEvents } from '../scripts/sync-ocg-events.mjs';
import { parseCfpIssue } from '../scripts/parse-cfp-issue.mjs';
import {
  TestHarness,
  runCommand,
  extractFrontmatter,
  validateEventFrontmatter,
  validateSpeakerFrontmatter
} from './test-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export async function runTier5AdversarialSuite() {
  const suite = new TestHarness('Tier 5 Adversarial Stress Testing: R3 & Cross-Subsystem E2E');

  // =====================================================================
  // SUITE 1: Deeply Nested Directories & Complex Path Structures
  // =====================================================================
  suite.group('1. Deeply Nested Directories & Complex Path Structures');

  await suite.test('T5.1.1: Resolves links across 10-level deeply nested directory hierarchies in dist', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-deep-nest-'));
    try {
      // Create dist/a/b/c/d/e/f/g/h/i/j/index.html
      const deepPath = path.join(tempDir, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');
      fs.mkdirSync(deepPath, { recursive: true });
      
      // Root file
      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>
          <a href="/a/b/c/d/e/f/g/h/i/j">Go to deep level (no slash)</a>
          <a href="/a/b/c/d/e/f/g/h/i/j/">Go to deep level (trailing slash)</a>
          <a href="a/b/c/d/e/f/g/h/i/j/index.html#deep-anchor">Go to deep anchor</a>
        </body></html>`
      );

      // Deep file
      fs.writeFileSync(
        path.join(deepPath, 'index.html'),
        `<!DOCTYPE html><html><body>
          <h1 id="deep-anchor">Deep Level 10</h1>
          <a href="../../../../../../../../../..">Back to Root via relative dots</a>
          <a href="/">Back to Root via absolute slash</a>
          <a href="../#parent-anchor">Up one level via parent relative dot</a>
          <a href="../../i#parent-anchor">Up one level via parent path</a>
        </body></html>`
      );

      // Level 9 (i) folder with index.html
      const level9Path = path.join(tempDir, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i');
      fs.writeFileSync(
        path.join(level9Path, 'index.html'),
        `<!DOCTYPE html><html><body><div id="parent-anchor">Level 9</div></body></html>`
      );

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, true, `Expected 0 broken links in deep hierarchy: ${JSON.stringify(result.brokenLinks)}`);
      assert.equal(result.brokenLinks.length, 0);
      assert.equal(result.htmlFilesCount, 3);
      assert.equal(result.totalChecked, 7);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T5.1.2: Handles clean URLs, relative dot-segments (./.././), and query strings', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-clean-urls-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'events'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'speakers'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'blog'), { recursive: true });

      fs.writeFileSync(path.join(tempDir, 'about.html'), `<html><body><h2 id="team">Team</h2></body></html>`);
      fs.writeFileSync(path.join(tempDir, 'events', 'index.html'), `<html><body><h1 id="upcoming">Upcoming</h1></body></html>`);
      fs.writeFileSync(path.join(tempDir, 'speakers', 'hassan.html'), `<html><body><div id="bio">Bio</div></body></html>`);

      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>
          <a href="/about">About Clean URL (.html fallback)</a>
          <a href="./about.html#team">About Anchor</a>
          <a href="/events?page=1&filter=all#upcoming">Events Query + Anchor</a>
          <a href="./speakers/../speakers/./hassan#bio">Redundant dot segment clean URL</a>
        </body></html>`
      );

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, true, `Clean URLs and dot segments should resolve cleanly: ${JSON.stringify(result.brokenLinks)}`);
      assert.equal(result.brokenLinks.length, 0);
      assert.equal(result.totalChecked, 4);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T5.1.3: Handles encoded spaces, special characters in paths and filenames', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-spaces-chars-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'community assets'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'community assets', 'guide 2026.pdf'), 'PDF content');
      fs.writeFileSync(path.join(tempDir, 'community assets', 'logo@2x (high-res).png'), 'PNG content');

      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>
          <a href="/community%20assets/guide%202026.pdf">Download Guide</a>
          <img src="/community%20assets/logo@2x%20(high-res).png" alt="Logo">
          <a href="./community%20assets/guide%202026.pdf">Relative Download</a>
        </body></html>`
      );

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, true, `Encoded space/character paths should resolve: ${JSON.stringify(result.brokenLinks)}`);
      assert.equal(result.brokenLinks.length, 0);
      assert.equal(result.totalChecked, 3);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SUITE 2: Fragment Anchors, Unicode, Duplicate IDs & Uppercase Tags
  // =====================================================================
  suite.group('2. Fragment Anchors, Unicode, Duplicate IDs & Uppercase Tags');

  await suite.test('T5.2.1: Resolves Unicode IDs, Pashto/Urdu script, German umlauts, and symbols', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-unicode-anchors-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>
          <h1 id="پشاور">Peshawar Urdu</h1>
          <h2 id="über-uns">Über Uns</h2>
          <h3 id="c++">C++ Topic</h3>
          <h4 id="§1.2">Section Symbol</h4>

          <!-- Direct Unicode href -->
          <a href="#پشاور">Urdu Anchor Direct</a>
          <a href="#über-uns">German Anchor Direct</a>
          <a href="#c++">C++ Direct</a>
          <a href="#§1.2">Section Direct</a>

          <!-- Percent-encoded href -->
          <a href="#%D9%BE%D8%B4%D8%A7%D9%88%D8%B1">Urdu Anchor Encoded</a>
          <a href="#%C3%BCber-uns">German Anchor Encoded</a>
          <a href="#c%2B%2B">C++ Encoded</a>
          <a href="#%C2%A71.2">Section Encoded</a>

          <!-- Top anchors -->
          <a href="#">Top Empty</a>
          <a href="#top">Top Explicit</a>
        </body></html>`
      );

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, true, `All unicode & encoded anchors should resolve: ${JSON.stringify(result.brokenLinks)}`);
      assert.equal(result.brokenLinks.length, 0);
      assert.equal(result.totalChecked, 10); // 10 total links checked
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T5.2.2: Handles uppercase HTML tags, mixed-case attributes, and duplicate IDs', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-uppercase-tags-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'target.html'), `
        <!DOCTYPE html>
        <html>
        <HEAD>
          <TITLE>Target</TITLE>
        </HEAD>
        <BODY>
          <DIV ID="duplicate-id">First Occurrence</DIV>
          <DIV ID="duplicate-id">Second Occurrence</DIV>
          <A NAME="legacy-name-target"></A>
        </BODY>
        </html>
      `);

      fs.writeFileSync(path.join(tempDir, 'index.html'), `
        <!DOCTYPE HTML>
        <HTML>
        <HEAD>
          <LINK REL="stylesheet" HREF="/styles.css">
        </HEAD>
        <BODY>
          <A HREF="/target.html#duplicate-id">Uppercase A HREF</A>
          <A href='/target.html#legacy-name-target'>Single Quoted</A>
          <IMG SRC="/logo.png" ALT="Logo">
          <VIDEO POSTER="/poster.jpg">
            <SOURCE SRCSET="/movie.mp4 1x, /movie-hd.mp4 2x">
          </VIDEO>
          <SCRIPT SRC="/bundle.js"></SCRIPT>
        </BODY>
        </HTML>
      `);

      fs.writeFileSync(path.join(tempDir, 'styles.css'), 'body{}');
      fs.writeFileSync(path.join(tempDir, 'logo.png'), 'png');
      fs.writeFileSync(path.join(tempDir, 'poster.jpg'), 'jpg');
      fs.writeFileSync(path.join(tempDir, 'movie.mp4'), 'mp4');
      fs.writeFileSync(path.join(tempDir, 'movie-hd.mp4'), 'mp4');
      fs.writeFileSync(path.join(tempDir, 'bundle.js'), 'console.log();');

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, true, `Uppercase tags & attributes must be parsed accurately: ${JSON.stringify(result.brokenLinks)}`);
      assert.equal(result.brokenLinks.length, 0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T5.2.3: Correctly identifies non-existent fragment anchors with rich error details', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-broken-anchors-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'other.html'), `<html><body><h1 id="exists">Title</h1></body></html>`);
      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>
          <h1 id="real-section">Home</h1>
          <a href="#non-existent-local-anchor">Broken Local Anchor</a>
          <a href="/other.html#missing-remote-anchor">Broken Remote Anchor</a>
          <a href="/other.html#exists">Valid Remote Anchor</a>
        </body></html>`
      );

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, false);
      assert.equal(result.brokenLinks.length, 2);

      const reasons = result.brokenLinks.map(b => b.reason).join(' | ');
      assert.ok(reasons.includes('Target anchor "#non-existent-local-anchor" not found in current page'));
      assert.ok(reasons.includes('Target anchor "#missing-remote-anchor" not found in "other.html"'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SUITE 3: Broken Link Detection Accuracy & Ignored Schemes
  // =====================================================================
  suite.group('3. Broken Link Detection Accuracy & Ignored Schemes');

  await suite.test('T5.3.1: Ignores all non-HTTP protocols, protocol-relative URLs, and data URIs', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-ignored-schemes-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>
          <a href="https://ocgroups.dev/cncf/group/6vwk2n4">HTTPS External</a>
          <a href="http://example.com/unsecure">HTTP External</a>
          <a href="//cdn.jsdelivr.net/npm/bootstrap">Protocol Relative</a>
          <a href="mailto:organizers@cncfpeshawar.org">Mailto</a>
          <a href="tel:+923001234567">Tel</a>
          <a href="javascript:void(0)">Javascript</a>
          <a href="sms:+923001234567?body=Hello">SMS</a>
          <a href="irc://irc.libera.chat/#cncf">IRC</a>
          <a href="ftp://files.example.com/archive.zip">FTP</a>
          <a href="urn:isbn:0-486-27557-4">URN</a>
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==">
          <img src="blob:http://localhost:3000/1234-uuid">
        </body></html>`
      );

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, true, `All special/external protocols should be ignored: ${JSON.stringify(result.brokenLinks)}`);
      assert.equal(result.brokenLinks.length, 0);
      assert.equal(result.totalChecked, 0); // No internal links to check
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('T5.3.2: Accurately detects and reports mixed broken assets and links', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-mixed-broken-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'valid.html'), `<html><body>Valid</body></html>`);
      fs.writeFileSync(path.join(tempDir, 'valid.png'), `png`);

      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>
          <a href="/valid.html">Valid Link</a>
          <a href="/missing-page">Broken Page</a>
          <img src="/valid.png">
          <img src="/missing-image.png">
          <link rel="stylesheet" href="/missing-style.css">
          <video poster="/missing-poster.jpg"></video>
          <source srcset="/missing-1x.jpg 1x, /missing-2x.jpg 2x">
        </body></html>`
      );

      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, false);
      assert.equal(result.brokenLinks.length, 6);

      const attrs = result.brokenLinks.map(b => b.attribute);
      assert.ok(attrs.includes('href'));
      assert.ok(attrs.includes('src'));
      assert.ok(attrs.includes('poster'));
      assert.ok(attrs.includes('srcset'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SUITE 4: Missing dist/ Handling & CLI Arguments
  // =====================================================================
  suite.group('4. Missing dist/ Handling & CLI Options');

  await suite.test('T5.4.1: Missing directory exits code 1 with actionable guidance', async () => {
    const nonExistentDir = path.join(os.tmpdir(), 'definitely-not-existing-dir-987654');
    const res = runCommand('node', ['scripts/check-links.mjs', '--dir', nonExistentDir]);

    assert.equal(res.status, 1, 'Process must exit code 1 on missing directory');
    assert.ok(
      res.stderr.includes('Directory not found') || res.stdout.includes('Directory not found'),
      'Must print clear error message about missing directory'
    );
    assert.ok(
      res.stderr.includes('npm run build') || res.stdout.includes('npm run build'),
      'Must instruct user to run build'
    );
  });

  await suite.test('T5.4.2: Empty directory with no HTML files exits code 1 with error', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-empty-dist-'));
    try {
      const res = runCommand('node', ['scripts/check-links.mjs', '-d', emptyDir]);
      assert.equal(res.status, 1, 'Process must exit code 1 on empty directory');
      assert.ok(
        res.stderr.includes('No HTML files found') || res.stdout.includes('No HTML files found'),
        'Must print error about no HTML files'
      );
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  await suite.test('T5.4.3: CLI options --dir, -d, positional arg, --verbose, and --help operate robustly', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-cli-test-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'index.html'), `<html><body><a href="/">Home</a></body></html>`);

      // 1. --help / -h
      const helpRes = runCommand('node', ['scripts/check-links.mjs', '--help']);
      assert.equal(helpRes.status, 0);
      assert.ok(helpRes.stdout.includes('Usage:'));

      const hRes = runCommand('node', ['scripts/check-links.mjs', '-h']);
      assert.equal(hRes.status, 0);

      // 2. --dir
      const dirRes = runCommand('node', ['scripts/check-links.mjs', '--dir', tempDir]);
      assert.equal(dirRes.status, 0);
      assert.ok(dirRes.stdout.includes('0 broken internal links'));

      // 3. -d
      const dRes = runCommand('node', ['scripts/check-links.mjs', '-d', tempDir]);
      assert.equal(dRes.status, 0);

      // 4. Positional
      const posRes = runCommand('node', ['scripts/check-links.mjs', tempDir]);
      assert.equal(posRes.status, 0);

      // 5. --verbose
      const verboseRes = runCommand('node', ['scripts/check-links.mjs', '--dir', tempDir, '--verbose']);
      assert.equal(verboseRes.status, 0);
      assert.ok(verboseRes.stdout.includes('Verified [index.html] -> /'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SUITE 5: Scale, Performance & Caching Stress Test
  // =====================================================================
  suite.group('5. Scale, Performance & Caching Stress Test');

  await suite.test('T5.5.1: High-volume stress test (1,000+ cross-linked elements and anchor cache performance)', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 't5-high-volume-'));
    try {
      const pageCount = 20;
      const linksPerPage = 50; // Total 1,000 links
      
      // Generate 20 HTML files with sections
      for (let p = 0; p < pageCount; p++) {
        const sections = [];
        for (let s = 0; s < linksPerPage; s++) {
          sections.push(`<section id="sec-${p}-${s}"><h2>Section ${p}-${s}</h2></section>`);
        }
        fs.writeFileSync(
          path.join(tempDir, `page-${p}.html`),
          `<!DOCTYPE html><html><body>${sections.join('\n')}</body></html>`
        );
      }

      // Root index.html links to all 1,000 sections across the 20 pages
      const links = [];
      for (let p = 0; p < pageCount; p++) {
        for (let s = 0; s < linksPerPage; s++) {
          links.push(`<a href="/page-${p}.html#sec-${p}-${s}">Link to p${p} s${s}</a>`);
        }
      }
      fs.writeFileSync(
        path.join(tempDir, 'index.html'),
        `<!DOCTYPE html><html><body>${links.join('\n')}</body></html>`
      );

      const startTime = Date.now();
      const result = checkLinks({ dir: tempDir });
      const durationMs = Date.now() - startTime;

      assert.equal(result.success, true);
      assert.equal(result.brokenLinks.length, 0);
      assert.equal(result.htmlFilesCount, 21);
      assert.equal(result.totalChecked, 1000);
      assert.ok(durationMs < 5000, `High volume link check completed in ${durationMs}ms (< 5000ms target)`);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // SUITE 6: Cross-Subsystem End-to-End Pipeline Stress Test
  // =====================================================================
  suite.group('6. Cross-Subsystem End-to-End Integration Pipeline');

  await suite.test('T5.6.1: Executes Full Pipeline: OCG Sync -> CFP Parse -> Astro Check -> Astro Build -> Link Check', async () => {
    const tempSandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'cncf-cross-subsystem-'));
    const tempEventsDir = path.join(tempSandbox, 'src/content/events');
    const tempSpeakersDir = path.join(tempSandbox, 'src/content/speakers');
    fs.mkdirSync(tempEventsDir, { recursive: true });
    fs.mkdirSync(tempSpeakersDir, { recursive: true });

    try {
      // Step 1: Run CFP Issue Parser into isolated temp sandbox
      const sampleIssueBody = `
### Speaker Full Name
Farhad Khan

### Current Role
Cloud Architect at Peshawar Cloud Labs

### Talk Title
[CFP]: Advanced Kubernetes Operator Pattern with Kubebuilder

### Session Format
45-minute Deep Dive

### Technical Track
Kubernetes & CloudNative

### Target Audience
Advanced Platform Engineers

### Session Abstract
Deep dive into writing custom Kubernetes controllers and operators using Go and Kubebuilder v4 with practical enterprise examples.

### Speaker Bio
Farhad Khan is a cloud native architect and open source contributor based in KPK.

### GitHub Profile
https://github.com/farhadkhan-k8s

### LinkedIn Profile
https://linkedin.com/in/farhadkhan-k8s
      `;

      console.log('    [Step 1] Ingesting CFP Submission into temp sandbox...');
      const cfpResult = await parseCfpIssue({
        issueBody: sampleIssueBody,
        issueNumber: 991,
        issueUrl: 'https://github.com/cncf-peshawar/cncf-peshawar.github.io/issues/991',
        baseDir: tempSandbox
      });

      assert.equal(cfpResult.speaker_slug, 'farhad-khan');
      assert.equal(cfpResult.event_slug, 'draft-advanced-kubernetes-operator-pattern-with-kubebuilder');

      const createdSpeakerFile = path.resolve(tempSandbox, cfpResult.speaker_file);
      const createdEventFile = path.resolve(tempSandbox, cfpResult.event_file);

      assert.ok(fs.existsSync(createdSpeakerFile), 'Speaker markdown was generated on disk');
      assert.ok(fs.existsSync(createdEventFile), 'Draft event markdown was generated on disk');

      // Validate schemas of generated files
      const spkContent = fs.readFileSync(createdSpeakerFile, 'utf8');
      const spkFm = extractFrontmatter(spkContent).frontmatter;
      const spkValid = validateSpeakerFrontmatter(spkFm);
      assert.ok(spkValid.success, `Generated speaker frontmatter is valid: ${JSON.stringify(spkValid.error?.format())}`);

      const evContent = fs.readFileSync(createdEventFile, 'utf8');
      const evFm = extractFrontmatter(evContent).frontmatter;
      const evValid = validateEventFrontmatter(evFm);
      assert.ok(evValid.success, `Generated event frontmatter is valid: ${JSON.stringify(evValid.error?.format())}`);

      // Step 2: Run OCG Sync with mock portal fixture into tempEventsDir
      console.log('    [Step 2] Executing OCG Event Sync in temp sandbox...');
      const fixturePath = path.resolve(projectRoot, 'tests/fixtures/ocg-portal-upcoming.html');
      const syncResult = await syncEvents({
        source: fixturePath,
        eventsDir: tempEventsDir
      });

      assert.equal(syncResult.success, true);

      // Step 3: Run astro check (TypeScript & Content Collection validation on clean repo)
      console.log('    [Step 3] Running "npm run check" (astro check)...');
      const checkRes = runCommand('npm', ['run', 'check'], { cwd: projectRoot, timeout: 60000 });
      assert.equal(
        checkRes.status,
        0,
        `astro check failed:\nStdout: ${checkRes.stdout}\nStderr: ${checkRes.stderr}`
      );

      // Step 4: Run astro build (Production static generation)
      console.log('    [Step 4] Running "npm run build" (astro check && astro build)...');
      const buildRes = runCommand('npm', ['run', 'build'], { cwd: projectRoot, timeout: 90000 });
      assert.equal(
        buildRes.status,
        0,
        `npm run build failed:\nStdout: ${buildRes.stdout}\nStderr: ${buildRes.stderr}`
      );

      // Step 5: Run static link checker on built dist/
      console.log('    [Step 5] Running "npm run check:links" (node scripts/check-links.mjs)...');
      const linkRes = runCommand('npm', ['run', 'check:links'], { cwd: projectRoot, timeout: 30000 });
      assert.equal(
        linkRes.status,
        0,
        `npm run check:links failed:\nStdout: ${linkRes.stdout}\nStderr: ${linkRes.stderr}`
      );
      assert.ok(linkRes.stdout.includes('0 broken internal links!'));

      // Direct module check on dist/
      const directResult = checkLinks({ dir: 'dist' });
      assert.equal(directResult.success, true);
      assert.equal(directResult.brokenLinks.length, 0);
      assert.ok(directResult.totalChecked >= 100, `Expected >= 100 links checked, got ${directResult.totalChecked}`);
    } finally {
      if (fs.existsSync(tempSandbox)) {
        fs.rmSync(tempSandbox, { recursive: true, force: true });
      }
    }
  });

  suite.printResults();
  return suite.getSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTier5AdversarialSuite().then(summary => {
    if (summary.failed > 0) {
      console.error(`❌ Tier 5 Adversarial Suite failed: ${summary.failed} / ${summary.total} tests failed.`);
      process.exit(1);
    } else {
      console.log(`✨ Tier 5 Adversarial Suite passed: ${summary.passed} / ${summary.total} tests passed!`);
      process.exit(0);
    }
  }).catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
