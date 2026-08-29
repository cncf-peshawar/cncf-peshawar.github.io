/**
 * Test Utilities and Assertion Helpers for E2E Test Suite
 * CNCF Peshawar Automation Suite
 */

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';

// =====================================================================
// ASTRO CONTENT COLLECTION ZOD SCHEMAS (Derived from src/content/config.ts)
// =====================================================================

export const EventSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
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

export const SpeakerSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  organization: z.string().min(1),
  bio: z.string().min(1),
  avatar: z.string().optional(),
  topic: z.string().min(1),
  slidesUrl: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),
  github: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  featured: z.boolean().default(false)
});

export const BlogSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  publishDate: z.string().min(1),
  author: z.string().min(1),
  authorRole: z.string().default('CNCF Peshawar Organizer'),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false)
});

// =====================================================================
// FRONTMATTER PARSING & EXTRACTION HELPERS
// =====================================================================

/**
 * Extracts YAML frontmatter and body from Markdown string
 * @param {string} markdownContent 
 * @returns {{ frontmatter: Record<string, any>, body: string }}
 */
export function extractFrontmatter(markdownContent) {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return { frontmatter: {}, body: '' };
  }
  const match = markdownContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: markdownContent };
  }
  try {
    const frontmatter = YAML.parse(match[1]) || {};
    return { frontmatter, body: (match[2] || '').trim() };
  } catch (err) {
    throw new Error(`Failed to parse YAML frontmatter: ${err.message}`);
  }
}

/**
 * Validates frontmatter against Event schema
 */
export function validateEventFrontmatter(frontmatter) {
  return EventSchema.safeParse(frontmatter);
}

/**
 * Validates frontmatter against Speaker schema
 */
export function validateSpeakerFrontmatter(frontmatter) {
  return SpeakerSchema.safeParse(frontmatter);
}

/**
 * Validates frontmatter against Blog schema
 */
export function validateBlogFrontmatter(frontmatter) {
  return BlogSchema.safeParse(frontmatter);
}

// =====================================================================
// LINK CHECKING REFERENCE ENGINE (Specification Oracle for F6/F7)
// =====================================================================

/**
 * Scans built HTML files in a directory and verifies all internal links, anchors, and assets.
 * @param {string} dirPath 
 * @returns {{ totalLinks: number, brokenLinks: Array<{ file: string, link: string, reason: string }> }}
 */
export function verifyStaticLinks(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Target directory does not exist: ${dirPath}`);
  }

  const htmlFiles = [];
  function collectHtmlFiles(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        collectHtmlFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  }
  collectHtmlFiles(dirPath);

  const brokenLinks = [];
  let totalLinks = 0;

  // Cache IDs found in each HTML file for anchor resolution
  const fileIdMap = new Map();
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const ids = new Set();
    const idMatches = content.matchAll(/\b(?:id|name)=["']([^"']+)["']/gi);
    for (const m of idMatches) {
      ids.add(m[1]);
    }
    fileIdMap.set(file, ids);
  }

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relSource = path.relative(dirPath, file);

    // Match href and src attributes
    const linkMatches = content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi);
    for (const match of linkMatches) {
      const link = match[1].trim();
      totalLinks++;

      // Ignore empty or external/protocol links
      if (!link || link === '#' || link.startsWith('http://') || link.startsWith('https://') ||
          link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('javascript:') ||
          link.startsWith('data:')) {
        continue;
      }

      // Check for legacy broken paths (e.g. /cncf-peshawar-website/*)
      if (link.startsWith('/cncf-peshawar-website/')) {
        brokenLinks.push({
          file: relSource,
          link,
          reason: 'Legacy repository base prefix detected (/cncf-peshawar-website/)'
        });
        continue;
      }

      // Split path from hash anchor and query parameters
      const [pathAndQuery, hash] = link.split('#');
      const cleanPath = pathAndQuery.split('?')[0];

      let targetHtmlFile = null;

      if (cleanPath === '' || cleanPath === '.') {
        // Self anchor
        targetHtmlFile = file;
      } else if (cleanPath.startsWith('/')) {
        // Root relative path
        const candidate = path.join(dirPath, cleanPath);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          targetHtmlFile = candidate;
        } else if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          const indexCandidate = path.join(candidate, 'index.html');
          if (fs.existsSync(indexCandidate)) {
            targetHtmlFile = indexCandidate;
          }
        } else {
          // Check candidate + .html
          const htmlCandidate = `${candidate}.html`;
          if (fs.existsSync(htmlCandidate)) {
            targetHtmlFile = htmlCandidate;
          }
        }
      } else {
        // Relative path
        const candidate = path.resolve(path.dirname(file), cleanPath);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          targetHtmlFile = candidate;
        } else if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          const indexCandidate = path.join(candidate, 'index.html');
          if (fs.existsSync(indexCandidate)) {
            targetHtmlFile = indexCandidate;
          }
        } else {
          const htmlCandidate = `${candidate}.html`;
          if (fs.existsSync(htmlCandidate)) {
            targetHtmlFile = htmlCandidate;
          }
        }
      }

      if (!targetHtmlFile || !fs.existsSync(targetHtmlFile)) {
        brokenLinks.push({
          file: relSource,
          link,
          reason: 'Target file or asset not found'
        });
        continue;
      }

      // If anchor specified and target is an HTML file, verify ID exists
      if (hash && targetHtmlFile.endsWith('.html')) {
        const knownIds = fileIdMap.get(targetHtmlFile);
        if (knownIds && !knownIds.has(hash)) {
          brokenLinks.push({
            file: relSource,
            link,
            reason: `Target element with ID or name #${hash} not found in ${path.relative(dirPath, targetHtmlFile)}`
          });
        }
      }
    }
  }

  return { totalLinks, brokenLinks };
}

