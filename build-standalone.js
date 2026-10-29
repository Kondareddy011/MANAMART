const fs = require('fs');
const path = require('path');

const surveyCss = fs.readFileSync(path.join(__dirname, 'css', 'survey.css'), 'utf8');
const adminCss = fs.readFileSync(path.join(__dirname, 'css', 'admin.css'), 'utf8');
const tursoJs = fs.readFileSync(path.join(__dirname, 'js', 'turso-config.js'), 'utf8');
const firebaseJs = fs.readFileSync(path.join(__dirname, 'js', 'firebase-config.js'), 'utf8');
const surveyJs = fs.readFileSync(path.join(__dirname, 'js', 'survey.js'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, 'js', 'admin.js'), 'utf8');

const noscriptWarning = `  <noscript>
    <div style="background:#fff3cd;color:#856404;padding:14px 18px;border-bottom:2px solid #ffeeba;font-family:sans-serif;font-size:14px;text-align:center;line-height:1.5;">
      <strong>⚠️ JavaScript Required for Interactive Mode</strong><br>
      If this opened in Android's default <em>HTML Viewer</em>, interactive buttons and form submissions are disabled.<br>
      👉 Please tap the <strong>Menu (⋮ or Share)</strong> in the top-right corner and choose <strong>"Open with Chrome"</strong> (or your preferred web browser).
    </div>
  </noscript>`;

// 1. Process index.html
let indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Replace CSS link with inline style if not already inlined
const indexCssLink = '<link rel="stylesheet" href="css/survey.css">';
const indexCssInline = `<style>\n/* Standalone CSS Bundle for Android and Mobile */\n${surveyCss}\n</style>`;
if (indexHtml.includes(indexCssLink)) {
  indexHtml = indexHtml.replace(indexCssLink, indexCssInline);
}

// Add noscript alert right after <body> if not already present
if (!indexHtml.includes('JavaScript Required for Interactive Mode')) {
  indexHtml = indexHtml.replace('<body>', `<body>\n${noscriptWarning}`);
}

// Replace local script tags with inline scripts if not already inlined
const indexScriptBlock = `  <!-- Modular Application Scripts -->
  <script src="js/turso-config.js"></script>
  <script src="js/firebase-config.js"></script>
  <script src="js/survey.js"></script>`;

const indexScriptInline = `  <!-- Embedded Modular Application Scripts (Single-File Standalone Bundle) -->
  <script>
/* Turso libSQL Service */
${tursoJs}
  </script>
  <script>
/* Firebase Cloud Sync */
${firebaseJs}
  </script>
  <script>
/* Survey Application Logic */
${surveyJs}
  </script>`;

if (indexHtml.includes(indexScriptBlock)) {
  indexHtml = indexHtml.replace(indexScriptBlock, indexScriptInline);
}

fs.writeFileSync(path.join(__dirname, 'index.html'), indexHtml, 'utf8');
console.log('✓ index.html is self-contained.');

// 2. Process admin.html
let adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

const adminCssLinks = `  <link rel="stylesheet" href="css/survey.css">
  <link rel="stylesheet" href="css/admin.css">`;

const adminCssInline = `  <style>
/* Standalone CSS Bundle for Admin */
${surveyCss}
${adminCss}
  </style>`;

if (adminHtml.includes(adminCssLinks)) {
  adminHtml = adminHtml.replace(adminCssLinks, adminCssInline);
}

if (!adminHtml.includes('JavaScript Required')) {
  adminHtml = adminHtml.replace('<body class="admin-body">', `<body class="admin-body">\n${noscriptWarning}`);
}

// Replace local script tags in admin.html
const adminScriptTarget = `  <!-- Turso libSQL Cloud Database Service -->
  <script src="js/turso-config.js"></script>

  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics-compat.js"></script>

  <!-- App Services -->
  <script src="js/firebase-config.js"></script>
  <script src="js/admin.js"></script>`;

const adminScriptReplacement = `  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics-compat.js"></script>

  <!-- Embedded Modular Application Scripts (Single-File Standalone Bundle) -->
  <script>
/* Turso libSQL Service */
${tursoJs}
  </script>
  <script>
/* Firebase Cloud Sync */
${firebaseJs}
  </script>
  <script>
/* Admin Application Logic */
${adminJs}
  </script>`;

if (adminHtml.includes(adminScriptTarget)) {
  adminHtml = adminHtml.replace(adminScriptTarget, adminScriptReplacement);
  console.log('✓ Replaced admin script block.');
} else {
  console.warn('Could not find exact adminScriptTarget block');
}

fs.writeFileSync(path.join(__dirname, 'admin.html'), adminHtml, 'utf8');
console.log('--- Verification ---');
console.log('index.html size:', (indexHtml.length / 1024).toFixed(1), 'KB');
console.log('admin.html size:', (adminHtml.length / 1024).toFixed(1), 'KB');
console.log('index.html remaining local css/js refs:', (indexHtml.match(/(href|src)=["'](css|js)\//g) || []).length);
console.log('admin.html remaining local css/js refs:', (adminHtml.match(/(href|src)=["'](css|js)\//g) || []).length);

