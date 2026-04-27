import 'package:cloud_firestore/cloud_firestore.dart';

class CoinTransactionModel {
  final String id;
  final String userId;
  final String type;
  final int coins;
  final double? amountINR;
  final double? gstAmount;
  final double? totalAmountINR;
  final String description;
  final String? razorpayOrderId;
  final DateTime timestamp;

  CoinTransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.coins,
    this.amountINR,
    this.gstAmount,
    this.totalAmountINR,
    required this.description,
    this.razorpayOrderId,
    required this.timestamp,
  });

  factory CoinTransactionModel.fromJson(String id, Map<String, dynamic> json) {
    DateTime timestampOrNow(dynamic value) {
      if (value is Timestamp) return value.toDate();
      if (value is DateTime) return value;
      return DateTime.now();
    }

    return CoinTransactionModel(
      id: id,
      userId: json['userId'] as String? ?? '',
      type: json['type'] as String? ?? 'debit',
      coins: (json['coins'] as num?)?.toInt() ??
          (json['amountCoins'] as num?)?.toInt() ??
          0,
      amountINR: (json['amountINR'] as num?)?.toDouble(),
      gstAmount: (json['gstAmount'] as num?)?.toDouble(),
      totalAmountINR: (json['totalAmountINR'] as num?)?.toDouble() ??
          (json['amountInr'] as num?)?.toDouble(),
      description: json['description'] as String? ?? '',
      razorpayOrderId:
          json['razorpayOrderId'] as String? ?? json['razorpayId'] as String?,
      timestamp: timestampOrNow(
        json['timestamp'] ?? json['createdAt'] ?? json['updatedAt'],
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'type': type,
      'coins': coins,
      'amountINR': amountINR,
      'gstAmount': gstAmount,
      'totalAmountINR': totalAmountINR,
      'description': description,
      'razorpayOrderId': razorpayOrderId,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'type': type,
      'coins': coins,
      'amountINR': amountINR,
      'gstAmount': gstAmount,
      'totalAmountINR': totalAmountINR,
      'description': description,
      'razorpayOrderId': razorpayOrderId,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }

  CoinTransactionModel copyWith({
    String? id,
    String? userId,
    String? type,
    int? coins,
    double? amountINR,
    double? gstAmount,
    double? totalAmountINR,
    String? description,
    String? razorpayOrderId,
    DateTime? timestamp,
  }) {
    return CoinTransactionModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      coins: coins ?? this.coins,
      amountINR: amountINR ?? this.amountINR,
      gstAmount: gstAmount ?? this.gstAmount,
      totalAmountINR: totalAmountINR ?? this.totalAmountINR,
      description: description ?? this.description,
      razorpayOrderId: razorpayOrderId ?? this.razorpayOrderId,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  double? get amount => totalAmountINR ?? amountINR;
  bool get isPurchase => type == 'purchase';
  bool get isSpent => type == 'spent';
  bool get isRefund => type == 'refund';
  bool get isBonus => type == 'bonus';
  bool get isReferral => type == 'referral';
  bool get isAdReward => type == 'ad_reward';

  @override
  String toString() {
    return 'CoinTransactionModel(id: $id, type: $type, coins: $coins, amountINR: $amountINR)';
  }
}
