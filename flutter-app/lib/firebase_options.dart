// File generated from Firebase project: friendoo-v1
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError('iOS is not yet supported. Please use Android.');
      default:
        throw UnsupportedError('Unsupported platform.');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'REDACTED_ANDROID_API_KEY',
    appId: '1:6451131397:android:188701daa381169996d86c',
    messagingSenderId: '6451131397',
    projectId: 'friendoo-v1',
    storageBucket: 'friendoo-v1.firebasestorage.app',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'REDACTED_WEB_API_KEY',
    appId: '1:6451131397:web:b9faf2c8cc20483c96d86c',
    messagingSenderId: '6451131397',
    projectId: 'friendoo-v1',
    storageBucket: 'friendoo-v1.firebasestorage.app',
    authDomain: 'friendoo-v1.firebaseapp.com',
    measurementId: 'G-S93R8N2MBJ',
  );

  // iOS - ACTIVATE LATER
  // static const FirebaseOptions ios = FirebaseOptions(
  //   apiKey: '...',
  //   appId: '1:6451131397:ios:0987fa40b5b6256a96d86c',
  //   messagingSenderId: '6451131397',
  //   projectId: 'friendoo-v1',
  //   storageBucket: 'friendoo-v1.firebasestorage.app',
  //   iosBundleId: 'com.friendoo.app',
  // );
}
