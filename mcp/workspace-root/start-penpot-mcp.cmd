@echo off
setlocal
cd /d C:\Users\pelae\.cache\penpot-mcp\2.17.0
echo [%date% %time%] Starting rebuilt Penpot MCP 2.17 service...>> C:\Users\pelae\penpot-mcp-local\penpot-mcp.log
call pnpm run start >> C:\Users\pelae\penpot-mcp-local\penpot-mcp.log 2>&1
echo [%date% %time%] Rebuilt Penpot MCP exited with code %errorlevel%.>> C:\Users\pelae\penpot-mcp-local\penpot-mcp.log
