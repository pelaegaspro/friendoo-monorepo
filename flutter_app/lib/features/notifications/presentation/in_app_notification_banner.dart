import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/models/notification_model.dart';
import '../../wallet/presentation/recharge_checkout_sheet.dart';

class InAppNotificationOverlay {
  static OverlayEntry? _currentEntry;
  static Timer? _dismissTimer;

  static void show(BuildContext context, PushNotificationItem item) {
    _dismissTimer?.cancel();
    _currentEntry?.remove();
    _currentEntry = null;

    HapticFeedback.mediumImpact();

    final overlayState = Overlay.of(context, rootOverlay: true);

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) => _NotificationToast(
        item: item,
        onDismiss: () {
          _dismissTimer?.cancel();
          if (_currentEntry == entry) {
            _currentEntry?.remove();
            _currentEntry = null;
          }
        },
      ),
    );

    _currentEntry = entry;
    overlayState.insert(entry);

    // Give flash coin sales 7 seconds for users to react, 5 seconds for standard
    final duration = item.isFlashSale
        ? const Duration(seconds: 7)
        : const Duration(seconds: 5);

    _dismissTimer = Timer(duration, () {
      if (_currentEntry == entry) {
        _currentEntry?.remove();
        _currentEntry = null;
      }
    });
  }
}

class _NotificationToast extends StatefulWidget {
  const _NotificationToast({
    required this.item,
    required this.onDismiss,
  });

  final PushNotificationItem item;
  final VoidCallback onDismiss;

  @override
  State<_NotificationToast> createState() => _NotificationToastState();
}

class _NotificationToastState extends State<_NotificationToast>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 340),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0, -1.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap(BuildContext context) {
    widget.onDismiss();

    if (widget.item.actionType == 'recharge' || widget.item.isFlashSale) {
      // Direct 1-tap checkout for the exact flash coin package advertised
      final package = CoinPackage(
        id: 'pkg_flash_${widget.item.id}',
        coins: widget.item.computedCoins,
        amountInr: widget.item.computedPriceInr,
        bonus: widget.item.computedBonus,
      );

      RechargeCheckoutSheet.show(
        context,
        package: package,
      );
    } else if (widget.item.actionType == 'link' &&
        widget.item.actionUrl != null &&
        widget.item.actionUrl!.trim().isNotEmpty) {
      String url = widget.item.actionUrl!.trim();
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
    final item = widget.item;
    final isFlash = item.isFlashSale;

    return Positioned(
      top: MediaQuery.of(context).padding.top + 10,
      left: 14,
      right: 14,
      child: SlideTransition(
        position: _offsetAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Dismissible(
            key: ValueKey('notif_toast_${item.id}'),
            direction: DismissDirection.up,
            onDismissed: (_) => widget.onDismiss(),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _handleTap(context),
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: item.bannerGradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: isFlash
                          ? const Color(0xFFFFB703).withValues(alpha: 0.6)
                          : item.accentColor.withValues(alpha: 0.45),
                      width: isFlash ? 1.8 : 1.4,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: isFlash
                            ? const Color(0xFFFFB703).withValues(alpha: 0.35)
                            : item.accentColor.withValues(alpha: 0.25),
                        blurRadius: isFlash ? 24 : 18,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Leading Icon container
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isFlash
                                    ? [const Color(0xFFFFB703), const Color(0xFFFF2A85)]
                                    : [item.accentColor, item.accentColor.withValues(alpha: 0.7)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: item.accentColor.withValues(alpha: 0.35),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Icon(
                              item.icon,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Title, body & Flash tags
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  children: [
                                    if (item.discountBadge != null || isFlash) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6.5,
                                          vertical: 2,
                                        ),
                                        margin: const EdgeInsets.only(right: 6),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFB703),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          item.discountBadge ?? '⚡ FLASH SALE',
                                          style: const TextStyle(
                                            color: Color(0xFF0E1020),
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ),
                                    ],
                                    Expanded(
                                      child: Text(
                                        item.title,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: -0.2,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      isFlash && item.expiresInMinutes != null
                                          ? '${item.expiresInMinutes}m left'
                                          : 'now',
                                      style: TextStyle(
                                        color: isFlash
                                            ? const Color(0xFFFFB703)
                                            : Colors.white54,
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  item.body,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.88),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(width: 6),

                          // Close icon
                          GestureDetector(
                            onTap: widget.onDismiss,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.close_rounded,
                                size: 14,
                                color: Colors.white70,
                              ),
                            ),
                          ),
                        ],
                      ),

                      // Flash sale 1-tap quick checkout action bar
                      if (isFlash) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFFFFB703).withValues(alpha: 0.3),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.monetization_on_rounded,
                                    color: Color(0xFFFFB703),
                                    size: 15,
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    '${item.computedCoins} Coins',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  if (item.originalPriceInr != null) ...[
                                    const SizedBox(width: 8),
                                    Text(
                                      '₹${item.originalPriceInr}',
                                      style: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.45),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        decoration: TextDecoration.lineThrough,
                                      ),
                                    ),
                                  ],
                                  const SizedBox(width: 5),
                                  Text(
                                    '₹${item.computedPriceInr}',
                                    style: const TextStyle(
                                      color: Color(0xFFFFB703),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFFFB703), Color(0xFFFF2A85)],
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Grab Deal',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    SizedBox(width: 3),
                                    Icon(
                                      Icons.arrow_forward_rounded,
                                      color: Colors.white,
                                      size: 12,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
