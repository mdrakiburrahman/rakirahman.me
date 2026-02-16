# Implementation Plan: Blog Tag Filtering and Search

**Branch**: `001-tag-filter-search` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)

## Summary

Add interactive tag filtering and search functionality to the blog homepage and individual posts. Tags with post counts display in a minimal darker bar positioned after "LATEST ARTICLES". Users can select multiple tags (OR filtering), search by keywords, and view tags on individual post pages. All filtering happens client-side using React state management, requiring no new dependencies. The implementation leverages existing GraphQL queries (tags already available), follows the established themeContext state pattern, and uses CSS custom properties from [src/assets/css/index.css](../../src/assets/css/index.css) for consistent theming.

**Key Decisions:**
- Search bar placed at very top of page (before header) per clarifications
- Tags ordered by post count descending in filter bar
- Tags are display-only (non-clickable) in listings and individual posts
- Selected tags use combined background + border visual treatment
- Individual post tags use horizontal scroll when overflowing
- No new npm dependencies (constitutional constraint)
- Client-side filtering using React useState/useEffect pattern

## Steps

### 1. Create Tag Badge Component

Create reusable tag display component in [src/components/atoms.js](../../src/components/atoms.js) with variants for clickable filter tags and display-only labels.

- Add `TagBadge` component to atoms.js
- Props: `name` (string), `count` (number, optional), `selected` (boolean, default false), `clickable` (boolean, default false), `onClick` (function, optional)
- Styling: pill shape using Tailwind utilities with `var(--color-bg-secondary)`, `var(--color-text-secondary)`, `var(--color-text-accent)`
- Selected state: different background (`var(--color-bg-accent)`) and border (`var(--color-text-accent)`)
- Non-clickable variant: no hover effects, slightly muted appearance
- Responsive: text-sm on mobile, handles long tag names with text truncation

### 2. Create Tag Filter Bar Component

Build horizontal tag filter bar component that displays all unique tags sorted by popularity with multi-select capability.

- Create [src/components/tagFilterBar.js](../../src/components/tagFilterBar.js)
- Props: `tags` (array of {name, count}), `selectedTags` (array of strings), `onTagToggle` (function), `onClearAll` (function)
- Layout: horizontal flexbox with `bg-secondary` background, padding, and gap between tags
- Render TagBadge for each tag (clickable variant) showing "name (count)" format
- "Clear All" button styled consistently with existing buttons, only visible when selectedTags.length > 0
- Horizontal overflow scroll for many tags with `-webkit-overflow-scrolling: touch`
- Position: renders immediately after "LATEST ARTICLES" heading per spec

### 3. Create Search Bar Component

Build minimal search input component positioned at very top of homepage before site header.

- Create [src/components/searchBar.js](../../src/components/searchBar.js)
- Props: `value` (string), `onChange` (function), `placeholder` (string, default "Search blog posts...")
- Styling: full-width input with subtle border, uses `var(--color-bg-secondary)` background, `var(--color-text-primary)` text
- Responsive: appropriate padding for mobile/desktop, clear "X" button when value is not empty  
- Accessibility: proper label, aria attributes, keyboard navigation support
- Position: renders at very top of page before Layout/Header components

### 4. Add Tag Filtering State to PostList Component

Enhance [src/components/postList.js](../../src/components/postList.js) with client-side filtering state and logic.

- Import React.useState and React.useEffect
- Add state: `const [selectedTags, setSelectedTags] = React.useState([])`
- Add state: `const [searchQuery, setSearchQuery] = React.useState('')`
- Calculate unique tags from GraphQL data: reduce over all posts, count occurrences, sort by count descending
- Implement filter logic: `filteredPosts = allPosts.filter(post => matchesTags && matchesSearch)`
  - Tag matching: OR logic (any selected tag), no filter if selectedTags is empty
  - Search matching: case-insensitive search in title, description, excerpt, and tags array
  - Combined: posts must match tags (OR) AND search query
- Handle de-duplication: ensure posts appear only once when matching multiple selected tags
- Handle empty results: display "No posts found" message with helpful text

