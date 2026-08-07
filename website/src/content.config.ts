import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Blog collection.
 *
 * Frontmatter is schema-validated so a malformed post fails the build rather
 * than shipping a page with a missing description or date — both of which would
 * silently degrade the SEO layer, since `description` becomes the meta
 * description and `updated` becomes `dateModified` in the Article schema.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Shown as the eyebrow, and used to group related reading. */
    topic: z.string(),
    readingMinutes: z.number().int().positive(),
    /** Direct Q→A pairs appended to the post — the format AI engines quote. */
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional()
      .default([]),
    draft: z.boolean().optional().default(false),
  }),
})

export const collections = { blog }
