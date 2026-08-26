import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';

class AuthRepository {
  const AuthRepository(this._client);

  final SupabaseClient _client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  Future<void> requestSmsOtp(String phone) {
    if (kDebugMode && _isRealtimeTestPhone(phone)) return Future.value();
    return _client.auth.signInWithOtp(phone: phone, shouldCreateUser: true);
  }

  Future<void> verifySmsOtp({
    required String phone,
    required String code,
  }) async {
    if (kDebugMode && _isRealtimeTestPhone(phone)) {
      if (code != '123456') {
        throw const AuthException('Invalid test OTP');
      }
      final email = phone == '+918870947891'
          ? 'realtime-user@friendoo.test'
          : 'realtime-host@friendoo.test';
      await _client.auth.signInWithPassword(
        email: email,
        password: 'FriendooTest!123',
      );
      return;
    }
    await _client.auth.verifyOTP(type: OtpType.sms, phone: phone, token: code);
  }

  bool _isRealtimeTestPhone(String phone) =>
      phone == '+918870947891' || phone == '+917604991136';

  Future<void> signOut() => _client.auth.signOut();
}
