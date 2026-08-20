import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

/// Uploads a private source image and submits it for server-side moderation.
///
/// The storage bucket is private. This service does not create public URLs and
/// never accepts a Supabase service-role key in Flutter.
class AvatarReviewService {
  AvatarReviewService(this._supabase);

  final SupabaseClient _supabase;

  Future<String> uploadAndSubmit({
    required Uint8List imageBytes,
    required String fileExtension,
    String? submissionNote,
  }) async {
    final profileId = _supabase.auth.currentUser?.id;
    if (profileId == null) {
      throw StateError('An authenticated user is required to submit an avatar.');
    }

    final extension = fileExtension.toLowerCase().replaceFirst('.', '');
    const supported = {'jpg', 'jpeg', 'png', 'webp'};
    if (!supported.contains(extension)) {
      throw ArgumentError.value(fileExtension, 'fileExtension', 'Unsupported avatar format.');
    }

    final objectPath = 'profile/$profileId/source/${DateTime.now().microsecondsSinceEpoch}.$extension';
    final contentType = switch (extension) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      _ => 'image/webp',
    };

    await _supabase.storage.from('avatars').uploadBinary(
          objectPath,
          imageBytes,
          fileOptions: FileOptions(
            contentType: contentType,
            upsert: false,
          ),
        );

    try {
      final response = await _supabase.rpc(
        'submit_avatar_for_review',
        params: {
          'p_source_path': objectPath,
          'p_submission_note': submissionNote,
        },
      );
      return response as String;
    } catch (_) {
      await _supabase.storage.from('avatars').remove([objectPath]);
      rethrow;
    }
  }
}
