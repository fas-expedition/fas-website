# FAS Expedition Website

Static marketing website for FAS Expedition vehicles, built with Eleventy 3.x and Tailwind CSS. Bilingual (German/English) with a dark luxury aesthetic.

## Tech Stack

- **Static Site Generator**: Eleventy 3.x (Nunjucks templates)
- **Styling**: Tailwind CSS 3.4 + PostCSS + Autoprefixer
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
├── .eleventy.js              # Eleventy configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS plugins
├── netlify.toml              # Netlify deployment config
├── src/
│   ├── _data/
│   │   ├── site.json         # Global site config (name, url, locales)
│   │   ├── de/
│   │   │   ├── translations.json
│   │   │   └── pages/        # German page content (home, brabus, etc.)
│   │   └── en/
│   │       ├── translations.json
│   │       └── pages/        # English page content
│   ├── _includes/
│   │   ├── layouts/
│   │   │   └── base.njk      # Base HTML layout (SEO, hreflang, og:locale)
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
│   │       └── cta-section.njk
│   ├── assets/
│   │   ├── css/main.css      # Tailwind directives (source)
│   │   ├── images/           # Static images (logo, vehicles, favicon)
│   │   └── favicon/
│   ├── pages/
│   │   ├── de/               # German pages (index, brabus, etc.)
│   │   └── en/               # English pages
│   ├── sitemap.njk           # XML sitemap with hreflang
│   └── root-redirect.njk    # Root → /de/ redirect
├── tests/
│   ├── helpers.ts            # Test utilities (getAllHtmlFiles, loadHtml)
│   ├── properties.test.ts   # 10 property-based tests
│   ├── unit.test.ts          # 25 unit tests
│   ├── integration.test.ts  # 6 integration tests
│   └── setup.test.ts        # Test framework smoke tests
└── _site/                    # Build output (gitignored)
```

## Pages

| German | English | Description |
|--------|---------|-------------|
| `/de/` | `/en/` | Home — hero, features, vehicle categories, CTA |
| `/de/expeditionsmobile/` | `/en/expedition-vehicles/` | Vehicle lineup (4x4, 6x6, 8x8) |
| `/de/modulare-systeme/` | `/en/modular-systems/` | Modular rear carrier system |
| `/de/brabus/` | `/en/brabus/` | BRABUS limited editions |
| `/de/konfigurator/` | `/en/configurator/` | Configurator (coming soon) |
| `/de/blog/` | `/en/blog/` | Blog (coming soon) |

## Localization

Content is fully separated from templates via JSON data files in `src/_data/{locale}/`. Each locale has:

- `translations.json` — UI strings (nav, footer, buttons)
- `pages/*.json` — Page-specific content (hero, sections, specs)

The language switcher links to the equivalent page in the alternate locale using `altSlug` data.

## Deployment

Configured for Netlify via `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `_site`
- Root redirect: `/` → `/de/` (301)
- Asset caching: 1 year immutable for `/assets/*`

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

44 tests across 4 test files:

- **Property tests** (fast-check): Validate universal correctness properties across all generated pages — locale prefixes, lang attributes, hreflang links, navigation/footer presence, content differentiation, SEO meta tags
- **Unit tests**: Validate configuration files, translation completeness, content structure, and rendered HTML
- **Integration tests**: Verify build pipeline, asset copying, sitemap generation, and data rendering
