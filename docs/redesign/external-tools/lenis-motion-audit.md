# Supply-Chain Security Audit: `lenis` & `motion`

> **Task ID:** `T-3.5-SEC-AUDIT`  
> **Agent Role:** `SECURITY`  
> **Target Branch:** `redesign/ui-motherduck`  
> **Audit Date:** 2026-10-09  
> **Review Methodology:** NVIDIA SkillSpector / skill-inspector manual fallback (read-only registry, script, dist grep, and AST/bundle analysis; static CLI unavailable)  
> **Scope:** Shipped dist files under `node_modules/lenis/dist/` and `node_modules/motion/dist/`, npm registry metadata, upstream repo health, lifecycle hooks, and client bundle weight contributions.

---

## 1. Executive Verdict Summary

| Package | Installed Version | Declared License | Weekly Downloads | Repo Stars / Activity | Install Lifecycle Scripts | Network / Telemetry / Eval / Dynamic Imports | Bundle Weight (Minified / Gzip) | Verdict |
|---|---|---|---|---|---|---|---|---|
| **`lenis`** | `1.3.26` | `MIT` | 1,732,624 | 16,309 ★ / Active (pushed Oct 2026) | None (0 hooks) | 0 network, 0 telemetry, 0 eval, 0 dynamic imports | 18.63 KB / 5.42 KB (JS) + 0.51 KB / 0.27 KB (CSS) | **APPROVE** |
| **`motion`** | `14.0.0` | `MIT` | 24,016,019 | 33,916 ★ / Active (pushed Oct 2026) | None (0 hooks) | 0 network, 0 telemetry, 0 eval, 0 dynamic imports | 55.91 KB / 20.72 KB (tree-shaken consumer) | **APPROVE** |

---

## 2. Target 1: `lenis` (`v1.3.26`)

### 2.1 NPM Registry Metadata & Ownership
- **Package Name:** `lenis`
- **Resolved Version:** `1.3.26` (matches `package.json` specification `^1.3.26`)
- **License:** `MIT` (permissive, commercial & redistribution allowed)
- **Maintainers:**
  - `clementroche <rchclement@gmail.com>`
  - `feledori <info@felixmayr.it>`
- **Weekly Downloads:** 1,732,624 (npm downloads API last-week endpoint)
- **Upstream Repository:** `https://github.com/darkroomengineering/lenis`
- **Homepage:** `https://github.com/darkroomengineering/lenis`
- **Description:** "How smooth scroll should be"

### 2.2 Repository Health & Activity
- **Stars:** 16,309
- **Open Issues:** 31
- **Last Push Timestamp:** `2026-10-02T10:59:52Z`
- **Archived / Deprecated:** No (`archived: false`)
- **Organizational Backing:** Darkroom Engineering (studio behind high-performance web experiences)

### 2.3 Install & Lifecycle Scripts (`npm view lenis scripts`)
Inspection of registry metadata and local `package.json`:
```json
{
  "dev": "bun run --parallel dev:build dev:playground",
  "build": "tsdown",
  "readme": "node ./scripts/update-readme.js",
  "dev:nuxt": "bun --filter playground-nuxt dev",
  "dev:build": "tsdown --watch",
  "postversion": "bun run build && bun run readme",
  "publish:dev": "npm publish --tag dev",
  "version:dev": "npm version prerelease --preid dev --force --no-git-tag-version",
  "publish:main": "npm publish",
  "version:major": "npm version major --force --no-git-tag-version",
  "version:minor": "npm version minor --force --no-git-tag-version",
  "version:patch": "npm version patch --force --no-git-tag-version",
  "dev:playground": "bun --filter playground dev"
}
```
- **Lifecycle hooks:** **ZERO** install-time scripts (`preinstall`, `install`, `postinstall`, `prepublish` are completely absent).
- **Execution Risk at Install:** None.

