$ErrorActionPreference = 'Stop'
$headers = @{ Accept = 'application/json, text/event-stream'; 'Content-Type' = 'application/json' }
$payload = @{ jsonrpc = '2.0'; id = 1; method = 'initialize'; params = @{ protocolVersion = '2025-03-26'; capabilities = @{}; clientInfo = @{ name = 'friendoo-local-verifier'; version = '1.0' } } } | ConvertTo-Json -Depth 8 -Compress
$response = Invoke-WebRequest -Uri 'http://localhost:4401/mcp' -Method Post -Headers $headers -Body $payload -TimeoutSec 10 -UseBasicParsing
$response.Headers | Out-File -FilePath 'C:\Users\pelae\penpot-mcp-local\mcp-init-headers.txt'
$response.Content | Out-File -FilePath 'C:\Users\pelae\penpot-mcp-local\mcp-init-body.json'
Write-Output $response.StatusCode
Write-Output $response.Content
