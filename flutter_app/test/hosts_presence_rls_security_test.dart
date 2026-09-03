import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

String _readMigration(String filename) {
  final file = File('../supabase/migrations/$filename');
  if (file.existsSync()) {
    return file.readAsStringSync();
  }
  final altFile = File('supabase/migrations/$filename');
  return altFile.readAsStringSync();
}

void main() {
  group('PASS 3K — Host & User Presence Application Security Simulation Suite (Non-DB Mock)', () {
    late String rlsMigration000029;
    late String rlsMigration000030;

    setUpAll(() {
      rlsMigration000029 = _readMigration(
        '20260826_000029_hosts_and_presence_rls_hardening.sql',
      );
      rlsMigration000030 = _readMigration(
        '20260826_000030_secure_trigger_search_path_and_presence_clock.sql',
      );
    });

    group('1. Static SQL Schema & Migration Verification', () {
      test(
        'RLS is explicitly enabled on public.hosts and public.user_presence',
        () {
          expect(
            rlsMigration000029,
            contains('alter table public.hosts enable row level security;'),
          );
          expect(
            rlsMigration000029,
            contains(
              'alter table public.user_presence enable row level security;',
            ),
          );
        },
      );

      test('public.hosts denies direct authenticated INSERT policy', () {
        expect(
          rlsMigration000029,
          isNot(contains('on public.hosts for insert to authenticated')),
        );
      });

      test(
        'public.hosts UPDATE policy is strictly scoped to auth.uid() = id',
        () {
          expect(
            rlsMigration000029,
            contains('create policy "hosts_update_own_profile"'),
          );
          expect(rlsMigration000029, contains('on public.hosts for update'));
          expect(rlsMigration000029, contains('to authenticated'));
          expect(rlsMigration000029, contains('using (auth.uid() = id)'));
          expect(rlsMigration000029, contains('with check (auth.uid() = id)'));
        },
      );

      test('Migration 000030 pins explicit search_path on guard_host_protected_columns', () {
        expect(
          rlsMigration000030,
          contains('function public.guard_host_protected_columns()'),
        );
        expect(
          rlsMigration000030,
          contains('set search_path = public, auth, pg_temp'),
        );
        expect(
          rlsMigration000030,
          contains(
            'new.rate_per_audio_minute is distinct from old.rate_per_audio_minute',
          ),
        );
      });

      test('Migration 000030 pins explicit search_path and future clock guard on guard_user_presence_columns', () {
        expect(
          rlsMigration000030,
          contains('function public.guard_user_presence_columns()'),
        );
        expect(
          rlsMigration000030,
          contains('set search_path = public, auth, pg_temp'),
        );
        expect(
          rlsMigration000030,
          contains("new.last_seen_at > now() + interval '1 minute'"),
        );
        expect(
          rlsMigration000030,
          contains("raise exception 'last_seen_at cannot be in the future'"),
        );
      });
    });

    group('2. Application Security Simulation Engine (In-Memory Mock, NOT PostgreSQL RLS)', () {
      late Map<String, dynamic> hostsTable;
      late Map<String, dynamic> presenceTable;

      setUp(() {
        hostsTable = {
          'host-1': {
            'id': 'host-1',
            'bio': 'Original bio',
            'rate_per_audio_minute': 20,
            'rate_per_video_minute': 30,
            'is_available': false,
            'rating': 4.8,
            'is_star': false,
            'gender': 'female',
            'languages': ['Tamil', 'English'],
          },
        };

        presenceTable = {
          'user-1': {
            'user_id': 'user-1',
            'state': 'offline',
            'last_seen_at': DateTime.now().toUtc(),
          },
        };
      });

      dynamic executeHostUpdate({
        required String authUid,
        required String authRole,
        required String currentUser,
        required String targetHostId,
        required Map<String, dynamic> payload,
      }) {
        if (authRole == 'anon') {
          throw Exception('RLS error: permission denied for table hosts');
        }

        if (authRole == 'service_role' || currentUser == 'postgres') {
          final existing = hostsTable[targetHostId] ?? {'id': targetHostId};
          final newRow = Map<String, dynamic>.from(existing)..addAll(payload);
          hostsTable[targetHostId] = newRow;
          return newRow;
        }

        if (authRole == 'authenticated') {
          if (authUid != targetHostId) {
            throw Exception('RLS error: row-level security policy violation');
          }

          final existing = hostsTable[targetHostId];
          if (existing == null) {
            throw Exception('Row not found');
          }

          final newRow = Map<String, dynamic>.from(existing)..addAll(payload);

          if (currentUser == 'authenticated') {
            if (newRow['id'] != existing['id']) {
              throw Exception('Cannot change host identifier');
            }
            if (newRow['rate_per_audio_minute'] !=
                existing['rate_per_audio_minute']) {
              throw Exception('Hosts cannot modify rate_per_audio_minute');
            }
            if (newRow['rate_per_video_minute'] !=
                existing['rate_per_video_minute']) {
              throw Exception('Hosts cannot modify rate_per_video_minute');
            }
            if (newRow['rating'] != existing['rating']) {
              throw Exception('Hosts cannot modify rating');
            }
            if (newRow['total_ratings'] != existing['total_ratings']) {
              throw Exception('Hosts cannot modify total_ratings');
            }
            if (newRow['is_star'] != existing['is_star']) {
              throw Exception('Hosts cannot modify is_star');
            }
          }

          hostsTable[targetHostId] = newRow;
          return newRow;
        }
      }

      dynamic executeHostInsert({
        required String authUid,
        required String authRole,
        required String currentUser,
        required Map<String, dynamic> payload,
      }) {
        if (authRole == 'authenticated' || authRole == 'anon') {
          throw Exception('RLS error: permission denied for table hosts');
        }
        final hostId = payload['id'] as String;
        hostsTable[hostId] = Map<String, dynamic>.from(payload);
        return hostsTable[hostId];
      }

      dynamic executePresenceUpdate({
        required String authUid,
        required String authRole,
        required String currentUser,
        required String targetUserId,
        required Map<String, dynamic> payload,
      }) {
        if (authRole == 'anon') {
          throw Exception(
            'RLS error: permission denied for table user_presence',
          );
        }

        if (authRole == 'service_role' || currentUser == 'postgres') {
          final existing =
              presenceTable[targetUserId] ?? {'user_id': targetUserId};
          final newRow = Map<String, dynamic>.from(existing)..addAll(payload);
          presenceTable[targetUserId] = newRow;
          return newRow;
        }

        if (authRole == 'authenticated') {
          if (authUid != targetUserId) {
            throw Exception('RLS error: row-level security policy violation');
          }

          final existing =
              presenceTable[targetUserId] ?? {'user_id': targetUserId};
          final newRow = Map<String, dynamic>.from(existing)..addAll(payload);

          if (currentUser == 'authenticated') {
            if (newRow['user_id'] != existing['user_id']) {
              throw Exception('Cannot change user_presence identifier');
            }
            if (newRow.containsKey('last_seen_at')) {
              final lastSeen = newRow['last_seen_at'] is DateTime
                  ? newRow['last_seen_at'] as DateTime
                  : DateTime.parse(newRow['last_seen_at'].toString());
              if (lastSeen.isAfter(
                DateTime.now().toUtc().add(const Duration(minutes: 1)),
              )) {
                throw Exception('last_seen_at cannot be in the future');
              }
            }
          }

          presenceTable[targetUserId] = newRow;
          return newRow;
        }
      }

      test(
        'Scenario 1: Authenticated host updates own availability -> PASS',
        () {
          expect(
            () => executeHostUpdate(
              authUid: 'host-1',
              authRole: 'authenticated',
              currentUser: 'authenticated',
              targetHostId: 'host-1',
              payload: {'is_available': true},
            ),
            returnsNormally,
          );
          expect(hostsTable['host-1']['is_available'], isTrue);
        },
      );

      test('Scenario 2: Authenticated host updates own languages -> PASS', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {
              'languages': ['Tamil', 'Hindi', 'English'],
            },
          ),
          returnsNormally,
        );
        expect(
          hostsTable['host-1']['languages'],
          equals(['Tamil', 'Hindi', 'English']),
        );
      });

      test('Scenario 3: Authenticated host changes audio rate -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {'rate_per_audio_minute': 1000},
          ),
          throwsA(
            predicate(
              (e) => e.toString().contains(
                'Hosts cannot modify rate_per_audio_minute',
              ),
            ),
          ),
        );
        expect(hostsTable['host-1']['rate_per_audio_minute'], equals(20));
      });

      test('Scenario 4: Authenticated host changes video rate -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {'rate_per_video_minute': 500},
          ),
          throwsA(
            predicate(
              (e) => e.toString().contains(
                'Hosts cannot modify rate_per_video_minute',
              ),
            ),
          ),
        );
      });

      test('Scenario 5: Authenticated host changes rating -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {'rating': 5.0},
          ),
          throwsA(
            predicate(
              (e) => e.toString().contains('Hosts cannot modify rating'),
            ),
          ),
        );
      });

      test('Scenario 6: Authenticated host changes total_ratings -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {'total_ratings': 9999},
          ),
          throwsA(
            predicate(
              (e) => e.toString().contains('Hosts cannot modify total_ratings'),
            ),
          ),
        );
      });

      test('Scenario 7: Authenticated host changes is_star -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {'is_star': true},
          ),
          throwsA(
            predicate(
              (e) => e.toString().contains('Hosts cannot modify is_star'),
            ),
          ),
        );
      });

      test('Scenario 8: Service-role updates is_star -> PASS', () {
        final result = executeHostUpdate(
          authUid: 'service-role-admin',
          authRole: 'service_role',
          currentUser: 'service_role',
          targetHostId: 'host-1',
          payload: {'is_star': true},
        );
        expect(result['is_star'], equals(true));
      });

      test('Scenario 9: Authenticated host updates another host -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-2',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {'is_available': true},
          ),
          throwsA(predicate((e) => e.toString().contains('policy violation'))),
        );
      });

      test('Scenario 10: Authenticated user inserts hosts row -> FAIL', () {
        expect(
          () => executeHostInsert(
            authUid: 'user-2',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            payload: {
              'id': 'user-2',
              'bio': 'Fake host',
              'rate_per_audio_minute': 50,
            },
          ),
          throwsA(predicate((e) => e.toString().contains('permission denied'))),
        );
      });

      test('Scenario 11: Authenticated user changes hosts.id -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {'id': 'host-999'},
          ),
          throwsA(
            predicate(
              (e) => e.toString().contains('Cannot change host identifier'),
            ),
          ),
        );
      });

      test('Scenario 12: Authenticated user updates own presence -> PASS', () {
        expect(
          () => executePresenceUpdate(
            authUid: 'user-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetUserId: 'user-1',
            payload: {
              'state': 'online',
              'last_seen_at': DateTime.now().toUtc(),
            },
          ),
          returnsNormally,
        );
        expect(presenceTable['user-1']['state'], equals('online'));
      });

      test(
        'Scenario 13: Authenticated user updates another presence -> FAIL',
        () {
          expect(
            () => executePresenceUpdate(
              authUid: 'user-2',
              authRole: 'authenticated',
              currentUser: 'authenticated',
              targetUserId: 'user-1',
              payload: {'state': 'online'},
            ),
            throwsA(
              predicate((e) => e.toString().contains('policy violation')),
            ),
          );
        },
      );

      test('Scenario 14: Authenticated user attempts future last_seen_at spoofing -> FAIL', () {
        final futureTime = DateTime.now().toUtc().add(
          const Duration(days: 365),
        );
        expect(
          () => executePresenceUpdate(
            authUid: 'user-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetUserId: 'user-1',
            payload: {'last_seen_at': futureTime},
          ),
          throwsA(
            predicate(
              (e) =>
                  e.toString().contains('last_seen_at cannot be in the future'),
            ),
          ),
        );
      });

      test('Scenario 15: Anon host mutation -> FAIL', () {
        expect(
          () => executeHostUpdate(
            authUid: '',
            authRole: 'anon',
            currentUser: 'anon',
            targetHostId: 'host-1',
            payload: {'is_available': true},
          ),
          throwsA(predicate((e) => e.toString().contains('permission denied'))),
        );
      });

      test('Scenario 16: Service-role CRM host provisioning -> PASS', () {
        expect(
          () => executeHostInsert(
            authUid: '',
            authRole: 'service_role',
            currentUser: 'postgres',
            payload: {
              'id': 'host-new',
              'bio': 'New approved host',
              'rate_per_audio_minute': 5,
              'is_available': false,
            },
          ),
          returnsNormally,
        );
        expect(hostsTable['host-new']['rate_per_audio_minute'], equals(5));
      });

      test('Scenario 17: Admin host rate update -> PASS', () {
        expect(
          () => executeHostUpdate(
            authUid: '',
            authRole: 'service_role',
            currentUser: 'postgres',
            targetHostId: 'host-1',
            payload: {'rate_per_audio_minute': 25},
          ),
          returnsNormally,
        );
        expect(hostsTable['host-1']['rate_per_audio_minute'], equals(25));
      });

      test('Scenario 18: SECURITY DEFINER call lifecycle update -> PASS', () {
        expect(
          () => executeHostUpdate(
            authUid: 'caller-1',
            authRole: 'authenticated',
            currentUser: 'postgres',
            targetHostId: 'host-1',
            payload: {'silence_warning_count': 1, 'is_available': false},
          ),
          returnsNormally,
        );
        expect(hostsTable['host-1']['silence_warning_count'], equals(1));
      });

      test('UPSERT Test: Authenticated host cannot bypass rate protection via upsert', () {
        expect(
          () => executeHostInsert(
            authUid: 'unregistered-user',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            payload: {
              'id': 'unregistered-user',
              'rate_per_audio_minute': 9999,
              'is_available': true,
            },
          ),
          throwsA(predicate((e) => e.toString().contains('permission denied'))),
        );

        expect(
          () => executeHostUpdate(
            authUid: 'host-1',
            authRole: 'authenticated',
            currentUser: 'authenticated',
            targetHostId: 'host-1',
            payload: {
              'id': 'host-1',
              'is_available': true,
              'rate_per_audio_minute': 9999,
            },
          ),
          throwsA(
            predicate(
              (e) => e.toString().contains(
                'Hosts cannot modify rate_per_audio_minute',
              ),
            ),
          ),
        );
        expect(hostsTable['host-1']['rate_per_audio_minute'], equals(20));
      });
    });
  });
}
