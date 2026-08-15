const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node mark_admin_dynamic.js <friendoo-root>');

const pages = [
  'admin/app/admin/(panel)/payments/withdrawals/page.tsx',
  'admin/app/admin/(panel)/reports/page.tsx',
];

for (const relativePath of pages) {
  const target = path.join(root, relativePath);
  let content = fs.readFileSync(target, 'utf8');
  if (!content.includes("export const dynamic = 'force-dynamic'")) {
    content = `export const dynamic = 'force-dynamic';\n\n${content}`;
    fs.writeFileSync(target, content);
  }
}
