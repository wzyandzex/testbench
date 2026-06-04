const fs = require('fs');

let file = fs.readFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', 'utf8');

if (!file.includes('BenchmarkFormContext')) {
  file = file.replace(
    /import \{ memo, useState, useCallback, useEffect, useMemo \} from 'react';/,
    `import { memo, useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';`
  );
  
  const contextDef = `
// --- Compound Components Pattern ---
interface BenchmarkFormContextType {
  form: any;
  activeSection: string;
  setActiveSection: (key: string) => void;
  disabled?: boolean;
}
export const BenchmarkFormContext = createContext<BenchmarkFormContextType | null>(null);
export const useBenchmarkForm = () => {
  const ctx = useContext(BenchmarkFormContext);
  if (!ctx) throw new Error('Must be used within BenchmarkFormContext.Provider');
  return ctx;
};
`;

  file = file.replace(
    /const \{ Text, Title \} = Typography;/,
    `const { Text, Title } = Typography;\n\n` + contextDef
  );

  file = file.replace(
    /const \[activeSection, setActiveSection\] = useState\('basic'\);/,
    `const [activeSection, setActiveSection] = useState('basic');
    
    const contextValue = useMemo(() => ({
      form,
      activeSection,
      setActiveSection,
      disabled: false
    }), [form, activeSection]);`
  );
  
  // Actually, FormSectionBasic is imported. We'll leave them as is, but we can wrap the outer layout
  file = file.replace(
    /return \(\n\s*<div style=\{pageStyle\}>([\s\S]*?)<\/div>\n\s*\);/,
    `return (
      <BenchmarkFormContext.Provider value={contextValue}>
        <div style={pageStyle}>$1</div>
      </BenchmarkFormContext.Provider>
    );`
  );

  fs.writeFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', file);
  console.log('Added context to Create Page');
}