### 5. Integrate Tag Filter Bar into PostList

Add TagFilterBar component rendering to PostList between heading and blog listings.

- Import TagFilterBar component
- Position: render after `<h2>LATEST ARTICLES</h2>` and disclaimer, before `<ul>` of posts
- Pass props: all unique tags sorted by count, selectedTags state, onTagToggle handler, onClearAll handler
- Implement onTagToggle: toggle tag in/out of selectedTags array using setSelectedTags
- Implement onClearAll: reset selectedTags to empty array
- Ensure tag bar displays on initial render with no tags selected

### 6. Add Tag Display to Blog Listings

Show tags at bottom of each blog post preview in PostList.

- Modify Post component render in [postList.js](../../src/components/postList.js)
- Extract `tags` from `node.frontmatter` (already available in GraphQL query)
- Render horizontal flex container at bottom of each post (after date)
- Map over tags array and render TagBadge for each (non-clickable variant, no count)
- Horizontal scroll CSS: `overflow-x: auto` with `-webkit-overflow-scrolling: touch`
- Handle posts with no tags: don't render tag container at all (graceful degradation)
- Styling: subtle color using `var(--color-text-tertiary)`, smaller size than filter bar tags

### 7. Integrate Search Bar into Homepage

Add SearchBar component to homepage at very top of page before header.

- Modify [src/pages/index.js](../../src/pages/index.js)
- Render SearchBar before Layout component
- **Decision (RESOLVED)**: Keep all filter state in PostList component following existing themeContext pattern
- Implementation approach:
  - PostList manages both selectedTags and searchQuery state
  - PostList accepts searchQuery and setSearchQuery as props (lifted from index.js if needed)
  - OR: Export PostList's setSearchQuery via callback pattern to SearchBar
  - Recommended: Pass searchQuery value and onChange handler from PostList to SearchBar as props
- Position SearchBar with appropriate margin/padding for visual separation from header
- Rationale: Avoids unnecessary state lifting, keeps filter logic co-located with filter UI, matches existing component patterns

### 8. Update Individual Blog Post Template

Add tag display to individual blog post pages in post header after publication date.

- Modify [src/components/postLayout.js](../../src/components/postLayout.js) 
- Add `tags` field to GraphQL query frontmatter block: `frontmatter { ... tags }`
- Extract tags from query result
- Render tag container after `<BlogTitleInfo>` component (which shows date)
- Map over tags array and render TagBadge for each (non-clickable variant, no count)
- Horizontal scroll CSS for overflow: single-line flexbox with `overflow-x: auto`
- Handle posts with no tags: don't render tag container (graceful degradation)
- Styling: consistent with homepage tag displays using same TagBadge component and variables

### 9. Add Tag-Specific Styling

Create dedicated CSS file for tag-related custom styles that complement Tailwind utilities.

- Create [src/assets/css/tags.css](../../src/assets/css/tags.css)
- Define `.tag-filter-bar` class: darker background (`var(--color-bg-secondary)`), padding, border radius
- Define `.tag-badge` class: pill shape, padding, transitions for hover states
- Define `.tag-badge-selected` class: accent background and border using `var(--color-bg-accent)` and `var(--color-text-accent)`
- Define `.tag-scroll-container` class: horizontal scroll with custom scrollbar styling for both webkit and firefox
- Ensure scrollbar is visible but minimal (4px height) and uses theme-appropriate colors
- Import tags.css in components that need it (or in index.css)

### 10. Handle Edge Cases and Validation

Implement graceful handling for edge cases identified in spec.

- Empty tags array in frontmatter: skip tag rendering sections, don't show empty containers
- No posts match filters: display "No posts found. Try adjusting your filters or search query." message
- Special characters in search query: escape regex special characters or use simple string includes
- Very long tag names: apply text truncation with ellipsis beyond reasonable length (e.g., max-w-32)
- Post matches multiple selected tags: ensure de-duplication in filter logic (use Set or check if already included)
- All tags selected: should show all posts with at least one tag (existing filter logic handles this)
- Mobile touch scrolling: include `-webkit-overflow-scrolling: touch` for smooth scrolling
- Malformed frontmatter (observed in arc-sqlmi-chaos-mesh post): use optional chaining `tags?.` and default to empty array

