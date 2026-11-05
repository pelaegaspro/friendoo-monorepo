// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;

html.MediaStream? _activeWebAudioStream;

Future<bool> requestWebMicrophonePermission() async {
  try {
    final mediaDevices = html.window.navigator.mediaDevices;
    if (mediaDevices == null) return false;
    // Request microphone access from browser - triggers native browser permission prompt
    final stream = await mediaDevices.getUserMedia({
      'audio': true,
      'video': false,
    });
    _activeWebAudioStream?.getTracks().forEach((t) => t.stop());
    _activeWebAudioStream = stream;
    return true;
  } catch (e) {
    return false;
  }
}
