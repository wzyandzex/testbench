const fs = require('fs');

let index = fs.readFileSync('src/pages/scheduler/components/CreateTaskModal/index.tsx', 'utf8');
if (index.includes('getSchedulerTheme(isDark)')) {
  index = index.replace(
    /import \{ getSchedulerTheme \} from '\.\.\/\.\.\/theme';/,
    "// getSchedulerTheme removed"
  );
  
  index = index.replace(
    /getModalActionsStyle,/,
    "getModalActionsStyle,\n  getModalTheme,"
  );

  index = index.replace(
    /const theme = getSchedulerTheme\(isDark\);/,
    "const theme = getModalTheme(isDark, token);"
  );

  fs.writeFileSync('src/pages/scheduler/components/CreateTaskModal/index.tsx', index);
  console.log('Fixed theme in CreateTaskModal/index.tsx');
}
