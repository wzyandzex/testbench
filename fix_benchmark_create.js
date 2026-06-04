
const fs = require('fs');

let file = fs.readFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', 'utf8');

if (!file.includes('BenchmarkFormContext')) {
  // Implementing Compound Components pattern as requested in tracker
  file = file.replace(
    /import \\{ memo, useState, useCallback, useEffect, useMemo \\} from 'react';/,
    \import { memo, useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';\
  );
  
  const contextDef = \
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
\;

  file = file.replace(
    /const \\{ Text, Title \\} = Typography;/,
    \const { Text, Title } = Typography;\n\n\ + contextDef
  );

  // Wrap the content with Context.Provider
  file = file.replace(
    /const activeSection = (.*);\n\s*const setActiveSection = (.*);/g,
    \const activeSection = ;
    const setActiveSection = ;
    
    const contextValue = useMemo(() => ({
      form,
      activeSection,
      setActiveSection,
      disabled: false
    }), [form, activeSection]);\
  );
  
  // Replace <FormSectionBasic form={form} /> with context usage
  file = file.replace(/<FormSectionBasic form=\\{form\\} \\/>/g, '<FormSectionBasic />');
  file = file.replace(/<FormSectionConfig form=\\{form\\} \\/>/g, '<FormSectionConfig />');
  file = file.replace(/<FormSectionTest form=\\{form\\} \\/>/g, '<FormSectionTest />');
  file = file.replace(/<FormSectionFiles form=\\{form\\} \\/>/g, '<FormSectionFiles />');

  // Wrap the return jsx with Provider. This is tricky with regex, so I'll wrap the outmost div.
  file = file.replace(
    /<div style=\\{pageStyle\\}>([\\s\\S]*?)<\\/div>\\s*\\);/,
    \<BenchmarkFormContext.Provider value={contextValue}>
      <div style={pageStyle}>
        
      </div>
    </BenchmarkFormContext.Provider>
    );\n\
  );

  fs.writeFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', file);
  console.log('Added context to Create Page');
}

