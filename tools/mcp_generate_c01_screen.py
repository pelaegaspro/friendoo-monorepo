import subprocess
import json
import os
import sys

def main():
    print("=== Launching FigCraft MCP Server on stdio ===")
    proc = subprocess.Popen(
        [r"C:\Program Files\FigCraft\figcraft-cli.exe", "mcp"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8"
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
        if not resp:
            print(f"ERROR: No response for {name}")
            return None
        if "error" in resp:
            print(f"RPC ERROR calling {name}: {resp['error']}")
            return None
        res = resp.get("result", {})
        if res.get("isError"):
            print(f"TOOL ERROR in {name}: {res.get('content', [{}])[0].get('text')}")
        return res

    # 1. MCP Handshake
    print("Step 1: MCP Handshake & Protocol Initialization...")
    init_res = call_mcp("initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "friendoo-figcraft-agent", "version": "1.0.0"}
    })
    server_info = init_res.get("result", {}).get("serverInfo", {})
    print(f"  Connected to {server_info.get('name')} v{server_info.get('version')} ({server_info.get('title')})")

    # Send notifications/initialized (no response expected)
    proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
    proc.stdin.flush()

    # 2. Design Screen: C01_Call_Cost_Confirmation
    print("\nStep 2: Designing Screen C01_Call_Cost_Confirmation via FigCraft MCP create_node...")
    
    # 2.1 Root Frame
    res = tool("create_node", {
        "type": "frame",
        "name": "C01_Call_Cost_Confirmation",
        "x": 0,
        "y": 0,
        "width": 390,
        "height": 844,
        "props": {
            "fill": "#0B0E17",
            "clip": True
        }
    })
    screen_id = json.loads(res["content"][0]["text"])["id"]
    print(f"  Root Screen Frame ID: {screen_id}")

    # 2.2 Background Scrim & Underlying Profile Preview
    tool("create_node", {
        "type": "rectangle",
        "parent": screen_id,
        "name": "Host_Profile_Background",
        "x": 0,
        "y": 0,
        "width": 390,
        "height": 260,
        "props": {
            "fill": "#131927"
        }
    })

    # Host Avatar Glow in background
    tool("create_node", {
        "type": "ellipse",
        "parent": screen_id,
        "name": "Avatar_Backdrop_Glow",
        "x": 155,
        "y": 50,
        "width": 80,
        "height": 80,
        "props": {
            "fill": "#7C3AED",
            "opacity": 0.3
        }
    })

    tool("create_node", {
        "type": "ellipse",
        "parent": screen_id,
        "name": "Avatar_Backdrop_Circle",
        "x": 160,
        "y": 55,
        "width": 70,
        "height": 70,
        "props": {
            "fill": "#EC4899"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": screen_id,
        "name": "Host_Name_Underlay",
        "x": 136,
        "y": 135,
        "text": "Priya Sharma",
        "props": {
            "fontSize": 17,
            "fill": "#FFFFFF"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": screen_id,
        "name": "Host_Bio_Underlay",
        "x": 118,
        "y": 158,
        "text": "Casual Chat • ⭐ 4.9 (142)",
        "props": {
            "fontSize": 12,
            "fill": "#94A3B8"
        }
    })

    # Dark Scrim / Overlay
    tool("create_node", {
        "type": "rectangle",
        "parent": screen_id,
        "name": "Modal_Scrim_Overlay",
        "x": 0,
        "y": 0,
        "width": 390,
        "height": 844,
        "props": {
            "fill": "#000000",
            "opacity": 0.65
        }
    })

    # 2.3 Bottom Sheet Modal Container
    sheet_y = 196
    sheet_h = 648
    res = tool("create_node", {
        "type": "frame",
        "parent": screen_id,
        "name": "Bottom_Sheet_Modal",
        "x": 0,
        "y": sheet_y,
        "width": 390,
        "height": sheet_h,
        "props": {
            "fill": "#161B26",
            "cornerRadius": 28,
            "stroke": "#262D40",
            "strokeWeight": 1,
            "clip": True
        }
    })
    sheet_id = json.loads(res["content"][0]["text"])["id"]

    # Drag Handle
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

    # Header Title & Subtitle
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Sheet_Title",
        "x": 24,
        "y": 30,
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
        "y": 58,
        "text": "Review rates & reservation before connecting",
        "props": {
            "fontSize": 13,
            "fill": "#94A3B8"
        }
    })

    # 2.4 Host Info Card
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Host_Card_Bg",
        "x": 20,
        "y": 90,
        "width": 350,
        "height": 84,
        "props": {
            "fill": "#1E2638",
            "cornerRadius": 16,
            "stroke": "#2D374D",
            "strokeWeight": 1
        }
    })

    tool("create_node", {
        "type": "ellipse",
        "parent": sheet_id,
        "name": "Host_Card_Avatar",
        "x": 34,
        "y": 104,
        "width": 56,
        "height": 56,
        "props": {
            "fill": "#EC4899"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Host_Card_Name",
        "x": 102,
        "y": 107,
        "text": "Priya Sharma",
        "props": {
            "fontSize": 16,
            "fill": "#FFFFFF"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Host_Card_Status",
        "x": 102,
        "y": 131,
        "text": "● Online Now",
        "props": {
            "fontSize": 12,
            "fill": "#10B981"
        }
    })

    # Rate Pill in Host Card
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Rate_Pill_Bg",
        "x": 242,
        "y": 114,
        "width": 116,
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
        "x": 252,
        "y": 124,
        "text": "⚡ 25 Coins/m",
        "props": {
            "fontSize": 12,
            "fill": "#FFFFFF"
        }
    })

    # 2.5 Call Economics Card (Balance, Talk Time, Promo Banner, Reservation Note)
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Economics_Card_Bg",
        "x": 20,
        "y": 188,
        "width": 350,
        "height": 168,
        "props": {
            "fill": "#0F1422",
            "cornerRadius": 16,
            "stroke": "#232D42",
            "strokeWeight": 1
        }
    })

    # Row 1: Balance
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Label_Wallet",
        "x": 36,
        "y": 204,
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
        "x": 258,
        "y": 204,
        "text": "🪙 120 Coins",
        "props": {
            "fontSize": 14,
            "fill": "#F59E0B"
        }
    })

    # Row 2: Available Talk Time
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Label_Duration",
        "x": 36,
        "y": 234,
        "text": "Max Call Duration",
        "props": {
            "fontSize": 13,
            "fill": "#94A3B8"
        }
    })
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Val_Duration",
        "x": 272,
        "y": 234,
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
        "name": "Promo_Banner_Bg",
        "x": 32,
        "y": 266,
        "width": 326,
        "height": 42,
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
        "name": "Promo_Banner_Text",
        "x": 44,
        "y": 279,
        "text": "🎁 Platform Fee: FREE (Promotional Period Active)",
        "props": {
            "fontSize": 11,
            "fill": "#A5B4FC"
        }
    })

    # Row 4: Reservation upfront note
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Reservation_Note",
        "x": 36,
        "y": 324,
        "text": "🔒 25 Coins reserved upfront for min 1, then billed /sec",
        "props": {
            "fontSize": 11,
            "fill": "#64748B"
        }
    })

    # 2.6 Auto-End Safeguard Switch
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Auto_End_Card_Bg",
        "x": 20,
        "y": 370,
        "width": 350,
        "height": 64,
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
        "name": "Toggle_Label_Title",
        "x": 36,
        "y": 382,
        "text": "Auto-End When Balance Depleted",
        "props": {
            "fontSize": 13,
            "fill": "#FFFFFF"
        }
    })

    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Toggle_Label_Desc",
        "x": 36,
        "y": 404,
        "text": "Prevents accidental overdraft during conversation",
        "props": {
            "fontSize": 11,
            "fill": "#94A3B8"
        }
    })

    # Switch Graphic (Green Active ON)
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Switch_Track",
        "x": 312,
        "y": 389,
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
        "y": 392,
        "width": 20,
        "height": 20,
        "props": {
            "fill": "#FFFFFF"
        }
    })

    # 2.7 Primary CTA: Start Call (Hold 25 Coins)
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Btn_Start_Call_Bg",
        "x": 20,
        "y": 450,
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
        "x": 108,
        "y": 467,
        "text": "Start Call (Hold 25 Coins)",
        "props": {
            "fontSize": 15,
            "fill": "#FFFFFF"
        }
    })

    # 2.8 Secondary CTA: + Add More Coins
    tool("create_node", {
        "type": "rectangle",
        "parent": sheet_id,
        "name": "Btn_Recharge_Bg",
        "x": 20,
        "y": 514,
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
        "x": 136,
        "y": 528,
        "text": "+ Add More Coins",
        "props": {
            "fontSize": 14,
            "fill": "#A5B4FC"
        }
    })

    # 2.9 Trust & Security Footnote
    tool("create_node", {
        "type": "text",
        "parent": sheet_id,
        "name": "Trust_Footer",
        "x": 52,
        "y": 582,
        "text": "🛡️ 100% Private WebRTC Audio • Real-Time Billing",
        "props": {
            "fontSize": 11,
            "fill": "#64748B"
        }
    })

    print("  All nodes created successfully on FigCraft canvas!")

    # 3. Save to native .figcraft format via MCP tool: save_file
    print("\nStep 3: Saving native .figcraft document via MCP save_file...")
    figcraft_file = r"D:\AllBackup\friendoo\design\C01_Call_Cost_Confirmation.figcraft"
    save_res = tool("save_file", {"path": figcraft_file})
    print(f"  Saved FigCraft document to: {figcraft_file}")

    # 4. Export to native Figma (.fig) format via MCP tool: export
    print("\nStep 4: Exporting native Figma (.fig) file via MCP export...")
    fig_file = r"D:\AllBackup\friendoo\design\C01_Call_Cost_Confirmation.fig"
    fig_res = tool("export", {
        "ids": [screen_id],
        "format": "fig",
        "path": fig_file
    })
    print(f"  Exported Figma document to: {fig_file}")

    # 5. Export 2x Retina PNG preview via MCP tool: export
    print("\nStep 5: Exporting 2x Retina PNG render via MCP export...")
    png_file = r"D:\AllBackup\friendoo\design\renders\C01_Call_Cost_Confirmation.png"
    png_res = tool("export", {
        "ids": [screen_id],
        "format": "png",
        "scale": 2,
        "path": png_file
    })
    print(f"  Exported 2x PNG render to: {png_file}")

    proc.terminate()
    print("\n=== FigCraft MCP Automation Finished Successfully ===")

if __name__ == "__main__":
    main()
