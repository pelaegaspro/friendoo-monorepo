import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:friendoo/core/supabase/supabase_provider.dart';
import 'package:friendoo/core/models/friendoo_models.dart';
import 'package:friendoo/features/profile/data/profile_repository.dart';
import 'package:friendoo/features/discover/data/host_repository.dart';
import 'package:friendoo/features/ads/data/banner_ad_repository.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/app/friendoo_ui.dart';
import 'package:friendoo/core/localization/app_language.dart';
import 'package:friendoo/features/calls/data/call_repository.dart';
import 'package:friendoo/features/profile/presentation/settings_pages.dart';
import 'package:friendoo/features/profile/presentation/profile_input_widgets.dart';
import 'package:friendoo/features/wallet/data/wallet_repository.dart';

void main() {
  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(url: 'https://example.invalid', anonKey: 'test-key',
        authOptions: const FlutterAuthClientOptions(autoRefreshToken: false));
  });
  tearDownAll(() => Supabase.instance.dispose());
  for (final language in AppLanguage.supported) {
    for (final screen in ['wallet', 'calls', 'settings', 'form', 'home', 'profile', 'earnings']) {
      testWidgets('${language.code} $screen fits narrow screen', (tester) async {
        final originalError = FlutterError.onError!;
        FlutterError.onError = (details) { debugPrint(details.toString()); originalError(details); };
        addTearDown(() => FlutterError.onError = originalError);
        tester.view.physicalSize = const Size(320, 740);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        final Widget page = switch (screen) {
          'home' => FriendooDashboardView(hosts: const [HostProfile(id: 'host_01', displayName: 'Example Host', bio: 'Hello', ratePerAudioMinute: 5, isAvailable: true, isStar: false)], onStartCall: (_) {}, onSignOut: () {}, onOpenActivity: () {}, onOpenWallet: () {}),
          'profile' => FriendooProfileView(onSignOut: () {}),
          'earnings' => const FriendooHostEarningsView(),
          'wallet' => const FriendooWalletView(),
          'calls' => FriendooAnalyticsView(onExplore: () {}),
          'settings' => const AppLanguageSettingsPage(),
          _ => const Padding(padding: EdgeInsets.all(20), child: ModernFormSectionHeader(
            title: 'Notification Settings', icon: Icons.settings, badgeText: 'NEW',
          )),
        };
        await tester.pumpWidget(ProviderScope(
          overrides: [
            supabaseProvider.overrideWithValue(Supabase.instance.client),
            currentUserProfileStreamProvider.overrideWith((ref) => Stream.value(null)),
            placementBannerAdsListProvider.overrideWith((ref, placement) => []),
            hostRecentEarningsProvider.overrideWith((ref) async => []),
            hostDashboardStatsProvider.overrideWith((ref) async => const HostDashboardStats(todayEarningsInr: 0, todayCallsCount: 0, isOnline: false, ratePerMinute: 5)),
            appLanguageCodeProvider.overrideWith((ref) => language.code),
            walletStreamProvider.overrideWith((ref) => Stream.value(const WalletSnapshot(coinBalance: 500, isFrozen: false))),
            coinPackagesProvider.overrideWith((ref) async => []),
            walletTransactionsProvider.overrideWith((ref) async => []),
            callHistoryProvider.overrideWith((ref) async => []),
          ],
          child: MaterialApp(
            locale: Locale(language.code),
            supportedLocales: AppLanguage.supported.map((l) => Locale(l.code)),
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.15)),
              child: child!,
            ),
            home: Scaffold(body: page),
          ),
        ));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        final list = find.byType(ListView).first;
        if (screen != 'form' && screen != 'settings') {
          for (var i = 0; i < 7; i++) {
            await tester.drag(list, const Offset(0, -350));
            await tester.pumpAndSettle();
            expect(tester.takeException(), isNull);
          }
        }
        await tester.pumpWidget(const SizedBox());
      });
    }
  }
}
