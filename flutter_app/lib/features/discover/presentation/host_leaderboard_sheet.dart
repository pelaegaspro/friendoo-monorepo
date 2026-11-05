import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/models/friendoo_models.dart';

class HostLeaderboardSheet extends StatelessWidget {
  const HostLeaderboardSheet({
    super.key,
    required this.hosts,
    required this.onStartCall,
  });

  final List<HostProfile> hosts;
  final ValueChanged<HostProfile> onStartCall;

  static Future<void> show(
    BuildContext context, {
    required List<HostProfile> hosts,
    required ValueChanged<HostProfile> onStartCall,
  }) {
    HapticFeedback.mediumImpact();
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => HostLeaderboardSheet(
        hosts: hosts,
        onStartCall: onStartCall,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Sort all female hosts by total performance (rating + call volume)
    final femaleHosts = hosts.where((h) => h.isFemale).toList();
    final sortedHosts = List<HostProfile>.from(femaleHosts)
      ..sort((a, b) {
        final scoreA = (a.rating * 1000) + a.totalCalls;
        final scoreB = (b.rating * 1000) + b.totalCalls;
        return scoreB.compareTo(scoreA);
      });

    // 2. Compute Star Host quota using the 3/10 rule (Top 30%: 10 -> 3, 20 -> 6, 30 -> 9)
    final starCount = sortedHosts.isEmpty
        ? 0
        : (sortedHosts.length * 0.3).ceil().clamp(1, sortedHosts.length);

    final top3 = sortedHosts.take(3).toList();
    final remaining = sortedHosts.skip(3).toList();

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF111322),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 14),
          Container(
            width: 44,
            height: 4.5,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFFB703), Color(0xFFFF2A85)],
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'WEEKLY PODIUM',
                            style: TextStyle(
                              color: Color(0xFF0E1020),
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Top $starCount Star Hosts (30%)',
                          style: const TextStyle(
                            color: Color(0xFFFFB703),
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Host Leaderboard 🏆',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close_rounded, size: 18, color: Colors.white70),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const Divider(color: Color(0xFF1E2135), height: 24),

          // Scrollable Content
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
              children: [
                // Top 3 Podium
                if (top3.isNotEmpty) ...[
                  _buildPodium(context, top3),
                  const SizedBox(height: 24),
                ],

                // Ranks 4 to N
                if (remaining.isNotEmpty) ...[
                  const Text(
                    'STAR HOSTS & RISING TALENT',
                    style: TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...remaining.asMap().entries.map((entry) {
                    final rank = entry.key + 4;
                    final host = entry.value;
                    final isStarRank = rank <= starCount;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1A1D30),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isStarRank
                              ? const Color(0xFFFFB703).withValues(alpha: 0.35)
                              : Colors.white.withValues(alpha: 0.08),
                        ),
                      ),
                      child: Row(
                        children: [
                          // Rank Number
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: isStarRank
                                  ? const Color(0xFFFFB703).withValues(alpha: 0.2)
                                  : Colors.white.withValues(alpha: 0.06),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                '#$rank',
                                style: TextStyle(
                                  color: isStarRank
                                      ? const Color(0xFFFFB703)
                                      : Colors.white70,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Host Avatar Initial
                          Container(
                            width: 40,
                            height: 40,
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFF6366F1), Color(0xFFFF2A85)],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                host.displayName.isNotEmpty
                                    ? host.displayName.substring(0, 1).toUpperCase()
                                    : 'H',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Details with safe flexible layout
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        host.displayName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                    if (isStarRank) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 5,
                                          vertical: 1.5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFB703),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          '⭐ STAR',
                                          style: TextStyle(
                                            color: Color(0xFF0E1020),
                                            fontSize: 8.5,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  '⭐ ${host.rating.toStringAsFixed(1)} • 1k+ calls • ₹${host.effectiveRatePerMinute}/min',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Call Action (Checks 3-state host availability)
                          IconButton.filled(
                            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                            onPressed: host.isOnline
                                ? () {
                                    Navigator.of(context).pop();
                                    onStartCall(host);
                                  }
                                : null,
                            style: IconButton.styleFrom(
                              backgroundColor: host.isOnline
                                  ? const Color(0xFF10B981)
                                  : host.isBusy
                                      ? const Color(0xFFF59E0B)
                                      : const Color(0xFF374151),
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: host.isBusy
                                  ? const Color(0xFF92400E)
                                  : const Color(0xFF374151),
                              disabledForegroundColor: Colors.white54,
                            ),
                            icon: Icon(
                              host.isOnline
                                  ? Icons.call_rounded
                                  : host.isBusy
                                      ? Icons.phone_in_talk_rounded
                                      : Icons.call_end_rounded,
                              size: 18,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPodium(BuildContext context, List<HostProfile> top3) {
    final host1 = top3[0];
    final host2 = top3.length > 1 ? top3[1] : null;
    final host3 = top3.length > 2 ? top3[2] : null;

    return Container(
      padding: const EdgeInsets.fromLTRB(10, 20, 10, 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E223D), Color(0xFF121422)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFFFB703).withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // #2 Silver
          if (host2 != null)
            Expanded(
              child: _buildPodiumColumn(
                context,
                host: host2,
                rank: 2,
                medal: '🥈',
                color: const Color(0xFFE5E7EB),
                height: 130,
              ),
            ),

          // #1 Gold (Center & Tallest)
          Expanded(
            child: _buildPodiumColumn(
              context,
              host: host1,
              rank: 1,
              medal: '👑',
              color: const Color(0xFFFFB703),
              height: 160,
              isCenter: true,
            ),
          ),

          // #3 Bronze
          if (host3 != null)
            Expanded(
              child: _buildPodiumColumn(
                context,
                host: host3,
                rank: 3,
                medal: '🥉',
                color: const Color(0xFFD97706),
                height: 115,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPodiumColumn(
    BuildContext context, {
    required HostProfile host,
    required int rank,
    required String medal,
    required Color color,
    required double height,
    bool isCenter = false,
  }) {
    return GestureDetector(
      onTap: host.isOnline
          ? () {
              Navigator.of(context).pop();
              onStartCall(host);
            }
          : null,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Crown / Medal
          Text(medal, style: TextStyle(fontSize: isCenter ? 26 : 20)),
          const SizedBox(height: 4),

          // Avatar
          Container(
            width: isCenter ? 58 : 46,
            height: isCenter ? 58 : 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: color, width: isCenter ? 2.5 : 2),
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.4),
                  blurRadius: isCenter ? 16 : 10,
                ),
              ],
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFFFF2A85)],
              ),
            ),
            child: Center(
              child: Text(
                host.displayName.isNotEmpty ? host.displayName[0].toUpperCase() : 'H',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: isCenter ? 20 : 16,
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),

          // Name
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              host.displayName,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white,
                fontSize: isCenter ? 12.5 : 11,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 2),

          // Calls / Rating
          Text(
            '⭐ ${host.rating.toStringAsFixed(1)}',
            style: TextStyle(
              color: color,
              fontSize: 10.5,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),

          // Podium Pillar
          Container(
            width: double.infinity,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            height: height * 0.45,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color.withValues(alpha: 0.3), color.withValues(alpha: 0.1)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              border: Border.all(color: color.withValues(alpha: 0.5)),
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: TextStyle(
                  color: color,
                  fontSize: isCenter ? 18 : 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
