import 'package:flutter/widgets.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/friendoo_app.dart';
import 'core/config/app_environment.dart';
import 'core/models/friendoo_models.dart';
import 'features/profile/data/profile_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: 'assets/.env');

  final environment = AppEnvironment.fromDotEnv();
  await Supabase.initialize(
    url: environment.supabaseUrl,
    anonKey: environment.supabasePublishableKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  bool hasSavedSession = false;
  bool initialIsHost = false;

  try {
    final prefs = await SharedPreferences.getInstance();
    final savedPhone = prefs.getString('friendoo_saved_phone');
    final savedIsHost = prefs.getBool('friendoo_saved_is_host') ?? false;
    final savedDisplayName =
        prefs.getString('friendoo_saved_display_name') ?? '';
    final savedUserId = prefs.getString('friendoo_saved_user_id') ?? '';

    if (savedPhone != null && savedPhone.isNotEmpty) {
      final isKnownHost = savedPhone.contains('7604991136') || savedIsHost;
      final isTesterUser = savedPhone.contains('8870947891');
      ProfileRepository.currentActiveProfile = UserProfile(
        id: savedUserId.isNotEmpty
            ? savedUserId
            : (isKnownHost
                  ? '00000000-0000-0000-0000-007604991136'
                  : '00000000-0000-0000-0000-008870947891'),
        phone: savedPhone,
        displayName: savedDisplayName.isNotEmpty
            ? savedDisplayName
            : (isKnownHost
                  ? 'Testing Host'
                  : (isTesterUser ? 'VIP Tester' : 'User')),
        preferredLanguages: const ['Tamil', 'Hindi', 'English'],
        avatarUrl: 'user_01',
        isHost: isKnownHost && !isTesterUser,
      );
      hasSavedSession = true;
      initialIsHost = isKnownHost && !isTesterUser;
    }
  } catch (_) {}

  try {
    await MobileAds.instance.initialize();
  } catch (_) {}

  runApp(
    ProviderScope(
      overrides: [
        if (hasSavedSession) ...[
          hasEnteredAppProvider.overrideWith((ref) => true),
          isHostModeProvider.overrideWith((ref) => initialIsHost),
        ],
      ],
      child: const FriendooApp(),
    ),
  );
}
