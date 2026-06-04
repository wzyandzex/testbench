const fs = require('fs');

let file = fs.readFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', 'utf8');

// I made a mistake in fix_benchmark_create.js where I defined the context inside the component.
// Let's clean up and do it properly.

// First remove the old injection completely
file = file.replace(/\/\/ --- Compound Components Pattern ---[\s\S]*?return ctx;\n\};\n/, '');

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

file = file.replace(/const \{ Text, Title \} = Typography;/, contextDef + "\nconst { Text, Title } = Typography;");

fs.writeFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', file);
