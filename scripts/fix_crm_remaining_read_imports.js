const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node fix_crm_remaining_read_imports.js <friendoo-root>');

const routes = [
  'crm/app/api/crm/revenue/stats/route.ts',
  'crm/app/api/crm/users/journey/[uid]/route.ts',
  'crm/app/api/crm/users/list/route.ts',
];
for (const relativePath of routes) {
  const target = path.join(root, relativePath);
  let content = fs.readFileSync(target, 'utf8');
  content = content.replace("import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';", "import { getSupabaseAdmin } from '@/lib/supabaseServer';");
  fs.writeFileSync(target, content);
}
