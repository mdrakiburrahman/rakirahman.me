# Copilot instructions for rakirahman.me

Personal blog built with **Gatsby 2**, React 16, MDX, and Tailwind CSS. Content is a
set of MDX posts under `content/`, statically built with `gatsby build` and hosted from
an Azure Storage Account static website behind a CDN.

## Commands

- `gatsby develop` (or `npm run develop` / `npm start`) — dev server at `localhost:8000`,
  GraphiQL/playground at `localhost:8000/___graphql`.
- `npm run build` — production build to `public/` (`gatsby build`).
- `npm run serve` — serve the built `public/` output.
- `npm run clean` — clear `.cache/` and `public/` (run this after changing
  `gatsby-*.js`, GraphQL queries, or when the dev server behaves oddly).
- `npm run format` — Prettier over `**/*.{js,jsx,json,md}`.
- `npm run storybook` — component workbench at `localhost:6006`; `npm run build-storybook`.
- `npm test` — **not implemented** (placeholder that echoes and exits 1). There is no test suite.

Node 14.x is used in CI. First-time Linux/WSL setup is scripted in
`contrib/bootstrap-dev-env.sh` (see `contrib/README.md`); it installs tooling idempotently.

## Architecture

- **Content is data.** Each post is a folder `content/<slug>/index.mdx` plus its images
  (`content/<slug>/images/*` and `featured-image.png`). `gatsby-source-filesystem` sources
  both `content/` (as `blog`) and `src/assets/images`.
- **Pages are generated in `gatsby-node.js`.** `onCreateNode` derives a `slug` field from the
  file path; `createPages` queries `allMdx` and renders every post through
  `src/components/postLayout.js`, passing `{ id, ogImageSlug }` in page context. There is no
  manual routing for posts — adding a `content/<slug>/index.mdx` folder creates the page.
- **Standalone pages** live in `src/pages/` (`index.js`, `about.js`, `404.js`).
- **MDX rendering** goes through `gatsby-plugin-mdx` (`postLayout.js` uses `MDXRenderer` +
  `MDXProvider`). Posts `import` shared components directly from
  `src/components/atoms.js` (e.g. `Callout`, `ExtLink`, `InlinePageLink`), and a few are
  registered as global shortcodes in `postLayout.js` (`ExtLink`, `Link`, `QuoteBlock`).
- **Shared UI** is centralized in `src/components/atoms.js` (exported building blocks like
  `TagBadge`, `BlogTitle`, `Button`, `Callout`, `QuoteBlock`). Theme (dark mode) state is in
  `src/context/themeContext.js`.
- **Styling** is Tailwind (`tailwind.config.js`, `@tailwindcss/typography` `prose` classes)
  plus CSS in `src/assets/css/`. PrismJS handles code-block syntax highlighting.
- **CI/CD** (`.github/workflows/main.yml`) runs on push to `master`: `gatsby build`, then
  `az storage blob upload-batch` to the `$web` container, then an Azure CDN purge. Azure
  credentials come from repo secrets.

## Conventions

- **Adding a blog post:** copy `content/_capabilities-template/` to `content/<new-slug>/`.
  Required frontmatter: `title`, `date` (`YYYY-MM-DD`), `published` (bool — only `true` posts
  appear in lists/RSS), `tags` (array), `description`, `toc` (bool), `seoImage` (a filename in
  `src/assets/images/`, e.g. `og-<slug>.png`), `featuredImage` (`./featured-image.png`).
- Reference in-post images with relative paths (`images/foo.png`); OG/social images go in
  `src/assets/images/` and are referenced by filename via `seoImage`.
- **Prettier config is unusual:** no semicolons (`"semi": false`) and `"arrowParens": "avoid"`.
  Match existing style — omit semicolons and bare single-arg arrow params.
- `src/pages/about.js` doubles as an interactive résumé/capabilities page; keep post content in
  `content/`, not in `src/pages/`.
- The GitHub remote/repo slug is `mdrakiburrahman/rakirahman.me` (older references may say
  `gatsby-blog`).
