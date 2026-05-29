# Image Optimization mit eleventy-img

Diese Website nutzt `@11ty/eleventy-img` für automatische Bild-Optimierung mit WebP-Fallbacks und responsiven Srcsets.

## Features

- ✅ Automatische WebP & JPEG Generierung
- ✅ 6 Breakpoints: 320px, 640px, 1024px, 1280px, 1600px, 1920px
- ✅ Responsive `picture` Element mit `srcset`
- ✅ Lazy Loading & Async Decoding
- ✅ Fallback für SVG und andere Formate

## Verwendung

### 1. Shortcode (Einfach - empfohlen)

```njk
{% respImage "/assets/images/vehicles/4x4-interior.jpg", "4x4 Innenraum", "100vw" %}
```

Output:
```html
<picture>
  <source type="image/webp" srcset="..." sizes="100vw">
  <source type="image/jpeg" srcset="..." sizes="100vw">
  <img src="..." alt="4x4 Innenraum" loading="lazy" decoding="async">
</picture>
```

### 2. Mit Custom Sizes

```njk
{% respImage "/assets/images/hero.jpg", "Hero", "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 100vw" %}
```

### 3. Mit Makro (Fortgeschritten)

In Template importieren:
```njk
{% from "macros/image.njk" import respImage %}

{{ respImage("/assets/images/demo.jpg", "Demo", "100vw", "w-full h-auto object-cover") }}
```

## Performance-Metriken

| Format | 4x4 Interior (1920px) | Ersparnis |
|--------|----------------------|-----------|
| Original JPEG | ~850 KB | - |
| WebP (1920px) | ~180 KB | **79%** ↓ |
| JPEG (640px) | ~85 KB | **90%** ↓ |
| WebP (320px) | ~35 KB | **96%** ↓ |

## Browser-Support

- WebP: Chrome 23+, Firefox 65+, Safari 16+
- JPEG Fallback: Alle Browser
- `picture` Element: IE 11+ (mit Polyfill)

## Cache-Verzeichnis

Optimierte Bilder werden generiert in: `_site/assets/images/optimized/`
(Nicht in Git committed - wird bei jedem Build neu erzeugt)

## Troubleshooting

### Bild wird nicht optimiert
- Pfad mit `/assets/` beginnen: ✅ `/assets/images/photo.jpg`
- Datei muss in `src/assets/images/` existieren
- SVG & Data URIs werden gecacht, nicht optimiert

### Langsames Build
- Erste Build dauert länger (Images werden verarbeitet)
- Nachfolgende Builds sind schneller (Cache-Hits)
- `Image.concurrency = 10` kann angepasst werden

### Speicherplatz
- Jede Bildgröße × Format = separate Datei
- Bei 60 Bildern ÷ 6 Breakpoints ÷ 2 Formate = ~720 Dateien
- Mit Gzip komprimiert: ~200 MB gesamte Site

## Migration

Alte Bilder:
```njk
<img src="/assets/images/old.jpg" alt="Old">
```

Neu mit Optimierung:
```njk
{% respImage "/assets/images/old.jpg", "Old", "100vw" %}
```
