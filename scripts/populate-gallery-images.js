#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const blogPostSlug = 'auslieferung-komplettfahrzeug-auf-mercedes-arocs-6x6';
const folderName = 'Auslieferung Komplettfahrzeug auf Mercedes Arocs 6x6 mit 7,3m Wohnkabine';
const baseImagePath = `/assets/images/blog/${folderName}`;
const blogPostPath = `/Users/stefanklug/GitHub/fas-website/src/blog/de/${blogPostSlug}.md`;
const imagesFolderPath = path.join(
  `/Users/stefanklug/GitHub/fas-website/src/assets/images/blog`,
  folderName
);

// Helper: Get all images in a folder (non-recursive)
function getImagesInFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(folderPath);
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });
    return images.sort();
  } catch (err) {
    console.error(`Error reading folder ${folderPath}:`, err.message);
    return [];
  }
}

// Helper: Generate alt text from image filename
function generateAltText(filename, sectionTitle) {
  // Remove extension and convert to readable text
  const name = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  return `${sectionTitle} - ${name}`;
}

// Read blog post
console.log(`📖 Reading blog post: ${blogPostPath}`);
const blogContent = fs.readFileSync(blogPostPath, 'utf8');

// Parse frontmatter
const frontmatterMatch = blogContent.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatterMatch) {
  console.error('❌ Could not find frontmatter in blog post');
  process.exit(1);
}

const frontmatter = frontmatterMatch[1];
const content = blogContent.slice(frontmatterMatch[0].length + 1);

// Parse YAML manually (simple parser for our use case)
const galleryMatch = frontmatter.match(/sectionGalleries:\n([\s\S]*?)(?=\n[a-zA-Z]|\n$)/);
if (!galleryMatch) {
  console.error('❌ Could not find sectionGalleries in frontmatter');
  process.exit(1);
}

// Extract section titles from YAML
const sectionLines = galleryMatch[1].split('\n');
const sections = [];
let currentSection = null;

for (const line of sectionLines) {
  const titleMatch = line.match(/^\s*-\s*sectionTitle:\s*"([^"]+)"/);
  if (titleMatch) {
    if (currentSection) {
      sections.push(currentSection);
    }
    currentSection = {
      title: titleMatch[1],
      images: []
    };
  } else if (line.match(/^\s*images:\s*\[\s*\]/) && currentSection) {
    // Empty images array
  } else if (line.match(/^\s*-\s*src:/) && currentSection) {
    // Already has images
  }
}

if (currentSection) {
  sections.push(currentSection);
}

console.log(`\n📋 Found ${sections.length} sections:`);
sections.forEach(section => {
  console.log(`   - ${section.title}`);
});

// Populate images from folders
console.log(`\n📂 Scanning image folders:`);

for (const section of sections) {
  // Try exact match first
  let folderPath = path.join(imagesFolderPath, section.title);
  let images = getImagesInFolder(folderPath);
  
  if (images.length > 0) {
    console.log(`   ✓ ${section.title}: ${images.length} images`);
    section.images = images.map(img => ({
      src: `${baseImagePath}/${section.title}/${img}`,
      alt: generateAltText(img, section.title)
    }));
  } else {
    console.log(`   - ${section.title}: no images found`);
  }
}

// Build new frontmatter
console.log(`\n🔨 Building new frontmatter...`);

// Remove old sectionGalleries section
const newFrontmatter = frontmatter.replace(
  /sectionGalleries:\n[\s\S]*?(?=\n[a-zA-Z]|\n$)/,
  ''
).trimEnd();

// Add new sectionGalleries
let newGalleryYaml = '\nsectionGalleries:';
for (const section of sections) {
  newGalleryYaml += `\n  - sectionTitle: "${section.title}"`;
  newGalleryYaml += '\n    images:';
  if (section.images.length === 0) {
    newGalleryYaml += '\n      []';
  } else {
    for (const img of section.images) {
      newGalleryYaml += `\n      - src: "${img.src}"`;
      newGalleryYaml += `\n        alt: "${img.alt}"`;
    }
  }
}

const updatedFrontmatter = newFrontmatter + newGalleryYaml;

// Write back
const updatedContent = `---\n${updatedFrontmatter}\n---\n${content}`;
fs.writeFileSync(blogPostPath, updatedContent);

console.log(`\n✅ Blog post updated!`);
console.log(`\n📊 Summary:`);
for (const section of sections) {
  console.log(`   ${section.title}: ${section.images.length} images`);
}
