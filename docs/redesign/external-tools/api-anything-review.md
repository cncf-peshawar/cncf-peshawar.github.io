# External Tool Evaluation: `goodnight000/api-anything`

> **Evaluation Date:** 2026-10-09  
> **Auditor Role:** `RECON` (T-1.3-RECON)  
> **Target Repository:** [github.com/goodnight000/api-anything](https://github.com/goodnight000/api-anything)  
> **Inspected Commit/Ref:** `main` (commit `9b98687`, 2026-10-02)  
> **Inspection Sandbox:** `/tmp/api-anything-review` (read-only audit; zero execution of target code)

---

## 1. Executive Summary & Verdict

### **Verdict for CNCF Peshawar Redesign:** `REJECT` (Do Not Adopt for this Project)
*(For general external platform reverse-engineering/automation: `CAUTION`)*

| Evaluation Criteria | Finding | Project Fit |
|---|---|---|
| **Primary Mechanism** | Playwright network capture + templated HTTP/browser replay | Redundant with `curl` + `chrome-devtools-mcp` |
| **License Compatibility** | MIT License (`MDc6TGljZW5zZTEz`) | Permissive / Compatible |
| **Package Dependencies** | 5 direct runtime dependencies (`playwright-core`, `@modelcontextprotocol/sdk`, etc.) | Low supply-chain weight, but requires heavy Playwright browser binaries |
| **Sensitive Behaviors** | Reads local browser SQLite cookie DBs & Keychain Safe Storage | High-privilege access; unnecessary for public static web audit |
| **Decisive Capability Fit** | Reverse-engineers dynamic web APIs behind logins | Does **not** inspect CSSOM, compute styles, or capture DevTools snapshots |

---

## 2. Capability Analysis: What It Actually Does

`api-anything` is designed to turn GUI-only web services without public APIs (e.g. Goodreads, Airbnb, Google Flights, LinkedIn) into callable HTTP/JSON endpoints.

### Mechanism:
1. **Learning / Capture Phase (CLI):**
   - Drives headless Chromium via `playwright-core`.
   - Executes user-provided examples (e.g. `--example q=piranesi`), recording outgoing XHR/fetch traffic.
   - Diffs network exchanges across sample runs to detect parameter slots in URL paths, query parameters, headers, and request bodies.
   - Generates and persists declarative JSON site specifications (`~/.api-anything/sites/<site>.json`).
2. **Execution / Replay Engine:**
   - **Tier 1 (Direct HTTP):** Replays templated requests via Node.js native `fetch`.
   - **Tier 2 (In-Page Fetch):** Executes `fetch()` inside a browser origin page (`page.evaluate`) to leverage browser TLS fingerprints and CORS/SameSite cookies.
   - **Tier 3 (Browser Fallback):** Drives full headless browser navigation if direct fetch encounters challenges.
3. **Self-Healing:**
   - Detects schema drift or expired session tokens on response failure and attempts re-capture or cookie re-import.

---

## 3. Security & Vulnerability Audit (Read-Only)

Conducted strictly in `/tmp/api-anything-review` adhering to `SKILL.md` (Skill Inspector manual fallback; SkillSpector static scan CLI not present in environment):

### 3.1 Lifecycle Hooks & Scripts
- Inspected `package.json`:
  - No `preinstall`, `postinstall`, `prepublish`, or custom lifecycle hooks.
  - Build and execution scripts (`npm run build`, `npm run cli`, `npm run test`) are standard TypeScript compilation (`tsc`) and node test runners.

### 3.2 Dependency Tree & Supply Chain
- Direct dependencies:
  - `@modelcontextprotocol/sdk`: `^1.30.1` (Official MCP TypeScript SDK)
  - `node-html-parser`: `^9.0.4` (Lightweight HTML parsing)
  - `playwright-core`: `^1.63.0` (Headless browser automation)
  - `tldts`: `^7.4.16` (Domain/TLD parsing)
  - `zod`: `^4.6.5` (Schema validation)
- DevDependencies: `@types/node`, `tsx`, `typescript`.
- Supply chain risk: **Low**. No known malicious or obfuscated dependencies.

### 3.3 Network Endpoints & Telemetry
- Audited `src/` for hardcoded network calls:
  - **Zero** external analytics, tracking, telemetry, or phone-home endpoints.
  - Network requests are dispatched exclusively to user-specified target domains.

### 3.4 Credential & Local File Access (Elevated Privilege Surface)
- In `src/import.ts` (`importFromBrowsers`), the tool attempts to import session cookies from the host machine:
  - Scans Chromium and Firefox profile directories (`~/.config/google-chrome`, `~/.mozilla/firefox`, macOS `Library/Application Support/...`).
  - Accesses local `Cookies` SQLite databases.
  - On macOS, invokes `execFileSync("security", ["find-generic-password", "-w", "-s", service])` to decrypt Chromium Safe Storage cookies.
  - On Linux, attempts decryption using default password (`peanuts`).
- **Triage Judgment:** While implemented to simplify user auth without requiring manual password entry, accessing host browser profile directories and system keychains is an elevated privilege pattern. In a CI/CD or security-conscious development environment, this behavior requires strict gating.

---

## 4. The Decisive Question: What Does It Offer vs. `curl` + `chrome-devtools-mcp`?

| Dimension | `curl` | `chrome-devtools-mcp` | `goodnight000/api-anything` |
|---|---|---|---|
| **Primary Purpose** | Fetch static assets / HTTP responses | Live browser DOM inspection, CSSOM extraction, visual verification | Reverse-engineering dynamic private Web APIs |
| **Inspection of CSSOM & Computed Styles** | ❌ (Raw text only) | ✅ **Full access** (`getComputedStyle`, CSSOM rules) | ❌ None |
| **Interactive State Simulation (`:hover`, `:active`)** | ❌ None | ✅ **Full support** (pseudo-classes, synthetic dispatch) | ❌ None |
| **Visual Rendering & Screenshots** | ❌ None | ✅ **High-fidelity screenshots** across breakpoints | ❌ None |
| **Setup & Environmental Overhead** | Zero (system native) | Zero (already running in environment) | High (requires Playwright install, global CLI, cookie DB scan) |
| **A11y / Accessibility Auditing** | ❌ None | ✅ **Full support** (AXTree, DevTools audit) | ❌ None |
| **Dynamic Form Replay on Private Sites** | Manual script | Manual evaluate | ✅ Automated parameterization & self-healing |

### Decisive Finding:
For the CNCF Peshawar Redesign project, our objective is front-end reverse-engineering of public design systems (styles, tokens, motion physics, CSS animations, responsive layouts, accessibility).
- `api-anything` provides **zero tools** for measuring computed CSS styles, layout metrics, transition timings, or visual screenshots.
- `curl` fetches public HTML and stylesheets instantly.
- `chrome-devtools-mcp` executes rich DOM queries, samples live CSSOM rules, tests responsive viewports, and captures visual evidence.
- Therefore, `api-anything` adds unnecessary overhead, potential credential exposure risk, and zero value for our design and motion ground truth extraction.

---

## 5. Hypothetical Proposal (If Adopted Outside this Project)

If an external project requires using `api-anything` as an MCP server for backend web data extraction, here is the proposed configuration:

### Proposed `.agents/mcp.json` Snippet (DO NOT APPLY TO THIS REPO):
```json
{
  "mcpServers": {
    "api-anything": {
      "command": "npx",
      "args": ["-y", "github:goodnight000/api-anything", "mcp"],
      "disabled": false,
      "autoApprove": [
        "list_sites",
        "list_operations"
      ]
    }
  }
}
```

### Required Setup Steps:
1. Ensure Node.js `>= 22.13.0` is installed.
2. Initialize site operations via CLI before MCP usage (MCP cannot create operations).
3. If mutations/writes are needed, server must be started with `--allow-writes`.

---

## 6. Final Decision & Policy

**FINAL VERDICT:** REJECTED — DO NOT APPLY the mcp.json snippet. This tool is forbidden from this repository and its configuration will not be merged.

