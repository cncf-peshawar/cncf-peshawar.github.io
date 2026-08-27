import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://cloud-native-peshawar.github.io',
  base: '/cncf-peshawar-website',

  vite: {
    plugins: [tailwindcss()],
  },
});