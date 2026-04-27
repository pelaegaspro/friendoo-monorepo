import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String name;
  final String phone;
  final String userType;
  final String gender;
  final String avatarId;
  final int coins;
  final bool isStar;
  final DateTime? starExpiry;
  final String referralCode;
  final DateTime createdAt;
  // Profile setup fields
  final int age;
  final String language;
  final String role;        // 'user' | 'host'
  final bool profileComplete;

  UserModel({
    required this.uid,
    required this.name,
    required this.phone,
    required this.userType,
    required this.gender,
    required this.avatarId,
    required this.coins,
    this.isStar = false,
    this.starExpiry,
    required this.referralCode,
    required this.createdAt,
    this.age = 18,
    this.language = 'Hindi',
    this.role = 'user',
    this.profileComplete = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      uid: json['uid'] as String? ?? '',
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      userType: json['userType'] as String? ?? 'user',
      gender: json['gender'] as String? ?? 'male',
      avatarId: json['avatarId'] as String? ?? '1',
      coins: (json['coins'] as num?)?.toInt() ?? 0,
      isStar: json['isStar'] as bool? ?? false,
      starExpiry: json['starExpiry'] != null
          ? (json['starExpiry'] as Timestamp).toDate()
          : null,
      referralCode: json['referralCode'] as String? ?? '',
      createdAt: json['createdAt'] is Timestamp
          ? (json['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      age: (json['age'] as num?)?.toInt() ?? 18,
      language: json['language'] as String? ?? 'Hindi',
      role: json['role'] as String? ?? 'user',
      profileComplete: json['profileComplete'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'name': name,
      'phone': phone,
      'userType': userType,
      'gender': gender,
      'avatarId': avatarId,
      'coins': coins,
      'isStar': isStar,
      'starExpiry': starExpiry != null ? Timestamp.fromDate(starExpiry!) : null,
      'referralCode': referralCode,
      'createdAt': Timestamp.fromDate(createdAt),
      'age': age,
      'language': language,
      'role': role,
      'profileComplete': profileComplete,
    };
  }

  UserModel copyWith({
    String? uid,
    String? name,
    String? phone,
    String? userType,
    String? gender,
    String? avatarId,
    int? coins,
    bool? isStar,
    DateTime? starExpiry,
    String? referralCode,
    DateTime? createdAt,
    int? age,
    String? language,
    String? role,
    bool? profileComplete,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      userType: userType ?? this.userType,
      gender: gender ?? this.gender,
      avatarId: avatarId ?? this.avatarId,
      coins: coins ?? this.coins,
      isStar: isStar ?? this.isStar,
      starExpiry: starExpiry ?? this.starExpiry,
      referralCode: referralCode ?? this.referralCode,
      createdAt: createdAt ?? this.createdAt,
      age: age ?? this.age,
      language: language ?? this.language,
      role: role ?? this.role,
      profileComplete: profileComplete ?? this.profileComplete,
    );
  }

  bool get isStarActive {
    if (!isStar) return false;
    if (starExpiry == null) return false;
    return starExpiry!.isAfter(DateTime.now());
  }

  int get callRatePerMinute => isStarActive ? 7 : 5;
}
