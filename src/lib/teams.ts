import type { CollectionEntry } from 'astro:content';

export interface WorkingGroupDef {
  slug: string;
  iconTitle: string;
  code: string;
  title: string;
  desc: string;
  teamValue: string;
}

export const WORKING_GROUP_DEFS: WorkingGroupDef[] = [
  {
    slug: 'tech-team',
    iconTitle: 'Tech',
    code: 'WG-TECH',
    title: 'Tech Team',
    desc: 'Engineers and developers building workshops, maintaining lab repositories, and driving technical content.',
    teamValue: 'Tech Team',
  },
  {
    slug: 'events-team',
    iconTitle: 'Events',
    code: 'WG-EVT',
    title: 'Events Team',
    desc: 'The logistics, hosting, and operations crew ensuring every meetup runs smoothly.',
    teamValue: 'Events Team',
  },
  {
    slug: 'community-outreach',
    iconTitle: 'Outreach',
    code: 'WG-OUT',
    title: 'Community & Outreach',
    desc: 'Campus ambassadors, partnership leads, and outreach coordinators expanding our reach across KPK.',
    teamValue: 'Community & Outreach',
  },
  {
    slug: 'design-media',
    iconTitle: 'Design',
    code: 'WG-DSG',
    title: 'Design & Media',
    desc: 'Creatives handling event photography, videography, graphics, and visual branding.',
    teamValue: 'Design & Media',
  },
];

export function buildWorkingGroups(sortedMembers: CollectionEntry<'members'>[]) {
  return WORKING_GROUP_DEFS.map((def) => ({
    ...def,
    members: sortedMembers.filter((m) => m.data.team === def.teamValue),
  })).filter((group) => group.members.length > 0);
}

export function getAvatarSrc(base: string, avatar?: string) {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${base}${avatar}`;
}