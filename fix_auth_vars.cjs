const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/AuthPage.tsx', 'utf8');

if (!content.includes('useUiStore')) {
  content = content.replace("import { useAuthStore } from '@/stores';", "import { useAuthStore, useUiStore } from '@/stores';");
}

if (!content.includes('themeMode')) {
  content = content.replace(
    /const \[activeTab, setActiveTab\] = useState<'login' \| 'register'>\('login'\);/,
    "const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');\n  const { token } = theme.useToken();\n  const themeMode = useUiStore((state) => state.theme);\n  const isDark = themeMode === 'dark';"
  );
}

fs.writeFileSync('src/pages/auth/AuthPage.tsx', content);

let dashboardContent = fs.readFileSync('src/pages/dashboard/DashboardPageV2.tsx', 'utf8');
dashboardContent = dashboardContent.replace("import { useEchartsTheme } from '@/theme/hooks';\n", "");
fs.writeFileSync('src/pages/dashboard/DashboardPageV2.tsx', dashboardContent);
