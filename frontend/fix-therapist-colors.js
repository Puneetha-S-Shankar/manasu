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
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src/app/therapist');

const replacements = [
  { regex: /text-white\/(90|80|70)/g, replace: 'text-[var(--foreground)]' },
  { regex: /text-white\/(60|50|40|30|20|10)/g, replace: 'text-[var(--muted)]' },
  { regex: /text-white\b/g, replace: 'text-[var(--foreground)]' },
  
  // Let's also fix background colors: bg-white/[0.03], etc.
  { regex: /bg-white\/(5|\[0\.03\]|\[0\.06\]|\[0\.08\]|\[0\.05\]|\[0\.1\])/g, replace: 'bg-[var(--surface-2)]' },
  { regex: /hover:bg-white\/(5|\[0\.03\]|\[0\.06\]|\[0\.08\]|\[0\.05\]|\[0\.1\])/g, replace: 'hover:bg-[var(--card-hover)]' },
  
  // Borders
  { regex: /border-white\/\[0\.(08|1|25|15)\]/g, replace: 'border-[var(--card-border)]' },
  { regex: /focus:border-white\/\[0\.25\]/g, replace: 'focus:border-[var(--accent)]' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(r => {
    content = content.replace(r.regex, r.replace);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
