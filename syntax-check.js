// Syntax check and cleanup
const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

console.log('Checking for syntax issues...');

// Check for common issues
const lines = content.split('\n');
let braceCount = 0;
let inFunction = false;
let issues = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Count braces
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  braceCount += openBraces - closeBraces;
  
  // Check for await outside async
  if (line.includes('await ') && !line.includes('async')) {
    // Look back for async function declaration
    let foundAsync = false;
    for (let i = Math.max(0, index - 10); i < index; i++) {
      if (lines[i].includes('async')) {
        foundAsync = true;
        break;
      }
    }
    if (!foundAsync) {
      issues.push(`Line ${lineNum}: await without async - ${line.trim()}`);
    }
  }
  
  // Check for unclosed functions
  if (line.includes('function ') && line.includes('{') && braceCount < 0) {
    issues.push(`Line ${lineNum}: Possible unclosed function - ${line.trim()}`);
  }
});

console.log('Final brace count:', braceCount);
console.log('Issues found:', issues.length);
issues.forEach(issue => console.log('  -', issue));

if (braceCount !== 0) {
  console.log('⚠️ Unbalanced braces detected');
} else {
  console.log('✅ Braces are balanced');
}

// Check for duplicate function definitions
const functionMatches = content.match(/function\s+\w+\s*\(/g) || [];
const asyncFunctionMatches = content.match(/async\s+function\s+\w+\s*\(/g) || [];
const allFunctions = [...functionMatches, ...asyncFunctionMatches];

const functionCounts = {};
allFunctions.forEach(func => {
  const name = func.replace(/async\s+/, '').replace(/function\s+/, '').replace(/\s*\(/, '');
  functionCounts[name] = (functionCounts[name] || 0) + 1;
});

console.log('\nFunction definition counts:');
Object.entries(functionCounts).forEach(([name, count]) => {
  if (count > 1) {
    console.log(`  ⚠️ ${name}: ${count} definitions (duplicate!)`);
  } else {
    console.log(`  ✅ ${name}: ${count} definition`);
  }
});

console.log('\nSyntax check completed.');
