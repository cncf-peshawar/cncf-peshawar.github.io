/**
 * Shared speaker-key normalization.
 *
 * Single source of truth used by both the site (`src/lib/speakers.ts`) and the
 * event-sync script (`scripts/sync-ocg-events.mjs`) so canonical speaker keys
 * can never drift between the two consumers.
 */

/**
 * Common honorifics and professional titles to strip when canonicalizing speaker keys.
 */
export const HONORIFIC_PREFIXES = /^(?:dr|doctor|prof|professor|engr|engineer|mr|mrs|ms)(?:\.|\b)[\s-]*/i;

/**
 * Normalizes a speaker name, title, or slug into a canonical kebab-case identifier.
 * Strips parentheses, honorifics, diacritics, and punctuation to ensure robust deduplication
 * across casing, punctuation, and honorific variations.
 *
 * @example
 * normalizeSpeakerKey("Dr. Syed Hassan Tayyab") // "syed-hassan-tayyab"
 * normalizeSpeakerKey("Syed Hassan Tayyab (Co Founder & AI Product Developer)") // "syed-hassan-tayyab"
 * normalizeSpeakerKey("syed-hassan-tayyab") // "syed-hassan-tayyab"
 *
 * @param {string} raw
 * @returns {string}
 */
export function normalizeSpeakerKey(raw) {
  if (!raw || typeof raw !== 'string') return '';

  return raw
    // Remove parenthetical details like "(Co-Founder & AI Lead)"
    .replace(/\(.*?\)/g, '')
    .trim()
    // Remove leading honorifics / academic titles
    .replace(HONORIFIC_PREFIXES, '')
    // Normalize unicode diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // Replace non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    // Collapse consecutive whitespace and hyphens
    .replace(/[\s-]+/g, '-')
    // Trim leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}
