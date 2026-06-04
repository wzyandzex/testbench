const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/DashboardPageV2.tsx', 'utf8');

if (!content.includes('useEchartsTheme')) {
  content = content.replace("import { useUiStore } from '@/stores';", "import { useUiStore } from '@/stores';\nimport { useEchartsTheme } from '@/theme/hooks';");
}

content = content.replace(/<ReactECharts option=\{getOption\(\)\} style=\{\{ height: 300 \}\} \/>/, 
  "<ReactECharts option={getOption()} style={{ height: 300 }} theme={isDark ? 'dark' : 'light'} />");

content = content.replace(/<ReactECharts option=\{getOption\(\)\} style=\{\{ height: 250 \}\} \/>/, 
  "<ReactECharts option={getOption()} style={{ height: 250 }} theme={isDark ? 'dark' : 'light'} />");

fs.writeFileSync('src/pages/dashboard/DashboardPageV2.tsx', content);