// =====================================================================
// CLI & CHILD PROCESS EXECUTION HELPER
// =====================================================================

/**
 * Runs a Node command synchronously and captures result
 * @param {string} cmd 
 * @param {string[]} args 
 * @param {import('node:child_process').SpawnSyncOptions} options 
 */
export function runCommand(cmd, args = [], options = {}) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf-8',
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...options.env },
    timeout: options.timeout || 120000
  });

  return {
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    error: res.error
  };
}

// =====================================================================
// TEST SUITE ACCUMULATOR & RUNNER HARNESS
// =====================================================================

export class TestHarness {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.tests = [];
    this.currentGroup = 'General';
  }

  group(groupName) {
    this.currentGroup = groupName;
  }

  async test(name, fn) {
    const testRecord = {
      group: this.currentGroup,
      name,
      status: 'PENDING',
      durationMs: 0,
      error: null
    };
    this.tests.push(testRecord);

    const start = Date.now();
    try {
      await fn();
      testRecord.status = 'PASS';
      testRecord.durationMs = Date.now() - start;
    } catch (err) {
      testRecord.status = 'FAIL';
      testRecord.durationMs = Date.now() - start;
      testRecord.error = err;
    }
  }

  getSummary() {
    const passed = this.tests.filter(t => t.status === 'PASS').length;
    const failed = this.tests.filter(t => t.status === 'FAIL').length;
    const total = this.tests.length;
    return {
      suiteName: this.suiteName,
      total,
      passed,
      failed,
      tests: this.tests
    };
  }

  printResults() {
    console.log(`\n================================================================`);
    console.log(`SUITE: ${this.suiteName}`);
    console.log(`================================================================`);
    
    let currentGrp = '';
    for (const t of this.tests) {
      if (t.group !== currentGrp) {
        currentGrp = t.group;
        console.log(`\n  [Group] ${currentGrp}`);
      }
      const symbol = t.status === 'PASS' ? '✓' : '✗';
      const colorTag = t.status === 'PASS' ? '[PASS]' : '[FAIL]';
      console.log(`    ${symbol} ${colorTag} ${t.name} (${t.durationMs}ms)`);
      if (t.error) {
        console.log(`        Error: ${t.error.message}`);
        if (t.error.stack) {
          const lines = t.error.stack.split('\n').slice(1, 3);
          console.log(`        Stack: ${lines.join('\n        ')}`);
        }
      }
    }

    const { total, passed, failed } = this.getSummary();
    console.log(`\n----------------------------------------------------------------`);
    console.log(`Suite Summary: Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`----------------------------------------------------------------\n`);
  }
}
