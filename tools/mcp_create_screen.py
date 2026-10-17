import subprocess
import json
import os
import sys

def main():
    print("=== Launching FigCraft MCP Server ===")
    proc = subprocess.Popen(
        [r"C:\Program Files\FigCraft\figcraft-cli.exe", "mcp"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    req_id = 0
    def call_mcp(method, params=None):
        nonlocal req_id
        req_id += 1
        msg = {"jsonrpc": "2.0", "id": req_id, "method": method}
        if params is not None:
            msg["params"] = params
        proc.stdin.write(json.dumps(msg) + "\n")
        proc.stdin.flush()
        line = proc.stdout.readline()
        if not line:
            return None
        return json.loads(line)

    def tool(name, arguments):
        resp = call_mcp("tools/call", {"name": name, "arguments": arguments})
        if "error" in resp:
            print(f"ERROR calling {name}: {resp['error']}")
        return resp.get("result", {})

    # 1. Initialize MCP
    print("Step 1: Initializing MCP handshake...")
    init_res = call_mcp("initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "antigravity-figcraft-plugin", "version": "1.0"}
    })
    print("  Connected! Server capabilities:", init_res.get("result", {}).get("serverInfo", {}))

    call_mcp("notifications/initialized")

    # 2. Design Screen: C01_Call_Cost_Confirmation
    print("\nStep 2: Designing Screen C01_Call_Cost_Confirmation via MCP create_node...")
    
    # Root Screen Frame (390 x 844)
    res = tool("create_node", {
        "type": "frame",
        "name": "C01_Call_Cost_Confirmation",
        "x": 0,
        "y": 0,
        "width": 390,
        "height": 844,
        "props": {
            "fill": "#0B0E17",
            "clipContent": True
        }
    })
    screen_id = res.get("content", [{}])[0].get("text")
    print(f"  Created root screen frame id: {screen_id}")

    # Top Status Bar Background / Scrim
    tool("create_node", {
        "type": "rectangle",
        "parent": screen_id,
        "name": "Background_Backdrop",
        "x": 0,
        "y": 0,
        "width": 390,
        "height": 240,
        "props": {
            "fill": "#111625"
        }
    })

    # Host Header Profile in background
    tool("create_node", {
        "type": "ellipse",
        "parent": screen_id,
        "name": "Background_Host_Avatar_Glow",
        "x": 155,
        "y": 60,
        "width": 80,
        "height": 80,
        "props": {
            "fill": "#7C3AED",
            "opacity": 0.25
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": screen_id,
        "name": "Background_Label",
        "x": 120,
        "y": 155,
        "text": "Priya Sharma (Host)",
        "props": {
            "fontSize": 15,
            "fill": "#64748B"
        }
    })

    # Dimming overlay
    tool("create_node", {
        "type": "rectangle",
        "parent": screen_id,
        "name": "Scrim_Dimmer",
        "x": 0,
        "y": 0,
        "width": 390,
        "height": 844,
        "props": {
            "fill": "#000000",
            "opacity": 0.55
        }
    })

    # Bottom Sheet Container
    sheet_y = 220
    sheet_h = 624
    res = tool("create_node", {
        "type": "frame",
        "parent": screen_id,
        "name": "Bottom_Sheet_Container",
        "x": 0,
        "y": sheet_y,
        "width": 390,
        "height": sheet_h,
        "props": {
            "fill": "#161B26",
            "cornerRadius": 28,
            "stroke": "#262D40",
            "strokeWeight": 1
        }
    })
    sheet_id = res.get("content", [{}])[0].get("text")

    # Sheet Drag Handle
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Drag_Handle",
        "x": 173,
        "y": 12,
        "width": 44,
        "height": 5,
        "props": {
            "fill": "#334155",
            "cornerRadius": 3
        }
    })

    # Title & Subtitle
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Sheet_Title",
        "x": 24,
        "y": 32,
        "text": "Call Confirmation",
        "props": {
            "fontSize": 20,
            "fill": "#FFFFFF"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Sheet_Subtitle",
        "x": 24,
        "y": 60,
        "text": "Review rates & reservation before connecting",
        "props": {
            "fontSize": 13,
            "fill": "#94A3B8"
        }
    })

    # Host Summary Card
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Host_Card_Bg",
        "x": 20,
        "y": 92,
        "width": 350,
        "height": 84,
        "props": {
            "fill": "#1E2638",
            "cornerRadius": 16,
            "stroke": "#2D374D",
            "strokeWeight": 1
        }
    })

    # Avatar
    tool("create_node", {
        "type": "ellipse",
        "parent": sheet_id,
        "name": "Host_Avatar",
        "x": 36,
        "y": 106,
        "width": 56,
        "height": 56,
        "props": {
            "fill": "#EC4899"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Host_Name",
        "x": 104,
        "y": 108,
        "text": "Priya Sharma",
        "props": {
            "fontSize": 16,
            "fill": "#FFFFFF"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Host_Status_Badge",
        "x": 104,
        "y": 132,
        "text": "● Live Now • Hindi & English",
        "props": {
            "fontSize": 12,
            "fill": "#10B981"
        }
    })

    # Rate Badge inside Host Card
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Rate_Pill_Bg",
        "x": 246,
        "y": 116,
        "width": 112,
        "height": 36,
        "props": {
            "fill": "#7C3AED",
            "cornerRadius": 18
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Rate_Pill_Text",
        "x": 258,
        "y": 125,
        "text": "⚡ 25 Coins/m",
        "props": {
            "fontSize": 12,
            "fill": "#FFFFFF"
        }
    })

    # Call Economics Card (Wallet Balance, Available Time, Platform Fee)
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Economics_Card_Bg",
        "x": 20,
        "y": 192,
        "width": 350,
        "height": 164,
        "props": {
            "fill": "#0F1422",
            "cornerRadius": 16,
            "stroke": "#232D42",
            "strokeWeight": 1
        }
    })

    # Row 1: Wallet Balance
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Label_Wallet",
        "x": 36,
        "y": 208,
        "text": "Your Coin Balance",
        "props": {
            "fontSize": 13,
            "fill": "#94A3B8"
        }
    })
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Val_Wallet",
        "x": 260,
        "y": 208,
        "text": "🪙 120 Coins",
        "props": {
            "fontSize": 14,
            "fill": "#F59E0B"
        }
    })

    # Row 2: Max Talk Time
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Label_TalkTime",
        "x": 36,
        "y": 236,
        "text": "Max Call Duration",
        "props": {
            "fontSize": 13,
            "fill": "#94A3B8"
        }
    })
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Val_TalkTime",
        "x": 272,
        "y": 236,
        "text": "~4.8 Mins",
        "props": {
            "fontSize": 14,
            "fill": "#10B981"
        }
    })

    # Row 3: Platform Fee Promo Banner
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Fee_Promo_Banner",
        "x": 32,
        "y": 268,
        "width": 326,
        "height": 40,
        "props": {
            "fill": "#1E1B4B",
            "cornerRadius": 10,
            "stroke": "#4338CA",
            "strokeWeight": 1
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Fee_Promo_Text",
        "x": 44,
        "y": 280,
        "text": "🎁 Platform Fee: FREE (Promotional Period Active)",
        "props": {
            "fontSize": 11,
            "fill": "#A5B4FC"
        }
    })

    # Row 4: Reservation Note
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Reservation_Note",
        "x": 36,
        "y": 322,
        "text": "🔒 25 Coins reserved upfront for min 1, then billed /sec",
        "props": {
            "fontSize": 11,
            "fill": "#64748B"
        }
    })

    # Auto-end Safeguard Toggle Row
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Toggle_Row_Bg",
        "x": 20,
        "y": 372,
        "width": 350,
        "height": 62,
        "props": {
            "fill": "#161E2E",
            "cornerRadius": 14,
            "stroke": "#222C3F",
            "strokeWeight": 1
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Toggle_Title",
        "x": 36,
        "y": 384,
        "text": "Auto-End When Balance Depleted",
        "props": {
            "fontSize": 13,
            "fill": "#FFFFFF"
        }
    })
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Toggle_Desc",
        "x": 36,
        "y": 404,
        "text": "Protects against accidental coin overdraft",
        "props": {
            "fontSize": 11,
            "fill": "#94A3B8"
        }
    })

    # Switch Graphic (Active ON)
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Switch_Track",
        "x": 312,
        "y": 387,
        "width": 46,
        "height": 26,
        "props": {
            "fill": "#10B981",
            "cornerRadius": 13
        }
    })
    tool("create_node", {
        "type": "ellipse",
        "parent": sheet_id,
        "name": "Switch_Thumb",
        "x": 334,
        "y": 390,
        "width": 20,
        "height": 20,
        "props": {
            "fill": "#FFFFFF"
        }
    })

    # Primary Action CTA Button: Confirm & Start Call
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Btn_Start_Call_Bg",
        "x": 20,
        "y": 454,
        "width": 350,
        "height": 54,
        "props": {
            "fill": "#7C3AED",
            "cornerRadius": 16
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Btn_Start_Call_Text",
        "x": 105,
        "y": 471,
        "text": "Start Call (Hold 25 Coins)",
        "props": {
            "fontSize": 15,
            "fill": "#FFFFFF"
        }
    })

    # Secondary Action CTA Button: Recharge Wallet
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Btn_Recharge_Bg",
        "x": 20,
        "y": 518,
        "width": 350,
        "height": 48,
        "props": {
            "fill": "#1A2234",
            "cornerRadius": 14,
            "stroke": "#2E3A52",
            "strokeWeight": 1
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Btn_Recharge_Text",
        "x": 135,
        "y": 532,
        "text": "+ Add More Coins",
        "props": {
            "fontSize": 14,
            "fill": "#A5B4FC"
        }
    })

    # Bottom Trust Note
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Trust_Note",
        "x": 58,
        "y": 582,
        "text": "🛡️ 100% Private WebRTC Audio • Billed per Second",
        "props": {
            "fontSize": 11,
            "fill": "#64748B"
        }
    })

    print("  All layers created successfully!")

    # 3. Save File via MCP tool: save_file
    print("\nStep 3: Saving .figcraft document via MCP save_file...")
    figcraft_path = r"D:\AllBackup\friendoo\design\C01_Call_Cost_Confirmation.figcraft"
    save_res = tool("save_file", {"path": figcraft_path})
    print("  save_file result:", save_res)

    # 4. Export to Figma (.fig) via MCP tool: export
    print("\nStep 4: Exporting to Figma (.fig) via MCP export...")
    fig_path = r"D:\AllBackup\friendoo\design\C01_Call_Cost_Confirmation.fig"
    exp_fig_res = tool("export", {
        "path": fig_path,
        "format": "fig"
    })
    print("  Figma export result:", exp_fig_res)

    # 5. Export 2x Retina PNG via MCP tool: export
    print("\nStep 5: Exporting 2x Retina PNG preview via MCP export...")
    png_path = r"D:\AllBackup\friendoo\design\renders\C01_Call_Cost_Confirmation.png"
    exp_png_res = tool("export", {
        "path": png_path,
        "format": "png",
        "scale": 2
    })
    print("  PNG export result:", exp_png_res)

    # Terminate process cleanly
    proc.terminate()
    print("\n=== FigCraft MCP Operation Completed Successfully ===")

if __name__ == "__main__":
    main()

