# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**pdf-posts** is a Next.js web application for creating social media visual content (Instagram Stories-sized posts) with PDF export capabilities. It's designed for "Parti des Femmes" (a feminist publication) to generate templated social media slides.

### Tech Stack

- **Next.js 15.4.3** (App Router) + React 19.1.0 + TypeScript
- **Konva.js** (2D canvas) + React-Konva (React bindings)
- **Redis** (optional persistence, in-memory fallback)
- **CSS Modules** for component styling

## Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build           # Build for production
npm run start           # Run production server

# Code quality
npx eslint .            # Lint all code
npx eslint src --fix    # Fix linting errors automatically
npx prettier --write .  # Format entire codebase
```

## Architecture Overview

### High-Level Flow

```
/ (home) → generates random ID → /{id} (editor)
    ↓
  Server loads/creates post from storage (Redis or in-memory)
    ↓
  AppView mounts with initial post data
    ↓
  User edits → state updates immediately → debounced save every 1s
    ↓
  User downloads → exports canvas slides as ZIP of PNGs
```

### Core Components

**AppView.tsx** (Client-only)

- Main editor orchestrator, manages post state via `useSavedPost()` hook
- Renders three Konva stages (canvas elements):
  - **FirstSlide**: Title slide with logo, rubrique, title, intro, gradient, draggable background image
  - **ContentSlide**: Body slides with blurred background, content text, continue indicator
  - **SubForMoreSlide**: Call-to-action slide with magazine issue number, website URL
- Left panel: controls for rubrique, image upload, title/intro, position toggle, subscription number
- Right panel: editable text areas for slide content
- Handles image resizing, canvas export to ZIP download

**Storage Layer** (src/app/storage.tsx)

- Two-tier system: Redis → Memory fallback
- Server-side functions: `getPost(id)`, `savePost(post)`, `newPost()`
- Post data: `{ id, img, imgX, title, intro, rubrique, slidesContent[], position, subForMore, numero, format }`
- Debounced client-side saves via `useInterval()`
- Visual indicator (⏳) for unsaved changes

**WordPress Import** (src/app/wordpress.tsx)

- Server action to import articles from WordPress sites via REST API
- Parses article URL to extract domain and slug
- Fetches title, content, featured image, and category via WP REST API
- Maps WordPress categories to app rubriques (actu, édito, ailleurs, etc.)
- Decodes HTML entities including French accented characters
- Attempts to fetch original unprocessed images (strips `-scaled` suffixes)

**Slide Components**

- Dynamic rendering via Konva Stage (1080×1350px for post, 1080×1920px for story)
- Responsive scaling based on container width
- Shared features: Google Fonts (Rubik, Atkinson Hyperlegible), image filtering, text auto-scaling
- No SSR (dynamic imports in AppView)

**Format Selection** (src/lib/formats.ts)

- Two canvas formats: `post` (1080×1350px) and `story` (1080×1920px)
- Story format adds 100px extra margin at top/bottom to accommodate Instagram UI overlay
- Format stored in post data and persisted with other fields

### Data Persistence Pattern

Client calls `savePost()` server action → Server checks `REDIS_URL` env var:

- **If Redis configured**: Writes to Redis HASH with 30-day TTL
- **If no Redis**: Falls back to in-memory Map (data lost on restart)

Client-side state updates immediately; server saves are debounced (batched ~1s).

### Canvas Rendering

- Uses Konva.js for high-performance 2D rendering
- React-Konva provides React component wrappers
- Canvas exports via `stage.toBlob({ pixelRatio: 2 })` (2x resolution for quality)
- Multiple slides collected into ZIP via JSZip library

### Custom Webpack Config

```javascript
// next.config.mjs
webpack: (config) => {
  config.externals = [...config.externals, { canvas: "canvas" }];
  return config;
};
```

Required to prevent canvas module errors with Konva in Next.js builds.

### Server Actions Configuration

```javascript
// next.config.mjs
experimental: {
  serverActions: {
    bodySizeLimit: "10mb"; // Supports large base64 image data URLs
  }
}
```

## Key Files & Responsibilities

| File                                 | Purpose                                               |
| ------------------------------------ | ----------------------------------------------------- |
| `src/app/page.tsx`                   | Home route; generates random ID and redirects         |
| `src/app/[id]/page.tsx`              | Dynamic post editor page; fetches post from storage   |
| `src/app/storage.tsx`                | Server-side data access layer (Redis/Memory)          |
| `src/app/wordpress.tsx`              | WordPress article import via REST API                 |
| `src/lib/formats.ts`                 | Canvas format definitions (post/story dimensions)     |
| `src/components/AppView.tsx`         | Main client editor, state management, slide rendering |
| `src/components/FirstSlide.tsx`      | Konva stage for title slide                           |
| `src/components/ContentSlide.tsx`    | Konva stage for body slides                           |
| `src/components/SubForMoreSlide.tsx` | Konva stage for subscription CTA                      |
| `src/components/BackgroundImage.tsx` | Draggable image component (saves imgX position)       |
| `src/components/Gradient.tsx`        | Gradient overlay component                            |
| `src/app/global.css`                 | Global styles, font imports                           |
| `src/app/layout.tsx`                 | Root HTML scaffold                                    |

## Development Notes

### State Management

- **No external state library** (Redux, Zustand, etc.)
- Uses React hooks: `useState()`, `useInterval()`, `useSavedPost()` (custom)
- `useSavedPost()` pattern:
  - Stores state locally (immediate UI feedback)
  - Tracks changes in `scheduledChanges` object
  - Every 1 second: checks for changes, calls `savePost()`, clears tracking
  - Falls back to cached state if save fails

### Image Handling

- Client-side resize before saving: `resizeImage(file)` → `DataURL`
- Stored as base64-encoded strings in Redis
- On load: cached in component state
- Konva Image component handles scaling + filtering (blur, darkness overlays)

### Responsive Canvas

- Container uses `useResizeObserver()` hook to detect width changes
- Konva Stage `scale` prop adjusts dynamically (canvas stays 1080×1350, renders at smaller size)
- Export always at 2x pixel ratio for quality

### CSS & Styling

- **CSS Modules** for component scoping (\*.module.css)
- No global CSS conflicts
- Flexbox/Grid for layouts
- Google Fonts loaded in `global.css`:
  - Rubik (for headings)
  - Atkinson Hyperlegible 400/700 (for body, accessible)

### TypeScript

- `strict: false` in tsconfig (allows any types where needed)
- Type-safe server actions (implicit return types)
- No explicit prop typing required (relies on inference)

## Environment Setup

### Optional Redis

Uncomment in `.env`:

```env
REDIS_URL=redis://localhost:6379
```

Without it, posts are stored in memory (lost on server restart). Useful for development.

### Unused Credentials

`.env` contains old Facebook OAuth credentials (legacy, not used). Safe to ignore or remove.

## Testing & Debugging

- **No formal test suite** (manual testing via dev server)
- Use browser DevTools for Konva debugging:
  - Inspect canvas via Elements tab
  - Check React DevTools for component state
  - Performance tab to profile rendering
- ESLint catches common issues; Prettier enforces formatting

## Deployment Considerations

- Build requires Node.js 20.11.0+ (for `import.meta.dirname`)
- Redis optional but recommended for multi-user/persistent scenarios
- No authentication/authorization (assumes trusted environment)
- Base64 image data can be large; `bodySizeLimit: "10mb"` prevents truncation
- Canvas export happens client-side (no server-side rendering of PNGs)
