const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node fix_crm_campaign_list_lint.js <friendoo-root>');

const target = path.join(root, 'crm/app/api/crm/campaigns/list/route.ts');
let content = fs.readFileSync(target, 'utf8');
content = content.replace("import { getOperationalAdminActorId, getSupabaseAdmin } from '@/lib/supabaseServer';", "import { getSupabaseAdmin } from '@/lib/supabaseServer';");
fs.writeFileSync(target, content);
