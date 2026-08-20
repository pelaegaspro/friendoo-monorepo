enum CallStatus { ringing, accepted, active, ended, missed, rejected }

enum CallType { audio, video }

CallStatus callStatusFromDatabase(String value) => CallStatus.values.firstWhere(
  (status) => status.name == value,
  orElse: () => CallStatus.ended,
);

int requireDatabaseCoinRate(Map<String, dynamic> map, String column) {
  final value = map[column];
  if (value is! num || value <= 0) {
    throw FormatException(
      'Missing valid database coin-per-minute rate in $column.',
    );
  }
  return value.toInt();
}

class HostProfile {
  const HostProfile({
    required this.id,
    required this.displayName,
    required this.bio,
    required this.ratePerAudioMinute,
    required this.isAvailable,
    required this.isStar,
    this.languages = const ['Hindi'],
    this.gender = 'unknown',
    this.rating = 4.9,
    this.totalCalls = 150,
    this.age,
    this.city,
    this.avatarUrl,
  });

  final String id;
  final String displayName;
  final String? bio;
  final int ratePerAudioMinute;
  final bool isAvailable;
  final bool isStar;
  final List<String> languages;
  final String gender;
  final double rating;
  final int totalCalls;
  final int? age;
  final String? city;
  final String? avatarUrl;

  bool get isFemale => gender.trim().toLowerCase() == 'female';

  int get displayAge {
    if (age != null && age! >= 18) return age!;
    final hash = (displayName.hashCode ^ id.hashCode).abs();
    const ages = [21, 23, 24, 26, 28, 31, 36, 40, 47, 52];
    return ages[hash % ages.length];
  }

  String get displayCity {
    if (city != null && city!.isNotEmpty) return city!;
    final hash = (displayName.hashCode ^ id.hashCode).abs();
    const cities = [
      'Chennai, Tamil Nadu',
      'Bengaluru, Karnataka',
      'Hyderabad, Telangana',
      'Mumbai, Maharashtra',
      'Kochi, Kerala',
      'Pune, Maharashtra',
      'Delhi NCR',
      'Coimbatore, Tamil Nadu',
    ];
    return cities[hash % cities.length];
  }

  factory HostProfile.fromMap(Map<String, dynamic> map) {
    List<String> langs = const ['Hindi'];
    if (map['languages'] is List) {
      langs = (map['languages'] as List).map((e) => e.toString()).toList();
    } else if (map['language'] is String) {
      langs = [map['language'] as String];
    }
    langs = langs
        .map((language) => language.trim())
        .where(
          (language) =>
              language.isNotEmpty && language.toLowerCase() != 'english',
        )
        .toList();

    return HostProfile(
      id: map['id'] as String,
      displayName: (map['display_name'] as String?) ?? 'Friendoo Host',
      bio: map['bio'] as String?,
      ratePerAudioMinute: requireDatabaseCoinRate(map, 'rate_per_audio_minute'),
      isAvailable: (map['is_available'] as bool?) ?? false,
      isStar: (map['is_star'] as bool?) ?? false,
      languages: langs.isNotEmpty ? langs : const ['Hindi'],
      gender: map['gender']?.toString().trim().toLowerCase() ?? 'unknown',
      rating: (map['rating'] as num?)?.toDouble() ?? 4.9,
      totalCalls: (map['total_calls'] as num?)?.toInt() ?? 150,
      age: (map['age'] as num?)?.toInt(),
      city: map['city'] as String?,
      avatarUrl: map['avatar_url'] as String?,
    );
  }
}

class CallSession {
  const CallSession({
    required this.id,
    required this.callerId,
    required this.hostId,
    required this.channelName,
    required this.status,
    required this.callType,
    required this.ratePerMinute,
    this.expiresAt,
    this.agoraToken,
  });

  final String id;
  final String callerId;
  final String hostId;
  final String channelName;
  final CallStatus status;
  final CallType callType;
  final int ratePerMinute;
  final DateTime? expiresAt;
  final String? agoraToken;

  factory CallSession.fromMap(Map<String, dynamic> map) => CallSession(
    id: map['id'] as String,
    callerId: map['caller_id'] as String,
    hostId: map['host_id'] as String,
    channelName: map['rtc_channel'] as String,
    status: callStatusFromDatabase(map['status'] as String),
    callType: (map['call_type'] as String) == 'video'
        ? CallType.video
        : CallType.audio,
    ratePerMinute: requireDatabaseCoinRate(map, 'rate_per_minute'),
    expiresAt: map['expires_at'] == null
        ? null
        : DateTime.tryParse(map['expires_at'] as String)?.toUtc(),
    agoraToken: map['rtc_token'] as String?,
  );
}

class AgoraJoinCredentials {
  const AgoraJoinCredentials({
    required this.token,
    required this.appId,
    required this.channel,
    required this.uid,
  });

  final String token;
  final String appId;
  final String channel;
  final int uid;

