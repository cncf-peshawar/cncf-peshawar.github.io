#!/usr/bin/env node

/**
 * scripts/check-links.mjs
 *
 * Zero-dependency Static Link & Asset Integrity Checker.
 * Crawls static HTML build output in dist/ (or custom directory) and verifies:
 * 1. All internal <a href="..."> routes resolve to valid files or directories with index.html.
 * 2. All internal <link href="..."> and <img src="..."> / <script src="..."> assets resolve.
 * 3. All anchor fragments (#id) resolve to matching elements (id or name) on target pages.
 * 4. Ignores external URLs (http:, https:, mailto:, tel:, javascript:, etc.).
 *
 * Exit code 0 if all internal links are valid, exit code 1 if broken links are detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseArgs(args) {
  let dir = 'dist';
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/check-links.mjs [options] [directory]

Options:
  --dir, -d <path>   Target directory containing static build output (default: dist)
  --verbose, -v      Print all verified links
  --help, -h         Show help message
`);
      process.exit(0);
    } else if (arg === '--dir' || arg === '-d') {
      if (i + 1 < args.length) {
        dir = args[++i];
      }
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (!arg.startsWith('-')) {
      dir = arg;
    }
  }

  return { dir, verbose };
}

function getAllHtmlFiles(dir) {
  let htmlFiles = [];
  if (!fs.existsSync(dir)) {
    return htmlFiles;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      htmlFiles = htmlFiles.concat(getAllHtmlFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
      htmlFiles.push(fullPath);
    }
  }

  return htmlFiles;
}

function stripNonHtmlBlocks(html) {
  return html
    .replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

function extractLinksFromHtml(htmlContent) {
  const cleanHtml = stripNonHtmlBlocks(htmlContent);
  const links = [];

  // href attributes
  const hrefRegex = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;
  while ((match = hrefRegex.exec(cleanHtml)) !== null) {
    const url = match[1] ?? match[2] ?? match[3];
    if (url) links.push({ url: url.trim(), attribute: 'href' });
  }

  // src attributes
  const srcRegex = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  while ((match = srcRegex.exec(cleanHtml)) !== null) {
    const url = match[1] ?? match[2] ?? match[3];
    if (url) links.push({ url: url.trim(), attribute: 'src' });
  }

  // poster attributes (video)
  const posterRegex = /\bposter\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  while ((match = posterRegex.exec(cleanHtml)) !== null) {
    const url = match[1] ?? match[2] ?? match[3];
    if (url) links.push({ url: url.trim(), attribute: 'poster' });
  }

  // srcset attributes
  const srcsetRegex = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  while ((match = srcsetRegex.exec(cleanHtml)) !== null) {
    const val = match[1] ?? match[2];
    if (val) {
      const entries = val.split(',');
      for (const entry of entries) {
        const item = entry.trim().split(/\s+/)[0];
        if (item) links.push({ url: item.trim(), attribute: 'srcset' });
      }
    }
  }

  return links;
}

function extractElementIdentifiers(htmlContent) {
  const cleanHtml = stripNonHtmlBlocks(htmlContent);
  const identifiers = new Set();

  // id="..." or id='...' or id=unquoted
  const idRegex = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;
  while ((match = idRegex.exec(cleanHtml)) !== null) {
    const val = match[1] ?? match[2] ?? match[3];
    if (val) identifiers.add(val);
  }

  // name="..." or name='...' or name=unquoted (legacy anchor names)
  const nameRegex = /\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  while ((match = nameRegex.exec(cleanHtml)) !== null) {
    const val = match[1] ?? match[2] ?? match[3];
    if (val) identifiers.add(val);
  }

  return identifiers;
}

function isExternalOrIgnored(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  // External schemes
  if (/^(https?:|mailto:|tel:|javascript:|data:|blob:|sms:|irc:|ftp:|ftps:|urn:)/i.test(trimmed)) {
    return true;
  }

  // Protocol-relative URLs (//example.com)
  if (trimmed.startsWith('//')) {
    return true;
  }

  return false;
}

function resolveTargetFile(urlPath, currentFile, distDir) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    decodedPath = urlPath;
  }

  let basePath;
  if (decodedPath.startsWith('/')) {
    basePath = path.join(distDir, decodedPath);
  } else {
    basePath = path.resolve(path.dirname(currentFile), decodedPath);
  }

  // 1. Direct file or directory match
  if (fs.existsSync(basePath)) {
    try {
      const stat = fs.statSync(basePath);
      if (stat.isFile()) {
        const isHtml = basePath.endsWith('.html') || basePath.endsWith('.htm');
        return { found: true, filePath: basePath, isHtml };
      }
      if (stat.isDirectory()) {
        const indexHtml = path.join(basePath, 'index.html');
        if (fs.existsSync(indexHtml) && fs.statSync(indexHtml).isFile()) {
          return { found: true, filePath: indexHtml, isHtml: true };
        }
        const indexHtm = path.join(basePath, 'index.htm');
        if (fs.existsSync(indexHtm) && fs.statSync(indexHtm).isFile()) {
          return { found: true, filePath: indexHtm, isHtml: true };
        }
      }
    } catch {
      // stat failure fallback
    }
  }

  // 2. basePath + .html
  const withHtml = basePath + '.html';
  if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) {
    return { found: true, filePath: withHtml, isHtml: true };
  }

  // 3. basePath + /index.html
  const withIndexHtml = path.join(basePath, 'index.html');
  if (fs.existsSync(withIndexHtml) && fs.statSync(withIndexHtml).isFile()) {
    return { found: true, filePath: withIndexHtml, isHtml: true };
  }

  return { found: false, attemptedPath: basePath };
}

export function checkLinks({ dir = 'dist', verbose = false } = {}) {
  const targetDir = path.resolve(process.cwd(), dir);

  if (!fs.existsSync(targetDir)) {
    return {
      success: false,
      error: `Directory not found: "${targetDir}". Please run "npm run build" first.`,
      htmlFilesCount: 0,
      totalChecked: 0,
      brokenLinks: []
    };
  }

  const htmlFiles = getAllHtmlFiles(targetDir);
  if (htmlFiles.length === 0) {
    return {
      success: false,
      error: `No HTML files found in directory: "${targetDir}".`,
      htmlFilesCount: 0,
      totalChecked: 0,
      brokenLinks: []
    };
  }

  const brokenLinks = [];
  let totalChecked = 0;

  // Cache identifiers per HTML file to optimize anchor checks
  const htmlIdentifiersCache = new Map();

  function getIdentifiers(filePath) {
    if (htmlIdentifiersCache.has(filePath)) {
      return htmlIdentifiersCache.get(filePath);
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const identifiers = extractElementIdentifiers(content);
      htmlIdentifiersCache.set(filePath, identifiers);
      return identifiers;
    } catch {
      return new Set();
    }
  }

  for (const file of htmlFiles) {
    const relSourceFile = path.relative(targetDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const links = extractLinksFromHtml(content);

    for (const link of links) {
      const rawUrl = link.url;
      if (isExternalOrIgnored(rawUrl)) {
        continue;
      }

      totalChecked++;

      // Split path, query, and fragment
      const [withoutHash, hash] = rawUrl.split('#');
      const cleanPath = (withoutHash || '').split('?')[0].trim();

      // Case 1: Same-page anchor (e.g. href="#features" or href="#")
      if (!cleanPath && hash !== undefined) {
        if (!hash || hash === 'top') {
          // Empty anchor # or #top represents top of page, always valid
          continue;
        }

        const decodedAnchor = decodeURIComponent(hash);
        const identifiers = getIdentifiers(file);
        if (!identifiers.has(decodedAnchor) && !identifiers.has(hash)) {
          brokenLinks.push({
            sourceFile: relSourceFile,
            url: rawUrl,
            attribute: link.attribute,
            reason: `Target anchor "#${decodedAnchor}" not found in current page`
          });
        }
        continue;
      }

      // Case 2: Link with path (may also include anchor)
      const resolution = resolveTargetFile(cleanPath, file, targetDir);

      if (!resolution.found) {
        brokenLinks.push({
          sourceFile: relSourceFile,
          url: rawUrl,
          attribute: link.attribute,
          reason: `Target file or route does not exist: "${cleanPath}"`
        });
        continue;
      }

      if (verbose) {
        console.log(`  ✓ Verified [${relSourceFile}] -> ${rawUrl}`);
      }

      // If target file exists and an anchor was specified
      if (hash !== undefined && hash !== '' && hash !== 'top' && resolution.isHtml) {
        let decodedAnchor;
        try {
          decodedAnchor = decodeURIComponent(hash);
        } catch {
          decodedAnchor = hash;
        }

        const identifiers = getIdentifiers(resolution.filePath);
        if (!identifiers.has(decodedAnchor) && !identifiers.has(hash)) {
          const relTarget = path.relative(targetDir, resolution.filePath);
          brokenLinks.push({
            sourceFile: relSourceFile,
            url: rawUrl,
            attribute: link.attribute,
            reason: `Target anchor "#${decodedAnchor}" not found in "${relTarget}"`
          });
        }
      }
    }
  }

  return {
    success: brokenLinks.length === 0,
    targetDir,
    htmlFilesCount: htmlFiles.length,
    totalChecked,
    brokenLinks
  };
}

// CLI runner
if (process.argv[1] && (path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname) || process.argv[1].endsWith('check-links.mjs'))) {
  const { dir, verbose } = parseArgs(process.argv.slice(2));

  console.log(`🔍 Scanning static build output in "${dir}" for link & asset integrity...`);
  const result = checkLinks({ dir, verbose });

  if (result.error) {
    console.error(`❌ Error: ${result.error}`);
    process.exit(1);
  }

  console.log(`📄 Scanned ${result.htmlFilesCount} HTML pages.`);
  console.log(`🔗 Verified ${result.totalChecked} internal links and assets.`);

  if (result.brokenLinks.length > 0) {
    console.error(`\n❌ Found ${result.brokenLinks.length} broken link(s):\n`);
    for (const item of result.brokenLinks) {
      console.error(`  - Source: ${item.sourceFile}`);
      console.error(`    Link:   <... ${item.attribute}="${item.url}" ...>`);
      console.error(`    Reason: ${item.reason}\n`);
    }
    process.exit(1);
  } else {
    console.log(`\n✅ 0 broken internal links! Static site integrity successfully verified.`);
    process.exit(0);
  }
}

export {
  parseArgs,
  getAllHtmlFiles,
  extractLinksFromHtml,
  extractElementIdentifiers,
  isExternalOrIgnored,
  resolveTargetFile
};
