const fs = require('fs');
const path = require('path');

// List of files to fix
const filesToFix = [
  'client/src/QTTDHoanTraPage.js',
  'client/src/QLKHNhanChungTuPage.js', 
  'client/src/QLKHBanGiaoPage.js',
  'client/src/BGDPage.js',
  'client/src/FinancialDashboard.js'
];

const autoDetectCode = `// Auto detect môi trường
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocal ? 'http://localhost:3001' : '';`;

const autoDetectCodeFetch = `// Auto detect môi trường
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:3001' : '';`;

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace various patterns
    const patterns = [
      // axios.get/post/put/delete patterns
      /(\s+)(const response = await axios\.(get|post|put|delete))\(['`]http:\/\/localhost:3001([^'`]*['`])/g,
      /(\s+)(await axios\.(get|post|put|delete))\(['`]http:\/\/localhost:3001([^'`]*['`])/g,
      
      // fetch patterns  
      /(\s+)(const response = await fetch)\(['`]http:\/\/localhost:3001([^'`]*['`])/g,
      /(\s+)(await fetch)\(['`]http:\/\/localhost:3001([^'`]*['`])/g,
      /(\s+)(const res = await axios\.get)\(['`]http:\/\/localhost:3001([^'`]*['`])/g,
      
      // BGDPage special case with port 3000
      /(\s+)(const res = await axios\.(get|post|put|delete))\(['`]http:\/\/localhost:3000([^'`]*['`])/g,
      /(\s+)(await axios\.(get|post|put|delete))\(['`]http:\/\/localhost:3000([^'`]*['`])/g,
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match, indent, methodCall, method, urlPart, offset, string) => {
          // Check if auto-detect code already exists before this line
          const beforeMatch = string.substring(0, offset);
          const lines = beforeMatch.split('\n');
          const currentLineIndex = lines.length - 1;
          
          // Look for auto-detect code in previous few lines
          let hasAutoDetect = false;
          for (let i = Math.max(0, currentLineIndex - 5); i < currentLineIndex; i++) {
            if (lines[i] && lines[i].includes('isLocal') && lines[i].includes('baseUrl')) {
              hasAutoDetect = true;
              break;
            }
          }
          
          if (hasAutoDetect) {
            // Just replace the URL part
            return `${indent}${methodCall}(\`\${baseUrl}${urlPart}`;
          } else {
            // Add auto-detect code
            const autoDetect = method ? autoDetectCode : autoDetectCodeFetch;
            return `${indent}${autoDetect}\n${indent}${methodCall}(\`\${baseUrl}${urlPart}`;
          }
        });
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed hardcoded URLs in ${filePath}`);
    } else {
      console.log(`⚪ No changes needed in ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Batch URL fix completed!');
