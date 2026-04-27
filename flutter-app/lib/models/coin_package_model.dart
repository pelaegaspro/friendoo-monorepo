class CoinPackageModel {
  final String id;
  final int coins;
  final double priceINR;
  final double gstPercent;
  final double totalPriceINR;
  final int bonusCoins;
  final double? discountPercent;
  final String? discountLabel;
  final bool isPopular;
  final bool isBestValue;
  final bool isActive;
  final int sortOrder;

  CoinPackageModel({
    required this.id,
    required this.coins,
    required this.priceINR,
    this.gstPercent = 18.0,
    required this.totalPriceINR,
    this.bonusCoins = 0,
    this.discountPercent,
    this.discountLabel,
    this.isPopular = false,
    this.isBestValue = false,
    this.isActive = true,
    this.sortOrder = 0,
  });

  factory CoinPackageModel.fromJson(String id, Map<String, dynamic> json) {
    return CoinPackageModel(
      id: id,
      coins: json['coins'] as int,
      priceINR: (json['priceINR'] as num).toDouble(),
      gstPercent: (json['gstPercent'] as num?)?.toDouble() ?? 18.0,
      totalPriceINR: (json['totalPriceINR'] as num).toDouble(),
      bonusCoins: json['bonusCoins'] as int? ?? 0,
      discountPercent: (json['discountPercent'] as num?)?.toDouble(),
      discountLabel: json['discountLabel'] as String?,
      isPopular: json['isPopular'] as bool? ?? false,
      isBestValue: json['isBestValue'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'coins': coins,
      'priceINR': priceINR,
      'gstPercent': gstPercent,
      'totalPriceINR': totalPriceINR,
      'bonusCoins': bonusCoins,
      'discountPercent': discountPercent,
      'discountLabel': discountLabel,
      'isPopular': isPopular,
      'isBestValue': isBestValue,
      'isActive': isActive,
      'sortOrder': sortOrder,
    };
  }

  Map<String, dynamic> toFirestore() {
    return {
      'coins': coins,
      'priceINR': priceINR,
      'gstPercent': gstPercent,
      'totalPriceINR': totalPriceINR,
      'bonusCoins': bonusCoins,
      'discountPercent': discountPercent,
      'discountLabel': discountLabel,
      'isPopular': isPopular,
      'isBestValue': isBestValue,
      'isActive': isActive,
      'sortOrder': sortOrder,
    };
  }

  CoinPackageModel copyWith({
    String? id,
    int? coins,
    double? priceINR,
    double? gstPercent,
    double? totalPriceINR,
    int? bonusCoins,
    double? discountPercent,
    String? discountLabel,
    bool? isPopular,
    bool? isBestValue,
    bool? isActive,
    int? sortOrder,
  }) {
    return CoinPackageModel(
      id: id ?? this.id,
      coins: coins ?? this.coins,
      priceINR: priceINR ?? this.priceINR,
      gstPercent: gstPercent ?? this.gstPercent,
      totalPriceINR: totalPriceINR ?? this.totalPriceINR,
      bonusCoins: bonusCoins ?? this.bonusCoins,
      discountPercent: discountPercent ?? this.discountPercent,
      discountLabel: discountLabel ?? this.discountLabel,
      isPopular: isPopular ?? this.isPopular,
      isBestValue: isBestValue ?? this.isBestValue,
      isActive: isActive ?? this.isActive,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  int get totalCoins => coins + bonusCoins;
  int get bonus => bonusCoins;
  String get formattedPrice => 'Rs. ${totalPriceINR.toStringAsFixed(2)}';
  String get formattedBasePrice => 'Rs. ${priceINR.toStringAsFixed(0)}';
  bool get hasDiscount => discountPercent != null && discountPercent! > 0;

  @override
  String toString() {
    return 'CoinPackageModel(id: $id, coins: $coins, totalPriceINR: $totalPriceINR, isPopular: $isPopular)';
  }
}
