const fs = require('fs');

let file = fs.readFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', 'utf8');

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

file = file.replace(/const \{ Title \} = Typography;/, contextDef + "\nconst { Title } = Typography;");

fs.writeFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', file);
