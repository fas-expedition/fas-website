# AGENTS.md

Guidance for AI coding agents (Codex, Kiro, Cursor, etc.) working in this repository.

## Project Overview

Static marketing website for FAS Expedition GmbH (expedition vehicle manufacturer). Built with Eleventy 3.x, Tailwind CSS, and Decap CMS. Bilingual DE/EN.

## Tech Stack

- **Eleventy 3.x** — Static site generator, Nunjucks templates, Markdown blog posts
- **Tailwind CSS 3.4** — Utility-first CSS with `@tailwindcss/typography` for prose
- **Decap CMS** — Git-based CMS with i18n (`multiple_folders` structure)
- **Vitest** — Test runner with fast-check for property-based tests
- **Netlify** — Hosting with git-gateway backend for CMS

## Commands

```bash
npm run build        # Full production build (CSS + Eleventy)
npm run build:11ty   # Eleventy only (faster for template changes)
npm test             # Run all tests (vitest --run)
npm run dev          # Dev server (do NOT run in agents — blocks)
```

## Image Optimization

**@11ty/eleventy-img** generates WebP + JPEG at 6 breakpoints (320px–1920px) with automatic `picture` element + `srcset`. 

Use in templates:
```njk
{% respImage "/assets/images/photo.jpg", "Alt text", "100vw" %}
```

See [IMAGE_OPTIMIZATION.md](IMAGE_OPTIMIZATION.md) for details.

## Architecture Rules

1. **Templates are Nunjucks** (`.njk`). Do not introduce other template engines.
2. **Content lives in JSON** (`src/_data/{locale}/pages/*.json`) or **Markdown** (`src/blog/{locale}/*.md`). Never hardcode content in templates.
3. **Layouts**: `base.njk` for pages, `blog-post.njk` for blog articles. Both include nav, footer, and scripts.
4. **Macros** (`src/_includes/macros/`) are reusable components. Import them, don't duplicate.
5. **Locale structure**: Pages under `src/pages/de/` and `src/pages/en/`. Blog under `src/blog/de/` and `src/blog/en/`.
6. **Permalinks** are computed automatically from file paths via `eleventyComputed` in `.eleventy.js`. Don't set them manually in page frontmatter unless there's a specific reason.
7. **Blog posts** use slug-based URLs: German at `/{slug}/`, English at `/en/{slug}/`.

## Conventions

- **Language**: German is the primary locale. English is secondary.
- **Styling**: Tailwind utility classes only. No custom CSS except `src/assets/css/main.css` (Tailwind directives).
- **Design**: Dark theme (`bg-black text-white`), luxury aesthetic, uppercase headings with `tracking-wider`.
- **Spacing**: Sections use `py-24 lg:py-32`. Content width is `max-w-[1800px] mx-auto px-6 lg:px-12`.
- **Buttons**: Use `primaryBtn` / `secondaryBtn` macros from `macros/buttons.njk`.
- **Cards**: Use `featureCard` / `vehicleCard` macros from `macros/cards.njk`.
- **No TypeScript in source code** — only in tests. Client JS is vanilla ES modules.

## Validation

Always run after making changes:

```bash
npm run build && npm test
```

Build-time validation in `.eleventy.js` checks vehicle data JSON files for required fields and constraints. If validation fails, the build fails.

## Blog Posts

Frontmatter schema:

```yaml
---
title: "Required, max 120 chars"
slug: "required-lowercase-hyphens-only"
publishDate: "YYYY-MM-DD"
status: "published" | "draft"
excerpt: "Required, max 300 chars"
author: "FAS Expedition"
category: "Auslieferung" | "Expedition" | "BRABUS" | "Technologie" | "Neuigkeiten"
image: "/assets/images/blog/filename.jpg"
headerImage: ""
audioUrl: ""
---
```

Categories for English posts: `Delivery`, `Expedition`, `BRABUS`, `Technology`, `News`.

## Commit Convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) with automated semantic versioning via Release Please.

Commit message format: `<type>(<scope>): <description>`

| Prefix | Version Bump | Use for |
|--------|-------------|---------|
| `feat:` | minor | New features, new pages, new components |
| `fix:` | patch | Bug fixes, broken links, rendering issues |
| `docs:` | — | README, AGENTS.md, comments |
| `chore:` | — | Dependencies, config, CI |
| `refactor:` | — | Code restructuring without behavior change |
| `perf:` | patch | Performance improvements |
| `test:` | — | Adding or fixing tests |

Breaking changes: Add `!` after type (e.g., `feat!: remove old blog`) or add `BREAKING CHANGE:` in commit body → triggers major bump.

## Do NOT

- Add new npm dependencies without strong justification
- Change the Eleventy directory structure (`src/` input, `_site/` output)
- Modify `eleventyComputed` logic without running full test suite
- Hardcode locale strings in templates (use `translations.json` or conditionals)
- Create pages outside the `src/pages/{locale}/` structure (except blog)
- Use React, Vue, or any frontend framework — this is a static site
- Commit `_site/`, `node_modules/`, or `src/assets/css/output.css`

## CMS

Decap CMS config is at `src/admin/config.yml`. The blog collection uses i18n with `multiple_folders`. When adding CMS fields, mark translatable fields with `i18n: true` and shared fields with `i18n: duplicate`.

To use the CMS locally: `npx decap-server` (requires separate setup).
Production CMS requires Netlify Identity + Git Gateway enabled in the Netlify dashboard.
