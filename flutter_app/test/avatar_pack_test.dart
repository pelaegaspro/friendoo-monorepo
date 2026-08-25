import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/features/discover/presentation/desi_avatar.dart';

void main() {
  test('restores ten distinct bundled role-specific avatar assets for each role', () {
    expect(DesiAvatarPack.userAvatars, hasLength(10));
    expect(DesiAvatarPack.hostAvatars, hasLength(10));

    expect(
      DesiAvatarPack.userAvatars.map((avatar) => avatar.id),
      orderedEquals(const [
        'user_01',
        'user_02',
        'user_03',
        'user_04',
        'user_05',
        'user_06',
        'user_07',
        'user_08',
        'user_09',
        'user_10',
      ]),
    );
    expect(
      DesiAvatarPack.hostAvatars.map((avatar) => avatar.id),
      orderedEquals(const [
        'host_01',
        'host_02',
        'host_03',
        'host_04',
        'host_05',
        'host_06',
        'host_07',
        'host_08',
        'host_09',
        'host_10',
      ]),
    );

    expect(
      DesiAvatarPack.userAvatars.map((avatar) => avatar.assetPath),
      orderedEquals(const [
        'assets/avatars/avatar_user_01.jpg',
        'assets/avatars/avatar_user_02.jpg',
        'assets/avatars/avatar_user_03.jpg',
        'assets/avatars/avatar_user_04.jpg',
        'assets/avatars/avatar_user_05.jpg',
        'assets/avatars/avatar_user_06.jpg',
        'assets/avatars/avatar_user_07.jpg',
        'assets/avatars/avatar_user_08.jpg',
        'assets/avatars/avatar_user_09.jpg',
        'assets/avatars/avatar_user_10.jpg',
      ]),
    );
    expect(
      DesiAvatarPack.hostAvatars.map((avatar) => avatar.assetPath),
      orderedEquals(const [
        'assets/avatars/avatar_host_01.jpg',
        'assets/avatars/avatar_host_02.jpg',
        'assets/avatars/avatar_host_03.jpg',
        'assets/avatars/avatar_host_04.jpg',
        'assets/avatars/avatar_host_05.jpg',
        'assets/avatars/avatar_host_06.jpg',
        'assets/avatars/avatar_host_07.jpg',
        'assets/avatars/avatar_host_08.jpg',
        'assets/avatars/avatar_host_09.jpg',
        'assets/avatars/avatar_host_10.jpg',
      ]),
    );
  });

  test('default configurations resolve to valid bundled role-specific avatar IDs', () {
    expect(FriendooAvatarConfig.defaultUser().presetId, 'user_01');
    expect(FriendooAvatarConfig.defaultHost().presetId, 'host_01');
    expect(DesiAvatarPack.isValidPresetForRole('user_10', 'user'), isTrue);
    expect(DesiAvatarPack.isValidPresetForRole('host_10', 'host'), isTrue);
    expect(DesiAvatarPack.isValidPresetForRole('host_01', 'user'), isFalse);
    expect(DesiAvatarPack.findById('avatar_user_04.jpg').id, 'user_04');
    expect(DesiAvatarPack.findById('f_18').id, 'host_01');
  });
}
