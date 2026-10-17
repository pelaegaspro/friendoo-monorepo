import json
from screen_builder import (
    ScreenBuilder, BG_DARK, BG_CARD, BG_CARD_LIGHT, BG_SURFACE, CARD_BORDER,
    PRIMARY_PURPLE, PRIMARY_PINK, SUCCESS_GREEN, AMBER_GOLD, DANGER_RED,
    TEXT_WHITE, TEXT_MUTED, TEXT_FAINT, SCREEN_WIDTH, SCREEN_HEIGHT
)

def build_suite_w(b: ScreenBuilder, base_row=2):
    print("Building Section 3: Wallet, Payment, and Transaction Detail (W01 - W11)...")

    # --- W01: Wallet Overview ---
    s1 = b.add_screen_frame("W01_Wallet_Overview", 0, base_row)
    b.add_header(s1, "My Wallet", "Credits and balance", show_back=False)
    # Balance Banner
    b.add_node("rectangle", "Balance_Banner", s1, 20, 110, 350, 150, {"fill": PRIMARY_PURPLE, "cornerRadius": 22})
    b.add_text(s1, "AVAILABLE BALANCE", 40, 130, font_size=11, font_style="Bold", fill="#DDD6FE")
    b.add_text(s1, "🪙 120 Coins", 40, 150, font_size=32, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s1, "≈ ₹120.00 • Holds reserved: 0 Coins", 40, 195, font_size=12, fill="#E0E7FF")
    b.add_node("rectangle", "Add_Btn_Pill", s1, 240, 185, 110, 36, {"fill": TEXT_WHITE, "cornerRadius": 18})
    b.add_text(s1, "+ Top Up", 265, 194, font_size=13, font_style="Bold", fill=PRIMARY_PURPLE)

    # Quick packs
    b.add_text(s1, "Quick Recharge", 24, 285, font_size=15, font_style="Bold", fill=TEXT_WHITE)
    packs = [("100", "₹99"), ("300 + 50", "₹299"), ("600 + 150", "₹599")]
    for i, (coins, price) in enumerate(packs):
        px = 20 + i * 120
        b.add_node("rectangle", f"Pack_{i}", s1, px, 315, 110, 90, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
        b.add_text(s1, f"🪙 {coins}", px + 10, 330, width=90, font_size=13, font_style="Bold", fill=AMBER_GOLD, align="center")
        b.add_text(s1, price, px + 10, 355, width=90, font_size=14, font_style="Bold", fill=TEXT_WHITE, align="center")

    # Recent Activity
    b.add_text(s1, "Recent Activity", 24, 430, font_size=15, font_style="Bold", fill=TEXT_WHITE)
    txs = [
        ("Voice Call (Priya Sharma)", "-75 Coins", "Today, 4:12 PM", DANGER_RED),
        ("Wallet Top Up (UPI)", "+300 Coins", "Yesterday", SUCCESS_GREEN),
        ("Call Hold Released", "+25 Coins", "14 Oct", SUCCESS_GREEN)
    ]
    for i, (desc, amt, date, col) in enumerate(txs):
        y = 460 + i * 72
        b.add_card(s1, y, 62)
        b.add_text(s1, desc, 36, y + 14, font_size=13, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s1, date, 36, y + 34, font_size=11, fill=TEXT_MUTED)
        b.add_text(s1, amt, 240, y + 20, width=115, font_size=14, font_style="Bold", fill=col, align="right")

    b.add_bottom_nav(s1, active="Wallet")

    # --- W02: Choose Top-Up Amount ---
    s2 = b.add_screen_frame("W02_Choose_Topup_Amount", 1, base_row)
    b.add_header(s2, "Select Coin Pack", "Instant credit to wallet")
    upacks = [
        ("Starter Pack", "100 Coins", "₹99", "Best for quick calls", False),
        ("Popular Pack", "300 + 50 Bonus", "₹299", "Most popular choice", True),
        ("Mega Pack", "600 + 150 Bonus", "₹599", "Great value for regulars", False),
        ("Pro Talker", "1200 + 400 Bonus", "₹1,199", "Maximum savings", False)
    ]
    for i, (name, coins, price, desc, popular) in enumerate(upacks):
        y = 110 + i * 110
        border_c = PRIMARY_PINK if popular else CARD_BORDER
        b.add_node("rectangle", f"UPack_{i}", s2, 20, y, 350, 95, {"fill": BG_CARD, "cornerRadius": 18, "stroke": border_c, "strokeWeight": 1.5 if popular else 1})
        if popular:
            b.add_node("rectangle", f"PopBadge_{i}", s2, 250, y - 10, 105, 22, {"fill": PRIMARY_PINK, "cornerRadius": 11})
            b.add_text(s2, "POPULAR", 262, y - 6, font_size=10, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s2, name, 36, y + 16, font_size=15, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s2, coins, 36, y + 38, font_size=13, font_style="Bold", fill=AMBER_GOLD)
        b.add_text(s2, desc, 36, y + 60, font_size=11, fill=TEXT_MUTED)
        b.add_text(s2, price, 240, y + 30, width=110, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="right")

    b.add_button(s2, "Continue to Payment (₹299)", 730, variant="primary")

    # --- W03: Payment Methods ---
    s3 = b.add_screen_frame("W03_Payment_Methods", 2, base_row)
    b.add_header(s3, "Select Payment Method", "Amount: ₹299 (350 Coins)")
    b.add_text(s3, "Instant UPI Apps", 24, 115, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    upis = [("Google Pay", "Fastest response"), ("PhonePe", "Auto-app redirect"), ("Paytm UPI", "Zero fee")]
    for i, (app, sub) in enumerate(upis):
        y = 145 + i * 72
        b.add_card(s3, y, 62)
        b.add_text(s3, f"📱 {app}", 36, y + 14, font_size=14, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s3, sub, 36, y + 36, font_size=11, fill=TEXT_MUTED)
        b.add_text(s3, "Select ›", 290, y + 20, font_size=13, fill=PRIMARY_PURPLE)

    b.add_text(s3, "Saved Cards & Others", 24, 385, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_card(s3, 415, 62)
    b.add_text(s3, "💳 HDFC Debit Card •••• 4821", 36, 429, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s3, "Expires 08/29", 36, 451, font_size=11, fill=TEXT_MUTED)

    b.add_button(s3, "+ Add New UPI ID or Card", 730, variant="secondary")

    # --- W04: Add Payment Method ---
    s4 = b.add_screen_frame("W04_Add_Payment_Method", 3, base_row)
    b.add_header(s4, "Add UPI ID", "Secure bank verification")
    b.add_card(s4, 120, 100, title="Virtual Payment Address (VPA)")
    b.add_node("rectangle", "VPA_Input", s4, 36, 165, 318, 44, {"fill": BG_CARD_LIGHT, "cornerRadius": 10, "stroke": PRIMARY_PURPLE, "strokeWeight": 1.5})
    b.add_text(s4, "rahul@okaxis", 48, 178, font_size=14, font_style="Bold", fill=TEXT_WHITE)

    b.add_card(s4, 240, 120, title="Security Guarantee")
    b.add_text(s4, "• Friendoo never stores raw PINs or CVVs.\n• Verification occurs via NPCI certified UPI channels.\n• Masked identifiers are used for one-tap recharge.", 36, 275, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s4, "Verify & Proceed to Pay", 730, variant="primary")

    # --- W05: Top-Up Processing ---
    s5 = b.add_screen_frame("W05_Topup_Processing", 4, base_row)
    b.add_header(s5, "Payment Processing", show_back=False)
    b.add_node("ellipse", "Spin_Ring", s5, 145, 240, 100, 100, {"fill": BG_CARD, "stroke": PRIMARY_PURPLE, "strokeWeight": 4})
    b.add_text(s5, "⏳", 182, 274, font_size=28)
    b.add_text(s5, "Verifying With Bank...", 20, 370, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s5, "Please approve the request in your Google Pay app.\nDo NOT hit back or close the app.", 20, 400, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_card(s5, 480, 70)
    b.add_text(s5, "Order ID: #ORD-9821 • Amount: ₹299", 36, 508, font_size=12, fill=TEXT_MUTED)
    b.add_button(s5, "Check Status Later", 730, variant="secondary")

    # --- W06: Top-Up Credited ---
    s6 = b.add_screen_frame("W06_Topup_Credited", 5, base_row)
    b.add_header(s6, "Payment Success", show_back=False)
    b.add_node("ellipse", "Success_Icon_Bg", s6, 155, 160, 80, 80, {"fill": SUCCESS_GREEN, "opacity": 0.2})
    b.add_text(s6, "✓", 182, 180, font_size=36, font_style="Bold", fill=SUCCESS_GREEN)
    b.add_text(s6, "🪙 350 Coins Added!", 20, 260, width=350, font_size=22, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s6, "Your new balance is 470 Coins", 20, 295, width=350, font_size=14, fill=AMBER_GOLD, align="center")

    b.add_card(s6, 340, 160, title="Receipt Summary")
    b.add_row(s6, 380, "Transaction ID", "TXN-829104")
    b.add_row(s6, 410, "Amount Paid", "₹299.00 (Incl GST)")
    b.add_row(s6, 440, "Payment Mode", "Google Pay UPI")
    b.add_row(s6, 470, "Date & Time", "Today, 4:18 PM")
    b.add_button(s6, "Start Calling Now", 730, variant="primary")

    # --- W07: Top-Up Pending Review ---
    s7 = b.add_screen_frame("W07_Topup_Pending_Review", 6, base_row)
    b.add_header(s7, "Payment Under Review")
    b.add_node("ellipse", "Pending_Bg", s7, 155, 160, 80, 80, {"fill": AMBER_GOLD, "opacity": 0.2})
    b.add_text(s7, "⏱️", 180, 185, font_size=30)
    b.add_text(s7, "Bank Confirmation Pending", 20, 260, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s7, "Your bank has deducted the amount, but NPCI settlement is pending.", 30, 295, width=330, font_size=13, fill=TEXT_MUTED, align="center")
    
    b.add_card(s7, 360, 130)
    b.add_text(s7, "• Do NOT retry payment to avoid double charge.\n• Coins will be credited automatically within 15 mins.\n• If not settled, amount auto-reverses to your bank.", 36, 385, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s7, "View in History", 730, variant="secondary")

    # --- W08: Top-Up Failed or Cancelled ---
    s8 = b.add_screen_frame("W08_Topup_Failed_Cancelled", 7, base_row)
    b.add_header(s8, "Payment Failed")
    b.add_node("ellipse", "Failed_Bg", s8, 155, 160, 80, 80, {"fill": DANGER_RED, "opacity": 0.2})
    b.add_text(s8, "✕", 182, 180, font_size=36, font_style="Bold", fill=DANGER_RED)
    b.add_text(s8, "Payment Declined", 20, 260, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s8, "Bank server timed out or user cancelled UPI PIN entry.", 30, 295, width=330, font_size=13, fill=TEXT_MUTED, align="center")
    
    b.add_card(s8, 360, 90)
    b.add_text(s8, "🛡️ No money was deducted from your account. If deducted, your bank will reverse it in 2-4 business hours.", 36, 385, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s8, "Retry Payment (₹299)", 660, variant="primary")
    b.add_button(s8, "Back to Wallet", 725, variant="secondary")

    # --- W09: Transaction History ---
    s9 = b.add_screen_frame("W09_Transaction_History", 8, base_row)
    b.add_header(s9, "Transaction History", "All coin purchases & call spend")
    # Filter Tabs
    ftabs = [("All", True), ("Calls", False), ("Packs", False), ("Refunds", False)]
    for i, (tname, act) in enumerate(ftabs):
        tx = 20 + i * 88
        b.add_node("rectangle", f"TH_Tab_{i}", s9, tx, 105, 82, 30, {"fill": PRIMARY_PURPLE if act else BG_CARD, "cornerRadius": 15})
        b.add_text(s9, tname, tx + 10, 112, width=62, font_size=11, font_style="Bold", fill=TEXT_WHITE, align="center")

    hist = [
        ("Call with Priya (4m 15s)", "-106.25 Coins", "Today, 4:22 PM", DANGER_RED),
        ("Pack Recharge (300 + 50)", "+350.00 Coins", "Today, 4:18 PM", SUCCESS_GREEN),
        ("Call with Aarav (12m 30s)", "-375.00 Coins", "Yesterday", DANGER_RED),
        ("Escrow Release (Declined)", "+25.00 Coins", "14 Oct", SUCCESS_GREEN),
        ("Starter Pack Recharge", "+100.00 Coins", "12 Oct", SUCCESS_GREEN)
    ]
    for i, (desc, amt, date, col) in enumerate(hist):
        y = 150 + i * 72
        b.add_card(s9, y, 62)
        b.add_text(s9, desc, 36, y + 14, font_size=13, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s9, date, 36, y + 36, font_size=11, fill=TEXT_MUTED)
        b.add_text(s9, amt, 220, y + 20, width=135, font_size=13, font_style="Bold", fill=col, align="right")

    # --- W10: Transaction Detail ---
    s10 = b.add_screen_frame("W10_Transaction_Detail", 9, base_row)
    b.add_header(s10, "Transaction Details", "TXN-829104")
    b.add_card(s10, 120, 260, title="Recharge Ledger Entry")
    b.add_row(s10, 160, "Transaction Type", "Coin Pack Purchase")
    b.add_row(s10, 190, "Net Coins Added", "+350 Coins", val_color=SUCCESS_GREEN)
    b.add_row(s10, 220, "Gross Amount Paid", "₹299.00")
    b.add_row(s10, 250, "GST (18% inclusive)", "₹45.61")
    b.add_row(s10, 280, "Gateway Ref", "UPI/62910482019")
    b.add_row(s10, 310, "Status", "SETTLED", val_color=SUCCESS_GREEN)
    b.add_row(s10, 340, "Timestamp", "18 Oct 2026, 16:18:22")

    b.add_button(s10, "Download Tax Invoice", 660, variant="secondary")
    b.add_button(s10, "Report Billing Issue", 725, variant="secondary")

    # --- W11: Refund Tracking ---
    s11 = b.add_screen_frame("W11_Refund_Tracking", 10, base_row)
    b.add_header(s11, "Refund Status", "REF-3910")
    b.add_card(s11, 115, 80)
    b.add_text(s11, "Refund Amount: 25 Coins (₹25.00)", 36, 132, font_size=15, font_style="Bold", fill=SUCCESS_GREEN)
    b.add_text(s11, "Reason: Call dropped unexpectedly due to network error", 36, 158, font_size=11, fill=TEXT_MUTED)

    # 4-Step Stepper
    steps = [
        ("1. Refund Initiated", "Completed: 18 Oct, 16:25", True),
        ("2. System Approved", "Completed: 18 Oct, 16:26", True),
        ("3. Credited to Wallet", "Completed: 18 Oct, 16:26", True),
        ("4. Ledger Finalized", "Completed", True)
    ]
    for i, (stitle, sdate, done) in enumerate(steps):
        y = 220 + i * 85
        col = SUCCESS_GREEN if done else TEXT_MUTED
        b.add_node("ellipse", f"Step_{i}", s11, 36, y, 24, 24, {"fill": col})
        b.add_text(s11, "✓", 42, y + 4, font_size=12, fill=TEXT_WHITE)
        b.add_text(s11, stitle, 72, y + 2, font_size=14, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s11, sdate, 72, y + 22, font_size=11, fill=TEXT_MUTED)

    b.add_button(s11, "Back to Wallet", 730, variant="primary")

print("Suite W module defined.")
