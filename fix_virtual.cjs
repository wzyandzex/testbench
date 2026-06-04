const fs = require('fs');
let content = fs.readFileSync('src/pages/swe/components/TerminalLogViewer.tsx', 'utf8');

if (!content.includes('useVirtualizer')) {
  content = content.replace(
    /import \{ memo, useMemo, useCallback, useRef, useEffect, useState \} from 'react';/,
    `import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';\nimport { useVirtualizer } from '@tanstack/react-virtual';`
  );

  content = content.replace(
    /const logContainerRef = useRef<HTMLDivElement>\(null\);/,
    `const logContainerRef = useRef<HTMLDivElement>(null);\n  const rowVirtualizer = useVirtualizer({\n    count: logs.length,\n    getScrollElement: () => logContainerRef.current,\n    estimateSize: () => 24,\n    overscan: 10\n  });`
  );

  content = content.replace(
    /\{logs\.map\(\(log, index\) => \{[\s\S]*?return \([\s\S]*?<div key=\{log\.id \|\| index\}[^>]*>([\s\S]*?)<\/div>\n\s*\);\n\s*\}\)\}/,
    `<div style={{ height: \`\${rowVirtualizer.getTotalSize()}px\`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const index = virtualRow.index;
                  const log = logs[index];
                  const levelConfig = LOG_LEVEL_CONFIG[log.level] || LOG_LEVEL_CONFIG.info;
                  const phaseIcon = PHASE_ICONS[log.phase] || '';

                  return (
                    <div
                      key={log.id || index}
                      style={{
                        ...getLogEntryStyle(index),
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: \`\${virtualRow.size}px\`,
                        transform: \`translateY(\${virtualRow.start}px)\`
                      }}
                    >
                      $1
                    </div>
                  );
                })}
              </div>`
  );

  fs.writeFileSync('src/pages/swe/components/TerminalLogViewer.tsx', content);
}
