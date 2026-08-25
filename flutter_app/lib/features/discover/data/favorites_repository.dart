import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

final favoritesRepositoryProvider = Provider<FavoritesRepository>((ref) {
  return FavoritesRepository();
});

final favoriteHostIdsProvider = StreamProvider<Set<String>>((ref) {
  final repo = ref.watch(favoritesRepositoryProvider);
  return repo.watchFavorites();
});

class FavoritesRepository {
  FavoritesRepository() {
    // Seed with initial favorites for instant discovery feel
    _favoriteIds.addAll({'host_01', 'host_04'});
    _controller.add(Set<String>.from(_favoriteIds));
  }

  final Set<String> _favoriteIds = {};
  final StreamController<Set<String>> _controller =
      StreamController<Set<String>>.broadcast();

  Stream<Set<String>> watchFavorites() => _controller.stream;

  bool isFavorite(String hostId) => _favoriteIds.contains(hostId);

  void toggleFavorite(String hostId) {
    if (_favoriteIds.contains(hostId)) {
      _favoriteIds.remove(hostId);
    } else {
      _favoriteIds.add(hostId);
    }
    _controller.add(Set<String>.from(_favoriteIds));
  }

  Set<String> get currentFavorites => Set<String>.from(_favoriteIds);
}
