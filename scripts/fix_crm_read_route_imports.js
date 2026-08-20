const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node fix_crm_read_route_imports.js <friendoo-root>');

const routes = [
  'crm/app/api/crm/fraud/alerts/route.ts',
  'crm/app/api/crm/support/tickets/route.ts',
  'crm/app/api/crm/support/tickets/[ticketId]/route.ts',
];
for (const relativePath of routes) {
  const target = path.join(root, relativePath);
  let content = fs.readFileSync(target, 'utf8');
  content = content.replace("import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';", "import { getSupabaseAdmin } from '@/lib/supabaseServer';");
  fs.writeFileSync(target, content);
}
