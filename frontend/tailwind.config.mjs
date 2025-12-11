import { defineConfig } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default defineConfig({
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  },
  plugins: [typography]
});
