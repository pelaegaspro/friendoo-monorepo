import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/features/user/utils/host_filters.dart';
import 'package:friendoo/models/host_model.dart';

void main() {
  test('filters by online, age, and language', () {
    final hosts = [
      _host(
        uid: '1',
        age: 22,
        languages: ['Hindi'],
        isOnline: true,
      ),
      _host(
        uid: '2',
        age: 31,
        languages: ['Tamil'],
        isOnline: true,
      ),
      _host(
        uid: '3',
        age: 24,
        languages: ['Hindi'],
        isOnline: false,
      ),
    ];

    final filtered = applyHostFiltersAndSort(
      hosts,
      const HostFilterCriteria(
        age: '18-25',
        language: 'Hindi',
        onlineOnly: true,
      ),
    );

    expect(filtered.map((host) => host.uid), ['1']);
  });

  test('sorts top rated and price low-high', () {
    final hosts = [
      _host(uid: 'high-price', rating: 4.8, rate: 10, reviewCount: 10),
      _host(uid: 'top', rating: 4.9, rate: 7, reviewCount: 5),
      _host(uid: 'cheap', rating: 4.2, rate: 5, reviewCount: 20),
    ];

    final topRated = applyHostFiltersAndSort(
      hosts,
      const HostFilterCriteria(sort: HostSortOption.topRated),
    );
    final priceLowHigh = applyHostFiltersAndSort(
      hosts,
      const HostFilterCriteria(sort: HostSortOption.priceLowHigh),
    );

    expect(topRated.map((host) => host.uid), ['top', 'high-price', 'cheap']);
    expect(priceLowHigh.map((host) => host.uid), ['cheap', 'top', 'high-price']);
  });
}

HostModel _host({
  required String uid,
  int age = 25,
  List<String> languages = const ['Hindi'],
  bool isOnline = true,
  bool isOnCall = false,
  double rating = 4.5,
  int rate = 5,
  int reviewCount = 0,
}) {
  return HostModel(
    uid: uid,
    name: uid,
    phone: '',
    age: age,
    languages: languages,
    avatarId: '',
    isOnline: isOnline,
    isOnCall: isOnCall,
    rating: rating,
    ratePerAudioMinute: rate,
    reviewCount: reviewCount,
    createdAt: DateTime(2026),
  );
}
