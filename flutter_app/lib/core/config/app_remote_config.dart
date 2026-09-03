import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../supabase/supabase_provider.dart';

class AppRemoteConfig {
  const AppRemoteConfig({
    this.maintenanceMode = false,
    this.maintenanceMessage,
    this.announcementBanner,
    this.enableFlashSales = true,
    this.supportPhone = '+919999999999',
    this.minAppVersion = '1.0.0',
    this.dynamicThemeColorHex = '#3B82F6',
  });

  final bool maintenanceMode;
  final String? maintenanceMessage;
  final String? announcementBanner;
  final bool enableFlashSales;
  final String supportPhone;
  final String minAppVersion;
  final String dynamicThemeColorHex;

  factory AppRemoteConfig.fromMap(Map<String, dynamic> map) {
    return AppRemoteConfig(
      maintenanceMode: map['maintenance_mode'] as bool? ?? false,
      maintenanceMessage: map['maintenance_message'] as String?,
      announcementBanner: map['announcement_banner'] as String?,
      enableFlashSales: map['enable_flash_sales'] as bool? ?? true,
      supportPhone: map['support_phone'] as String? ?? '+919999999999',
      minAppVersion: map['min_app_version'] as String? ?? '1.0.0',
      dynamicThemeColorHex: map['dynamic_theme_color_hex'] as String? ?? '#3B82F6',
    );
  }

  Map<String, dynamic> toMap() => {
    'maintenance_mode': maintenanceMode,
    'maintenance_message': maintenanceMessage,
    'announcement_banner': announcementBanner,
    'enable_flash_sales': enableFlashSales,
    'support_phone': supportPhone,
    'min_app_version': minAppVersion,
    'dynamic_theme_color_hex': dynamicThemeColorHex,
  };
}

class RemoteConfigService {
  const RemoteConfigService(this._client);
  final SupabaseClient _client;

  Future<AppRemoteConfig> fetchRemoteConfig() async {
    try {
      final res = await _client
          .from('crm_configuration_documents')
          .select('payload')
          .eq('id', 'app_remote_config')
          .maybeSingle();

      if (res != null && res['payload'] is Map) {
        return AppRemoteConfig.fromMap(Map<String, dynamic>.from(res['payload'] as Map));
      }
    } catch (_) {}
    return const AppRemoteConfig();
  }
}

final remoteConfigServiceProvider = Provider<RemoteConfigService>((ref) {
  return RemoteConfigService(ref.watch(supabaseProvider));
});

final appRemoteConfigProvider = FutureProvider<AppRemoteConfig>((ref) async {
  final service = ref.watch(remoteConfigServiceProvider);
  return service.fetchRemoteConfig();
});
