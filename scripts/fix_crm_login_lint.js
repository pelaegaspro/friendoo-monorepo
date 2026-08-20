const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node fix_crm_login_lint.js <friendoo-root>');

const target = path.join(root, 'crm/app/login/page.tsx');
const content = fs.readFileSync(target, 'utf8');
const updated = content.replace('} catch (err) {', '} catch {');
if (updated === content) throw new Error('Expected CRM login catch binding was not found.');
fs.writeFileSync(target, updated);
