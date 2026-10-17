---
name: figcraft-designer
description: Design native mobile screens, UI components, and vector layouts with FigCraft, operating via native MCP and exporting directly to Figma (.fig) and high-res PNG.
---

# FigCraft Designer Skill

This skill allows you to programmatically design UI screens, wireframes, and production layouts using FigCraft, a native desktop Figma alternative.

## Capabilities
1. **MCP Control**: Connect to `figcraft-cli.exe mcp` to run commands, inspect canvas state, create nodes (`create_node`), update styling (`set_properties`), batch operations (`batch`), and export assets.
2. **Batch Scripting**: Generate rich `.figcraft` document files and render them using `figcraft-cli.exe export` or `render`.
3. **Figma Interop**: Convert any `.figcraft` document directly to a Figma `.fig` file using `figcraft-cli.exe convert <input.figcraft> <output.fig>`.
4. **Visual Previews**: Export 2x Retina PNG renders for immediate visual review and user presentation.

## CLI Reference
- Binary path: `C:\Program Files\FigCraft\figcraft-cli.exe`
- GUI path: `C:\Program Files\FigCraft\figcraft.exe`
- Command runner: `figcraft-cli.exe run <script.js>`
- Document export: `figcraft-cli.exe export <file.figcraft> --format png --scale 2 -o <out_dir>`
- Figma conversion: `figcraft-cli.exe convert <file.figcraft> <file.fig>`
- MCP server: `figcraft-cli.exe mcp`
