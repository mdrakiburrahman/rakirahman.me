# rakirahman.me Constitution

Personal blog and portfolio site built as a statically generated website with minimal dependencies.

## Core Principles

### I. Dependency Minimalism

**Rule**: No new dependencies may be added unless absolutely necessary and explicitly justified.

**Rationale**: The project intentionally maintains a locked dependency tree (Node 14.2.0, Gatsby 2.x) to avoid dependency hell and ensure long-term build stability. Every new dependency introduces maintenance burden, security surface area, and potential for version conflicts.

**Application**:
- Before adding any package, MUST exhaust native browser APIs, React built-ins, or existing project utilities
- Justify each dependency with: problem statement, alternatives considered, why native solution insufficient
- Prefer copying small utility functions over adding entire libraries
- When dependencies are unavoidable, lock exact versions in package.json

### II. Style Consistency

**Rule**: All styling MUST use the color scheme defined in `src/assets/css/index.css` through CSS custom properties.

**Rationale**: Centralized color scheme ensures visual consistency, enables theme switching (light/dark), and prevents style fragmentation across the codebase.

**Application**:
- Use CSS variables exclusively: `var(--color-bg-primary)`, `var(--color-text-accent)`, etc.
- Never hardcode color values in component styles or Tailwind classes
- New color needs MUST be added to both `.light` and `.dark` theme definitions in index.css
- Component-specific styles should import from `src/assets/css/` and extend custom properties
- Follow existing naming convention: `--color-{type}-{variant}` (e.g., `--color-text-secondary`)

### III. Static-First Architecture

**Rule**: All features must build to static HTML/CSS/JS. No server-side frameworks or runtime dependencies permitted.

**Rationale**: The site is deployed to Azure Storage as a static site. Introducing server dependencies would require infrastructure changes and violate the deployment model.

**Application**:
- Data fetching happens at build time via Gatsby's GraphQL layer
- External data sources integrated through Gatsby source plugins during `gatsby build`
- No Express servers, API routes requiring Node runtime, or server-side rendering beyond Gatsby SSG
- Interactive features implemented with client-side JavaScript only
- Forms must use third-party services (e.g., Netlify Forms, FormSpree) or static form handlers

### IV. Content-Driven Development

**Rule**: Content is authored in MDX files in `content/` directory and queried through GraphQL. Component logic is separated from content.

**Rationale**: MDX allows rich, interactive content while maintaining separation of concerns. GraphQL provides a type-safe query layer for build-time data fetching.

**Application**:
- All blog posts and portfolio items authored as `content/{slug}/index.mdx`
- Frontmatter defines metadata (title, date, tags, etc.)
- Images co-located in `content/{slug}/images/` and processed via gatsby-image
- React components imported in MDX when interactivity needed
- GraphQL queries live in page templates, not in MDX files
- New content types require: GraphQL schema extension, page template, and source plugin configuration

### V. Build Stability

**Rule**: Dependency versions are locked and upgrades require explicit validation across the full build pipeline.

**Rationale**: Node.js and npm ecosystem instability has caused breaking changes in the past. Version locking ensures reproducible builds across machines and time.

**Application**:
- Node.js locked to 14.2.0 (specified in README)
- Gatsby CLI locked to 2.12.21
- All dependencies use exact versions (no `^` or `~` in package.json)
- Upgrades require: local build test, Storybook verification, production build check, visual regression review
- Breaking package.json changes documented in commit messages with rollback procedure

## Technology Stack

This section defines the permitted and prohibited technologies for the project.

**Core Framework**:
- Gatsby 2.x (static site generator)
- React 16.x (UI library)
- GraphQL (build-time data layer)

**Styling**:
- Tailwind CSS 1.x (utility-first CSS framework)
- CSS custom properties (for theming)
- PostCSS (for CSS processing)

**Content**:
- MDX (Markdown + JSX)
- gatsby-plugin-mdx (MDX integration)
- PrismJS (syntax highlighting)

**Development Tools**:
- Storybook 5.x (component development)
- Prettier (code formatting)
- Node.js 14.2.0 (runtime)

**Prohibited**:
- Server frameworks (Express, Koa, Fastify, etc.)
- CSS-in-JS libraries beyond Tailwind (styled-components, emotion, etc.)
- State management libraries (Redux, MobX, Zustand, etc.) unless justified per Principle I
- Additional build tools beyond Gatsby's webpack config

## Development Standards

**Code Organization**:
- Components in `src/components/`
- Page templates in `src/pages/`
- Hooks in `src/hooks/`
- Shared context in `src/context/`
- Static assets in `static/`
- Content in `content/`

**Styling Workflow**:
1. Check if needed styles exist in `src/assets/css/`
2. Use Tailwind utilities with color variable classes where possible
3. For custom styles, create component-specific CSS importing from `src/assets/css/`
4. New colors MUST be added to both light and dark themes in `index.css`

**Content Workflow**:
1. Create `content/{slug}/` directory
2. Add `index.mdx` with frontmatter
3. Place images in `content/{slug}/images/`
4. Query via GraphQL in page template
5. Verify build with `gatsby develop`

**Build Verification**:
- `gatsby develop` for development server (localhost:8000)
- `gatsby build` for production build validation
- `gatsby serve` for production preview (localhost:9000)
- Storybook for component isolation (`npm run storybook`)

**Version**: 1.0.0 | **Ratified**: 2026-02-15 | **Last Amended**: 2026-02-15
