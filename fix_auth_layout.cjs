const fs = require('fs');
let css = fs.readFileSync('src/pages/auth/AuthPage.css', 'utf8');

// Stage 1: Fluid Layout Refactoring
css = css.replace(/:root\s*\{\s*--auth-brand-width:\s*60%;\s*--auth-form-width:\s*40%;\s*--auth-form-max-width:\s*560px;\s*--auth-form-min-width:\s*400px;\s*\}/, 
  `:root {
  --auth-form-width: 480px;
  --auth-form-min-width: 400px;
}`);

css = css.replace(/\.auth-brand\s*\{\s*flex:\s*0\s+0\s+var\(--auth-brand-width\);\s*max-width:\s*var\(--auth-brand-width\);/, 
  `.auth-brand {
  flex: 1;
  max-width: 100%;`);

css = css.replace(/\.auth-form-section\s*\{\s*flex:\s*0\s+0\s+var\(--auth-form-width\);\s*width:\s*var\(--auth-form-width\);\s*max-width:\s*var\(--auth-form-max-width\);\s*min-width:\s*var\(--auth-form-min-width\);/, 
  `.auth-form-section {
  flex: 0 0 var(--auth-form-width);
  width: var(--auth-form-width);
  max-width: var(--auth-form-width);
  min-width: var(--auth-form-min-width);`);

// Stage 2: Remove redundant media queries that modify variables
css = css.replace(/@media\s*\(min-width:\s*1600px\)\s*\{[\s\S]*?--auth-form-max-width:\s*600px;\s*\}\s*\}/, 
  `@media (min-width: 1600px) {
  .auth-brand {
    padding: 80px;
  }
  .auth-title {
    font-size: 72px;
  }
  :root {
    --auth-form-width: 560px;
  }
}`);

// Delete useless max-width: 1400px
css = css.replace(/@media\s*\(max-width:\s*1400px\)\s*\{\s*:root\s*\{[\s\S]*?\}\s*\}/, '');

css = css.replace(/@media\s*\(max-width:\s*1200px\)\s*\{\s*:root\s*\{[\s\S]*?\}\s*/, 
  `@media (max-width: 1200px) {\n  `);

css = css.replace(/@media\s*\(max-width:\s*900px\)\s*\{\s*:root\s*\{[\s\S]*?\}\s*/, 
  `@media (max-width: 900px) {\n  `);

// Fine-tune light mode
css = css.replace(/html\[data-theme='light'\] \.auth-brand\s*\{\s*background:\s*linear-gradient\(135deg, #e0e0e0 0%, #ffffff 100%\);\s*\}/, 
  `html[data-theme='light'] .auth-brand {
  background: #f8fafc;
}`);

css = css.replace(/html\[data-theme='light'\] \.auth-page\s*\{\s*background:\s*#f5f5f5;\s*\}/,
  `html[data-theme='light'] .auth-page {
  background: #ffffff;
}`);

// Fix text color for features and branding in light mode
css = css.replace(/html\[data-theme='light'\] \.auth-feature\s*\{[\s\S]*?\}/,
  `html[data-theme='light'] .auth-feature {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}`);

css = css.replace(/html\[data-theme='light'\] \.auth-subtitle\s*\{[\s\S]*?\}/,
  `html[data-theme='light'] .auth-subtitle {
  color: #475569;
}`);

const moreLightModeFixes = `
/* Overrides for text color in brand section for light mode */
html[data-theme='light'] .auth-title {
  color: #0f172a;
}
html[data-theme='light'] .auth-feature-title {
  color: #1e293b;
}
html[data-theme='light'] .auth-feature-desc {
  color: #64748b;
}
`;

if (!css.includes('color: #0f172a;')) {
  css += '\n' + moreLightModeFixes;
}

fs.writeFileSync('src/pages/auth/AuthPage.css', css);
console.log('Fixed auth layout and contrast issues');
