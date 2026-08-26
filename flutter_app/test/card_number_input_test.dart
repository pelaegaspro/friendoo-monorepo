import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/features/wallet/presentation/card_number_input.dart';

void main() {
  group('CardNumberInput', () {
    test('keeps only the first sixteen numeric digits', () {
      expect(
        CardNumberInput.normalize('4111 1111 1111 1111 9999'),
        '4111111111111111',
      );
      expect(
        CardNumberInput.normalize('4111-abcd-1111'),
        '41111111',
      );
    });

    test('formats the permitted number in readable groups of four', () {
      expect(
        CardNumberInput.format('4111111111111111'),
        '4111 1111 1111 1111',
      );
      expect(CardNumberInput.format('411111'), '4111 11');
    });

    test('detects Visa as soon as its partial prefix is entered', () {
      expect(CardNumberInput.detectNetwork('4'), CardNetwork.visa);
      expect(CardNumberInput.detectNetwork('4111 11'), CardNetwork.visa);
    });

    test('detects Mastercard and RuPay from their supported prefixes', () {
      expect(CardNumberInput.detectNetwork('51'), CardNetwork.mastercard);
      expect(CardNumberInput.detectNetwork('2221'), CardNetwork.mastercard);
      expect(CardNumberInput.detectNetwork('60'), CardNetwork.rupay);
      expect(CardNumberInput.detectNetwork('81'), CardNetwork.rupay);
    });

    test('accepts only a sixteen-digit supported card number', () {
      expect(CardNumberInput.isEligible('4111111111111111'), isTrue);
      expect(CardNumberInput.isEligible('411111111111111'), isFalse);
      expect(CardNumberInput.isEligible('9999999999999999'), isFalse);
    });

    test('masks a complete card number outside active entry', () {
      expect(
        CardNumberInput.maskedForSummary('4111111111111111'),
        '•••• •••• •••• 1111',
      );
    });
  });
}
