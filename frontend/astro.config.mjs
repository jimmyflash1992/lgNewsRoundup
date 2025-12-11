import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lgnewsroundup.com',
  integrations: [tailwind({ applyBaseStyles: false }), sitemap()]
});
