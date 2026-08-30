// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://cncf-peshawar.github.io',
  integrations: [mdx()],
  build: {
    format: 'directory'
  }
});
