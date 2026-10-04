#!/usr/bin/env node
/**
 * scripts/parse-cfp-issue.mjs
 * 
 * Parses GitHub Issue Form submissions for Speaker CFP proposals (.github/ISSUE_TEMPLATE/cfp_proposal.yml)
 * and generates corresponding markdown files for src/content/speakers/ and src/content/events/
 * conforming strictly to Astro Content Collections Zod schemas.
 * 
 * Usage:
 *   node scripts/parse-cfp-issue.mjs --issue-body "..." --issue-title "..." --issue-number 42
 *   node scripts/parse-cfp-issue.mjs --issue-body ./issue_payload.md --dry-run --output-json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Deterministic kebab-case slugifier
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars except space and hyphen
    .trim()
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-+/, '') // trim leading dash
    .replace(/-+$/, ''); // trim trailing dash
}

/**
 * Validate URL string
 * @param {string} val
 * @returns {boolean}
 */
export function isValidUrl(val) {
  if (!val || typeof val !== 'string') return false;
  try {
    const parsed = new URL(val.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Clean markdown and template placeholders
 * @param {string} text
 * @returns {string}
 */
export function cleanValue(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();
  if (
    cleaned === '_No response_' ||
    cleaned === 'None' ||
    cleaned === 'none' ||
    cleaned === 'N/A' ||
    cleaned === 'n/a' ||
    cleaned === 'null' ||
    cleaned === 'undefined'
  ) {
    return '';
  }
  return cleaned;
}

/**
 * Parses markdown header sections from GitHub issue forms
 * @param {string} markdownBody
 * @returns {Record<string, string>}
 */
export function parseIssueSections(markdownBody) {
  if (!markdownBody || typeof markdownBody !== 'string') return {};

  const lines = markdownBody.replace(/\r\n/g, '\n').split('\n');
  const sections = {};
  let currentHeader = '';
  let currentContent = [];

  for (const line of lines) {
    const headerMatch = line.match(/^#{2,4}\s+(.+)$/);
    if (headerMatch) {
      if (currentHeader) {
        sections[currentHeader] = currentContent.join('\n').trim();
      }
      currentHeader = headerMatch[1].trim();
      currentContent = [];
    } else {
      if (currentHeader) {
        currentContent.push(line);
      }
    }
  }

  if (currentHeader) {
    sections[currentHeader] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Helper to find section value matching one of candidate header patterns
 * @param {Record<string, string>} sections
 * @param {Array<RegExp|string>} patterns
 * @returns {string}
 */
export function findSectionValue(sections, patterns) {
  const keys = Object.keys(sections);
  for (const pattern of patterns) {
    for (const key of keys) {
      const match = typeof pattern === 'string'
        ? key.toLowerCase().includes(pattern.toLowerCase())
        : pattern.test(key);
      if (match) {
        const val = cleanValue(sections[key]);
        if (val) return val;
      }
    }
  }
  return '';
}

/**
 * Parse role and organization from combined or separated inputs
 * @param {string} rawRole
 * @param {string} [explicitOrg]
 * @returns {{ role: string, organization: string }}
 */
export function parseRoleAndOrg(rawRole, explicitOrg = '') {
  const cleanOrg = cleanValue(explicitOrg);
  const cleanRole = cleanValue(rawRole);

  if (cleanOrg && cleanRole) {
    return {
      role: cleanRole,
      organization: cleanOrg
    };
  }

  if (!cleanRole && cleanOrg) {
    return {
      role: 'Speaker',
      organization: cleanOrg
    };
  }

  if (!cleanRole && !cleanOrg) {
    return {
      role: 'Community Speaker',
      organization: 'CNCF Community'
    };
  }

  // Check for " at " separator
  const atMatch = cleanRole.match(/^(.+?)\s+(?:at|AT|At)\s+(.+)$/);
  if (atMatch) {
    return {
      role: atMatch[1].trim() || 'Speaker',
      organization: atMatch[2].trim() || 'CNCF Community'
    };
  }

  // Check for " @ " separator
  const arobaseMatch = cleanRole.match(/^(.+?)\s*@\s*(.+)$/);
  if (arobaseMatch) {
    return {
      role: arobaseMatch[1].trim() || 'Speaker',
      organization: arobaseMatch[2].trim() || 'CNCF Community'
    };
  }

  // Check for " - " separator
  const dashMatch = cleanRole.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) {
    return {
      role: dashMatch[1].trim() || 'Speaker',
      organization: dashMatch[2].trim() || 'CNCF Community'
    };
  }

  // Check for ", " separator
  const commaMatch = cleanRole.match(/^(.+?),\s+(.+)$/);
  if (commaMatch) {
    return {
      role: commaMatch[1].trim() || 'Speaker',
      organization: commaMatch[2].trim() || 'CNCF Community'
    };
  }

  return {
    role: cleanRole,
    organization: cleanOrg || 'CNCF Community'
  };
}

/**
 * Extracts and categorizes social profile URLs from strings and sections
 * @param {string} text
 * @param {Record<string, string>} [sections]
 * @returns {{ github?: string, linkedin?: string, twitter?: string }}
 */
export function extractSocialLinks(text = '', sections = {}) {
  const result = {};

  // Check explicit sections if available
  const explicitGh = findSectionValue(sections, [/^github/i, /github\s+profile/i]);
  const explicitLi = findSectionValue(sections, [/^linkedin/i, /linkedin\s+profile/i]);
  const explicitTw = findSectionValue(sections, [/^twitter/i, /^x(?:\.com)?/i, /twitter\s+profile/i]);

  // Find all URLs in combined text
  const fullText = `${text} ${explicitGh} ${explicitLi} ${explicitTw}`;
  const urlRegex = /https?:\/\/[^\s,;"'<>()]+/g;
  const matches = fullText.match(urlRegex) || [];

  for (let match of matches) {
    // Strip trailing punctuation
    match = match.replace(/[.,;:)\]>]+$/, '');
    if (!isValidUrl(match)) continue;

    const lower = match.toLowerCase();
    if ((lower.includes('linkedin.com/') || lower.includes('linkedin.com/in/')) && !result.linkedin) {
      result.linkedin = match;
    } else if (lower.includes('github.com/') && !result.github) {
      result.github = match;
    } else if ((lower.includes('twitter.com/') || lower.includes('x.com/')) && !result.twitter) {
      result.twitter = match;
    }
  }

  // Handle bare usernames if passed in explicit fields without https://
  if (!result.github && explicitGh) {
    const cleanGh = cleanValue(explicitGh).replace(/^@/, '');
    if (/^[a-zA-Z0-9_-]+$/.test(cleanGh)) {
      result.github = `https://github.com/${cleanGh}`;
    }
  }

  if (!result.linkedin && explicitLi) {
    const cleanLi = cleanValue(explicitLi).replace(/^@/, '');
    if (/^[a-zA-Z0-9_-]+$/.test(cleanLi)) {
      result.linkedin = `https://www.linkedin.com/in/${cleanLi}`;
    }
  }

  if (!result.twitter && explicitTw) {
    const cleanTw = cleanValue(explicitTw).replace(/^@/, '');
    if (/^[a-zA-Z0-9_]+$/.test(cleanTw)) {
      result.twitter = `https://x.com/${cleanTw}`;
    }
  }

  return result;
}

/**
 * Extract technical tags from track and content
 * @param {string} technicalTrack
 * @returns {string[]}
 */
export function extractTrackTags(technicalTrack = '') {
  const tags = new Set(['CFP-Draft']);
  const track = technicalTrack || '';

  if (/kubernetes|container/i.test(track)) {
    tags.add('Kubernetes');
    tags.add('Containers');
    if (/orchestration/i.test(track)) {
      tags.add('Orchestration');
    }
  }
  if (/\b(?:ai|mlops|agentic|machine learning|genai|llm)\b/i.test(track)) {
    tags.add('CloudNative');
    tags.add('AI');
    tags.add('MLOps');
    tags.add('AgenticAI');
  }
  if (/\b(?:devops|gitops|ci\/cd|cicd)\b/i.test(track)) {
    tags.add('DevOps');
    tags.add('GitOps');
    tags.add('CICD');
  }
  if (/\b(?:observability|opentelemetry|prometheus|jaeger|grafana)\b/i.test(track)) {
    tags.add('Observability');
    tags.add('OpenTelemetry');
    tags.add('Prometheus');
  }
  if (/\b(?:security|zero-trust|identity|spiffe|spire)\b/i.test(track)) {
    tags.add('Security');
    tags.add('ZeroTrust');
    tags.add('Identity');
  }
  if (/\b(?:open source|community|career)\b/i.test(track)) {
    tags.add('OpenSource');
    tags.add('Community');
    if (/\bcareer\b/i.test(track)) {
      tags.add('Career');
    }
  }

  // If no track tags added other than CFP-Draft, derive keywords
  if (tags.size === 1 && technicalTrack) {
    const cleanWords = technicalTrack
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'for', 'the', 'with'].includes(w.toLowerCase()));
    for (const w of cleanWords.slice(0, 3)) {
      tags.add(w.charAt(0).toUpperCase() + w.slice(1));
    }
  }

  return Array.from(tags);
}

/**
 * Clean talk title by stripping [CFP] tags and placeholders
 * @param {string} rawTitle
 * @param {string} [fallback]
 * @returns {string}
 */
export function sanitizeTalkTitle(rawTitle = '', fallback = 'Cloud Native Technical Session') {
  let title = cleanValue(rawTitle);
  // Strip [CFP]: or [CFP] or CFP: prefix
  title = title.replace(/^\[?\s*cfp\s*\]?\s*[:-]?\s*/i, '').trim();

  if (!title || title === '<Your Talk Title Here>' || title === 'Your Talk Title Here') {
    return fallback;
  }
  return title;
}

/**
 * Generate YAML Frontmatter for speaker
 * @param {object} data
 * @returns {string}
 */
export function generateSpeakerFrontmatter(data) {
  const lines = ['---'];
  lines.push(`name: ${JSON.stringify(data.name)}`);
  lines.push(`role: ${JSON.stringify(data.role)}`);
  lines.push(`organization: ${JSON.stringify(data.organization)}`);
  lines.push(`bio: ${JSON.stringify(data.bio)}`);
  lines.push(`topic: ${JSON.stringify(data.topic)}`);

  if (data.avatar && isValidUrl(data.avatar)) {
    lines.push(`avatar: ${JSON.stringify(data.avatar)}`);
  }
  if (data.slidesUrl && isValidUrl(data.slidesUrl)) {
    lines.push(`slidesUrl: ${JSON.stringify(data.slidesUrl)}`);
  }
  if (data.recordingUrl && isValidUrl(data.recordingUrl)) {
    lines.push(`recordingUrl: ${JSON.stringify(data.recordingUrl)}`);
  }
  if (data.github && isValidUrl(data.github)) {
    lines.push(`github: ${JSON.stringify(data.github)}`);
  }
  if (data.linkedin && isValidUrl(data.linkedin)) {
    lines.push(`linkedin: ${JSON.stringify(data.linkedin)}`);
  }
  if (data.twitter && isValidUrl(data.twitter)) {
    lines.push(`twitter: ${JSON.stringify(data.twitter)}`);
  }

  lines.push(`featured: ${Boolean(data.featured)}`);
  lines.push('---');
  return lines.join('\n');
}

/**
 * Generate YAML Frontmatter for event draft
 * @param {object} data
 * @returns {string}
 */
export function generateEventFrontmatter(data) {
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(data.title)}`);
  lines.push(`date: ${JSON.stringify(data.date || '2026-TBD')}`);
  lines.push(`time: ${JSON.stringify(data.time || 'TBD PKT')}`);
  lines.push(`venue: ${JSON.stringify(data.venue || 'TBD')}`);
  lines.push(`location: ${JSON.stringify(data.location || 'Peshawar, KPK, Pakistan')}`);
  lines.push(`status: ${JSON.stringify(data.status || 'upcoming')}`);

  if (typeof data.capacity === 'number') {
    lines.push(`capacity: ${data.capacity}`);
  }

  lines.push(`rsvpUrl: ${JSON.stringify(data.rsvpUrl || 'https://ocgroups.dev/cncf/group/6vwk2n4')}`);

  if (data.lumaUrl && isValidUrl(data.lumaUrl)) {
    lines.push(`lumaUrl: ${JSON.stringify(data.lumaUrl)}`);
  }
  if (data.slidesUrl && isValidUrl(data.slidesUrl)) {
    lines.push(`slidesUrl: ${JSON.stringify(data.slidesUrl)}`);
  }
  if (data.recordingUrl && isValidUrl(data.recordingUrl)) {
    lines.push(`recordingUrl: ${JSON.stringify(data.recordingUrl)}`);
  }
  if (data.coverImage) {
    lines.push(`coverImage: ${JSON.stringify(data.coverImage)}`);
  }

  lines.push('speakers:');
  const speakers = Array.isArray(data.speakers) && data.speakers.length > 0
    ? data.speakers
    : [`${data.speakerName || 'Speaker'} (${data.speakerRole || 'Speaker'} at ${data.speakerOrg || 'CNCF Community'})`];
  for (const spk of speakers) {
    lines.push(`  - ${JSON.stringify(spk)}`);
  }

  lines.push('tags:');
  const tags = Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : ['CFP-Draft', 'Community'];
  for (const tag of tags) {
    lines.push(`  - ${JSON.stringify(tag)}`);
  }

  lines.push(`summary: ${JSON.stringify(data.summary || '')}`);
  lines.push('---');
  return lines.join('\n');
}

/**
 * Main parse CFP issue function
 * @param {object} params
 * @param {string} [params.issueBody]
 * @param {string} [params.issueTitle]
 * @param {string|number} [params.issueNumber]
 * @param {string} [params.issueUrl]
 * @param {boolean} [params.dryRun]
 * @param {boolean} [params.outputJson]
 * @param {string} [params.baseDir]
 * @returns {Promise<object>}
 */
export async function parseCfpIssue(params = {}) {
  const {
    issueBody = '',
    issueTitle = '',
    issueNumber = '0',
    issueUrl = '',
    dryRun = false,
    outputJson = false,
    baseDir = process.cwd(),
    speakersDir: customSpeakersDir,
    eventsDir: customEventsDir
  } = params;

  // Resolve body content if a file path was provided
  let bodyContent = issueBody;
  if (issueBody && typeof issueBody === 'string') {
    const potentialPath = path.isAbsolute(issueBody) ? issueBody : path.resolve(baseDir, issueBody);
    if (fs.existsSync(potentialPath) && fs.statSync(potentialPath).isFile()) {
      bodyContent = fs.readFileSync(potentialPath, 'utf8');
    }
  }

  const sections = parseIssueSections(bodyContent);

  // 1. Extract Speaker Name
  const speakerNameRaw = findSectionValue(sections, [
    /speaker\s+(?:full\s+)?name/i,
    /^speaker_name$/i,
    /full\s+name/i,
    /^speaker$/i
  ]);
  const speakerName = speakerNameRaw || 'Community Speaker';

  // 2. Extract Role and Org
  const roleRaw = findSectionValue(sections, [
    /current\s+role/i,
    /^speaker_role$/i,
    /role\s*\/\s*company/i,
    /job\s+title/i,
    /^role$/i
  ]);
  const orgRaw = findSectionValue(sections, [
    /^organization$/i,
    /^company$/i,
    /^university$/i,
    /speaker_org/i
  ]);
  const { role: speakerRole, organization: speakerOrg } = parseRoleAndOrg(roleRaw, orgRaw);

  // 3. Extract Talk Title
  const talkTitleFromSection = findSectionValue(sections, [
    /talk\s+title/i,
    /session\s+title/i,
    /^topic$/i,
    /^title$/i
  ]);
  const talkTitle = sanitizeTalkTitle(
    issueTitle || talkTitleFromSection,
    `Technical Session by ${speakerName}`
  );

  // 4. Extract Session Format
  const talkFormat = findSectionValue(sections, [
    /session\s+format/i,
    /talk\s+format/i,
    /^format$/i,
    /^type$/i
  ]) || '40-minute Deep Dive';

  // 5. Extract Technical Track
  const technicalTrack = findSectionValue(sections, [
    /technical\s+track/i,
    /^track$/i,
    /^category$/i
  ]) || 'Cloud Native & Kubernetes';

  // 6. Extract Target Audience
  const targetAudience = findSectionValue(sections, [
    /target\s+audience/i,
    /audience\s+level/i,
    /^audience$/i,
    /^level$/i
  ]) || 'Intermediate (Familiar with containers & basic cloud)';

  // 7. Extract Session Abstract
  const sessionAbstract = findSectionValue(sections, [
    /session\s+abstract/i,
    /abstract\s*&?\s*key\s*takeaways/i,
    /^abstract$/i,
    /^summary$/i,
    /^description$/i
  ]) || `Talk proposal for Cloud Native Peshawar on ${talkTitle}.`;

  // 8. Extract Speaker Bio
  const speakerBio = findSectionValue(sections, [
    /speaker\s+bio/i,
    /^bio$/i,
    /biography/i,
    /about\s+the\s+speaker/i
  ]) || `${speakerName} is a cloud native practitioner and speaker.`;

  // 9. Extract Social Links
  const socialText = findSectionValue(sections, [
    /linkedin\s*\/\s*github/i,
    /profile\s+url/i,
    /social/i
  ]);
  const socialLinks = extractSocialLinks(socialText, sections);

  // 10. Extract Slides Link
  const slidesRaw = findSectionValue(sections, [
    /draft\s+slides/i,
    /slides\s+(?:or\s+outline\s+)?link/i,
    /slides\s+url/i,
    /^slides$/i,
    /presentation/i
  ]);
  let slidesUrl = undefined;
  if (slidesRaw && isValidUrl(slidesRaw)) {
    slidesUrl = slidesRaw;
  } else if (slidesRaw) {
    const urlMatch = slidesRaw.match(/https?:\/\/[^\s,;"'<>()]+/);
    if (urlMatch && isValidUrl(urlMatch[0])) {
      slidesUrl = urlMatch[0];
    }
  }

  // 11. Generate Slugs
  const speakerSlug = slugify(speakerName) || 'community-speaker';
  const talkSlug = slugify(talkTitle) || speakerSlug;
  const eventSlug = `draft-${talkSlug}`;

  // 12. Derive Event Tags
  const trackTags = extractTrackTags(technicalTrack);

  // 13. Derive Summary (clean concise excerpt)
  let summaryExcerpt = sessionAbstract
    .replace(/^#+\s+/gm, '') // strip markdown headings
    .replace(/\r?\n+/g, ' ') // collapse newlines
    .trim();
  if (summaryExcerpt.length > 280) {
    const truncated = summaryExcerpt.slice(0, 277);
    const lastSpace = truncated.lastIndexOf(' ');
    summaryExcerpt = (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + '...';
  }

  // 14. Synthesize Speaker Markdown
  const speakerFrontmatter = generateSpeakerFrontmatter({
    name: speakerName,
    role: speakerRole,
    organization: speakerOrg,
    bio: speakerBio,
    topic: talkTitle,
    github: socialLinks.github,
    linkedin: socialLinks.linkedin,
    twitter: socialLinks.twitter,
    slidesUrl: slidesUrl,
    featured: false
  });

  const speakerMarkdown = `${speakerFrontmatter}\n\n${speakerName} is presenting on "${talkTitle}" at Cloud Native Peshawar.\n\n### Bio\n${speakerBio}\n`;

  // 15. Synthesize Event Markdown
  const formattedSpeakerString = `${speakerName} (${speakerRole} at ${speakerOrg})`;
  const eventFrontmatter = generateEventFrontmatter({
    title: talkTitle,
    date: '2026-TBD',
    time: 'TBD PKT',
    venue: 'TBD',
    location: 'Peshawar, KPK, Pakistan',
    status: 'upcoming',
    rsvpUrl: 'https://ocgroups.dev/cncf/group/6vwk2n4',
    speakers: [formattedSpeakerString],
    tags: trackTags,
    summary: summaryExcerpt,
    slidesUrl: slidesUrl
  });

  const eventMarkdown = `${eventFrontmatter}\n\n## Session Abstract\n\n${sessionAbstract}\n\n### Session Details\n- **Format**: ${talkFormat}\n- **Technical Track**: ${technicalTrack}\n- **Target Audience**: ${targetAudience}\n\n### Speaker Bio\n${speakerBio}\n`;

  // 16. Target File Paths
  const speakersDir = customSpeakersDir ? path.resolve(customSpeakersDir) : path.resolve(baseDir, 'src/content/speakers');
  const eventsDir = customEventsDir ? path.resolve(customEventsDir) : path.resolve(baseDir, 'src/content/events');
  const speakerFilePath = path.join(speakersDir, `${speakerSlug}.md`);
  const eventFilePath = path.join(eventsDir, `${eventSlug}.md`);

  const relSpeakerPath = path.relative(baseDir, speakerFilePath);
  const relEventPath = path.relative(baseDir, eventFilePath);
  const branchName = `cfp/issue-${issueNumber}-${speakerSlug}`;
  const prTitle = `[CFP] Proposal: ${talkTitle} - ${speakerName}`;

  const result = {
    speaker_name: speakerName,
    speaker_slug: speakerSlug,
    speaker_role: speakerRole,
    speaker_org: speakerOrg,
    talk_title: talkTitle,
    talk_format: talkFormat,
    technical_track: technicalTrack,
    target_audience: targetAudience,
    event_slug: eventSlug,
    speaker_file: relSpeakerPath,
    event_file: relEventPath,
    branch_name: branchName,
    pr_title: prTitle,
    issue_number: String(issueNumber),
    issue_url: issueUrl,
    tags: trackTags,
    speaker_markdown: speakerMarkdown,
    event_markdown: eventMarkdown
  };

  // 17. Write Files if not Dry-Run
  if (!dryRun) {
    if (!fs.existsSync(speakersDir)) {
      fs.mkdirSync(speakersDir, { recursive: true });
    }
    if (!fs.existsSync(eventsDir)) {
      fs.mkdirSync(eventsDir, { recursive: true });
    }

    fs.writeFileSync(speakerFilePath, speakerMarkdown, 'utf8');
    fs.writeFileSync(eventFilePath, eventMarkdown, 'utf8');
  }

  // 18. Write to GITHUB_OUTPUT if available
  if (process.env.GITHUB_OUTPUT) {
    const githubOutputLines = [
      `speaker_name=${result.speaker_name}`,
      `speaker_slug=${result.speaker_slug}`,
      `speaker_role=${result.speaker_role}`,
      `speaker_org=${result.speaker_org}`,
      `talk_title=${result.talk_title}`,
      `event_slug=${result.event_slug}`,
      `speaker_file=${result.speaker_file}`,
      `event_file=${result.event_file}`,
      `branch_name=${result.branch_name}`,
      `pr_title=${result.pr_title}`
    ];
    fs.appendFileSync(process.env.GITHUB_OUTPUT, githubOutputLines.join('\n') + '\n', 'utf8');
  }

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[CFP Triage] Parsed submission for "${speakerName}"`);
    console.log(`  - Talk Title: ${talkTitle}`);
    console.log(`  - Speaker File: ${relSpeakerPath} (${dryRun ? 'DRY-RUN' : 'WRITTEN'})`);
    console.log(`  - Event File: ${relEventPath} (${dryRun ? 'DRY-RUN' : 'WRITTEN'})`);
    console.log(`  - Branch: ${branchName}`);
  }

  return result;
}

/**
 * CLI Argument Parser
 */
function parseCliArgs(args) {
  const options = {
    issueBody: process.env.ISSUE_BODY || '',
    issueTitle: process.env.ISSUE_TITLE || '',
    issueNumber: process.env.ISSUE_NUMBER || '0',
    issueUrl: process.env.ISSUE_URL || '',
    dryRun: false,
    outputJson: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--issue-body' || arg === '-b') {
      options.issueBody = args[++i] || '';
    } else if (arg === '--issue-title' || arg === '-t') {
      options.issueTitle = args[++i] || '';
    } else if (arg === '--issue-number' || arg === '-n') {
      options.issueNumber = args[++i] || '0';
    } else if (arg === '--issue-url' || arg === '-u') {
      options.issueUrl = args[++i] || '';
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--output-json') {
      options.outputJson = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/parse-cfp-issue.mjs [options]

Options:
  --issue-body, -b <text|path>  Issue markdown body or path to body file
  --issue-title, -t <title>     Issue title
  --issue-number, -n <num>      Issue number
  --issue-url, -u <url>         Issue URL
  --dry-run                     Parse and validate without writing files
  --output-json                 Output parsed result as JSON
  --help, -h                    Show this help message
      `);
      process.exit(0);
    }
  }

  return options;
}

// Execute when run as CLI
const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectExecution) {
  const options = parseCliArgs(process.argv.slice(2));
  parseCfpIssue(options).catch((err) => {
    console.error('❌ Error parsing CFP issue:', err);
    process.exit(1);
  });
}
