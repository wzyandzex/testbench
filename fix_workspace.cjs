const fs = require('fs');

let apiContent = fs.readFileSync('src/services/api.ts', 'utf8');

if (!apiContent.includes("localStorage.getItem('current_org_id')")) {
  apiContent = apiContent.replace(
    /const currentOrgId = useWorkspaceStore\.getState\(\)\.currentOrg\?\.org_id;/,
    "const currentOrgId = useWorkspaceStore.getState().currentOrg?.org_id || localStorage.getItem('current_org_id');"
  );
  
  apiContent = apiContent.replace(
    /if \(tokens\.current_org_id\) \{[\s\S]*?\}/,
    `if (tokens.current_org_id) {
    localStorage.setItem('current_org_id', tokens.current_org_id);
    // 这里因为是纯拦截器层，不做直接 UI mutation，交由 app 层监控变化
  }`
  );

  fs.writeFileSync('src/services/api.ts', apiContent);
}

let storeContent = fs.readFileSync('src/stores/workspaceStore.ts', 'utf8');

if (!storeContent.includes("localStorage.setItem('current_org_id'")) {
  storeContent = storeContent.replace(
    /useAuthStore\.getState\(\)\.setTokens\(response\.access_token, response\.refresh_token\);/,
    `useAuthStore.getState().setTokens(response.access_token, response.refresh_token);
            // Sync with localStorage according to Frontend Integration guide
            localStorage.setItem('current_org_id', response.membership.org_id);`
  );

  storeContent = storeContent.replace(
    /clearWorkspace: \(\) => \{/,
    `clearWorkspace: () => {
          localStorage.removeItem('current_org_id');`
  );

  fs.writeFileSync('src/stores/workspaceStore.ts', storeContent);
}
