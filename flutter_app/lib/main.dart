import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:shared_preferences/shared_preferences.dart';

import 'app/friendoo_app.dart';
import 'core/config/app_environment.dart';

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

  try {
    final prefs = await SharedPreferences.getInstance();
    final savedHasEntered =
        prefs.getBool('friendoo_saved_has_entered') ?? false;
    final authUser = Supabase.instance.client.auth.currentUser;
    hasSavedSession = authUser != null || savedHasEntered;
  } catch (_) {}

  if (!kIsWeb) {
    try {
      await MobileAds.instance.initialize();
    } catch (_) {}
  }

  runApp(
    ProviderScope(
      overrides: [
        if (hasSavedSession) ...[
          hasEnteredAppProvider.overrideWith((ref) => true),
        ],
      ],
      child: const FriendooApp(),
    ),
  );
}
