import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';

final rewardsProvider =
    StateNotifierProvider<RewardsNotifier, RewardsState>((ref) {
  return RewardsNotifier();
});

class RewardsState {
  final bool isLoading;
  final int adsWatchedToday;
  final int freeMinutesEarned;
  final int weeklyStreak;
  final bool dailyBonusClaimed;
  final int talkMinutesTotal;
  final String? error;
  final String? successMessage;

  RewardsState({
    this.isLoading = false,
    this.adsWatchedToday = 0,
    this.freeMinutesEarned = 0,
    this.weeklyStreak = 0,
    this.dailyBonusClaimed = false,
    this.talkMinutesTotal = 0,
    this.error,
    this.successMessage,
  });

  RewardsState copyWith({
    bool? isLoading,
    int? adsWatchedToday,
    int? freeMinutesEarned,
    int? weeklyStreak,
    bool? dailyBonusClaimed,
    int? talkMinutesTotal,
    String? error,
    String? successMessage,
  }) {
    return RewardsState(
      isLoading: isLoading ?? this.isLoading,
      adsWatchedToday: adsWatchedToday ?? this.adsWatchedToday,
      freeMinutesEarned: freeMinutesEarned ?? this.freeMinutesEarned,
      weeklyStreak: weeklyStreak ?? this.weeklyStreak,
      dailyBonusClaimed: dailyBonusClaimed ?? this.dailyBonusClaimed,
      talkMinutesTotal: talkMinutesTotal ?? this.talkMinutesTotal,
      error: error,
      successMessage: successMessage,
    );
  }

  int get adsRemaining => AppConstants.adsPerDayForReward - adsWatchedToday;
  bool get canWatchAd => adsRemaining > 0;
  bool get earnedAdReward => adsWatchedToday >= AppConstants.adsPerDayForReward;
  int get talkRewardProgress =>
      talkMinutesTotal % AppConstants.talkRewardMinutesThreshold;
  double get progressPercentage {
    if (AppConstants.adsPerDayForReward == 0) return 0;
    return adsWatchedToday / AppConstants.adsPerDayForReward;
  }
}

class RewardsNotifier extends StateNotifier<RewardsState> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  RewardsNotifier() : super(RewardsState());

  Future<void> loadRewardsData(String userId) async {
    state = state.copyWith(isLoading: true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now().toIso8601String().split('T')[0];

      // Load ad data
      final lastAdDate = prefs.getString('last_ad_date') ?? '';
      final adsToday = lastAdDate == today ? prefs.getInt('ads_today') ?? 0 : 0;
      final freeMinutes = (adsToday ~/ AppConstants.adsPerDayForReward) *
          AppConstants.freeMinutesPerAdReward;

      // Load weekly streak
      final weeklyStreak = prefs.getInt('weekly_streak') ?? 0;
      final dailyBonusClaimed = prefs.getString('daily_bonus_date') == today;

      // Load user data
      final userDoc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId)
          .get();

      final talkMinutes = userDoc.data()?['totalCallMinutes'] as int? ?? 0;

      state = state.copyWith(
        isLoading: false,
        adsWatchedToday: adsToday,
        freeMinutesEarned: freeMinutes,
        weeklyStreak: weeklyStreak,
        dailyBonusClaimed: dailyBonusClaimed,
        talkMinutesTotal: talkMinutes,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load rewards');
    }
  }

  Future<bool> claimDailyBonus(String userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now().toIso8601String().split('T')[0];

      if (prefs.getString('daily_bonus_date') == today) {
        state = state.copyWith(error: 'Already claimed today');
        return false;
      }

      final userRef =
          _firestore.collection(AppConstants.usersCollection).doc(userId);

      await _firestore.runTransaction((transaction) async {
        final userDoc = await transaction.get(userRef);
        final currentCoins = userDoc.data()?['coins'] as int? ?? 0;

        transaction.update(userRef, {
          'coins': currentCoins + AppConstants.dailyLoginBonusCoins,
        });
      });

      await prefs.setString('daily_bonus_date', today);

      state = state.copyWith(
        dailyBonusClaimed: true,
        successMessage:
            'Daily bonus claimed! +${AppConstants.dailyLoginBonusCoins} coins',
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Failed to claim bonus');
      return false;
    }
  }

  Future<bool> recordAdWatch(String userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now().toIso8601String().split('T')[0];

      final lastDate = prefs.getString('last_ad_date') ?? '';
      int adsToday = lastDate == today ? prefs.getInt('ads_today') ?? 0 : 0;
      int weeklyStreak = prefs.getInt('weekly_streak') ?? 0;

      if (adsToday >= AppConstants.maxAdsPerDay) {
        state = state.copyWith(error: 'Maximum ads reached for today');
        return false;
      }

      adsToday++;

      // Check if target reached
      int freeMinutes = state.freeMinutesEarned;
      if (adsToday == AppConstants.adsPerDayForReward) {
        freeMinutes += AppConstants.freeMinutesPerAdReward;

        // Update weekly streak
        final lastStreakDate = prefs.getString('last_streak_date') ?? '';
        final yesterday = DateTime.now()
            .subtract(const Duration(days: 1))
            .toIso8601String()
            .split('T')[0];

        if (lastStreakDate == yesterday) {
          weeklyStreak++;
        } else {
          weeklyStreak = 1;
        }

        // Weekly bonus
        if (weeklyStreak >= AppConstants.weeklyStreakDays) {
          freeMinutes += AppConstants.weeklyStreakBonusMinutes;
          weeklyStreak = 0;
        }

        await prefs.setString('last_streak_date', today);
        await prefs.setInt('weekly_streak', weeklyStreak);

        // Update user
        final userRef =
            _firestore.collection(AppConstants.usersCollection).doc(userId);
        await userRef.update({
          'freeMinutesBalance': FieldValue.increment(AppConstants
                  .freeMinutesPerAdReward +
              (weeklyStreak == 0 ? AppConstants.weeklyStreakBonusMinutes : 0)),
        });
      }

      await prefs.setString('last_ad_date', today);
      await prefs.setInt('ads_today', adsToday);

      state = state.copyWith(
        adsWatchedToday: adsToday,
        freeMinutesEarned: freeMinutes,
        weeklyStreak: weeklyStreak,
        successMessage:
            'Ad watched! ${adsToday}/${AppConstants.adsPerDayForReward}',
      );
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Failed to record ad');
      return false;
    }
  }
}
