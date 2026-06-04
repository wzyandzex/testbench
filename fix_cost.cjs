const fs = require('fs');
let file = fs.readFileSync('src/pages/cost/CostPage.tsx', 'utf8');

if (!file.includes('lazy(')) {
  file = file.replace(
    /import ReactECharts from 'echarts-for-react';/,
    "import { lazy, Suspense } from 'react';\nimport { Spin } from 'antd';\nconst ReactECharts = lazy(() => import('echarts-for-react'));"
  );
  
  // Add dark mode support for charts while we are at it
  file = file.replace(
    /import \{ useCostStore \} from '\.\/store';/,
    "import { useCostStore } from './store';\nimport { useIsDark } from '@/theme';"
  );

  file = file.replace(
    /const TrendChart = memo\(function TrendChart\(\) \{/,
    `const ChartSkeleton = () => (
  <div style={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Spin tip="加载图表中..." />
  </div>
);

const TrendChart = memo(function TrendChart() {\n  const isDark = useIsDark();`
  );

  file = file.replace(
    /<ReactECharts option=\{getOption\(\)\} style=\{\{ height: 280 \}\} \/>/,
    `<Suspense fallback={<ChartSkeleton />}>
        <ReactECharts option={getOption()} style={{ height: 280 }} theme={isDark ? 'dark' : 'light'} />
      </Suspense>`
  );

  file = file.replace(
    /const ModelDistributionChart = memo\(function ModelDistributionChart\(\) \{/,
    `const ModelDistributionChart = memo(function ModelDistributionChart() {\n  const isDark = useIsDark();`
  );

  file = file.replace(
    /const TypeDistributionChart = memo\(function TypeDistributionChart\(\) \{/,
    `const TypeDistributionChart = memo(function TypeDistributionChart() {\n  const isDark = useIsDark();`
  );

  file = file.replace(
    /<ReactECharts option=\{getOption\(\)\} style=\{\{ height: 250 \}\} \/>/g,
    `<Suspense fallback={<ChartSkeleton />}>
        <ReactECharts option={getOption()} style={{ height: 250 }} theme={isDark ? 'dark' : 'light'} />
      </Suspense>`
  );

  fs.writeFileSync('src/pages/cost/CostPage.tsx', file);
  console.log('Fixed CostPage dynamic echarts and themes');
}
