import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/host_model.dart';
import '../../../services/analytics_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/host_provider.dart';

class HostProfileScreen extends ConsumerWidget {
  final String hostId;
  const HostProfileScreen({super.key, required this.hostId});

  Future<void> _startCall(
    BuildContext context,
    HostModel host,
    int coins,
    int rate,
  ) async {
    await AppAnalyticsService.logCallStartAttempt(host);
    if (!context.mounted) return;

    try {
      final latestDoc = await FirebaseFirestore.instance
          .collection(AppConstants.hostsCollection)
          .doc(host.uid)
          .get(const GetOptions(source: Source.server));
      if (!context.mounted) return;
      final latestHost =
          latestDoc.exists ? HostModel.fromFirestore(latestDoc) : host;

      if (!latestHost.isOnline) {
        await AppAnalyticsService.logCallStartBlocked(host, 'host_offline');
        if (!context.mounted) return;
        _showSnack(context, 'Host is offline right now');
        return;
      }

      if (latestHost.isOnCall) {
        await AppAnalyticsService.logCallStartBlocked(host, 'host_busy');
        if (!context.mounted) return;
        _showSnack(context, 'Host is busy on another call');
        return;
      }
    } catch (_) {
      await AppAnalyticsService.logCallStartBlocked(host, 'network_check');
      if (!context.mounted) return;
      _showSnack(context, 'Check your internet connection and try again');
      return;
    }

    if (coins < rate) {
      await AppAnalyticsService.logCallStartBlocked(host, 'insufficient_coins');
      if (!context.mounted) return;
      context.push('/wallet/add-money');
      return;
    }

    final micPermission = await Permission.microphone.request();
    if (!context.mounted) return;
    if (!micPermission.isGranted) {
      await AppAnalyticsService.logCallStartBlocked(host, 'microphone_denied');
      if (!context.mounted) return;
      _showSnack(context, 'Microphone permission is needed to start a call');
      return;
    }

    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final channelId =
        '${uid}_${host.uid}_${DateTime.now().millisecondsSinceEpoch}';
    if (context.mounted) {
      context.go('/call/$channelId', extra: {
        'hostId': host.uid,
        'hostName': host.name,
      });
    }
  }

