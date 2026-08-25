import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppEnvironment {
  const AppEnvironment({
    required this.supabaseUrl,
    required this.supabasePublishableKey,
    this.backend2PublicUrl = 'https://wqoqeljqzknccyeegtxb.supabase.co',
    this.backend2PublishableKey = '',
  });

  final String supabaseUrl;
  final String supabasePublishableKey;
  final String backend2PublicUrl;
  final String backend2PublishableKey;

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
      backend2PublicUrl:
          dotenv.env['BACKEND_2_PUBLIC_URL'] ??
          'https://wqoqeljqzknccyeegtxb.supabase.co',
      backend2PublishableKey: dotenv.env['BACKEND_2_PUBLISHABLE_KEY'] ?? '',
    );
  }
}

final appEnvironmentProvider = Provider<AppEnvironment>((ref) {
  try {
    return AppEnvironment.fromDotEnv();
  } catch (_) {
    return const AppEnvironment(
      supabaseUrl: 'https://gjbhsogarwqkkftzijhf.supabase.co',
      supabasePublishableKey: 'sb_publishable_default',
    );
  }
});
