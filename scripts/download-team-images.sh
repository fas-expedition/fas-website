#!/bin/bash
# Download team images from the live FAS website
# The live page serves images with signed URLs - we scrape them from the rendered page

TEAM_DIR="src/assets/images/team"
mkdir -p "$TEAM_DIR"

echo "Fetching team page to extract signed image URLs..."

# Get the rendered page HTML with all signed URLs
PAGE_HTML=$(curl -sL "https://www.fas-expedition.de/unser-team")

# Extract all image URLs from the page that match the CDN pattern for team photos
# These are the dms3rep/multi/ images (team portraits)
URLS=$(echo "$PAGE_HTML" | grep -oE 'https://cdn\.website-editor\.net/s/2f49f7dd8ce549a98ed92880a6a49d55/dms3rep/multi/[^"]+' | sort -u)

# Also try le-cdn variant
URLS2=$(echo "$PAGE_HTML" | grep -oE 'https://le-cdn\.website-editor\.net/s/2f49f7dd8ce549a98ed92880a6a49d55/dms3rep/multi/[^"]+' | sort -u)

ALL_URLS=$(echo -e "$URLS\n$URLS2" | sort -u | grep -v "^$")

echo "Found $(echo "$ALL_URLS" | wc -l | tr -d ' ') image URLs"
echo ""

# Map filenames to team member names
declare -A NAME_MAP
NAME_MAP["P5302909_be"]="andreas-boettcher"
NAME_MAP["P5302978_be"]="marika-boettcher"
NAME_MAP["Gemini_Generated_Image_lf5632lf5632lf56"]="stefan"
NAME_MAP["1000064694_be"]="monika"
NAME_MAP["P5302938_be"]="nils"
NAME_MAP["P5302918_be"]="christine"
NAME_MAP["Gemini_Generated_Image_nfv79mnfv79mnfv7"]="martin"
NAME_MAP["20241206_092638-49f5cc27"]="patrick"
NAME_MAP["P5302858_be"]="jan"
NAME_MAP["P5313079_be"]="harald"
NAME_MAP["20251022_101926-c6b3df91"]="mats"
NAME_MAP["P5302878_be"]="tobia"
NAME_MAP["1000064689_be"]="christian"
NAME_MAP["20260227_131819"]="paul"
NAME_MAP["20260227_132009"]="fabian"

# Download each known team image
for BASE_NAME in "${!NAME_MAP[@]}"; do
  PERSON="${NAME_MAP[$BASE_NAME]}"
  
  # Find the matching URL
  MATCH_URL=$(echo "$ALL_URLS" | grep "$BASE_NAME" | head -1)
  
  if [ -z "$MATCH_URL" ]; then
    echo "SKIP: No URL found for $PERSON ($BASE_NAME)"
    continue
  fi
  
  # Determine extension from URL
  EXT=$(echo "$MATCH_URL" | grep -oE '\.(jpg|jpeg|png|JPG|JPEG|PNG)' | head -1 | tr '[:upper:]' '[:lower:]')
  if [ -z "$EXT" ]; then
    EXT=".jpg"
  fi
  
  OUTPUT="$TEAM_DIR/${PERSON}${EXT}"
  
  echo "Downloading: $PERSON -> $OUTPUT"
  curl -sL "$MATCH_URL" -o "$OUTPUT"
  
  # Check if download succeeded
  SIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
  if [ "$SIZE" -lt 1000 ]; then
    echo "  WARNING: File too small ($SIZE bytes), might have failed"
    rm -f "$OUTPUT"
  else
    echo "  OK ($SIZE bytes)"
  fi
done

# Handle Erik separately (URL-encoded filename)
ERIK_URL=$(echo "$ALL_URLS" | grep "ChatGPT" | head -1)
if [ -n "$ERIK_URL" ]; then
  echo "Downloading: erik -> $TEAM_DIR/erik.png"
  curl -sL "$ERIK_URL" -o "$TEAM_DIR/erik.png"
  SIZE=$(stat -f%z "$TEAM_DIR/erik.png" 2>/dev/null || stat -c%s "$TEAM_DIR/erik.png" 2>/dev/null)
  echo "  OK ($SIZE bytes)"
fi

echo ""
echo "Done! Downloaded images:"
ls -la "$TEAM_DIR/"
