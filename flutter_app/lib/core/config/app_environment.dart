import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnvironment {
  const AppEnvironment({
    required this.supabaseUrl,
    required this.supabasePublishableKey,
  });

  final String supabaseUrl;
  final String supabasePublishableKey;

  factory AppEnvironment.fromDotEnv() {
    String requiredValue(String key) {
      final value = dotenv.env[key];
      if (value == null || value.isEmpty || value.startsWith('replace_')) {
        throw StateError('Missing required environment value: $key');
      }
      return value;
    }

    return AppEnvironment(
      supabaseUrl: requiredValue('SUPABASE_URL'),
      supabasePublishableKey: requiredValue('SUPABASE_PUBLISHABLE_KEY'),
    );
  }
}
