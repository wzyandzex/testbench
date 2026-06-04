const fs = require('fs');

let css = fs.readFileSync('src/pages/auth/AuthPage.css', 'utf8');

const missingLightModeOverrides = `
/* --- MORE COMPREHENSIVE LIGHT MODE OVERRIDES --- */
html[data-theme='light'] .auth-form-section {
  background: #ffffff;
}

html[data-theme='light'] .auth-input {
  background: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

html[data-theme='light'] .auth-input::placeholder {
  color: #bfbfbf !important;
}

html[data-theme='light'] .auth-input:hover {
  background: #fff !important;
  border-color: #667eea !important;
}

html[data-theme='light'] .auth-input:focus,
html[data-theme='light'] .auth-input.ant-input-focused {
  background: #fff !important;
  border-color: #667eea !important;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
}

html[data-theme='light'] .auth-input .anticon {
  color: #888;
}

html[data-theme='light'] .auth-input.ant-input-password .ant-input {
  color: #333 !important;
}

html[data-theme='light'] .auth-tabs .ant-tabs-tab {
  color: #666 !important;
  border-color: #e0e0e0 !important;
}

html[data-theme='light'] .auth-tabs .ant-tabs-tab:hover {
  color: #333 !important;
  background: rgba(0, 0, 0, 0.02) !important;
}

html[data-theme='light'] .auth-tabs .ant-tabs-tab-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
  color: #667eea !important;
}

html[data-theme='light'] .auth-form-actions .ant-checkbox-wrapper {
  color: #666;
}

html[data-theme='light'] .auth-divider {
  border-color: #e0e0e0;
}

html[data-theme='light'] .auth-divider .ant-divider-inner-text {
  color: #888;
}

html[data-theme='light'] .auth-social-button {
  background: #fff;
  border-color: #d9d9d9;
  color: #333;
}

html[data-theme='light'] .auth-social-button:hover {
  background: #fafafa;
  border-color: #667eea;
  color: #667eea !important;
}

html[data-theme='light'] .auth-footer {
  color: #888;
}

html[data-theme='light'] .auth-feature {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.05);
}

html[data-theme='light'] .auth-feature-title {
  color: #1a1a1a;
}

html[data-theme='light'] .auth-feature-desc {
  color: #666;
}
`;

if (!css.includes('MORE COMPREHENSIVE LIGHT MODE OVERRIDES')) {
  css += '\n' + missingLightModeOverrides;
  fs.writeFileSync('src/pages/auth/AuthPage.css', css);
  console.log('Fixed Auth Page CSS');
}
