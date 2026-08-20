$ErrorActionPreference = 'Stop'
$endpoint = 'http://localhost:4401/mcp'
$headers = @{ Accept = 'application/json, text/event-stream'; 'Content-Type' = 'application/json' }
$initializePayload = @{ jsonrpc = '2.0'; id = 101; method = 'initialize'; params = @{ protocolVersion = '2025-03-26'; capabilities = @{}; clientInfo = @{ name = 'friendoo-v2-screen-builder'; version = '1.0' } } } | ConvertTo-Json -Depth 8 -Compress
$initResponse = Invoke-WebRequest -Uri $endpoint -Method Post -Headers $headers -Body $initializePayload -TimeoutSec 20 -UseBasicParsing
$sessionId = $initResponse.Headers['mcp-session-id']
if ([string]::IsNullOrWhiteSpace($sessionId)) { throw 'The local MCP server did not return an MCP session ID.' }
$code = Get-Content -LiteralPath 'D:\AllBackup\friendoo\friendoo_penpot_v2_33_screens.js' -Raw
$toolHeaders = @{ Accept = 'application/json, text/event-stream'; 'Content-Type' = 'application/json'; 'Mcp-Session-Id' = $sessionId }
$toolPayload = @{ jsonrpc = '2.0'; id = 102; method = 'tools/call'; params = @{ name = 'execute_code'; arguments = @{ code = $code } } } | ConvertTo-Json -Depth 10 -Compress
$started = Get-Date
try {
  $toolResponse = Invoke-WebRequest -Uri $endpoint -Method Post -Headers $toolHeaders -Body $toolPayload -TimeoutSec 240 -UseBasicParsing
  $toolResponse.Content | Out-File -LiteralPath 'C:\Users\pelae\penpot-mcp-local\friendoo-33-screen-build-result.txt' -Encoding utf8
  Write-Output ("SESSION=" + $sessionId)
  Write-Output ("STATUS=" + $toolResponse.StatusCode)
  Write-Output ("ELAPSED_SECONDS=" + [Math]::Round(((Get-Date) - $started).TotalSeconds, 1))
  Write-Output $toolResponse.Content
} catch {
  $_ | Out-String | Out-File -LiteralPath 'C:\Users\pelae\penpot-mcp-local\friendoo-33-screen-build-error.txt' -Encoding utf8
  Write-Output ("SESSION=" + $sessionId)
  Write-Output ("ELAPSED_SECONDS=" + [Math]::Round(((Get-Date) - $started).TotalSeconds, 1))
  throw
}
