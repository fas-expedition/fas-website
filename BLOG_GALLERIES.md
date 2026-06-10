# Blog Image Galleries

## Setup Complete ✓

Die Blog-Posts unterstützen jetzt editierbare Bild-Galerien nach Sektionen (Headlines).

## Wie es funktioniert

### Im CMS (Decap)

1. **Öffne einen Blog-Artikel** in Decap CMS
2. **Scrolle zum Feld** "Galerien nach Sektionen"
3. **Klicke "Add item"** um eine neue Galerie hinzuzufügen
4. **Gebe den Sektion-Titel ein**, z.B. "Wohnkabine" (muss exakt wie die Headline heißen)
5. **Klicke im "Bilder"-Feld "Add item"** für jedes Bild
6. **Wähle das Bild** und gebe einen Alt-Text ein
7. **Speichern** - Die Galerie erscheint im Frontend unter der Headline

### Struktur im Frontmatter (Markdown)

```yaml
sectionGalleries:
  - sectionTitle: "Wohnkabine"
    images:
      - src: "/assets/images/blog/arocs-wohnkabine-1.jpg"
        alt: "Wohnkabine Außenansicht"
      - src: "/assets/images/blog/arocs-wohnkabine-2.jpg"
        alt: "Wohnkabine Innenansicht"
  - sectionTitle: "Interieur"
    images:
      - src: "/assets/images/blog/arocs-interieur-1.jpg"
        alt: "Sitzgruppe aus cremefarbenem Leder"
```

## Features

### Frontend
- ✓ **Miniaturgalerie-Grid**: 2 Spalten auf Mobile, 3 auf Tablet, 4 auf Desktop
- ✓ **Lazy Loading**: Bilder laden nur wenn nötig
- ✓ **Lightbox Modal**: Klick auf Thumbnail öffnet Vollbild-Ansicht
- ✓ **Navigation**: Pfeiltasten oder Buttons für nächstes/vorheriges Bild
- ✓ **Tastatur-Shortcuts**: 
  - `ESC` = Modal schließen
  - `←` / `→` = Bilder navigieren
- ✓ **Alt-Text Display**: Unter dem vergrößerten Bild angezeigt

### CMS
- ✓ **Backend-Editierbar**: Galerien vollständig im CMS bearbeitbar
- ✓ **Responsive Preview**: Bilder auf verschiedenen Bildschirmgrößen vorschaubar
- ✓ **Mehrsprachig**: Deutsche und englische Blog-Posts unterstützen Galerien

## Tipps

1. **Headline-Namen müssen exakt stimmen** - Die Galerie wird nach der ersten Headline mit dem angegebenen Namen eingefügt
2. **Alt-Text ist wichtig** - Wird sowohl für Accessibility als auch im Lightbox angezeigt
3. **Bilder-Reihenfolge** - Die Reihenfolge im CMS bestimmt die Reihenfolge der Thumbnails
4. **Mehrere Galerien pro Artikel** - Du kannst mehrere `sectionGalleries` Einträge pro Artikel haben

## Styling

Galerien verwenden Tailwind CSS:
- Border: `border-zinc-700` mit Hover zu `border-zinc-500`
- Grid Gap: `gap-3` auf Mobile, `gap-4` auf größeren Bildschirmen
- Section Styles: `py-8` Padding mit Top/Bottom Border

Alle Farben folgen dem Dark-Theme der Website.

## Beispiel: Einen Artikel aktualisieren

So fügst du Galerien zum bestehenden Artikel "Auslieferung Komplettfahrzeug auf Mercedes Arocs 6x6" hinzu:

1. Im CMS: Blog → "Auslieferung Komplettfahrzeug auf Mercedes Arocs 6x6" öffnen
2. Unten: "Galerien nach Sektionen" → "Add item"
3. Sektion-Titel: "Wohnkabine"
4. Bilder hinzufügen:
   - Wohnkabine Außenansicht
   - Wohnkabine Innenansicht
5. Speichern → Galerie erscheint im Frontend unter der "Wohnkabine"-Headline
