import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../../../core/config/ads_config.dart';

class LiveAdBannerWidget extends StatefulWidget {
  const LiveAdBannerWidget({
    super.key,
    this.placement = 'user_top_banner',
    this.adSize = AdSize.banner,
  });

  final String placement;
  final AdSize adSize;

  @override
  State<LiveAdBannerWidget> createState() => _LiveAdBannerWidgetState();
}

class _LiveAdBannerWidgetState extends State<LiveAdBannerWidget> {
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;
  bool _attemptedTestAd = false;

  static const _googleTestBannerAdUnitId =
      'ca-app-pub-3940256099942544/6300978111';

  @override
  void initState() {
    super.initState();
    _loadAd();
  }

  void _loadAd({bool useTestId = false}) {
    final adUnit = useTestId || kDebugMode
        ? _googleTestBannerAdUnitId
        : AdsConfig.googleBannerAdUnitId;

    try {
      _bannerAd = BannerAd(
        adUnitId: adUnit,
        size: widget.adSize,
        request: const AdRequest(),
        listener: BannerAdListener(
          onAdLoaded: (ad) {
            if (mounted) {
              setState(() {
                _isAdLoaded = true;
              });
            }
          },
          onAdFailedToLoad: (ad, error) {
            ad.dispose();
            if (mounted) {
              if (!_attemptedTestAd && !useTestId) {
                _attemptedTestAd = true;
                _loadAd(useTestId: true);
              } else {
                setState(() {
                  _bannerAd = null;
                  _isAdLoaded = false;
                });
              }
            }
          },
        ),
      )..load();
    } catch (_) {
      if (mounted) {
        setState(() {
          _bannerAd = null;
          _isAdLoaded = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isAdLoaded && _bannerAd != null) {
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          width: _bannerAd!.size.width.toDouble(),
          height: _bannerAd!.size.height.toDouble(),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: AdWidget(ad: _bannerAd!),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