## Verification

**Manual Testing:**
1. Run `gatsby develop` and navigate to `localhost:8000`
2. Verify search bar appears at very top of page before header
3. Verify tag filter bar appears after "LATEST ARTICLES" heading
4. Verify tags are ordered by post count (most popular first)
5. Click a tag in filter bar - verify only posts with that tag appear and tag appears selected (background + border change)
6. Click additional tags - verify posts matching ANY selected tag appear (OR logic)
7. Click a selected tag again - verify it deselects and filter updates
8. Click "Clear All" - verify all filters reset and all posts appear
9. Type in search bar - verify posts filter in real-time matching title/description/tags
10. Combine tag filter + search - verify posts match selected tags AND search query
11. Verify tags appear at bottom of each blog listing on homepage
12. Verify horizontal scroll bar appears when tags overflow in blog listings
13. Open an individual blog post - verify tags appear in header after date
14. Verify individual post tags scroll horizontally when overflowing
15. Test on mobile viewport (375px) - verify responsive layout and touch scrolling
16. Toggle dark/light mode - verify tag bar and tags use appropriate theme colors
17. Search with special characters - verify no JavaScript errors
18. Filter to zero results - verify "No posts found" message appears
19. Test in Chrome, Firefox, Safari, Edge - verify consistent behavior
20. Verify no console errors or warnings

**Performance Check:**
- Tag selection should respond within 100ms (instant perceived feedback)
- Search should filter within 200ms of keystroke
- Scroll performance should be smooth (60fps) on mobile devices

**Accessibility Validation:**
- Search input has proper label and aria attributes
- Tag buttons have appropriate role and aria-pressed for selected state
- Keyboard navigation works (Tab, Enter, Escape)
- Color contrast ratios meet WCAG AA standards

**Constitution Compliance:**
- ✅ No new dependencies added (Principle I)
- ✅ All colors use CSS custom properties from index.css (Principle II)
- ✅ Client-side filtering only, no server requirements (Principle III)
- ✅ Tags from existing MDX frontmatter, no content changes (Principle IV)
- ✅ Works with Gatsby 2.x and React 16.12.0 (Principle V)

## Decisions

### State Management Architecture
**Chose**: Local state in PostList component using React.useState  
**Over**: Global context API or state management library  
**Reason**: Filter state is specific to homepage/PostList component. Global context would add unnecessary complexity for a feature that doesn't need cross-component state sharing. This follows the existing themeContext pattern but keeps scope minimal per Principle V (simplicity).

### Search Implementation Strategy  
**Chose**: Client-side filtering using string.includes() on title, description, excerpt, and tags  
**Over**: Full-text search library (Fuse.js, Lunr.js) or searching MDX body content  
**Reason**: Constitutional constraint (Principle I) prohibits new dependencies without justification. Simple string matching meets requirements without dependencies. Searching full body content would require querying rawBody field and increase filter complexity unnecessarily. Title/description/excerpt/tags provide sufficient search coverage.

### Tag Ordering Algorithm
**Chose**: Sort by post count descending (most popular first)  
**Over**: Alphabetical or chronological ordering  
**Reason**: Per clarification session, this surfaces most common topics first and follows standard tag cloud UX patterns, improving content discoverability.

### Visual Treatment for Selected Tags
**Chose**: Combination of background color change and border  
**Over**: Single visual indicator (border-only or background-only)  
**Reason**: Per clarification session, combined treatment provides clearest visual feedback and works well in both light and dark modes using existing color variables.

### Component Organization
**Chose**: Add TagBadge to atoms.js, create separate files for TagFilterBar and SearchBar  
**Over**: Single monolithic component or inline JSX in PostList  
**Reason**: Following existing pattern where small reusable atoms live in atoms.js (NavLink, BlogTitle, etc.) while larger feature components get dedicated files. TagBadge is reused in 3 contexts (filter bar, listings, individual posts). This maintains consistency with current codebase architecture discovered in research phase.
