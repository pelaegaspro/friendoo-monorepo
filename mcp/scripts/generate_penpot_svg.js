const fs = require('fs');
const path = require('path');

const userScreens = [
  { id: "U1", name: "Splash / Phone Login", tag: "AUTH", subtitle: "Welcome to Friendoo 🎙️", cta: "Send OTP", ctaColor: "#7347EB", details: ["Brand Logo Mark", "+91 Mobile Number Input", "Country Flag Pill (+91)"] },
  { id: "U2", name: "OTP Verification", tag: "AUTH", subtitle: "Verify Phone Number", cta: "Verify & Continue", ctaColor: "#7347EB", details: ["6-Digit PIN Boxes", "OTP sent to +91 98765 43210", "Resend Timer (00:45)"] },
  { id: "U3", name: "Language Selection", tag: "ONBOARDING", subtitle: "Select Preferred Languages", cta: "Save & Proceed", ctaColor: "#7347EB", details: ["2-Column Language Grid", "Regional Script Tags (Hindi, Tamil, etc.)", "Multi-selection Pills"] },
  { id: "U4", name: "Discover Lounge", tag: "MAIN", subtitle: "Friendoo Regional Lounge", cta: "Start Audio Call", ctaColor: "#7347EB", details: ["Coin Balance: 1,250 🪙", "Language Filter Chips", "Verified Host Grid Cards"] },
  { id: "U5", name: "Host Profile Details", tag: "PROFILE", subtitle: "Priya Sharma, 23 👑", cta: "Call Now (5 coins/min)", ctaColor: "#7347EB", details: ["Avatar & Bio", "⭐ 4.9 Rating Badge (1.2k calls)", "Languages: Hindi, English"] },
  { id: "U6", name: "Connecting Call", tag: "CALL", subtitle: "Connecting to Priya...", cta: "Cancel Call", ctaColor: "#F43F5E", details: ["Pulsing Ring Animation", "Audio Ringing Indicator", "Rate: 5 coins/min"] },
  { id: "U7", name: "Live Audio Call Room", tag: "CALL", subtitle: "Live Voice Session 🎙️", cta: "End Call", ctaColor: "#F43F5E", details: ["Host Pulsing Avatar", "Ambient Audio Waveform", "Timer 04:28 | Rate: 5 coins/min", "Controls: Mute | Speaker | Gift"] },
  { id: "U8", name: "Gift Selection Sheet", tag: "OVERLAY", subtitle: "Send Gift 🎁", cta: "Send Gift", ctaColor: "#FFD700", details: ["Rose (10 🪙)", "Crown (50 🪙)", "Diamond (100 🪙)"] },
  { id: "U9", name: "Call Ended / Summary", tag: "CALL", subtitle: "Call Completed 🎉", cta: "Done", ctaColor: "#7347EB", details: ["Duration: 12 mins", "Cost: 60 Coins", "5-Star Rating Selector"] },
  { id: "U10", name: "Call History", tag: "HISTORY", subtitle: "Recent Conversations", cta: "Call Again", ctaColor: "#7347EB", details: ["List of Past Calls", "Host Avatars & Timestamps", "Call Duration & Coin Spend"] },
  { id: "U11", name: "Coin Wallet", tag: "WALLET", subtitle: "Available Balance: 1,250 🪙", cta: "Top-up Coins", ctaColor: "#FFD700", details: ["Gradient Balance Card", "Transaction History Link", "Bonus Offers Banner"] },
  { id: "U12", name: "Recharge Package Selection", tag: "WALLET", subtitle: "Recharge Coin Packs", cta: "Select Pack", ctaColor: "#FFD700", details: ["Trial: ₹29 (50 Coins)", "Starter: ₹50 (100 Coins)", "Value: ₹249 (+20% Bonus)", "Premium: ₹499 (+30% Bonus)"] },
  { id: "U13", name: "Payment Method", tag: "CHECKOUT", subtitle: "Choose Payment Method", cta: "Pay ₹249", ctaColor: "#10B981", details: ["UPI: Google Pay, PhonePe, Paytm", "Credit / Debit Card Form", "100% Secure Checkout Badge"] },
  { id: "U14", name: "Payment Success", tag: "CHECKOUT", subtitle: "Payment Successful! 🎉", cta: "Start Audio Calls", ctaColor: "#7347EB", details: ["+300 Coins Added", "Ref ID: #TXN849201", "Confetti Graphic Badge"] },
  { id: "U15", name: "User Profile & Settings", tag: "SETTINGS", subtitle: "Friendoo User Profile", cta: "Sign Out", ctaColor: "#F43F5E", details: ["Phone: +91 98765 43210", "App Language Preferences", "Safety & Support Links"] },
  { id: "U16", name: "Edit Profile", tag: "SETTINGS", subtitle: "Update Personal Details", cta: "Save Changes", ctaColor: "#7347EB", details: ["Name & Avatar Picker", "Bio Input Field", "City & Gender Selection"] },
  { id: "U17", name: "Change Language", tag: "SETTINGS", subtitle: "App Interface Language", cta: "Apply Language", ctaColor: "#7347EB", details: ["Radio Selection List", "English, Hindi, Tamil, Telugu", "Instant Refresh Pill"] },
  { id: "U18", name: "Safety Guidelines", tag: "SAFETY", subtitle: "Safety & Privacy First 🛡️", cta: "I Understand", ctaColor: "#10B981", details: ["100% Anonymous Calls", "Community Guidelines", "Report & Block Instructions"] },
  { id: "U19", name: "Support Center", tag: "SUPPORT", subtitle: "24/7 Help & Support", cta: "Submit Ticket", ctaColor: "#7347EB", details: ["FAQ Accordion List", "Live Chat Care Button", "Ticket Submission Form"] }
];

