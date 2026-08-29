import { defineCollection, z } from 'astro:content';

const events = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    time: z.string(),
    venue: z.string(),
    location: z.string().default('Peshawar, KPK, Pakistan'),
    status: z.enum(['upcoming', 'completed']).default('upcoming'),
    capacity: z.number().optional(),
    rsvpUrl: z.string().url(),
    lumaUrl: z.string().url().optional(),
    slidesUrl: z.string().url().optional(),
    recordingUrl: z.string().url().optional(),
    coverImage: z.string().optional(),
    speakers: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    summary: z.string()
  })
});

const speakers = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    organization: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
    topic: z.string(),
    slidesUrl: z.string().url().optional(),
    recordingUrl: z.string().url().optional(),
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    featured: z.boolean().default(false)
  })
});

const sponsors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    tier: z.enum(['Venue', 'Refreshment', 'Community', 'Ecosystem', 'Annual', 'Event Sponsor']),
    logo: z.string().optional(),
    website: z.string().url(),
    description: z.string(),
    active: z.boolean().default(true),
    perks: z.array(z.string()).default([])
  })
});

const team = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    company: z.string().optional(),
    avatar: z.string().optional(),
    github: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linuxFoundationUser: z.string().optional(),
    isLead: z.boolean().default(false),
    order: z.number().default(99)
  })
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    author: z.string(),
    authorRole: z.string().default('CNCF Peshawar Organizer'),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
});

export const collections = {
  events,
  speakers,
  sponsors,
  team,
  blog
};
