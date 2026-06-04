
const fs = require('fs');
let content = fs.readFileSync('src/pages/swe/components/TerminalLogViewer.tsx', 'utf8');

if (!content.includes('useVirtualizer')) {
  content = content.replace(
    /import \{ memo, useMemo, useCallback, useRef, useEffect, useState \} from 'react';/,
    \import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';\nimport { useVirtualizer } from '@tanstack/react-virtual';\
  );
  fs.writeFileSync('src/pages/swe/components/TerminalLogViewer.tsx', content);
}

