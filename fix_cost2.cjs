const fs = require('fs');
let file = fs.readFileSync('src/pages/cost/CostPage.tsx', 'utf8');

// Clean up previous wrong injections
file = file.replace(/import \{ Spin \} from 'antd';\n/, '');
file = file.replace(/import \{ useIsDark \} from '@\/theme';\n/, '');

file = file.replace(
  /import \{ Button, Select, Space, Alert, Breadcrumb \} from 'antd';/,
  "import { Button, Select, Space, Alert, Breadcrumb, Spin } from 'antd';"
);

file = file.replace(
  /import \{ useCostStore \} from '\.\/store';/,
  "import { useIsDark } from '@/theme';\nimport { useCostStore } from './store';"
);

if (!file.includes('const ChartSkeleton = () => (')) {
  file = file.replace(
    /const TrendChart = memo/,
    `const ChartSkeleton = () => (
  <div style={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Spin tip="加载图表中..." />
  </div>
);

const TrendChart = memo`
  );
}

// Make sure `const isDark = useIsDark();` gets injected exactly where needed
if (!file.includes('const isDark = useIsDark();')) {
    file = file.replace(
        /const TrendChart = memo\(function TrendChart\(\) \{/,
        `const TrendChart = memo(function TrendChart() {\n  const isDark = useIsDark();`
    );
    file = file.replace(
        /const ModelDistributionChart = memo\(function ModelDistributionChart\(\) \{/,
        `const ModelDistributionChart = memo(function ModelDistributionChart() {\n  const isDark = useIsDark();`
    );
    file = file.replace(
        /const TypeDistributionChart = memo\(function TypeDistributionChart\(\) \{/,
        `const TypeDistributionChart = memo(function TypeDistributionChart() {\n  const isDark = useIsDark();`
    );
}

fs.writeFileSync('src/pages/cost/CostPage.tsx', file);
