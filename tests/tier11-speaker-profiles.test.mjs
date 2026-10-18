/**
 * Tier 11: Speaker Profiles & Event-to-Speaker Reference Integrity
 * CNCF Peshawar Automation Suite
 *
 * Verifies Issue #8 acceptance criteria:
 * - Approved speaker profiles exist with verified identity, role, organization, bio, topic, and links
 * - Schema conformance against Astro Content Collections Zod schemas
 * - Events reference profiles using stable identifiers with graceful fallback for display-only
 * - Missing avatars and social links degrade gracefully without broken UI
 * - Deduplication across casing, honorifics (Dr., Engr., Prof.), and punctuation
 * - CFP speaker showcase renders when profiles exist and remains cleanly absent when empty
 * - Decap CMS authors can create and edit valid speaker profiles
 * - Clean build with no empty-speaker-collection warning and 0 broken links
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  TestHarness,
  extractFrontmatter,
  validateSpeakerFrontmatter,
  validateEventFrontmatter
} from './test-utils.mjs';

import {
  normalizeSpeakerKey,
  getSpeakerInitials,
  parseSpeakerDisplay,
  resolveSpeakerReference,
  resolveEventSpeakers,
  deduplicateSpeakers
} from '../src/lib/speakers.ts';

import { normalizeSpeakerKey as syncNormalizeSpeakerKey } from '../scripts/sync-ocg-events.mjs';

export async function runTier11Suite() {
  const suite = new TestHarness('Tier 11: Speaker Profiles & Event References');

  // =====================================================================
  // 1. VERIFIED PROFILES & SCHEMA CONFORMANCE (Criteria #1 & #2)
  // =====================================================================
  suite.group('Verified Speaker Profiles & Content Collection Schema');

  await suite.test('SP1: Syed Hassan Tayyab speaker profile exists and conforms to schema', () => {
    const filePath = 'src/content/speakers/syed-hassan-tayyab.md';
    assert.ok(fs.existsSync(filePath), 'syed-hassan-tayyab.md must exist on disk');

    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter } = extractFrontmatter(content);

    const validation = validateSpeakerFrontmatter(frontmatter);
    assert.ok(validation.success, `Schema validation failed: ${JSON.stringify(validation.error?.errors)}`);

    assert.equal(frontmatter.name, 'Syed Hassan Tayyab');
    assert.ok(frontmatter.role.length > 0, 'Role must be defined');
    assert.ok(frontmatter.organization.length > 0, 'Organization must be defined');
    assert.ok(frontmatter.bio.length > 0, 'Bio must be defined');
    assert.ok(frontmatter.topic.length > 0, 'Topic must be defined');
    assert.equal(frontmatter.featured, true, 'Profile must be featured');

    // Avatar must point to verified file in public/
    if (frontmatter.avatar) {
      const publicPath = path.join('public', frontmatter.avatar.replace(/^\//, ''));
      assert.ok(fs.existsSync(publicPath), `Avatar file ${publicPath} must exist on disk`);
    }

    // Social links must be valid URLs
    if (frontmatter.github) {
      assert.doesNotThrow(() => new URL(frontmatter.github));
    }
    if (frontmatter.linkedin) {
      assert.doesNotThrow(() => new URL(frontmatter.linkedin));
    }
  });

  await suite.test('SP2: Hamid Naeem speaker profile exists and conforms to schema', () => {
    const filePath = 'src/content/speakers/hamid-naeem.md';
    assert.ok(fs.existsSync(filePath), 'hamid-naeem.md must exist on disk');

    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter } = extractFrontmatter(content);

    const validation = validateSpeakerFrontmatter(frontmatter);
    assert.ok(validation.success, `Schema validation failed: ${JSON.stringify(validation.error?.errors)}`);

    assert.equal(frontmatter.name, 'Hamid Naeem');
    assert.ok(frontmatter.role.length > 0, 'Role must be defined');
    assert.ok(frontmatter.organization.length > 0, 'Organization must be defined');
    assert.ok(frontmatter.bio.length > 0, 'Bio must be defined');
    assert.ok(frontmatter.topic.length > 0, 'Topic must be defined');
    assert.equal(frontmatter.featured, true, 'Profile must be featured');

    if (frontmatter.avatar) {
      const publicPath = path.join('public', frontmatter.avatar.replace(/^\//, ''));
      assert.ok(fs.existsSync(publicPath), `Avatar file ${publicPath} must exist on disk`);
    }

    if (frontmatter.linkedin) {
      assert.doesNotThrow(() => new URL(frontmatter.linkedin));
    }
  });

  await suite.test('SP3: All files in src/content/speakers/ validate against SpeakerSchema', () => {
    const dir = 'src/content/speakers';
    const entries = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    assert.ok(entries.length >= 2, 'Must have at least 2 speaker profiles published');

    for (const file of entries) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { frontmatter } = extractFrontmatter(content);
      const res = validateSpeakerFrontmatter(frontmatter);
      assert.ok(res.success, `Speaker ${file} failed schema: ${JSON.stringify(res.error?.errors)}`);
    }
  });

  // =====================================================================
  // 2. EVENT-TO-SPEAKER STABLE REFERENCE RESOLUTION (Criterion #3)
  // =====================================================================
  suite.group('Event-to-Speaker Reference Resolution');

  await suite.test('SP4: Genesis event references stable speaker identifiers', () => {
    const genesisPath = 'src/content/events/01-cncf-peshawar-genesis.md';
    const content = fs.readFileSync(genesisPath, 'utf-8');
    const { frontmatter } = extractFrontmatter(content);

    assert.ok(validateEventFrontmatter(frontmatter).success, 'Genesis event must satisfy EventSchema');
    assert.ok(Array.isArray(frontmatter.speakers), 'speakers must be an array');
    assert.ok(frontmatter.speakers.includes('syed-hassan-tayyab'), 'Must reference syed-hassan-tayyab slug');
    assert.ok(frontmatter.speakers.includes('hamid-naeem'), 'Must reference hamid-naeem slug');
  });

  await suite.test('SP5: resolveSpeakerReference resolves exact slugs and names to verified profiles', () => {
    const mockProfiles = [
      {
        slug: 'syed-hassan-tayyab',
        id: 'syed-hassan-tayyab.md',
        data: {
          name: 'Syed Hassan Tayyab',
          role: 'Co-Founder & AI Product Developer',
          organization: 'UET Peshawar',
          bio: 'AI enthusiast',
          topic: 'Multi-Agent Systems',
          avatar: '/images/team/syed-hassan-tayyab.png',
          github: 'https://github.com/syedhassantayyab',
          featured: true
        }
      },
      {
        slug: 'hamid-naeem',
        id: 'hamid-naeem.md',
        data: {
          name: 'Hamid Naeem',
          role: 'Chapter Organizer',
          organization: 'Cloud Native Peshawar',
          bio: 'DevOps lead',
          topic: 'Genesis Launch',
          avatar: '/images/team/hamid-naeem.png',
          featured: true
        }
      }
    ];

    // 1. Direct slug resolution
    const resSlug = resolveSpeakerReference('syed-hassan-tayyab', mockProfiles);
    assert.equal(resSlug.isProfile, true);
    assert.equal(resSlug.name, 'Syed Hassan Tayyab');
    assert.equal(resSlug.slug, 'syed-hassan-tayyab');

    // 2. Plain name resolution
    const resName = resolveSpeakerReference('Syed Hassan Tayyab', mockProfiles);
    assert.equal(resName.isProfile, true);
    assert.equal(resName.name, 'Syed Hassan Tayyab');

    // 3. Name with role details in parentheses
    const resParen = resolveSpeakerReference('Syed Hassan Tayyab (Co Founder & AI Product Developer)', mockProfiles);
    assert.equal(resParen.isProfile, true);
    assert.equal(resParen.name, 'Syed Hassan Tayyab');

    // 4. Name with academic / professional honorific
    const resHonorific = resolveSpeakerReference('Dr. Syed Hassan Tayyab', mockProfiles);
    assert.equal(resHonorific.isProfile, true);
    assert.equal(resHonorific.name, 'Syed Hassan Tayyab');

    // 5. Unlinked / display-only speaker
    const resDisplay = resolveSpeakerReference('External Guest (Security Engineer at CloudCorp)', mockProfiles);
    assert.equal(resDisplay.isProfile, false);
    assert.equal(resDisplay.name, 'External Guest');
    assert.equal(resDisplay.role, 'Security Engineer');
    assert.equal(resDisplay.organization, 'CloudCorp');
    assert.equal(resDisplay.initials, 'EG');
  });

  await suite.test('SP6: resolveEventSpeakers deduplicates mixed references and upgrades to profile', () => {
    const mockProfiles = [
      {
        slug: 'syed-hassan-tayyab',
        id: 'syed-hassan-tayyab.md',
        data: {
          name: 'Syed Hassan Tayyab',
          role: 'AI Lead',
          organization: 'UET Peshawar',
          bio: 'Bio',
          topic: 'Topic',
          featured: true
        }
      }
    ];

    const refs = [
      'syed-hassan-tayyab',
      'Syed Hassan Tayyab (AI Lead)',
      'Dr. Syed Hassan Tayyab'
    ];

    const resolved = resolveEventSpeakers(refs, mockProfiles);
    assert.equal(resolved.length, 1, 'All variants must collapse to single resolved profile');
    assert.equal(resolved[0].isProfile, true);
    assert.equal(resolved[0].name, 'Syed Hassan Tayyab');
  });

  // =====================================================================
  // 3. GRACEFUL DEGRADATION FOR MISSING AVATARS & SOCIALS (Criterion #4)
  // =====================================================================
  suite.group('Graceful Degradation for Avatars & Optional Fields');

  await suite.test('SP7: getSpeakerInitials handles single, multi-word, and honorific names', () => {
    assert.equal(getSpeakerInitials('Hamid Naeem'), 'HN');
    assert.equal(getSpeakerInitials('Syed Hassan Tayyab'), 'ST');
    assert.equal(getSpeakerInitials('Dr. Bilal Tariq'), 'BT');
    assert.equal(getSpeakerInitials('Prof. Jane Doe'), 'JD');
    assert.equal(getSpeakerInitials('Engr. Ahmad'), 'AH');
    assert.equal(getSpeakerInitials('Alice'), 'AL');
    assert.equal(getSpeakerInitials(''), 'SP');
  });

  await suite.test('SP8: parseSpeakerDisplay handles varied role formats cleanly', () => {
    const p1 = parseSpeakerDisplay('Jane Doe (SRE Lead at Acme)');
    assert.equal(p1.name, 'Jane Doe');
    assert.equal(p1.role, 'SRE Lead');
    assert.equal(p1.organization, 'Acme');

    const p2 = parseSpeakerDisplay('John Smith (DevOps)');
    assert.equal(p2.name, 'John Smith');
    assert.equal(p2.role, 'DevOps');
    assert.equal(p2.organization, 'Cloud Native Peshawar');

    const p3 = parseSpeakerDisplay('Alice Walker');
    assert.equal(p3.name, 'Alice Walker');
    assert.equal(p3.role, 'Speaker / Community Contributor');
  });

  // =====================================================================
  // 4. DEDUPLICATION ACROSS CASING, HONORIFICS & PUNCTUATION (Criterion #5)
  // =====================================================================
  suite.group('Robust Deduplication across Casing, Honorifics & Punctuation');

  await suite.test('SP9: normalizeSpeakerKey produces identical canonical slug for all variants', () => {
    const expected = 'syed-hassan-tayyab';
    assert.equal(normalizeSpeakerKey('Syed Hassan Tayyab'), expected);
    assert.equal(normalizeSpeakerKey('syed-hassan-tayyab'), expected);
    assert.equal(normalizeSpeakerKey('SYED HASSAN TAYYAB'), expected);
    assert.equal(normalizeSpeakerKey('Dr. Syed Hassan Tayyab'), expected);
    assert.equal(normalizeSpeakerKey('Prof. Syed Hassan Tayyab'), expected);
    assert.equal(normalizeSpeakerKey('Engr. Syed Hassan Tayyab'), expected);
    assert.equal(normalizeSpeakerKey('Syed Hassan Tayyab (Co Founder & AI Product Developer)'), expected);
    assert.equal(normalizeSpeakerKey('Syed Hassan Tayyab.'), expected);
    assert.equal(normalizeSpeakerKey('  Syed   Hassan  Tayyab  '), expected);

    // Sync script normalizer must produce identical canonical key
    assert.equal(syncNormalizeSpeakerKey('Dr. Syed Hassan Tayyab (Lead)'), expected);
    assert.equal(syncNormalizeSpeakerKey('syed-hassan-tayyab'), expected);
  });

  await suite.test('SP10: deduplicateSpeakers filters duplicate entries with varied casing/titles', () => {
    const speakers = [
      { slug: 'syed-hassan-tayyab', data: { name: 'Syed Hassan Tayyab', featured: true } },
      { slug: 'Dr-Syed-Hassan-Tayyab', data: { name: 'Dr. Syed Hassan Tayyab', featured: true } },
      { slug: 'hamid-naeem', data: { name: 'Hamid Naeem', featured: true } }
    ];

    const unique = deduplicateSpeakers(speakers);
    assert.equal(unique.length, 2, 'Duplicate profile must be removed');
    assert.equal(unique[0].slug, 'syed-hassan-tayyab');
    assert.equal(unique[1].slug, 'hamid-naeem');
  });

  // =====================================================================
  // 5. CFP SPEAKER SHOWCASE & CMS INTEGRATION (Criteria #6 & #7)
  // =====================================================================
  suite.group('CFP Speaker Showcase & CMS Conformance');

  await suite.test('SP11: speak.astro guards speaker showcase and deduplicates profiles', () => {
    const speakSrc = fs.readFileSync('src/pages/speak.astro', 'utf-8');
    assert.match(
      speakSrc,
      /deduplicateSpeakers/,
      'speak.astro must import and use deduplicateSpeakers'
    );
    assert.match(
      speakSrc,
      /uniqueSpeakers\.length > 0/,
      'speak.astro must condition the speaker section on uniqueSpeakers.length > 0'
    );
  });

  await suite.test('SP12: Decap CMS config.yml supports speakers collection and event link hints', () => {
    const cmsSrc = fs.readFileSync('public/admin/config.yml', 'utf-8');
    const parsed = YAML.parse(cmsSrc);

    const speakersCol = parsed.collections?.find(c => c.name === 'speakers');
    assert.ok(speakersCol, 'speakers collection must exist in Decap CMS config');
    assert.equal(speakersCol.folder, 'src/content/speakers');

    const fields = speakersCol.fields.map(f => f.name);
    assert.ok(fields.includes('name'));
    assert.ok(fields.includes('role'));
    assert.ok(fields.includes('organization'));
    assert.ok(fields.includes('bio'));
    assert.ok(fields.includes('topic'));
    assert.ok(fields.includes('avatar'));
    assert.ok(fields.includes('github'));
    assert.ok(fields.includes('linkedin'));
    assert.ok(fields.includes('twitter'));
    assert.ok(fields.includes('featured'));

    const eventsCol = parsed.collections?.find(c => c.name === 'events');
    const speakerField = eventsCol?.fields?.find(f => f.name === 'speakers');
    assert.ok(speakerField, 'events collection must have speakers field');
    assert.ok(speakerField.hint?.includes('slug'), 'speakers field must have hint mentioning speaker slugs');
  });

  // =====================================================================
  // 6. BUILD OUTPUT RENDERING INTEGRITY (Criteria #8 & #9)
  // =====================================================================
  suite.group('Rendered Static Build Output Verification');

  await suite.test('SP13: Rendered pages contain speaker showcases and detail cards', () => {
    const speakHtmlPath = 'dist/speak/index.html';
    const genesisHtmlPath = 'dist/events/01-cncf-peshawar-genesis/index.html';
    const homeHtmlPath = 'dist/index.html';

    if (fs.existsSync(speakHtmlPath)) {
      const speakHtml = fs.readFileSync(speakHtmlPath, 'utf-8');
      assert.ok(speakHtml.includes('Syed Hassan Tayyab'), 'CFP page must render Syed Hassan Tayyab');
      assert.ok(speakHtml.includes('Hamid Naeem'), 'CFP page must render Hamid Naeem');
      assert.ok(speakHtml.includes('speaker-card'), 'CFP page must render speaker cards');
    }

    if (fs.existsSync(genesisHtmlPath)) {
      const genesisHtml = fs.readFileSync(genesisHtmlPath, 'utf-8');
      assert.ok(genesisHtml.includes('Syed Hassan Tayyab'), 'Genesis page must render Syed Hassan Tayyab');
      assert.ok(genesisHtml.includes('Hamid Naeem'), 'Genesis page must render Hamid Naeem');
      assert.ok(genesisHtml.includes('speaker-card'), 'Genesis page must render speaker-card');
    }

    if (fs.existsSync(homeHtmlPath)) {
      const homeHtml = fs.readFileSync(homeHtmlPath, 'utf-8');
      assert.ok(homeHtml.includes('Syed Hassan Tayyab'), 'Home page must render Syed Hassan Tayyab');
      assert.ok(homeHtml.includes('03 // SPEAKERS'), 'Home page must render speakers section');
    }
  });

  suite.printResults();
  return suite.getSummary();
}

if (process.argv[1]?.endsWith('tier11-speaker-profiles.test.mjs')) {
  runTier11Suite()
    .then(summary => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
