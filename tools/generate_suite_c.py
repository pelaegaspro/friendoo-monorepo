import json
from screen_builder import (
    ScreenBuilder, BG_DARK, BG_CARD, BG_CARD_LIGHT, BG_SURFACE, CARD_BORDER,
    PRIMARY_PURPLE, PRIMARY_PINK, SUCCESS_GREEN, AMBER_GOLD, DANGER_RED,
    TEXT_WHITE, TEXT_MUTED, TEXT_FAINT, SCREEN_WIDTH, SCREEN_HEIGHT
)

def build_suite_c(b: ScreenBuilder, base_row=3):
    print("Building Section 4: User Call Lifecycle and Call Records (C01 - C18)...")

    # --- C01: Call Cost Confirmation ---
    s1 = b.add_screen_frame("C01_Call_Cost_Confirmation", 0, base_row)
    b.add_header(s1, "Call Confirmation", "Pre-call rate & hold check")
    b.add_card(s1, 110, 84)
    b.add_node("ellipse", "C01_Av", s1, 36, 124, 56, 56, {"fill": PRIMARY_PINK})
    b.add_text(s1, "Priya Sharma", 104, 126, font_size=16, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s1, "● Online Now", 104, 148, font_size=12, fill=SUCCESS_GREEN)
    b.add_node("rectangle", "C01_RatePill", s1, 246, 134, 110, 36, {"fill": PRIMARY_PURPLE, "cornerRadius": 18})
    b.add_text(s1, "⚡ 25 Coins/m", 258, 144, font_size=12, fill=TEXT_WHITE)

    b.add_card(s1, 210, 164, title="Economics")
    b.add_row(s1, 245, "Your Coin Balance", "🪙 120 Coins", val_color=AMBER_GOLD)
    b.add_row(s1, 275, "Max Duration", "~4.8 Mins", val_color=SUCCESS_GREEN)
    b.add_row(s1, 305, "Platform Fee", "FREE (Promo Active)", val_color=SUCCESS_GREEN)
    b.add_row(s1, 335, "Initial Reservation", "25 Coins (Min 1)")

    b.add_toggle_row(s1, 390, "Auto-End When Balance Hits 0", "Protects against sudden overdraft", active=True)
    b.add_button(s1, "Start Call (Hold 25 Coins)", 730, variant="primary")

    # --- C02: Insufficient Balance ---
    s2 = b.add_screen_frame("C02_Insufficient_Balance", 1, base_row)
    b.add_header(s2, "Insufficient Coins")
    b.add_node("ellipse", "C02_Warn", s2, 155, 160, 80, 80, {"fill": AMBER_GOLD, "opacity": 0.2})
    b.add_text(s2, "🪙", 178, 182, font_size=32)
    b.add_text(s2, "Need More Coins to Call", 20, 260, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s2, "Priya's rate is 25 coins/min. You currently have 8 coins.", 20, 295, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    
    b.add_card(s2, 350, 110, title="Shortfall Calculation")
    b.add_row(s2, 390, "Required for 1 min hold", "25 Coins")
    b.add_row(s2, 420, "Your current balance", "8 Coins")
    b.add_row(s2, 450, "Coins needed to start", "17 Coins", val_color=DANGER_RED)
    b.add_button(s2, "Recharge Coins Now", 660, variant="primary")
    b.add_button(s2, "Cancel", 725, variant="secondary")

    # --- C03: Request Sent & Reservation Held ---
    s3 = b.add_screen_frame("C03_Request_Sent_Held", 2, base_row)
    b.add_header(s3, "Connecting to Host", show_back=False)
    # Pulsing rings
    b.add_node("ellipse", "R3", s3, 115, 200, 160, 160, {"fill": PRIMARY_PURPLE, "opacity": 0.15})
    b.add_node("ellipse", "R2", s3, 135, 220, 120, 120, {"fill": PRIMARY_PURPLE, "opacity": 0.3})
    b.add_node("ellipse", "C03_Av", s3, 155, 240, 80, 80, {"fill": PRIMARY_PINK})
    b.add_text(s3, "Ringing Priya Sharma...", 20, 390, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s3, "🔒 25 Coins held in temporary escrow", 20, 420, width=350, font_size=13, fill=AMBER_GOLD, align="center")
    b.add_text(s3, "Auto-cancels if not answered in 00:24", 20, 450, width=350, font_size=12, fill=TEXT_MUTED, align="center")
    b.add_button(s3, "Cancel Request (Release Hold)", 730, variant="secondary")

    # --- C04: Request Declined ---
    s4 = b.add_screen_frame("C04_Request_Declined", 3, base_row)
    b.add_header(s4, "Call Unavailable")
    b.add_node("ellipse", "C04_Dec", s4, 155, 180, 80, 80, {"fill": DANGER_RED, "opacity": 0.2})
    b.add_text(s4, "📞", 180, 204, font_size=30)
    b.add_text(s4, "Host Is Currently Busy", 20, 280, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s4, "Priya declined or could not accept the call at this moment.", 20, 310, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_card(s4, 370, 75)
    b.add_text(s4, "✓ Your 25 coins hold has been released back to your wallet immediately.", 36, 398, width=318, font_size=12, fill=SUCCESS_GREEN)
    b.add_button(s4, "Try Another Host", 660, variant="primary")
    b.add_button(s4, "Return to Discovery", 725, variant="secondary")

    # --- C05: Request Timed Out ---
    s5 = b.add_screen_frame("C05_Request_Timed_Out", 4, base_row)
    b.add_header(s5, "Call Timed Out")
    b.add_node("ellipse", "C05_Time", s5, 155, 180, 80, 80, {"fill": AMBER_GOLD, "opacity": 0.2})
    b.add_text(s5, "⏱️", 180, 204, font_size=30)
    b.add_text(s5, "No Answer from Host", 20, 280, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s5, "Priya didn't pick up within 30 seconds.", 20, 310, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_card(s5, 370, 75)
    b.add_text(s5, "✓ 0 coins charged. 25 coins hold was automatically released.", 36, 398, width=318, font_size=12, fill=SUCCESS_GREEN)
    b.add_button(s5, "Call Again", 660, variant="primary")
    b.add_button(s5, "Browse Available Hosts", 725, variant="secondary")

    # --- C06: Request Cancelled ---
    s6 = b.add_screen_frame("C06_Request_Cancelled", 5, base_row)
    b.add_header(s6, "Call Cancelled")
    b.add_node("ellipse", "C06_Can", s6, 155, 180, 80, 80, {"fill": BG_CARD_LIGHT, "opacity": 0.5})
    b.add_text(s6, "🚫", 180, 204, font_size=30)
    b.add_text(s6, "You Cancelled the Request", 20, 280, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s6, "The request was terminated before connection.", 20, 310, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_card(s6, 370, 75)
    b.add_text(s6, "✓ 25 coins reservation released instantly.", 36, 398, width=318, font_size=12, fill=SUCCESS_GREEN)
    b.add_button(s6, "Return to Discovery", 730, variant="primary")

    # --- C07: Connecting (WebRTC Handshake) ---
    s7 = b.add_screen_frame("C07_Connecting", 6, base_row)
    b.add_header(s7, "Connecting Secure Audio", show_back=False)
    b.add_node("ellipse", "C07_Glow", s7, 145, 230, 100, 100, {"fill": SUCCESS_GREEN, "opacity": 0.2})
    b.add_text(s7, "🔐", 180, 264, font_size=30)
    b.add_text(s7, "Establishing WebRTC Channel...", 20, 360, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s7, "Negotiating secure P2P encryption keys", 20, 390, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_card(s7, 450, 85)
    b.add_text(s7, "• Direct encrypted audio channel\n• IP addresses masked via TURN relay\n• Billing timer starts when audio confirms", 36, 470, width=318, font_size=11, fill=TEXT_MUTED)
    b.add_button(s7, "End Safely", 730, variant="secondary")

    # --- C08: Microphone-Access Recovery ---
    s8 = b.add_screen_frame("C08_Microphone_Recovery", 7, base_row)
    b.add_header(s8, "Microphone Permission Required")
    b.add_node("ellipse", "C08_Mic", s8, 155, 180, 80, 80, {"fill": DANGER_RED, "opacity": 0.2})
    b.add_text(s8, "🎙️", 180, 204, font_size=30)
    b.add_text(s8, "Microphone Access Denied", 20, 280, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s8, "Friendoo needs mic access so the host can hear your voice.", 20, 310, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_button(s8, "Open Device Settings", 660, variant="primary")
    b.add_button(s8, "Cancel Call Request", 725, variant="secondary")

    # --- C09: Active Audio Call ---
    s9 = b.add_screen_frame("C09_Active_Audio_Call", 8, base_row)
    # Status
    b.add_text(s9, "🔒 End-to-End Encrypted", 20, 52, width=350, font_size=12, fill=SUCCESS_GREEN, align="center")
    # Avatar with glowing voice wave
    b.add_node("ellipse", "Wave_Ring", s9, 115, 110, 160, 160, {"fill": PRIMARY_PURPLE, "opacity": 0.2})
    b.add_node("ellipse", "C09_HostAv", s9, 135, 130, 120, 120, {"fill": PRIMARY_PINK})
    b.add_text(s9, "Priya Sharma", 20, 290, width=350, font_size=24, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s9, "03:42", 20, 325, width=350, font_size=22, font_style="Bold", fill=SUCCESS_GREEN, align="center")
    b.add_text(s9, "⚡ 25 Coins/m • Spent: 92.5 Coins", 20, 360, width=350, font_size=12, fill=AMBER_GOLD, align="center")

    # Animated Voice Waveform bars
    for i in range(16):
        h = [12, 28, 44, 20, 36, 52, 30, 16, 48, 38, 22, 40, 18, 30, 46, 14][i]
        b.add_node("rectangle", f"Wave_{i}", s9, 65 + i * 16, 460 - h // 2, 8, h, {"fill": PRIMARY_PINK, "cornerRadius": 4})

    # In-Call Action Controls (Mute, Speaker, Route, End)
    b.add_node("ellipse", "Btn_Mute", s9, 45, 620, 60, 60, {"fill": BG_CARD, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s9, "🎤", 63, 638, font_size=20)
    b.add_text(s9, "Mute", 45, 690, width=60, font_size=11, fill=TEXT_MUTED, align="center")

    b.add_node("ellipse", "Btn_Speaker", s9, 165, 620, 60, 60, {"fill": PRIMARY_PURPLE})
    b.add_text(s9, "🔊", 183, 638, font_size=20)
    b.add_text(s9, "Speaker", 165, 690, width=60, font_size=11, fill=TEXT_WHITE, align="center")

    b.add_node("ellipse", "Btn_End", s9, 285, 620, 60, 60, {"fill": DANGER_RED})
    b.add_text(s9, "📞", 303, 638, font_size=20)
    b.add_text(s9, "End Call", 285, 690, width=60, font_size=11, fill=DANGER_RED, align="center")

    # --- C10: Low-Balance Warning ---
    s10 = b.add_screen_frame("C10_Low_Balance_Warning", 9, base_row)
    b.add_text(s10, "Priya Sharma", 20, 80, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s10, "04:02", 20, 110, width=350, font_size=18, fill=SUCCESS_GREEN, align="center")
    # Floating Low Balance Sheet
    b.add_node("rectangle", "C10_Sheet", s10, 20, 220, 350, 300, {"fill": BG_CARD, "cornerRadius": 22, "stroke": AMBER_GOLD, "strokeWeight": 1.5})
    b.add_text(s10, "⚠️ Low Balance Warning", 40, 245, font_size=18, font_style="Bold", fill=AMBER_GOLD)
    b.add_text(s10, "Less than 1 minute of call time remains.", 40, 275, font_size=13, fill=TEXT_WHITE)
    b.add_text(s10, "Balance: 15 Coins • Rate: 25 Coins/m\nAuto-end safeguard will conclude the call safely once balance reaches 0.", 40, 305, width=310, font_size=12, fill=TEXT_MUTED)
    b.add_button(s10, "Quick Recharge (+100 Coins)", 390, variant="primary")
    b.add_button(s10, "Continue Until 0 Balance", 455, variant="secondary")

    # --- C11: Reconnecting and Restore ---
    s11 = b.add_screen_frame("C11_Reconnecting_Restore", 10, base_row)
    b.add_text(s11, "Priya Sharma", 20, 80, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_node("rectangle", "C11_Banner", s11, 20, 260, 350, 200, {"fill": BG_CARD, "cornerRadius": 20, "stroke": AMBER_GOLD, "strokeWeight": 1.5})
    b.add_text(s11, "📡 Network Unstable", 40, 285, font_size=18, font_style="Bold", fill=AMBER_GOLD)
    b.add_text(s11, "Reconnecting WebRTC media stream...\nBilling timer is paused during disconnection.", 40, 315, width=310, font_size=12, fill=TEXT_WHITE)
    b.add_text(s11, "Grace period: 00:14 remaining", 40, 365, font_size=13, font_style="Bold", fill=SUCCESS_GREEN)
    b.add_button(s11, "End Call Now & Settle", 730, variant="secondary")

    # --- C12: End-Call Confirmation ---
    s12 = b.add_screen_frame("C12_End_Call_Confirmation", 11, base_row)
    b.add_header(s12, "Confirm End Call")
    b.add_card(s12, 180, 220, title="End Conversation?")
    b.add_text(s12, "Are you sure you want to hang up now?", 36, 215, font_size=13, fill=TEXT_MUTED)
    b.add_row(s12, 255, "Current Duration", "04:15")
    b.add_row(s12, 285, "Estimated Cost", "106.25 Coins", val_color=AMBER_GOLD)
    b.add_row(s12, 315, "Remaining Balance", "13.75 Coins")
    b.add_button(s12, "Yes, End Call & Settle", 660, variant="danger")
    b.add_button(s12, "Resume Call", 725, variant="secondary")

    # --- C13: Ending and Settlement Progress ---
    s13 = b.add_screen_frame("C13_Ending_Settlement", 12, base_row)
    b.add_header(s13, "Settlement", show_back=False)
    b.add_node("ellipse", "Spin_Settle", s13, 145, 260, 100, 100, {"fill": BG_CARD, "stroke": PRIMARY_PURPLE, "strokeWeight": 4})
    b.add_text(s13, "🧾", 182, 294, font_size=28)
    b.add_text(s13, "Calculating Final Bill...", 20, 390, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s13, "Syncing authoritative duration with server ledger.", 20, 420, width=350, font_size=13, fill=TEXT_MUTED, align="center")

    # --- C14: Call Completed Receipt ---
    s14 = b.add_screen_frame("C14_Call_Receipt", 13, base_row)
    b.add_header(s14, "Call Summary & Receipt", show_back=False)
    b.add_node("ellipse", "C14_Av", s14, 155, 110, 80, 80, {"fill": PRIMARY_PINK})
    b.add_text(s14, "Call with Priya Sharma", 20, 200, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s14, "Connected for 04m 15s", 20, 226, width=350, font_size=13, fill=SUCCESS_GREEN, align="center")

    b.add_card(s14, 260, 230, title="Itemized Billing")
    b.add_row(s14, 300, "Base Rate", "25 Coins / min")
    b.add_row(s14, 330, "Exact Duration", "255 Seconds")
    b.add_row(s14, 360, "Platform Fee", "FREE (Promo)", val_color=SUCCESS_GREEN)
    b.add_row(s14, 390, "Total Coins Deducted", "106.25 Coins", val_color=DANGER_RED)
    b.add_row(s14, 420, "25-Coin Escrow Hold", "Released (+25.00)", val_color=SUCCESS_GREEN)
    b.add_row(s14, 450, "Updated Balance", "13.75 Coins", val_color=AMBER_GOLD)

    b.add_text(s14, "Rate your conversation with Priya:", 20, 520, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_text(s14, "⭐ ⭐ ⭐ ⭐ ⭐", 20, 545, width=350, font_size=24, fill=AMBER_GOLD, align="center")
    b.add_button(s14, "Done", 730, variant="primary")

    # --- C15: Call Failed — Reservation Released ---
    s15 = b.add_screen_frame("C15_Call_Failed_Released", 14, base_row)
    b.add_header(s15, "Call Terminated")
    b.add_node("ellipse", "C15_Icon", s15, 155, 180, 80, 80, {"fill": DANGER_RED, "opacity": 0.2})
    b.add_text(s15, "⚠️", 180, 204, font_size=30)
    b.add_text(s15, "Call Failed to Connect", 20, 280, width=350, font_size=20, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s15, "WebRTC media exchange failed before voice channel was opened.", 20, 310, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_card(s15, 370, 75)
    b.add_text(s15, "✓ 0 coins charged. 25-coin hold was released back to wallet.", 36, 398, width=318, font_size=12, fill=SUCCESS_GREEN)
    b.add_button(s15, "Try Calling Again", 660, variant="primary")
    b.add_button(s15, "Back to Discovery", 725, variant="secondary")

    # --- C16: Call Failed — Refund Pending ---
    s16 = b.add_screen_frame("C16_Call_Failed_Refund", 15, base_row)
    b.add_header(s16, "Unexpected Drop")
    b.add_node("ellipse", "C16_Icon", s16, 155, 180, 80, 80, {"fill": AMBER_GOLD, "opacity": 0.2})
    b.add_text(s16, "🔄", 180, 204, font_size=30)
    b.add_text(s16, "Call Dropped Unexpectedly", 20, 280, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s16, "We detected an unexpected disconnection during minute 1.", 20, 310, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_card(s16, 360, 100, title="Automatic Refund #REF-3910")
    b.add_text(s16, "25 Coins have been queued for automatic refund.\nSettlement estimated within 2 minutes.", 36, 395, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s16, "Track Refund Status", 730, variant="secondary")

    # --- C17: Call History ---
    s17 = b.add_screen_frame("C17_Call_History", 16, base_row)
    b.add_header(s17, "Call History", "Past voice sessions", show_back=False)
    chist = [
        ("Priya Sharma", "04m 15s • 106.25 Coins", "Today, 4:22 PM", PRIMARY_PINK, SUCCESS_GREEN),
        ("Aarav Mehta", "12m 30s • 375.00 Coins", "Yesterday", PRIMARY_PURPLE, SUCCESS_GREEN),
        ("Neha Gupta", "Declined (0 Coins)", "15 Oct", DANGER_RED, TEXT_MUTED),
        ("Priya Sharma", "08m 10s • 204.00 Coins", "12 Oct", PRIMARY_PINK, SUCCESS_GREEN)
    ]
    for i, (name, details, date, av_col, stat_col) in enumerate(chist):
        y = 120 + i * 85
        b.add_card(s17, y, 74)
        b.add_node("ellipse", f"CH_Av_{i}", s17, 34, y + 15, 44, 44, {"fill": av_col})
        b.add_text(s17, name, 88, y + 16, font_size=14, font_style="Bold", fill=TEXT_WHITE)
        b.add_text(s17, details, 88, y + 36, font_size=12, fill=stat_col)
        b.add_text(s17, date, 250, y + 16, width=105, font_size=11, fill=TEXT_MUTED, align="right")
    b.add_bottom_nav(s17, active="Calls")

    # --- C18: Call Detail & Post-Call Action ---
    s18 = b.add_screen_frame("C18_Call_Detail_Action", 17, base_row)
    b.add_header(s18, "Call Session Detail", "#CS-9182")
    b.add_card(s18, 120, 200, title="Session Info")
    b.add_row(s18, 155, "Host", "Priya Sharma")
    b.add_row(s18, 185, "Duration", "04m 15s")
    b.add_row(s18, 215, "Rate", "25 Coins/m")
    b.add_row(s18, 245, "Total Charged", "106.25 Coins", val_color=DANGER_RED)
    b.add_row(s18, 275, "Audio Quality", "HD Opus (32 kbps)", val_color=SUCCESS_GREEN)

    b.add_text(s18, "Post-Call Actions", 24, 350, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_button(s18, "Download Receipt", 380, variant="secondary")
    b.add_button(s18, "Report Call Quality Issue", 445, variant="secondary")
    b.add_button(s18, "Block or Report Host", 510, variant="secondary")

print("Suite C module defined.")