### 2.4 Shipped Dist Code Grep Inspection (`node_modules/lenis/dist/`)
Exhaustive grep across all shipped production files (`lenis.min.js`, `lenis.mjs`, `lenis.js`, `lenis-snap.*`, `lenis.css`):
1. **Network Calls:**
   - Search pattern: `\bfetch\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b`
   - Result: **0 matches**
2. **Telemetry / Tracking:**
   - Search pattern: `\btelemetry\b|\banalytics\b|\btracking\b`
   - Result: **0 matches** (ignoring inert substring matches like `damping` or `snapping`)
3. **External URLs:**
   - Search pattern: `https?://`
   - Result: 2 inert documentation links in comments:
     - `http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/`
     - `https://anguscroll.com/just/just-modulo`
   - Zero active outbound network calls.
4. **Code Execution Primitives / Eval:**
   - Search pattern: `\beval\(|new\s+Function|\bwindow\.eval|\bglobal\.eval`
   - Result: **0 matches**
5. **Dynamic Imports:**
   - Search pattern: `\bimport\s*\(|__import`
   - Result: **0 matches**
6. **OS / Filesystem / Host Storage Access:**
   - Search pattern: `\bprocess\.env\b|\bchild_process\b|\bfs\b|\blocalStorage\b|\bsessionStorage\b|\bdocument\.cookie\b`
   - Result: **0 matches**

### 2.5 Bundle Weight Contribution
- **Standalone Minified Distribution (`lenis.min.js`):** 18,722 bytes (18.28 KB uncompressed)
- **Standalone Gzipped Distribution:** 5,444 bytes (5.32 KB gzip)
- **Shipped CSS (`lenis.css`):** 513 bytes uncompressed (269 bytes gzip)
- **Tree-Shaken Consumer (`Lenis` class used in `src/scripts/motion.ts`):** 18,629 bytes minified, 5,417 bytes (5.29 KB gzip)

---

## 3. Target 2: `motion` (`v14.0.0`)

### 3.1 NPM Registry Metadata & Ownership
- **Package Name:** `motion`
- **Resolved Version:** `14.0.0` (matches `package.json` specification `^14.0.0`)
- **License:** `MIT` (permissive, commercial & redistribution allowed)
- **Author:** Matt Perry
- **Maintainers:**
  - `popmotion <mattgperry@gmail.com>`
  - `motionone <matt@motion.dev>`
- **Weekly Downloads:** 24,016,019 (npm downloads API last-week endpoint)
- **Upstream Repository:** `https://github.com/motiondivision/motion`
- **Homepage:** `https://github.com/motiondivision/motion#readme`
- **Description:** "An animation library for JavaScript and React."

### 3.2 Repository Health & Activity
- **Stars:** 33,916
- **Open Issues:** 49
- **Last Push Timestamp:** `2026-10-09T18:20:26Z`
- **Archived / Deprecated:** No (`archived: false`)
- **Ecosystem Standing:** Standard industry tier-1 web animation library (formerly Framer Motion / Motion One, unified under `motion` v12–v14).

### 3.3 Install & Lifecycle Scripts (`npm view motion scripts`)
Inspection of registry metadata and local `package.json`:
```json
{
  "dev": "concurrently -c blue,red -n tsc,rollup --kill-others \"tsc --watch -p . --preserveWatchOutput\" \"rollup --config --watch --no-watch.clearScreen\"",
  "test": "jest --config jest.config.json --max-workers=2",
  "build": "yarn clean && tsc -p . && rollup -c",
  "clean": "rm -rf types dist lib",
  "prepack": "yarn build",
  "postpublish": "git push --tags"
}
```
- **Lifecycle hooks:** **ZERO** install-time scripts (`preinstall`, `install`, `postinstall`, `prepublish` are completely absent).
- **Execution Risk at Install:** None.

### 3.4 Shipped Dist Code Grep Inspection (`node_modules/motion/dist/` & `node_modules/framer-motion/dist/`)
Exhaustive grep across all shipped production files (`motion.js`, `motion.dev.js`, `dist/es/*`, and re-exported `framer-motion/dom`):
1. **Network Calls:**
   - Search pattern: `\bfetch\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b`
   - Result: **0 matches**
