const fs = require('fs');
let file = fs.readFileSync('src/components/common/SearchBar.tsx', 'utf8');

if (!file.includes('useDebounce')) {
  file = file.replace(
    /import \{ memo, useCallback \} from 'react';/,
    "import { memo, useCallback, useState, useEffect } from 'react';\nimport { useDebounce } from '@/hooks/useDebounce';"
  );
  
  file = file.replace(
    /export const SearchBar = memo\(function SearchBar\(\{/,
    "export const SearchBar = memo(function SearchBar({\n  debounceMs = 300,"
  );

  file = file.replace(
    /const handleChange = useCallback\(\(e: React\.ChangeEvent<HTMLInputElement>\) => \{\n\s*onChange\?\.\(e\.target\.value\);\n\s*\}, \[onChange\]\);/,
    `const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value && onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);`
  );
  
  file = file.replace(
    /value=\{value\}/,
    `value={localValue}`
  );

  fs.writeFileSync('src/components/common/SearchBar.tsx', file);
  console.log('Fixed debouncing in SearchBar');
}
