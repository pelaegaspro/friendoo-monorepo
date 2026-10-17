import json
import os
import subprocess
import sys

def main():
    print("==================================================")
    print("Generating Friendoo Mobile App Screens in FigCraft...")
    print("==================================================")

    output_dir = r"d:\AllBackup\friendoo\design"
    renders_dir = os.path.join(output_dir, "renders")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(renders_dir, exist_ok=True)

    figcraft_cli = r"C:\Program Files\FigCraft\figcraft-cli.exe"
    if not os.path.exists(figcraft_cli):
        print(f"Error: FigCraft CLI not found at {figcraft_cli}")
        sys.exit(1)

    commands = [
        {"command": "file.new", "params": {}},
    ]

    # Deterministic Node ID tracker (Starts at 2 because Page 1 is id: 1)
    current_node_id = 2

    # Theme Colors
    BG_DARK = "#0D0F18"
    BG_DARK_ALT = "#121524"
    BG_CARD = "#191C2E"
    BG_CARD_LIGHT = "#21263F"
    CARD_BORDER = "#2A2E4B"
    PRIMARY_PINK = "#FF2A85"
    ACCENT_INDIGO = "#6366F1"
    ACCENT_PURPLE = "#8B5CF6"
    SUCCESS_EMERALD = "#10B981"
    DANGER_RED = "#EF4444"
    TEXT_WHITE = "#FFFFFF"
    TEXT_MUTED = "#94A3B8"
    TEXT_FAINT = "#64748B"
    GOLD_COIN = "#F59E0B"

    SCREEN_WIDTH = 390
    SCREEN_HEIGHT = 844
    SCREEN_GAP = 60

    def add_node(cmd_type, name, parent_id, x, y, width, height, props=None):
        nonlocal current_node_id
        node_id = current_node_id
        current_node_id += 1
        commands.append({
            "command": "node.create",
            "params": {
                "type": cmd_type,
                "name": name,
                "parent": parent_id,
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "props": props or {}
            }
        })
        return node_id

    def add_text(parent_id, text, x, y, width=None, font_size=14, font_style="Regular", fill=TEXT_WHITE, align="left"):
        nonlocal current_node_id
        node_id = current_node_id
        current_node_id += 1
        params = {
            "parent": parent_id,
            "text": text,
            "x": x,
            "y": y,
            "props": {
                "fontSize": font_size,
                "fontStyle": font_style,
                "fill": fill,
                "textAlign": align
            }
        }
        if width:
            params["width"] = width
        commands.append({
            "command": "text.create",
            "params": params
        })
        return node_id

    def add_frame(name, x, y, fill_color=BG_DARK):
        nonlocal current_node_id
        frame_id = current_node_id
        current_node_id += 1
        commands.append({
            "command": "frame.create",
            "params": {
                "name": name,
                "x": x,
                "y": y,
                "width": SCREEN_WIDTH,
                "height": SCREEN_HEIGHT,
                "props": {"fill": fill_color, "cornerRadius": 44, "clip": True}
            }
        })
        return frame_id

    def add_status_bar(frame_id):
        add_text(frame_id, "9:41", 28, 14, font_size=15, font_style="Bold", fill=TEXT_WHITE)
        add_text(frame_id, "5G  􀛨  􀛩", 305, 14, font_size=14, fill=TEXT_WHITE)

    def add_bottom_nav(frame_id, active="Discover"):
        add_node("rectangle", "Bottom Nav Bar", frame_id, 0, 764, SCREEN_WIDTH, 80, {
            "fill": "#0F111E",
            "stroke": CARD_BORDER,
            "strokeWeight": 1
        })
        tabs = [
            ("Discover", "🔥", 28),
            ("Calls", "📞", 125),
            ("Wallet", "🪙", 222),
            ("Profile", "👤", 319),
        ]
        for name, icon, x_pos in tabs:
            is_active = (name == active)
            color = PRIMARY_PINK if is_active else TEXT_MUTED
            weight = "Bold" if is_active else "Regular"
            add_text(frame_id, f"{icon}\n{name}", x_pos, 776, font_size=11, font_style=weight, fill=color, align="center")

    # =========================================================================
    # 1. SCREEN: A02 - Welcome & Privacy Entry
    # =========================================================================
    f1 = add_frame("A02_Welcome_Entry", 0, 0, BG_DARK)
    add_status_bar(f1)
    add_node("ellipse", "Ambient Glow", f1, 75, 130, 240, 240, {"fill": ACCENT_INDIGO, "opacity": 0.22})
    add_node("rectangle", "Logo Box", f1, 155, 160, 80, 80, {"fill": PRIMARY_PINK, "cornerRadius": 24})
    add_text(f1, "🎙️", 177, 182, font_size=36)
    add_text(f1, "Friendoo", 125, 260, font_size=34, font_style="Bold", fill=TEXT_WHITE)
    add_text(f1, "Real Conversations.\nAbsolute Privacy.", 30, 335, width=330, font_size=28, font_style="Bold", fill=TEXT_WHITE, align="center")
    add_text(f1, "Connect 1-on-1 with verified audio hosts across India.\nNo phone numbers shared. 100% anonymous.", 36, 420, width=318, font_size=14, fill=TEXT_MUTED, align="center")

    add_node("rectangle", "Pill 1", f1, 30, 500, 330, 52, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f1, "🔒  Personal numbers never shared", 50, 517, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    add_node("rectangle", "Pill 2", f1, 30, 564, 330, 52, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f1, "⚡  Carrier-grade WebRTC zero latency", 50, 581, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    add_node("rectangle", "Pill 3", f1, 30, 628, 330, 52, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f1, "🎁  First 5 minutes completely free", 50, 645, font_size=13, font_style="Bold", fill=SUCCESS_EMERALD)

    add_node("rectangle", "CTA Button", f1, 28, 710, 334, 56, {"fill": PRIMARY_PINK, "cornerRadius": 28})
    add_text(f1, "Continue with Phone  →", 95, 728, font_size=16, font_style="Bold", fill=TEXT_WHITE)
    add_text(f1, "By continuing you agree to Terms & Privacy Policy.", 25, 785, width=340, font_size=11, fill=TEXT_FAINT, align="center")

    # =========================================================================
    # 2. SCREEN: A04 - OTP Verification & Keypad
    # =========================================================================
    s2_x = SCREEN_WIDTH + SCREEN_GAP
    f2 = add_frame("A04_OTP_Verification", s2_x, 0, BG_DARK)
    add_status_bar(f2)
    add_text(f2, "←", 28, 56, font_size=24, font_style="Bold", fill=TEXT_WHITE)
    add_text(f2, "Step 2 of 3", 295, 62, font_size=13, fill=TEXT_MUTED)
    add_text(f2, "Verify your phone", 28, 110, font_size=28, font_style="Bold", fill=TEXT_WHITE)
    add_text(f2, "We sent a 6-digit verification code to\n+91 98765 43210  (Edit)", 28, 155, width=334, font_size=14, fill=TEXT_MUTED)

    # 6 OTP Digits
    digits = ["5", "8", "2", "•", "•", "•"]
    for i, d in enumerate(digits):
        box_x = 28 + (i * 56)
        is_active = (i == 3)
        stroke_color = PRIMARY_PINK if is_active else CARD_BORDER
        fill_color = BG_CARD_LIGHT if is_active else BG_CARD
        add_node("rectangle", f"OTP_Box_{i}", f2, box_x, 225, 48, 58, {"fill": fill_color, "cornerRadius": 14, "stroke": stroke_color, "strokeWeight": 1.5 if is_active else 1})
        add_text(f2, d, box_x + 18, 240, font_size=22, font_style="Bold", fill=TEXT_WHITE if d != "•" else TEXT_FAINT)

    add_text(f2, "Resend code in 00:42", 28, 310, font_size=13, fill=TEXT_MUTED)
    add_text(f2, "Need help? Contact support", 28, 335, font_size=12, fill=ACCENT_INDIGO)

    # Numeric Keypad
    keys = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["*", "0", "⌫"]
    ]
    key_y = 440
    for row in keys:
        for col_idx, key in enumerate(row):
            kx = 45 + (col_idx * 105)
            add_node("rectangle", f"Key_{key}", f2, kx, key_y, 90, 56, {"fill": BG_CARD, "cornerRadius": 16})
            add_text(f2, key, kx + 36, key_y + 16, font_size=20, font_style="Bold", fill=TEXT_WHITE)
        key_y += 68

    add_node("rectangle", "Verify CTA", f2, 28, 735, 334, 54, {"fill": PRIMARY_PINK, "cornerRadius": 27})
    add_text(f2, "Verify & Enter Friendoo", 102, 752, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    # =========================================================================
    # 3. SCREEN: D01 - Discover Verified Hosts
    # =========================================================================
    s3_x = (SCREEN_WIDTH + SCREEN_GAP) * 2
    f3 = add_frame("D01_Discover_Hosts", s3_x, 0, BG_DARK)
    add_status_bar(f3)

    # Header Bar
    add_text(f3, "Friendoo", 24, 56, font_size=24, font_style="Bold", fill=PRIMARY_PINK)
    # Coin pill
    add_node("rectangle", "Coin Pill", f3, 245, 54, 115, 36, {"fill": BG_CARD, "cornerRadius": 18, "stroke": GOLD_COIN, "strokeWeight": 1})
    add_text(f3, "🪙 240  +", 260, 63, font_size=13, font_style="Bold", fill=GOLD_COIN)

    # Promo Banner
    add_node("rectangle", "Promo Banner", f3, 24, 106, 342, 85, {"fill": ACCENT_INDIGO, "cornerRadius": 18})
    add_text(f3, "🎉 First 5 Minutes Free!", 42, 122, font_size=16, font_style="Bold", fill=TEXT_WHITE)
    add_text(f3, "Try voice lounge calling with no upfront charges.", 42, 148, font_size=12, fill="#E0E7FF")

    # Filter Chips
    chips = ["🔥 All", "Tamil", "Telugu", "Hindi", "English", "Star ⭐"]
    cx = 24
    for i, chip in enumerate(chips):
        is_sel = (i == 0)
        c_fill = PRIMARY_PINK if is_sel else BG_CARD
        c_color = TEXT_WHITE if is_sel else TEXT_MUTED
        w = 58 if len(chip) <= 5 else 75
        add_node("rectangle", f"Chip_{i}", f3, cx, 205, w, 34, {"fill": c_fill, "cornerRadius": 17, "stroke": CARD_BORDER, "strokeWeight": 1})
        add_text(f3, chip, cx + 12, 214, font_size=12, font_style="Bold" if is_sel else "Regular", fill=c_color)
        cx += w + 8

    # Host Card 1: Sara
    add_node("rectangle", "Host Card 1", f3, 24, 255, 342, 150, {"fill": BG_CARD, "cornerRadius": 20, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_node("ellipse", "Avatar 1", f3, 40, 275, 60, 60, {"fill": ACCENT_PURPLE})
    add_text(f3, "👩", 56, 290, font_size=28)
    add_node("ellipse", "Online Dot 1", f3, 86, 321, 14, 14, {"fill": SUCCESS_EMERALD, "stroke": BG_CARD, "strokeWeight": 2})
    add_text(f3, "Sara, 23", 114, 275, font_size=17, font_style="Bold", fill=TEXT_WHITE)
    add_text(f3, "⭐ 4.9 (1.2k calls) • Tamil Nadu", 114, 298, font_size=12, fill=TEXT_MUTED)
    add_text(f3, "Tamil • English • Telugu", 114, 318, font_size=11, fill="#818CF8")
    add_text(f3, "₹5 / min", 42, 358, font_size=15, font_style="Bold", fill=GOLD_COIN)
    # Audio Preview Button
    add_node("rectangle", "Voice Sample 1", f3, 114, 350, 130, 36, {"fill": BG_CARD_LIGHT, "cornerRadius": 18})
    add_text(f3, "▶  Voice Intro 0:15", 126, 360, font_size=11, fill=TEXT_WHITE)
    # Call CTA
    add_node("rectangle", "Call Btn 1", f3, 260, 350, 92, 36, {"fill": PRIMARY_PINK, "cornerRadius": 18})
    add_text(f3, "📞 Call", 282, 360, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    # Host Card 2: Ananya
    add_node("rectangle", "Host Card 2", f3, 24, 420, 342, 150, {"fill": BG_CARD, "cornerRadius": 20, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_node("ellipse", "Avatar 2", f3, 40, 440, 60, 60, {"fill": PRIMARY_PINK})
    add_text(f3, "👱‍♀️", 56, 455, font_size=28)
    add_node("ellipse", "Online Dot 2", f3, 86, 486, 14, 14, {"fill": SUCCESS_EMERALD, "stroke": BG_CARD, "strokeWeight": 2})
    add_text(f3, "Ananya, 25", 114, 440, font_size=17, font_style="Bold", fill=TEXT_WHITE)
    add_text(f3, "⭐ 4.8 (850 calls) • Karnataka", 114, 463, font_size=12, fill=TEXT_MUTED)
    add_text(f3, "Kannada • Hindi • English", 114, 483, font_size=11, fill="#818CF8")
    add_text(f3, "₹5 / min", 42, 523, font_size=15, font_style="Bold", fill=GOLD_COIN)
    add_node("rectangle", "Voice Sample 2", f3, 114, 515, 130, 36, {"fill": BG_CARD_LIGHT, "cornerRadius": 18})
    add_text(f3, "▶  Voice Intro 0:20", 126, 525, font_size=11, fill=TEXT_WHITE)
    add_node("rectangle", "Call Btn 2", f3, 260, 515, 92, 36, {"fill": PRIMARY_PINK, "cornerRadius": 18})
    add_text(f3, "📞 Call", 282, 525, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    # Host Card 3: Deepa (Night Owl)
    add_node("rectangle", "Host Card 3", f3, 24, 585, 342, 150, {"fill": BG_CARD, "cornerRadius": 20, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_node("ellipse", "Avatar 3", f3, 40, 605, 60, 60, {"fill": ACCENT_INDIGO})
    add_text(f3, "👩‍🦰", 56, 620, font_size=28)
    add_node("ellipse", "Online Dot 3", f3, 86, 651, 14, 14, {"fill": SUCCESS_EMERALD, "stroke": BG_CARD, "strokeWeight": 2})
    add_text(f3, "Deepa, 24", 114, 605, font_size=17, font_style="Bold", fill=TEXT_WHITE)
    add_text(f3, "⭐ 5.0 (2.1k calls) • Kerala", 114, 628, font_size=12, fill=TEXT_MUTED)
    add_text(f3, "Malayalam • Tamil • English", 114, 648, font_size=11, fill="#818CF8")
    add_text(f3, "₹5 / min", 42, 688, font_size=15, font_style="Bold", fill=GOLD_COIN)
    add_node("rectangle", "Call Btn 3", f3, 260, 680, 92, 36, {"fill": PRIMARY_PINK, "cornerRadius": 18})
    add_text(f3, "📞 Call", 282, 690, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    add_bottom_nav(f3, active="Discover")

    # =========================================================================
    # 4. SCREEN: D04 - Host Profile & Voice Sample
    # =========================================================================
    s4_x = (SCREEN_WIDTH + SCREEN_GAP) * 3
    f4 = add_frame("D04_Host_Profile", s4_x, 0, BG_DARK)
    add_status_bar(f4)
    # Header Nav
    add_text(f4, "←", 24, 56, font_size=24, font_style="Bold", fill=TEXT_WHITE)
    add_text(f4, "Host Profile", 140, 58, font_size=17, font_style="Bold", fill=TEXT_WHITE)
    add_text(f4, "⋮", 345, 56, font_size=24, fill=TEXT_MUTED)

    # Center Avatar with verified ring
    add_node("ellipse", "Profile Glow", f4, 125, 105, 140, 140, {"fill": PRIMARY_PINK, "opacity": 0.25})
    add_node("ellipse", "Avatar Big", f4, 135, 115, 120, 120, {"fill": ACCENT_PURPLE, "stroke": PRIMARY_PINK, "strokeWeight": 3})
    add_text(f4, "👩", 172, 148, font_size=50)
    add_text(f4, "Sara", 172, 252, font_size=24, font_style="Bold", fill=TEXT_WHITE)
    add_text(f4, "🟢 Available Now • Tamil Nadu", 115, 282, font_size=13, fill=SUCCESS_EMERALD)

    # Stats Row
    add_node("rectangle", "Stats Box", f4, 24, 315, 342, 68, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f4, "4.9 ⭐\n1.2k Reviews", 45, 330, font_size=13, font_style="Bold", fill=TEXT_WHITE, align="center")
    add_text(f4, "₹5 / min\nStandard Rate", 160, 330, font_size=13, font_style="Bold", fill=GOLD_COIN, align="center")
    add_text(f4, "10k+ Mins\nTotal Talks", 280, 330, font_size=13, font_style="Bold", fill=TEXT_WHITE, align="center")

    # Voice Sample Player Card
    add_node("rectangle", "Player Box", f4, 24, 400, 342, 85, {"fill": BG_CARD, "cornerRadius": 18, "stroke": PRIMARY_PINK, "strokeWeight": 1})
    add_node("ellipse", "Play Circle", f4, 40, 420, 45, 45, {"fill": PRIMARY_PINK})
    add_text(f4, "▶", 56, 432, font_size=18, font_style="Bold", fill=TEXT_WHITE)
    add_text(f4, "Listen to my voice introduction", 100, 422, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    add_text(f4, "ılıll|̲̅̅●̲̅̅|̲̅̅=̲̅̅|̲̅̅●̲̅̅|llılı  0:24 / 0:30", 100, 448, font_size=13, fill="#818CF8")

    # Bio Section
    add_node("rectangle", "Bio Box", f4, 24, 502, 342, 130, {"fill": BG_CARD, "cornerRadius": 18, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f4, "About Me", 42, 518, font_size=15, font_style="Bold", fill=TEXT_WHITE)
    add_text(f4, "Hey there! I love listening to your day, talking about travel, movies, and late-night life chats. Friendly, respectful, and always here to listen when you need someone to talk to.", 42, 542, width=306, font_size=12, fill=TEXT_MUTED)

    # Trust Pledge
    add_node("rectangle", "Trust Box", f4, 24, 648, 342, 60, {"fill": "#141A29", "cornerRadius": 16, "stroke": "#1E293B", "strokeWeight": 1})
    add_text(f4, "🛡️  100% Private Call Guarantee", 42, 660, font_size=13, font_style="Bold", fill=SUCCESS_EMERALD)
    add_text(f4, "Neither your phone number nor identity are ever shared.", 42, 680, font_size=11, fill=TEXT_MUTED)

    # Sticky Floating Call Bar
    add_node("rectangle", "Call Bar Bottom", f4, 0, 730, SCREEN_WIDTH, 114, {"fill": "#0A0C14", "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f4, "Your Balance: 240 Coins (48 mins available)", 28, 742, font_size=12, fill=GOLD_COIN)
    add_node("rectangle", "Start Call CTA", f4, 24, 764, 342, 52, {"fill": PRIMARY_PINK, "cornerRadius": 26})
    add_text(f4, "📞  Start Voice Call (5 coins/min)", 82, 780, font_size=15, font_style="Bold", fill=TEXT_WHITE)

    # =========================================================================
    # 5. SCREEN: C09 - Live Voice Call & Bi-Directional Mute
    # =========================================================================
    s5_x = (SCREEN_WIDTH + SCREEN_GAP) * 4
    f5 = add_frame("C09_Live_Voice_Call", s5_x, 0, "#080A12")
    add_status_bar(f5)

    # Top Brand Header & Menu
    add_text(f5, "Friendoo Voice Lounge", 28, 56, font_size=18, font_style="Bold", fill=PRIMARY_PINK)
    add_node("ellipse", "Options Icon", f5, 335, 54, 32, 32, {"fill": BG_CARD})
    add_text(f5, "⌄", 346, 58, font_size=18, fill=TEXT_WHITE)

    # Top Floating Toast Notification (User request: opposite party mute notification)
    add_node("rectangle", "Mute Toast", f5, 30, 98, 330, 44, {"fill": DANGER_RED, "cornerRadius": 22})
    add_text(f5, "🎙️ Host (Sara) has muted her microphone", 52, 112, font_size=13, font_style="Bold", fill=TEXT_WHITE)

    # Center Prominent Avatar Stack
    add_node("ellipse", "Call Ambient Ring 1", f5, 95, 185, 200, 200, {"fill": PRIMARY_PINK, "opacity": 0.20})
    add_node("ellipse", "Call Ambient Ring 2", f5, 115, 205, 160, 160, {"fill": ACCENT_INDIGO, "opacity": 0.35})
    add_node("ellipse", "Call Avatar", f5, 125, 215, 140, 140, {"fill": ACCENT_PURPLE, "stroke": PRIMARY_PINK, "strokeWeight": 4})
    add_text(f5, "👩", 168, 252, font_size=60)

    # Avatar Red Mute Badge (User request!)
    add_node("rectangle", "Mute Badge", f5, 138, 335, 114, 30, {"fill": DANGER_RED, "cornerRadius": 15})
    add_text(f5, "🔇 Host Muted", 152, 342, font_size=12, font_style="Bold", fill=TEXT_WHITE)

    # Host Name & Call Rate
    add_text(f5, "Sara", 172, 395, font_size=26, font_style="Bold", fill=TEXT_WHITE)
    add_text(f5, "5 coins/min  •  220 coins left", 125, 430, font_size=13, fill=GOLD_COIN)

    # Active Call Duration (The fix we implemented: prominent live duration!)
    add_text(f5, "03:42", 145, 470, font_size=36, font_style="Bold", fill=TEXT_WHITE)

    # Status Pill
    add_node("rectangle", "Status Pill", f5, 100, 525, 190, 36, {"fill": "#25121E", "cornerRadius": 18, "stroke": DANGER_RED, "strokeWeight": 1})
    add_text(f5, "Sara has muted microphone", 115, 535, font_size=12, font_style="Bold", fill="#FCA5A5")

    # Animated Audio Waveform (paused while peer is muted)
    add_node("rectangle", "Wave Box", f5, 45, 585, 300, 50, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f5, "  ılı.lıllılı.ıllı.ılı.lıllılı.ıllı.ılı.lıll  ", 75, 600, font_size=16, fill=TEXT_MUTED)

    # Action Controls (Speaker, Mute, End Call)
    # Speaker button
    add_node("ellipse", "Speaker Btn", f5, 48, 690, 68, 68, {"fill": BG_CARD, "stroke": CARD_BORDER, "strokeWeight": 1.5})
    add_text(f5, "🔊", 70, 712, font_size=24)
    add_text(f5, "Speaker", 60, 768, font_size=12, fill=TEXT_MUTED)

    # Mute button
    add_node("ellipse", "Mute Btn", f5, 161, 690, 68, 68, {"fill": BG_CARD, "stroke": CARD_BORDER, "strokeWeight": 1.5})
    add_text(f5, "🎙️", 183, 712, font_size=24)
    add_text(f5, "Mute", 180, 768, font_size=12, fill=TEXT_MUTED)

    # Hangup button (Red)
    add_node("ellipse", "Hangup Btn", f5, 274, 690, 68, 68, {"fill": DANGER_RED})
    add_text(f5, "📞", 296, 712, font_size=24)
    add_text(f5, "End Call", 285, 768, font_size=12, font_style="Bold", fill=DANGER_RED)

    # =========================================================================
    # 6. SCREEN: C14 - Call Receipt & Rating
    # =========================================================================
    s6_x = (SCREEN_WIDTH + SCREEN_GAP) * 5
    f6 = add_frame("C14_Call_Receipt", s6_x, 0, BG_DARK)
    add_status_bar(f6)

    # Success checkmark circle
    add_node("ellipse", "Success Circle", f6, 160, 80, 70, 70, {"fill": SUCCESS_EMERALD})
    add_text(f6, "✓", 182, 95, font_size=40, font_style="Bold", fill=TEXT_WHITE)
    add_text(f6, "Call Ended", 145, 165, font_size=24, font_style="Bold", fill=TEXT_WHITE)
    add_text(f6, "Session summary with Sara", 120, 195, font_size=14, fill=TEXT_MUTED)

    # Settlement Receipt Card
    add_node("rectangle", "Receipt Box", f6, 24, 235, 342, 220, {"fill": BG_CARD, "cornerRadius": 20, "stroke": CARD_BORDER, "strokeWeight": 1})
    items = [
        ("Connected Duration", "04 mins 12 secs"),
        ("Billed Duration", "4 minutes"),
        ("Call Rate", "5 coins / min"),
        ("Total Deduction", "20 Coins"),
        ("Remaining Wallet Balance", "220 Coins")
    ]
    ry = 255
    for label, val in items:
        add_text(f6, label, 42, ry, font_size=13, fill=TEXT_MUTED)
        is_highlight = ("Deduction" in label)
        add_text(f6, val, 240 if len(val) > 10 else 280, ry, font_size=13, font_style="Bold", fill=PRIMARY_PINK if is_highlight else TEXT_WHITE)
        ry += 38

    # Rating Card
    add_node("rectangle", "Rating Box", f6, 24, 480, 342, 130, {"fill": BG_CARD, "cornerRadius": 20, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f6, "How was your conversation?", 85, 498, font_size=15, font_style="Bold", fill=TEXT_WHITE)
    add_text(f6, "⭐  ⭐  ⭐  ⭐  ⭐", 105, 530, font_size=26)
    add_text(f6, "Tap a star to rate Sara anonymously", 92, 575, font_size=12, fill=TEXT_MUTED)

    # Report issue link
    add_text(f6, "🚩 Report inappropriate behavior", 100, 640, font_size=13, fill=TEXT_FAINT)

    # CTA Button
    add_node("rectangle", "Done CTA", f6, 28, 715, 334, 56, {"fill": PRIMARY_PINK, "cornerRadius": 28})
    add_text(f6, "Done  •  Back to Discover", 105, 733, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    # =========================================================================
    # 7. SCREEN: W01 - Wallet Coins & UPI Recharge
    # =========================================================================
    s7_x = (SCREEN_WIDTH + SCREEN_GAP) * 6
    f7 = add_frame("W01_Wallet_Recharge", s7_x, 0, BG_DARK)
    add_status_bar(f7)

    add_text(f7, "Wallet & Credits", 24, 56, font_size=22, font_style="Bold", fill=TEXT_WHITE)

    # Balance Card (Gradient)
    add_node("rectangle", "Balance Card", f7, 24, 98, 342, 130, {"fill": ACCENT_INDIGO, "cornerRadius": 22})
    add_text(f7, "TOTAL COIN BALANCE", 44, 118, font_size=12, font_style="Bold", fill="#C7D2FE")
    add_text(f7, "🪙 240 Coins", 44, 142, font_size=32, font_style="Bold", fill=TEXT_WHITE)
    add_text(f7, "≈ 48 Minutes of Calling Time (₹5/min)", 44, 190, font_size=13, fill="#E0E7FF")

    # Platform Fee notice
    add_node("rectangle", "Fee Notice", f7, 24, 242, 342, 42, {"fill": "#1F2937", "cornerRadius": 14})
    add_text(f7, "🎉 Limited Time: 0% Platform Convenience Fee!", 42, 255, font_size=12, font_style="Bold", fill=SUCCESS_EMERALD)

    add_text(f7, "Select Coin Recharge Package", 24, 305, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    # Pack 1
    add_node("rectangle", "Pack 1", f7, 24, 335, 342, 80, {"fill": BG_CARD, "cornerRadius": 18, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f7, "🪙 100 Coins", 44, 352, font_size=17, font_style="Bold", fill=TEXT_WHITE)
    add_text(f7, "Standard Pack (20 mins)", 44, 378, font_size=12, fill=TEXT_MUTED)
    add_node("rectangle", "Price Btn 1", f7, 260, 353, 90, 42, {"fill": BG_CARD_LIGHT, "cornerRadius": 21})
    add_text(f7, "₹49", 290, 366, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    # Pack 2 (Popular)
    add_node("rectangle", "Pack 2", f7, 24, 430, 342, 90, {"fill": BG_CARD, "cornerRadius": 18, "stroke": PRIMARY_PINK, "strokeWeight": 2})
    add_node("rectangle", "Popular Tag", f7, 44, 420, 110, 22, {"fill": PRIMARY_PINK, "cornerRadius": 11})
    add_text(f7, "MOST POPULAR", 52, 424, font_size=10, font_style="Bold", fill=TEXT_WHITE)
    add_text(f7, "🪙 250 Coins + 25 Bonus", 44, 452, font_size=17, font_style="Bold", fill=TEXT_WHITE)
    add_text(f7, "Great for long calls (55 mins)", 44, 480, font_size=12, fill=TEXT_MUTED)
    add_node("rectangle", "Price Btn 2", f7, 260, 455, 90, 42, {"fill": PRIMARY_PINK, "cornerRadius": 21})
    add_text(f7, "₹99", 290, 468, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    # Pack 3 (Best Value)
    add_node("rectangle", "Pack 3", f7, 24, 535, 342, 90, {"fill": BG_CARD, "cornerRadius": 18, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_node("rectangle", "Value Tag", f7, 44, 525, 100, 22, {"fill": ACCENT_PURPLE, "cornerRadius": 11})
    add_text(f7, "BEST VALUE", 54, 529, font_size=10, font_style="Bold", fill=TEXT_WHITE)
    add_text(f7, "🪙 600 Coins + 100 Bonus", 44, 557, font_size=17, font_style="Bold", fill=TEXT_WHITE)
    add_text(f7, "Heavy caller bundle (140 mins)", 44, 585, font_size=12, fill=TEXT_MUTED)
    add_node("rectangle", "Price Btn 3", f7, 260, 560, 90, 42, {"fill": BG_CARD_LIGHT, "cornerRadius": 21})
    add_text(f7, "₹199", 285, 573, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    # UPI Options supported
    add_text(f7, "🔒 Supported Payments: GPay, PhonePe, Paytm, UPI, Cards", 36, 645, font_size=11, fill=TEXT_FAINT)

    add_node("rectangle", "Recharge CTA", f7, 28, 690, 334, 54, {"fill": PRIMARY_PINK, "cornerRadius": 27})
    add_text(f7, "Pay with UPI Instant →", 110, 707, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    add_bottom_nav(f7, active="Wallet")

    # =========================================================================
    # 8. SCREEN: H04 - Host Earnings & Settlement Cycles
    # =========================================================================
    s8_x = (SCREEN_WIDTH + SCREEN_GAP) * 7
    f8 = add_frame("H04_Host_Earnings", s8_x, 0, BG_DARK)
    add_status_bar(f8)

    add_text(f8, "Host Operations", 24, 56, font_size=22, font_style="Bold", fill=TEXT_WHITE)
    # Status Toggle
    add_node("rectangle", "Status Toggle", f8, 225, 54, 140, 36, {"fill": "#064E3B", "cornerRadius": 18, "stroke": SUCCESS_EMERALD, "strokeWeight": 1})
    add_text(f8, "🟢 Online (Active)", 240, 64, font_size=12, font_style="Bold", fill=SUCCESS_EMERALD)

    # Host Revenue Card
    add_node("rectangle", "Rev Card", f8, 24, 102, 342, 130, {"fill": "#1E1B4B", "cornerRadius": 22, "stroke": ACCENT_PURPLE, "strokeWeight": 1})
    add_text(f8, "AVAILABLE BALANCE FOR PAYOUT", 44, 120, font_size=11, font_style="Bold", fill="#A5B4FC")
    add_text(f8, "₹8,420.00", 44, 142, font_size=32, font_style="Bold", fill=TEXT_WHITE)
    add_text(f8, "Today's Earnings: ₹1,250 (32 calls completed)", 44, 192, font_size=13, fill=SUCCESS_EMERALD)

    add_text(f8, "Payout Settlement Cycle", 24, 252, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    # Option 1: Weekly Cycle (Implemented feature!)
    add_node("rectangle", "Opt 1 Box", f8, 24, 280, 342, 100, {"fill": BG_CARD, "cornerRadius": 18, "stroke": PRIMARY_PINK, "strokeWeight": 2})
    add_node("ellipse", "Opt 1 Radio", f8, 42, 300, 22, 22, {"fill": PRIMARY_PINK})
    add_text(f8, "✓", 48, 304, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    add_text(f8, "Weekly Payout Cycle", 75, 300, font_size=16, font_style="Bold", fill=TEXT_WHITE)
    add_text(f8, "Payouts processed automatically every Monday.\nMinimum ₹100 withdrawal limit.", 75, 328, width=270, font_size=12, fill=TEXT_MUTED)

    # Option 2: Monthly Settlement (Implemented feature!)
    add_node("rectangle", "Opt 2 Box", f8, 24, 395, 342, 100, {"fill": BG_CARD, "cornerRadius": 18, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_node("ellipse", "Opt 2 Radio", f8, 42, 415, 22, 22, {"fill": BG_CARD_LIGHT, "stroke": CARD_BORDER, "strokeWeight": 1.5})
    add_text(f8, "Monthly Full Settlement", 75, 415, font_size=16, font_style="Bold", fill=TEXT_WHITE)
    add_text(f8, "Withdraw 100% accumulated balance once a month\nwith zero platform deduction fees.", 75, 443, width=270, font_size=12, fill=TEXT_MUTED)

    # Bank / UPI details
    add_node("rectangle", "Bank Box", f8, 24, 515, 342, 70, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    add_text(f8, "Bank Payout Account", 42, 530, font_size=12, fill=TEXT_MUTED)
    add_text(f8, "sara@okhdfcbank (HDFC UPI) • Verified ✓", 42, 552, font_size=13, font_style="Bold", fill=SUCCESS_EMERALD)

    # Payout Request CTA
    add_node("rectangle", "Withdraw CTA", f8, 28, 610, 334, 54, {"fill": PRIMARY_PINK, "cornerRadius": 27})
    add_text(f8, "Withdraw ₹8,420 Now →", 100, 627, font_size=16, font_style="Bold", fill=TEXT_WHITE)

    add_bottom_nav(f8, active="Profile")

    # =========================================================================
    # Run Script and Output .figcraft, .fig, and PNG renders
    # =========================================================================
    script_path = os.path.join(output_dir, "build_all_screens.json")
    with open(script_path, "w", encoding="utf-8") as f:
        json.dump(commands, f, indent=2)

    figcraft_file = os.path.join(output_dir, "friendoo_mobile_screens.figcraft")
    fig_file = os.path.join(output_dir, "friendoo_mobile_screens.fig")

    print(f"Executing FigCraft CLI to compile {len(commands)} commands...")
    cmd = [figcraft_cli, "run", script_path, "--out", figcraft_file]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print("Error compiling FigCraft file:", proc.stderr)
        sys.exit(1)

    print(f"[OK] Successfully created native FigCraft project: {figcraft_file}")

    # Export to Figma .fig file
    print("Exporting to Figma format (.fig)...")
    cmd_fig = [figcraft_cli, "export", figcraft_file, "-o", fig_file, "--format", "fig"]
    proc_fig = subprocess.run(cmd_fig, capture_output=True, text=True)
    if proc_fig.returncode == 0:
        print(f"[OK] Successfully exported to Figma format: {fig_file}")

    # Export high-res PNG renders for each screen
    print("Exporting high-resolution PNG previews...")
    cmd_png = [figcraft_cli, "export", figcraft_file, "-o", renders_dir, "--format", "png", "--scale", "2"]
    proc_png = subprocess.run(cmd_png, capture_output=True, text=True)
    if proc_png.returncode == 0:
        print(f"[OK] Successfully exported 8 screens to: {renders_dir}")
        for item in os.listdir(renders_dir):
            if item.endswith(".png"):
                print(f"   - {item}")

    print("\nAll done! You can now open 'friendoo_mobile_screens.figcraft' directly in FigCraft.")

if __name__ == "__main__":
    main()
