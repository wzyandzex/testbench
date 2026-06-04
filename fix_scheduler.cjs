const fs = require('fs');

let index = fs.readFileSync('src/pages/scheduler/components/CreateTaskModal/index.tsx', 'utf8');

if (!index.includes('theme as antdTheme')) {
  index = index.replace("import { useIsDark } from '@/theme';", "import { useIsDark } from '@/theme';\nimport { theme as antdTheme } from 'antd';");
  index = index.replace("const isDark = useIsDark();", "const isDark = useIsDark();\n  const { token } = antdTheme.useToken();");
  
  fs.writeFileSync('src/pages/scheduler/components/CreateTaskModal/index.tsx', index);
  console.log('Fixed Scheduler CreateTaskModal index');
}

let styleTs = fs.readFileSync('src/pages/scheduler/components/CreateTaskModal/style.ts', 'utf8');
if (!styleTs.includes('token: any = {}')) {
  styleTs = styleTs.replace(/export const getModalTheme = \(isDark: boolean\) => \{/, "export const getModalTheme = (isDark: boolean, token: any = {}) => {");
  
  styleTs = styleTs.replace(
    /modalBackground:\s*isDark\s*\?\s*'linear-gradient\(180deg, #0a0e27 0%, #1a1f3a 100%\)'\s*:\s*'#ffffff',/,
    `modalBackground: isDark
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : token.colorBgContainer || '#ffffff',`
  );
  styleTs = styleTs.replace(
    /modalContentBg:\s*isDark\s*\?\s*'rgba\(15, 23, 42, 0\.95\)'\s*:\s*'#f8fafc',/,
    `modalContentBg: isDark
      ? 'rgba(15, 23, 42, 0.95)'
      : token.colorBgLayout || '#f8fafc',`
  );
  styleTs = styleTs.replace(
    /panelBg:\s*isDark\s*\?\s*'rgba\(26, 31, 58, 0\.6\)'\s*:\s*'#ffffff',/,
    `panelBg: isDark
      ? 'rgba(26, 31, 58, 0.6)'
      : token.colorBgContainer || '#ffffff',`
  );

  fs.writeFileSync('src/pages/scheduler/components/CreateTaskModal/style.ts', styleTs);
}
