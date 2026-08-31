const fs = require('fs');
const path = require('path');

const colorMap = {
  '#1E1B18': '#0F172A', // old text/primary -> new text
  '#333333': '#0F2747', // old dark gray -> new primary
  '#F6F5F2': '#F8FAFC', // old bg -> new bg
  '#E4E1DD': '#E2E8F0', // old border -> new border
  '#726E69': '#64748B', // old muted -> new secondary text
  'bg-[#1E1B18]': 'bg-[#0F2747]', // Use primary for dark backgrounds
  'border-[#1E1B18]': 'border-[#0F2747]', // Primary border
  'font-serif': 'font-sans', // Remove serifs
  'rounded-none': 'rounded-xl',
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [oldVal, newVal] of Object.entries(colorMap)) {
        if (content.includes(oldVal)) {
          content = content.split(oldVal).join(newVal);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
