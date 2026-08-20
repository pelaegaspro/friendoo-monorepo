$ErrorActionPreference = 'Stop'

$root = 'C:\Users\pelae\OneDrive\Desktop\friendoo\flutter_app\lib'
$modelPath = Join-Path $root 'core\models\friendoo_models.dart'
$repoPath = Join-Path $root 'features\discover\data\host_repository.dart'
$appPath = Join-Path $root 'app\friendoo_app.dart'

$model = Get-Content -LiteralPath $modelPath -Raw
if ($model -notmatch 'final bool isStar;') {
  $model = $model.Replace(
    '    required this.isAvailable,',
    "    required this.isAvailable,`r`n    required this.isStar,"
  )
  $model = $model.Replace(
    '  final bool isAvailable;',
    "  final bool isAvailable;`r`n  final bool isStar;"
  )
  $model = $model.Replace(
    "        isAvailable: (map['is_available'] as bool?) ?? false,",
    "        isAvailable: (map['is_available'] as bool?) ?? false,`r`n        isStar: (map['is_star'] as bool?) ?? false,"
  )
  [System.IO.File]::WriteAllText($modelPath, $model, [System.Text.UTF8Encoding]::new($false))
}

$repo = Get-Content -LiteralPath $repoPath -Raw
$repo = $repo.Replace(
  'id, display_name, bio, rate_per_audio_minute, is_available',
  'id, display_name, bio, rate_per_audio_minute, is_available, is_star'
)
[System.IO.File]::WriteAllText($repoPath, $repo, [System.Text.UTF8Encoding]::new($false))

$app = Get-Content -LiteralPath $appPath -Raw
$anchor = @'
                    Positioned(
                      right: 6,
                      bottom: 6,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: colors.secondary,
                          shape: BoxShape.circle,
                          border: Border.all(color: colors.surface, width: 2),
                        ),
                      ),
                    ),
'@

$badge = @'
                    if (host.isStar)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Semantics(
                          label: 'Star host',
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: colors.tertiary,
                              shape: BoxShape.circle,
                              border: Border.all(color: colors.surface, width: 2),
                              boxShadow: [tokens.softShadow],
                            ),
                            child: Icon(
                              Icons.star_rounded,
                              size: 17,
                              color: colors.onTertiary,
                            ),
                          ),
                        ),
                      ),
'@

if ($app -notmatch "label: 'Star host'") {
  if (-not $app.Contains($anchor)) {
    throw 'The avatar status overlay anchor was not found.'
  }
  $app = $app.Replace($anchor, $badge + $anchor)
}

[System.IO.File]::WriteAllText($appPath, $app, [System.Text.UTF8Encoding]::new($false))
Write-Output 'Friendoo star-host data and badge applied.'
