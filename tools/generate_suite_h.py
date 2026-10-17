import json
from screen_builder import (
    ScreenBuilder, BG_DARK, BG_CARD, BG_CARD_LIGHT, BG_SURFACE, CARD_BORDER,
    PRIMARY_PURPLE, PRIMARY_PINK, SUCCESS_GREEN, AMBER_GOLD, DANGER_RED,
    TEXT_WHITE, TEXT_MUTED, TEXT_FAINT, SCREEN_WIDTH, SCREEN_HEIGHT
)

def build_suite_h(b: ScreenBuilder, base_row=4):
    print("Building Section 5: Host Access, Availability, Earnings, and Payouts (H01 - H11)...")

    # --- H01: Host Authorization & Intro ---
    s1 = b.add_screen_frame("H01_Host_Authorization", 0, base_row)
    b.add_header(s1, "Become a Host", "Earn by talking", show_back=True)
    b.add_node("rectangle", "H01_Banner", s1, 20, 110, 350, 160, {"fill": PRIMARY_PURPLE, "cornerRadius": 22})
    b.add_text(s1, "EARN UP TO ₹35,000 / MO", 40, 130, font_size=11, font_style="Bold", fill="#DDD6FE")
    b.add_text(s1, "Share Conversations.\nGet Paid Every Second.", 40, 150, font_size=20, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s1, "100% voice only • Private • Work your own hours", 40, 215, font_size=12, fill="#E0E7FF")

    b.add_card(s1, 290, 150, title="Why Host on Friendoo?")
    b.add_text(s1, "• Weekly direct bank deposits (Min ₹100)\n• Complete anonymity (Phone number masked)\n• Zero video requirements — pure voice calls\n• Set your own per-minute rates", 36, 325, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s1, "Apply to Become a Host", 730, variant="primary")

    # --- H02: Host Application Form ---
    s2 = b.add_screen_frame("H02_Host_Application", 1, base_row)
    b.add_header(s2, "Host Application", "Step 1: Identity & Audio")
    b.add_card(s2, 110, 80, title="Full Legal Name (as per Govt ID)")
    b.add_text(s2, "Priya Sharma", 36, 145, font_size=14, font_style="Bold", fill=TEXT_WHITE)

    b.add_card(s2, 205, 80, title="Government ID Document")
    b.add_text(s2, "📄 Aadhaar Card (Uploaded: verified_front.jpg)", 36, 240, font_size=12, fill=SUCCESS_GREEN)

    b.add_card(s2, 300, 100, title="Voice Sample Greeting (Required)")
    b.add_node("rectangle", "Voice_Box", s2, 36, 335, 318, 44, {"fill": BG_CARD_LIGHT, "cornerRadius": 10})
    b.add_text(s2, "🎙️ Sample recorded (0:24) • Tap to replay", 48, 348, font_size=12, fill=PRIMARY_PINK)

    b.add_button(s2, "Submit Application for Review", 730, variant="primary")

    # --- H03: Host Verification Status ---
    s3 = b.add_screen_frame("H03_Host_Verification_Status", 2, base_row)
    b.add_header(s3, "Verification Status")
    b.add_node("ellipse", "H03_Icon", s3, 155, 160, 80, 80, {"fill": AMBER_GOLD, "opacity": 0.2})
    b.add_text(s3, "⏳", 182, 185, font_size=28)
    b.add_text(s3, "Application Under Review", 20, 260, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s3, "We are verifying your ID and voice sample quality.", 20, 290, width=350, font_size=13, fill=TEXT_MUTED, align="center")

    steps = [
        ("1. Application Submitted", "18 Oct, 10:15 AM", True),
        ("2. Identity Document Check", "In Progress", False),
        ("3. Audio Quality Standard", "Pending", False),
        ("4. Host Activation", "Pending", False)
    ]
    for i, (st, sub, ok) in enumerate(steps):
        y = 350 + i * 70
        col = SUCCESS_GREEN if ok else (AMBER_GOLD if "Progress" in sub else TEXT_MUTED)
        b.add_node("ellipse", f"HStep_{i}", s3, 36, y, 20, 20, {"fill": col})
        b.add_text(s3, st, 68, y, font_size=13, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s3, sub, 68, y + 18, font_size=11, fill=TEXT_MUTED)

    b.add_button(s3, "Contact Host Support", 730, variant="secondary")

    # --- H04: Host Dashboard & Availability ---
    s4 = b.add_screen_frame("H04_Host_Dashboard", 3, base_row)
    b.add_header(s4, "Host Center", "Priya Sharma (Verified)", show_back=False)
    # Status Card
    b.add_node("rectangle", "Status_Banner", s4, 20, 110, 350, 130, {"fill": BG_CARD, "cornerRadius": 20, "stroke": SUCCESS_GREEN, "strokeWeight": 1.5})
    b.add_text(s4, "● ONLINE & ACCEPTING CALLS", 40, 130, font_size=12, font_style="Bold", fill=SUCCESS_GREEN)
    b.add_text(s4, "Rate: 25 Coins/min (₹15/min)", 40, 155, font_size=15, font_style="Bold", fill=TEXT_WHITE)
    b.add_node("rectangle", "Toggle_Off", s4, 240, 140, 110, 36, {"fill": DANGER_RED, "cornerRadius": 18})
    b.add_text(s4, "Go Offline", 262, 149, font_size=12, font_style="Bold", fill=TEXT_WHITE)

    # Today's Metrics
    b.add_text(s4, "Today's Performance", 24, 265, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    metrics = [("Today's Earnings", "₹1,420", SUCCESS_GREEN), ("Talk Time", "112 Mins", AMBER_GOLD), ("Calls Completed", "14", PRIMARY_PURPLE)]
    for i, (label, val, col) in enumerate(metrics):
        mx = 20 + i * 120
        b.add_node("rectangle", f"Metric_{i}", s4, mx, 295, 110, 85, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
        b.add_text(s4, label, mx + 8, 310, width=94, font_size=10, fill=TEXT_MUTED, align="center")
        b.add_text(s4, val, mx + 8, 335, width=94, font_size=16, font_style="Bold", fill=col, align="center")

    b.add_card(s4, 405, 110, title="Payout Status")
    b.add_text(s4, "Next Weekly Payout: Tuesday, 20 Oct\nPending Balance: ₹4,850.00 (Eligible for instant withdrawal)", 36, 440, font_size=12, fill=TEXT_MUTED)

    b.add_button(s4, "View Detailed Earnings", 660, variant="primary")
    b.add_button(s4, "Set Schedule & Hours", 725, variant="secondary")

    # --- H05: Availability & Schedule Settings ---
    s5 = b.add_screen_frame("H05_Availability_Schedule", 4, base_row)
    b.add_header(s5, "Schedule Settings", "Control when callers can reach you")
    b.add_toggle_row(s5, 120, "Auto-Offline When Inactive", "Turn off availability after 15 mins of idle time", active=True)
    b.add_toggle_row(s5, 195, "Do Not Disturb (DND)", "Temporarily reject incoming calls without penalty", active=False)

    b.add_text(s5, "Weekly Scheduled Slots", 24, 280, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    days = [("Mon - Fri", "18:00 - 23:30 IST", "Active"), ("Saturday", "14:00 - 01:00 IST", "Active"), ("Sunday", "14:00 - 22:00 IST", "Active")]
    for i, (day, hours, st) in enumerate(days):
        y = 310 + i * 65
        b.add_card(s5, y, 55)
        b.add_text(s5, day, 36, y + 12, font_size=13, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s5, hours, 36, y + 30, font_size=11, fill=TEXT_MUTED)
        b.add_text(s5, st, 280, y + 18, font_size=12, fill=SUCCESS_GREEN)

    b.add_button(s5, "+ Add New Time Slot", 730, variant="secondary")

    # --- H06: Incoming Call Request ---
    s6 = b.add_screen_frame("H06_Incoming_Call_Request", 5, base_row)
    b.add_text(s6, "INCOMING CALL REQUEST", 20, 60, width=350, font_size=13, font_style="Bold", fill=PRIMARY_PINK, align="center")
    # Caller avatar
    b.add_node("ellipse", "H06_Ring", s6, 135, 120, 120, 120, {"fill": PRIMARY_PURPLE, "opacity": 0.2})
    b.add_node("ellipse", "H06_Av", s6, 155, 140, 80, 80, {"fill": BG_CARD_LIGHT})
    b.add_text(s6, "👤", 182, 165, font_size=30)
    b.add_text(s6, "Rahul V. (Caller)", 20, 240, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s6, "Language: Hindi • Verified User", 20, 268, width=350, font_size=12, fill=TEXT_MUTED, align="center")

    b.add_card(s6, 310, 110, title="Confirmed Escrow Reservation")
    b.add_row(s6, 345, "Hold Amount", "25 Coins (₹15.00)")
    b.add_row(s6, 375, "Caller Balance", "Sufficient for ~5 mins")

    # Timer Ring
    b.add_text(s6, "⏱️ Auto-declines in 00:18s", 20, 445, width=350, font_size=13, fill=AMBER_GOLD, align="center")

    # Accept / Decline Buttons
    b.add_node("rectangle", "Btn_HDecline", s6, 30, 660, 155, 56, {"fill": DANGER_RED, "cornerRadius": 28})
    b.add_text(s6, "✕ Decline", 30, 678, width=155, font_size=16, font_style="Bold", fill=TEXT_WHITE, align="center")

    b.add_node("rectangle", "Btn_HAccept", s6, 205, 660, 155, 56, {"fill": SUCCESS_GREEN, "cornerRadius": 28})
    b.add_text(s6, "✓ Accept Call", 205, 678, width=155, font_size=16, font_style="Bold", fill=TEXT_WHITE, align="center")

    # --- H07: Host Earnings ---
    s7 = b.add_screen_frame("H07_Host_Earnings", 6, base_row)
    b.add_header(s7, "Earnings & Balance", show_back=True)
    # Available card
    b.add_node("rectangle", "H07_EarnCard", s7, 20, 110, 350, 150, {"fill": PRIMARY_PURPLE, "cornerRadius": 22})
    b.add_text(s7, "AVAILABLE FOR WITHDRAWAL", 40, 130, font_size=11, font_style="Bold", fill="#DDD6FE")
    b.add_text(s7, "₹4,850.00", 40, 150, font_size=32, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s7, "Pending clearance: ₹1,200.00 • Lifetime: ₹48,200", 40, 195, font_size=12, fill="#E0E7FF")

    b.add_text(s7, "Payout Options", 24, 285, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_card(s7, 310, 85, title="Weekly Payout Cycle")
    b.add_text(s7, "Payouts processed weekly (minimum ₹100 withdrawal limit).", 36, 340, font_size=11, fill=TEXT_MUTED)

    b.add_card(s7, 410, 85, title="Monthly Full Balance Settlement")
    b.add_text(s7, "Option to withdraw entire accumulated monthly earnings once a month.", 36, 440, font_size=11, fill=TEXT_MUTED)

    b.add_button(s7, "Request Immediate Withdrawal (₹4,850)", 730, variant="primary")

    # --- H08: Earnings Transaction Detail ---
    s8 = b.add_screen_frame("H08_Earnings_Tx_Detail", 7, base_row)
    b.add_header(s8, "Earning Record", "#EARN-9842")
    b.add_card(s8, 120, 260, title="Call Earnings Breakdown")
    b.add_row(s8, 160, "Caller", "Rahul V. (Session #CS-9182)")
    b.add_row(s8, 190, "Connected Duration", "18m 40s (1,120 sec)")
    b.add_row(s8, 220, "Gross Coins Billed", "466.67 Coins")
    b.add_row(s8, 250, "Platform Fee Share", "FREE (Promo Period)", val_color=SUCCESS_GREEN)
    b.add_row(s8, 280, "Host Net Share", "₹280.00", val_color=SUCCESS_GREEN)
    b.add_row(s8, 310, "Status", "CLEARED TO BALANCE", val_color=SUCCESS_GREEN)
    b.add_row(s8, 340, "Date & Time", "18 Oct 2026, 15:42")

    b.add_button(s8, "Back to Earnings", 730, variant="secondary")

    # --- H09: Payout Method ---
    s9 = b.add_screen_frame("H09_Payout_Method", 8, base_row)
    b.add_header(s9, "Payout Settings", "Direct bank or UPI")
    b.add_card(s9, 120, 180, title="Bank Account Details")
    b.add_text(s9, "Bank: HDFC Bank\nA/C: •••••••••••• 1092\nIFSC: HDFC0001248\nBeneficiary: Priya Sharma", 36, 155, font_size=13, fill=TEXT_WHITE)
    b.add_text(s9, "✓ Verified by penny drop", 36, 260, font_size=12, fill=SUCCESS_GREEN)

    b.add_card(s9, 320, 100, title="UPI Payout Option")
    b.add_text(s9, "priyasharma@okhdfcbank", 36, 355, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_button(s9, "Edit Payout Destination", 730, variant="secondary")

    # --- H10: Payout History ---
    s10 = b.add_screen_frame("H10_Payout_History", 9, base_row)
    b.add_header(s10, "Payout History", "Bank disbursements")
    payouts = [
        ("₹3,500.00", "Weekly Payout • HDFC •••• 1092", "14 Oct 2026", SUCCESS_GREEN),
        ("₹4,200.00", "Weekly Payout • HDFC •••• 1092", "07 Oct 2026", SUCCESS_GREEN),
        ("₹2,800.00", "Weekly Payout • HDFC •••• 1092", "30 Sep 2026", SUCCESS_GREEN)
    ]
    for i, (amt, desc, date, col) in enumerate(payouts):
        y = 120 + i * 85
        b.add_card(s10, y, 74)
        b.add_text(s10, amt, 36, y + 14, font_size=16, font_style="Bold", fill=col)
        b.add_text(s10, desc, 36, y + 36, font_size=11, fill=TEXT_MUTED)
        b.add_text(s10, "Completed", 260, y + 14, font_size=12, font_style="Bold", fill=SUCCESS_GREEN)
        b.add_text(s10, date, 260, y + 36, font_size=11, fill=TEXT_MUTED)

    # --- H11: Payout Detail ---
    s11 = b.add_screen_frame("H11_Payout_Detail", 10, base_row)
    b.add_header(s11, "Disbursement Receipt", "#PAY-10492")
    b.add_card(s11, 120, 240, title="Bank NEFT Transfer")
    b.add_row(s11, 160, "UTR Number", "HDFCN26104920194")
    b.add_row(s11, 190, "Gross Earnings", "₹3,535.35")
    b.add_row(s11, 220, "TDS Deducted (1%)", "₹35.35")
    b.add_row(s11, 250, "Net Credited", "₹3,500.00", val_color=SUCCESS_GREEN)
    b.add_row(s11, 280, "Destination Bank", "HDFC Bank •••• 1092")
    b.add_row(s11, 310, "Credited At", "14 Oct 2026, 11:20 AM")
    b.add_button(s11, "Download TDS Certificate", 730, variant="secondary")

print("Suite H module defined.")
