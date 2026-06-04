const fs = require('fs');
let file = fs.readFileSync('src/pages/batch/components/HolographicStatsPanel.tsx', 'utf8');

if (!file.includes('theme.useToken')) {
  file = file.replace(
    /import \{ useIsDark \} from '@\/theme';/,
    "import { useIsDark } from '@/theme';\nimport { theme as antdTheme } from 'antd';"
  );
  
  file = file.replace(
    /const isDark = useIsDark\(\);\n  const theme = getBatchTheme\(isDark\);/,
    "const isDark = useIsDark();\n  const theme = getBatchTheme(isDark);\n  const { token } = antdTheme.useToken();"
  );
  
  file = file.replace(
    /background:\s*isDark\s*\?\s*'linear-gradient\(135deg,\s*rgba\(20,\s*20,\s*25,\s*0\.9\),\s*rgba\(30,\s*30,\s*40,\s*0\.8\)\)'\s*:\s*'#fff'/,
    "background: isDark ? 'linear-gradient(135deg, rgba(20, 20, 25, 0.9), rgba(30, 30, 40, 0.8))' : token.colorBgContainer"
  );
  
  file = file.replace(
    /border:\s*`1px solid \$\{isDark \? `\$\{color\}30` : 'rgba\(0, 0, 0, 0\.08\)'\}`/,
    "border: `1px solid ${isDark ? `${color}30` : token.colorBorderSecondary}`"
  );
    
  file = file.replace(
    /borderRadius:\s*isDark \? 0 : 12/,
    "borderRadius: isDark ? 0 : token.borderRadiusLG"
  );
  
  file = file.replace(
    /color:\s*isDark \? 'rgba\(255,\s*255,\s*255,\s*0\.45\)' : 'rgba\(0,\s*0,\s*0,\s*0\.45\)'/g,
    "color: isDark ? 'rgba(255, 255, 255, 0.45)' : token.colorTextSecondary"
  );
  
  file = file.replace(
    /color:\s*isDark \? '#fff' : 'rgba\(0,\s*0,\s*0,\s*0\.85\)'/g,
    "color: isDark ? '#fff' : token.colorText"
  );
  
  file = file.replace(
    /color:\s*isDark \? 'rgba\(255,\s*255,\s*255,\s*0\.65\)' : 'rgba\(0,\s*0,\s*0,\s*0\.65\)'/g,
    "color: isDark ? 'rgba(255, 255, 255, 0.65)' : token.colorTextSecondary"
  );
  
  fs.writeFileSync('src/pages/batch/components/HolographicStatsPanel.tsx', file);
  console.log('Fixed hardcoded colors in HolographicStatsPanel');
}
