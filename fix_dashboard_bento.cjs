const fs = require('fs');

let file = fs.readFileSync('src/pages/dashboard/DashboardPageV2.tsx', 'utf8');

// Replace the standard Row/Col for statCards with a beautiful CSS Grid (Bento style)
file = file.replace(
  /<Row gutter=\{\[16, 16\]\}\s+style=\{\{ marginBottom: 24 \}\}>\s*\{statCards\.map\(\(config, index\) => \(\s*<Col xs=\{24\} sm=\{12\} md=\{6\} key=\{index\}>\s*<StatCardModern[\s\S]*?\/>\s*<\/Col>\s*\)\)\}\s*<\/Row>/g,
  `<div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 24
        }}>
          {statCards.map((config, index) => (
            <StatCardModern
              key={index}
              {...config}
              theme={theme}
              delay={100 + index * 50}
            />
          ))}
        </div>`
);

file = file.replace(
  /<Row gutter=\{\[16, 16\]\} style=\{\{ marginBottom: 24 \}\}>\s*\{statCards\.map\(\(config, index\) => \(\s*<Col xs=\{12\} sm=\{12\} md=\{6\} lg=\{6\} key=\{index\}>\s*<StatCardModern\s*\{\.\.\.config\}\s*theme=\{theme\}\s*delay=\{100 \+ index \* 50\}\s*\/>\s*<\/Col>\s*\)\)\}\s*<\/Row>/m,
  `<div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 24
        }}>
          {statCards.map((config, index) => (
            <StatCardModern
              key={index}
              {...config}
              theme={theme}
              delay={100 + index * 50}
            />
          ))}
        </div>`
);

// We replace the middle section (TrendChart + RecentExecutions)
file = file.replace(
  /<Row gutter=\{\[16, 16\]\} style=\{\{ marginBottom: 24 \}\}>\s*<Col xs=\{24\} lg=\{16\}>\s*<TrendChart delay=\{300\} \/>\s*<\/Col>\s*<Col xs=\{24\} lg=\{8\}>\s*<RecentExecutions delay=\{400\} \/>\s*<\/Col>\s*<\/Row>/m,
  `<div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: 24,
          marginBottom: 24,
        }}>
          <div style={{ gridColumn: '1 / -1' }} className="bento-trend-card">
            <TrendChart delay={300} />
          </div>
          <div className="bento-recent-card">
            <RecentExecutions delay={400} />
          </div>
          <div className="bento-actions-card">
             {/* Put something cool here to balance the grid, like Quick Actions combined */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
               {quickActions.slice(0, 2).map((action, index) => (
                 <QuickAction
                   key={index}
                   {...action}
                   delay={500 + index * 50}
                 />
               ))}
               {quickActions.slice(2, 4).map((action, index) => (
                 <QuickAction
                   key={index + 2}
                   {...action}
                   delay={600 + index * 50}
                 />
               ))}
             </div>
          </div>
        </div>`
);

// Remove the old QuickActions row
file = file.replace(
  /<Row gutter=\{\[16, 16\]\}>\s*\{quickActions\.map\(\(action, index\) => \(\s*<Col xs=\{12\} sm=\{6\} key=\{index\}>\s*<QuickAction\s*\{\.\.\.action\}\s*delay=\{500 \+ index \* 50\}\s*\/>\s*<\/Col>\s*\)\)\}\s*<\/Row>/m,
  ''
);

// Now apply Bento grid styling to the page via a style block injected at the top
const bentoStyles = `
const bentoStyles = \`
  .bento-trend-card {
    border-radius: 20px;
    overflow: hidden;
  }
  @media (min-width: 1200px) {
    .bento-trend-card {
      grid-column: span 2 !important;
    }
    .bento-recent-card {
      grid-column: span 1;
    }
    .bento-actions-card {
      grid-column: span 1;
    }
  }
  @media (min-width: 1600px) {
    .bento-trend-card {
      grid-column: span 2 !important;
    }
    .bento-recent-card {
      grid-column: span 1;
    }
    .bento-actions-card {
      grid-column: span 1;
    }
  }
\`;
`;

if (!file.includes('bento-trend-card')) {
  file = file.replace(
    /const \{ Text \} = Typography;/,
    `const { Text } = Typography;\n${bentoStyles}`
  );
  
  file = file.replace(
    /<div style=\{pageStyle\}>/,
    `<div style={pageStyle}>\n        <style>{bentoStyles}</style>`
  );
}

fs.writeFileSync('src/pages/dashboard/DashboardPageV2.tsx', file);
