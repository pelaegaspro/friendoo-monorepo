import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  AppConstants._();

  // App Info
  static const String appName = 'Friendoo';
  static const String tagline = 'Connect. Chat. Call.';

  // Firebase Collections
  static const String usersCollection = 'users';
  static const String hostsCollection = 'hosts';
  static const String chatsCollection = 'chats';
  static const String messagesCollection = 'messages';
  static const String callsCollection = 'calls';
  static const String coinTransactionsCollection = 'coinTransactions';
  static const String coinPackagesCollection = 'coinPackages';
  static const String ratingsCollection = 'ratings';
  static const String reportsCollection = 'reports';
  static const String withdrawalsCollection = 'withdrawals';
  static const String referralsCollection = 'referrals';
  static const String blockedUsersCollection = 'blockedUsers';
  static const String blockedMessagesCollection = 'blockedMessages';
  static const String adRewardsCollection = 'adRewards';
  static const String notificationsCollection = 'notifications';
  static const String adminSessionsCollection = 'adminSessions';
  static const String reEngagementOffersCollection = 'reEngagementOffers';
  static const String analyticsEventsCollection = 'analyticsEvents';

  // Default Values
  static const int defaultCoins = 0;
  static const int minAge = 18;
  static const int maxAge = 50;

  // Languages
  static const List<String> availableLanguages = [
    'Hindi',
    'English',
    'Tamil',
    'Telugu',
    'Bengali',
    'Marathi',
    'Kannada',
    'Punjabi',
    'Gujarati',
  ];

  // Avatar Counts
  static const int maleAvatarCount = 10;
  static const int femaleAvatarCount = 12;

  // Routes - Shared
  static const String routeSplash = '/splash';
  static const String routeOnboarding = '/onboarding';
  static const String routeLogin = '/login';
  static const String routeOtp = '/otp';
  static const String routeRoleSelect = '/role-select';
  static const String routeVerifyDisclaimer = '/verify-disclaimer';
  static const String routeVerifyFace = '/verify-face';
  static const String routeVerifyVoice = '/verify-voice';

  // Routes - User
  static const String routeUserProfileSetup = '/user/profile-setup';
  static const String routeHome = '/home';
  static const String routeHost = '/host/:hostId';
  static const String routeChat = '/chat/:hostId';
  static const String routeAudioCall = '/audio-call/:hostId';
  static const String routeVideoCall = '/video-call/:hostId';
  static const String routeHistory = '/history';
  static const String routeRewards = '/rewards';
  static const String routeWallet = '/wallet';
  static const String routeUserProfile = '/user/profile';
  static const String routeProfile = routeUserProfile;
  static const String routeReEngagement = '/re-engagement';

  // Routes - Host
  static const String routeHostProfileSetup = '/host/profile-setup';
  static const String routeUpiSetup = '/host/upi-setup';
  static const String routePendingApproval = '/host/pending-approval';
  static const String routeDashboard = '/dashboard';
  static const String routeHostChats = '/host/chats';
  static const String routeHostChat = '/host/chat/:userId';
  static const String routeIncomingCall = '/host/incoming-call/:callId';
  static const String routeHostAudioCall = '/host/audio-call/:callId';
  static const String routeHostVideoCall = '/host/video-call/:callId';
  static const String routeEarnings = '/host/earnings';
  static const String routeWithdrawal = '/host/withdrawal';
  static const String routeHostProfile = '/host/profile';

  // Agora
  static String get agoraAppId =>
      dotenv.env['AGORA_APP_ID'] ?? 'AGORA_APP_ID';

  // Razorpay
  static String get razorpayKeyId =>
      dotenv.env['RAZORPAY_KEY_ID'] ?? 'RAZORPAY_KEY';

  // AdMob
  static String get admobAppId =>
      dotenv.env['ADMOB_APP_ID'] ?? 'ADMOB_APP_ID';

  // User Types
  static const String userTypeUser = 'user';
  static const String userTypeHost = 'host';

  // Host Status
  static const String hostStatusPending = 'pending';
  static const String hostStatusApproved = 'approved';
  static const String hostStatusRejected = 'rejected';

  // Verification
  static const int maxVerificationAttempts = 3;
  static const int verificationBlockHours = 24;
  static const int faceDetectionConfidenceThreshold = 80;
  static const double eyeOpenProbabilityThreshold = 0.3;
  static const int voiceRecordingMaxSeconds = 15;
  static const int voiceRecordingMinSeconds = 2;

  // Shared Preferences Keys
  static const String prefHasSeenOnboarding = 'has_seen_onboarding';
  static const String prefLastPhoneNumber = 'last_phone_number';
  static const String prefUserType = 'user_type';
  static const String prefReferralCode = 'referral_code';

  // Coin Packages (Default - will be overridden from Firestore)
  static const List<Map<String, dynamic>> defaultCoinPackages = [
    {
      'coins': 100,
      'price': 99,
      'bonus': 0,
      'label': 'Starter',
      'isPopular': false,
      'isActive': true,
    },
    {
      'coins': 500,
      'price': 449,
      'bonus': 25,
      'label': 'Popular',
      'isPopular': true,
      'isActive': true,
    },
    {
      'coins': 1000,
      'price': 849,
      'bonus': 75,
      'label': 'Value',
      'isPopular': false,
      'isActive': true,
    },
    {
      'coins': 2000,
      'price': 1599,
      'bonus': 200,
      'label': 'Best Value',
      'isPopular': false,
      'isActive': true,
    },
  ];

  // Call Status
  static const String callStatusRinging = 'ringing';
  static const String callStatusOngoing = 'ongoing';
  static const String callStatusEnded = 'ended';
  static const String callStatusFailed = 'failed';

  // Transaction Types
  static const String txnTypePurchase = 'purchase';
  static const String txnTypeSpent = 'spent';

  // Welcome Bonus
  static const int welcomeBonusCoins = 25;
  static const int referralBonusCoins = 25;

  // Daily Login Bonus
  static const int dailyLoginBonusCoins = 2;

  // Ad Rewards
  static const int adsPerDayForReward = 5;
  static const int freeMinutesPerAdReward = 2;
  static const int weeklyStreakDays = 7;
  static const int weeklyStreakBonusMinutes = 5;
  static const int maxAdsPerDay = 5;

  // Talk Rewards
  static const int talkRewardMinutesThreshold = 10;
  static const int talkRewardFreeMinutes = 2;

  // Free Messages
  static const int freeMessagesPerDay = 5;

  // Re-engagement
  static const int inactiveDaysForReEngagement = 15;
  static const int reEngagementBonusCoins = 10;

  // Call Settings
  static const int callRingingTimeoutSeconds = 30;
  static const int callLowBalanceWarningMinutes = 1;
  static const int callAutoEndCountdownSeconds = 10;
  static const int firstSecondsFree = 5;
  static const int silenceWarningThreshold = 3;

  // Low Coins Threshold
  static const int lowCoinsThreshold = 50;

  // Splash Duration
  static const int splashDurationMs = 2000;

  // OTP Resend Timeout
  static const int otpResendTimeoutSeconds = 60;

  // Chat
  static const int chatMessagesPerPage = 50;

  // Hosts
  static const int hostsPerPage = 20;

  // Withdrawal
  static const int minWithdrawalAmountINR = 100;
  static const double hostCoinValueINR = 0.5;
  static const double hostEarningPercentage = 0.6;

  // GST
  static const double gstPercentage = 18.0;

  // Normal Host Rates
  static const int normalRatePerMessage = 5;
  static const int normalRatePerAudioMinute = 5;
  static const int normalRatePerVideoMinute = 10;

  // Expert Host Rates
  static const int expertRatePerMessage = 7;
  static const int expertRatePerAudioMinute = 7;
  static const int expertRatePerVideoMinute = 15;

  // Expert Requirements
  static const double minExpertRating = 4.5;
  static const int minExpertReviews = 50;

  // Report Thresholds
  static const int hostReportThreshold = 3;
}
