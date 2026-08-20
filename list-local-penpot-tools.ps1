$ErrorActionPreference = 'Stop'
$sessionId = '7392f22b-33dd-4a08-a396-5b51ac1f07b7'
$headers = @{ Accept = 'application/json, text/event-stream'; 'Content-Type' = 'application/json'; 'Mcp-Session-Id' = $sessionId }
$payload = @{ jsonrpc = '2.0'; id = 2; method = 'tools/list'; params = @{} } | ConvertTo-Json -Depth 6 -Compress
$response = Invoke-WebRequest -Uri 'http://localhost:4401/mcp' -Method Post -Headers $headers -Body $payload -TimeoutSec 15 -UseBasicParsing
$response.Content | Out-File -FilePath 'C:\Users\pelae\penpot-mcp-local\mcp-tools-list.txt'
Write-Output $response.Content
