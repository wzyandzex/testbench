const fs = require('fs');

let pageContent = fs.readFileSync('src/pages/auth/AuthPage.tsx', 'utf8');

// Inject token and theme usage
const themeImport = `import { Form, Input, Button, Tabs, Divider, Checkbox, message, Modal, theme } from 'antd';`;
pageContent = pageContent.replace(/import \{ Form, Input, Button, Tabs, Divider, Checkbox, message, Modal \} from 'antd';/, themeImport);

const uiStoreImport = `import { useAuthStore, useUiStore } from '@/stores';`;
pageContent = pageContent.replace(/import \{ useAuthStore \} from '@\/stores';/, uiStoreImport);

const tokenUsage = `
  const { token } = theme.useToken();
  const themeMode = useUiStore((state) => state.theme);
  const isDark = themeMode === 'dark';
`;
pageContent = pageContent.replace(/const \[activeTab, setActiveTab\] = useState<'login' \| 'register'>\('login'\);/, "const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');" + tokenUsage);

fs.writeFileSync('src/pages/auth/AuthPage.tsx', pageContent);

let cssContent = fs.readFileSync('src/pages/auth/AuthPage.css', 'utf8');
const darkFixes = `
/* =============== DARK MODE OVERRIDES =============== */
html[data-theme='light'] .auth-page {
  background: #f5f5f5;
}
html[data-theme='light'] .auth-form-container {
  background: #ffffff;
}
html[data-theme='light'] .auth-title {
  color: #1a1a1a;
}
html[data-theme='light'] .auth-subtitle {
  color: #666;
}
html[data-theme='light'] .auth-card {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}
html[data-theme='light'] .auth-card:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.15);
}
html[data-theme='light'] .auth-card-title {
  color: #1a1a1a;
}
html[data-theme='light'] .auth-card-desc {
  color: #666;
}
html[data-theme='light'] .auth-brand-slogan {
  color: #1a1a1a;
}
html[data-theme='light'] .auth-brand-desc {
  color: #666;
}
html[data-theme='light'] .auth-brand {
  background: linear-gradient(135deg, #e0e0e0 0%, #ffffff 100%);
}
html[data-theme='dark'] .auth-page {
  background: #0a0a0a;
}
`;

if (!cssContent.includes('DARK MODE OVERRIDES')) {
  fs.writeFileSync('src/pages/auth/AuthPage.css', cssContent + '\n' + darkFixes);
}
