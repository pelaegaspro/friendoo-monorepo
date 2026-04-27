import '../../../models/host_model.dart';

const allFilterValue = 'All';

enum HostSortOption {
  onlineFirst('Online First'),
  topRated('Top Rated'),
  priceLowHigh('Price Low-High');

  const HostSortOption(this.label);

  final String label;

  static HostSortOption fromName(String? name) {
    return HostSortOption.values.firstWhere(
      (option) => option.name == name,
      orElse: () => HostSortOption.onlineFirst,
    );
  }
}

class HostFilterCriteria {
  final String age;
  final String language;
  final bool onlineOnly;
  final HostSortOption sort;

  const HostFilterCriteria({
    this.age = allFilterValue,
    this.language = allFilterValue,
    this.onlineOnly = false,
    this.sort = HostSortOption.onlineFirst,
  });

  bool get hasActiveFilter =>
      age != allFilterValue ||
      language != allFilterValue ||
      onlineOnly ||
      sort != HostSortOption.onlineFirst;

  HostFilterCriteria copyWith({
    String? age,
    String? language,
    bool? onlineOnly,
    HostSortOption? sort,
  }) {
    return HostFilterCriteria(
      age: age ?? this.age,
      language: language ?? this.language,
      onlineOnly: onlineOnly ?? this.onlineOnly,
      sort: sort ?? this.sort,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is HostFilterCriteria &&
        other.age == age &&
        other.language == language &&
        other.onlineOnly == onlineOnly &&
        other.sort == sort;
  }

  @override
  int get hashCode => Object.hash(age, language, onlineOnly, sort);
}

List<HostModel> applyHostFiltersAndSort(
  List<HostModel> hosts,
  HostFilterCriteria criteria,
) {
  final filtered = hosts.where((host) => hostMatchesCriteria(host, criteria));
  final sorted = filtered.toList();

  sorted.sort((a, b) {
    switch (criteria.sort) {
      case HostSortOption.topRated:
        final ratingCompare = b.rating.compareTo(a.rating);
        if (ratingCompare != 0) return ratingCompare;
        return b.reviewCount.compareTo(a.reviewCount);
      case HostSortOption.priceLowHigh:
        final rateCompare = a.ratePerAudioMinute.compareTo(b.ratePerAudioMinute);
        if (rateCompare != 0) return rateCompare;
        return b.rating.compareTo(a.rating);
      case HostSortOption.onlineFirst:
        final onlineCompare = _boolDesc(a.isOnline, b.isOnline);
        if (onlineCompare != 0) return onlineCompare;
        final busyCompare = _boolAsc(a.isOnCall, b.isOnCall);
        if (busyCompare != 0) return busyCompare;
        return b.rating.compareTo(a.rating);
    }
  });

  return sorted;
}

bool hostMatchesCriteria(HostModel host, HostFilterCriteria criteria) {
  if (criteria.onlineOnly && !host.isOnline) return false;

  if (criteria.age == '18-25' && (host.age < 18 || host.age > 25)) {
    return false;
  }
  if (criteria.age == '25-35' && (host.age <= 25 || host.age > 35)) {
    return false;
  }
  if (criteria.age == '35+' && host.age <= 35) {
    return false;
  }

  if (criteria.language != allFilterValue) {
    final expected = criteria.language.toLowerCase();
    final hasLanguage =
        host.languages.any((language) => language.toLowerCase() == expected);
    if (!hasLanguage) return false;
  }

  return true;
}

int _boolDesc(bool a, bool b) => (b ? 1 : 0).compareTo(a ? 1 : 0);

int _boolAsc(bool a, bool b) => (a ? 1 : 0).compareTo(b ? 1 : 0);
