#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function parseArgs() {
  const args = process.argv.slice(2);
  let distDir = null;
  let outFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && i + 1 < args.length) {
      outFile = args[i + 1];
      i++;
    } else if (!distDir && !args[i].startsWith('--')) {
      distDir = args[i];
    }
  }

  if (!distDir) {
    distDir = 'dist';
  }

  return { distDir, outFile };
}

function findHtmlFiles(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relFromBase = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    // Skip admin directory completely
    if (relFromBase === 'admin' || relFromBase.startsWith('admin/')) {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(findHtmlFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function normaliseRoute(relPath) {
  let p = relPath.replace(/\\/g, '/');
  if (p.startsWith('/')) p = p.slice(1);
  if (p === 'index.html') return '/';
  if (p.endsWith('/index.html')) {
    return '/' + p.slice(0, -'index.html'.length);
  }
  if (p.endsWith('.html')) {
    return '/' + p.slice(0, -'.html'.length);
  }
  return '/' + p;
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripTags(s) {
  if (!s) return '';
  return decodeHtmlEntities(s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function parseAttributes(attrStr) {
  const attrs = {};
  if (!attrStr) return attrs;
  const regex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = regex.exec(attrStr)) !== null) {
    const key = m[1].toLowerCase();
    const val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : ''));
    attrs[key] = val;
  }
  return attrs;
}

export function extractParity(html, route) {
  // 1. Title
  let title = '';
  const titleMatch = html.match(/<title(?:\s+[^>]*)?>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = stripTags(titleMatch[1]);
  }

  // 2. Meta (all <meta> + <link rel="canonical">)
  const meta = [];
  const metaMatches = html.matchAll(/<meta([\s\S]*?)\/?>/gi);
  for (const m of metaMatches) {
    const a = parseAttributes(m[1]);
    const item = {};
    if (a.name) item.name = a.name;
    if (a.property) item.property = a.property;
    if (a['http-equiv']) item['http-equiv'] = a['http-equiv'];
    if (a.charset) item.charset = a.charset;
    if (a.content !== undefined) item.content = a.content;
    meta.push(item);
  }

  // Canonical link in meta
  const canMatches = html.matchAll(/<link([\s\S]*?)\/?>/gi);
  for (const m of canMatches) {
    const a = parseAttributes(m[1]);
    if (a.rel && a.rel.toLowerCase().trim() === 'canonical' && a.href) {
      meta.push({ rel: 'canonical', href: a.href.trim() });
    }
  }
  meta.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  // 3. Links (<link rel=... href=...>)
  const links = [];
  const linkMatches = html.matchAll(/<link([\s\S]*?)\/?>/gi);
  for (const m of linkMatches) {
    const a = parseAttributes(m[1]);
    if (a.href) {
      links.push({
        rel: a.rel || '',
        href: a.href.trim()
      });
    }
  }
  links.sort((a, b) => ((a.rel + ':' + a.href).localeCompare(b.rel + ':' + b.href)));

  // 4. Scripts (<script src=...>)
  const scripts = [];
  const scriptMatches = html.matchAll(/<script([\s\S]*?)>/gi);
  for (const m of scriptMatches) {
    const a = parseAttributes(m[1]);
    if (a.src) {
      const item = { src: a.src.trim() };
      if (a.type) item.type = a.type.trim();
      scripts.push(item);
    }
  }
  scripts.sort((a, b) => ((a.src + ':' + (a.type || '')).localeCompare(b.src + ':' + (b.type || ''))));

  // 5. Anchors (<a href=...>)
  const anchors = [];
  const anchorMatches = html.matchAll(/<a([\s\S]*?)>([\s\S]*?)<\/a>/gi);
  for (const m of anchorMatches) {
    const a = parseAttributes(m[1]);
    if (a.href !== undefined) {
      anchors.push({
        href: a.href.trim(),
        text: stripTags(m[2])
      });
    }
  }
  anchors.sort((a, b) => ((a.href + ':' + a.text).localeCompare(b.href + ':' + b.text)));

  // 6. IDs (all unique ids in the document)
  const idSet = new Set();
  const idRegex = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let idM;
  while ((idM = idRegex.exec(html)) !== null) {
    const val = (idM[1] || idM[2] || idM[3] || '').trim();
    if (val) idSet.add(val);
  }
  const ids = Array.from(idSet).sort();

  // 7 & 8. Data and Aria attributes on tags
  const dataAttrs = [];
  const ariaAttrs = [];
  const tagRegex = /<([a-zA-Z0-9:-]+)(\s+[^>]*)?>/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(html)) !== null) {
    const tag = tagMatch[1].toLowerCase();
    if (tag === 'script' || tag === 'style') continue;

    const rawAttrs = tagMatch[2] || '';
    const attrs = parseAttributes(rawAttrs);

    // data-* excluding data-astro-* compiler hashes
    const dAttrs = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith('data-') && !k.startsWith('data-astro-')) {
        dAttrs[k] = v;
      }
    }
    if (Object.keys(dAttrs).length > 0) {
      let sel = tag;
      if (attrs.id) sel += '#' + attrs.id;
      else if (attrs.class) sel += '.' + attrs.class.trim().split(/\s+/)[0];
      dataAttrs.push({ selector: sel, attrs: dAttrs });
    }

    // aria-*
    const aAttrs = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith('aria-')) {
        aAttrs[k] = v;
      }
    }
    if (Object.keys(aAttrs).length > 0) {
      let sel = tag;
      if (attrs.id) sel += '#' + attrs.id;
      else if (attrs.class) sel += '.' + attrs.class.trim().split(/\s+/)[0];
      ariaAttrs.push({ selector: sel, attrs: aAttrs });
    }
  }
  dataAttrs.sort((a, b) => ((a.selector + ':' + JSON.stringify(a.attrs)).localeCompare(b.selector + ':' + JSON.stringify(b.attrs))));
  ariaAttrs.sort((a, b) => ((a.selector + ':' + JSON.stringify(a.attrs)).localeCompare(b.selector + ':' + JSON.stringify(b.attrs))));

  // 9. Forms (<form>...)
  const forms = [];
  const formMatches = html.matchAll(/<form([\s\S]*?)>([\s\S]*?)<\/form>/gi);
  for (const fm of formMatches) {
    const fAttrs = parseAttributes(fm[1]);
    const innerHtml = fm[2];
    const fields = [];

    const fieldMatches = innerHtml.matchAll(/<(input|select|textarea|button)([\s\S]*?)(?:>([\s\S]*?)<\/\1>|\/?>)/gi);
    for (const fld of fieldMatches) {
      const fTag = fld[1].toLowerCase();
      const a = parseAttributes(fld[2]);
      const item = {
        tag: fTag,
        id: a.id || '',
        name: a.name || '',
        type: a.type || (fTag === 'button' ? 'submit' : fTag === 'input' ? 'text' : '')
      };
      if (a.value !== undefined) {
        item.value = a.value;
      }
      if (fTag === 'select') {
        const optMatches = (fld[3] || '').matchAll(/<option([\s\S]*?)>([\s\S]*?)<\/option>/gi);
        const options = [];
        for (const opt of optMatches) {
          const optA = parseAttributes(opt[1]);
          const optVal = optA.value !== undefined ? optA.value : stripTags(opt[2]);
          options.push(optVal);
        }
        item.options = options;
      }
      fields.push(item);
    }

    forms.push({
      id: fAttrs.id || '',
      action: fAttrs.action || '',
      method: (fAttrs.method || 'GET').toUpperCase(),
      fields
    });
  }

  // 10. Headings (in document order)
  const headings = [];
  const headingMatches = html.matchAll(/<h([1-6])(?:\s+[^>]*)?>([\s\S]*?)<\/h\1>/gi);
  for (const hm of headingMatches) {
    headings.push({
      level: parseInt(hm[1], 10),
      text: stripTags(hm[2])
    });
  }

  // 11. Images
  const images = [];
  const imgMatches = html.matchAll(/<img([\s\S]*?)\/?>/gi);
  for (const m of imgMatches) {
    const a = parseAttributes(m[1]);
    if (a.src) {
      images.push({
        src: a.src.trim(),
        alt: a.alt !== undefined ? a.alt.trim() : ''
      });
    }
  }
  images.sort((a, b) => ((a.src + ':' + a.alt).localeCompare(b.src + ':' + b.alt)));

  return {
    route,
    title,
    meta,
    links,
    scripts,
    anchors,
    ids,
    dataAttrs,
    ariaAttrs,
    forms,
    headings,
    images
  };
}

export function generateSnapshot(distDir) {
  const resolvedDist = path.resolve(process.cwd(), distDir);
  const htmlFiles = findHtmlFiles(resolvedDist, resolvedDist);
  htmlFiles.sort();

  const snapshot = {};
  for (const filePath of htmlFiles) {
    const relPath = path.relative(resolvedDist, filePath);
    const route = normaliseRoute(relPath);
    const content = fs.readFileSync(filePath, 'utf8');
    snapshot[route] = extractParity(content, route);
  }

  // Deterministic sorting of route keys
  const sortedSnapshot = {};
  for (const k of Object.keys(snapshot).sort()) {
    sortedSnapshot[k] = snapshot[k];
  }
  return sortedSnapshot;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { distDir, outFile } = parseArgs();
  const result = generateSnapshot(distDir);
  const jsonOutput = JSON.stringify(result, null, 2) + '\n';

  if (outFile) {
    const outDir = path.dirname(path.resolve(process.cwd(), outFile));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, jsonOutput, 'utf8');
  } else {
    process.stdout.write(jsonOutput);
  }
}
