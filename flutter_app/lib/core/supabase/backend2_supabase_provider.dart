import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_environment.dart';

/// Dedicated Lazy Read-Only Client for Backend 2 (Discover Promo & Public Feature Config)
///
/// Security boundaries:
/// 1. Completely isolated from Backend 1 (Auth, PostgreSQL, Agora, Wallets, Calls).
/// 2. NEVER receives or forwards Backend 1 JWT or user session tokens.
/// 3. Does not use persistSession or autoRefreshToken.
/// 4. Connects strictly to Backend 2 (wqoqeljqzknccyeegtxb) using public publishable key.
final backend2SupabaseClientProvider = Provider<SupabaseClient?>((ref) {
  final env = ref.watch(appEnvironmentProvider);
  final url = env.backend2PublicUrl;
  final anonKey = env.backend2PublishableKey;

  if (url.isEmpty || anonKey.isEmpty || !url.startsWith('http')) {
    return null;
  }

  try {
    return SupabaseClient(
      url,
      anonKey,
      authOptions: const AuthClientOptions(
        authFlowType: AuthFlowType.implicit,
        autoRefreshToken: false,
      ),
    );
  } catch (_) {
    return null;
  }
});
