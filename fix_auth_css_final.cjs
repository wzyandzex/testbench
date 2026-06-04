const fs = require('fs');
let css = fs.readFileSync('src/pages/auth/AuthPage.css', 'utf8');

const loadingBtnFix = `
/* 按钮 Loading 态避免抖动 */
.auth-submit-button.ant-btn-loading {
  padding-left: 20px;
  padding-right: 20px;
}
.auth-submit-button.ant-btn-loading .auth-button-arrow {
  display: none;
}
`;

if (!css.includes('.auth-submit-button.ant-btn-loading {')) {
  css += '\n' + loadingBtnFix;
}

const inputBoxShadowFix = `
/* 输入框 Focus 时的光晕阴影 */
html[data-theme='dark'] .auth-input:focus,
html[data-theme='dark'] .auth-input.ant-input-focused {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.4) !important;
}
`;

if (!css.includes('rgba(102, 126, 234, 0.4) !important;')) {
  css += '\n' + inputBoxShadowFix;
}

fs.writeFileSync('src/pages/auth/AuthPage.css', css);
