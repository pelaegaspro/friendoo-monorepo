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

enum HostVipTier {
  silver('Silver Host', '🥈', 1.0, 0xFF9CA3AF),
  gold('Gold Host', '🥇', 1.2, 0xFFF59E0B),
  diamond('Diamond VIP', '💎', 1.5, 0xFF00D2E0),
  star('Star Celebrity', '⭐', 2.0, 0xFFFF2A85);

  const HostVipTier(
    this.displayName,
    this.icon,
    this.multiplier,
    this.colorHex,
  );
  final String displayName;
  final String icon;
  final double multiplier;
  final int colorHex;
}

enum NetworkQualityLevel {
  excellent('Excellent (HD)', 0xFF10B981, 45),
  good('Good', 0xFFF59E0B, 110),
  poor('Poor (High Latency)', 0xFFEF4444, 320),
  reconnecting('Reconnecting...', 0xFF6B7280, 800);

  const NetworkQualityLevel(this.label, this.colorHex, this.avgPingMs);
  final String label;
  final int colorHex;
  final int avgPingMs;
}

enum HostStatus {
  online('ONLINE', '🟢', 0xFF10B981, 0xFFECFDF5),
  busy('IN CALL', '🟡', 0xFFF59E0B, 0xFFFEF3C7),
  offline('OFFLINE', '⚪', 0xFF6B7280, 0xFFF3F4F6);

  const HostStatus(this.label, this.icon, this.colorHex, this.bgColorHex);
  final String label;
  final String icon;
  final int colorHex;
  final int bgColorHex;
}

class HostProfile {
  const HostProfile({
    required this.id,
    required this.displayName,
    required this.bio,
    required this.ratePerAudioMinute,
    required this.isAvailable,
    required this.isStar,
    this.status = HostStatus.online,
    this.languages = const ['Hindi'],
    this.gender = 'unknown',
    this.rating = 4.9,
    this.totalCalls = 150,
    this.age,
    this.city,
    this.avatarUrl,
    this.vipTier = HostVipTier.silver,
    this.isFavorite = false,
    this.isSurgeActive = false,
  });

  final String id;
  final String displayName;
  final String? bio;
  final int ratePerAudioMinute;
  final bool isAvailable;
  final bool isStar;
  final HostStatus status;
  final List<String> languages;
  final String gender;
  final double rating;
  final int totalCalls;
  final int? age;
  final String? city;
  final String? avatarUrl;
  final HostVipTier vipTier;
  final bool isFavorite;
  final bool isSurgeActive;

  bool get isFemale => gender.trim().toLowerCase() == 'female';
  bool get isOnline => status == HostStatus.online && isAvailable;
  bool get isBusy => status == HostStatus.busy;
  bool get isOffline => status == HostStatus.offline || !isAvailable;

  /// Effective coin rate per minute including VIP tier multiplier and peak surge
  int get effectiveRatePerMinute {
    double base = ratePerAudioMinute > 0 ? ratePerAudioMinute.toDouble() : 5.0;
    if (isSurgeActive) base *= 1.5;
    return base.round().clamp(1, 100);
  }

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

