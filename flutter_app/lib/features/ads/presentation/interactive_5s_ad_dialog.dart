import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/models/banner_ad_model.dart';
import '../../../core/models/friendoo_models.dart';
import '../../wallet/presentation/recharge_checkout_sheet.dart';
import '../data/banner_ad_repository.dart';

class Interactive5sAdDialog extends ConsumerStatefulWidget {
  const Interactive5sAdDialog({
    super.key,
    this.ad,
    this.placement = 'interstitial_5s',
    this.onDismiss,
  });

  final CloudBannerAd? ad;
  final String placement;
  final VoidCallback? onDismiss;

  static Future<void> show(
    BuildContext context, {
    CloudBannerAd? ad,
    String placement = 'interstitial_5s',
    VoidCallback? onDismiss,
  }) {
    HapticFeedback.mediumImpact();
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // Must wait for countdown or click
      barrierColor: Colors.black.withValues(alpha: 0.88),
      builder: (_) => Interactive5sAdDialog(
        ad: ad,
        placement: placement,
        onDismiss: onDismiss,
      ),
    );
  }

  @override
  ConsumerState<Interactive5sAdDialog> createState() =>
      _Interactive5sAdDialogState();
}

class _Interactive5sAdDialogState extends ConsumerState<Interactive5sAdDialog>
    with SingleTickerProviderStateMixin {
  int _countdown = 5;
  Timer? _timer;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _startCountdown();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_countdown > 1) {
        setState(() => _countdown--);
      } else {
        setState(() => _countdown = 0);
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _handleRedirect(CloudBannerAd ad) {
    HapticFeedback.selectionClick();
    ref.read(bannerAdRepositoryProvider).recordClick(ad.id);
    Navigator.of(context).pop();

    if (widget.onDismiss != null) {
      widget.onDismiss!();
    }

    if (ad.actionType == 'recharge' || ad.campaignType == 'flash_package') {
      RechargeCheckoutSheet.show(
        context,
        package: CoinPackage(
          id: 'pkg_promo_${ad.id}',
          coins: ad.promoCoins ?? 500,
          amountInr: ad.promoPriceInr ?? 199,
          bonus: ad.promoBonusLabel ?? '+250 Bonus Coins',
        ),
      );
    } else if (ad.actionType == 'link' &&
        ad.actionUrl != null &&
        ad.actionUrl!.trim().isNotEmpty) {
      String url = ad.actionUrl!.trim();
      if (!url.startsWith('http://') &&
          !url.startsWith('https://') &&
          !url.startsWith('market://') &&
          !url.startsWith('whatsapp://')) {
        url = 'https://$url';
      }
      final uri = Uri.tryParse(url);
      if (uri != null) {
        launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final CloudBannerAd ad = widget.ad ??
        ref.watch(placementBannerAdProvider(widget.placement));

    final colors = ad.parsedGradientColors;
    final isFlash = ad.campaignType == 'flash_package' || ad.promoCoins != null;

    return PopScope(
      canPop: _countdown == 0,
      child: Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Container(
          width: double.infinity,
          constraints: const BoxConstraints(maxWidth: 390),
          decoration: BoxDecoration(
            color: const Color(0xFF111322),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: isFlash
                  ? const Color(0xFFFFB703).withValues(alpha: 0.55)
                  : Colors.white.withValues(alpha: 0.16),
              width: 1.8,
            ),
            boxShadow: [
              BoxShadow(
                color: isFlash
                    ? const Color(0xFFFFB703).withValues(alpha: 0.35)
                    : colors.first.withValues(alpha: 0.4),
                blurRadius: 36,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Top Header: Deal Tag & Countdown / Skip Button
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 14, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isFlash
                              ? [const Color(0xFFFFB703), const Color(0xFFFF2A85)]
                              : [const Color(0xFF6366F1), const Color(0xFF8B5CF6)],
                        ),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: (isFlash ? const Color(0xFFFFB703) : const Color(0xFF6366F1))
                                .withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isFlash ? Icons.bolt_rounded : Icons.verified_rounded,
                            size: 14,
                            color: isFlash ? const Color(0xFF0E1020) : Colors.white,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            ad.badgeText.isNotEmpty
                                ? ad.badgeText.toUpperCase()
                                : (isFlash ? '⚡ FLASH DROP' : 'FEATURED OFFER'),
                            style: TextStyle(
                              color: isFlash ? const Color(0xFF0E1020) : Colors.white,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Countdown Progress or Close Button
                    if (_countdown > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 13,
                              height: 13,
                              child: CircularProgressIndicator(
                                value: _countdown / 5.0,
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  isFlash
                                      ? const Color(0xFFFFB703)
                                      : const Color(0xFFFF2A85),
                                ),
                                backgroundColor: Colors.white.withValues(alpha: 0.2),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Skip in ${_countdown}s',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      IconButton(
                        icon: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          Navigator.of(context).pop();
                          if (widget.onDismiss != null) widget.onDismiss!();
                        },
                        tooltip: 'Skip Ad',
                      ),
                  ],
                ),
              ),

              const Divider(color: Color(0xFF1E2135), height: 1),

              // 2. Main High-Conversion Visual Card
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
                child: Column(
                  children: [
                    // Creative Graphic Card
                    Container(
                      width: double.infinity,
                      height: 170,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: colors.length >= 2
                              ? colors
                              : [const Color(0xFF4F46E5), const Color(0xFFDB2777)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: [
                          BoxShadow(
                            color: colors.first.withValues(alpha: 0.45),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
                          ),
                        ],
                        image: (ad.imageUrl != null && ad.imageUrl!.isNotEmpty)
                            ? DecorationImage(
                                image: NetworkImage(ad.imageUrl!),
                                fit: BoxFit.cover,
                                colorFilter: ColorFilter.mode(
                                  Colors.black.withValues(alpha: 0.35),
                                  BlendMode.darken,
                                ),
                              )
                            : null,
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -25,
                            top: -25,
                            child: Container(
                              width: 110,
                              height: 110,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(15),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: isFlash
                                          ? [const Color(0xFFFFB703), const Color(0xFFFF2A85)]
                                          : [Colors.white.withValues(alpha: 0.3), Colors.white.withValues(alpha: 0.1)],
                                    ),
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.3),
                                        blurRadius: 16,
                                      ),
                                    ],
                                  ),
                                  child: Icon(
                                    isFlash
                                        ? Icons.monetization_on_rounded
                                        : Icons.rocket_launch_rounded,
                                    color: Colors.white,
                                    size: 40,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                if (ad.promoCoins != null) ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0E1020).withValues(alpha: 0.8),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: const Color(0xFFFFB703),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Text(
                                      '⚡ ${ad.promoCoins} COINS + BONUS',
                                      style: const TextStyle(
                                        color: Color(0xFFFFB703),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                  ),
                                ] else ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.35),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Text(
                                      '5-SEC INTERACTIVE OFFER',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Headline
                    Text(
                      ad.headline,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.4,
                        height: 1.2,
                      ),
                    ),

                    const SizedBox(height: 6),

                    // Subtitle / Pitch
                    Text(
                      ad.subtitle,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        height: 1.35,
                      ),
                    ),

                    // Pricing details banner if promo package exists
                    if (ad.promoPriceInr != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E2135),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFFFFB703).withValues(alpha: 0.35),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'LIMITED FLASH PRICE',
                                  style: TextStyle(
                                    color: Color(0xFFFFB703),
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  ad.promoBonusLabel ?? '+250 Bonus Coins',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                if (ad.originalPriceInr != null) ...[
                                  Text(
                                    '₹${ad.originalPriceInr}',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.45),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                Text(
                                  '₹${ad.promoPriceInr}',
                                  style: const TextStyle(
                                    color: Color(0xFFFFB703),
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),

                    // 3. High-Energy Pulsing Action Button
                    ScaleTransition(
                      scale: _pulseAnimation,
                      child: SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () => _handleRedirect(ad),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isFlash
                                ? const Color(0xFFFFB703)
                                : const Color(0xFFFF2A85),
                            foregroundColor: isFlash
                                ? const Color(0xFF0E1020)
                                : Colors.white,
                            elevation: 8,
                            shadowColor: (isFlash ? const Color(0xFFFFB703) : const Color(0xFFFF2A85))
                                .withValues(alpha: 0.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                isFlash ? Icons.flash_on_rounded : Icons.arrow_forward_rounded,
                                size: 18,
                                color: isFlash ? const Color(0xFF0E1020) : Colors.white,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                ad.actionType == 'recharge' || isFlash
                                    ? (ad.promoPriceInr != null
                                        ? 'Claim Deal for ₹${ad.promoPriceInr} ➔'
                                        : 'Claim Bonus Recharge ➔')
                                    : 'Visit & Claim Offer ➔',
                                style: TextStyle(
                                  fontSize: 15.5,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.2,
                                  color: isFlash ? const Color(0xFF0E1020) : Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Clarify when an offer opens an external destination.
                    Text(
                      ad.actionType == 'link' && ad.actionUrl != null
                          ? 'Opens an external website or app'
                          : 'See offer details before continuing',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
