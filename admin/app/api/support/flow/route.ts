import { NextRequest, NextResponse } from 'next/server';

/**
 * Stateful Support Chatbot Flow Router
 * Inspired by Airtel Thanks App & Banking WhatsApp Services
 *
 * Implements:
 * - Dynamic multi-step interactive customer flow with state tracking
 * - Database lookup of user customer/subscriber accounts
 * - Multi-protocol response rendering (WhatsApp Cloud API, Telegram, Custom Mobile/Flutter)
 */

export interface CustomerAccount {
  accountNumber: string;
  serviceType: 'DTH' | 'MOBILE' | 'FIBER';
  label: string;
  status: 'ACTIVE' | 'SUSPENDED';
  balance: number;
  validity: string;
  activePlan: string;
}

export interface UserSessionState {
  userId: string;
  sessionId: string;
  currentStep:
    | 'IDLE'
    | 'MAIN_MENU'
    | 'AWAITING_ACCOUNT_SELECTION'
    | 'ACCOUNT_ACTION_MENU'
    | 'ADDING_CHANNELS'
    | 'RECHARGING';
  selectedService?: 'DTH' | 'MOBILE' | 'FIBER';
  selectedAccountNumber?: string;
  selectedAccountData?: CustomerAccount;
  history: Array<{ step: string; timestamp: string; action: string }>;
  updatedAt: number;
}

// In-memory Session State Store (can be backed by Redis / KV / Supabase)
const sessionStore = new Map<string, UserSessionState>();

// Mock Database of user subscriber accounts for DB Lookup Step
const mockUserDatabase: Record<string, CustomerAccount[]> = {
  default: [
    {
      accountNumber: '3008921411',
      serviceType: 'DTH',
      label: 'Living Room TV (HD Box)',
      status: 'ACTIVE',
      balance: 142.5,
      validity: '18 Nov 2026',
      activePlan: 'Mega HD Sports & Cinema (₹349/mo)',
    },
    {
      accountNumber: '3008929822',
      serviceType: 'DTH',
      label: 'Bedroom TV (Standard Box)',
      status: 'ACTIVE',
      balance: 24.0,
      validity: '03 Nov 2026',
      activePlan: 'Value Lite Regional Pack (₹199/mo)',
    },
  ],
};

function getOrCreateSession(userId: string, sessionId?: string): UserSessionState {
  const sid = sessionId || userId;
  let session = sessionStore.get(sid);
  if (!session) {
    session = {
      userId,
      sessionId: sid,
      currentStep: 'MAIN_MENU',
      history: [],
      updatedAt: Date.now(),
    };
    sessionStore.set(sid, session);
  }
  return session;
}

async function lookupUserAccounts(userId: string, serviceType: 'DTH' | 'MOBILE' | 'FIBER'): Promise<CustomerAccount[]> {
  // Database Lookup: In production, query Supabase / Postgres:
  // e.g. `const { data } = await supabase.from('customer_accounts').select('*').eq('user_id', userId).eq('service_type', serviceType);`
  const allAccounts = mockUserDatabase[userId] || mockUserDatabase.default;
  return allAccounts.filter((acc) => acc.serviceType === serviceType);
}

// Protocol Formatters
function formatWhatsAppPayload(
  text: string,
  buttons: Array<{ id: string; title: string }>,
  headerText?: string
) {
  // WhatsApp Cloud API Interactive Message Payload
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'button',
      header: headerText ? { type: 'text', text: headerText } : undefined,
      body: { text },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.substring(0, 20) },
        })),
      },
    },
  };
}

function formatTelegramPayload(
  chatId: string | number,
  text: string,
  buttons: Array<{ id: string; title: string }>
) {
  // Telegram Bot API Inline Keyboard Payload
  return {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons.map((b) => [
        { text: b.title, callback_data: b.id },
      ]),
    },
  };
}

