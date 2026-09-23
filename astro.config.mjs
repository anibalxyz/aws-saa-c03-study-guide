import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// PR3: component overrides for quiz progress (Footer sentinel, sidebar
// checkmarks, top-bar badge). PWA is manual (scripts/generate-sw.js +
// src/pwa.ts + public/manifest.webmanifest): the @vite-pwa/astro wrapper
// capped Astro at v5, so the service worker is built with workbox-build
// directly over dist/ instead.
//
// Vercel serves the site at the domain root, so there is deliberately no
// `base` (Astro default `/`). Production domain set for sitemap +
// canonical links.
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  site: 'https://aws-saa-c03-study-guide.vercel.app',
  integrations: [
    starlight({
      title: 'AWS SAA-C03 Study Guide',
      description: 'Mobile-first study companion for the SAA-C03 exam.',
      customCss: ['./src/styles/custom.css'],
      components: {
        Footer: './src/components/Footer.astro',
        Head: './src/components/Head.astro',
        Sidebar: './src/components/Sidebar.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },
      sidebar: [
        { label: '01 · AWS Fundamentals', collapsed: true, items: [{ autogenerate: { directory: '01-aws-fundamentals', collapsed: true } }] },
        { label: '02 · IAM', collapsed: true, items: [{ autogenerate: { directory: '02-iam', collapsed: true } }] },
        { label: '03 · Compute', collapsed: true, items: [{ autogenerate: { directory: '03-compute', collapsed: true } }] },
        { label: '04 · Storage', collapsed: true, items: [{ autogenerate: { directory: '04-storage', collapsed: true } }] },
        { label: '05 · Database', collapsed: true, items: [{ autogenerate: { directory: '05-database', collapsed: true } }] },
        { label: '06 · Networking', collapsed: true, items: [{ autogenerate: { directory: '06-networking', collapsed: true } }] },
        { label: '07 · Security', collapsed: true, items: [{ autogenerate: { directory: '07-security', collapsed: true } }] },
        { label: '08 · Application Integration', collapsed: true, items: [{ autogenerate: { directory: '08-application-integration', collapsed: true } }] },
        { label: '09 · Monitoring', collapsed: true, items: [{ autogenerate: { directory: '09-monitoring', collapsed: true } }] },
        { label: '10 · Migration', collapsed: true, items: [{ autogenerate: { directory: '10-migration', collapsed: true } }] },
        { label: '11 · Analytics', collapsed: true, items: [{ autogenerate: { directory: '11-analytics', collapsed: true } }] },
        { label: '12 · Architecture Patterns', collapsed: true, items: [{ autogenerate: { directory: '12-architecture-patterns', collapsed: true } }] },
        { label: '13 · Cost Optimization', collapsed: true, items: [{ autogenerate: { directory: '13-cost-optimization', collapsed: true } }] },
        { label: '14 · Practice', collapsed: true, items: [{ autogenerate: { directory: '14-practice', collapsed: true } }] },
      ],
    }),
  ],
});
