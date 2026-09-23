import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Synced Markdown lands in src/content/docs/ (gitignored, generated).
// The sync injects the `title` frontmatter Starlight requires.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
