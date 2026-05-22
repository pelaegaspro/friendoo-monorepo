/**
 * Deploy call/presence Cloud Functions (lightweight index to avoid 10s timeout).
 * Usage: node scripts/deploy-calls.cjs
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const functionsRoot = path.join(__dirname, '..');
const srcIndexPath = path.join(functionsRoot, 'src', 'index.ts');
const backupSrcPath = path.join(functionsRoot, 'src', 'index.full.ts');

const CALL_EXPORTS = `// AUTO-GENERATED for deploy — restored after deploy
export { getAgoraToken } from './calls/agoraToken';
export {
  initiateCall,
  acceptCall,
  rejectCall,
  markCallConnecting,
  markCallActive,
  endCall,
} from './calls/callEngine';
export { notifyHostIncomingCall } from './calls/incomingCallNotify';
export { callRingTimeout } from './calls/callRingTimeout';
export { presenceHeartbeat } from './presence/heartbeat';
export { presenceJanitor } from './presence/presenceJanitor';
export { completeUserOnboarding } from './auth/completeOnboarding';
`;

const FULL_INDEX_MARKER = 'export { billingTick }';

const targets = [
  'functions:initiateCall',
  'functions:acceptCall',
  'functions:rejectCall',
  'functions:markCallConnecting',
  'functions:markCallActive',
  'functions:endCall',
  'functions:getAgoraToken',
  'functions:notifyHostIncomingCall',
  'functions:callRingTimeout',
  'functions:presenceHeartbeat',
  'functions:presenceJanitor',
  'functions:completeUserOnboarding',
].join(',');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: repoRoot });
}

function sleep(ms) {
  execSync(`node -e "setTimeout(()=>{},${ms})"`, { stdio: 'ignore' });
}

const srcIndex = fs.readFileSync(srcIndexPath, 'utf8');
if (!fs.existsSync(backupSrcPath)) {
  fs.copyFileSync(srcIndexPath, backupSrcPath);
}

fs.writeFileSync(srcIndexPath, CALL_EXPORTS);

try {
  run('npm run build --prefix functions');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      run(`npx firebase-tools@latest deploy --only ${targets} --non-interactive`);
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      console.error('Retrying deploy in 45s...');
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
