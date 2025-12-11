# LG News Roundup (Astro frontend)

This `frontend` directory hosts the Astro-based version of the LG News Roundup site. It mirrors the legacy static homepage (in the repo root) using the same markup, styling, JavaScript, and feed assets.

## Prerequisites
- Node.js 18+
- npm 9+

## Install dependencies
From the repo root:

```bash
cd frontend
npm install
```

> **Note:** If you are running in GitHub Codespaces or a locked-down network, you may need to allow access to `https://registry.npmjs.org/` or configure your private npm proxy. Installation will create `node_modules` and a `package-lock.json` for reproducible builds.

## Development server
Run the Astro dev server and expose it on all interfaces (helpful for Codespaces previews):

```bash
npm run dev
```

This serves the site at `http://localhost:4321` by default.

## Production build
To generate the static site output in `frontend/dist`:

```bash
npm run build
```

You can preview the built output locally:

```bash
npm run preview
```

## Testing and checks
Use Astro's static analysis to verify the project:

```bash
npm run check
```

## Asset parity with the legacy site
The Astro frontend reuses the same assets as the original static version:
- `public/app.js` mirrors the legacy `app.js` behavior for theming and feed parsing.
- `src/styles/global.css` is the legacy stylesheet (with Tailwind directives prepended for future utility use).
- `public/feed.xml`, `public/logo.svg`, and `public/favicon.png` are copied directly from the legacy files.

Those mirrored assets are **not** tracked inside `frontend/public` to avoid binary-file noise in pull requests. The copies are created automatically during `npm install` via the helper script:

```bash
npm run sync:assets
```

You can rerun the helper at any time after updating the root assets:

```bash
./scripts/sync-frontend-public.sh
```

This copies the root `app.js`, `feed.xml`, favicon, and logo files into `frontend/public` so the Astro build renders exactly like the legacy static page.
