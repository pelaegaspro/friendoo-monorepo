import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/phone_login_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/auth/screens/profile_setup_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/user/screens/home_screen.dart';
import '../../features/user/screens/host_profile_screen.dart';
import '../../features/user/screens/profile_screen.dart';
import '../../features/user/screens/account_center_screens.dart';
import '../../features/calls/screens/call_screen.dart';
import '../../features/calls/screens/call_summary_screen.dart';
import '../../features/wallet/screens/wallet_screen.dart';
import '../../features/wallet/screens/add_money_screen.dart';
import '../../features/host/screens/host_screen.dart';
import '../../features/host_dashboard/screens/host_dashboard_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final user = FirebaseAuth.instance.currentUser;
      final loc = state.matchedLocation;
      const hostSharedRoutes = <String>{
        '/profile',
        '/wallet',
        '/wallet/add-money',
        '/call-history',
        '/settings',
        '/help-support',
        '/privacy-policy',
        '/terms-of-service',
      };

      // Always allow splash, onboarding, login, otp
      final isPublicRoute = loc == '/splash' ||
          loc == '/onboarding' ||
          loc == '/login' ||
          loc == '/otp';

      if (user == null) {
        if (isPublicRoute) return null;
        return '/login';
      }

      // Logged in — check profile completion
      if (isPublicRoute && loc != '/splash') return null;

      // Skip Firestore check for profile-setup itself
      if (loc == '/profile-setup') return null;

      try {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();

        final profileComplete =
            doc.exists && (doc.data()?['profileComplete'] as bool? ?? false);

        if (!profileComplete) return '/profile-setup';

        final role = doc.data()?['role'] as String? ?? 'user';

        // Redirect host away from user routes
        if (role == 'host' &&
            !loc.startsWith('/host') &&
            !hostSharedRoutes.contains(loc)) {
          return '/host-dashboard';
        }

        // Redirect user away from host routes
        if (role == 'user' &&
            (loc.startsWith('/host-dashboard') || loc == '/host-room')) {
          return '/home';
        }

        // Redirect splash to correct home
        if (loc == '/splash') {
          return role == 'host' ? '/host-dashboard' : '/home';
        }
      } catch (_) {
        // Firestore error — let through
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (c, s) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (c, s) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (c, s) => const PhoneLoginScreen()),
      GoRoute(
        path: '/otp',
        builder: (c, s) => OtpScreen(phoneNumber: s.extra as String? ?? ''),
      ),
      GoRoute(
          path: '/profile-setup',
          builder: (c, s) => const ProfileSetupScreen()),
      GoRoute(path: '/home', builder: (c, s) => const HomeScreen()),
      GoRoute(path: '/profile', builder: (c, s) => const ProfileScreen()),
      GoRoute(
        path: '/call-history',
        builder: (c, s) => const CallHistoryScreen(),
      ),
      GoRoute(path: '/settings', builder: (c, s) => const SettingsScreen()),
      GoRoute(
        path: '/help-support',
        builder: (c, s) => const HelpSupportScreen(),
      ),
      GoRoute(
        path: '/privacy-policy',
        builder: (c, s) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: '/terms-of-service',
        builder: (c, s) => const TermsOfServiceScreen(),
      ),
      GoRoute(
        path: '/host-profile/:id',
        builder: (c, s) => HostProfileScreen(hostId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/call/:channelId',
        builder: (c, s) {
          final extra = s.extra as Map<String, dynamic>? ?? {};
          return CallScreen(
            channelId: s.pathParameters['channelId']!,
            hostId: extra['hostId'] as String? ?? '',
            hostName: extra['hostName'] as String? ?? 'Host',
          );
        },
      ),
      GoRoute(
        path: '/call-summary',
        builder: (c, s) {
          final extra = s.extra as Map<String, dynamic>? ?? {};
          return CallSummaryScreen(
            hostName: extra['hostName'] as String? ?? 'Host',
            durationSeconds: extra['durationSeconds'] as int? ?? 0,
            coinsUsed: extra['coinsUsed'] as int? ?? 0,
            remainingCoins: extra['remainingCoins'] as int? ?? 0,
            callDocId: extra['callDocId'] as String?,
          );
        },
      ),
      GoRoute(path: '/wallet', builder: (c, s) => const WalletScreen()),
      GoRoute(
          path: '/wallet/add-money', builder: (c, s) => const AddMoneyScreen()),
      GoRoute(path: '/host-room', builder: (c, s) => const HostScreen()),
      GoRoute(
          path: '/host-dashboard',
          builder: (c, s) => const HostDashboardScreen()),
    ],
  );
});
