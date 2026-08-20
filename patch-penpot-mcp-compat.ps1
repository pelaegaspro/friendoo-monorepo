$ErrorActionPreference = 'Stop'
$root = 'C:\Users\pelae\.cache\penpot-mcp\2.17.0'
$source = Join-Path $root 'packages\plugin\src\plugin.ts'
$text = Get-Content -LiteralPath $source -Raw
$old = 'const match = version.match(/^(\d+\.\d+\.\d+)/);'
$new = 'const match = version.match(/^(\d+\.\d+)/);'
if (-not $text.Contains($old)) { throw 'Expected compatibility expression was not found.' }
$text = $text.Replace($old, $new)
Set-Content -LiteralPath $source -Value $text -NoNewline
Set-Location $root
pnpm run build
