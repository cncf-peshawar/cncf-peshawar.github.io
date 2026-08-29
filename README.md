# Cloud Native Peshawar — Official Website & Community Portal

[![Astro 5](https://img.shields.io/badge/Built%20with-Astro%205-FF5D01?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![CNCF Community](https://img.shields.io/badge/CNCF-Open%20Community%20Groups-0086FF?style=flat-square&logo=cncf&logoColor=white)](https://ocgroups.dev/cncf/group/6vwk2n4)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222222?style=flat-square&logo=githubpages&logoColor=white)](https://pages.github.com)
[![100% Free](https://img.shields.io/badge/Cost-%240%20(Free%20Forever)-10B981?style=flat-square)](https://github.com/Cloud-Native-Peshawar/cncf-peshawar-website)
[![CMS](https://img.shields.io/badge/CMS-Sveltia%20%2F%20Decap-6366F1?style=flat-square)](https://github.com/sveltia/sveltia-cms)

The official website, speaker hub, sponsorship prospectus, and content management portal for **Cloud Native Peshawar**—the official Cloud Native Computing Foundation (CNCF) community group in Khyber Pakhtunkhwa, Pakistan.

- **Official Chapter on Open Community Groups**: [https://ocgroups.dev/cncf/group/6vwk2n4](https://ocgroups.dev/cncf/group/6vwk2n4)
- **Inaugural Event (CNCF Genesis)**: [https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa](https://ocgroups.dev/cncf/group/6vwk2n4/event/z7sb6wa) · [Luma Event](https://luma.com/shufbsm5)

---

## 🌟 Key Features

- **100% Free & Zero Maintenance Cost**: Hosted on **GitHub Pages** with automated CI/CD via **GitHub Actions**.
- **Modern-Minimal / Cobalt Design (/hallmark)**: Clean anti-AI-slop typography (`Space Grotesk`, `Inter`, `JetBrains Mono`), locked OKLCH color tokens, 8-state interactive components, and responsive mobile layout.
- **Git-Backed Headless CMS (`/admin`)**: Powered by **Sveltia CMS**—organizers can visually publish events, speaker profiles, partner logos, and blog recaps directly to GitHub.
- **Dedicated Sponsor Prospectus (`/sponsors`)**: Sponsorship tiers (Venue Host, Refreshment Partner, Swag Partner, Annual Ecosystem Partner) and sponsor ROI benefits.
- **Open Call for Proposals (`/speak`)**: Dedicated speaker hub supporting 15-min Lightning Talks, 40-min Deep Dives, and 90-min Hands-on Workshops.
- **Event Archives (`/events`)**: Complete archive with slides, YouTube recordings, and Open Community Groups RSVP links.
- **Automated OCG Event Synchronization**: Daily bidirectional sync script and scheduled GitHub Actions workflow keeping community events up-to-date.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Framework** | [Astro 5](https://astro.build) | Ultra-fast, zero-JS static HTML by default |
| **Styling** | Vanilla CSS + OKLCH Tokens | Strict 4-pt grid system, Hallmark design compliance |
| **Content Schema** | Astro Content Collections (Zod) | Strongly typed Markdown schemas for events, speakers, sponsors, team, and blog |
| **Headless CMS** | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) | Fast, zero-install SPA located at `/admin` |
| **OAuth Proxy** | Cloudflare Workers (Free Tier) | Zero-cost serverless GitHub OAuth proxy (`oauth-worker/`) |
| **CI/CD & Hosting** | GitHub Pages + GitHub Actions | Automated build & deploy on push to `main` |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js `v20+` or `v22+`
- npm `v10+`

### 1. Clone the repository
```bash
git clone https://github.com/Cloud-Native-Peshawar/cncf-peshawar-website.git
cd cncf-peshawar-website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start local development server
```bash
npm run dev
```
Open your browser at `http://localhost:4321/`.

### 4. Build static production bundle
```bash
npm run build
```

---

## 🧪 Testing & Quality Assurance

The repository includes a comprehensive testing and quality assurance pipeline enforcing strict type checking, end-to-end functionality, static build compilation, and link/asset integrity.

### Test & Validation Commands

| Command | Script / Tool | Purpose |
|---|---|---|
| `npm test` (or `npm run test:all`) | `node tests/e2e-runner.mjs` | Executes the 4-tier E2E test suite (Feature Coverage, Boundary & Corner Cases, Cross-Feature Integration, Real-World Scenarios). |
| `npm run check` | `astro check` | Validates TypeScript types and Astro content collection Zod schema constraints. |
| `npm run build` | `astro check && astro build` | Performs type check and builds optimized static HTML/CSS/JS artifacts into `dist/`. |
| `npm run check:links` | `node scripts/check-links.mjs` | Verifies static internal links, anchor hashes (`#id`), image/script assets, and directory routing in `dist/`. |

### Running the Full Quality Gate Locally
To execute the identical test matrix run by CI:
```bash
npm run check && npm test && npm run build && npm run check:links
```

### E2E Test Suite Tiers
The master test runner (`tests/e2e-runner.mjs`) orchestrates 4 test tiers:
- **Tier 1: Feature Coverage**: Validates individual components, content schemas, CMS configuration, and sync mechanisms.
- **Tier 2: Boundary & Corner Cases**: Tests invalid frontmatter, edge timestamps, malformed HTML feeds, and boundary inputs.
- **Tier 3: Cross-Feature Integration**: Evaluates interactions between OCG sync, schema validation, build output, and link integrity.
- **Tier 4: Real-World Scenarios**: Simulates full community lifecycle workflows, talk submissions, event additions, and partner onboarding.

---

## 🔄 Open Community Groups (OCG) Event Synchronization

Cloud Native Peshawar events are hosted on the official [CNCF Open Community Groups (OCG)](https://ocgroups.dev/cncf/group/6vwk2n4) platform. An automated sync pipeline keeps the static portal in sync with OCG event listings.

### Local CLI Execution

Run the sync script manually using Node.js:
```bash
# Standard synchronization from live OCG portal
node scripts/sync-ocg-events.mjs

# Dry-run mode (simulates changes without modifying files on disk)
node scripts/sync-ocg-events.mjs --dry-run

# Custom source or custom destination directory
node scripts/sync-ocg-events.mjs --source https://ocgroups.dev/cncf/group/6vwk2n4 --events-dir src/content/events
```

### CLI Options

| Flag | Shorthand | Default | Description |
|---|---|---|---|
| `--source` | `-s` | `https://ocgroups.dev/cncf/group/6vwk2n4` | Target OCG group URL, event detail URL, or local HTML fixture path. |
| `--events-dir` | `-d` | `src/content/events` | Destination directory for event Markdown files. |
| `--dry-run` | `-n` | `false` | Perform dry-run synchronization without modifying files on disk. |
| `--help` | `-h` | — | Display help message and CLI usage guide. |

### Non-Destructive Frontmatter Merge
The synchronization script safely merges remote OCG data with local Markdown files without overwriting manual enhancements:
- **Timezone Normalization**: Automatically converts UTC ISO timestamps to Pakistan Standard Time (PKT, UTC+5 / `Asia/Karachi`).
- **Preserved Custom Fields**: Preserves manual overrides for event titles, venues, cover images (`coverImage`), custom summaries, and existing Markdown body text.
- **Roster & Tag Union**: Merges speakers and tags non-destructively, preventing duplicates while preserving manually added speakers.
- **Status Lifecycle**: Automatically marks past events as `completed` while keeping future events as `upcoming`.

### Scheduled GitHub Actions Workflow
The automated sync runs automatically via [`.github/workflows/event-sync.yml`](.github/workflows/event-sync.yml):
- **Schedule**: Executes daily at 00:00 UTC (`cron: '0 0 * * *'`).
- **Manual Trigger**: Can be dispatched on demand via `workflow_dispatch`.
- **Git Commit**: Declares `contents: write` permissions to commit updated event files directly to the repository with `[skip ci]` if changes are detected.

---

## 📝 Managing Content with the Headless CMS

You do not need to edit code to publish new events or blog posts:

1. Open `http://localhost:4321/admin/` (or the live URL `/admin/`).
2. Log in using your GitHub account or a Personal Access Token (PAT).
3. Select a collection (**Events & Meetups**, **Speakers & Mentors**, **Sponsors & Partners**, **Organizers & Team**, **Blog & Recaps**).
4. Create or edit an entry and click **Save & Publish**.
5. The CMS commits the Markdown file directly to GitHub, triggering a fresh build on GitHub Pages in ~45 seconds.

---

## 🌐 Deploying to GitHub Pages

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Cloud Native Peshawar community portal"
   git push origin main
   ```
2. **Enable GitHub Pages**:
   - In your repository on GitHub, navigate to **Settings** -> **Pages**.
   - Under **Build and deployment** -> **Source**, choose **GitHub Actions**.
3. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) will automatically build and publish your website.

---

## 📜 Code of Conduct

Cloud Native Peshawar follows the official [CNCF Community Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md). We are dedicated to providing a harassment-free and inclusive experience for everyone.

---

## 🤝 Get Involved

- **Join the Official Chapter**: [https://ocgroups.dev/cncf/group/6vwk2n4](https://ocgroups.dev/cncf/group/6vwk2n4)
- **Submit a Talk (CFP)**: [Visit the Speaker Hub](/speak) or email `organizers@cncfpeshawar.org`
- **Partner / Sponsor Us**: [Visit the Sponsorship Prospectus](/sponsors)

