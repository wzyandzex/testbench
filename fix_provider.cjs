const fs = require('fs');

let file = fs.readFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', 'utf8');

// Fix unused variable issue by wrapping the return with Context.Provider
file = file.replace(
  /return \(\n\s*<div style=\{styles\.PAGE_CONTAINER_STYLE\}>([\s\S]*?)<\/div>\n\s*\);/,
  `return (
    <BenchmarkFormContext.Provider value={contextValue}>
      <div style={styles.PAGE_CONTAINER_STYLE}>
        $1
      </div>
    </BenchmarkFormContext.Provider>
  );`
);

fs.writeFileSync('src/pages/benchmarks/BenchmarkCreatePage.tsx', file);
console.log('Fixed provider injection');
