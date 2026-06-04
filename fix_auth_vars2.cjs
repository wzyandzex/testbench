const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/AuthPage.tsx', 'utf8');
content = content.replace(/const \[activeTab, setActiveTab\] = useState<'login' \| 'register'>\(getInitialTab\);/, 
  "const [activeTab, setActiveTab] = useState<'login' | 'register'>(getInitialTab);\n  const { token } = theme.useToken();\n  const themeMode = useUiStore((state) => state.theme);\n  const isDark = themeMode === 'dark';");
fs.writeFileSync('src/pages/auth/AuthPage.tsx', content);
