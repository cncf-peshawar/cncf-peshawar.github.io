import type { CollectionEntry } from 'astro:content';
import { HONORIFIC_PREFIXES, normalizeSpeakerKey } from './speaker-key.mjs';

export { normalizeSpeakerKey };

/**
 * Extracts initials from a speaker's full name.
 * Gracefully handles single names, multiple spaces, and honorifics.
 */
export function getSpeakerInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'SP';

  const cleaned = name
    .replace(/\(.*?\)/g, '')
    .replace(HONORIFIC_PREFIXES, '')
    .trim();

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Parses a display-only speaker string into clean name, role, and organization parts.
 *
 * @example
 * parseSpeakerDisplay("John Doe (DevOps Lead at Acme Corp)")
 * // => { name: "John Doe", role: "DevOps Lead", organization: "Acme Corp" }
 */
export function parseSpeakerDisplay(raw: string): {
  name: string;
  role: string;
  organization: string;
} {
  if (!raw || typeof raw !== 'string') {
    return { name: 'Community Speaker', role: 'Speaker', organization: 'Cloud Native Peshawar' };
  }

  const trimmed = raw.trim();
  const parenMatch = trimmed.match(/^(.+?)\s*\((.*?)\)$/);

  if (parenMatch) {
    const name = parenMatch[1].trim();
    const roleDetails = parenMatch[2].trim();

    // Check for " at " or " @ " separator within role details
    const atMatch = roleDetails.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (atMatch) {
      return {
        name,
        role: atMatch[1].trim(),
        organization: atMatch[2].trim()
      };
    }

    return {
      name,
      role: roleDetails,
      organization: 'Cloud Native Peshawar'
    };
  }

  return {
    name: trimmed,
    role: 'Speaker / Community Contributor',
    organization: 'Cloud Native Peshawar'
  };
}

export interface ResolvedSpeaker {
  slug: string;
  name: string;
  role: string;
  organization: string;
  bio?: string;
  topic?: string;
  avatar?: string;
  initials: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  slidesUrl?: string;
  recordingUrl?: string;
  isProfile: boolean;
  entry?: CollectionEntry<'speakers'>;
}

/**
 * Resolves a single speaker reference string against approved profiles in the speakers collection.
 * Supports stable slugs (e.g. "syed-hassan-tayyab"), names with honorifics, or display strings.
 * Falls back gracefully to an unlinked display representation if no profile matches.
 */
export function resolveSpeakerReference(
  ref: string,
  profiles: CollectionEntry<'speakers'>[] = []
): ResolvedSpeaker {
  const normalizedKey = normalizeSpeakerKey(ref);

  // 1. Direct slug or ID match (stable identifier)
  let matched = profiles.find(
    (p) => p.slug === ref || p.id === ref || p.id === `${ref}.md`
  );

  // 2. Normalized slug match
  if (!matched) {
    matched = profiles.find((p) => normalizeSpeakerKey(p.slug) === normalizedKey);
  }

  // 3. Normalized name match (handles casing, punctuation, honorifics)
  if (!matched) {
    matched = profiles.find((p) => normalizeSpeakerKey(p.data.name) === normalizedKey);
  }

  // Profile exists: return complete verified profile details
  if (matched) {
    return {
      slug: matched.slug,
      name: matched.data.name,
      role: matched.data.role,
      organization: matched.data.organization,
      bio: matched.data.bio,
      topic: matched.data.topic,
      avatar: matched.data.avatar,
      initials: getSpeakerInitials(matched.data.name),
      github: matched.data.github,
      linkedin: matched.data.linkedin,
      twitter: matched.data.twitter,
      slidesUrl: matched.data.slidesUrl,
      recordingUrl: matched.data.recordingUrl,
      isProfile: true,
      entry: matched
    };
  }

  // Profile does not exist: return sensible display-only representation
  const parsed = parseSpeakerDisplay(ref);
  return {
    slug: normalizedKey || 'speaker',
    name: parsed.name,
    role: parsed.role,
    organization: parsed.organization,
    initials: getSpeakerInitials(parsed.name),
    isProfile: false
  };
}

/**
 * Resolves an array of event speaker references and eliminates duplicates
 * that may arise from casing, honorifics, or punctuation variations.
 */
export function resolveEventSpeakers(
  speakerRefs: string[] | undefined,
  profiles: CollectionEntry<'speakers'>[] = []
): ResolvedSpeaker[] {
  if (!Array.isArray(speakerRefs) || speakerRefs.length === 0) {
    return [];
  }

  const resolvedList: ResolvedSpeaker[] = [];
  const seenKeys = new Set<string>();

  for (const ref of speakerRefs) {
    const resolved = resolveSpeakerReference(ref, profiles);
    const dedupeKey = resolved.slug;

    if (!seenKeys.has(dedupeKey)) {
      seenKeys.add(dedupeKey);
      resolvedList.push(resolved);
    } else if (resolved.isProfile) {
      // If a previous unlinked representation was encountered and this one is a verified profile, upgrade it
      const index = resolvedList.findIndex((item) => item.slug === dedupeKey);
      if (index !== -1 && !resolvedList[index].isProfile) {
        resolvedList[index] = resolved;
      }
    }
  }

  return resolvedList;
}

/**
 * Deduplicates speaker collection entries to prevent accidental duplication
 * from casing, honorifics, or punctuation variances in authoring.
 */
export function deduplicateSpeakers(
  speakers: CollectionEntry<'speakers'>[]
): CollectionEntry<'speakers'>[] {
  if (!Array.isArray(speakers) || speakers.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const unique: CollectionEntry<'speakers'>[] = [];

  for (const speaker of speakers) {
    const key = normalizeSpeakerKey(speaker.slug) || normalizeSpeakerKey(speaker.data.name);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(speaker);
    }
  }

  return unique;
}
