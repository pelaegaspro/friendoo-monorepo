$ErrorActionPreference = 'Stop'
$work = 'C:\Users\pelae\penpot-mcp-local'
$launcher = Join-Path $work 'start-penpot-mcp.cmd'
$pidFile = Join-Path $work 'penpot-mcp.pid'
$process = Start-Process -FilePath $env:ComSpec -ArgumentList @('/c', $launcher) -WorkingDirectory $work -WindowStyle Hidden -PassThru
$process.Id | Set-Content -LiteralPath $pidFile
Write-Output "Started Penpot MCP launcher process $($process.Id)"
