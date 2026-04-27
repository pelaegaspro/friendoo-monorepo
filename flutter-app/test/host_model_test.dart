import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/models/host_model.dart';

void main() {
  test('HostModel.fromJson survives null and missing Firestore fields', () {
    final host = HostModel.fromJson({
      'uid': null,
      'name': null,
      'phone': null,
      'userType': null,
      'age': null,
      'languages': null,
      'language': null,
      'avatarId': null,
      'photoUrl': null,
      'bio': null,
      'isOnline': null,
      'rating': null,
      'coinsPerMinute': null,
      'createdAt': null,
    });

    expect(host.name, 'Unknown');
    expect(host.phone, '');
    expect(host.userType, 'host');
    expect(host.age, 18);
    expect(host.languages, ['Hindi']);
    expect(host.avatarId, '');
    expect(host.photoUrl, '');
    expect(host.bio, '');
    expect(host.isOnline, isFalse);
    expect(host.ratePerAudioMinute, 5);
    expect(host.rating, 5.0);
  });

  test('HostModel.fromJson supports legacy language and numeric strings', () {
    final host = HostModel.fromJson({
      'uid': 'host-1',
      'name': 'Asha',
      'phone': '123',
      'age': '26',
      'language': 'Tamil',
      'avatarId': '',
      'isOnline': 'true',
      'rating': '4.7',
      'ratePerAudioMinute': '8',
      'totalCalls': '1200',
      'responseTimeSeconds': '90',
    });

    expect(host.languages, ['Tamil']);
    expect(host.age, 26);
    expect(host.isOnline, isTrue);
    expect(host.rating, 4.7);
    expect(host.ratePerAudioMinute, 8);
    expect(host.totalCalls, 1200);
    expect(host.responseTimeLabel, '2m');
  });
}
