import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/user_model.dart';

final firebaseAuthProvider = Provider<FirebaseAuth>((ref) {
  return FirebaseAuth.instance;
});

final firestoreProvider = Provider<FirebaseFirestore>((ref) {
  return FirebaseFirestore.instance;
});

final authStateProvider = StreamProvider<User?>((ref) {
  return ref.watch(firebaseAuthProvider).authStateChanges().timeout(
    const Duration(seconds: 10),
    onTimeout: (sink) {
      debugPrint('Auth: authStateChanges timed out');
      sink.add(null); // Fallback to unauthenticated state on timeout
    },
  );
});

final currentUserProvider = StreamProvider<UserModel?>((ref) {
  final auth = ref.watch(firebaseAuthProvider);
  final firestore = ref.watch(firestoreProvider);

  return auth.authStateChanges().asyncMap((firebaseUser) async {
    if (firebaseUser == null) return null;

    final doc = await firestore
        .collection(AppConstants.usersCollection)
        .doc(firebaseUser.uid)
        .get();

    if (!doc.exists) return null;

    return UserModel.fromJson(doc.data()!);
  });
});

final userCoinsProvider = StreamProvider<int>((ref) {
  final auth = ref.watch(firebaseAuthProvider);
  final firestore = ref.watch(firestoreProvider);

  final user = auth.currentUser;
  if (user == null) return const Stream.empty();

  return firestore
      .collection(AppConstants.usersCollection)
      .doc(user.uid)
      .snapshots()
      .map((doc) =>
          (doc.data()?['coinBalance'] as num?)?.toInt() ??
          (doc.data()?['coins'] as num?)?.toInt() ??
          0);
});

class AuthState {
  final bool isLoading;
  final String? error;
  final String? verificationId;
  final int? resendToken;

  AuthState({
    this.isLoading = false,
    this.error,
    this.verificationId,
    this.resendToken,
  });

  AuthState copyWith({
    bool? isLoading,
    String? error,
    String? verificationId,
    int? resendToken,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      verificationId: verificationId ?? this.verificationId,
      resendToken: resendToken ?? this.resendToken,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  AuthNotifier(this._auth, this._firestore) : super(AuthState());

  String? _verificationId;
  int? _resendToken;

  Future<void> sendOTP(String phoneNumber, Function(String) onCodeSent) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _auth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _auth.signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          state = state.copyWith(
            isLoading: false,
            error: e.message ?? 'Verification failed',
          );
        },
        codeSent: (String verificationId, int? resendToken) {
          _verificationId = verificationId;
          _resendToken = resendToken;
          state = state.copyWith(
            isLoading: false,
            verificationId: verificationId,
            resendToken: resendToken,
          );
          onCodeSent(verificationId);
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
        forceResendingToken: _resendToken,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> verifyOTP(String smsCode) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: smsCode,
      );

      await _auth.signInWithCredential(credential);
      state = state.copyWith(isLoading: false);
      return true;
    } on FirebaseAuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message ?? 'Invalid OTP',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> createUserProfile(String name, String avatarId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = _auth.currentUser;
      if (user == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'User not authenticated',
        );
        return false;
      }

      final userData = UserModel(
        uid: user.uid,
        name: name,
        phone: user.phoneNumber ?? '',
        userType: AppConstants.userTypeUser,
        gender: 'male', // Default, can be updated later
        avatarId: avatarId,
        coins: AppConstants.welcomeBonusCoins,
        referralCode: user.uid.substring(0, 8).toUpperCase(),
        createdAt: DateTime.now(),
      );

      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(user.uid)
          .set(userData.toFirestore());

      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<void> updateUserProfile({
    String? name,
    String? avatarId,
    String? userType,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = _auth.currentUser;
      if (user == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'User not authenticated',
        );
        return;
      }

      final updates = <String, dynamic>{};
      if (name != null) updates['name'] = name;
      if (avatarId != null) updates['avatarId'] = avatarId;
      if (userType != null) updates['userType'] = userType;

      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(user.uid)
          .update(updates);

      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    state = AuthState();
  }

  Future<void> createHostProfile({
    required String name,
    required int age,
    required String avatarId,
    required List<String> languages,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = _auth.currentUser;
      if (user == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'User not authenticated',
        );
        return;
      }

      final now = DateTime.now();

      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(user.uid)
          .set({
        'uid': user.uid,
        'name': name,
        'phone': user.phoneNumber ?? '',
        'userType': AppConstants.userTypeHost,
        'avatarId': avatarId,
        'createdAt': Timestamp.fromDate(now),
      }, SetOptions(merge: true));

      await _firestore
          .collection(AppConstants.hostsCollection)
          .doc(user.uid)
          .set({
        'uid': user.uid,
        'name': name,
        'phone': user.phoneNumber ?? '',
        'userType': AppConstants.userTypeHost,
        'age': age,
        'languages': languages,
        'avatarId': avatarId,
        'createdAt': Timestamp.fromDate(now),
      }, SetOptions(merge: true));

      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() => signOut();
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final auth = ref.watch(firebaseAuthProvider);
  final firestore = ref.watch(firestoreProvider);
  return AuthNotifier(auth, firestore);
});

final authProvider = authNotifierProvider;
