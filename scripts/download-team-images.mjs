import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const TEAM_DIR = 'src/assets/images/team';
mkdirSync(TEAM_DIR, { recursive: true });

// These are the CDN base filenames mapped to our local names
const imageMap = {
  'P5302909_be': 'andreas-boettcher',
  'P5302978_be': 'marika-boettcher',
  'Gemini_Generated_Image_lf5632lf5632lf56': 'stefan',
  '1000064694_be': 'monika',
  'P5302938_be': 'nils',
  'P5302918_be': 'christine',
  'Gemini_Generated_Image_nfv79mnfv79mnfv7': 'martin',
  '20241206_092638-49f5cc27': 'patrick',
  'P5302858_be': 'jan',
  'P5313079_be': 'harald',
  '20251022_101926-c6b3df91': 'mats',
  'ChatGPT+Image+3.+M%C3%A4rz+2026-+11_15_28': 'erik',
  'P5302878_be': 'tobia',
  '1000064689_be': 'christian',
  '20260227_131819': 'paul',
  '20260227_132009': 'fabian',
};

console.log('Fetching team page to get signed URLs...');

// Fetch the live page HTML
const html = execSync('curl -sL "https://www.fas-expedition.de/unser-team"', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

// Extract all signed image URLs
const urlRegex = /https:\/\/(?:cdn|le-cdn)\.website-editor\.net\/s\/2f49f7dd8ce549a98ed92880a6a49d55\/dms3rep\/multi\/[^"'\s)]+/g;
const allUrls = [...new Set(html.match(urlRegex) || [])];

console.log(`Found ${allUrls.length} CDN image URLs\n`);

let downloaded = 0;
let failed = 0;

for (const [baseName, localName] of Object.entries(imageMap)) {
  // Find matching URL
  const url = allUrls.find(u => u.includes(baseName));
  
  if (!url) {
    console.log(`SKIP: ${localName} (no matching URL for ${baseName})`);
    failed++;
    continue;
  }
  
  // Determine extension
  const extMatch = url.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.jpg';
  const outputPath = join(TEAM_DIR, `${localName}${ext}`);
  
  console.log(`Downloading: ${localName}...`);
  
  try {
    execSync(`curl -sL "${url}" -o "${outputPath}"`, { timeout: 30000 });
    const size = statSync(outputPath).size;
    
    if (size < 1000) {
      console.log(`  FAILED (${size} bytes - likely 403)`);
      execSync(`rm -f "${outputPath}"`);
      failed++;
    } else {
      console.log(`  OK (${(size / 1024).toFixed(0)} KB)`);
      downloaded++;
    }
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone: ${downloaded} downloaded, ${failed} failed`);

if (failed > 0) {
  console.log('\nThe CDN requires signed URLs. Try opening the team page in your browser,');
  console.log('then run this script again within a few minutes (signatures expire).');
  console.log('\nAlternatively, save images manually from the browser to:');
  console.log(`  ${TEAM_DIR}/`);
}
