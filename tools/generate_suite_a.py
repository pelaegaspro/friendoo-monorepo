import json
import os
import subprocess
from screen_builder import (
    ScreenBuilder, BG_DARK, BG_CARD, BG_CARD_LIGHT, BG_SURFACE, CARD_BORDER,
    PRIMARY_PURPLE, PRIMARY_PINK, SUCCESS_GREEN, AMBER_GOLD, DANGER_RED,
    TEXT_WHITE, TEXT_MUTED, TEXT_FAINT, SCREEN_WIDTH, SCREEN_HEIGHT
)

def build_suite_a(b: ScreenBuilder, base_row=0):
    print("Building Section 1: Authentication, Onboarding, and Legal (A01 - A09)...")
    
    # --- A01: Splash & Session Restore ---
    s1 = b.add_screen_frame("A01_Splash_Session_Restore", 0, base_row)
    # Glow logo
    b.add_node("ellipse", "Glow_Bg", s1, 145, 300, 100, 100, {"fill": PRIMARY_PURPLE, "opacity": 0.35})
    b.add_node("ellipse", "Logo_Icon", s1, 155, 310, 80, 80, {"fill": PRIMARY_PINK})
    b.add_text(s1, "🎙️", 178, 332, font_size=32)
    b.add_text(s1, "Friendoo", 20, 410, width=350, font_size=28, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s1, "Real 1-on-1 Voice Connections", 20, 448, width=350, font_size=14, fill=TEXT_MUTED, align="center")
    # Restore indicator
    b.add_node("rectangle", "Restore_Pill", s1, 95, 540, 200, 38, {"fill": BG_CARD, "cornerRadius": 19, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s1, "⚡ Restoring secure session...", 105, 551, font_size=12, fill=SUCCESS_GREEN)
    b.add_text(s1, "Version 2.4.0 • Encrypted WebRTC", 20, 780, width=350, font_size=11, fill=TEXT_FAINT, align="center")

    # --- A02: Welcome & Entry ---
    s2 = b.add_screen_frame("A02_Welcome_Entry", 1, base_row)
    b.add_node("rectangle", "Hero_Card", s2, 20, 80, 350, 320, {"fill": BG_CARD, "cornerRadius": 24, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_node("ellipse", "Hero_Avatar_1", s2, 70, 130, 72, 72, {"fill": PRIMARY_PINK})
    b.add_node("ellipse", "Hero_Avatar_2", s2, 248, 130, 72, 72, {"fill": PRIMARY_PURPLE})
    b.add_text(s2, "🗣️ ~ ~ 🎧", 152, 154, font_size=20, fill=AMBER_GOLD)
    b.add_text(s2, "Voice Calls • Zero Judgment", 36, 230, font_size=18, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s2, "Speak with verified hosts in your language anytime, anywhere.", 36, 260, width=310, font_size=13, fill=TEXT_MUTED)
    
    b.add_text(s2, "Welcome to Friendoo", 24, 430, font_size=24, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s2, "Enter your mobile number to get started or resume conversations.", 24, 465, width=340, font_size=13, fill=TEXT_MUTED)
    b.add_button(s2, "Continue with Phone Number", 530, variant="primary")
    b.add_button(s2, "Browse as Guest", 595, variant="secondary")
    b.add_text(s2, "By continuing, you accept our Terms & Privacy Policy.", 20, 740, width=350, font_size=11, fill=TEXT_FAINT, align="center")

    # --- A03: Phone-Number Login ---
    s3 = b.add_screen_frame("A03_Phone_Number_Login", 2, base_row)
    b.add_header(s3, "Enter Phone Number", "We'll send an SMS verification code")
    b.add_card(s3, 140, 110, title="Mobile Number")
    # Country code pill
    b.add_node("rectangle", "CC_Pill", s3, 36, 185, 74, 44, {"fill": BG_CARD_LIGHT, "cornerRadius": 10})
    b.add_text(s3, "🇮🇳 +91", 46, 198, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    # Phone Input field
    b.add_node("rectangle", "Phone_Input", s3, 120, 185, 234, 44, {"fill": BG_CARD_LIGHT, "cornerRadius": 10, "stroke": PRIMARY_PURPLE, "strokeWeight": 1.5})
    b.add_text(s3, "98765 43210", 134, 198, font_size=15, font_style="Bold", fill=TEXT_WHITE)
    
    b.add_node("rectangle", "Shield_Notice", s3, 20, 275, 350, 60, {"fill": BG_SURFACE, "cornerRadius": 12, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s3, "🔒 Your number is 100% private and never shared with hosts.", 36, 296, font_size=11, fill=TEXT_MUTED)
    b.add_button(s3, "Send Verification Code", 360, variant="primary")

    # --- A04: OTP Verification ---
    s4 = b.add_screen_frame("A04_OTP_Verification", 3, base_row)
    b.add_header(s4, "Verify Code", "Code sent to +91 98765 43210")
    # 6 OTP boxes
    otp_digits = ["5", "8", "2", "9", "", ""]
    for i, d in enumerate(otp_digits):
        bx = 20 + i * 59
        border_c = PRIMARY_PURPLE if i == 4 else CARD_BORDER
        b.add_node("rectangle", f"OTP_Box_{i}", s4, bx, 140, 52, 60, {"fill": BG_CARD, "cornerRadius": 12, "stroke": border_c, "strokeWeight": 1.5})
        if d:
            b.add_text(s4, d, bx + 19, 155, font_size=22, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s4, "⏱️ Resend code in 00:42", 20, 225, width=350, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_button(s4, "Verify & Proceed", 270, variant="primary")
    b.add_text(s4, "Wrong number? Change Phone Number", 20, 345, width=350, font_size=13, fill=PRIMARY_PINK, align="center")

    # --- A05: Code Expired ---
    s5 = b.add_screen_frame("A05_Code_Expired", 4, base_row)
    b.add_header(s5, "Verification Issue", "Recovery options")
    b.add_node("ellipse", "Warn_Circle", s5, 160, 160, 70, 70, {"fill": DANGER_RED, "opacity": 0.2})
    b.add_text(s5, "⚠️", 180, 180, font_size=28)
    b.add_text(s5, "OTP Expired or Invalid", 20, 250, width=350, font_size=18, font_style="Bold", fill=TEXT_WHITE, align="center")
    b.add_text(s5, "The 6-digit code has expired for your security. Please request a fresh SMS code.", 30, 280, width=330, font_size=13, fill=TEXT_MUTED, align="center")
    b.add_button(s5, "Request New Code", 340, variant="primary")
    b.add_button(s5, "Change Phone Number", 405, variant="secondary")

    # --- A06: Profile Setup ---
    s6 = b.add_screen_frame("A06_Profile_Setup", 5, base_row)
    b.add_header(s6, "Create Profile", "Step 1 of 2")
    # Avatar upload
    b.add_node("ellipse", "Profile_Avatar", s6, 155, 120, 80, 80, {"fill": BG_CARD_LIGHT, "stroke": PRIMARY_PURPLE, "strokeWeight": 2})
    b.add_text(s6, "📷", 182, 148, font_size=24)
    b.add_text(s6, "Tap to upload avatar", 20, 210, width=350, font_size=12, fill=PRIMARY_PINK, align="center")
    # Inputs
    b.add_card(s6, 240, 80, title="Display Name")
    b.add_text(s6, "Rahul Verma", 36, 285, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    
    b.add_card(s6, 335, 110, title="Languages You Speak")
    langs = ["Hindi", "English", "Telugu", "Tamil"]
    for i, l in enumerate(langs):
        lx = 36 + i * 80
        fill_c = PRIMARY_PURPLE if i < 2 else BG_CARD_LIGHT
        b.add_node("rectangle", f"Lang_{l}", s6, lx, 390, 72, 32, {"fill": fill_c, "cornerRadius": 8})
        b.add_text(s6, l, lx + 12, 398, font_size=11, font_style="Bold", fill=TEXT_WHITE)
        
    b.add_button(s6, "Save & Continue", 470, variant="primary")

    # --- A07: Permission Preferences ---
    s7 = b.add_screen_frame("A07_Permission_Preferences", 6, base_row)
    b.add_header(s7, "Permissions", "Why Friendoo requests these")
    b.add_toggle_row(s7, 130, "Microphone Access", "Required to speak during live 1-on-1 voice calls", active=True)
    b.add_toggle_row(s7, 205, "Notifications", "Receive alerts when hosts accept your calls", active=True)
    b.add_toggle_row(s7, 280, "Background Audio", "Keep calls connected when switching apps", active=True)
    b.add_button(s7, "Enable & Go to App", 370, variant="primary")
    b.add_text(s7, "You can change these anytime in phone settings.", 20, 435, width=350, font_size=12, fill=TEXT_FAINT, align="center")

    # --- A08: Terms of Service ---
    s8 = b.add_screen_frame("A08_Terms_of_Service", 7, base_row)
    b.add_header(s8, "Terms of Service", "Last revised: Oct 2026")
    b.add_node("rectangle", "Legal_Scroll", s8, 20, 120, 350, 600, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s8, "1. Eligibility & Age Restriction", 36, 140, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s8, "Users must be at least 18 years old. Creating duplicate accounts or bypassing bans is strictly prohibited.", 36, 165, width=318, font_size=12, fill=TEXT_MUTED)
    
    b.add_text(s8, "2. Coin Purchases & Billing", 36, 215, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s8, "Coins have no cash value outside Friendoo. Calls are billed per second against your active balance.", 36, 240, width=318, font_size=12, fill=TEXT_MUTED)

    b.add_text(s8, "3. Community Safety & Decency", 36, 305, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s8, "Harassment, abuse, non-consensual recording, and extortion lead to immediate termination and legal referral.", 36, 330, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s8, "I Understand & Accept", 735, variant="primary")

    # --- A09: Privacy Policy ---
    s9 = b.add_screen_frame("A09_Privacy_Policy", 8, base_row)
    b.add_header(s9, "Privacy Policy", "How we protect your data")
    b.add_node("rectangle", "Privacy_Scroll", s9, 20, 120, 350, 600, {"fill": BG_CARD, "cornerRadius": 16, "stroke": CARD_BORDER, "strokeWeight": 1})
    b.add_text(s9, "1. Audio Privacy Guarantee", 36, 140, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s9, "Audio calls use direct encrypted WebRTC channels. Friendoo does NOT record, listen to, or store your voice calls.", 36, 165, width=318, font_size=12, fill=SUCCESS_GREEN)

    b.add_text(s9, "2. Phone Number Masking", 36, 230, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s9, "Your phone number is hashed and never revealed to callers or hosts. Communication happens via virtual IDs.", 36, 255, width=318, font_size=12, fill=TEXT_MUTED)

    b.add_text(s9, "3. Data Rights & Deletion", 36, 320, font_size=14, font_style="Bold", fill=TEXT_WHITE)
    b.add_text(s9, "You may request full erasure of your account and ledger logs anytime under Profile > Privacy Controls.", 36, 345, width=318, font_size=12, fill=TEXT_MUTED)
    b.add_button(s9, "Back to Account", 735, variant="secondary")

print("Suite A module defined.")

