const page = penpot.createPage();
page.name = 'V2 • 33 Audio Call Screens';

const C = {
  ink: '#101827',
  navy: '#111B2E',
  pale: '#F6F5FB',
  white: '#FFFFFF',
  muted: '#6F7892',
  mint: '#27C9BA',
  cyan: '#22C9E5',
  blue: '#5367F5',
  violet: '#8B5CF6',
  magenta: '#E051D9',
  orange: '#FFAE6C',
  rose: '#E85D78',
  line: '#E8E9F1',
  darkMuted: '#B6C1D3'
};

const screens = [
  ['Splash / restore', 'Securely restoring', 'We are checking your session and active call state.', 'Continue', 'auth', 'light'],
  ['Phone number login', 'Your next great conversation', 'Enter your number to receive a secure sign-in code.', 'Send code', 'auth', 'light'],
  ['Phone verification', 'Check your messages', 'Enter the six-digit code we sent to your phone.', 'Verify & continue', 'auth', 'light'],
  ['Code expired', 'That code has expired', 'For your protection, request a fresh sign-in code.', 'Send a new code', 'status', 'light'],
  ['Profile setup', 'A little about you', 'Your name and interests help make conversations feel natural.', 'Save & continue', 'auth', 'light'],
  ['Permission preferences', 'Make Friendoo yours', 'Choose the optional updates and access that suit you.', 'Continue', 'status', 'light'],
  ['Microphone denied', 'We need your microphone', 'Audio access is required before a call can connect.', 'Open settings', 'status', 'light'],
  ['Host discovery', 'Find your conversation', 'Available hosts for a relaxed, real-time audio call.', 'View profile', 'discovery', 'light'],
  ['Host filters', 'Fine-tune your match', 'Choose availability, languages, interests and rate.', 'Apply filters', 'filters', 'light'],
  ['Host profile', 'Maya • Available now', 'Warm, thoughtful conversations in English and Hindi.', 'View call terms', 'profile', 'light'],
  ['Availability & terms', 'Clear before you connect', 'Rate, reservation and call boundaries in one calm view.', 'Continue to consent', 'terms', 'light'],
  ['Contextual safety', 'Your space, your boundaries', 'Report, block or get support whenever you need it.', 'View safety options', 'safety', 'light'],
  ['Wallet', 'Your call balance', 'Available to talk, with reservations clearly separated.', 'Add credits', 'wallet', 'light'],
  ['Top up', 'Add call credits', 'Choose an amount that feels right for your next call.', 'Review payment', 'wallet', 'light'],
  ['Payment method', 'Choose payment method', 'Your payment details stay private and protected.', 'Use this method', 'wallet', 'light'],
  ['Top-up processing', 'Payment in progress', 'You can close this page. We will update your balance shortly.', 'I’ll check later', 'status', 'light'],
  ['Top-up result states', 'Credits confirmed', 'Your wallet now reflects the verified payment result.', 'Back to wallet', 'status', 'light'],
  ['Transaction history', 'Every credit, clearly shown', 'Reservations, charges, top-ups and refunds in one place.', 'Filter activity', 'wallet', 'light'],
  ['Call cost confirmation', 'Ready to request?', 'Maya is available. Your minimum reservation is shown below.', 'Request & reserve $4.00', 'terms', 'light'],
  ['Insufficient balance', 'A little more is needed', 'No reservation was made. Add credits or choose another host.', 'Add credits', 'status', 'light'],
  ['Request sent + reserved', 'Request sent to Maya', 'Your $4.00 reservation is held, not finally charged.', 'Cancel & release', 'pending', 'dark'],
  ['Request closed outcomes', 'Request closed', 'The reservation was released. You can safely try another host.', 'Find another host', 'status', 'light'],
  ['Incoming call • host', 'New paid call request', 'Alex is ready to talk. Reservation confirmed.', 'Accept call', 'host', 'dark'],
  ['Host authorization', 'Host mode needs approval', 'Complete verification and review the host guidelines first.', 'Review application', 'host', 'light'],
  ['Host availability + earnings', 'You are available', 'Stay in control of requests, earnings and payout status.', 'Manage availability', 'host', 'light'],
  ['Connecting', 'Connecting your call', 'Your audio room is being secured. Billing begins only once connected.', 'End safely', 'call', 'dark'],
  ['Active audio call', 'Maya is listening', '00:06:42 connected • $0.80/min', 'End call', 'call', 'dark'],
  ['Low balance warning', 'About 3 minutes left', 'Add credits now or end safely before the next billing interval.', 'Add credits', 'call', 'dark'],
  ['Reconnecting / restore', 'Still trying to reconnect', 'We are checking the live call state before taking any action.', 'Keep trying', 'call', 'dark'],
  ['End call confirmation', 'End this call?', 'Your final amount will be confirmed after secure settlement.', 'End call', 'call', 'dark'],
  ['Call completed receipt', 'Call complete', 'Your receipt makes every part of the settlement easy to understand.', 'Done', 'receipt', 'light'],
  ['Call failed / refund', 'Call did not connect', 'Reservation released — no final charge was made.', 'Try another host', 'status', 'light'],
  ['Call history + support', 'Calls & support', 'Find receipts, billing help and safety options when you need them.', 'Open support', 'history', 'light']
];

