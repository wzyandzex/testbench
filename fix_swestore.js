
const fs = require('fs');
let store = fs.readFileSync('src/stores/sweStore.ts', 'utf8');

store = store.replace(
  /const response = await sweService\\.list\\(mergedFilters\\);\\s*const data = response\\.data\\?\\.data;/, 
  \const response = await sweService.list(mergedFilters);
          const data = response as any;\
);

store = store.replace(
  /const response = await sweService\\.get\\(id\\);\\s*const data = response\\.data\\?\\.data;/,
  \const response = await sweService.get(id);
          const data = response as any;\
);

fs.writeFileSync('src/stores/sweStore.ts', store);

