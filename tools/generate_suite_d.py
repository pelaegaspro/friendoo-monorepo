import json
from screen_builder import (
    ScreenBuilder, BG_DARK, BG_CARD, BG_CARD_LIGHT, BG_SURFACE, CARD_BORDER,
    PRIMARY_PURPLE, PRIMARY_PINK, SUCCESS_GREEN, AMBER_GOLD, DANGER_RED,
    TEXT_WHITE, TEXT_MUTED, TEXT_FAINT, SCREEN_WIDTH, SCREEN_HEIGHT
)

def build_suite_d(b: ScreenBuilder, base_row=1):
    print("Building Section 2: Host Discovery, Trust, and Safety (D01 - D08)...")

    # --- D01: Host Discovery ---
    s1 = b.add_screen_frame("D01_Host_Discovery", 0, base_row)
    # Header with Coin Balance
    b.add_text(s1, "Friendoo", 24, 52, font_size=20, font_style="Bold", fill=TEXT_WHITE)
    b.add_node("rectangle", "Balance_Pill", s1, 260, 48, 110, 36, {"fill": BG_CARD, "cornerRadius": 18, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s1, "🪙 120 Coins", 272, 57, font_size=13, font_style="Bold", fill=AMBER_GOLD)
    
    # Filter Chips
    chips = [("🔥 All Hosts", True), ("🎧 Live Now", False), ("🗣️ Hindi", False), ("💬 Advice", False)]
    for i, (name, active) in enumerate(chips):
        cx = 20 + i * 88
        bg = PRIMARY_PURPLE if active else BG_CARD
        b.add_node("rectangle", f"Chip_{i}", s1, cx, 100, 82, 32, {"fill": bg, "cornerRadius": 16})
        b.add_text(s1, name, cx + 8, 108, font_size=11, font_style="Bold", fill=TEXT_WHITE)

    # 2-Column Host Cards
    hosts = [
        ("Priya Sharma", "Hindi, Eng", "25 c/m", "4.9 ⭐", PRIMARY_PINK, 0, 148),
        ("Aarav Mehta", "English", "30 c/m", "4.8 ⭐", PRIMARY_PURPLE, 1, 148),
        ("Neha Gupta", "Hindi", "20 c/m", "5.0 ⭐", SUCCESS_GREEN, 0, 345),
        ("Rohan Das", "Bengali, Eng", "25 c/m", "4.7 ⭐", AMBER_GOLD, 1, 345),
    ]
    for name, lang, rate, rating, color, col, y in hosts:
        x = 20 if col == 0 else 200
        b.add_node("rectangle", f"Host_{name}_Bg", s1, x, y, 170, 185, {"fill": BG_CARD, "cornerRadius": 18, "stroke": CARD_BORDER, "strokeWeight": 1})
        b.add_node("ellipse", f"Avatar_{name}", s1, x + 55, y + 16, 60, 60, {"fill": color})
        b.add_node("ellipse", f"Dot_{name}", s1, x + 98, y + 60, 14, 14, {"fill": SUCCESS_GREEN, "stroke": BG_CARD, "strokeWeight": 2})
        b.add_text(s1, name, x + 10, y + 84, width=150, font_size=14, font_style="Bold", fill=TEXT_WHITE, align="center")
        b.add_text(s1, lang, x + 10, y + 104, width=150, font_size=11, fill=TEXT_MUTED, align="center")
        b.add_text(s1, f"{rate} • {rating}", x + 10, y + 124, width=150, font_size=11, font_style="Bold", fill=AMBER_GOLD, align="center")
        # Call Button
        b.add_node("rectangle", f"Btn_{name}", s1, x + 20, y + 146, 130, 28, {"fill": PRIMARY_PURPLE, "cornerRadius": 14})
        b.add_text(s1, "Call Now", x + 20, y + 152, width=130, font_size=11, font_style="Bold", fill=TEXT_WHITE, align="center")

    b.add_bottom_nav(s1, active="Discover")

    # --- D02: Search Hosts ---
    s2 = b.add_screen_frame("D02_Search_Hosts", 1, base_row)
    b.add_header(s2, "Search Hosts", "Find by name, language or interest")
    # Search input
    b.add_node("rectangle", "Search_Bar", s2, 20, 105, 350, 48, {"fill": BG_CARD, "cornerRadius": 14, "stroke": PRIMARY_PURPLE, "strokeWeight": 1.5})
    b.add_text(s2, "🔍", 34, 119, font_size=16)
    b.add_text(s2, "Priya", 62, 119, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s2, "✕", 340, 119, font_size=14, fill=TEXT_MUTED)

    b.add_text(s2, "Recent Searches", 24, 175, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    recents = ["Priya Sharma", "English Practice", "Late Night Chat", "Hindi Advice"]
    for i, r in enumerate(recents):
        rx = 20 + (i % 2) * 180
        ry = 205 + (i // 2) * 44
        b.add_node("rectangle", f"Recent_{i}", s2, rx, ry, 170, 36, {"fill": BG_CARD, "cornerRadius": 10})
        b.add_text(s2, f"🕒 {r}", rx + 12, ry + 10, font_size=11, fill=TEXT_MUTED)

    b.add_text(s2, "Matching Hosts (1 Found)", 24, 320, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_card(s2, 350, 90)
    b.add_node("ellipse", "Search_Avatar", s2, 36, 365, 56, 56, {"fill": PRIMARY_PINK})
    b.add_text(s2, "Priya Sharma", 104, 368, font_size=15, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s2, "● Online Now • Hindi & English", 104, 390, font_size=12, fill=SUCCESS_GREEN)
    b.add_text(s2, "⚡ 25 Coins/m • 4.9 ⭐ (142 calls)", 104, 410, font_size=11, fill=AMBER_GOLD)

    # --- D03: Host Filters ---
    s3 = b.add_screen_frame("D03_Host_Filters", 2, base_row)
    b.add_header(s3, "Filter Hosts", "Customize matching preferences")
    b.add_text(s3, "Availability", 24, 115, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_toggle_row(s3, 140, "Online & Available Now", "Only show hosts ready to accept calls immediately", active=True)
    
    b.add_text(s3, "Spoken Languages", 24, 225, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    flangs = [("Hindi", True), ("English", True), ("Punjabi", False), ("Tamil", False)]
    for i, (l, sel) in enumerate(flangs):
        lx = 20 + (i % 2) * 180
        ly = 250 + (i // 2) * 46
        b.add_node("rectangle", f"FLang_{i}", s3, lx, ly, 170, 38, {"fill": PRIMARY_PURPLE if sel else BG_CARD, "cornerRadius": 10})
        b.add_text(s3, ("✓ " if sel else "") + l, lx + 16, ly + 11, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    b.add_text(s3, "Max Rate (Coins / Minute)", 24, 365, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    # Slider
    b.add_node("rectangle", "Slider_Track", s3, 20, 400, 350, 6, {"fill": BG_CARD_LIGHT, "cornerRadius": 3})
    b.add_node("rectangle", "Slider_Fill", s3, 20, 400, 210, 6, {"fill": PRIMARY_PURPLE, "cornerRadius": 3})
    b.add_node("ellipse", "Slider_Thumb", s3, 220, 393, 20, 20, {"fill": TEXT_WHITE})
    b.add_text(s3, "Up to 50 Coins/min", 20, 420, font_size=13, fill=AMBER_GOLD)

    b.add_button(s3, "Apply Filters (2 Active)", 710, variant="primary")

    # --- D04: Host Profile Detail ---
    s4 = b.add_screen_frame("D04_Host_Profile_Detail", 3, base_row)
    b.add_header(s4, "Host Profile", show_back=True)
    # Profile Card
    b.add_card(s4, 110, 160)
    b.add_node("ellipse", "D04_Avatar", s4, 40, 130, 80, 80, {"fill": PRIMARY_PINK})
    b.add_text(s4, "Priya Sharma", 136, 134, font_size=18, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s4, "● Live & Available", 136, 160, font_size=12, fill=SUCCESS_GREEN)
    b.add_text(s4, "⭐ 4.9 (142 reviews) • Top Rated", 136, 180, font_size=12, fill=AMBER_GOLD)
    b.add_text(s4, "⚡ 25 Coins / minute", 136, 202, font_size=13, font_style="Bold", fill=PRIMARY_PURPLE)

    # Audio Voice Greeting Preview
    b.add_node("rectangle", "Audio_Preview", s4, 20, 285, 350, 60, {"fill": BG_SURFACE, "cornerRadius": 14, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_node("ellipse", "Play_Btn", s4, 36, 297, 36, 36, {"fill": PRIMARY_PURPLE})
    b.add_text(s4, "▶", 48, 306, font_size=14, fill=TEXT_WHITE)
    b.add_text(s4, "Voice Greeting • 0:18", 86, 300, font_size=13, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s4, "|||| | |||||| | |||| ||||| | |||||", 86, 320, font_size=12, fill=PRIMARY_PINK)

    # Bio Card
    b.add_card(s4, 360, 150, title="About Me")
    b.add_text(s4, "Hey! I love chatting about movies, psychology, and day-to-day life. Fluent in Hindi and English. Here to listen whenever you need a friendly conversation!", 36, 396, width=318, font_size=12, fill=TEXT_MUTED)

    # Bottom Action
    b.add_button(s4, "Call Priya (25 Coins/min)", 730, variant="primary")

    # --- D05: Host Trust & Guidelines ---
    s5 = b.add_screen_frame("D05_Host_Trust_Guidelines", 4, base_row)
    b.add_header(s5, "Trust & Safety", "Caller code of conduct")
    b.add_node("ellipse", "Trust_Shield", s5, 160, 120, 70, 70, {"fill": SUCCESS_GREEN, "opacity": 0.2})
    b.add_text(s5, "🛡️", 180, 140, font_size=28)
    b.add_text(s5, "Safe & Respectful Calls", 20, 205, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    
    b.add_card(s5, 250, 90, title="1. Strictly 1-on-1 Voice")
    b.add_text(s5, "Calls are private conversations. Recording audio or broadcasting without permission is strictly banned.", 36, 282, width=318, font_size=12, fill=TEXT_MUTED)
    
    b.add_card(s5, 355, 90, title="2. Zero Tolerance for Abuse")
    b.add_text(s5, "Inappropriate language, harassment, or solicitation causes instant account suspension and forfeiture of balance.", 36, 387, width=318, font_size=12, fill=TEXT_MUTED)

    b.add_button(s5, "I Agree to Community Rules", 730, variant="primary")

    # --- D06: Availability & Call Terms ---
    s6 = b.add_screen_frame("D06_Availability_Call_Terms", 5, base_row)
    b.add_header(s6, "Call Terms & Schedule", "Priya Sharma")
    b.add_card(s6, 120, 170, title="Rate Breakdown")
    b.add_row(s6, 160, "Rate per minute", "25 Coins")
    b.add_row(s6, 190, "Billing increment", "Per Second")
    b.add_row(s6, 220, "Minimum hold reservation", "25 Coins (1 min)")
    b.add_row(s6, 250, "Platform fee", "FREE (Promo)", val_color=SUCCESS_GREEN)

    b.add_card(s6, 310, 130, title="Typical Schedule")
    b.add_text(s6, "• Weekdays: 6:00 PM – 11:30 PM IST\n• Weekends: 2:00 PM – 1:00 AM IST\n• Response time: Usually answers within 15s", 36, 345, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s6, "Proceed to Call", 730, variant="primary")

    # --- D07: Safety Action Centre ---
    s7 = b.add_screen_frame("D07_Safety_Action_Centre", 6, base_row)
    b.add_header(s7, "Safety Actions", "Priya Sharma")
    
    actions = [
        ("Report User / Host", "Submit a formal violation ticket to safety team", DANGER_RED),
        ("Block Host", "Prevent future calls and hide profile completely", DANGER_RED),
        ("Emergency Support", "Connect directly with Friendoo Trust team", AMBER_GOLD),
        ("Boundary Help", "Tips for managing conversations comfortably", PRIMARY_PURPLE)
    ]
    for i, (title, sub, col) in enumerate(actions):
        y = 120 + i * 85
        b.add_node("rectangle", f"Act_{i}", s7, 20, y, 350, 72, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
        b.add_text(s7, title, 36, y + 14, font_size=14, font_style="Bold", fill=col)
        b.add_text(s7, sub, 36, y + 38, font_size=11, fill=TEXT_MUTED)

    # --- D08: Report Submitted & Block Confirmation ---
    s8 = b.add_screen_frame("D08_Report_Block_Confirmation", 7, base_row)
    b.add_header(s8, "Action Completed")
    b.add_node("ellipse", "Success_Circle", s8, 155, 180, 80, 80, {"fill": SUCCESS_GREEN, "opacity": 0.2})
    b.add_text(s8, "✓", 182, 202, font_size=36, font_style="Bold", fill=SUCCESS_GREEN)
    b.add_text(s8, "Host Reported & Blocked", 20, 280, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s8, "Reference Ticket: #REP-84920", 20, 310, width=350, font_size=13, fill=AMBER_GOLD, align="center")
    
    b.add_card(s8, 350, 110)
    b.add_text(s8, "• Priya Sharma has been blocked permanently.\n• They can no longer see your profile or call you.\n• Our safety team reviews all reports within 2 hours.", 36, 370, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s8, "Return to Discovery", 500, variant="primary")

print("Suite D module defined.")

