import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/friendoo_models.dart';

void main() {
  group('Friendoo App Improvements (YC Office Hours Diagnostic)', () {
    test('HostProfile supports voiceIntroUrl, duration, and hasVoiceIntro flag', () {
      final hostWithVoice = HostProfile(
        id: 'host_sara',
        displayName: 'Sara',
        bio: 'Love chatting about music and cinema',
        ratePerAudioMinute: 15,
        isAvailable: true,
        isStar: true,
        voiceIntroUrl: 'https://storage.friendoo.in/voice/sara_intro.mp3',
        voiceIntroDurationSecs: 8,
      );

      expect(hostWithVoice.hasVoiceIntro, isTrue);
      expect(hostWithVoice.voiceIntroDurationSecs, 8);
      expect(hostWithVoice.voiceIntroUrl, contains('sara_intro.mp3'));

      final hostWithoutVoice = HostProfile(
        id: 'host_riya',
        displayName: 'Riya',
        bio: 'Student from Delhi',
        ratePerAudioMinute: 10,
        isAvailable: true,
        isStar: false,
      );

      expect(hostWithoutVoice.hasVoiceIntro, isFalse);
      expect(hostWithoutVoice.voiceIntroDurationSecs, 8); // default fallback
    });

    test('HostProfile.fromMap deserializes voice_intro_url and audio_bio_url', () {
      final map = {
        'id': 'h1',
        'display_name': 'Pooja',
        'rate_per_audio_minute': 20,
        'is_available': true,
        'voice_intro_url': 'https://storage.friendoo.in/voice/pooja.mp3',
        'voice_intro_duration_secs': 10,
      };

      final host = HostProfile.fromMap(map);
      expect(host.hasVoiceIntro, isTrue);
      expect(host.voiceIntroUrl, 'https://storage.friendoo.in/voice/pooja.mp3');
      expect(host.voiceIntroDurationSecs, 10);
      expect(host.ratePerAudioMinute, 20);
    });

    test('HostProfile.copyWith preserves or updates voiceIntro fields', () {
      final initial = HostProfile(
        id: 'h2',
        displayName: 'Ananya',
        bio: 'Hi',
        ratePerAudioMinute: 10,
        isAvailable: true,
        isStar: false,
      );

      final updated = initial.copyWith(
        voiceIntroUrl: 'https://storage.friendoo.in/voice/ananya.mp3',
        voiceIntroDurationSecs: 12,
      );

      expect(initial.hasVoiceIntro, isFalse);
      expect(updated.hasVoiceIntro, isTrue);
      expect(updated.voiceIntroDurationSecs, 12);
      expect(updated.displayName, 'Ananya');
    });
  });
}

