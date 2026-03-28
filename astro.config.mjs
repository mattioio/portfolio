// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mattioio.github.io',
  base: '/portfolio',
  integrations: [sitemap()],
  image: {
    domains: [],
  },
});
