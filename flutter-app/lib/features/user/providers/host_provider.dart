import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/host_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../utils/host_filters.dart';

/// Stream of approved hosts with Firestore-backed filtering where possible.
final hostsProvider =
    StreamProvider.family<List<HostModel>, HostFilterCriteria>((ref, filters) {
  final firestore = ref.watch(firestoreProvider);
  Query<Map<String, dynamic>> query = firestore
      .collection(AppConstants.hostsCollection)
      .where('isApproved', isEqualTo: true);

  if (filters.onlineOnly) {
    query = query.where('isOnline', isEqualTo: true);
  }

  if (filters.language != allFilterValue) {
    query = query.where('languages', arrayContains: filters.language);
  }

  if (filters.age == '18-25') {
    query = query.where('age', isGreaterThanOrEqualTo: 18).where(
          'age',
          isLessThanOrEqualTo: 25,
        );
  } else if (filters.age == '25-35') {
    query = query.where('age', isGreaterThan: 25).where(
          'age',
          isLessThanOrEqualTo: 35,
        );
  } else if (filters.age == '35+') {
    query = query.where('age', isGreaterThan: 35);
  }

  return query.snapshots().map((snap) {
    final hosts = snap.docs.map(HostModel.fromFirestore).toList();
    return applyHostFiltersAndSort(hosts, filters);
  });
});

/// Single host by uid
final hostProvider = StreamProvider.family<HostModel?, String>((ref, uid) {
  final firestore = ref.watch(firestoreProvider);
  return firestore
      .collection(AppConstants.hostsCollection)
      .doc(uid)
      .snapshots()
      .map((doc) => doc.exists ? HostModel.fromFirestore(doc) : null);
});

/// Future-based single host (used in call screens)
final singleHostProvider =
    FutureProvider.family<HostModel?, String>((ref, uid) async {
  final firestore = ref.watch(firestoreProvider);
  final doc =
      await firestore.collection(AppConstants.hostsCollection).doc(uid).get();
  return doc.exists ? HostModel.fromFirestore(doc) : null;
});