const W = 390;
const H = 844;
const GAP_X = 96;
const GAP_Y = 108;
const COLS = 3;

function addRect(board, x, y, width, height, color, radius = 0, name = 'Surface', opacity = 1) {
  const r = penpot.createRectangle();
  r.name = name;
  r.x = board.x + x;
  r.y = board.y + y;
  r.resize(width, height);
  r.fills = [{ fillColor: color, fillOpacity: opacity }];
  r.borderRadius = radius;
  board.appendChild(r);
  return r;
}

function addCircle(board, x, y, size, color, opacity = 1, name = 'Aurora') {
  const e = penpot.createEllipse();
  e.name = name;
  e.x = board.x + x;
  e.y = board.y + y;
  e.resize(size, size);
  e.fills = [{ fillColor: color, fillOpacity: opacity }];
  board.appendChild(e);
  return e;
}

function addText(board, value, x, y, width, height, size, color, name = 'Text', weight = '400') {
  const t = penpot.createText(value);
  t.name = name;
  t.characters = value;
  t.x = board.x + x;
  t.y = board.y + y;
  t.resize(width, height);
  t.fontSize = String(size);
  t.fontFamily = 'Inter';
  t.fontWeight = weight;
  t.fills = [{ fillColor: color, fillOpacity: 1 }];
  board.appendChild(t);
  return t;
}

function addPill(board, label, x, y, width, tone = C.mint) {
  addRect(board, x, y, width, 30, tone, 15, 'Status pill', 0.15);
  addText(board, label, x + 12, y + 7, width - 24, 18, 11, tone === C.orange ? C.ink : C.mint, 'Pill label', '600');
}

function addButton(board, label, tone = C.ink, destructive = false) {
  const y = H - 96;
  const fill = destructive ? C.rose : tone;
  addRect(board, 24, y, W - 48, 56, fill, 18, 'Primary action');
  addText(board, label, 42, y + 17, W - 84, 22, 15, C.white, 'Action label', '700');
}

function addHeader(board, no, title, dark) {
  addText(board, String(no).padStart(2, '0') + '  FRIENDOO', 24, 28, 210, 18, 11, dark ? C.mint : C.violet, 'Screen label', '700');
  addText(board, title, 24, 62, 330, 66, 28, dark ? C.white : C.ink, 'Screen title', '700');
  addCircle(board, 336, 30, 28, dark ? C.mint : C.violet, 1, 'Brand dot');
}

function addBottomNav(board, active) {
  addRect(board, 20, H - 162, W - 40, 48, C.white, 18, 'Bottom navigation', 0.96);
  const labels = ['Hosts', 'Wallet', 'Calls', 'Profile'];
  labels.forEach((label, i) => {
    const color = label === active ? C.ink : C.muted;
    addText(board, label, 36 + (i * 82), H - 147, 64, 16, 10, color, 'Nav ' + label, label === active ? '700' : '400');
  });
}

