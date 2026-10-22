import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:friendoo/core/models/friendoo_models.dart';
import 'package:friendoo/features/profile/data/blocked_callers_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  group('Blocked Callers Invisibility & Isolation Tests', () {
    test('Host blocking a caller ensures host never appears in that caller screen even when online', () async {
      const hostId = 'host_priya_101';
      const callerId = 'caller_rajesh_999';

      final onlineHost = HostProfile(
        id: hostId,
        displayName: 'Priya Sharma',
        bio: 'Tamil & English friendly conversations',
        ratePerAudioMinute: 6,
        isAvailable: true,
        isStar: true,
        status: HostStatus.online,
        languages: const ['Tamil', 'English'],
        gender: 'female',
      );

      // Before blocking: host is available and visible
      expect(onlineHost.isOnline, isTrue);
      expect(BlockedCallersService.isHostBlockedForUser(hostId: hostId, userId: callerId), isFalse);

      // Host blocks this caller
      await BlockedCallersService.blockCaller(
        hostId: hostId,
        callerId: callerId,
        callerName: 'Rajesh',
        reason: 'Inappropriate conduct',
      );

      // After blocking: host is blocked specifically for this caller
      expect(BlockedCallersService.isHostBlockedForUser(hostId: hostId, userId: callerId), isTrue);

      // In the caller's screen, simulate host discovery list filtering
      final allOnlineHosts = [onlineHost];
      final visibleHostsForCaller = allOnlineHosts.where((h) =>
        !BlockedCallersService.isHostBlockedForUser(hostId: h.id, userId: callerId)
      ).toList();

      // Host does NOT appear on this caller screen
      expect(visibleHostsForCaller, isEmpty);

      // Another normal caller who is NOT blocked can still see the host
      const innocentCallerId = 'caller_suresh_123';
      final visibleHostsForInnocentCaller = allOnlineHosts.where((h) =>
        !BlockedCallersService.isHostBlockedForUser(hostId: h.id, userId: innocentCallerId)
      ).toList();
      expect(visibleHostsForInnocentCaller.length, equals(1));
      expect(visibleHostsForInnocentCaller.first.displayName, equals('Priya Sharma'));

      // When the host unblocks the caller
      await BlockedCallersService.unblockCaller(
        hostId: hostId,
        callerId: callerId,
      );

      expect(BlockedCallersService.isHostBlockedForUser(hostId: hostId, userId: callerId), isFalse);
      final visibleAfterUnblock = allOnlineHosts.where((h) =>
        !BlockedCallersService.isHostBlockedForUser(hostId: h.id, userId: callerId)
      ).toList();
      expect(visibleAfterUnblock.length, equals(1));
    });
  });
}

