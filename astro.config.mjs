// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://cloud-native-peshawar.github.io',
  base: '/cncf-peshawar-website',
  integrations: [mdx()],
  build: {
    format: 'directory'
  }
});
