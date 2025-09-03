// Quick fix for online order submission
const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// Find and replace the submitOrderOfflineCapable function with a simple version
const functionStart = 'async function submitOrderOfflineCapable(orderData) {';
const functionEnd = /^}$/m;

// Find the start of the function
const startIndex = content.indexOf(functionStart);
if (startIndex === -1) {
  console.log('Function not found');
  process.exit(1);
}

// Find the end of the function (next standalone closing brace)
let braceCount = 0;
let endIndex = startIndex;
let inFunction = false;

for (let i = startIndex; i < content.length; i++) {
  if (content[i] === '{') {
    braceCount++;
    inFunction = true;
  } else if (content[i] === '}') {
    braceCount--;
    if (inFunction && braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }
}

// Simple replacement function
const newFunction = `async function submitOrderOfflineCapable(orderData) {
  console.log('🚀 Submitting order directly to server...', orderData);
  
  try {
    const response = await fetch(\`\${API_BASE_URL}/orders\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Order submitted successfully:', result);
      showNotification('✅ Order submitted successfully!', 'success');
      return { success: true, offline: false, data: result };
    } else {
      const errorText = await response.text();
      console.error('❌ Server error:', response.status, errorText);
      showNotification(\`❌ Server error: \${errorText}\`, 'error');
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('❌ Submission error:', error);
    showNotification(\`❌ Failed to submit order: \${error.message}\`, 'error');
    return { success: false, error: error.message };
  }
}`;

// Replace the function
const newContent = content.substring(0, startIndex) + newFunction + content.substring(endIndex);

// Write back to file
fs.writeFileSync(appJsPath, newContent, 'utf8');
console.log('✅ Fixed order submission function - now submits directly online');
