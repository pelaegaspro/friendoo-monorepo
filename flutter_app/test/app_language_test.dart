import 'package:flutter_test/flutter_test.dart';

import 'package:friendoo/core/localization/app_language.dart';

void main() {
  test('supports the seven app languages with stable locale codes', () {
    expect(AppLanguage.supported.map((language) => language.code).toList(), [
      'en',
      'hi',
      'ta',
      'te',
      'kn',
      'ml',
      'gu',
    ]);
  });

  test('restores a saved language code and falls back to English', () {
    expect(AppLanguage.fromCode('ta').code, 'ta');
    expect(AppLanguage.fromCode('unknown').code, 'en');
    expect(AppLanguage.fromCode(null).code, 'en');
  });
}