function addHostCard(board, y, name, role, rate, online = true) {
  addRect(board, 24, y, W - 48, 88, C.white, 20, 'Host card');
  addCircle(board, 38, y + 18, 52, online ? C.mint : C.violet, 0.9, 'Host avatar');
  addText(board, name, 106, y + 18, 140, 20, 15, C.ink, 'Host name', '700');
  addText(board, role, 106, y + 42, 170, 18, 11, C.muted, 'Host details');
  addText(board, rate, 282, y + 31, 72, 20, 12, C.blue, 'Host rate', '700');
  addCircle(board, 74, y + 58, 10, online ? C.mint : C.muted, 1, 'Availability');
}

function addWalletEvent(board, y, label, amount, color) {
  addRect(board, 24, y, W - 48, 54, C.white, 16, 'Wallet event');
  addText(board, label, 40, y + 12, 210, 16, 12, C.ink, 'Event label', '600');
  addText(board, amount, 270, y + 12, 80, 18, 12, color, 'Event amount', '700');
  addText(board, 'Today', 40, y + 31, 120, 14, 10, C.muted, 'Event date');
}

function addWave(board, y, color) {
  const heights = [18, 34, 54, 76, 54, 34, 18];
  heights.forEach((height, i) => addRect(board, 83 + i * 34, y + (80 - height) / 2, 16, height, color, 8, 'Audio wave', 0.9));
}

function addAurora(board, dark) {
  addCircle(board, 228, 130, 220, dark ? C.violet : C.mint, 0.19, 'Aurora violet');
  addCircle(board, 284, 202, 160, dark ? C.magenta : C.cyan, 0.23, 'Aurora magenta');
  addCircle(board, -62, 540, 176, dark ? C.cyan : C.violet, 0.14, 'Aurora cyan');
}

function addGenericRows(board, startY, labels) {
  labels.forEach((label, index) => {
    const y = startY + index * 56;
    addRect(board, 24, y, W - 48, 44, C.white, 14, 'Info row');
    addText(board, label, 40, y + 13, 240, 16, 12, C.ink, 'Row label', '600');
    addText(board, '›', 336, y + 10, 16, 20, 18, C.muted, 'Chevron', '700');
  });
}