const hostScreens = [
  { id: "H1", name: "Host Application", tag: "HOST ONBOARDING", subtitle: "Become a Verified Host 🌟", cta: "Submit Application", ctaColor: "#F43F5E", details: ["ID Upload (Aadhaar/PAN)", "Video Verification Check", "Earnings Estimator Calculator"] },
  { id: "H2", name: "Approval Pending", tag: "HOST ONBOARDING", subtitle: "Application Under Review ⏳", cta: "Check Status", ctaColor: "#7347EB", details: ["Estimated Approval: 24-48 hrs", "Verification Checklist", "Support Chat Link"] },
  { id: "H3", name: "Host Dashboard", tag: "HOST MAIN", subtitle: "Host Control Center 🟢", cta: "View Earnings", ctaColor: "#F43F5E", details: ["Online / Offline Switch", "Today: ₹1,850 (14 Calls)", "Rating: ⭐ 4.9 (1.2k reviews)"] },
  { id: "H4", name: "Incoming Call Request", tag: "HOST CALL", subtitle: "Incoming Voice Call 📞", cta: "Accept Call", ctaColor: "#10B981", details: ["Caller: User #8492", "Rate: 5 coins/min", "15s Countdown Ring Timer"] },
  { id: "H5", name: "Active Voice Call", tag: "HOST CALL", subtitle: "Active Audio Session 🎙️", cta: "End Session", ctaColor: "#F43F5E", details: ["Session Timer: 18:42", "Accumulator: 90 Coins (₹45)", "Mute & Speaker Controls"] },
  { id: "H6", name: "Call Summary", tag: "HOST CALL", subtitle: "Session Completed ✅", cta: "Back to Dashboard", ctaColor: "#F43F5E", details: ["Duration: 18 min", "Earned: 90 Coins = ₹45.00", "Caller Feedback Note"] },
  { id: "H7", name: "Earnings Dashboard", tag: "HOST FINANCE", subtitle: "Earnings & Wallet 💰", cta: "Withdraw to UPI", ctaColor: "#10B981", details: ["Available Balance: ₹14,500", "Weekly Payout Schedule", "Weekly Goal Progress"] },
  { id: "H8", name: "Earnings Ledger", tag: "HOST FINANCE", subtitle: "Call Transaction History", cta: "Filter History", ctaColor: "#7347EB", details: ["Call #8492: +90 Coins (₹45)", "Platform Split Details", "Daily Earnings Breakdown"] },
  { id: "H9", name: "Withdrawal Request", tag: "HOST FINANCE", subtitle: "Instant UPI Payout", cta: "Request Payout", ctaColor: "#10B981", details: ["UPI ID: name@upi", "Amount Field (Min ₹500)", "Instant Settlement Pill"] },
  { id: "H10", name: "Withdrawal Status", tag: "HOST FINANCE", subtitle: "Payout History & Status", cta: "Done", ctaColor: "#7347EB", details: ["₹5,000 via UPI", "Status: COMPLETED ✅", "Bank Ref #UPI98471"] },
  { id: "H11", name: "Host Profile", tag: "HOST PROFILE", subtitle: "Priya Sharma 👑 (Star Host)", cta: "Edit Host Profile", ctaColor: "#F43F5E", details: ["1,420+ Calls Completed", "⭐ 4.9 Rating", "Languages: Hindi, English, Punjabi"] },
  { id: "H12", name: "Edit Host Profile", tag: "HOST PROFILE", subtitle: "Update Bio & Audio Preview", cta: "Save Profile", ctaColor: "#F43F5E", details: ["Profile Avatar Upload", "Voice Greeting Recorder", "Bio & Interests Tags"] },
  { id: "H13", name: "Host Languages", tag: "HOST PROFILE", subtitle: "Spoken Languages", cta: "Update Languages", ctaColor: "#F43F5E", details: ["Select Languages You Speak", "Fluency Level Badges", "Regional Preference"] },
  { id: "H14", name: "Host Support Desk", tag: "HOST SUPPORT", subtitle: "Priority Host Care", cta: "Contact Desk", ctaColor: "#F43F5E", details: ["Dedicated Host Manager", "Payment Dispute Resolution", "Community Guidelines"] }
];

