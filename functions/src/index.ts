// Cloud Functions entry point — keep exports lightweight for Firebase CLI discovery.
// For payment-only deploys (avoids 10s timeout): npm run deploy:payments

export { createCashfreeOrder } from './wallet/cashfreeOrder';
export { confirmCashfreePayment } from './wallet/confirmCashfreePayment';
export { cashfreeWebhook } from './wallet/cashfreeWebhook';
export { deductCallCoins, addCoins } from './wallet/coinFunctions';
export { requestWithdrawal, approveWithdrawal } from './wallet/payoutFunctions';

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
export { presenceHeartbeat } from './presence/heartbeat';
export { presenceJanitor } from './presence/presenceJanitor';
export { callRingTimeout } from './calls/callRingTimeout';
export { provisionHost } from './admin/provisionHost';
export { completeUserOnboarding } from './auth/completeOnboarding';

// Billing stack loads @google-cloud/tasks lazily inside billingScheduler.ts
export { callBillingTrigger } from './calls/callBilling';
export { billingTick } from './calls/billingScheduler';

export { lowBalanceTrigger } from './triggers/lowBalanceAlert';
export { welcomeBonusTrigger } from './triggers/welcomeBonus';
export { fraudHighTopupAlert, fraudDroppedCallAlert } from './triggers/fraudDetection';
