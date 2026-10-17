import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/friendoo_models.dart';
import 'package:friendoo/features/calls/data/rtc_audio_service.dart';
import 'package:friendoo/features/calls/presentation/live_call_overlay.dart';

void main() {
  testWidgets('LiveCallOverlay shows notification and badge when opposite peer mutes/unmutes', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final remoteMuteController = StreamController<bool>.broadcast();
    addTearDown(remoteMuteController.close);

    const callSession = CallSession(
      id: 'call_test_123',
      callerId: 'user_456',
      hostId: 'host_789',
      channelName: 'channel_123',
      status: CallStatus.active,
      callType: CallType.audio,
      ratePerMinute: 5,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          remoteMuteStateProvider.overrideWith((ref) => remoteMuteController.stream),
          rtcConnectionStateProvider.overrideWith((ref) => Stream.value(RtcConnectionState.connected)),
        ],
        child: const MaterialApp(
          home: LiveCallOverlay(
            call: callSession,
            hostName: 'Sara',
            isHost: false, // Local user is caller, remote is Host (Sara)
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Verify initial state: no muted badge
    expect(find.text('Host Muted'), findsNothing);
    expect(find.text('Sara is speaking...'), findsOneWidget);

    // 2. Emit remote peer MUTED
    remoteMuteController.add(true);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Verify remote muted badge appears below avatar
    expect(find.text('Host Muted'), findsOneWidget);

    // Verify speaking status pill displays mute notification
    expect(find.text('Sara has muted microphone'), findsOneWidget);

    // Verify mic off icon is rendered
    expect(find.byIcon(Icons.mic_off_rounded), findsWidgets);

    // 3. Emit remote peer UNMUTED
    remoteMuteController.add(false);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Verify badge disappears and speaking resumes
    expect(find.text('Host Muted'), findsNothing);
    expect(find.text('Sara is speaking...'), findsOneWidget);
  });
}

