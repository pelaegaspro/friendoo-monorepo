import json
import os
import subprocess
import sys

# Friendoo Brand Tokens
BG_DARK = "#0B0E17"
BG_CARD = "#161B26"
BG_CARD_LIGHT = "#1E2638"
BG_SURFACE = "#0F1422"
CARD_BORDER = "#262D40"
CARD_BORDER_LIGHT = "#2D374D"

PRIMARY_PURPLE = "#7C3AED"
PRIMARY_PINK = "#EC4899"
ACCENT_INDIGO = "#6366F1"
SUCCESS_GREEN = "#10B981"
AMBER_GOLD = "#F59E0B"
DANGER_RED = "#EF4444"

TEXT_WHITE = "#FFFFFF"
TEXT_MUTED = "#94A3B8"
TEXT_FAINT = "#64748B"

SCREEN_WIDTH = 390
SCREEN_HEIGHT = 844
GRID_GAP_X = 60
GRID_GAP_Y = 100

class ScreenBuilder:
    def __init__(self):
        self.commands = [{"command": "file.new", "params": {}}]
        self.node_id = 2  # Page 1 is id: 1

    def add_node(self, cmd_type, name, parent_id, x, y, width, height, props=None):
        nid = self.node_id
        self.node_id += 1
        self.commands.append({
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
        return nid

    def add_text(self, parent_id, text, x, y, width=None, font_size=14, font_style="Regular", fill=TEXT_WHITE, align="left"):
        nid = self.node_id
        self.node_id += 1
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
        self.commands.append({"command": "text.create", "params": params})
        return nid

    def add_screen_frame(self, name, grid_col, grid_row, fill=BG_DARK):
        nid = self.node_id
        self.node_id += 1
        x = grid_col * (SCREEN_WIDTH + GRID_GAP_X) + 100
        y = grid_row * (SCREEN_HEIGHT + GRID_GAP_Y) + 100
        self.commands.append({
            "command": "frame.create",
            "params": {
                "name": name,
                "x": x,
                "y": y,
                "width": SCREEN_WIDTH,
                "height": SCREEN_HEIGHT,
                "props": {"fill": fill, "cornerRadius": 40, "clip": True}
            }
        })
        # Standard Mobile Status Bar
        self.add_text(nid, "9:41", 28, 14, font_size=15, font_style="Bold", fill=TEXT_WHITE)
        self.add_text(nid, "5G  􀛨  􀛩", 305, 14, font_size=14, fill=TEXT_WHITE)
        return nid

    def add_header(self, sid, title, subtitle=None, show_back=True):
        if show_back:
            # Back Arrow Button
            self.add_node("rectangle", "Btn_Back_Bg", sid, 20, 48, 40, 40, {
                "fill": BG_CARD, "cornerRadius": 20, "stroke": CARD_BORDER, "strokeWeight": 1
            })
            self.add_text(sid, "←", 32, 54, font_size=18, font_style="Bold", fill=TEXT_WHITE)
            self.add_text(sid, title, 72, 56, font_size=18, font_style="Bold", fill=TEXT_WHITE)
            if subtitle:
                self.add_text(sid, subtitle, 72, 78, font_size=12, fill=TEXT_MUTED)
        else:
            self.add_text(sid, title, 24, 56, font_size=22, font_style="Bold", fill=TEXT_WHITE)
            if subtitle:
                self.add_text(sid, subtitle, 24, 84, font_size=13, fill=TEXT_MUTED)

    def add_button(self, sid, text, y, variant="primary", height=52):
        bg_color = PRIMARY_PURPLE if variant == "primary" else (BG_CARD if variant == "secondary" else DANGER_RED)
        text_color = TEXT_WHITE if variant != "secondary" else TEXT_MUTED
        stroke = CARD_BORDER if variant == "secondary" else None
        
        props = {"fill": bg_color, "cornerRadius": 16}
        if stroke:
            props["stroke"] = stroke
            props["strokeWeight"] = 1
            
        self.add_node("rectangle", f"Btn_{text}", sid, 20, y, 350, height, props)
        self.add_text(sid, text, 20, y + (height - 18) // 2, width=350, font_size=15, font_style="Bold", fill=text_color, align="center")

    def add_bottom_nav(self, sid, active="Discover"):
        self.add_node("rectangle", "Bottom_Nav_Bar", sid, 0, 764, SCREEN_WIDTH, 80, {
            "fill": "#0D111A", "stroke": CARD_BORDER, "strokeWeight": 1
        })
        tabs = [("Discover", "🔥", 35), ("Calls", "📞", 135), ("Wallet", "🪙", 235), ("Profile", "👤", 330)]
        for name, icon, tx in tabs:
            is_active = (name == active)
            c = PRIMARY_PINK if is_active else TEXT_FAINT
            self.add_text(sid, icon, tx, 776, font_size=16)
            self.add_text(sid, name, tx - 8, 800, font_size=11, font_style="Bold" if is_active else "Regular", fill=c)

    def add_card(self, sid, y, height, title=None, fill=BG_CARD):
        cid = self.add_node("rectangle", "Card_Bg", sid, 20, y, 350, height, {
            "fill": fill, "cornerRadius": 18, "stroke": CARD_BORDER, "strokeWeight": 1
        })
        if title:
            self.add_text(sid, title, 36, y + 16, font_size=15, font_style="Bold", fill=TEXT_WHITE)
        return cid

    def add_row(self, sid, y, label, val, val_color=TEXT_WHITE, font_size=13):
        self.add_text(sid, label, 36, y, font_size=font_size, fill=TEXT_MUTED)
        self.add_text(sid, val, 240, y, width=115, font_size=font_size, font_style="Bold", fill=val_color, align="right")

    def add_toggle_row(self, sid, y, title, desc, active=True):
        self.add_node("rectangle", "Toggle_Bg", sid, 20, y, 350, 64, {
            "fill": BG_CARD, "cornerRadius": 14, "stroke": CARD_BORDER, "strokeWeight": 1
        })
        self.add_text(sid, title, 36, y + 12, font_size=13, font_style="Bold", fill=TEXT_WHITE)
        self.add_text(sid, desc, 36, y + 34, font_size=11, fill=TEXT_MUTED)
        
        # Switch track and thumb
        track_fill = SUCCESS_GREEN if active else "#334155"
        self.add_node("rectangle", "Switch_Track", sid, 312, y + 19, 44, 26, {
            "fill": track_fill, "cornerRadius": 13
        })
        thumb_x = 332 if active else 315
        self.add_node("ellipse", "Switch_Thumb", sid, thumb_x, y + 22, 20, 20, {
            "fill": TEXT_WHITE
        })

print("ScreenBuilder loaded.")
