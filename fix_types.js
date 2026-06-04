
const fs = require('fs');

// Fix AuthPage.tsx unused imports
let authPage = fs.readFileSync('src/pages/auth/AuthPage.tsx', 'utf8');
authPage = authPage.replace(/, theme \} from 'antd';/, '} from \\'antd\\';');
authPage = authPage.replace(/import \{ useAuthStore, useUiStore \} from '@\/stores';/, 'import { useAuthStore } from \\'@/stores\\';');
fs.writeFileSync('src/pages/auth/AuthPage.tsx', authPage);

// Fix DashboardPageV2 unused imports
let dashboardPage = fs.readFileSync('src/pages/dashboard/DashboardPageV2.tsx', 'utf8');
dashboardPage = dashboardPage.replace(/import \{ useEchartsTheme \} from '@\/theme\/hooks';\\n/, '');
fs.writeFileSync('src/pages/dashboard/DashboardPageV2.tsx', dashboardPage);

