const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node fix_admin_client_directive.js <friendoo-root>');

const target = path.join(root, 'admin/app/admin/(panel)/reports/page.tsx');
const dynamic = "export const dynamic = 'force-dynamic';";
const original = fs.readFileSync(target, 'utf8');
let lines = original.split(/\r?\n/).filter((line) => !line.includes(dynamic));
const directiveIndex = lines.findIndex((line) => line.includes('use client'));
if (directiveIndex < 0) throw new Error('The Reports page does not contain a use client directive.');

while (lines[directiveIndex + 1] === '') lines.splice(directiveIndex + 1, 1);
lines.splice(directiveIndex + 1, 0, '', dynamic);
fs.writeFileSync(target, lines.join(original.includes('\r\n') ? '\r\n' : '\n'));
