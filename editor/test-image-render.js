/**
 * Test script to verify image element rendering with project-based file storage
 */

const { parse } = require('./src/lib/parser');
const { render } = require('./src/lib/renderer');

const testCases = [
  {
    name: 'Basic image element with project path',
    content: `<assets/images/logo.png> @(100, 100) w=200`,
  },
  {
    name: 'Image with multiple attributes',
    content: `<assets/images/banner.jpg> @(50, 50) w=400 h=300`,
  },
  {
    name: 'Multiple image elements',
    content: `# Header
<assets/images/img1.png> @(100, 100) w=200
<assets/images/img2.jpg> @(400, 100) w=300`,
  },
  {
    name: 'Mixed content with images and text',
    content: `# Welcome
This is a test document with images.

<assets/images/hero.png> @(200, 300) w=500

## Features
- Feature 1
- Feature 2`,
  },
  {
    name: 'Image with notes',
    content: `<assets/images/diagram.png> @(150, 150) w=350 @("System Architecture Diagram")`,
  },
];

function testParseAndRender() {
  console.log('=== Image Element Rendering Test ===\n');
  
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`Test: ${tc.name}`);
    console.log(`Input: ${tc.content.substring(0, 60)}...`);
    
    try {
      const ast = parse(tc.content);
      console.log(`  ✅ Parse successful, found ${ast.elements.length} elements`);
      
      const imageElements = ast.elements.filter(el => el.type === 'image');
      console.log(`  📸 Image elements: ${imageElements.length}`);
      
      for (const img of imageElements) {
        console.log(`    - URL: ${img.url || '(none)'}, x: ${img.x}, y: ${img.y}, w: ${img.w}`);
      }
      
      const result = render(ast, {
        disableNotes: false,
        selectedElementIds: [],
        primaryColor: '#0066ff',
        sourceInput: tc.content,
        imageUrlResolver: (url) => {
          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            return `/mock-project-root/${url}`;
          }
          return url;
        },
      }, true);
      
      if (result.svg && result.svg.includes('<svg')) {
        console.log(`  ✅ Render successful, SVG length: ${result.svg.length}`);
        
        const imageTags = (result.svg.match(/<image/g) || []).length;
        console.log(`  🖼️ SVG <image> tags: ${imageTags}`);
        
        passed++;
      } else {
        console.log(`  ❌ Render failed: no SVG output`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

testParseAndRender();
