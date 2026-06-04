const fs = require('fs');
let file = fs.readFileSync('src/pages/cost/CostPage.tsx', 'utf8');

file = file.replace(/const CostTrendChart = memo\(function CostTrendChart\(\) \{/,
  `const ChartSkeleton = () => (
  <div style={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Spin tip="加载图表中..." />
  </div>
);

const CostTrendChart = memo(function CostTrendChart() {\n  const isDark = useIsDark();`
);

file = file.replace(/const ModelDistributionChart = memo\(function ModelDistributionChart\(\) \{/,
  `const ModelDistributionChart = memo(function ModelDistributionChart() {\n  const isDark = useIsDark();`
);

file = file.replace(/const TypeDistributionChart = memo\(function TypeDistributionChart\(\) \{/,
  `const TypeDistributionChart = memo(function TypeDistributionChart() {\n  const isDark = useIsDark();`
);

fs.writeFileSync('src/pages/cost/CostPage.tsx', file);
