import fs from 'fs';
import path from 'path';

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
const COLS = 4;

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function renderScreenContent(no, data) {
  const [title, eyebrow, body, action, kind, tone] = data;
  const dark = tone === 'dark';
  const elements = [];

  // Screen background frame
  elements.push(`<rect width="${W}" height="${H}" rx="32" fill="${dark ? C.navy : C.pale}" />`);

  // Aurora blobs
  elements.push(`
    <circle cx="300" cy="160" r="140" fill="${dark ? C.violet : C.mint}" fill-opacity="${dark ? 0.15 : 0.18}" filter="blur(40px)" />
    <circle cx="340" cy="240" r="110" fill="${dark ? C.magenta : C.cyan}" fill-opacity="${dark ? 0.18 : 0.22}" filter="blur(30px)" />
    <circle cx="-20" cy="620" r="120" fill="${dark ? C.cyan : C.violet}" fill-opacity="${dark ? 0.12 : 0.15}" filter="blur(40px)" />
  `);

  // Header
  const numPadded = String(no).padStart(2, '0');
  elements.push(`
    <text x="24" y="44" font-family="Inter, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" fill="${dark ? C.mint : C.violet}">${numPadded}  FRIENDOO</text>
    <circle cx="350" cy="40" r="14" fill="${dark ? C.mint : C.violet}" />
    <text x="350" y="44" font-family="Inter, -apple-system, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="${dark ? C.navy : C.white}">F</text>
    <text x="24" y="90" font-family="Inter, -apple-system, sans-serif" font-size="24" font-weight="800" fill="${dark ? C.white : C.ink}">${escapeXml(eyebrow)}</text>
    <text x="24" y="152" font-family="Inter, -apple-system, sans-serif" font-size="13" fill="${dark ? C.darkMuted : C.muted}">${escapeXml(body)}</text>
  `);

  // Content by kind
  if (kind === 'auth') {
    elements.push(`
      <circle cx="195" cy="280" r="54" fill="${C.violet}" />
      <text x="195" y="294" font-family="Inter, -apple-system, sans-serif" font-size="40" font-weight="900" text-anchor="middle" fill="${C.white}">F</text>
      <rect x="24" y="396" width="${W - 48}" height="56" rx="18" fill="${C.white}" stroke="${C.line}" stroke-width="1" />
      <text x="44" y="430" font-family="Inter, -apple-system, sans-serif" font-size="14" font-weight="600" fill="${C.ink}">${no === 3 ? '•  •  •  •  •  •' : '+91  •  Phone number'}</text>
      <text x="24" y="480" font-family="Inter, -apple-system, sans-serif" font-size="12" fill="${C.muted}">${no === 3 ? 'Resend code in 00:24' : 'Your number stays private and secure'}</text>
    `);
  } else if (kind === 'discovery') {
    // Pill
    elements.push(`
      <rect x="24" y="196" width="132" height="28" rx="14" fill="${C.mint}" fill-opacity="0.2" />
      <text x="90" y="214" font-family="Inter, -apple-system, sans-serif" font-size="10" font-weight="800" text-anchor="middle" fill="${C.ink}">AVAILABLE NOW</text>
    `);
    const hosts = [
      ['Maya Shah', 'English • Hindi • Warm & curious', '$0.80/min', 246, C.mint],
      ['Anika Rai', 'English • Music • Thoughtful', '$0.95/min', 350, C.violet],
      ['Sara Khan', 'English • Books • Easygoing', '$0.75/min', 454, C.cyan]
    ];
    hosts.forEach(([hname, hsub, hrate, hy, hcol]) => {
      elements.push(`
        <rect x="24" y="${hy}" width="${W - 48}" height="88" rx="20" fill="${C.white}" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.04))" />
        <circle cx="64" cy="${hy + 44}" r="26" fill="${hcol}" />
        <text x="64" y="${hy + 50}" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="800" text-anchor="middle" fill="${C.white}">${hname[0]}</text>
        <circle cx="82" cy="${hy + 60}" r="6" fill="${C.mint}" stroke="${C.white}" stroke-width="2" />
        <text x="106" y="${hy + 36}" font-family="Inter, -apple-system, sans-serif" font-size="15" font-weight="800" fill="${C.ink}">${hname}</text>
        <text x="106" y="${hy + 58}" font-family="Inter, -apple-system, sans-serif" font-size="11" fill="${C.muted}">${hsub}</text>
        <text x="318" y="${hy + 48}" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="800" text-anchor="end" fill="${C.blue}">${hrate}</text>
      `);
    });
  } else if (kind === 'profile') {
    elements.push(`
      <circle cx="74" cy="254" r="48" fill="${C.mint}" />
      <text x="74" y="266" font-family="Inter, -apple-system, sans-serif" font-size="32" font-weight="900" text-anchor="middle" fill="${C.navy}">M</text>
      <text x="138" y="246" font-family="Inter, -apple-system, sans-serif" font-size="22" font-weight="800" fill="${C.ink}">Maya Shah</text>
      <text x="138" y="272" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${C.mint}">Verified Host • Available</text>
      <rect x="24" y="324" width="130" height="30" rx="15" fill="${C.violet}" fill-opacity="0.15" />
      <text x="89" y="343" font-family="Inter, -apple-system, sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="${C.violet}">English • Hindi</text>
      <text x="24" y="396" font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="800" fill="${C.blue}">$0.80 / connected min</text>
      <rect x="24" y="424" width="${W - 48}" height="120" rx="18" fill="${C.white}" />
      <text x="44" y="458" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${C.ink}">Conversation style</text>
      <text x="44" y="496" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${C.ink}">Call boundaries</text>
      <text x="44" y="534" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${C.rose}">Report or block</text>
    `);
  } else if (kind === 'wallet') {
    elements.push(`
      <rect x="24" y="200" width="${W - 48}" height="154" rx="24" fill="${C.ink}" />
      <text x="48" y="236" font-family="Inter, -apple-system, sans-serif" font-size="12" fill="${C.darkMuted}">Available balance</text>
      <text x="48" y="284" font-family="Inter, -apple-system, sans-serif" font-size="38" font-weight="800" fill="${C.white}">$18.40</text>
      <text x="48" y="326" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${C.mint}">$4.00 reserved</text>
      <rect x="24" y="378" width="${W - 48}" height="54" rx="16" fill="${C.white}" />
      <text x="44" y="410" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${C.ink}">Top-up confirmed</text>
      <text x="320" y="410" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="end" fill="${C.mint}">+$20.00</text>
      <rect x="24" y="444" width="${W - 48}" height="54" rx="16" fill="${C.white}" />
      <text x="44" y="476" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${C.ink}">Call with Maya</text>
      <text x="320" y="476" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="end" fill="${C.ink}">-$6.96</text>
      <rect x="24" y="510" width="${W - 48}" height="54" rx="16" fill="${C.white}" />
      <text x="44" y="542" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${C.ink}">Reservation released</text>
      <text x="320" y="542" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="end" fill="${C.violet}">+$4.00</text>
    `);
  } else if (kind === 'call') {
    elements.push(`
      <circle cx="195" cy="270" r="56" fill="${C.mint}" fill-opacity="0.25" />
      <circle cx="195" cy="270" r="32" fill="${C.mint}" />
      <text x="195" y="278" font-family="Inter, -apple-system, sans-serif" font-size="20" font-weight="900" text-anchor="middle" fill="${C.navy}">M</text>
      <text x="195" y="360" font-family="Inter, -apple-system, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="${C.white}">Maya Shah</text>
      <text x="195" y="390" font-family="Inter, -apple-system, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${C.mint}">00:06:42 • $0.80/min</text>
      
      <!-- Audio Waveform -->
      <g transform="translate(95, 430)">
        <rect x="0" y="26" width="12" height="28" rx="6" fill="${C.mint}" />
        <rect x="24" y="14" width="12" height="52" rx="6" fill="${C.mint}" />
        <rect x="48" y="4" width="12" height="72" rx="6" fill="${C.mint}" />
        <rect x="72" y="20" width="12" height="40" rx="6" fill="${C.mint}" />
        <rect x="96" y="8" width="12" height="64" rx="6" fill="${C.mint}" />
        <rect x="120" y="24" width="12" height="32" rx="6" fill="${C.mint}" />
        <rect x="144" y="30" width="12" height="20" rx="6" fill="${C.mint}" />
        <rect x="168" y="16" width="12" height="48" rx="6" fill="${C.mint}" />
        <rect x="192" y="28" width="12" height="24" rx="6" fill="${C.mint}" />
      </g>
      
      <!-- Controls -->
      <rect x="40" y="560" width="70" height="70" rx="24" fill="${C.white}" fill-opacity="0.15" />
      <text x="75" y="600" font-family="Inter, -apple-system, sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="${C.white}">Mute</text>
      <rect x="160" y="560" width="70" height="70" rx="24" fill="${C.white}" fill-opacity="0.15" />
      <text x="195" y="600" font-family="Inter, -apple-system, sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="${C.white}">Speaker</text>
      <rect x="280" y="560" width="70" height="70" rx="24" fill="${C.rose}" />
      <text x="315" y="600" font-family="Inter, -apple-system, sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="${C.white}">End</text>
    `);
  } else if (kind === 'terms') {
    elements.push(`
      <rect x="24" y="220" width="${W - 48}" height="180" rx="22" fill="${C.white}" />
      <text x="44" y="256" font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="800" fill="${C.ink}">Call Terms &amp; Rates</text>
      <text x="44" y="294" font-family="Inter, -apple-system, sans-serif" font-size="14" font-weight="700" fill="${C.blue}">$0.80 / connected minute</text>
      <text x="44" y="328" font-family="Inter, -apple-system, sans-serif" font-size="13" fill="${C.ink}">Minimum reservation: <strong>$4.00 (5 min)</strong></text>
      <text x="44" y="360" font-family="Inter, -apple-system, sans-serif" font-size="11" fill="${C.muted}">Reservation is held safely, not charged upfront.</text>
    `);
  } else if (kind === 'receipt') {
    elements.push(`
      <circle cx="195" cy="250" r="44" fill="${C.mint}" fill-opacity="0.2" />
      <circle cx="195" cy="250" r="24" fill="${C.mint}" />
      <text x="195" y="258" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="900" text-anchor="middle" fill="${C.navy}">✓</text>
      <text x="195" y="330" font-family="Inter, -apple-system, sans-serif" font-size="34" font-weight="800" text-anchor="middle" fill="${C.ink}">$6.96</text>
      <rect x="24" y="370" width="${W - 48}" height="170" rx="20" fill="${C.white}" />
      <text x="44" y="406" font-family="Inter, -apple-system, sans-serif" font-size="13" fill="${C.muted}">Duration: <strong>08:42 mins</strong></text>
      <text x="44" y="440" font-family="Inter, -apple-system, sans-serif" font-size="13" fill="${C.muted}">Reservation applied: <strong>-$4.00</strong></text>
      <text x="44" y="474" font-family="Inter, -apple-system, sans-serif" font-size="13" fill="${C.muted}">Additional time: <strong>-$2.96</strong></text>
      <text x="44" y="508" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${C.mint}">Settlement completed</text>
    `);
  } else {
    // Generic status card
    const isError = title.toLowerCase().includes('failed') || title.toLowerCase().includes('insufficient') || title.toLowerCase().includes('denied') || title.toLowerCase().includes('expired');
    elements.push(`
      <circle cx="195" cy="260" r="50" fill="${isError ? C.rose : C.mint}" fill-opacity="0.2" />
      <circle cx="195" cy="260" r="26" fill="${isError ? C.rose : C.mint}" />
      <text x="195" y="268" font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="900" text-anchor="middle" fill="${C.white}">${isError ? '!' : '✓'}</text>
      <rect x="24" y="350" width="${W - 48}" height="140" rx="20" fill="${dark ? 'rgba(255,255,255,0.08)' : C.white}" />
      <text x="44" y="390" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="800" fill="${dark ? C.white : C.ink}">${escapeXml(title)}</text>
      <text x="44" y="424" font-family="Inter, -apple-system, sans-serif" font-size="12" fill="${dark ? C.darkMuted : C.muted}">${escapeXml(body)}</text>
    `);
  }

  // Primary Button
  const isDestructive = action === 'End call' || action === 'Cancel & release';
  const btnFill = isDestructive ? C.rose : (dark ? C.mint : C.ink);
  const btnTextFill = dark && !isDestructive ? C.navy : C.white;

  elements.push(`
    <rect x="24" y="${H - 96}" width="${W - 48}" height="56" rx="18" fill="${btnFill}" />
    <text x="195" y="${H - 61}" font-family="Inter, -apple-system, sans-serif" font-size="15" font-weight="700" text-anchor="middle" fill="${btnTextFill}">${escapeXml(action)}</text>
  `);

  return elements.join('\n');
}