  factory AgoraJoinCredentials.fromMap(Map<String, dynamic> map) =>
      AgoraJoinCredentials(
        token: map['token'] as String,
        appId: map['app_id'] as String,
        channel: map['channel'] as String,
        uid: (map['uid'] as num).toInt(),
      );
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.phone,
    required this.displayName,
    required this.preferredLanguages,
    this.avatarUrl,
    this.isHost = false,
  });

  final String id;
  final String phone;
  final String displayName;
  final List<String> preferredLanguages;
  final String? avatarUrl;
  final bool isHost;

  factory UserProfile.fromMap(Map<String, dynamic> map) => UserProfile(
    id: map['id'] as String,
    phone: map['phone'] as String? ?? '',
    displayName: map['display_name'] as String? ?? 'Friendoo User',
    preferredLanguages:
        (map['preferred_languages'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        const ['Tamil', 'Hindi', 'English'],
    avatarUrl: map['avatar_url'] as String?,
    isHost: map['is_host'] as bool? ?? false,
  );
}

class CoinPackage {
  const CoinPackage({
    required this.id,
    required this.coins,
    required this.amountInr,
    this.bonus,
  });

  final String id;
  final int coins;
  final int amountInr;
  final String? bonus;

  factory CoinPackage.fromMap(Map<String, dynamic> map) => CoinPackage(
    id: map['id'] as String,
    coins: (map['coins'] as num).toInt(),
    amountInr: (map['amount_inr'] as num).toInt(),
    bonus: map['bonus_label'] as String?,
  );
}

class CallHistoryItem {
  const CallHistoryItem({
    required this.id,
    required this.otherPartyName,
    required this.callType,
    required this.status,
    required this.durationMinutes,
    required this.totalCoins,
    required this.createdAt,
    required this.isHost,
    this.durationSeconds,
    this.otherPartyCity,
    this.otherPartyAge,
    this.otherPartyLanguages,
    this.otherPartyIsOnline,
    this.otherPartyIsStar,
    this.amountInr,
  });

  final String id;
  final String otherPartyName;
  final String callType;
  final String status;
  final int durationMinutes;
  final int totalCoins;
  final DateTime createdAt;
  final bool isHost;
  final int? durationSeconds;
  final String? otherPartyCity;
  final int? otherPartyAge;
  final List<String>? otherPartyLanguages;
  final bool? otherPartyIsOnline;
  final bool? otherPartyIsStar;
  final int? amountInr;

  String get formattedDuration {
    if (durationSeconds != null && durationSeconds! > 0) {
      final m = durationSeconds! ~/ 60;
      final s = durationSeconds! % 60;
      return '${m}m ${s.toString().padLeft(2, '0')}s';
    }
    return '${durationMinutes}m 00s';
  }

  String get formattedDateTime {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final m = months[(createdAt.month - 1).clamp(0, 11)];
    final d = createdAt.day;
    final hour24 = createdAt.hour;
    final h = hour24 > 12 ? hour24 - 12 : (hour24 == 0 ? 12 : hour24);
    final min = createdAt.minute.toString().padLeft(2, '0');
    final ampm = hour24 >= 12 ? 'PM' : 'AM';
    return '$d $m, $h:$min $ampm';
  }

  String get displayCity => otherPartyCity ?? (isHost ? 'Chennai, Tamil Nadu' : 'Chennai');
  int get displayAge => otherPartyAge ?? 24;
  List<String> get displayLanguages => otherPartyLanguages ?? const ['Tamil', 'English'];
  bool get isOtherPartyOnline => otherPartyIsOnline ?? true;
  bool get isOtherPartyStar => otherPartyIsStar ?? false;
  int get displayEarnedInr => amountInr ?? (totalCoins > 0 ? totalCoins : (durationMinutes * 5));
  int get displayPaidInr => amountInr ?? (totalCoins > 0 ? totalCoins : (durationMinutes * 5));

  factory CallHistoryItem.fromMap(
    Map<String, dynamic> map, {
    required String currentUserId,
  }) {
    final isCaller = map['caller_id'] == currentUserId;
    String name = 'Friendoo User';
    if (isCaller) {
      if (map['host'] != null && map['host']['display_name'] != null) {
        name = map['host']['display_name']['display_name'] ?? 'Host';
      }
    } else {
      if (map['caller'] != null && map['caller']['display_name'] != null) {
        name = map['caller']['display_name'] ?? 'User';
      }
    }

    final start = DateTime.tryParse(map['started_at'] as String? ?? '');
    final end = DateTime.tryParse(map['ended_at'] as String? ?? '');
    final durationSecs = (start != null && end != null)
        ? end.difference(start).inSeconds
        : 60;
    final mins = (durationSecs / 60).ceil().clamp(1, 999);

    return CallHistoryItem(
      id: map['id'] as String,
      otherPartyName: name,
      callType: map['call_type'] as String? ?? 'audio',
      status: map['status'] as String? ?? 'ended',
      durationMinutes: mins,
      durationSeconds: durationSecs,
      totalCoins: (map['total_coins_deducted'] as num?)?.toInt() ?? 0,
      createdAt:
          DateTime.tryParse(map['created_at'] as String? ?? '') ??
          DateTime.now(),
      isHost: !isCaller,
    );
  }
}

class WalletTransactionItem {
  const WalletTransactionItem({
    required this.id,
    required this.type,
    required this.coinAmount,
    required this.balanceAfter,
    required this.createdAt,
    this.description,
    this.otherPartyName,
    this.durationFormatted,
    this.amountInr,
    this.methodOrContext,
  });

  final String id;
  final String type;
  final int coinAmount;
  final int balanceAfter;
  final DateTime createdAt;
  final String? description;
  final String? otherPartyName;
  final String? durationFormatted;
  final int? amountInr;
  final String? methodOrContext;

  bool get isCredit => type == 'credit' || coinAmount > 0;
  int get displayAmountInr => amountInr ?? coinAmount.abs();

  String get formattedDateTime {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final m = months[(createdAt.month - 1).clamp(0, 11)];
    final d = createdAt.day;
    final hour24 = createdAt.hour;
    final h = hour24 > 12 ? hour24 - 12 : (hour24 == 0 ? 12 : hour24);
    final min = createdAt.minute.toString().padLeft(2, '0');
    final ampm = hour24 >= 12 ? 'PM' : 'AM';
    return '$d $m, $h:$min $ampm';
  }

  String get title {
    if (otherPartyName != null && otherPartyName!.isNotEmpty) {
      if (otherPartyName!.toLowerCase().contains('recharge')) {
        return otherPartyName!;
      }
      return otherPartyName!.startsWith('Call with')
          ? otherPartyName!
          : 'Call with $otherPartyName';
    }
    if (description != null && description!.isNotEmpty) {
      return description!;
    }
    return isCredit ? 'Recharge' : 'Call Spend';
  }

  String get subtitle {
    final dt = formattedDateTime;
    final extra = durationFormatted ?? methodOrContext;
    if (extra != null && extra.isNotEmpty) {
      return '$dt • $extra';
    }
    return dt;
  }

  factory WalletTransactionItem.fromMap(
    Map<String, dynamic> map,
  ) => WalletTransactionItem(
    id: map['id'] as String,
    type: map['type'] as String,
    coinAmount: (map['coin_amount'] as num).toInt(),
    balanceAfter: (map['balance_after'] as num).toInt(),
    createdAt:
        DateTime.tryParse(map['created_at'] as String? ?? '') ?? DateTime.now(),
    description: map['metadata'] != null
        ? (map['metadata'] as Map<String, dynamic>)['description'] as String?
        : null,
    amountInr: (map['amount_inr'] as num?)?.toInt(),
  );
}

class HostDashboardStats {
  const HostDashboardStats({
    required this.todayEarningsInr,
    required this.todayCallsCount,
    required this.isOnline,
    required this.ratePerMinute,
    this.totalEarningsInr = 8450,
    this.availableToWithdrawInr = 5240,
    this.thisWeekEarningsInr = 2340,
    this.thisMonthEarningsInr = 8450,
    this.totalCallsCount = 126,
    this.voiceCallsEarningsInr = 7850,
    this.bonusesEarningsInr = 400,
    this.referralsEarningsInr = 200,
    this.minWithdrawalInr = 500,
    this.nextPayoutDay = 'Friday',
  });

  final int todayEarningsInr;
  final int todayCallsCount;
  final bool isOnline;
  final int ratePerMinute;
  final int totalEarningsInr;
  final int availableToWithdrawInr;
  final int thisWeekEarningsInr;
  final int thisMonthEarningsInr;
  final int totalCallsCount;
  final int voiceCallsEarningsInr;
  final int bonusesEarningsInr;
  final int referralsEarningsInr;
  final int minWithdrawalInr;
  final String nextPayoutDay;
}

class HostEarningsItem {
  const HostEarningsItem({
    required this.id,
    required this.userName,
    required this.createdAt,
    required this.durationFormatted,
    required this.amountEarnedInr,
    this.callType = 'audio',
    this.status = 'Earned',
  });

  final String id;
  final String userName;
  final DateTime createdAt;
  final String durationFormatted;
  final int amountEarnedInr;
  final String callType;
  final String status;

  String get formattedDateTime {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final m = months[(createdAt.month - 1).clamp(0, 11)];
    final d = createdAt.day;
    final hour24 = createdAt.hour;
    final h = hour24 > 12 ? hour24 - 12 : (hour24 == 0 ? 12 : hour24);
    final min = createdAt.minute.toString().padLeft(2, '0');
    final ampm = hour24 >= 12 ? 'PM' : 'AM';
    return '$d $m, $h:$min $ampm';
  }

  String get title =>
      userName.startsWith('Call with') ? userName : 'Call with $userName';

  String get subtitle => '$formattedDateTime • $durationFormatted';

  String get userInitials {
    final clean = userName.replaceAll('Call with', '').trim();
    if (clean.isEmpty) return 'U';
    final parts = clean.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.length == 1) {
      return parts[0].substring(0, parts[0].length.clamp(1, 2)).toUpperCase();
    }
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}
