import 'package:flutter_riverpod/legacy.dart';

class AppLanguage {
  const AppLanguage({required this.code, required this.name});

  final String code;
  final String name;

  static const english = AppLanguage(code: 'en', name: 'English');

  static const supported = [
    english,
    AppLanguage(code: 'hi', name: 'Hindi (हिन्दी)'),
    AppLanguage(code: 'ta', name: 'Tamil (தமிழ்)'),
    AppLanguage(code: 'te', name: 'Telugu (తెలుగు)'),
    AppLanguage(code: 'kn', name: 'Kannada (ಕನ್ನಡ)'),
    AppLanguage(code: 'ml', name: 'Malayalam (മലയാളം)'),
    AppLanguage(code: 'gu', name: 'Gujarati (ગુજરાતી)'),
  ];

  static AppLanguage fromCode(String? code) {
    return supported.firstWhere(
      (language) => language.code == code,
      orElse: () => english,
    );
  }
}

final appLanguageCodeProvider = StateProvider<String>(
  (ref) => AppLanguage.english.code,
);
