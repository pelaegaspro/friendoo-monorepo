import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:friendoo/core/localization/app_language.dart';
import 'package:friendoo/core/localization/app_strings.dart';
import 'package:friendoo/core/localization/app_translations.dart';
import 'package:friendoo/features/profile/presentation/settings_pages.dart';

class LanguageTestApp extends ConsumerWidget {
  const LanguageTestApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp(
    locale: Locale(ref.watch(appLanguageCodeProvider)),
    supportedLocales: AppLanguage.supported.map((value) => Locale(value.code)),
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    home: Builder(
      builder: (context) => Scaffold(
        body: Column(
          children: [
            const AppText('Wallet'),
            const Text('Wallet', key: ValueKey('user-content')),
            TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const AppLanguageSettingsPage()),
              ),
              child: const Text('open-settings'),
            ),
          ],
        ),
      ),
    ),
  );
}

void main() {
  test('every localized label has all six non-English translations', () {
    for (final entry in appTranslations.entries) {
      expect(entry.value, hasLength(6), reason: entry.key);
      expect(entry.value.every((value) => value.trim().isNotEmpty), isTrue, reason: entry.key);
    }
    expect(translateAppText('Wallet', 'unknown'), 'Wallet');
    expect(translateAppText('A user message', 'ta'), 'A user message');
  });

  for (final language in AppLanguage.supported.skip(1)) {
    testWidgets('${language.code}: changes open routes, persists, restores and returns to English', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      SharedPreferences.setMockInitialValues({});
      await tester.pumpWidget(const ProviderScope(child: LanguageTestApp()));
      await tester.pumpAndSettle();
      expect(find.text('Wallet'), findsNWidgets(2)); // Interface label and user text.
      await tester.tap(find.text('open-settings'));
      await tester.pumpAndSettle();
      await tester.tap(find.text(language.name));
      await tester.pumpAndSettle();
      expect(find.text(translateAppText('App language', language.code)), findsOneWidget);
      final preferences = await SharedPreferences.getInstance();
      expect(preferences.getString('friendoo_app_language'), language.code);
      await tester.tap(find.byIcon(Icons.arrow_back_rounded));
      await tester.pumpAndSettle();
      expect(find.text(translateAppText('Wallet', language.code)), findsOneWidget);
      expect(tester.widget<Text>(find.byKey(const ValueKey('user-content'))).data, 'Wallet');
      await tester.pumpWidget(const SizedBox());
      await tester.pumpWidget(ProviderScope(
        overrides: [
          appLanguageCodeProvider.overrideWith((ref) => AppLanguage.fromCode(
            preferences.getString('friendoo_app_language'),
          ).code),
        ],
        child: const LanguageTestApp(),
      ));
      await tester.pumpAndSettle();
      expect(find.text(translateAppText('Wallet', language.code)), findsOneWidget);
      await tester.tap(find.text('open-settings'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('English'));
      await tester.pumpAndSettle();
      expect(preferences.getString('friendoo_app_language'), 'en');
      await tester.tap(find.byIcon(Icons.arrow_back_rounded));
      await tester.pumpAndSettle();
      expect(find.text('Wallet'), findsNWidgets(2));
      expect(tester.takeException(), isNull);
    });
  }
}
