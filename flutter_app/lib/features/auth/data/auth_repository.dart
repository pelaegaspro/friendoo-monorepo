import 'package:supabase_flutter/supabase_flutter.dart';

class AuthRepository {
  const AuthRepository(this._client);

  final SupabaseClient _client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  Future<void> requestSmsOtp(String phone) {
    return _client.auth.signInWithOtp(phone: phone, shouldCreateUser: true);
  }

  Future<void> verifySmsOtp({
    required String phone,
    required String code,
  }) async {
    await _client.auth.verifyOTP(type: OtpType.sms, phone: phone, token: code);
  }

  Future<void> signOut() => _client.auth.signOut();
}