// 1. Generate master combined SVG (for one-click import into Pixso)
const totalRows = Math.ceil(screens.length / COLS);
const totalWidth = COLS * W + (COLS - 1) * GAP_X + 100;
const totalHeight = totalRows * H + (totalRows - 1) * GAP_Y + 100;

const masterSvgParts = [
  `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
  `<rect width="${totalWidth}" height="${totalHeight}" fill="#E8EDF3" />`
];

screens.forEach((screen, index) => {
  const no = index + 1;
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = 50 + col * (W + GAP_X);
  const y = 50 + row * (H + GAP_Y);

  masterSvgParts.push(`  <g id="${String(no).padStart(2, '0')}_${escapeXml(screen[0])}" transform="translate(${x}, ${y})">`);
  masterSvgParts.push(renderScreenContent(no, screen));
  masterSvgParts.push(`  </g>`);
});

masterSvgParts.push(`</svg>`);

const masterSvgPath = path.resolve('D:/AllBackup/friendoo/friendoo_33_screens_for_pixso.svg');
fs.writeFileSync(masterSvgPath, masterSvgParts.join('\n'), 'utf8');
console.log(`Generated Master Pixso SVG: ${masterSvgPath} (${(fs.statSync(masterSvgPath).size / 1024).toFixed(1)} KB)`);

// 2. Generate individual SVG files in directory
const indivDir = path.resolve('D:/AllBackup/friendoo/pixso_screens_svg');
if (!fs.existsSync(indivDir)) {
  fs.mkdirSync(indivDir, { recursive: true });
}

screens.forEach((screen, index) => {
  const no = index + 1;
  const filename = `${String(no).padStart(2, '0')}_${screen[0].toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}.svg`;
  const indivSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g id="${String(no).padStart(2, '0')}_${escapeXml(screen[0])}">
${renderScreenContent(no, screen)}
  </g>
</svg>`;
  fs.writeFileSync(path.join(indivDir, filename), indivSvg, 'utf8');
});

console.log(`Generated ${screens.length} individual SVGs in ${indivDir}`);