2. **Telemetry / Tracking:**
   - Search pattern: `\btelemetry\b|\banalytics\b|\bsendBeacon\b`
   - Result: **0 matches**
3. **External URLs:**
   - Search pattern: `https?://`
   - Result:
     - `https://motion.dev/trouble` (embedded troubleshooting link in console warning messages)
     - `https://github.com/gre/bezier-easing` (inert attribution in dev comments)
     - `http://codepen.io/...` / `https://www.youtube.com/...` (dev demo links in comments)
   - Zero active outbound network calls.
4. **Code Execution Primitives / Eval:**
   - Search pattern: `\beval\(|new\s+Function|\bwindow\.eval|\bglobal\.eval`
   - Result: **0 matches**
5. **Dynamic Imports:**
   - Search pattern: `\bimport\s*\(|__import`
   - Result: **0 matches** (only matches were in comment blocks explaining `<LazyMotion features={() => import('./path/to/domAnimation')}>` and comment `IDE auto-import (see #3432)`)
6. **OS / Filesystem / Host Storage Access:**
   - Search pattern: `\bprocess\.env\b|\bchild_process\b|\bfs\b|\blocalStorage\b|\bsessionStorage\b|\bdocument\.cookie\b`
   - Result: **0 matches**

### 3.5 Bundle Weight Contribution
- **Full Browser Distribution (`motion.js`):** 143,867 bytes (140.50 KB uncompressed), 47,694 bytes (46.58 KB gzip)
- **Tree-Shaken Consumer (`import { animate, inView, stagger } from 'motion'` used in `src/scripts/motion.ts`):** 55,908 bytes minified (54.60 KB uncompressed), 20,722 bytes (20.24 KB gzip)
- **Project Combined Client Bundle (`dist/_astro/BaseLayout.*.js` including Lenis + Motion + Site logic):** 76,241 bytes minified, 25,896 bytes (25.29 KB gzip)
  - Budget: **35.00 KB gzip**
  - Actual: **25.29 KB gzip**
  - Margin: **9.71 KB headroom remaining**

---

## 4. Supply-Chain & Vulnerability Database Audit

Execution of `npm audit` on the project dependency tree:
- **`lenis` (1.3.26):** **0 vulnerabilities**
- **`motion` (14.0.0):** **0 vulnerabilities**
- **Transitive `framer-motion` (14.0.0):** **0 vulnerabilities**

*(Note: Pre-existing advisory hits in repository belong exclusively to base Astro 5.3 build-time dependencies, completely separate from runtime client libraries).*

---

## 5. Security Diagnoses & Architectural Guardrails

### 5.1 Diagnosis
Both packages demonstrate exemplary supply-chain posture:
1. Zero lifecycle hooks prevent post-clone / post-install code execution.
2. Zero network calls, telemetry beacons, or external data transmission exist in the shipped client distribution files.
3. No code execution primitives (`eval`, `new Function`) or arbitrary module loaders (`import()`) exist in runtime paths.
4. Both packages are published under standard, unencumbered MIT licenses by well-known, high-reputation maintainers in the frontend ecosystem.
5. Combined runtime weight (25.29 KB gzip) comfortably respects the project performance budget (< 35 KB gzip).

### 5.2 Architectural Guardrails
1. **Preserve Pinned / Semantic Ranges:** Maintain `lenis: ^1.3.26` and `motion: ^14.0.0` with strict lockfile verification in CI (`package-lock.json`).
2. **Lockfile Integrity:** Forbid `npm install --ignore-scripts=false` or arbitrary unpinned updates in automated PR workflows.
3. **Motion Safety Fallback:** Ensure `src/styles/motion.css` and `src/scripts/motion.ts` retain reduced-motion overrides (`@media (prefers-reduced-motion: reduce)`) disabling Lenis and Motion instances for accessibility compliance.
