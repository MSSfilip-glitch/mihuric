import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections for Mihurić.
 *
 * Every page whose content should be editable without touching a template
 * lives in one of these collections. The scrape script populates them from
 * the current WordPress site; manual refinement happens afterward.
 *
 * Content is bilingual (en, hr) — the locale is encoded in the filename:
 *   src/content/dive-sites/shipwreck-peltastis.en.mdx
 *   src/content/dive-sites/shipwreck-peltastis.hr.mdx
 */

const locales = ['en', 'hr'] as const;

const diveSites = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/dive-sites' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      locale: z.enum(locales),
      summary: z.string(),
      depth: z.object({
        min: z.number(),
        max: z.number(),
      }),
      certification: z.enum([
        'Discover Scuba',
        'Open Water',
        'Advanced Open Water',
        'Rescue',
        'Divemaster',
        'Tec',
      ]),
      entry: z.enum(['boat', 'shore', 'boat-or-shore']).optional(),
      difficulty: z.enum(['easy', 'moderate', 'challenging', 'advanced']).optional(),
      visibility: z.string().optional(),
      currents: z.string().optional(),
      marineLife: z.array(z.string()).default([]),
      gps: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
      hero: image().optional(),
      gallery: z.array(image()).default([]),
      category: z.enum(['reef', 'wreck', 'cave', 'wall', 'house-reef']).optional(),
      draft: z.boolean().default(false),
    }),
});

const courses = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/courses' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      locale: z.enum(locales),
      track: z.enum(['discovery', 'recreational', 'specialty', 'professional', 'tec']),
      summary: z.string(),
      duration: z.string().optional(),
      prerequisites: z.array(z.string()).default([]),
      includes: z.array(z.string()).default([]),
      priceFrom: z
        .object({
          amount: z.number(),
          currency: z.string().default('EUR'),
        })
        .optional(),
      certification: z.string().optional(),
      hero: image().optional(),
      draft: z.boolean().default(false),
    }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/faq' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    locale: z.enum(locales),
    topic: z.enum(['courses', 'diving', 'equipment', 'cost', 'safety', 'vacationing']),
    entries: z.array(
      z.object({
        q: z.string(),
        a: z.string(),
      })
    ),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      locale: z.enum(locales),
      description: z.string(),
      hero: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { diveSites, courses, faq, pages };
