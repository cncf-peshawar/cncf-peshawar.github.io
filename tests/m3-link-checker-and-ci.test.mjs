/**
 * Milestone 3 (R3 CI Quality & Static Integrity Validation) Unit & Integration Test Suite
 * CNCF Peshawar Automation Suite
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import {
  checkLinks,
  parseArgs,
  extractLinksFromHtml,
  extractElementIdentifiers,
  isExternalOrIgnored,
  resolveTargetFile
} from '../scripts/check-links.mjs';
import {
  TestHarness,
  extractFrontmatter,
  validateBlogFrontmatter,
  runCommand
} from './test-utils.mjs';

export async function runM3Suite() {
  const suite = new TestHarness('Milestone 3: CI Quality & Link Validation (R3)');

  // =====================================================================
  // UNIT TESTS: check-links.mjs core functions
  // =====================================================================
  suite.group('Link Checker Unit Tests');

  await suite.test('parseArgs: parses default and custom arguments', async () => {
    assert.deepEqual(parseArgs([]), { dir: 'dist', verbose: false });
    assert.deepEqual(parseArgs(['--dir', 'custom-build']), { dir: 'custom-build', verbose: false });
    assert.deepEqual(parseArgs(['-d', 'out', '-v']), { dir: 'out', verbose: true });
    assert.deepEqual(parseArgs(['my-dist']), { dir: 'my-dist', verbose: false });
  });

  await suite.test('isExternalOrIgnored: correctly classifies URLs', async () => {
    // External and protocol URLs
    assert.equal(isExternalOrIgnored('https://ocgroups.dev'), true);
    assert.equal(isExternalOrIgnored('http://example.com'), true);
    assert.equal(isExternalOrIgnored('mailto:cncfpeshawar@gmail.com'), true);
    assert.equal(isExternalOrIgnored('tel:+923001234567'), true);
    assert.equal(isExternalOrIgnored('javascript:void(0)'), true);
    assert.equal(isExternalOrIgnored('data:image/png;base64,iVBORw0KGgo='), true);
    assert.equal(isExternalOrIgnored('blob:http://example.com/uuid'), true);
    assert.equal(isExternalOrIgnored('//cdn.jsdelivr.net/npm/astro'), true);
    assert.equal(isExternalOrIgnored(''), true);
    assert.equal(isExternalOrIgnored('   '), true);
    assert.equal(isExternalOrIgnored(null), true);

    // Internal URLs
    assert.equal(isExternalOrIgnored('/'), false);
    assert.equal(isExternalOrIgnored('/events'), false);
    assert.equal(isExternalOrIgnored('/blog/announcing-cncf-peshawar'), false);
    assert.equal(isExternalOrIgnored('../assets/logo.png'), false);
    assert.equal(isExternalOrIgnored('#features'), false);
    assert.equal(isExternalOrIgnored('/speak#cfp-guidelines'), false);
  });

  await suite.test('extractLinksFromHtml: extracts href, src, poster, and srcset', async () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/assets/style.css">
        <link rel="icon" href="/favicon.svg">
      </head>
      <body>
        <a href="/events">Events</a>
        <a href="/speak#guidelines">Speak</a>
        <img src="/images/logo.png" srcset="/images/logo-2x.png 2x, /images/logo-1x.png 1x">
        <video poster="/images/video-thumb.jpg">
          <source src="/media/intro.mp4" type="video/mp4">
        </video>
        <script src="/scripts/main.js"></script>
      </body>
      </html>
    `;

    const extracted = extractLinksFromHtml(sampleHtml);
    const urls = extracted.map(e => e.url);

    assert.ok(urls.includes('/assets/style.css'));
    assert.ok(urls.includes('/favicon.svg'));
    assert.ok(urls.includes('/events'));
    assert.ok(urls.includes('/speak#guidelines'));
    assert.ok(urls.includes('/images/logo.png'));
    assert.ok(urls.includes('/images/logo-2x.png'));
    assert.ok(urls.includes('/images/logo-1x.png'));
    assert.ok(urls.includes('/images/video-thumb.jpg'));
    assert.ok(urls.includes('/media/intro.mp4'));
    assert.ok(urls.includes('/scripts/main.js'));
  });

  await suite.test('extractElementIdentifiers: extracts id and name attributes', async () => {
    const sampleHtml = `
      <section id="hero">
        <h1 id="main-heading">Title</h1>
        <a name="legacy-anchor"></a>
        <div id="contact-us"></div>
      </section>
    `;

    const ids = extractElementIdentifiers(sampleHtml);
    assert.ok(ids.has('hero'));
    assert.ok(ids.has('main-heading'));
    assert.ok(ids.has('legacy-anchor'));
    assert.ok(ids.has('contact-us'));
    assert.equal(ids.has('non-existent'), false);
  });

  await suite.test('resolveTargetFile: correctly maps URLs to disk files', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-res-test-'));
    try {
      // Create dist structure
      fs.writeFileSync(path.join(tempDir, 'index.html'), '<html></html>');
      fs.mkdirSync(path.join(tempDir, 'events'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'events', 'index.html'), '<html></html>');
      fs.mkdirSync(path.join(tempDir, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'assets', 'style.css'), 'body{}');
      fs.writeFileSync(path.join(tempDir, 'about.html'), '<html></html>');

      const rootHtml = path.join(tempDir, 'index.html');
      const eventsHtml = path.join(tempDir, 'events', 'index.html');

      // Root-relative
      assert.equal(resolveTargetFile('/', rootHtml, tempDir).found, true);
      assert.equal(resolveTargetFile('/events', rootHtml, tempDir).found, true);
      assert.equal(resolveTargetFile('/events/', rootHtml, tempDir).found, true);
      assert.equal(resolveTargetFile('/about', rootHtml, tempDir).found, true);
      assert.equal(resolveTargetFile('/assets/style.css', rootHtml, tempDir).found, true);

      // Relative from subfolder
      assert.equal(resolveTargetFile('../assets/style.css', eventsHtml, tempDir).found, true);
      assert.equal(resolveTargetFile('../about', eventsHtml, tempDir).found, true);

      // Nonexistent
      assert.equal(resolveTargetFile('/missing-route', rootHtml, tempDir).found, false);
      assert.equal(resolveTargetFile('../missing-asset.png', eventsHtml, tempDir).found, false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =====================================================================
  // INTEGRATION TESTS: checkLinks on synthetic trees & CLI
  // =====================================================================
  suite.group('Link Checker Integration & CLI');

  await suite.test('checkLinks: reports missing directory error gracefully', async () => {
    const result = checkLinks({ dir: 'non_existent_dist_dir_12345' });
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Directory not found'));
  });

  await suite.test('checkLinks: reports empty directory error when no HTML files exist', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-dist-'));
    try {
      const result = checkLinks({ dir: tempDir });
      assert.equal(result.success, false);
      assert.ok(result.error.includes('No HTML files found'));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  await suite.test('checkLinks: succeeds on clean fixture tree', async () => {
    const result = checkLinks({ dir: 'tests/fixtures/html-tree-clean' });
    assert.equal(result.success, true);
    assert.equal(result.brokenLinks.length, 0);
    assert.ok(result.totalChecked > 0);
  });

  await suite.test('checkLinks: detects all broken links in broken fixture tree', async () => {
    const result = checkLinks({ dir: 'tests/fixtures/html-tree-broken' });
    assert.equal(result.success, false);
    assert.ok(result.brokenLinks.length >= 3);

    const reasons = result.brokenLinks.map(b => b.reason).join(' ');
    assert.ok(reasons.includes('Target file or route does not exist') || reasons.includes('Target anchor'));
  });

  await suite.test('CLI: exits with code 0 on clean tree and 1 on broken tree', async () => {
    const cleanRes = runCommand('node', ['scripts/check-links.mjs', '--dir', 'tests/fixtures/html-tree-clean']);
    assert.equal(cleanRes.status, 0);
    assert.ok(cleanRes.stdout.includes('0 broken internal links'));

    const brokenRes = runCommand('node', ['scripts/check-links.mjs', '--dir', 'tests/fixtures/html-tree-broken']);
    assert.equal(brokenRes.status, 1);
    assert.ok(brokenRes.stderr.includes('broken link(s)'));
  });

  await suite.test('CLI: --help displays usage manual', async () => {
    const res = runCommand('node', ['scripts/check-links.mjs', '--help']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('Usage:'));
    assert.ok(res.stdout.includes('--dir'));
    assert.ok(res.stdout.includes('--verbose'));
  });

  // =====================================================================
  // BLOG CONTENT & LEGACY LINK INTEGRITY
  // =====================================================================
  suite.group('Blog Content & Link Validation');

  await suite.test('announcing-cncf-peshawar.md: contains no broken or legacy base URLs', async () => {
    const blogPath = 'src/content/blog/announcing-cncf-peshawar.md';
    const content = fs.readFileSync(blogPath, 'utf8');

    assert.ok(!content.includes('/cncf-peshawar-website/'), 'Must not contain legacy base URL prefix /cncf-peshawar-website/');
    assert.ok(content.includes('/speak'), 'Must link to /speak');
    assert.ok(content.includes('/sponsors'), 'Must link to /sponsors');

    const { frontmatter } = extractFrontmatter(content);
    const validation = validateBlogFrontmatter(frontmatter);
    assert.ok(validation.success, `Blog frontmatter must be valid: ${JSON.stringify(validation.error?.format())}`);
  });

  // =====================================================================
  // WORKFLOW & PACKAGE.JSON SPECIFICATIONS
  // =====================================================================
  suite.group('CI Workflow & Package Config');

  await suite.test('package.json: defines check, build, and check:links scripts', async () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    assert.equal(pkg.scripts.check, 'astro check');
    assert.equal(pkg.scripts.build, 'astro check && astro build');
    assert.equal(pkg.scripts['check:links'], 'node scripts/check-links.mjs');
  });

  await suite.test('.github/workflows/ci.yml: conforms to PR & push CI specifications', async () => {
    const ciPath = '.github/workflows/ci.yml';
    assert.ok(fs.existsSync(ciPath), 'ci.yml must exist');

    const content = fs.readFileSync(ciPath, 'utf8');
    const parsed = YAML.parse(content);

    assert.equal(parsed.name, 'CI Quality & Static Integrity Validation');
    assert.ok(parsed.on.push.branches.includes('main'));
    assert.ok(parsed.on.pull_request.branches.includes('main'));

    const steps = parsed.jobs.validate.steps;
    const stepCommands = steps.map(s => s.run || s.uses || '').join('\n');

    assert.ok(stepCommands.includes('actions/checkout@v4'));
    assert.ok(stepCommands.includes('actions/setup-node@v4'));
    assert.ok(stepCommands.includes('npm ci'));
    assert.ok(stepCommands.includes('npm run check'));
    assert.ok(stepCommands.includes('npm run build'));
    assert.ok(stepCommands.includes('npm run check:links'));
  });

  // =====================================================================
  // ACTUAL REPOSITORY STATIC INTEGRITY
  // =====================================================================
  suite.group('Production Build & Real Static Integrity Check');

  await suite.test('checkLinks on actual dist/ output verifies 0 broken links', async () => {
    const result = checkLinks({ dir: 'dist' });
    assert.equal(result.success, true, `Real build should have 0 broken links: ${JSON.stringify(result.brokenLinks)}`);
    assert.equal(result.brokenLinks.length, 0);
    assert.ok(result.totalChecked > 100, `Expected > 100 links checked, got ${result.totalChecked}`);
  });

  suite.printResults();
  return suite.getSummary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runM3Suite().then(summary => {
    if (summary.failed > 0) process.exit(1);
  });
}
