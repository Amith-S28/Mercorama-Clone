const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('lucide-react')) {
    const newContent = content.replace(/from\s+['"]lucide-react['"]/g, "from '@/components/ui/icons'");
    if (content !== newContent) {
      fs.writeFileSync(file, newContent);
      changedCount++;
      console.log('Updated', file);
    }
  }
});

console.log('Total files updated:', changedCount);
