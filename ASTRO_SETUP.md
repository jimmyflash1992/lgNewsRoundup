Astro frontend setup (firstdraft branch)

This repository includes a helper script at `scripts/create-astro-frontend.sh` and step-by-step instructions to create an Astro frontend in `./frontend` while preserving the existing UI.

Quick (automated):

1. Ensure you're on branch `firstdraft` and at the repo root.
2. Run:

   chmod +x scripts/create-astro-frontend.sh
   ./scripts/create-astro-frontend.sh

Manual steps (summary):

1. From repo root, ensure branch `firstdraft`.
2. Create Astro: `npm create astro@latest frontend -- --template blog` then `cd frontend` and `npm install`.
3. Add Tailwind + sitemap: `npx astro add tailwind` and `npx astro add sitemap`.
4. Copy assets: `cp ../logo.svg public/logo.svg` (and `favicon.png`).
5. Append the repo `styles.css` into `frontend/src/styles/global.css` below Tailwind directives.
6. Add the following project files (templates available in the planning prompt):
   - `src/layouts/BaseLayout.astro`
   - `src/lib/wp.ts`
   - `src/components/FeaturedStory.astro`
   - `src/components/StoryGrid.astro`
   - `src/pages/index.astro`
   - `src/pages/posts/[slug].astro`

If you want me to proceed and run the automated script here in the Codespace, confirm and I'll run it. Alternatively I can create the skeleton Astro files inside `frontend/src` now.
