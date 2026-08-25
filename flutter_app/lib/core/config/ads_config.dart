/// Centralized configuration for Google AdMob
class AdsConfig {
  AdsConfig._();

  // ===========================================================================
  // GOOGLE ADS (ADMOB) KEYS
  // ===========================================================================

  /// Google AdMob Application ID for Android
  /// Registered in AndroidManifest.xml: com.google.android.gms.ads.APPLICATION_ID
  static const String googleAppIdAndroid =
      'ca-app-pub-6548038981488497~2915536041';

  /// Google AdMob Banner Ad Unit ID (Top Discover / Host Lounge)
  static const String googleBannerAdUnitId =
      'ca-app-pub-6548038981488497/5496604296';

  /// Google AdMob Interstitial Ad Unit ID
  static const String googleInterstitialAdUnitId =
      'ca-app-pub-3940256099942544/1033173712';

  /// Google AdMob Rewarded Ad Unit ID
  static const String googleRewardedAdUnitId =
      'ca-app-pub-3940256099942544/5224354917';

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /// Returns true if live AdMob keys have been configured
  static bool get isGoogleConfigured =>
      googleBannerAdUnitId.isNotEmpty &&
      googleBannerAdUnitId != 'ca-app-pub-3940256099942544/6300978111';
}