function renderScreenSvg(s, x, y, isHost) {
  const accent = isHost ? "#F43F5E" : "#7347EB";
  const detailsXml = s.details.map((d, i) => 
    `<text x="44" y="${180 + (i * 26)}" fill="#94A3B8" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="13">✦  ${escapeXml(d)}</text>`
  ).join('\n        ');

  return `
    <!-- Screen: ${s.id}. ${s.name} -->
    <g id="screen-${s.id}" transform="translate(${x}, ${y})">
      <!-- Screen Outer Frame (390 x 844) -->
      <rect width="390" height="844" rx="40" fill="#0D0F1D" stroke="#232742" stroke-width="4"/>
      
      <!-- Top Status Bar -->
      <text x="32" y="32" fill="#94A3B8" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600">9:41</text>
      <text x="310" y="32" fill="#94A3B8" font-family="'Plus Jakarta Sans', sans-serif" font-size="12">📶  🔋</text>
      
      <!-- Flow Tag Badge -->
      <rect x="24" y="52" width="120" height="24" rx="12" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="1"/>
      <text x="34" y="68" fill="${accent}" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700">${escapeXml(s.tag)}</text>
      
      <!-- Screen Title -->
      <text x="24" y="104" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-size="19" font-weight="800">${escapeXml(s.id)}. ${escapeXml(s.name)}</text>
      
      <!-- Main Content Card Container -->
      <rect x="20" y="120" width="350" height="600" rx="20" fill="#191C30" stroke="#2A2F4C" stroke-width="1.5"/>
      
      <!-- Card Subtitle -->
      <text x="44" y="152" fill="#FFFFFF" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700">${escapeXml(s.subtitle)}</text>
      
      <!-- Details Items -->
      ${detailsXml}
      
      <!-- Graphic Mock / Waveform Container -->
      <rect x="40" y="330" width="310" height="200" rx="16" fill="#131627" stroke="#232742" stroke-width="1.5"/>
      
      <!-- Simulated Waveform Bars -->
      <g transform="translate(140, 410)">
        <rect x="0" y="-15" width="6" height="30" rx="3" fill="${accent}"/>
        <rect x="12" y="-25" width="6" height="50" rx="3" fill="${accent}"/>
        <rect x="24" y="-35" width="6" height="70" rx="3" fill="${s.ctaColor}"/>
        <rect x="36" y="-20" width="6" height="40" rx="3" fill="${accent}"/>
        <rect x="48" y="-10" width="6" height="20" rx="3" fill="${accent}"/>
      </g>
      <text x="95" y="470" fill="#94A3B8" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600">${s.name.includes("Call") ? "Live Voice Audio Waveform 🎙️" : "High-Fidelity Mobile Component 📱"}</text>
      
      <!-- Action CTA Button -->
      <rect x="40" y="640" width="310" height="52" rx="26" fill="${s.ctaColor}"/>
      <text x="195" y="672" fill="${s.ctaColor === '#FFD700' ? '#0D0F1D' : '#FFFFFF'}" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" font-weight="800" text-anchor="middle">${escapeXml(s.cta)}</text>
      
      <!-- Prototype Footer Link Badge -->
      <rect x="20" y="736" width="350" height="36" rx="12" fill="#101322" stroke="#232742" stroke-width="1"/>
      <text x="40" y="759" fill="#10B981" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700">⚡ Prototype Interaction Active  ➔  Next Screen</text>
    </g>
  `;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function generateSvg() {
  const totalWidth = Math.max(userScreens.length, hostScreens.length) * 440 + 100;
  const totalHeight = 1950;

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;display=swap');
    </style>
  </defs>

  <!-- Global Canvas Background -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="#070913"/>

  <!-- Row 1 Header: USER APP FLOW (19 Screens) -->
  <g transform="translate(60, 50)">
    <rect width="420" height="44" rx="22" fill="#7347EB" fill-opacity="0.2" stroke="#7347EB" stroke-width="1.5"/>
    <text x="24" y="28" fill="#7347EB" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="800">📱 USER APP FLOW (Screens U1 – U19)</text>
  </g>

  <!-- Row 1 Screens -->
  ${userScreens.map((s, idx) => renderScreenSvg(s, 60 + (idx * 430), 120, false)).join('\n')}

  <!-- Row 2 Header: HOST APP FLOW (14 Screens) -->
  <g transform="translate(60, 1030)">
    <rect width="420" height="44" rx="22" fill="#F43F5E" fill-opacity="0.2" stroke="#F43F5E" stroke-width="1.5"/>
    <text x="24" y="28" fill="#F43F5E" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="800">🎧 HOST APP FLOW (Screens H1 – H14)</text>
  </g>

  <!-- Row 2 Screens -->
  ${hostScreens.map((s, idx) => renderScreenSvg(s, 60 + (idx * 430), 1100, true)).join('\n')}
</svg>`;

  fs.writeFileSync('d:\\AllBackup\\friendoo\\friendoo_33_screens_master.svg', svgContent, 'utf8');
  console.log('✅ Generated friendoo_33_screens_master.svg successfully!');
}

generateSvg();
