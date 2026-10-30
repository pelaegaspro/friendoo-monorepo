import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/models/banner_ad_model.dart';
import '../../../core/models/friendoo_models.dart';
import '../../wallet/presentation/recharge_checkout_sheet.dart';
import '../data/banner_ad_repository.dart';

class CloudBannerAdCard extends ConsumerStatefulWidget {
  const CloudBannerAdCard({
    super.key,
    this.placement = 'user_top_banner',
    this.customAd,
    this.openInteractiveDialogOnTap = false,
    this.onTap,
  });

  final String placement;
  final CloudBannerAd? customAd;
  final bool openInteractiveDialogOnTap;
  final VoidCallback? onTap;

  @override
  ConsumerState<CloudBannerAdCard> createState() => _CloudBannerAdCardState();
}

class _CloudBannerAdCardState extends ConsumerState<CloudBannerAdCard> {
  late final PageController _pageController;
  Timer? _autoSlideTimer;
  int _currentPage = 0;
  final Set<String> _recordedImpressions = {};

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.96);
    _startAutoSlide();
  }

  void _startAutoSlide() {
    _autoSlideTimer?.cancel();
    _autoSlideTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (!mounted || !_pageController.hasClients) return;
      final ads = _getAdsList();
      if (ads.length <= 1) return;

      final nextPage = (_currentPage + 1) % ads.length;
      _pageController.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  List<CloudBannerAd> _getAdsList() {
    if (widget.customAd != null) {
      return [widget.customAd!];
    }
    return ref.read(placementBannerAdsListProvider(widget.placement));
  }

  void _handleAdTap(CloudBannerAd ad) {
    // Record analytics click with placement
    ref.read(bannerAdRepositoryProvider).recordClick(ad.id, placement: widget.placement);

    if (widget.onTap != null) {
      widget.onTap!();
      return;
    }

    final isFlash = ad.campaignType == 'flash_package' || ad.promoCoins != null;

    // DIRECT ACTION
    if (ad.actionType == 'recharge' || isFlash) {
      RechargeCheckoutSheet.show(
        context,
        package: CoinPackage(
          id: 'pkg_promo_${ad.id}',
          coins: ad.promoCoins ?? 200,
          amountInr: ad.promoPriceInr ?? 99,
          bonus: ad.promoBonusLabel ?? '+100 Bonus Coins',
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
  void dispose() {
    _autoSlideTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ads = _getAdsList();
    if (ads.isEmpty) return const SizedBox.shrink();

    // Record impression for currently visible ad
    final currentAd = ads[_currentPage % ads.length];
    if (!_recordedImpressions.contains(currentAd.id) &&
        !currentAd.id.startsWith('default_')) {
      _recordedImpressions.add(currentAd.id);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref.read(bannerAdRepositoryProvider).recordImpression(currentAd.id, placement: widget.placement);
        }
      });
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 116,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
              _startAutoSlide(); // Cleanly reset/restart the 6-second timer upon manual swipe!
            },
            itemCount: ads.length,
            itemBuilder: (context, index) {
              final ad = ads[index];
              final colors = ad.parsedGradientColors;
              final isFlash =
                  ad.campaignType == 'flash_package' || ad.promoCoins != null;
              final isSponsored = ad.isSponsored;

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _handleAdTap(ad),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        gradient: isSponsored
                            ? const LinearGradient(
                                colors: [Color(0xFF161B26), Color(0xFF1F293D)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              )
                            : LinearGradient(
                                colors: colors.length >= 2
                                    ? colors
                                    : [
                                        const Color(0xFF4F46E5),
                                        const Color(0xFFDB2777),
                                      ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isFlash
                              ? const Color(0xFFFFB703).withValues(alpha: 0.7)
                              : (isSponsored
                                  ? const Color(0xFF262D40)
                                  : Colors.white.withValues(alpha: 0.1)),
                          width: isFlash ? 1.5 : 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: (isSponsored ? const Color(0xFF7C3AED) : colors.first).withValues(
                              alpha: isFlash ? 0.35 : 0.22,
                            ),
                            blurRadius: isFlash ? 14 : 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isFlash
                                  ? const Color(0xFFFFB703)
                                  : (isSponsored
                                      ? const Color(0xFF7C3AED).withValues(alpha: 0.25)
                                      : Colors.white.withValues(alpha: 0.22)),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              isFlash
                                  ? Icons.bolt_rounded
                                  : (isSponsored
                                      ? Icons.campaign_rounded
                                      : Icons.local_offer_rounded),
                              color: isFlash
                                  ? const Color(0xFF0E1020)
                                  : (isSponsored
                                      ? const Color(0xFFEC4899)
                                      : Colors.white),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 3.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Flexible(
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 7,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isFlash
                                                ? const Color(0xFFFFB703)
                                                : (isSponsored
                                                    ? const Color(0xFF7C3AED).withValues(alpha: 0.3)
                                                    : Colors.white.withValues(alpha: 0.25)),
                                            borderRadius: BorderRadius.circular(6),
                                            border: isSponsored
                                                ? Border.all(color: const Color(0xFF7C3AED).withValues(alpha: 0.5), width: 0.8)
                                                : null,
                                          ),
                                          child: Text(
                                            isSponsored
                                                ? (ad.sponsorName != null && ad.sponsorName!.trim().isNotEmpty
                                                    ? 'SPONSORED • ${ad.sponsorName!.toUpperCase()}'
                                                    : 'SPONSORED')
                                                : (ad.badgeText.isNotEmpty
                                                    ? ad.badgeText.toUpperCase()
                                                    : (isFlash
                                                          ? '⚡ FLASH DEAL'
                                                          : 'OFFER')),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              color: isFlash
                                                  ? const Color(0xFF0E1020)
                                                  : (isSponsored
                                                      ? const Color(0xFFF1F5F9)
                                                      : Colors.white),
                                              fontSize: 9,
                                              fontWeight: FontWeight.w900,
                                              letterSpacing: 0.4,
                                            ),
                                          ),
                                        ),
                                      ),
                                      if (ad.promoPriceInr != null &&
                                          !ad.badgeText.contains('₹')) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.black.withValues(
                                              alpha: 0.3,
                                            ),
                                            borderRadius: BorderRadius.circular(5),
                                          ),
                                          child: Text(
                                            '₹${ad.promoPriceInr}',
                                            style: const TextStyle(
                                              color: Color(0xFFFFB703),
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                Text(
                                  ad.headline,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  ad.subtitle,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isSponsored || ad.actionType == 'link'
                                  ? Icons.open_in_new_rounded
                                  : Icons.arrow_forward_ios_rounded,
                              color: Colors.white,
                              size: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        if (ads.length > 1) ...[
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(ads.length, (dotIndex) {
              final isSelected = dotIndex == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 2.5),
                width: isSelected ? 16 : 5,
                height: 4.5,
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF6366F1)
                      : const Color(0xFF94A3B8).withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
        ],
      ],
    );
  }
}
