/**
 * Friendoo 33-Screen Master Mobile UI Penpot Generator Script
 * Generates User App Flow (19 screens) and Host App Flow (14 screens)
 * Palette: Violet Purple (#7347EB), Coral Sunset (#F43F5E), Electric Gold (#FFD700), Obsidian Charcoal (#0D0F1D)
 */

const generateFriendooPenpotDesignCode = `
const page = penpot.root;

const userScreensData = [
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

const hostScreensData = [
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

let createdBoards = [];

function buildScreenBoard(screen, x, y, isHost) {
  const board = penpot.createBoard();
  board.name = \`\${isHost ? "HOST" : "USER"} - \${screen.id}. \${screen.name}\`;
  board.resize(390, 844);
  board.x = x;
  board.y = y;
  board.fills = [{ fillColor: "#0D0F1D", fillOpacity: 1 }];

  // Status Bar
  const statusBar = penpot.createText("9:41                     📶 🔋");
  statusBar.fontSize = 12;
  statusBar.fills = [{ fillColor: "#94A3B8", fillOpacity: 1 }];
  board.appendChild(statusBar);
  penpotUtils.setParentXY(statusBar, 20, 14);

  // Role Badge
  const badge = penpot.createText(screen.tag);
  badge.fontSize = 11;
  badge.fontWeight = "700";
  badge.fills = [{ fillColor: isHost ? "#F43F5E" : "#7347EB", fillOpacity: 1 }];
  board.appendChild(badge);
  penpotUtils.setParentXY(badge, 24, 42);

  // Title
  const title = penpot.createText(\`\${screen.id}. \${screen.name}\`);
  title.fontSize = 18;
  title.fontWeight = "700";
  title.fills = [{ fillColor: "#FFFFFF", fillOpacity: 1 }];
  board.appendChild(title);
  penpotUtils.setParentXY(title, 24, 62);

  // Container Card
  const card = penpot.createRectangle();
  card.resize(342, 600);
  card.borderRadius = 18;
  card.fills = [{ fillColor: "#191C30", fillOpacity: 1 }];
  card.strokes = [{ strokeColor: "#2A2F4C", strokeWidth: 1 }];
  board.appendChild(card);
  penpotUtils.setParentXY(card, 24, 100);

  // Subtitle
  const sub = penpot.createText(screen.subtitle);
  sub.fontSize = 16;
  sub.fontWeight = "600";
  sub.fills = [{ fillColor: "#FFFFFF", fillOpacity: 1 }];
  board.appendChild(sub);
  penpotUtils.setParentXY(sub, 44, 124);

  // Details
  screen.details.forEach((item, idx) => {
    const detail = penpot.createText(\`• \${item}\`);
    detail.fontSize = 13;
    detail.fills = [{ fillColor: "#94A3B8", fillOpacity: 1 }];
    board.appendChild(detail);
    penpotUtils.setParentXY(detail, 44, 165 + (idx * 28));
  });

  // Graphic Mock
  const graphic = penpot.createRectangle();
  graphic.resize(300, 180);
  graphic.borderRadius = 14;
  graphic.fills = [{ fillColor: "#232742", fillOpacity: 1 }];
  board.appendChild(graphic);
  penpotUtils.setParentXY(graphic, 45, 330);

  const graphicText = penpot.createText(screen.name.includes("Call") ? "🎙️ Audio Visualizer / Pulsing Rings" : "📱 Mobile UI Layout & Elements");
  graphicText.fontSize = 13;
  graphicText.fills = [{ fillColor: isHost ? "#F43F5E" : "#7347EB", fillOpacity: 1 }];
  board.appendChild(graphicText);
  penpotUtils.setParentXY(graphicText, 65, 410);

  // Action Button
  const btn = penpot.createRectangle();
  btn.resize(300, 50);
  btn.borderRadius = 25;
  btn.fills = [{ fillColor: screen.ctaColor, fillOpacity: 1 }];
  board.appendChild(btn);
  penpotUtils.setParentXY(btn, 45, 620);

  const btnText = penpot.createText(screen.cta);
  btnText.fontSize = 15;
  btnText.fontWeight = "700";
  btnText.fills = [{ fillColor: "#FFFFFF", fillOpacity: 1 }];
  board.appendChild(btnText);
  penpotUtils.setParentXY(btnText, 140, 635);

  // Footer Link Indicator
  const linkFooter = penpot.createText("⚡ Prototype Interaction Active");
  linkFooter.fontSize = 11;
  linkFooter.fills = [{ fillColor: "#64748B", fillOpacity: 1 }];
  board.appendChild(linkFooter);
  penpotUtils.setParentXY(linkFooter, 24, 720);

  createdBoards.push(board.name);
}

userScreensData.forEach((s, idx) => {
  buildScreenBoard(s, 100 + (idx * 430), 100, false);
});

hostScreensData.forEach((s, idx) => {
  buildScreenBoard(s, 100 + (idx * 430), 1040, true);
});

return {
  status: "success",
  totalCreated: userScreensData.length + hostScreensData.length,
  userScreensCount: userScreensData.length,
  hostScreensCount: hostScreensData.length,
  canvasLayout: "Row 1: User App Flow (19 screens), Row 2: Host App Flow (14 screens)"
};
`;

module.exports = { generateFriendooPenpotDesignCode };
