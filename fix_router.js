
const fs = require('fs');
let content = fs.readFileSync('src/router/index.tsx', 'utf8');

const regex = /\{\s*path:\s*'\/admin\/users',\s*children:\s*\[\{\s*index:\s*true,\s*element:\s*lazyLoad\(Routes\.UsersPage\)\s*\}\],\s*\}/;

const newStr = \{
        path: '/admin/users',
        element: <PermissionGuard requiredRole={['admin']}>{lazyLoad(Routes.UsersPage)}</PermissionGuard>,
      }\;

if (regex.test(content)) {
  content = content.replace(regex, newStr);
  if (!content.includes('PermissionGuard')) {
    content = content.replace('RootGuard, OrgGuard }', 'RootGuard, OrgGuard, PermissionGuard }');
  }
  fs.writeFileSync('src/router/index.tsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Regex not matched');
}

