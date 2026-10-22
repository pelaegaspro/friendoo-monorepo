import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/features/auth/presentation/animated_otp_verification_view.dart';

void main() {
  testWidgets('AnimatedOtpVerificationView renders reel animation elements and auto-submits',
      (WidgetTester tester) async {
    final controller = TextEditingController();
    bool verified = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AnimatedOtpVerificationView(
            phoneDigits: '+91 9876543210',
            otpController: controller,
            onVerify: () {
              verified = true;
            },
            onResend: () {},
            onChangePhone: () {},
            resendCountdown: 28,
          ),
        ),
      ),
    );

    // Pump a single frame without settle to accommodate repeating controllers
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text("Verify it's you"), findsOneWidget);
    expect(find.text('+91 9876543210'), findsOneWidget);
    expect(find.text('Verify code'), findsOneWidget);
    expect(find.text("Didn't get a code? "), findsOneWidget);
    expect(find.text('Resend in 0:28'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);

    // Enter partial OTP
    await tester.enterText(find.byType(TextField), '12');
    await tester.pump(const Duration(milliseconds: 50));
    expect(controller.text, equals('12'));
    expect(verified, isFalse);

    // Enter all 6 digits -> triggers auto-submit
    await tester.enterText(find.byType(TextField), '123456');
    await tester.pump(const Duration(milliseconds: 300));

    expect(verified, isTrue);
    expect(controller.text, equals('123456'));
  });

  testWidgets('AnimatedOtpVerificationView shows success state when verified',
      (WidgetTester tester) async {
    final controller = TextEditingController(text: '123456');

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AnimatedOtpVerificationView(
            phoneDigits: '+91 9876543210',
            otpController: controller,
            onVerify: () {},
            onResend: () {},
            onChangePhone: () {},
            isVerified: true,
          ),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text("You're verified"), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
  });
}