  void _showSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hostAsync = ref.watch(hostProvider(hostId));
    final userCoinsAsync = ref.watch(userCoinsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: hostAsync.when(
        data: (host) {
          if (host == null) {
            return const Center(
              child: Text('Host not found',
                  style: TextStyle(color: AppColors.textPrimary)),
            );
          }

          final rate = host.isExpert
              ? AppConstants.expertRatePerAudioMinute
              : AppConstants.normalRatePerAudioMinute;

          return Stack(
            children: [
              // Full screen photo / avatar area
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: MediaQuery.of(context).size.height * 0.60,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _HostProfilePhoto(host: host),
                    // Gradient overlay
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 200,
                      child: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.transparent, AppColors.background],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                      ),
                    ),
                    // Host name on photo
                    Positioned(
                      bottom: 60,
                      left: 20,
                      right: 20,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                host.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 26,
                                  fontWeight: FontWeight.bold,
                                  shadows: [
                                    Shadow(color: Colors.black54, blurRadius: 8)
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.verified,
                                  color: AppColors.accent, size: 20),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: List.generate(5, (i) {
                              return Icon(
                                i < host.rating.round()
                                    ? Icons.star
                                    : Icons.star_border,
                                color: const Color(0xFFFFD740),
                                size: 16,
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Back button
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 12,
                child: GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_back_ios_new,
                        color: Colors.white, size: 18),
                  ),
                ),
              ),
              // Info card (slides up)
              Positioned(
                top: MediaQuery.of(context).size.height * 0.54,
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  decoration: const BoxDecoration(
                    color: AppColors.background,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Handle
                        Center(
                          child: Container(
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: AppColors.divider,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Name + badge
                        Row(
                          children: [
                            Text(
                              host.name,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.verified,
                                color: AppColors.accent, size: 18),
                            if (host.isExpert) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFD740)
                                      .withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: const Color(0xFFFFD740)),
                                ),
                                child: const Text(
                                  'EXPERT',
                                  style: TextStyle(
                                    color: Color(0xFFFFD740),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Rating
                        Row(
                          children: [
                            ...List.generate(
                                5,
                                (i) => Icon(
                                      i < host.rating.round()
                                          ? Icons.star
                                          : Icons.star_border,
                                      color: const Color(0xFFFFD740),
                                      size: 18,
                                    )),
                            const SizedBox(width: 6),
                            Text(
                              '${host.rating.toStringAsFixed(1)} (${host.reviewCount} reviews)',
                              style: const TextStyle(
                                  color: AppColors.textSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            _TrustStat(
                              icon: Icons.call_rounded,
                              label: 'Calls',
                              value: _compactCount(host.totalCalls),
                            ),
                            const SizedBox(width: 10),
                            _TrustStat(
                              icon: host.isVerified
                                  ? Icons.verified_rounded
                                  : Icons.flash_on_rounded,
                              label: host.isVerified ? 'Status' : 'Reply',
                              value: host.isVerified
                                  ? 'Verified'
                                  : host.responseTimeLabel,
                            ),
                            const SizedBox(width: 10),
                            _TrustStat(
                              icon: Icons.star_rounded,
                              label: 'Reviews',
                              value: '${host.reviewCount}',
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Languages
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: host.languages
                              .map((l) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                          color: AppColors.primary
                                              .withValues(alpha: 0.4)),
                                    ),
                                    child: Text(
                                      l,
                                      style: const TextStyle(
                                        color: AppColors.primary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: 16),
                        // Age
                        Row(
                          children: [
                            const Icon(Icons.cake_outlined,
                                color: AppColors.textSecondary, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              '${host.age} years old',
                              style: const TextStyle(
                                  color: AppColors.textSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // About
                        const Text(
                          'About',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          host.bio.isNotEmpty
                              ? host.bio
                              : 'Hi! I\'m ${host.name}. I love connecting with new people and having meaningful conversations. Let\'s talk!',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 20),
                        // Reviews header
                        const Text(
                          'Recent Reviews',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _ReviewItem(
                            name: 'Rahul K.',
                            rating: 5,
                            comment: 'Amazing conversation!'),
                        _ReviewItem(
                            name: 'Priya M.',
                            rating: 4,
                            comment: 'Very friendly and fun to talk to.'),
                      ],
                    ),
                  ),
                ),
              ),
              // Fixed bottom bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                  decoration: const BoxDecoration(
                    color: AppColors.card,
                    border: Border(top: BorderSide(color: AppColors.divider)),
                  ),
                  child: userCoinsAsync.when(
                    data: (coins) {
                      final canCall =
                          host.isOnline && !host.isOnCall && coins >= rate;
                      return Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '$rate coins/min',
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    'Your balance: $coins coins',
                                    style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: GestureDetector(
                                  onTap: canCall
                                      ? () => _startCall(
                                            context,
                                            host,
                                            coins,
                                            rate,
                                          )
                                      : !host.isOnline
                                          ? null
                                          : host.isOnCall
                                              ? null
                                              : () => context
                                                  .go('/wallet/add-money'),
                                  child: Container(
                                    height: 48,
                                    decoration: BoxDecoration(
                                      gradient: canCall
                                          ? AppColors.purpleGradient
                                          : null,
                                      color: canCall ? null : AppColors.divider,
                                      borderRadius: BorderRadius.circular(12),
                                      boxShadow: canCall
                                          ? [
                                              BoxShadow(
                                                color: AppColors.primary
                                                    .withValues(alpha: 0.4),
                                                blurRadius: 12,
                                                offset: const Offset(0, 4),
                                              )
                                            ]
                                          : null,
                                    ),
                                    child: Center(
                                      child: Text(
                                        canCall
                                            ? 'Call Now'
                                            : !host.isOnline
                                                ? 'Host Offline'
                                                : host.isOnCall
                                                    ? 'Host Busy'
                                                    : 'Add Coins',
                                        style: TextStyle(
                                          color: canCall
                                              ? Colors.white
                                              : AppColors.textSecondary,
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      );
                    },
                    loading: () => const Center(
                        child: CircularProgressIndicator(
                            color: AppColors.primary)),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
            child: Text('Error: $e',
                style: const TextStyle(color: AppColors.error))),
      ),
    );
  }
}

class _HostProfilePhoto extends StatelessWidget {
  final HostModel host;

  const _HostProfilePhoto({required this.host});

  @override
  Widget build(BuildContext context) {
    if (host.photoUrl.isEmpty) {
      return _HostProfileFallback(host: host);
    }

    return CachedNetworkImage(
      imageUrl: host.photoUrl,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(color: const Color(0xFF1A0A3E)),
      errorWidget: (_, __, ___) => _HostProfileFallback(host: host),
    );
  }
}

class _HostProfileFallback extends StatelessWidget {
  final HostModel host;

  const _HostProfileFallback({required this.host});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF1A0A3E),
      child: Center(
        child: Text(
          host.name.isNotEmpty ? host.name[0].toUpperCase() : '?',
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 100,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class _TrustStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _TrustStat({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 18),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _compactCount(int value) {
  if (value >= 100000) return '${(value / 100000).toStringAsFixed(1)}L';
  if (value >= 1000) return '${(value / 1000).toStringAsFixed(1)}K';
  return '$value';
}

class _ReviewItem extends StatelessWidget {
  final String name;
  final int rating;
  final String comment;
  const _ReviewItem(
      {required this.name, required this.rating, required this.comment});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(name,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13)),
              const Spacer(),
              ...List.generate(
                  5,
                  (i) => Icon(
                        i < rating ? Icons.star : Icons.star_border,
                        color: const Color(0xFFFFD740),
                        size: 14,
                      )),
            ],
          ),
          const SizedBox(height: 4),
          Text(comment,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }
}
