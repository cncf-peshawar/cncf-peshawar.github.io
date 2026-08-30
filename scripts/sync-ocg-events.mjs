#!/usr/bin/env node
/**
 * CNCF Peshawar - OCG Event Sync Automation
 * 
 * Fetches event metadata from the CNCF Open Community Groups (OCG) chapter portal,
 * extracts structured DOM attributes and embedded Web Component JSON,
 * normalizes ISO UTC timestamps to Pakistan Standard Time (PKT / Asia/Karachi),
 * and performs non-destructive synchronization against Astro content collection Markdown files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import YAML from 'yaml';

export const DEFAULT_OCG_GROUP_URL = 'https://ocgroups.dev/cncf/group/6vwk2n4';
export const DEFAULT_EVENTS_DIR = path.resolve(process.cwd(), 'src/content/events');
export const DEFAULT_TIMEZONE = 'Asia/Karachi';
export const USER_AGENT = 'CNCF-Peshawar-SyncBot/1.0 (+https://github.com/cncf-peshawar/cncf-peshawar.github.io)';

/**
 * Decodes standard HTML entities into plain text.
 */
export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&#60;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#62;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ');
}

/**
 * Strips HTML tags and collapses whitespace.
 */
export function stripHtml(html) {
  if (!html) return '';
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

/**
 * Slugifies a string for filesystem / URL safety.
 */
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a UTC ISO timestamp (e.g. "2026-09-04T10:00:00+00:00")
 * to Pakistan Standard Time (PKT, UTC+5 / Asia/Karachi).
 */
export function convertUtcToPkt(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;

  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const date = dateFormatter.format(d); // YYYY-MM-DD

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const startTime = timeFormatter.format(d); // e.g. "03:00 PM"

  return {
    date,
    startTime,
    dateObj: d
  };
}

/**
 * Normalizes time string into standard 12-hour PKT range format.
 * e.g. "3:00 PM - 7:00 PM PKT" -> "03:00 PM - 07:00 PM PKT"
 */
export function normalizeTimeRange(raw) {
  if (!raw) return '';
  let str = stripHtml(raw).replace(/–/g, '-').trim();
  // Pad single-digit hour with leading zero
  str = str.replace(/\b(\d):(\d{2})\s*(AM|PM)\b/gi, (_, h, m, ap) => `0${h}:${m} ${ap.toUpperCase()}`);
  str = str.replace(/\b(\d{2}):(\d{2})\s*(am|pm)\b/g, (_, h, m, ap) => `${h}:${m} ${ap.toUpperCase()}`);
  str = str.replace(/\s*-\s*/g, ' - ');
  if (!str.toUpperCase().includes('PKT')) {
    str = `${str} PKT`;
  }
  return str;
}

/**
 * Parses user profiles from <user-chip user='...'> elements.
 */
export function parseUserChips(html) {
  const users = [];
  if (!html) return users;
  const chipRegex = /<user-chip\b[^>]*\buser=(["'])([\s\S]*?)\1[^>]*>/gi;
  let match;
  while ((match = chipRegex.exec(html)) !== null) {
    const rawUserAttr = match[2];
    try {
      const decoded = decodeHtmlEntities(rawUserAttr);
      const parsed = JSON.parse(decoded);
      if (parsed && (parsed.name || parsed.username)) {
        const name = (parsed.name || parsed.username).trim();
        const role = (parsed.title || parsed.role || parsed.company || '').trim();
        const formatted = role ? `${name} (${role})` : name;
        if (!users.includes(formatted)) {
          users.push(formatted);
        }
      }
    } catch {
      const nameMatch = rawUserAttr.match(/"name"\s*:\s*"([^"]+)"/);
      const titleMatch = rawUserAttr.match(/"title"\s*:\s*"([^"]+)"/);
      if (nameMatch) {
        const name = decodeHtmlEntities(nameMatch[1]).trim();
        const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : '';
        const formatted = title ? `${name} (${title})` : name;
        if (!users.includes(formatted)) {
          users.push(formatted);
        }
      }
    }
  }
  return users;
}

/**
 * Extracts a single event detail from HTML.
 */
export function parseOcgEventHtml(html, defaultUrl = '') {
  if (!html || typeof html !== 'string') return null;

  // 1. RSVP URL
  let rsvpUrl = '';
  const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                         html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const ogUrlMatch = html.match(/<meta\s+[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:url["']/i);

  if (canonicalMatch) {
    rsvpUrl = canonicalMatch[1];
  } else if (ogUrlMatch) {
    rsvpUrl = ogUrlMatch[1];
  } else if (defaultUrl) {
    rsvpUrl = defaultUrl;
  }

  if (rsvpUrl.startsWith('/')) {
    rsvpUrl = `https://ocgroups.dev${rsvpUrl}`;
  }

  // 2. Title
  let title = '';
  const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const cardTitleMatch = html.match(/class=["'][^"']*card-title[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|h\d|div|a|p)>/i);

  if (h1Match) {
    title = stripHtml(h1Match[1]);
  } else if (ogTitleMatch) {
    title = decodeHtmlEntities(ogTitleMatch[1]).trim();
  } else if (cardTitleMatch) {
    title = stripHtml(cardTitleMatch[1]);
  }

  // 3. Attendance attributes
  const startsMatch = html.match(/data-starts=["']([^"']+)["']/i);
  const canceledMatch = html.match(/data-canceled=["']([^"']+)["']/i);
  const capacityAttrMatch = html.match(/data-availability-capacity=["'](\d+)["']/i);
  const capacityTagMatch = html.match(/data-availability-capacity[^>]*>\s*(\d+)\s*</i);

  const isCanceled = canceledMatch ? canceledMatch[1].toLowerCase() === 'true' : false;
  let capacity;
  if (capacityAttrMatch) {
    capacity = parseInt(capacityAttrMatch[1], 10);
  } else if (capacityTagMatch) {
    capacity = parseInt(capacityTagMatch[1], 10);
  }

  // Date and Time
  let date = '';
  let time = '';
  let dateObj = null;

  if (startsMatch) {
    const pktTime = convertUtcToPkt(startsMatch[1]);
    if (pktTime) {
      date = pktTime.date;
      dateObj = pktTime.dateObj;
      time = `${pktTime.startTime} PKT`;
    }
  }

  const datePanelMatch = html.match(/data-registration-window-date-panel[\s\S]*?<div[^>]*class=["'][^"']*text-stone-600[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const explicitTimeMatch = html.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM)(?:\s*PKT)?)/i);

  if (datePanelMatch) {
    const panelTimeText = stripHtml(datePanelMatch[1]);
    if (panelTimeText) {
      time = normalizeTimeRange(panelTimeText);
    }
  } else if (explicitTimeMatch) {
    time = normalizeTimeRange(explicitTimeMatch[1]);
  } else if (!time && dateObj) {
    const endObj = new Date(dateObj.getTime() + 4 * 60 * 60 * 1000);
    const endFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const startTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dateObj);
    time = `${startTimeStr} - ${endFormatter.format(endObj)} PKT`;
  }

  if (!date) {
    const fontSemiboldMatch = html.match(/data-registration-window-date-panel[\s\S]*?<div[^>]*class=["'][^"']*font-semibold[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (fontSemiboldMatch) {
      const parsedDate = new Date(stripHtml(fontSemiboldMatch[1]));
      if (!isNaN(parsedDate.getTime())) {
        date = new Intl.DateTimeFormat('en-CA', {
          timeZone: DEFAULT_TIMEZONE,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(parsedDate);
        dateObj = parsedDate;
      }
    }
  }

  // 4. Status determination
  let status = 'upcoming';
  if (dateObj) {
    const now = Date.now();
    if (now > dateObj.getTime() + 6 * 60 * 60 * 1000) {
      status = 'completed';
    }
  }

  // 5. Venue and Location
  let venue = '';
  const mapModalMatch = html.match(/data-map-modal[\s\S]*?<div[^>]*class=["'][^"']*rounded-full[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const locationCardMatch = html.match(/class=["'][^"']*icon-location[^"']*["'][\s\S]*?<\/div>\s*<div[^>]*>([\s\S]*?)<\/div>/i);
  const generalLocationMatch = html.match(/<div[^>]*class=["'][^"']*location-name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

  if (mapModalMatch) {
    venue = stripHtml(mapModalMatch[1]);
  } else if (locationCardMatch) {
    venue = stripHtml(locationCardMatch[1]);
  } else if (generalLocationMatch) {
    venue = stripHtml(generalLocationMatch[1]);
  } else {
    venue = 'National Incubation Center (NIC), South Canal Road';
  }

  const location = 'Peshawar, KPK, Pakistan';

  // 6. External Links
  let lumaUrl;
  const lumaMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:luma\.com|lu\.ma)\/[a-zA-Z0-9_-]+)["']/i);
  if (lumaMatch) {
    lumaUrl = lumaMatch[1];
  }

  let slidesUrl;
  const slidesMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:slideshare\.net|speakerdeck\.com|docs\.google\.com\/presentation)\/[^"']+)["']/i);
  if (slidesMatch) {
    slidesUrl = slidesMatch[1];
  }

  let recordingUrl;
  const recordingMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^"']+)["']/i);
  if (recordingMatch) {
    recordingUrl = recordingMatch[1];
  }

  // 7. Speakers
  const speakers = parseUserChips(html);

  // 8. Tags
  const tags = [];
  const tagsSectionMatch = html.match(/Tags[\s\S]*?<\/div>([\s\S]*?)<\/div>/i);
  if (tagsSectionMatch) {
    const tagMatches = tagsSectionMatch[1].matchAll(/<span\b[^>]*>([^<]+)<\/span>/gi);
    for (const tm of tagMatches) {
      const tagText = stripHtml(tm[1]);
      if (tagText && !tags.includes(tagText)) {
        tags.push(tagText);
      }
    }
  }
  if (tags.length === 0) {
    tags.push('Genesis', 'OpenSource', 'Community', 'CloudNative', 'Kubernetes', 'AgenticAI');
  }
  if (isCanceled && !tags.includes('Canceled')) {
    tags.push('Canceled');
  }

  // 9. Summary & Description Body
  let summary = '';
  let description = '';
  const markdownSectionMatch = html.match(/<div[^>]*class=["'][^"']*markdown[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                               html.match(/About\s+this\s+event[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i);

  if (markdownSectionMatch) {
    const rawDesc = stripHtml(markdownSectionMatch[1]);
    description = rawDesc;
    const sentenceMatch = rawDesc.match(/^(.*?[.!?](?:\s+|$).*?[.!?](?:\s+|$))/);
    if (sentenceMatch) {
      summary = sentenceMatch[1].trim();
    } else {
      summary = rawDesc.slice(0, 250).trim();
    }
  }

  const resolvedTitle = title || 'CNCF Peshawar Community Event';
  if (!summary) {
    summary = `${resolvedTitle} marks an official community gathering for Cloud Native Computing Foundation (CNCF) in Peshawar, bringing together developers, engineers, and open source enthusiasts.`;
  }

  if (isCanceled && !summary.startsWith('[CANCELED]')) {
    summary = `[CANCELED] ${summary}`;
  }

  return {
    title: resolvedTitle,
    date: date || new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TIMEZONE }).format(new Date()),
    time: time || '03:00 PM - 07:00 PM PKT',
    venue,
    location,
    status,
    capacity,
    rsvpUrl: rsvpUrl || defaultUrl,
    lumaUrl,
    slidesUrl,
    recordingUrl,
    speakers,
    tags,
    summary,
    description,
    isCanceled
  };
}

/**
 * Parses a group portal page to discover event links and cards.
 */
export function parseOcgGroupHtml(html, groupUrl = DEFAULT_OCG_GROUP_URL) {
  const events = [];
  if (!html || typeof html !== 'string') return { discoveredUrls: [], embeddedEvents: [] };

  const baseUrl = groupUrl.startsWith('http') ? new URL(groupUrl).origin : 'https://ocgroups.dev';

  // Extract all event links
  const eventLinkRegex = /href=["'](\/cncf\/group\/[^"'\/]+\/event\/[^"'\s]+|https?:\/\/ocgroups\.dev\/cncf\/group\/[^"'\/]+\/event\/[^"'\s]+)["']/gi;
  const discoveredUrls = new Set();
  let match;

  while ((match = eventLinkRegex.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith('/')) {
      url = `${baseUrl}${url}`;
    }
    discoveredUrls.add(url);
  }

  // Also inspect event cards in the group page
  const cardRegex = /<article\b[^>]*class=["'][^"']*card-hover-border[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi;
  let cardMatch;
  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const cardHtml = cardMatch[1];
    const linkMatch = cardHtml.match(/href=["']([^"']+)["']/i);
    let cardUrl = linkMatch ? linkMatch[1] : '';
    if (cardUrl.startsWith('/')) cardUrl = `https://ocgroups.dev${cardUrl}`;
    
    // Parse card metadata as fallback
    const parsedCard = parseOcgEventHtml(cardHtml, cardUrl);
    if (parsedCard && parsedCard.rsvpUrl) {
      events.push(parsedCard);
      discoveredUrls.add(parsedCard.rsvpUrl);
    }
  }

  return {
    discoveredUrls: Array.from(discoveredUrls),
    embeddedEvents: events
  };
}

/**
 * Fetches content over HTTP with retry and exponential backoff.
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const fetchOptions = {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...(options.headers || {})
    }
  };

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
      }
      return await response.text();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Loads and parses all existing Markdown event files from eventsDir.
 */
export function loadExistingEvents(eventsDir) {
  if (!fs.existsSync(eventsDir)) {
    return [];
  }

  const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  const eventRecords = [];

  for (const fileName of files) {
    const filePath = path.join(eventsDir, fileName);
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

    if (match) {
      try {
        const frontmatter = YAML.parse(match[1]) || {};
        const body = match[2] || '';
        eventRecords.push({
          fileName,
          filePath,
          frontmatter,
          body,
          rawContent
        });
      } catch (err) {
        console.warn(`[WARN] Failed to parse YAML in ${fileName}:`, err.message);
      }
    }
  }

  return eventRecords;
}

/**
 * Serializes frontmatter object to deterministic YAML adhering to Astro schema key order.
 */
export function stringifyFrontmatter(data) {
  const lines = ['---'];
  const orderedKeys = [
    'title',
    'date',
    'time',
    'venue',
    'location',
    'status',
    'capacity',
    'rsvpUrl',
    'lumaUrl',
    'slidesUrl',
    'recordingUrl',
    'coverImage',
    'speakers',
    'tags',
    'summary'
  ];

  const keys = [...new Set([...orderedKeys, ...Object.keys(data)])];

  for (const key of keys) {
    if (data[key] === undefined || data[key] === null) continue;
    const val = data[key];
    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of val) {
          lines.push(`  - ${JSON.stringify(item)}`);
        }
      }
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      lines.push(`${key}: ${val}`);
    } else if (typeof val === 'string') {
      lines.push(`${key}: ${JSON.stringify(val)}`);
    } else {
      lines.push(`${key}: ${JSON.stringify(val)}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Extracts normalized event ID from an OCG URL.
 */
export function extractEventId(url) {
  if (!url) return '';
  const match = url.match(/\/event\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

/**
 * Performs non-destructive event synchronization.
 */
export async function syncEvents(options = {}) {
  const source = options.source || DEFAULT_OCG_GROUP_URL;
  const eventsDir = options.eventsDir || DEFAULT_EVENTS_DIR;
  const dryRun = Boolean(options.dryRun);

  console.log(`[INFO] Starting OCG Event Sync from source: ${source}`);
  console.log(`[INFO] Events Directory: ${eventsDir}`);
  if (dryRun) console.log(`[INFO] DRY-RUN MODE: No files will be modified on disk.`);

  let sourceHtml = '';
  let isLocalFile = false;

  if (fs.existsSync(source)) {
    isLocalFile = true;
    sourceHtml = fs.readFileSync(source, 'utf8');
  } else if (source.startsWith('http://') || source.startsWith('https://')) {
    sourceHtml = await fetchWithRetry(source);
  } else {
    throw new Error(`Invalid source specified: ${source} (not a valid file or HTTP URL)`);
  }

  // Determine what we received: Single event page or group page
  const parsedEvents = [];

  const hasCards = sourceHtml.includes('card-hover-border');
  const isEventDetail = !hasCards && (
    sourceHtml.includes('attendance-container-main') ||
    source.includes('/event/')
  );

  if (isEventDetail) {
    const singleEvent = parseOcgEventHtml(sourceHtml, isLocalFile ? DEFAULT_OCG_GROUP_URL : source);
    if (singleEvent) {
      parsedEvents.push(singleEvent);
    }
  } else {
    // Parse group portal
    const { discoveredUrls, embeddedEvents } = parseOcgGroupHtml(sourceHtml, source);

    if (isLocalFile) {
      // Offline / fixture testing: if embedded events found, use them; or parse sourceHtml directly
      if (embeddedEvents.length > 0) {
        parsedEvents.push(...embeddedEvents);
      } else {
        const fallbackEvent = parseOcgEventHtml(sourceHtml, DEFAULT_OCG_GROUP_URL);
        if (fallbackEvent) parsedEvents.push(fallbackEvent);
      }
    } else {
      // Online mode: fetch all discovered event detail URLs
      for (const eventUrl of discoveredUrls) {
        try {
          console.log(`[INFO] Fetching event detail: ${eventUrl}`);
          const eventHtml = await fetchWithRetry(eventUrl);
          const parsed = parseOcgEventHtml(eventHtml, eventUrl);
          if (parsed) {
            parsedEvents.push(parsed);
          }
        } catch (err) {
          console.warn(`[WARN] Failed to fetch event detail for ${eventUrl}: ${err.message}`);
          // Fallback to embedded card event if present
          const embedded = embeddedEvents.find(e => e.rsvpUrl === eventUrl || extractEventId(e.rsvpUrl) === extractEventId(eventUrl));
          if (embedded) {
            parsedEvents.push(embedded);
          }
        }
      }
    }
  }

  if (parsedEvents.length === 0) {
    console.log('[WARN] No events discovered or parsed from source.');
    return { success: true, created: [], updated: [], unchanged: [], events: [] };
  }

  console.log(`[INFO] Discovered ${parsedEvents.length} event(s) from OCG.`);

  // Load existing Markdown events
  const existingEvents = loadExistingEvents(eventsDir);
  console.log(`[INFO] Loaded ${existingEvents.length} existing event file(s) from ${eventsDir}.`);

  const created = [];
  const updated = [];
  const unchanged = [];

  for (const ocgEvent of parsedEvents) {
    const ocgEventId = extractEventId(ocgEvent.rsvpUrl);

    // Match existing event by rsvpUrl or event ID
    const matchedExisting = existingEvents.find(ex => {
      if (ex.frontmatter.rsvpUrl === ocgEvent.rsvpUrl) return true;
      if (ocgEventId && extractEventId(ex.frontmatter.rsvpUrl) === ocgEventId) return true;
      return false;
    });

    if (matchedExisting) {
      const exFm = matchedExisting.frontmatter;

      // Non-destructive merge logic
      // 1. Title: Preserve manual override (e.g. fixes upstream typos)
      const mergedTitle = exFm.title && exFm.title.trim() ? exFm.title : ocgEvent.title;

      // 2. Date & Time: Use OCG data or preserve
      const mergedDate = ocgEvent.date || exFm.date;
      const mergedTime = ocgEvent.time || exFm.time;

      // 3. Venue & Location: Preserve manual override if present
      const mergedVenue = exFm.venue && exFm.venue.trim() ? exFm.venue : ocgEvent.venue;
      const mergedLocation = exFm.location || ocgEvent.location || 'Peshawar, KPK, Pakistan';

      // 4. Status: Auto-update to 'completed' if time has elapsed
      const mergedStatus = ocgEvent.status || exFm.status || 'upcoming';

      // 5. Capacity: Update if OCG has capacity or keep existing
      const mergedCapacity = ocgEvent.capacity !== undefined ? ocgEvent.capacity : exFm.capacity;

      // 6. RSVP & External URLs: Non-destructive merge
      const mergedRsvpUrl = exFm.rsvpUrl || ocgEvent.rsvpUrl;
      const mergedLumaUrl = exFm.lumaUrl || ocgEvent.lumaUrl;
      const mergedSlidesUrl = exFm.slidesUrl || ocgEvent.slidesUrl;
      const mergedRecordingUrl = exFm.recordingUrl || ocgEvent.recordingUrl;

      // 7. Cover Image: STRICTLY PRESERVE manual cover image
      const mergedCoverImage = exFm.coverImage || ocgEvent.coverImage;

      // 8. Speakers: Preserve manual speakers and union with new ones
      const existingSpeakers = Array.isArray(exFm.speakers) ? exFm.speakers : [];
      const ocgSpeakers = Array.isArray(ocgEvent.speakers) ? ocgEvent.speakers : [];
      const mergedSpeakers = [...existingSpeakers];
      for (const sp of ocgSpeakers) {
        const spName = sp.split('(')[0].trim().toLowerCase();
        const exists = existingSpeakers.some(s => s.split('(')[0].trim().toLowerCase() === spName);
        if (!exists) {
          mergedSpeakers.push(sp);
        }
      }

      // 9. Tags: Union of existing and OCG tags
      const existingTags = Array.isArray(exFm.tags) ? exFm.tags : [];
      const ocgTags = Array.isArray(ocgEvent.tags) ? ocgEvent.tags : [];
      const mergedTags = Array.from(new Set([...existingTags, ...ocgTags]));

      // 10. Summary: Preserve manual summary if non-empty
      const mergedSummary = exFm.summary && exFm.summary.trim() ? exFm.summary : ocgEvent.summary;

      const mergedFrontmatter = {
        title: mergedTitle,
        date: mergedDate,
        time: mergedTime,
        venue: mergedVenue,
        location: mergedLocation,
        status: mergedStatus,
        ...(mergedCapacity !== undefined ? { capacity: mergedCapacity } : {}),
        rsvpUrl: mergedRsvpUrl,
        ...(mergedLumaUrl ? { lumaUrl: mergedLumaUrl } : {}),
        ...(mergedSlidesUrl ? { slidesUrl: mergedSlidesUrl } : {}),
        ...(mergedRecordingUrl ? { recordingUrl: mergedRecordingUrl } : {}),
        ...(mergedCoverImage ? { coverImage: mergedCoverImage } : {}),
        speakers: mergedSpeakers,
        tags: mergedTags,
        summary: mergedSummary
      };

      // Check if anything actually changed
      const oldFmYaml = stringifyFrontmatter(exFm);
      const newFmYaml = stringifyFrontmatter(mergedFrontmatter);

      if (oldFmYaml === newFmYaml) {
        unchanged.push(matchedExisting.fileName);
        console.log(`[UNCHANGED] ${matchedExisting.fileName} (0 diff)`);
      } else {
        updated.push(matchedExisting.fileName);
        console.log(`[UPDATE] ${matchedExisting.fileName}`);
        if (!dryRun) {
          // Strictly preserve existing markdown body
          const newContent = `${newFmYaml}\n\n${matchedExisting.body.trim()}\n`;
          fs.writeFileSync(matchedExisting.filePath, newContent, 'utf8');
        }
      }
    } else {
      // Create new event file
      let nextIndex = 1;
      for (const ex of existingEvents) {
        const numMatch = ex.fileName.match(/^(\d+)-/);
        if (numMatch) {
          const num = parseInt(numMatch[1], 10);
          if (num >= nextIndex) nextIndex = num + 1;
        }
      }
      for (const cr of created) {
        const numMatch = cr.match(/^(\d+)-/);
        if (numMatch) {
          const num = parseInt(numMatch[1], 10);
          if (num >= nextIndex) nextIndex = num + 1;
        }
      }

      const prefix = String(nextIndex).padStart(2, '0');
      const slug = slugify(ocgEvent.title) || 'event';
      const fileName = `${prefix}-${slug}.md`;
      const filePath = path.join(eventsDir, fileName);

      const newFrontmatter = {
        title: ocgEvent.title,
        date: ocgEvent.date,
        time: ocgEvent.time,
        venue: ocgEvent.venue,
        location: ocgEvent.location,
        status: ocgEvent.status,
        ...(ocgEvent.capacity !== undefined ? { capacity: ocgEvent.capacity } : {}),
        rsvpUrl: ocgEvent.rsvpUrl,
        ...(ocgEvent.lumaUrl ? { lumaUrl: ocgEvent.lumaUrl } : {}),
        ...(ocgEvent.slidesUrl ? { slidesUrl: ocgEvent.slidesUrl } : {}),
        ...(ocgEvent.recordingUrl ? { recordingUrl: ocgEvent.recordingUrl } : {}),
        ...(ocgEvent.coverImage ? { coverImage: ocgEvent.coverImage } : {}),
        speakers: ocgEvent.speakers,
        tags: ocgEvent.tags,
        summary: ocgEvent.summary
      };

      const newFmYaml = stringifyFrontmatter(newFrontmatter);
      const defaultBody = [
        '## About This Event',
        '',
        ocgEvent.description || ocgEvent.summary,
        '',
        '---',
        '',
        '## Event Details',
        '',
        `- **Date**: ${ocgEvent.date}`,
        `- **Time**: ${ocgEvent.time}`,
        `- **Venue**: ${ocgEvent.venue}, ${ocgEvent.location}`,
        '- **Registration**: 100% Free (General Admission)',
        `- **Official Platforms**: [Open Community Groups (OCG)](${ocgEvent.rsvpUrl})${ocgEvent.lumaUrl ? ` & [Luma](${ocgEvent.lumaUrl})` : ''}`,
        ''
      ].join('\n');

      const fullFileContent = `${newFmYaml}\n\n${defaultBody}\n`;

      created.push(fileName);
      console.log(`[CREATE] ${fileName}`);
      if (!dryRun) {
        if (!fs.existsSync(eventsDir)) {
          fs.mkdirSync(eventsDir, { recursive: true });
        }
        fs.writeFileSync(filePath, fullFileContent, 'utf8');
      }
    }
  }

  console.log(`\n[SUMMARY] Sync Complete: ${created.length} created, ${updated.length} updated, ${unchanged.length} unchanged.`);
  return {
    success: true,
    created,
    updated,
    unchanged,
    events: parsedEvents
  };
}

/**
 * CLI Argument parsing and execution entrypoint.
 */
async function main() {
  const args = process.argv.slice(2);
  let source = DEFAULT_OCG_GROUP_URL;
  let eventsDir = DEFAULT_EVENTS_DIR;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--source' || arg === '-s') {
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        console.error('[ERROR] Missing argument for --source');
        process.exit(1);
      }
      source = args[++i];
    } else if (arg === '--events-dir' || arg === '-d') {
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        console.error('[ERROR] Missing argument for --events-dir');
        process.exit(1);
      }
      eventsDir = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--dry-run' || arg === '-n') {
      dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
CNCF Peshawar - OCG Event Sync Automation

Usage:
  node scripts/sync-ocg-events.mjs [options]

Options:
  --source, -s <url_or_file>   OCG group/event URL or local HTML fixture (Default: ${DEFAULT_OCG_GROUP_URL})
  --events-dir, -d <path>      Destination directory for event Markdown files (Default: src/content/events)
  --dry-run, -n                Simulate synchronization without writing changes to disk
  --help, -h                   Show this help message
      `);
      process.exit(0);
    }
  }

  try {
    const result = await syncEvents({ source, eventsDir, dryRun });
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error(`[ERROR] Synchronization failed: ${err.message}`);
    process.exit(1);
  }
}

// Execute if run directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('sync-ocg-events.mjs') ||
  process.argv[1].endsWith('sync-ocg-events.js') ||
  import.meta.url === pathToFileURL(process.argv[1]).href
);

if (isDirectRun) {
  main();
}
