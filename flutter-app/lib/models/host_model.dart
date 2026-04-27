import 'package:cloud_firestore/cloud_firestore.dart';

class HostModel {
  final String uid;
  final String name;
  final String phone;
  final String userType;
  final int age;
  final List<String> languages;
  final String avatarId;
  final String photoUrl;
  final String bio;
  final String? upiId;
  final bool upiVerified;
  final bool isOnline;
  final bool isOnCall;
  final bool isDND;
  final bool isExpert;
  final DateTime? expertRequestedAt;
  final bool isApproved;
  final String status;
  final DateTime? suspendedUntil;
  final bool isBanned;
  final bool faceVerified;
  final bool voiceVerified;
  final int ratePerMessage;
  final int ratePerAudioMinute;
  final int ratePerVideoMinute;
  final int totalEarnings;
  final int availableBalance;
  final int totalWithdrawn;
  final double rating;
  final int reviewCount;
  final int totalCalls;
  final int responseTimeSeconds;
  final int totalReports;
  final List<Map<String, dynamic>> reportDetails;
  final int silenceWarnings;
  final String? fcmToken;
  final DateTime createdAt;

  static int _intOr(dynamic value, int fallback) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  static double _doubleOr(dynamic value, double fallback) {
    if (value is double) return value;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  static bool _boolOr(dynamic value, bool fallback) {
    if (value is bool) return value;
    if (value is String) {
      if (value.toLowerCase() == 'true') return true;
      if (value.toLowerCase() == 'false') return false;
    }
    return fallback;
  }

  static String _stringOr(dynamic value, String fallback) {
    if (value is String && value.isNotEmpty) return value;
    return fallback;
  }

  static DateTime? _dateTimeOrNull(dynamic value) {
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    return null;
  }

  static List<String> _stringListOr(dynamic value, String fallback) {
    if (value is List) {
      return value
          .where((item) => item != null)
          .map((item) => item.toString())
          .where((item) => item.isNotEmpty)
          .toList();
    }
    final singleValue = value?.toString() ?? fallback;
    return singleValue.isEmpty ? <String>[] : <String>[singleValue];
  }

  static List<Map<String, dynamic>> _mapListOr(dynamic value) {
    if (value is! List) return const [];
    return value.whereType<Map>().map((item) {
      return item.map((key, value) => MapEntry(key.toString(), value));
    }).toList();
  }

  HostModel({
    required this.uid,
    required this.name,
    required this.phone,
    this.userType = 'host',
    required this.age,
    required this.languages,
    required this.avatarId,
    this.photoUrl = '',
    this.bio = '',
    this.upiId,
    this.upiVerified = false,
    this.isOnline = false,
    this.isOnCall = false,
    this.isDND = false,
    this.isExpert = false,
    this.expertRequestedAt,
    this.isApproved = false,
    this.status = 'pending',
    this.suspendedUntil,
    this.isBanned = false,
    this.faceVerified = false,
    this.voiceVerified = false,
    this.ratePerMessage = 5,
    this.ratePerAudioMinute = 5,
    this.ratePerVideoMinute = 10,
    this.totalEarnings = 0,
    this.availableBalance = 0,
    this.totalWithdrawn = 0,
    this.rating = 4.0,
    this.reviewCount = 0,
    this.totalCalls = 0,
    this.responseTimeSeconds = 60,
    this.totalReports = 0,
    this.reportDetails = const [],
    this.silenceWarnings = 0,
    this.fcmToken,
    required this.createdAt,
  });

  factory HostModel.fromJson(Map<String, dynamic> json) {
    final createdAtValue = _dateTimeOrNull(json['createdAt']);
    final name = _stringOr(json['name'], 'Unknown');
    final photoUrl = _stringOr(
      json['photoUrl'] ?? json['profilePhotoUrl'] ?? json['imageUrl'],
      '',
    );
    final fallbackLanguage = _stringOr(json['language'], 'Hindi');
    final bio = _stringOr(json['bio'], '');
    final coinsPerMinute = _intOr(json['coinsPerMinute'], 5);
    final rating = _doubleOr(json['rating'], 4.0);
    final isOnline = _boolOr(json['isOnline'], false);

    return HostModel(
      uid: _stringOr(json['uid'], ''),
      name: name,
      phone: _stringOr(json['phone'], ''),
      userType: _stringOr(json['userType'], 'host'),
      age: _intOr(json['age'], 18),
      languages: _stringListOr(json['languages'], fallbackLanguage),
      avatarId: _stringOr(json['avatarId'], ''),
      photoUrl: photoUrl,
      bio: bio,
      upiId: json['upiId']?.toString(),
      upiVerified: _boolOr(json['upiVerified'], false),
      isOnline: isOnline,
      isOnCall: _boolOr(json['isOnCall'], false),
      isDND: _boolOr(json['isDND'], false),
      isExpert: _boolOr(json['isExpert'], false),
      expertRequestedAt: _dateTimeOrNull(json['expertRequestedAt']),
      isApproved: _boolOr(json['isApproved'], false),
      status: _stringOr(json['status'], 'pending'),
      suspendedUntil: _dateTimeOrNull(json['suspendedUntil']),
      isBanned: _boolOr(json['isBanned'], false),
      faceVerified: _boolOr(json['faceVerified'], false),
      voiceVerified: _boolOr(json['voiceVerified'], false),
      ratePerMessage: _intOr(json['ratePerMessage'] ?? coinsPerMinute, 5),
      ratePerAudioMinute:
          _intOr(json['ratePerAudioMinute'] ?? coinsPerMinute, 5),
      ratePerVideoMinute: _intOr(json['ratePerVideoMinute'], 10),
      totalEarnings: _intOr(json['totalEarnings'], 0),
      availableBalance: _intOr(json['availableBalance'], 0),
      totalWithdrawn: _intOr(json['totalWithdrawn'], 0),
      rating: rating,
      reviewCount: _intOr(json['reviewCount'], 0),
      totalCalls: _intOr(
        json['totalCalls'] ?? json['completedCalls'] ?? json['callCount'],
        0,
      ),
      responseTimeSeconds: _intOr(json['responseTimeSeconds'], 60),
      totalReports: _intOr(json['totalReports'], 0),
      reportDetails: _mapListOr(json['reportDetails']),
      silenceWarnings: _intOr(json['silenceWarnings'], 0),
      fcmToken: json['fcmToken']?.toString(),
      createdAt: createdAtValue ?? DateTime.now(),
    );
  }

  factory HostModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    final uidValue = data['uid'];
    final uid = uidValue is String && uidValue.isNotEmpty ? uidValue : doc.id;
    return HostModel.fromJson({
      ...data,
      'uid': uid,
      'name': _stringOr(data['name'], 'Unknown'),
      'photoUrl': _stringOr(
        data['photoUrl'] ?? data['profilePhotoUrl'] ?? data['imageUrl'],
        '',
      ),
      'language': _stringOr(data['language'], 'Hindi'),
      'bio': _stringOr(data['bio'], ''),
      'coinsPerMinute': _intOr(data['coinsPerMinute'], 5),
      'rating': _doubleOr(data['rating'], 4.0),
      'isOnline': _boolOr(data['isOnline'], false),
    });
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'name': name,
      'phone': phone,
      'userType': userType,
      'age': age,
      'languages': languages,
      'avatarId': avatarId,
      'photoUrl': photoUrl,
      'bio': bio,
      'upiId': upiId,
      'upiVerified': upiVerified,
      'isOnline': isOnline,
      'isOnCall': isOnCall,
      'isDND': isDND,
      'isExpert': isExpert,
      'expertRequestedAt': expertRequestedAt != null
          ? Timestamp.fromDate(expertRequestedAt!)
          : null,
      'isApproved': isApproved,
      'status': status,
      'suspendedUntil': suspendedUntil != null
          ? Timestamp.fromDate(suspendedUntil!)
          : null,
      'isBanned': isBanned,
      'faceVerified': faceVerified,
      'voiceVerified': voiceVerified,
      'ratePerMessage': ratePerMessage,
      'ratePerAudioMinute': ratePerAudioMinute,
      'ratePerVideoMinute': ratePerVideoMinute,
      'totalEarnings': totalEarnings,
      'availableBalance': availableBalance,
      'totalWithdrawn': totalWithdrawn,
      'rating': rating,
      'reviewCount': reviewCount,
      'totalCalls': totalCalls,
      'responseTimeSeconds': responseTimeSeconds,
      'totalReports': totalReports,
      'reportDetails': reportDetails,
      'silenceWarnings': silenceWarnings,
      'fcmToken': fcmToken,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'name': name,
      'phone': phone,
      'userType': userType,
      'age': age,
      'languages': languages,
      'avatarId': avatarId,
      'photoUrl': photoUrl,
      'bio': bio,
      'upiId': upiId,
      'upiVerified': upiVerified,
      'isOnline': isOnline,
      'isOnCall': isOnCall,
      'isDND': isDND,
      'isExpert': isExpert,
      'expertRequestedAt': expertRequestedAt != null
          ? Timestamp.fromDate(expertRequestedAt!)
          : null,
      'isApproved': isApproved,
      'status': status,
      'suspendedUntil': suspendedUntil != null
          ? Timestamp.fromDate(suspendedUntil!)
          : null,
      'isBanned': isBanned,
      'faceVerified': faceVerified,
      'voiceVerified': voiceVerified,
      'ratePerMessage': ratePerMessage,
      'ratePerAudioMinute': ratePerAudioMinute,
      'ratePerVideoMinute': ratePerVideoMinute,
      'totalEarnings': totalEarnings,
      'availableBalance': availableBalance,
      'totalWithdrawn': totalWithdrawn,
      'rating': rating,
      'reviewCount': reviewCount,
      'totalCalls': totalCalls,
      'responseTimeSeconds': responseTimeSeconds,
      'totalReports': totalReports,
      'reportDetails': reportDetails,
      'silenceWarnings': silenceWarnings,
      'fcmToken': fcmToken,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  int get ratePerMinuteChat => ratePerMessage;
  int get ratePerMinuteAudio => ratePerAudioMinute;
  int get ratePerMinuteVideo => ratePerVideoMinute;
  bool get isVerified => faceVerified || voiceVerified || upiVerified;
  String get responseTimeLabel {
    if (responseTimeSeconds <= 60) return '<1m';
    return '${(responseTimeSeconds / 60).ceil()}m';
  }

  HostModel copyWith({
    String? uid,
    String? name,
    String? phone,
    String? userType,
    int? age,
    List<String>? languages,
    String? avatarId,
    String? photoUrl,
    String? bio,
    String? upiId,
    bool? upiVerified,
    bool? isOnline,
    bool? isOnCall,
    bool? isDND,
    bool? isExpert,
    DateTime? expertRequestedAt,
    bool? isApproved,
    String? status,
    DateTime? suspendedUntil,
    bool? isBanned,
    bool? faceVerified,
    bool? voiceVerified,
    int? ratePerMessage,
    int? ratePerAudioMinute,
    int? ratePerVideoMinute,
    int? totalEarnings,
    int? availableBalance,
    int? totalWithdrawn,
    double? rating,
    int? reviewCount,
    int? totalCalls,
    int? responseTimeSeconds,
    int? totalReports,
    List<Map<String, dynamic>>? reportDetails,
    int? silenceWarnings,
    String? fcmToken,
    DateTime? createdAt,
  }) {
    return HostModel(
      uid: uid ?? this.uid,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      userType: userType ?? this.userType,
      age: age ?? this.age,
      languages: languages ?? this.languages,
      avatarId: avatarId ?? this.avatarId,
      photoUrl: photoUrl ?? this.photoUrl,
      bio: bio ?? this.bio,
      upiId: upiId ?? this.upiId,
      upiVerified: upiVerified ?? this.upiVerified,
      isOnline: isOnline ?? this.isOnline,
      isOnCall: isOnCall ?? this.isOnCall,
      isDND: isDND ?? this.isDND,
      isExpert: isExpert ?? this.isExpert,
      expertRequestedAt: expertRequestedAt ?? this.expertRequestedAt,
      isApproved: isApproved ?? this.isApproved,
      status: status ?? this.status,
      suspendedUntil: suspendedUntil ?? this.suspendedUntil,
      isBanned: isBanned ?? this.isBanned,
      faceVerified: faceVerified ?? this.faceVerified,
      voiceVerified: voiceVerified ?? this.voiceVerified,
      ratePerMessage: ratePerMessage ?? this.ratePerMessage,
      ratePerAudioMinute: ratePerAudioMinute ?? this.ratePerAudioMinute,
      ratePerVideoMinute: ratePerVideoMinute ?? this.ratePerVideoMinute,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      availableBalance: availableBalance ?? this.availableBalance,
      totalWithdrawn: totalWithdrawn ?? this.totalWithdrawn,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      totalCalls: totalCalls ?? this.totalCalls,
      responseTimeSeconds: responseTimeSeconds ?? this.responseTimeSeconds,
      totalReports: totalReports ?? this.totalReports,
      reportDetails: reportDetails ?? this.reportDetails,
      silenceWarnings: silenceWarnings ?? this.silenceWarnings,
      fcmToken: fcmToken ?? this.fcmToken,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'HostModel(uid: $uid, name: $name, age: $age, rating: $rating, status: $status)';
  }
}