  HostProfile copyWith({
    String? id,
    String? displayName,
    String? bio,
    int? ratePerAudioMinute,
    bool? isAvailable,
    bool? isStar,
    HostStatus? status,
    List<String>? languages,
    String? gender,
    double? rating,
    int? totalCalls,
    int? age,
    String? city,
    String? avatarUrl,
    HostVipTier? vipTier,
    bool? isFavorite,
    bool? isSurgeActive,
  }) {
    return HostProfile(
      id: id ?? this.id,
      displayName: displayName ?? this.displayName,
      bio: bio ?? this.bio,
      ratePerAudioMinute: ratePerAudioMinute ?? this.ratePerAudioMinute,
      isAvailable: isAvailable ?? this.isAvailable,
      isStar: isStar ?? this.isStar,
      status: status ?? this.status,
      languages: languages ?? this.languages,
      gender: gender ?? this.gender,
      rating: rating ?? this.rating,
      totalCalls: totalCalls ?? this.totalCalls,
      age: age ?? this.age,
      city: city ?? this.city,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      vipTier: vipTier ?? this.vipTier,
      isFavorite: isFavorite ?? this.isFavorite,
      isSurgeActive: isSurgeActive ?? this.isSurgeActive,
    );
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

    final isStarVal = (map['is_star'] as bool?) ?? false;
    final isAvailableVal = (map['is_available'] as bool?) ?? false;
    final isBusyVal = (map['is_busy'] as bool?) ?? false;
    final totalCallsVal = (map['total_calls'] as num?)?.toInt() ?? 150;

    // Resolve VIP Tier based on rating and calls
    HostVipTier resolvedTier = HostVipTier.silver;
    if (isStarVal) {
      resolvedTier = HostVipTier.star;
    } else if (totalCallsVal > 300) {
      resolvedTier = HostVipTier.diamond;
    } else if (totalCallsVal > 150) {
      resolvedTier = HostVipTier.gold;
    }

    final HostStatus resolvedStatus = !isAvailableVal
        ? HostStatus.offline
        : (isBusyVal ? HostStatus.busy : HostStatus.online);

    return HostProfile(
      id: map['id'] as String,
      displayName: (map['display_name'] as String?) ?? 'Host',
      bio: map['bio'] as String?,
      ratePerAudioMinute: requireDatabaseCoinRate(map, 'rate_per_audio_minute'),
      isAvailable: isAvailableVal,
      isStar: isStarVal,
      status: resolvedStatus,
      languages: langs.isNotEmpty ? langs : const ['Hindi'],
      gender: map['gender']?.toString().trim().toLowerCase() ?? 'unknown',
      rating: (map['rating'] as num?)?.toDouble() ?? 4.9,
      totalCalls: totalCallsVal,
      age: (map['age'] as num?)?.toInt(),
      city: map['city'] as String?,
      avatarUrl: map['avatar_path'] as String? ?? map['avatar_url'] as String?,
      vipTier: resolvedTier,
      isFavorite: (map['is_favorite'] as bool?) ?? false,
      isSurgeActive: (map['is_surge'] as bool?) ?? false,
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
    this.networkQuality = NetworkQualityLevel.excellent,
    this.latencyMs = 45,
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
  final NetworkQualityLevel networkQuality;
  final int latencyMs;

  CallSession copyWith({
    String? id,
    String? callerId,
    String? hostId,
    String? channelName,
    CallStatus? status,
    CallType? callType,
    int? ratePerMinute,
    DateTime? expiresAt,
    String? agoraToken,
    NetworkQualityLevel? networkQuality,
    int? latencyMs,
  }) {
    return CallSession(
      id: id ?? this.id,
      callerId: callerId ?? this.callerId,
      hostId: hostId ?? this.hostId,
      channelName: channelName ?? this.channelName,
      status: status ?? this.status,
      callType: callType ?? this.callType,
      ratePerMinute: ratePerMinute ?? this.ratePerMinute,
      expiresAt: expiresAt ?? this.expiresAt,
      agoraToken: agoraToken ?? this.agoraToken,
      networkQuality: networkQuality ?? this.networkQuality,
      latencyMs: latencyMs ?? this.latencyMs,
    );
  }

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
    networkQuality: NetworkQualityLevel.excellent,
    latencyMs: 45,
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

class VideoSdkJoinCredentials {
  const VideoSdkJoinCredentials({
    required this.token,
    required this.roomId,
    required this.participantId,
    required this.apiKey,
    this.rateInrPerMin = 0.38,
  });

  final String token;
  final String roomId;
  final String participantId;
  final String apiKey;
  final double rateInrPerMin;

  factory VideoSdkJoinCredentials.fromMap(Map<String, dynamic> map) =>
      VideoSdkJoinCredentials(
        token: map['token'] as String? ?? '',
        roomId: map['room_id'] as String? ?? '',
        participantId: map['participant_id'] as String? ?? '',
        apiKey: map['api_key'] as String? ?? '',
        rateInrPerMin: (map['rate_inr_per_min'] as num?)?.toDouble() ?? 0.38,
      );
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.phone,
    required this.displayName,
    required this.preferredLanguages,
    this.avatarUrl,
    this.avatarSelectedAt,
    this.isHost = false,
  });

  final String id;
  final String phone;
  final String displayName;
  final List<String> preferredLanguages;
  final String? avatarUrl;
  final DateTime? avatarSelectedAt;
  final bool isHost;

  bool get isAvatarSelectionLocked => avatarSelectedAt != null;

  factory UserProfile.fromMap(Map<String, dynamic> map) => UserProfile(
    id: map['id'] as String,
    phone: map['phone'] as String? ?? '',
    displayName: map['display_name'] as String? ?? 'User',
    preferredLanguages:
        (map['preferred_languages'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        const ['Tamil', 'Hindi', 'English'],
    avatarUrl: map['avatar_path'] as String? ?? map['avatar_url'] as String?,
    avatarSelectedAt: DateTime.tryParse(
      map['avatar_selected_at']?.toString() ?? '',
    ),
    isHost:
        map['role']?.toString() == 'host' || (map['is_host'] as bool? ?? false),
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

  String get displayCity =>
      otherPartyCity ?? (isHost ? 'Chennai, Tamil Nadu' : 'Chennai');
  int get displayAge => otherPartyAge ?? 24;
  List<String> get displayLanguages =>
      otherPartyLanguages ?? const ['Tamil', 'English'];
  bool get isOtherPartyOnline => otherPartyIsOnline ?? true;
  bool get isOtherPartyStar => otherPartyIsStar ?? false;
  int get displayEarnedInr =>
      amountInr ?? (totalCoins > 0 ? totalCoins : (durationMinutes * 5));
  int get displayPaidInr =>
      amountInr ?? (totalCoins > 0 ? totalCoins : (durationMinutes * 5));

  factory CallHistoryItem.fromMap(
    Map<String, dynamic> map, {
    required String currentUserId,
  }) {
    final isCaller = map['caller_id'] == currentUserId;
    String name = 'User';
    if (isCaller) {
      if (map['host'] != null) {
        name = (map['host']['display_name'] as String?)?.isNotEmpty == true
            ? map['host']['display_name'] as String
            : 'Host';
      }
    } else {
      if (map['caller'] != null) {
        name = (map['caller']['display_name'] as String?)?.isNotEmpty == true
            ? map['caller']['display_name'] as String
            : 'User';
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
    this.status = 'completed',
    this.description,
    this.otherPartyName,
    this.durationFormatted,
    this.amountInr,
    this.methodOrContext,
    this.rawTransactionCode,
  });

  final String id;
  final String type; // 'added', 'credit', 'debit', 'failed', 'withdrawal', 'canceled', 'refunded'
  final String status; // 'completed', 'failed', 'pending', 'canceled'
  final int coinAmount;
  final int balanceAfter;
  final DateTime createdAt;
  final String? description;
  final String? otherPartyName;
  final String? durationFormatted;
  final int? amountInr;
  final String? methodOrContext;
  final String? rawTransactionCode;

  bool get isCredit =>
      type == 'credit' ||
      type == 'added' ||
      (type != 'failed' && type != 'canceled' && coinAmount > 0);
  bool get isFailed => type == 'failed' || status == 'failed';
  bool get isCanceled =>
      type == 'canceled' || type == 'refunded' || status == 'canceled';
  bool get isWithdrawal => type == 'withdrawal' || type == 'payout';
  int get displayAmountInr => amountInr ?? coinAmount.abs();

  String get transactionCode {
    if (rawTransactionCode != null && rawTransactionCode!.trim().isNotEmpty) {
      return rawTransactionCode!.trim();
    }
    final d =
        '${createdAt.year}${createdAt.month.toString().padLeft(2, '0')}${createdAt.day.toString().padLeft(2, '0')}';
    final cleanId = id.replaceAll('-', '').toUpperCase();
    final suffix = cleanId.length >= 6
        ? cleanId.substring(0, 6)
        : cleanId.padRight(6, '9');
    return 'TXN-FRND-$d-$suffix';
  }

  String get statusLabel {
    if (isFailed) return 'FAILED';
    if (isCanceled) return 'CANCELED';
    if (isWithdrawal) return 'WITHDRAWAL';
    if (type == 'added' || type == 'credit' || isCredit) return 'ADDED';
    return 'COMPLETED';
  }

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
    if (isFailed) {
      return description ?? 'Recharge Failed';
    }
    if (isCanceled) {
      return description ?? 'Transaction Canceled';
    }
    if (isWithdrawal) {
      return description ?? 'Host Payout Withdrawal';
    }
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

  factory WalletTransactionItem.fromMap(Map<String, dynamic> map) {
    final meta = map['metadata'] is Map<String, dynamic>
        ? map['metadata'] as Map<String, dynamic>
        : null;

    return WalletTransactionItem(
      id:
          map['id']?.toString() ??
          'txn_${DateTime.now().millisecondsSinceEpoch}',
      type: map['type']?.toString() ?? 'debit',
      status:
          map['status']?.toString() ??
          (meta != null && meta['status'] != null
              ? meta['status'].toString()
              : 'completed'),
      coinAmount: (map['coin_amount'] as num?)?.toInt() ?? 0,
      balanceAfter: (map['balance_after'] as num?)?.toInt() ?? 0,
      createdAt:
          DateTime.tryParse(map['created_at'] as String? ?? '') ??
          DateTime.now(),
      description: meta != null ? meta['description']?.toString() : null,
      amountInr:
          (map['amount_inr'] as num?)?.toInt() ??
          (meta != null && meta['amount_inr'] != null
              ? (meta['amount_inr'] as num).toInt()
              : null),
      methodOrContext: meta != null ? meta['payment_method']?.toString() : null,
      rawTransactionCode:
          map['reference_id']?.toString() ??
          (meta != null ? meta['transaction_code']?.toString() : null),
    );
  }
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
    this.minWithdrawalInr = 100,
    this.nextPayoutDay = 'Friday',
    this.silenceWarningsCount = 0,
    this.maxSilenceWarnings = 3,
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
  final int silenceWarningsCount;
  final int maxSilenceWarnings;

  bool get isHostSuspended => silenceWarningsCount >= maxSilenceWarnings;
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
