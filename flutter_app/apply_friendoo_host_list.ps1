$ErrorActionPreference = 'Stop'

$appPath = 'C:\Users\pelae\OneDrive\Desktop\friendoo\flutter_app\lib\app\friendoo_app.dart'
$app = Get-Content -LiteralPath $appPath -Raw

if ($app -notmatch 'class _HostDiscoveryCard') {
  throw 'The expected host-card widget was not found.'
}

if ($app -notmatch 'final visibleHosts = hosts\.take\(5\)') {
  $app = $app.Replace(
    '    return CustomScrollView(',
    "    final visibleHosts = hosts.take(5).toList(growable: false);`r`n`r`n    return CustomScrollView("
  )
}

$app = $app.Replace(
  '                        ${hosts.length} verified hosts ready to connect',
  '                        ${visibleHosts.length} of ${hosts.length} verified hosts ready to connect'
)

$listStart = $app.IndexOf('        SliverPadding(', $app.IndexOf("Text('Available now'"))
$listEnd = $app.IndexOf('        SliverToBoxAdapter(', $listStart)
if ($listStart -lt 0 -or $listEnd -lt 0 -or $listEnd -le $listStart) {
  throw 'The Discover host grid replacement range could not be found.'
}

$listBlock = @'
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final host = visibleHosts[index];
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index == visibleHosts.length - 1 ? 0 : 12,
                  ),
                  child: _HostListCard(
                    host: host,
                    colorIndex: index,
                    onStartCall: () => onStartCall(host),
                  ),
                );
              },
              childCount: visibleHosts.length,
            ),
          ),
        ),
'@

$app = $app.Substring(0, $listStart) + $listBlock + $app.Substring($listEnd)

$classStart = $app.IndexOf('class _HostDiscoveryCard extends StatelessWidget {')
$classEnd = $app.IndexOf('class _TrustPoint extends StatelessWidget {', $classStart)
if ($classStart -lt 0 -or $classEnd -lt 0 -or $classEnd -le $classStart) {
  throw 'The host-card widget replacement range could not be found.'
}

$listCard = @'
class _HostListCard extends StatelessWidget {
  const _HostListCard({
    required this.host,
    required this.colorIndex,
    required this.onStartCall,
  });

  final HostProfile host;
  final int colorIndex;
  final VoidCallback onStartCall;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final tokens = theme.extension<FriendooDesignTokens>()!;
    final gradient =
        tokens.profileGradients[colorIndex % tokens.profileGradients.length];
    final initial = host.displayName.isEmpty
        ? '?'
        : host.displayName.substring(0, 1).toUpperCase();

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onStartCall,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  gradient: gradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Text(
                        initial,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          color: colors.onPrimary,
                        ),
                      ),
                    ),
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
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            host.displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleMedium,
                          ),
                        ),
                        Icon(
                          Icons.verified_rounded,
                          size: 17,
                          color: colors.tertiary,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      host.bio ?? 'Ready for a safe audio conversation',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelMedium,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _HostDetailPill(
                          icon: Icons.graphic_eq_rounded,
                          label: 'Live now',
                        ),
                        const SizedBox(width: 8),
                        _HostDetailPill(
                          icon: Icons.monetization_on_rounded,
                          label: '${host.ratePerAudioMinute} coins / min',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              IconButton.filled(
                tooltip: 'Start audio call',
                onPressed: onStartCall,
                icon: const Icon(Icons.call_rounded),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HostDetailPill extends StatelessWidget {
  const _HostDetailPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Flexible(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: colors.primaryContainer,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: colors.primary),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: colors.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

'@

$app = $app.Substring(0, $classStart) + $listCard + $app.Substring($classEnd)
[System.IO.File]::WriteAllText($appPath, $app, [System.Text.UTF8Encoding]::new($false))
Write-Output 'Friendoo host list applied.'
