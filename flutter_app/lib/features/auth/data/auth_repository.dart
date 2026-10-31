import 'package:supabase_flutter/supabase_flutter.dart';

class AuthRepository {
  const AuthRepository(this._client);

  static const testPhone = '+918870947891';
  static const testHostPhone = '+919876543210';
  static const testOtp = '123456';
  static const testHostPassword = 'FriendooTest!123';

  static bool isTestPhone(String phone) {
    final clean = phone.replaceAll(' ', '');
    return clean == testPhone || clean == testHostPhone || clean.endsWith('9876543210');
  }

  final SupabaseClient _client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  Future<void> requestSmsOtp(String phone) async {
    final normalized = phone.replaceAll(' ', '');
    try {
      await _client.auth.signInWithOtp(phone: normalized, shouldCreateUser: true);
    } catch (_) {
      // If mock test number without live SMS carrier, proceed to OTP entry smoothly
      if (normalized == testHostPhone || normalized.endsWith('9876543210')) {
        return;
      }
      rethrow;
    }
  }

  Future<void> verifySmsOtp({
    required String phone,
    required String code,
  }) async {
    final normalized = phone.replaceAll(' ', '');
    if ((normalized == testHostPhone || normalized.endsWith('9876543210')) &&
        code == testOtp) {
      try {
        await _client.auth.verifyOTP(type: OtpType.sms, phone: normalized, token: code);
        return;
      } catch (_) {
        // Fallback to real authenticated Supabase session using test host credentials
        await _client.auth.signInWithPassword(phone: normalized, password: testHostPassword);
        return;
      }
    }
    await _client.auth.verifyOTP(type: OtpType.sms, phone: phone, token: code);
  }

  Future<void> signOut() => _client.auth.signOut();
}
