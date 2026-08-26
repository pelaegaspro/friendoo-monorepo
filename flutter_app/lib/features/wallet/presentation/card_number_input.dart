import 'package:flutter/services.dart';

enum CardNetwork {
  unknown,
  visa,
  mastercard,
  rupay,
}

extension CardNetworkLabel on CardNetwork {
  String get label {
    switch (this) {
      case CardNetwork.visa:
        return 'Visa';
      case CardNetwork.mastercard:
        return 'Mastercard';
      case CardNetwork.rupay:
        return 'RuPay';
      case CardNetwork.unknown:
        return '';
    }
  }
}

class CardNumberInput {
  CardNumberInput._();

  static const maxDigits = 16;

  static String normalize(String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');
    return digits.length <= maxDigits ? digits : digits.substring(0, maxDigits);
  }

  static String format(String value) {
    final digits = normalize(value);
    final groups = <String>[];
    for (var index = 0; index < digits.length; index += 4) {
      final end = (index + 4).clamp(0, digits.length);
      groups.add(digits.substring(index, end));
    }
    return groups.join(' ');
  }

  static CardNetwork detectNetwork(String value) {
    final digits = normalize(value);
    if (digits.isEmpty) return CardNetwork.unknown;

    if (digits.startsWith('4')) return CardNetwork.visa;

    if (digits.length >= 2) {
      final firstTwo = int.tryParse(digits.substring(0, 2));
      if (firstTwo != null && firstTwo >= 51 && firstTwo <= 55) {
        return CardNetwork.mastercard;
      }
      if (firstTwo != null && (firstTwo == 60 || firstTwo == 65 || firstTwo == 81 || firstTwo == 82)) {
        return CardNetwork.rupay;
      }
    }

    if (digits.length >= 4) {
      final firstFour = int.tryParse(digits.substring(0, 4));
      if (firstFour != null && firstFour >= 2221 && firstFour <= 2720) {
        return CardNetwork.mastercard;
      }
    }

    return CardNetwork.unknown;
  }

  static bool isEligible(String value) {
    final digits = normalize(value);
    return digits.length == maxDigits && detectNetwork(digits) != CardNetwork.unknown;
  }

  static String maskedForSummary(String value) {
    final digits = normalize(value);
    if (digits.length != maxDigits) return format(digits);
    return '•••• •••• •••• ${digits.substring(maxDigits - 4)}';
  }
}

class CardNumberTextInputFormatter extends TextInputFormatter {
  const CardNumberTextInputFormatter();

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final formatted = CardNumberInput.format(newValue.text);
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
      composing: TextRange.empty,
    );
  }
}
