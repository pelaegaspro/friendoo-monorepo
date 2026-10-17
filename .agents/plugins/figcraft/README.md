# FigCraft Plugin for Antigravity

Integrates [FigCraft](https://figcraft.app) — a native, high-performance Figma alternative — into Antigravity via Model Context Protocol (MCP) and CLI automation.

## Features
- **Native Canvas Operations**: Create frames, rectangles, text, vector nodes, and layouts directly on the FigCraft canvas.
- **Figma Compatibility**: Export native `.fig` binary files directly from FigCraft documents.
- **High-Res Rendering**: Export 1x, 2x, 3x Retina PNG, JPG, and SVG renders for design reviews and mobile QA.
- **MCP Tool Integration**: Full stdio Model Context Protocol support (`create_node`, `set_properties`, `batch`, `export`, `screenshot`, `inspect_document`).

## Usage
FigCraft commands are available through the `figcraft-designer` skill or via the native MCP server.
Executable path: `C:\Program Files\FigCraft\figcraft-cli.exe`
GUI path: `C:\Program Files\FigCraft\figcraft.exe`
