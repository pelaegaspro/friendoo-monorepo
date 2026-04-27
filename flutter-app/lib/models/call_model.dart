import 'package:cloud_firestore/cloud_firestore.dart';

class CallModel {
  final String id;
  final String userId;
  final String hostId;
  final String type;
  final String status;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationSeconds;
  final int coinsDeducted;
  final int freeMinutesUsed;
  final int hostCoinsEarned;
  final String agoraChannel;
  final String? agoraToken;
  final bool silenceDetected;
  final bool adminMonitoring;
  final String? adminRecordingUrl;
  final bool callRated;
  final DateTime createdAt;

  CallModel({
    required this.id,
    required this.userId,
    required this.hostId,
    required this.type,
    required this.status,
    required this.startTime,
    this.endTime,
    this.durationSeconds = 0,
    this.coinsDeducted = 0,
    this.freeMinutesUsed = 0,
    this.hostCoinsEarned = 0,
    required this.agoraChannel,
    this.agoraToken,
    this.silenceDetected = false,
    this.adminMonitoring = false,
    this.adminRecordingUrl,
    this.callRated = false,
    required this.createdAt,
  });

  factory CallModel.fromJson(String id, Map<String, dynamic> json) {
    DateTime dateOrNow(dynamic value) {
      if (value is Timestamp) return value.toDate();
      if (value is DateTime) return value;
      return DateTime.now();
    }

    int intOr(dynamic value, int fallback) {
      if (value is int) return value;
      if (value is num) return value.toInt();
      if (value is String) return int.tryParse(value) ?? fallback;
      return fallback;
    }

    return CallModel(
      id: id,
      userId: json['userId'] as String? ?? json['callerId'] as String? ?? '',
      hostId: json['hostId'] as String? ?? '',
      type: json['type'] as String? ?? 'audio',
      status: json['status'] as String? ?? 'completed',
      startTime: dateOrNow(json['startTime'] ?? json['createdAt']),
      endTime: json['endTime'] != null ? dateOrNow(json['endTime']) : null,
      durationSeconds: intOr(
        json['durationSeconds'],
        intOr(json['duration'], 0) * 60,
      ),
      coinsDeducted: intOr(json['coinsDeducted'], 0),
      freeMinutesUsed: intOr(json['freeMinutesUsed'], 0),
      hostCoinsEarned: intOr(json['hostCoinsEarned'], 0),
      agoraChannel:
          json['agoraChannel'] as String? ?? json['channelId'] as String? ?? '',
      agoraToken: json['agoraToken'] as String?,
      silenceDetected: json['silenceDetected'] as bool? ?? false,
      adminMonitoring: json['adminMonitoring'] as bool? ?? false,
      adminRecordingUrl: json['adminRecordingUrl'] as String?,
      callRated: json['callRated'] as bool? ?? false,
      createdAt: dateOrNow(json['createdAt'] ?? json['startTime']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'hostId': hostId,
      'type': type,
      'status': status,
      'startTime': Timestamp.fromDate(startTime),
      'endTime': endTime != null ? Timestamp.fromDate(endTime!) : null,
      'durationSeconds': durationSeconds,
      'coinsDeducted': coinsDeducted,
      'freeMinutesUsed': freeMinutesUsed,
      'hostCoinsEarned': hostCoinsEarned,
      'agoraChannel': agoraChannel,
      'agoraToken': agoraToken,
      'silenceDetected': silenceDetected,
      'adminMonitoring': adminMonitoring,
      'adminRecordingUrl': adminRecordingUrl,
      'callRated': callRated,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'hostId': hostId,
      'type': type,
      'status': status,
      'startTime': Timestamp.fromDate(startTime),
      'endTime': endTime != null ? Timestamp.fromDate(endTime!) : null,
      'durationSeconds': durationSeconds,
      'coinsDeducted': coinsDeducted,
      'freeMinutesUsed': freeMinutesUsed,
      'hostCoinsEarned': hostCoinsEarned,
      'agoraChannel': agoraChannel,
      'agoraToken': agoraToken,
      'silenceDetected': silenceDetected,
      'adminMonitoring': adminMonitoring,
      'adminRecordingUrl': adminRecordingUrl,
      'callRated': callRated,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  String get channelName => agoraChannel;
  String? get agoraTokenHost => agoraToken;

  CallModel copyWith({
    String? id,
    String? userId,
    String? hostId,
    String? type,
    String? status,
    DateTime? startTime,
    DateTime? endTime,
    int? durationSeconds,
    int? coinsDeducted,
    int? freeMinutesUsed,
    int? hostCoinsEarned,
    String? agoraChannel,
    String? agoraToken,
    bool? silenceDetected,
    bool? adminMonitoring,
    String? adminRecordingUrl,
    bool? callRated,
    DateTime? createdAt,
  }) {
    return CallModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      hostId: hostId ?? this.hostId,
      type: type ?? this.type,
      status: status ?? this.status,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      coinsDeducted: coinsDeducted ?? this.coinsDeducted,
      freeMinutesUsed: freeMinutesUsed ?? this.freeMinutesUsed,
      hostCoinsEarned: hostCoinsEarned ?? this.hostCoinsEarned,
      agoraChannel: agoraChannel ?? this.agoraChannel,
      agoraToken: agoraToken ?? this.agoraToken,
      silenceDetected: silenceDetected ?? this.silenceDetected,
      adminMonitoring: adminMonitoring ?? this.adminMonitoring,
      adminRecordingUrl: adminRecordingUrl ?? this.adminRecordingUrl,
      callRated: callRated ?? this.callRated,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'CallModel(id: $id, type: $type, status: $status, duration: $durationSeconds, rated: $callRated)';
  }
}
