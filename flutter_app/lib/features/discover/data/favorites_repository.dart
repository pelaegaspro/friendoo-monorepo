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

  static const int maxFavorites = 6;
  final Set<String> _favoriteIds = {};
  final StreamController<Set<String>> _controller =
      StreamController<Set<String>>.broadcast();

  Stream<Set<String>> watchFavorites() => _controller.stream;

  bool isFavorite(String hostId) => _favoriteIds.contains(hostId);

  /// Toggles favorite status.
  /// Returns `true` if operation was successful.
  /// Returns `false` if user attempted to add a 7th favorite (max 6 constraint).
  bool toggleFavorite(String hostId) {
    if (_favoriteIds.contains(hostId)) {
      _favoriteIds.remove(hostId);
      _controller.add(Set<String>.from(_favoriteIds));
      return true;
    } else {
      if (_favoriteIds.length >= maxFavorites) {
        return false;
      }
      _favoriteIds.add(hostId);
      _controller.add(Set<String>.from(_favoriteIds));
      return true;
    }
  }

  Set<String> get currentFavorites => Set<String>.from(_favoriteIds);
}