function formatCustomAppPayload(
  title: string,
  body: string,
  options: Array<{ id: string; label: string; icon?: string }>,
  session: UserSessionState
) {
  return {
    title,
    message: body,
    quickReplies: options,
    sessionState: {
      step: session.currentStep,
      selectedService: session.selectedService,
      selectedAccountNumber: session.selectedAccountNumber,
      accountData: session.selectedAccountData,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'user_guest',
      sessionId,
      action,
      payload,
    } = body;

    const normalizedAction = (action || payload || '').toString().trim().toUpperCase();
    const session = getOrCreateSession(userId, sessionId);

    // Track step history
    session.history.push({
      step: session.currentStep,
      timestamp: new Date().toISOString(),
      action: normalizedAction,
    });
    session.updatedAt = Date.now();

    // =========================================================================
    // STEP 1: TRIGGER - User clicks or enters "DTH"
    // =========================================================================
    if (
      normalizedAction === 'DTH' ||
      normalizedAction.includes('DTH') ||
      (session.currentStep === 'MAIN_MENU' && normalizedAction === '1')
    ) {
      session.selectedService = 'DTH';
      session.currentStep = 'AWAITING_ACCOUNT_SELECTION';

      // STEP 2: Database lookup for accounts linked to user
      const accounts = await lookupUserAccounts(userId, 'DTH');

      if (accounts.length === 0) {
        return NextResponse.json({
          status: 'NO_ACCOUNTS_FOUND',
          message: 'No active DTH accounts found for your mobile number. Would you like to link a new DTH account?',
          quickReplies: [
            { id: 'LINK_NEW_DTH', label: '➕ Link New DTH Account' },
            { id: 'MAIN_MENU', label: '🔙 Main Menu' },
          ],
        });
      }

      const bodyText =
        `📺 *DTH Services - Select Account*\n\n` +
        `We found ${accounts.length} DTH customer account(s) linked to your registered profile.\n\n` +
        `Please choose the account you wish to manage:`;

      const options = accounts.map((acc) => ({
        id: `SELECT_ACC_${acc.accountNumber}`,
        title: `Box: ${acc.accountNumber.slice(-4)}`,
        label: `📺 ${acc.label} (${acc.accountNumber})`,
      }));

      // Return multi-protocol payloads
      return NextResponse.json({
        success: true,
        step: session.currentStep,
        reply: bodyText,
        customApp: formatCustomAppPayload(
          'Select DTH Account',
          bodyText,
          options.map((o) => ({ id: o.id, label: o.label, icon: 'tv' })),
          session
        ),
        whatsappPayload: formatWhatsAppPayload(
          bodyText,
          options.map((o) => ({ id: o.id, title: o.title })),
          'Airtel Thanks DTH Desk'
        ),
        telegramPayload: formatTelegramPayload(
          userId,
          bodyText,
          options.map((o) => ({ id: o.id, title: o.label }))
        ),
      });
    }

    // =========================================================================
    // STEP 3: ACCOUNT SELECTION
    // User selects a customer account number (e.g. SELECT_ACC_3008921411)
    // =========================================================================
    if (
      normalizedAction.startsWith('SELECT_ACC_') ||
      (session.currentStep === 'AWAITING_ACCOUNT_SELECTION' && /\d{6,12}/.test(normalizedAction))
    ) {
      const selectedAccNo = normalizedAction.replace('SELECT_ACC_', '');
      const accounts = await lookupUserAccounts(userId, session.selectedService || 'DTH');
      const account = accounts.find((a) => a.accountNumber === selectedAccNo) || accounts[0];

      // CRITICAL STATE PERSISTENCE: Save chosen account to session state
      session.selectedAccountNumber = account.accountNumber;
      session.selectedAccountData = account;
      session.currentStep = 'ACCOUNT_ACTION_MENU';

      const bodyText =
        `✅ *Account Selected: ${account.accountNumber}*\n` +
        `• *Connection:* ${account.label}\n` +
        `• *Active Plan:* ${account.activePlan}\n` +
        `• *Current Balance:* ₹${account.balance.toFixed(2)}\n` +
        `• *Next Recharge Due:* ${account.validity}\n\n` +
        `What would you like to do with this account?`;

      const actionButtons = [
        { id: 'ACTION_ADD_CHANNELS', title: 'Add Channels', label: '➕ Add Channels', icon: 'playlist_add' },
        { id: 'ACTION_RECHARGE', title: 'Recharge', label: '💳 Quick Recharge', icon: 'payment' },
        { id: 'ACTION_MAIN_MENU', title: 'Main Menu', label: '🔙 Main Menu', icon: 'menu' },
      ];

      return NextResponse.json({
        success: true,
        step: session.currentStep,
        reply: bodyText,
        selectedAccount: account.accountNumber,
        customApp: formatCustomAppPayload(
          `Account: ${account.accountNumber}`,
          bodyText,
          actionButtons.map((b) => ({ id: b.id, label: b.label, icon: b.icon })),
          session
        ),
        whatsappPayload: formatWhatsAppPayload(
          bodyText,
          actionButtons.map((b) => ({ id: b.id, title: b.title })),
          'Account Actions'
        ),
        telegramPayload: formatTelegramPayload(
          userId,
          bodyText,
          actionButtons.map((b) => ({ id: b.id, title: b.label }))
        ),
      });
    }

    // =========================================================================
    // STEP 4: ACTION EXECUTION - "Add Channels", "Recharge", or "Main Menu"
    // =========================================================================
    if (
      normalizedAction === 'ACTION_ADD_CHANNELS' ||
      normalizedAction.includes('ADD CHANNELS') ||
      normalizedAction.includes('ADD CHANNEL')
    ) {
      // The system knows EXACTLY which customer number was selected!
      const activeAccount = session.selectedAccountNumber;
      const accountData = session.selectedAccountData;

      if (!activeAccount) {
        session.currentStep = 'MAIN_MENU';
        return NextResponse.json({
          success: false,
          error: 'Session expired or account not selected. Please select DTH first.',
          quickReplies: [{ id: 'DTH', label: '📺 Select DTH' }],
        });
      }

      session.currentStep = 'ADDING_CHANNELS';

      const bodyText =
        `📡 *Add Channels to DTH Account: ${activeAccount}*\n\n` +
        `Select a popular channel pack or individual channel to instantly add to your subscription:\n\n` +
        `• Star Sports HD Pack - ₹35/mo\n` +
        `• Sony Sports HD Pack - ₹32/mo\n` +
        `• Zee Cinema HD - ₹19/mo\n` +
        `• Kids Learning Pack - ₹25/mo`;

      const channelOptions = [
        { id: `CONFIRM_PACK_SPORTS_${activeAccount}`, title: 'Star Sports Pack', label: '⚽ Star Sports HD (₹35/mo)' },
        { id: `CONFIRM_PACK_MOVIES_${activeAccount}`, title: 'Cinema Pack', label: '🎬 Movie Magic HD (₹32/mo)' },
        { id: 'ACTION_MAIN_MENU', title: 'Main Menu', label: '🔙 Main Menu' },
      ];

      return NextResponse.json({
        success: true,
        step: session.currentStep,
        accountNumber: activeAccount,
        reply: bodyText,
        customApp: formatCustomAppPayload(
          `Add Channels (${activeAccount})`,
          bodyText,
          channelOptions.map((c) => ({ id: c.id, label: c.label })),
          session
        ),
        whatsappPayload: formatWhatsAppPayload(
          bodyText,
          channelOptions.map((c) => ({ id: c.id, title: c.title })),
          'Channel Marketplace'
        ),
        telegramPayload: formatTelegramPayload(
          userId,
          bodyText,
          channelOptions.map((c) => ({ id: c.id, title: c.label }))
        ),
      });
    }

    if (
      normalizedAction === 'ACTION_RECHARGE' ||
      normalizedAction.includes('RECHARGE')
    ) {
      const activeAccount = session.selectedAccountNumber;
      const accountData = session.selectedAccountData;

      session.currentStep = 'RECHARGING';

      const bodyText =
        `💳 *Quick Recharge for Account: ${activeAccount}*\n\n` +
        `Current Balance: ₹${accountData?.balance.toFixed(2) ?? '0.00'}\n` +
        `Choose a recommended recharge amount:`;

      const rechargeOptions = [
        { id: `PAY_349_${activeAccount}`, title: '₹349 (1 Month)', label: '💳 ₹349 (Monthly Standard)' },
        { id: `PAY_999_${activeAccount}`, title: '₹999 (3 Months)', label: '💳 ₹999 (3 Months Saver)' },
        { id: 'ACTION_MAIN_MENU', title: 'Main Menu', label: '🔙 Main Menu' },
      ];

      return NextResponse.json({
        success: true,
        step: session.currentStep,
        accountNumber: activeAccount,
        reply: bodyText,
        customApp: formatCustomAppPayload(
          `Recharge (${activeAccount})`,
          bodyText,
          rechargeOptions.map((r) => ({ id: r.id, label: r.label })),
          session
        ),
        whatsappPayload: formatWhatsAppPayload(
          bodyText,
          rechargeOptions.map((r) => ({ id: r.id, title: r.title })),
          'Instant Recharge'
        ),
        telegramPayload: formatTelegramPayload(
          userId,
          bodyText,
          rechargeOptions.map((r) => ({ id: r.id, title: r.label }))
        ),
      });
    }

    // Default / Main Menu Reset
    session.currentStep = 'MAIN_MENU';
    session.selectedAccountNumber = undefined;
    session.selectedAccountData = undefined;

    const mainMenuText =
      `🙏 *Welcome to Support Services*\n\n` +
      `Please select a category or service to begin:`;

    const mainMenuButtons = [
      { id: 'DTH', title: 'DTH Services', label: '📺 DTH Services' },
      { id: 'MOBILE', title: 'Mobile Prepaid', label: '📱 Mobile Prepaid' },
      { id: 'FIBER', title: 'Broadband Fiber', label: '🌐 Broadband Fiber' },
    ];

    return NextResponse.json({
      success: true,
      step: session.currentStep,
      reply: mainMenuText,
      customApp: formatCustomAppPayload(
        'Main Menu',
        mainMenuText,
        mainMenuButtons.map((b) => ({ id: b.id, label: b.label })),
        session
      ),
      whatsappPayload: formatWhatsAppPayload(
        mainMenuText,
        mainMenuButtons.map((b) => ({ id: b.id, title: b.title })),
        'Main Menu'
      ),
      telegramPayload: formatTelegramPayload(
        userId,
        mainMenuText,
        mainMenuButtons.map((b) => ({ id: b.id, title: b.label }))
      ),
    });
  } catch (error: any) {
    console.error('Chatbot state router error:', error);
    return NextResponse.json(
      { error: 'Internal chatbot router failure', details: error.message },
      { status: 500 }
    );
  }
}

