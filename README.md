# FAS Expedition Website

Static marketing website for FAS Expedition vehicles, built with Eleventy 3.x and Tailwind CSS. Bilingual (German/English) with a dark luxury aesthetic.

## Tech Stack

- **Static Site Generator**: Eleventy 3.x (Nunjucks + Markdown)
- **Styling**: Tailwind CSS 3.4 + Typography plugin + PostCSS + Autoprefixer
- **CMS**: Decap CMS (git-gateway backend, i18n with `multiple_folders`)
- **Deployment**: Netlify (auto-deploy from `_site/`)
- **Testing**: Vitest + cheerio + fast-check (property-based)

## Prerequisites

- Node.js >= 20.0.0
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (Eleventy + Tailwind watch)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Clean build output
npm run clean
```

## Project Structure

```
├── .eleventy.js              # Eleventy configuration (collections, filters, validation)
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS plugins
├── netlify.toml              # Netlify deployment config
├── src/
│   ├── _data/
│   │   ├── site.json         # Global site config (name, url, locales)
│   │   ├── de/
│   │   │   ├── translations.json
│   │   │   └── pages/        # German page content (home, brabus, 4x4, 6x6, 8x8, etc.)
│   │   └── en/
│   │       ├── translations.json
│   │       └── pages/        # English page content
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk      # Base HTML layout (SEO, hreflang, og:locale)
│   │   │   └── blog-post.njk # Blog article layout (SEO, audio player, prose)
│   │   ├── macros/
│   │   │   ├── buttons.njk   # primaryBtn, secondaryBtn
│   │   │   ├── cards.njk     # featureCard, vehicleCard
│   │   │   └── icons.njk     # SVG icon macros
│   │   └── partials/
│   │       ├── navigation.njk
│   │       ├── footer.njk
│   │       ├── hero.njk
│   │       ├── features-grid.njk
│   │       ├── vehicle-categories.njk
│   │       ├── vehicle-detail.njk
│   │       ├── blog-section.njk
│   │       └── cta-section.njk
│   ├── admin/
│   │   ├── index.html        # Decap CMS entry point
│   │   └── config.yml        # CMS collections and i18n config
│   ├── assets/
│   │   ├── css/main.css      # Tailwind directives (source)
│   │   ├── images/           # Static images (logo, vehicles, blog, team)
│   │   └── js/configurator/  # Vehicle configurator modules
│   ├── blog/
│   │   ├── de/               # German blog posts (Markdown + frontmatter)
│   │   └── en/               # English blog posts
│   ├── pages/
│   │   ├── de/               # German pages (index, brabus, 4x4, 6x6, 8x8, etc.)
│   │   └── en/               # English pages
│   ├── sitemap.njk           # XML sitemap with hreflang
│   └── root-redirect.njk    # Root → /de/ redirect
├── scripts/
│   └── download-team-images.mjs  # Utility to fetch team photos from old site
├── tests/
│   ├── helpers.ts            # Test utilities (getAllHtmlFiles, loadHtml)
│   ├── properties.test.ts   # 10 property-based tests
│   ├── unit.test.ts          # Unit tests
│   ├── integration.test.ts  # Integration tests
│   ├── cms-config.test.ts   # CMS configuration validation
│   ├── state.test.ts        # Configurator state management tests
│   ├── form.test.ts         # Configurator form validation tests
│   ├── rules.test.ts        # Configurator rule engine tests
│   ├── navigation.test.ts   # Configurator navigation tests
│   └── setup.test.ts        # Test framework smoke tests
└── _site/                    # Build output (gitignored)
```

## Pages

| German | English | Description |
|--------|---------|-------------|
| `/de/` | `/en/` | Home — hero, features, vehicles, blog preview, CTA |
| `/de/expeditionsmobile/` | `/en/expedition-vehicles/` | Vehicle lineup overview |
| `/de/4x4/` | — | 4x4 vehicle detail page |
| `/de/6x6/` | — | 6x6 vehicle detail page |
| `/de/8x8/` | — | 8x8 vehicle detail page |
| `/de/modulare-systeme/` | `/en/modular-systems/` | Modular rear carrier system |
| `/de/brabus/` | `/en/brabus/` | BRABUS limited editions |
| `/de/konfigurator/` | `/en/configurator/` | Vehicle configurator |
| `/de/blog/` | `/en/blog/` | Blog listing with category filtering |
| `/{slug}/` | `/en/{slug}/` | Individual blog articles |

## Blog

Blog posts are stored as Markdown files with YAML frontmatter in `src/blog/{locale}/`. The i18n structure uses Decap CMS's `multiple_folders` approach:

```
src/blog/
├── de/          # German articles
│   ├── de.json  # Collection config (layout, tag, permalink)
│   └── *.md     # Blog posts
└── en/          # English articles
    ├── en.json  # Collection config (layout, tag, permalink)
    └── *.md     # Blog posts
```

German posts are served at `/{slug}/`, English at `/en/{slug}/`.

Features:
- Category filtering (client-side JS)
- Homepage blog section with "Load More" pagination
- German date formatting (`DD. MMMM YYYY`)
- External links open in new tab (`target="_blank"`)
- Optional floating audio player per article
- SEO: meta title, description, OG image, canonical URL, hreflang

### Adding a Blog Post

Create a Markdown file in `src/blog/de/` (and optionally `src/blog/en/` for the translation):

```yaml
---
title: "Article Title"
slug: "article-slug"
publishDate: "2025-01-15"
status: "published"
excerpt: "Short description for cards and meta."
author: "FAS Expedition"
category: "Auslieferung"
image: "/assets/images/blog/cover.jpg"
headerImage: ""
audioUrl: ""
---

Markdown content here...
```

Or use Decap CMS at `/admin/` for a visual editor with side-by-side i18n.

## Localization

Content is fully separated from templates via JSON data files in `src/_data/{locale}/`. Each locale has:

- `translations.json` — UI strings (nav, footer, buttons)
- `pages/*.json` — Page-specific content (hero, sections, specs)

The language switcher links to the equivalent page in the alternate locale using `altSlug` data.

## Vehicle Detail Pages

The 4x4, 6x6, and 8x8 detail pages use a shared template (`partials/vehicle-detail.njk`) driven by JSON data files in `src/_data/de/pages/`. Build-time validation in `.eleventy.js` checks all required fields, character limits, and array bounds before each build.

## Deployment

Configured for Netlify via `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `_site`
- Root redirect: `/` → `/de/` (301)
- Asset caching: 1 year immutable for `/assets/*`
- CMS: Requires Netlify Identity + Git Gateway enabled in dashboard

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with live reload + Tailwind watch |
| `npm run build` | Production build (CSS + Eleventy) |
| `npm run build:css` | Compile and minify Tailwind CSS |
| `npm run build:11ty` | Run Eleventy only |
| `npm run clean` | Remove `_site/` output |
| `npm test` | Run all tests (vitest) |

## Testing

162 tests across 9 test files:

- **Property tests** (fast-check): Validate universal correctness properties across all generated pages — locale prefixes, lang attributes, hreflang links, navigation/footer presence, content differentiation, SEO meta tags
- **Unit tests**: Validate configuration files, translation completeness, content structure, and rendered HTML
- **Integration tests**: Verify build pipeline, asset copying, sitemap generation, and data rendering
- **CMS config tests**: Validate Decap CMS collection definitions and field schemas
- **Configurator tests**: State management, form validation, rule engine, and navigation logic
