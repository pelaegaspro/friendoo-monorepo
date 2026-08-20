$ErrorActionPreference = 'Stop'

$root = 'C:\Users\pelae\OneDrive\Desktop\friendoo\flutter_app'
$appPath = Join-Path $root 'lib\app\friendoo_app.dart'
$themePath = Join-Path $root 'lib\core\theme\friendoo_theme.dart'
$fragmentPath = Join-Path $root 'friendoo_discover_page.dart'

New-Item -ItemType Directory -Force -Path (Split-Path $themePath) | Out-Null
Invoke-WebRequest -Uri 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663477222610/PzlNvokFBnfZIVjL.dart' -OutFile $themePath
Invoke-WebRequest -Uri 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663477222610/NCtqARMWOBKrvoqM.dart' -OutFile $fragmentPath

$app = Get-Content -LiteralPath $appPath -Raw
$fragment = Get-Content -LiteralPath $fragmentPath -Raw

if ($app -notmatch "core/theme/friendoo_theme.dart") {
  $app = $app.Replace(
    "import 'package:flutter/material.dart';",
    "import 'package:flutter/material.dart';`r`nimport '../core/theme/friendoo_theme.dart';"
  )
}

$themePattern = 'theme:\s*ThemeData\(\s*colorScheme:\s*ColorScheme\.fromSeed\(seedColor:\s*const\s+Color\(0xff7347eb\)\),\s*useMaterial3:\s*true,\s*\),'
if ($app -match $themePattern) {
  $app = [regex]::Replace($app, $themePattern, 'theme: FriendooTheme.light(),', 1)
} elseif ($app -notmatch 'theme:\s*FriendooTheme\.light\(\)') {
  throw 'The existing ThemeData block could not be found.'
}

$start = $app.IndexOf('class DiscoverPage extends ConsumerStatefulWidget {')
$end = $app.IndexOf('class ActiveCallBar extends ConsumerWidget {')
if ($start -lt 0 -or $end -lt 0 -or $end -le $start) {
  throw 'The DiscoverPage replacement range could not be found.'
}

$app = $app.Substring(0, $start) + $fragment + "`r`n`r`n" + $app.Substring($end)
[System.IO.File]::WriteAllText($appPath, $app, [System.Text.UTF8Encoding]::new($false))
Remove-Item -LiteralPath $fragmentPath -Force
Write-Output 'Friendoo home redesign applied.'