function buildScreen(no, data) {
  const [title, eyebrow, body, action, kind, tone] = data;
  const col = (no - 1) % COLS;
  const row = Math.floor((no - 1) / COLS);
  const board = penpot.createBoard();
  board.name = String(no).padStart(2, '0') + ' — ' + title;
  board.x = col * (W + GAP_X);
  board.y = row * (H + GAP_Y);
  board.resize(W, H);
  board.fills = [{ fillColor: tone === 'dark' ? C.navy : C.pale, fillOpacity: 1 }];
  board.borderRadius = 30;
  board.clipContent = true;
  page.root.appendChild(board);

  const dark = tone === 'dark';
  addAurora(board, dark);
  addHeader(board, no, eyebrow, dark);
  addText(board, body, 24, 138, 318, 48, 14, dark ? C.darkMuted : C.muted, 'Screen supporting copy');

  if (kind === 'auth') {
    addCircle(board, 144, 230, 102, C.violet, 0.92, 'Identity aura');
    addText(board, 'F', 180, 262, 30, 42, 34, C.white, 'Friendoo monogram', '700');
    addRect(board, 24, 396, W - 48, 56, C.white, 18, 'Input field');
    addText(board, no === 3 ? '•  •  •  •  •  •' : '+91  •  Phone number', 42, 414, 260, 20, 14, C.ink, 'Input value', '600');
    addText(board, no === 3 ? 'Resend in 00:24' : 'Your number stays private', 24, 468, 220, 18, 11, C.muted, 'Helper text');
  } else if (kind === 'discovery') {
    addPill(board, 'AVAILABLE NOW', 24, 206, 118, C.mint);
    addHostCard(board, 258, 'Maya Shah', 'English • Hindi • Warm & curious', '$0.80/min');
    addHostCard(board, 362, 'Anika Rai', 'English • Music • Thoughtful', '$0.95/min');
    addHostCard(board, 466, 'Sara Khan', 'English • Books • Easygoing', '$0.75/min');
    addBottomNav(board, 'Hosts');
  } else if (kind === 'filters') {
    addGenericRows(board, 226, ['Available now', 'Languages', 'Interests', 'Rate per minute']);
    addPill(board, '3 filters selected', 24, 468, 132, C.violet);
  } else if (kind === 'profile') {
    addCircle(board, 24, 214, 96, C.mint, 0.95, 'Host portrait');
    addText(board, 'Maya Shah', 138, 230, 180, 28, 21, C.ink, 'Host name', '700');
    addText(board, 'Verified host • Available', 138, 262, 210, 18, 12, C.mint, 'Trust status', '700');
    addPill(board, 'English  Hindi', 24, 336, 132, C.violet);
    addText(board, '$0.80 / connected min', 24, 390, 220, 20, 15, C.blue, 'Call rate', '700');
    addGenericRows(board, 438, ['Conversation style', 'Call boundaries', 'Report or block']);
  } else if (kind === 'terms') {
    addPill(board, 'AVAILABLE NOW', 24, 210, 118, C.mint);
    addRect(board, 24, 260, W - 48, 160, C.white, 22, 'Pricing summary');
    addText(board, 'Call terms', 42, 284, 170, 22, 16, C.ink, 'Section title', '700');
    addText(board, '$0.80 / connected minute', 42, 320, 240, 20, 14, C.blue, 'Rate detail', '700');
    addText(board, 'Minimum reservation  $4.00', 42, 350, 260, 18, 12, C.muted, 'Reservation detail');
    addText(board, 'The reservation is not your final charge.', 42, 380, 280, 18, 11, C.muted, 'Disclosure');
  } else if (kind === 'safety') {
    addRect(board, 24, 224, W - 48, 138, C.white, 22, 'Safety panel');
    addText(board, 'You are always in control', 42, 248, 260, 24, 16, C.ink, 'Safety headline', '700');
    addText(board, 'Set boundaries, report concerns or block future contact.', 42, 282, 286, 36, 12, C.muted, 'Safety description');
    addGenericRows(board, 392, ['Report a concern', 'Block this account', 'Talk to support']);
  } else if (kind === 'wallet') {
    addRect(board, 24, 214, W - 48, 154, C.ink, 24, 'Wallet balance');
    addText(board, 'Available balance', 44, 240, 180, 18, 11, C.darkMuted, 'Balance label');
    addText(board, '$18.40', 44, 270, 228, 48, 36, C.white, 'Balance amount', '700');
    addText(board, '$4.00 reserved', 44, 326, 160, 18, 11, C.mint, 'Reserved balance');
    addWalletEvent(board, 402, 'Top-up confirmed', '+$20.00', C.mint);
    addWalletEvent(board, 466, 'Call with Maya', '-$6.96', C.ink);
    addWalletEvent(board, 530, 'Reservation released', '+$4.00', C.violet);
    addBottomNav(board, 'Wallet');
  } else if (kind === 'pending') {
    addCircle(board, 132, 220, 126, C.mint, 0.18, 'Pending halo');
    addCircle(board, 171, 259, 48, C.mint, 1, 'Pending status');
    addText(board, 'Waiting for Maya', 88, 360, 250, 26, 20, C.white, 'Pending title', '700');
    addText(board, 'Reservation held: $4.00', 111, 394, 200, 20, 13, C.mint, 'Pending balance', '700');
    addRect(board, 24, 450, W - 48, 104, C.white, 22, 'Pending card', 0.12);
    addText(board, 'Expires in 01:28', 44, 472, 210, 22, 16, C.white, 'Pending countdown', '700');
    addText(board, 'Not finally charged', 44, 504, 220, 18, 11, C.darkMuted, 'Pending disclosure');
  } else if (kind === 'host') {
    addRect(board, 24, 218, W - 48, 116, dark ? C.white : C.ink, 24, 'Host status');
    addText(board, dark ? 'Incoming request' : 'Host availability', 44, 240, 240, 20, 12, dark ? C.ink : C.darkMuted, 'Host status label', '700');
    addText(board, dark ? 'Alex wants to connect' : '$124.80 earned this week', 44, 268, 276, 30, 20, dark ? C.ink : C.white, 'Host status value', '700');
    addPill(board, dark ? 'RESERVATION CONFIRMED' : 'AVAILABLE', 24, 362, dark ? 164 : 98, C.mint);
    addGenericRows(board, 420, dark ? ['Caller details', 'Rate • $0.80/min', 'Guidelines'] : ['Active requests', 'Payout status', 'Host guidelines']);
  } else if (kind === 'call') {
    addCircle(board, 142, 212, 106, C.mint, 0.2, 'Call halo');
    addCircle(board, 169, 239, 52, C.mint, 1, 'Call avatar');
    addText(board, title.indexOf('Active') >= 0 ? 'Maya • connected' : eyebrow, 88, 330, 250, 26, 20, C.white, 'Call status', '700');
    addText(board, title.indexOf('Active') >= 0 ? '00:06:42  •  $0.80/min' : 'Secure audio session', 106, 362, 220, 18, 12, C.darkMuted, 'Call meta');
    addWave(board, 426, C.mint);
    addRect(board, 40, 568, 70, 70, C.white, 22, 'Mute control', 0.13);
    addRect(board, 160, 568, 70, 70, C.white, 22, 'Speaker control', 0.13);
    addRect(board, 280, 568, 70, 70, C.rose, 22, 'End control');
    addText(board, 'Mute', 56, 593, 42, 18, 11, C.white, 'Mute label', '700');
    addText(board, 'Audio', 176, 593, 42, 18, 11, C.white, 'Audio label', '700');
    addText(board, 'End', 298, 593, 40, 18, 11, C.white, 'End label', '700');
  } else if (kind === 'receipt') {
    addCircle(board, 157, 214, 76, C.mint, 0.16, 'Receipt halo');
    addCircle(board, 177, 234, 36, C.mint, 1, 'Receipt check');
    addText(board, '$6.96', 124, 322, 160, 36, 30, C.ink, 'Final charge', '700');
    addWalletEvent(board, 398, 'Reservation applied', '-$4.00', C.ink);
    addWalletEvent(board, 462, 'Additional connected time', '-$2.96', C.ink);
    addWalletEvent(board, 526, 'Released remainder', '$0.00', C.mint);
  } else if (kind === 'history') {
    addPill(board, 'ALL CALLS', 24, 214, 88, C.violet);
    addWalletEvent(board, 270, 'Maya • completed', '$6.96', C.ink);
    addWalletEvent(board, 334, 'Anika • timeout', '$0.00', C.mint);
    addWalletEvent(board, 398, 'Sara • refund pending', '$4.00', C.orange);
    addGenericRows(board, 490, ['View a receipt', 'Billing issue', 'Safety concern']);
  } else {
    addCircle(board, 148, 218, 94, title.indexOf('failed') >= 0 || title.indexOf('Insufficient') >= 0 ? C.rose : C.mint, 0.2, 'Status halo');
    addCircle(board, 176, 246, 38, title.indexOf('failed') >= 0 || title.indexOf('Insufficient') >= 0 ? C.rose : C.mint, 1, 'Status indicator');
    addRect(board, 24, 352, W - 48, 132, C.white, 22, 'Status card');
    addText(board, title.indexOf('failed') >= 0 ? 'No final charge' : 'All set', 44, 378, 236, 24, 17, C.ink, 'Status title', '700');
    addText(board, body, 44, 412, 278, 44, 12, C.muted, 'Status detail');
  }

  addButton(board, action, dark ? C.mint : C.ink, action === 'End call');
}

screens.forEach((screen, index) => buildScreen(index + 1, screen));

return {
  createdPage: page.name,
  screenCount: screens.length,
  palette: { ink: C.ink, pale: C.pale, mint: C.mint, violet: C.violet, magenta: C.magenta }
};
