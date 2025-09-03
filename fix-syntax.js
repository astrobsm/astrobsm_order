// Fix duplicate functions and missing braces
const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

console.log('Fixing duplicate functions and syntax issues...');

// Find and remove duplicate submitOrderOfflineCapable function
const functionStart = 'async function submitOrderOfflineCapable(orderData) {';
const firstIndex = content.indexOf(functionStart);
const secondIndex = content.indexOf(functionStart, firstIndex + 1);

if (secondIndex !== -1) {
  console.log('Found duplicate submitOrderOfflineCapable function');
  
  // Find the end of the second function
  let braceCount = 0;
  let endIndex = secondIndex;
  let foundStart = false;
  
  for (let i = secondIndex; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      foundStart = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (foundStart && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  // Remove the duplicate function
  content = content.substring(0, secondIndex) + content.substring(endIndex);
  console.log('✅ Removed duplicate submitOrderOfflineCapable function');
}

// Add missing closing braces at the end
const lines = content.split('\n');
let braceCount = 0;
lines.forEach(line => {
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  braceCount += openBraces - closeBraces;
});

if (braceCount > 0) {
  console.log(`Adding ${braceCount} missing closing braces`);
  content += '\n' + '}'.repeat(braceCount);
}

// Write the fixed content back
fs.writeFileSync(appJsPath, content, 'utf8');
console.log('✅ Fixed syntax issues and duplicate functions');
