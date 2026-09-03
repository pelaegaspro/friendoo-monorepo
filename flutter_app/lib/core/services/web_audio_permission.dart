import 'web_audio_permission_stub.dart'
    if (dart.library.html) 'web_audio_permission_web.dart';

Future<bool> requestWebMicrophone() => requestWebMicrophonePermission();
