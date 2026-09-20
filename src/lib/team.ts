import type { CollectionEntry } from 'astro:content';

export interface WorkingGroupDef {
  slug: string;
  icon: string;
  code: string;
  title: string;
  desc: string;
  teamValue: string;
}

export const WORKING_GROUP_DEFS: WorkingGroupDef[] = [
  {
    slug: 'tech-team',
    icon: 'terminal',
    code: 'WG-TECH',
    title: 'Tech Team',
    desc: 'Engineers and developers building workshops, maintaining lab repositories, and driving technical content.',
    teamValue: 'Tech Team',
  },
  {
    slug: 'events-team',
    icon: 'event_seat',
    code: 'WG-EVT',
    title: 'Events Team',
    desc: 'The logistics, hosting, and operations crew ensuring every meetup runs smoothly.',
    teamValue: 'Events Team',
  },
  {
    slug: 'community-outreach',
    icon: 'hub',
    code: 'WG-OUT',
    title: 'Community & Outreach',
    desc: 'Campus ambassadors, partnership leads, and outreach coordinators expanding our reach across KPK.',
    teamValue: 'Community & Outreach',
  },
  {
    slug: 'design-media',
    icon: 'palette',
    code: 'WG-DSG',
    title: 'Design & Media',
    desc: 'Creatives handling event photography, videography, graphics, and visual branding.',
    teamValue: 'Design & Media',
  },
];

export function buildWorkingGroups(sortedTeam: CollectionEntry<'team'>[]) {
  return WORKING_GROUP_DEFS.map((def) => ({
    ...def,
    members: sortedTeam.filter((m) => !m.data.isLead && m.data.team === def.teamValue),
  })).filter((group) => group.members.length > 0);
}

export function getAvatarSrc(base: string, avatar?: string) {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${base}${avatar}`;
}

export function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}
