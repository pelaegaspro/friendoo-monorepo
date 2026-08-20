/**
 * Deploy payment Cloud Functions using a lightweight entry point
 * (avoids Firebase CLI 10s "failed to load" timeout).
 *
 * Usage:
 *   npm run deploy:payments
 *   npm run deploy:createCashfreeOrder
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const functionsRoot = path.join(__dirname, '..');
const srcIndexPath = path.join(functionsRoot, 'src', 'index.ts');
const backupSrcPath = path.join(functionsRoot, 'src', 'index.full.ts');

const PAYMENT_EXPORTS = `// AUTO-GENERATED for deploy — restored after deploy
export { createCashfreeOrder } from './wallet/cashfreeOrder';
export { confirmCashfreePayment } from './wallet/confirmCashfreePayment';
export { cashfreeWebhook } from './wallet/cashfreeWebhook';
export { deductCallCoins, addCoins } from './wallet/coinFunctions';
export { requestWithdrawal, approveWithdrawal } from './wallet/payoutFunctions';
`;

const FULL_INDEX_MARKER = 'export { billingTick }';

const arg = process.argv[2];
const targetsByArg = {
  createCashfreeOrder: 'functions:createCashfreeOrder',
  confirmCashfreePayment: 'functions:confirmCashfreePayment',
  cashfreeWebhook: 'functions:cashfreeWebhook',
};

const defaultTargets = [
  'functions:createCashfreeOrder',
  'functions:confirmCashfreePayment',
  'functions:cashfreeWebhook',
].join(',');

const targets = arg && targetsByArg[arg]
  ? targetsByArg[arg]
  : defaultTargets;

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: repoRoot });
}

function sleep(ms) {
  execSync(`node -e "setTimeout(()=>{},${ms})"`, { stdio: 'ignore' });
}

const srcIndex = fs.readFileSync(srcIndexPath, 'utf8');
if (!srcIndex.includes(FULL_INDEX_MARKER) && !fs.existsSync(backupSrcPath)) {
  throw new Error('index.ts already trimmed; restore from git if deploy fails');
}

if (!fs.existsSync(backupSrcPath)) {
  fs.copyFileSync(srcIndexPath, backupSrcPath);
}

fs.writeFileSync(srcIndexPath, PAYMENT_EXPORTS);

let exitCode = 0;
try {
  run('npm run build --prefix functions');

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`\nDeploy attempt ${attempt}/${maxAttempts} for: ${targets}\n`);
      run(`npx firebase-tools@latest deploy --only ${targets} --non-interactive`);
      break;
    } catch (err) {
      exitCode = 1;
      const retryable = attempt < maxAttempts;
      console.error(
        retryable
          ? 'Deploy failed (often transient Google API HTML/429). Retrying in 45s...'
          : 'Deploy failed after all retries.'
      );
      if (!retryable) throw err;
      sleep(45_000);
    }
  }
} finally {
  if (fs.existsSync(backupSrcPath)) {
    fs.copyFileSync(backupSrcPath, srcIndexPath);
    fs.unlinkSync(backupSrcPath);
    run('npm run build --prefix functions');
  }
}

if (exitCode !== 0) process.exit(exitCode);
