import json
from screen_builder import (
    ScreenBuilder, BG_DARK, BG_CARD, BG_CARD_LIGHT, BG_SURFACE, CARD_BORDER,
    PRIMARY_PURPLE, PRIMARY_PINK, SUCCESS_GREEN, AMBER_GOLD, DANGER_RED,
    TEXT_WHITE, TEXT_MUTED, TEXT_FAINT, SCREEN_WIDTH, SCREEN_HEIGHT
)

def build_suite_p(b: ScreenBuilder, base_row=5):
    print("Building Section 6: Profile, Privacy, Security, and Support (P01 - P10)...")

    # --- P01: Profile & Account Hub ---
    s1 = b.add_screen_frame("P01_Profile_Account", 0, base_row)
    b.add_header(s1, "My Account", show_back=False)
    # Profile Card
    b.add_card(s1, 110, 110)
    b.add_node("ellipse", "P01_Av", s1, 36, 125, 60, 60, {"fill": BG_CARD_LIGHT})
    b.add_text(s1, "👤", 52, 140, font_size=24)
    b.add_text(s1, "Rahul Verma", 110, 130, font_size=18, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s1, "+91 98765 ••••• (Verified)", 110, 155, font_size=12, fill=SUCCESS_GREEN)
    b.add_text(s1, "🪙 120 Coins Available", 110, 175, font_size=12, fill=AMBER_GOLD)

    # Menu Links
    links = [
        ("👤 Edit Profile", "Name, interests, avatar"),
        ("🔔 Notification Settings", "Call alerts & balance warnings"),
        ("🔒 Privacy & Data Controls", "Phone masking & export data"),
        ("🚫 Blocked Accounts", "Manage 1 blocked host"),
        ("🛡️ Account Security", "Active devices & phone verification"),
        ("❓ Help & Support Center", "FAQs & direct chat support")
    ]
    for i, (title, sub) in enumerate(links):
        y = 240 + i * 72
        b.add_card(s1, y, 62)
        b.add_text(s1, title, 36, y + 12, font_size=14, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s1, sub, 36, y + 34, font_size=11, fill=TEXT_MUTED)
        b.add_text(s1, "›", 335, y + 20, font_size=16, fill=TEXT_MUTED)

    b.add_button(s1, "Log Out", 695, variant="secondary", height=44)
    b.add_bottom_nav(s1, active="Profile")

    # --- P02: Edit Profile ---
    s2 = b.add_screen_frame("P02_Edit_Profile", 1, base_row)
    b.add_header(s2, "Edit Profile", "Update your public display info")
    b.add_node("ellipse", "P02_Av", s2, 155, 120, 80, 80, {"fill": BG_CARD_LIGHT, "stroke": PRIMARY_PURPLE, "strokeWeight": 2})
    b.add_text(s2, "📷", 182, 148, font_size=24)
    b.add_text(s2, "Change Avatar", 20, 210, width=350, font_size=12, fill=PRIMARY_PINK, align="center")

    b.add_card(s2, 240, 80, title="Display Name")
    b.add_text(s2, "Rahul Verma", 36, 285, font_size=14, font_style="Bold", fill=TEXT_WHITE)

    b.add_card(s2, 335, 120, title="Spoken Languages")
    b.add_text(s2, "Hindi, English, Punjabi", 36, 375, font_size=13, fill=TEXT_WHITE)

    b.add_card(s2, 470, 100, title="About / Interests")
    b.add_text(s2, "Tech enthusiast, love conversations about travel and startup ideas.", 36, 505, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s2, "Save Profile Changes", 730, variant="primary")

    # --- P03: Notification Preferences ---
    s3 = b.add_screen_frame("P03_Notification_Preferences", 2, base_row)
    b.add_header(s3, "Notifications", "Control push reminders")
    b.add_toggle_row(s3, 120, "Incoming Call Alerts", "Sound & vibration when a host calls you back", active=True)
    b.add_toggle_row(s3, 195, "Low Coin Warning", "Notify when balance drops below 25 coins", active=True)
    b.add_toggle_row(s3, 270, "Host Back Online", "Alerts when favorite hosts become available", active=True)
    b.add_toggle_row(s3, 345, "Promotions & Discounts", "Occasional coin bonus offers and festive sales", active=False)
    b.add_button(s3, "Save Preferences", 730, variant="primary")

    # --- P04: Privacy & Data Controls ---
    s4 = b.add_screen_frame("P04_Privacy_Data_Controls", 3, base_row)
    b.add_header(s4, "Privacy & Data", "GDPR / DPDP compliance")
    b.add_card(s4, 120, 110, title="Caller Anonymity")
    b.add_text(s4, "✓ Phone number masking is ALWAYS ON.\n✓ Hosts never see your legal identity or phone.\n✓ Peer-to-peer WebRTC audio is never tapped.", 36, 155, width=318, font_size=12, fill=SUCCESS_GREEN)

    b.add_card(s4, 250, 140, title="Data Ownership")
    b.add_button(s4, "Download My Full Data Archive", 295, variant="secondary", height=42)
    b.add_button(s4, "Request Complete Account Deletion", 345, variant="danger", height=42)

    # --- P05: Blocked Accounts ---
    s5 = b.add_screen_frame("P05_Blocked_Accounts", 4, base_row)
    b.add_header(s5, "Blocked Accounts", "1 Blocked Host")
    b.add_card(s5, 120, 85)
    b.add_node("ellipse", "B_Av", s5, 36, 135, 50, 50, {"fill": DANGER_RED, "opacity": 0.3})
    b.add_text(s5, "🚫", 50, 148, font_size=18)
    b.add_text(s5, "Priya Sharma (Host)", 96, 138, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s5, "Blocked on 18 Oct 2026", 96, 160, font_size=11, fill=TEXT_MUTED)
    b.add_node("rectangle", "Btn_Unblock", s5, 270, 145, 80, 32, {"fill": BG_CARD_LIGHT, "cornerRadius": 8, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s5, "Unblock", 285, 153, font_size=12, fill=TEXT_WHITE)

    b.add_text(s5, "Blocked hosts cannot view your profile or connect calls with you.", 20, 225, width=350, font_size=12, fill=TEXT_FAINT, align="center")

    # --- P06: Account Security ---
    s6 = b.add_screen_frame("P06_Account_Security", 5, base_row)
    b.add_header(s6, "Account Security", "Login sessions & safety")
    b.add_card(s6, 120, 95, title="Registered Phone")
    b.add_text(s6, "+91 98765 43210 (Verified via SMS)", 36, 155, font_size=13, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s6, "Change Phone Number ›", 36, 178, font_size=12, fill=PRIMARY_PURPLE)

    b.add_text(s6, "Active Login Sessions", 24, 235, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    sessions = [
        ("📱 Pixel 8 (Android 15)", "Active Now • Current Session", SUCCESS_GREEN),
        ("💻 Windows 11 (Edge Browser)", "Active 2 hours ago", TEXT_MUTED)
    ]
    for i, (device, sub, col) in enumerate(sessions):
        y = 265 + i * 72
        b.add_card(s6, y, 62)
        b.add_text(s6, device, 36, y + 14, font_size=13, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s6, sub, 36, y + 36, font_size=11, fill=col)

    b.add_button(s6, "Sign Out From All Other Devices", 730, variant="secondary")

    # --- P07: Help Centre ---
    s7 = b.add_screen_frame("P07_Help_Centre", 6, base_row)
    b.add_header(s7, "Help & FAQ", "Search knowledge base")
    # Search bar
    b.add_node("rectangle", "FAQ_Search", s7, 20, 110, 350, 46, {"fill": BG_CARD, "cornerRadius": 12, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s7, "🔍 Search questions...", 36, 124, font_size=13, fill=TEXT_MUTED)

    cats = [
        ("📞 Calling & Audio Quality", "Echo, low volume, WebRTC drops"),
        ("🪙 Coins & Wallet Billing", "Failed recharges, refunds, rates"),
        ("🛡️ Safety, Blocking & Reporting", "Community rules and reporting"),
        ("💼 Host Onboarding & Payouts", "KYC, earnings, weekly bank transfers")
    ]
    for i, (title, sub) in enumerate(cats):
        y = 175 + i * 78
        b.add_card(s7, y, 68)
        b.add_text(s7, title, 36, y + 14, font_size=14, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s7, sub, 36, y + 38, font_size=11, fill=TEXT_MUTED)
    b.add_button(s7, "Contact Live Support", 730, variant="primary")

    # --- P08: Contact Support ---
    s8 = b.add_screen_frame("P08_Contact_Support", 7, base_row)
    b.add_header(s8, "New Support Ticket", "Direct help from Friendoo team")
    b.add_card(s8, 120, 80, title="Issue Category")
    b.add_text(s8, "🪙 Wallet & Billing Issues ›", 36, 155, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    b.add_card(s8, 215, 80, title="Related Transaction / Call (Optional)")
    b.add_text(s8, "TXN-829104 (₹299 Pack Recharge) ›", 36, 250, font_size=13, fill=AMBER_GOLD)

    b.add_card(s8, 310, 150, title="Message Description")
    b.add_text(s8, "Please describe the problem you encountered...", 36, 345, font_size=12, fill=TEXT_FAINT)
    b.add_button(s8, "Submit Support Ticket", 730, variant="primary")

    # --- P09: Support Ticket List ---
    s9 = b.add_screen_frame("P09_Support_Ticket_List", 8, base_row)
    b.add_header(s9, "My Support Tickets", "Open & resolved tickets")
    tickets = [
        ("Ticket #TK-8492", "Call dropped but 25 coins held", "IN REVIEW", AMBER_GOLD, "Updated 10m ago"),
        ("Ticket #TK-7102", "UPI payment timed out", "RESOLVED", SUCCESS_GREEN, "Closed yesterday"),
        ("Ticket #TK-6204", "Microphone permission help", "RESOLVED", SUCCESS_GREEN, "05 Oct 2026")
    ]
    for i, (tid, desc, st, col, upd) in enumerate(tickets):
        y = 120 + i * 95
        b.add_card(s9, y, 82)
        b.add_text(s9, tid, 36, y + 14, font_size=14, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s9, desc, 36, y + 36, font_size=12, fill=TEXT_MUTED)
        b.add_text(s9, st, 260, y + 14, font_size=11, font_style="Bold", fill=col)
        b.add_text(s9, upd, 36, y + 56, font_size=10, fill=TEXT_FAINT)
    b.add_button(s9, "+ Create New Ticket", 730, variant="primary")

    # --- P10: Support Ticket Detail ---
    s10 = b.add_screen_frame("P10_Support_Ticket_Detail", 9, base_row)
    b.add_header(s10, "Ticket #TK-8492", "Status: IN REVIEW")
    # Customer message bubble
    b.add_node("rectangle", "Msg_User", s10, 70, 120, 300, 80, {"fill": PRIMARY_PURPLE, "cornerRadius": 16})
    b.add_text(s10, "I was on a call with Priya Sharma, and the call dropped suddenly. 25 coins were held from my wallet.", 84, 134, width=272, font_size=12, fill=TEXT_WHITE)
    b.add_text(s10, "You • 16:24", 295, 204, font_size=10, fill=TEXT_MUTED)

    # Agent reply bubble
    b.add_node("rectangle", "Msg_Agent", s10, 20, 230, 300, 95, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s10, "Friendoo Support (Amit)", 36, 242, font_size=12, font_style="Bold", fill=SUCCESS_GREEN)
    b.add_text(s10, "Hello Rahul! We checked our WebRTC relay logs and confirmed the unexpected drop. We've initiated a 25-coin refund.", 36, 264, width=270, font_size=12, fill=TEXT_WHITE)
    b.add_text(s10, "Amit • 16:32", 36, 330, font_size=10, fill=TEXT_MUTED)

    # Input bar
    b.add_node("rectangle", "Reply_Bar", s10, 20, 730, 280, 50, {"fill": BG_CARD, "cornerRadius": 14, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s10, "Type your reply...", 36, 746, font_size=13, fill=TEXT_MUTED)
    b.add_node("rectangle", "Btn_Send", s10, 310, 730, 60, 50, {"fill": PRIMARY_PURPLE, "cornerRadius": 14})
    b.add_text(s10, "➤", 332, 745, font_size=16, fill=TEXT_WHITE)

print("Suite P module defined.")

