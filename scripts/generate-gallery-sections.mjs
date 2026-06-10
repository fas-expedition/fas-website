#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Directories to process
const blogDirs = [
  'src/blog/de',
  'src/blog/en'
];

function extractHeadings(content) {
  // Find all h2 and h3 headings in the markdown
  const headings = [];
  const headingRegex = /^### (.+)$|^## (.+)$/gm;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const heading = match[2] || match[1]; // h2 in group 2, h3 in group 1
    headings.push(heading.trim());
  }
  
  return headings;
}

function parseFrontmatter(fileContent) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = fileContent.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: '', content: fileContent };
  }
  
  return {
    frontmatter: match[1],
    content: fileContent.slice(match[0].length)
  };
}

function generateGalleryYaml(headings) {
  if (headings.length === 0) {
    return '';
  }
  
  const galleries = headings.map(heading => {
    return `  - sectionTitle: "${heading}"\n    images: []`;
  }).join('\n');
  
  return `sectionGalleries:\n${galleries}\n`;
}

function processBlogFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, content: markdownContent } = parseFrontmatter(content);
    
    // Check if sectionGalleries already exists
    if (frontmatter.includes('sectionGalleries:')) {
      console.log(`  ⏭️  Already has sectionGalleries, skipping`);
      return;
    }
    
    // Extract headings from markdown
    const headings = extractHeadings(markdownContent);
    
    if (headings.length === 0) {
      console.log(`  ⚠️  No headings found`);
      return;
    }
    
    // Generate gallery YAML
    const galleryYaml = generateGalleryYaml(headings);
    
    // Build new frontmatter with galleries added before audioUrl (or at end)
    let newFrontmatter = frontmatter;
    
    // If audioUrl exists, insert before it; otherwise append
    if (frontmatter.includes('audioUrl:')) {
      newFrontmatter = frontmatter.replace(
        /^audioUrl:.*$/m,
        `${galleryYaml}audioUrl:$&`
      );
    } else {
      newFrontmatter = frontmatter.replace(/\n$/, '') + '\n' + galleryYaml;
    }
    
    // Write back
    const newContent = `---\n${newFrontmatter}\n---\n${markdownContent}`;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    console.log(`  ✅ Added ${headings.length} galleries: ${headings.join(', ')}`);
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }
}

// Main execution
console.log('🚀 Generating sectionGalleries for all blog posts...\n');

blogDirs.forEach(dir => {
  console.log(`\n📂 Processing ${dir}:`);
  
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && f !== 'de.json')
    .sort();
  
  files.forEach(file => {
    processBlogFile(path.join(dir, file));
  });
});

console.log('\n✨ Done!\n');
