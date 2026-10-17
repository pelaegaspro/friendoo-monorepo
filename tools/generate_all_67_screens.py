import json
import os
import subprocess
import sys
import time

from screen_builder import ScreenBuilder
from generate_suite_a import build_suite_a
from generate_suite_d import build_suite_d
from generate_suite_w import build_suite_w
from generate_suite_c import build_suite_c
from generate_suite_h import build_suite_h
from generate_suite_p import build_suite_p

FIGCRAFT_CLI = r"C:\Program Files\FigCraft\figcraft-cli.exe"
DESIGN_DIR = r"D:\AllBackup\friendoo\design"
SUITES_DIR = os.path.join(DESIGN_DIR, "suites")
RENDERS_DIR = os.path.join(DESIGN_DIR, "renders")

def run_commands_and_save(builder: ScreenBuilder, output_figcraft_path):
    temp_json = os.path.join(DESIGN_DIR, "_temp_script.json")
    with open(temp_json, "w", encoding="utf-8") as f:
        json.dump(builder.commands, f, indent=2)

    cmd = [FIGCRAFT_CLI, "run", temp_json, "--out", output_figcraft_path]
    print(f"Running FigCraft CLI ({len(builder.commands)} commands) -> {os.path.basename(output_figcraft_path)}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"ERROR running script: {res.stderr}")
        return False
    if os.path.exists(temp_json):
        os.remove(temp_json)
    return True

def convert_to_figma(figcraft_path, fig_path):
    cmd = [FIGCRAFT_CLI, "convert", figcraft_path, fig_path]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Warning converting to figma: {res.stderr}")
    else:
        print(f"Converted to Figma (.fig): {os.path.basename(fig_path)}")

def export_renders(figcraft_path, out_dir):
    cmd = [FIGCRAFT_CLI, "export", figcraft_path, "-o", out_dir, "--format", "png", "--scale", "2"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Warning exporting renders: {res.stderr}")
    else:
        print(f"Rendered 2x PNGs to {out_dir}")

def main():
    start_time = time.time()
    os.makedirs(SUITES_DIR, exist_ok=True)
    os.makedirs(RENDERS_DIR, exist_ok=True)

    print("================================================================================")
    print("Generating Complete 67-Screen Mobile Architecture for Friendoo in FigCraft")
    print("================================================================================")

    suites = [
        ("A_auth_onboarding_legal", build_suite_a, 9),
        ("D_discovery_trust_safety", build_suite_d, 8),
        ("W_wallet_payment_finance", build_suite_w, 11),
        ("C_call_lifecycle_records", build_suite_c, 18),
        ("H_host_earnings_payouts", build_suite_h, 11),
        ("P_profile_privacy_support", build_suite_p, 10),
    ]

    # 1. Build and export each suite individually
    for name, build_fn, count in suites:
        print(f"\n--- Processing Suite {name} ({count} screens) ---")
        builder = ScreenBuilder()
        build_fn(builder, base_row=0)
        
        figcraft_file = os.path.join(SUITES_DIR, f"{name}.figcraft")
        fig_file = os.path.join(SUITES_DIR, f"{name}.fig")
        
        if run_commands_and_save(builder, figcraft_file):
            convert_to_figma(figcraft_file, fig_file)
            export_renders(figcraft_file, RENDERS_DIR)

    # 2. Build the master consolidated file: friendoo_complete_67_screens.figcraft
    print("\n--- Processing Master Complete Suite (67 Screens) ---")
    master = ScreenBuilder()
    build_suite_a(master, base_row=0)
    build_suite_d(master, base_row=1)
    build_suite_w(master, base_row=2)
    build_suite_c(master, base_row=3)
    build_suite_h(master, base_row=4)
    build_suite_p(master, base_row=5)

    master_figcraft = os.path.join(DESIGN_DIR, "friendoo_complete_67_screens.figcraft")
    master_fig = os.path.join(DESIGN_DIR, "friendoo_complete_67_screens.fig")

    if run_commands_and_save(master, master_figcraft):
        convert_to_figma(master_figcraft, master_fig)

    elapsed = time.time() - start_time
    print("\n================================================================================")
    print(f"SUCCESS: Generated All 67 Screens in {elapsed:.2f}s!")
    print(f"Suites Directory: {SUITES_DIR}")
    print(f"Master Document: {master_figcraft}")
    print(f"Master Figma: {master_fig}")
    print(f"Renders Directory: {RENDERS_DIR}")
    print("================================================================================")

if __name__ == "__main__":
    main()
