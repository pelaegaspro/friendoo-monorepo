import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

String _source(String relativePath) =>
    File('../$relativePath').readAsStringSync();

void main() {
  group('security hardening regression controls', () {
    test('privileged web portals require the service-role key and never fall back to a publishable key', () {
      for (final path in [
        'admin/lib/supabaseServer.ts',
        'crm/lib/supabaseServer.ts',
      ]) {
        final source = _source(path);
        expect(source, contains('process.env.SUPABASE_SERVICE_ROLE_KEY'));
        expect(source, isNot(contains('SUPABASE_ANON_KEY')));
        expect(source, isNot(contains('NEXT_PUBLIC_SUPABASE_ANON_KEY')));
        expect(
          source,
          contains('if (!data || data.is_banned || data.role !== \'admin\')'),
        );
      }
    });

    test(
      'CRM session signing fails closed without a dedicated server secret',
      () {
        final source = _source('crm/lib/session.ts');

        expect(source, contains('CRM_SESSION_SECRET is required'));
        expect(source, isNot(contains('EPHEMERAL_KEY')));
        expect(source, isNot(contains('randomBytes')));
        expect(source, isNot(contains('process.env.ADMIN_PASSWORD')));
      },
    );

    test('admin and admin-issued CRM sessions use dedicated HMAC secrets instead of static password-derived cookies', () {
      final adminSession = _source('admin/lib/admin/session.ts');
      final adminCrmSession = _source('admin/lib/admin/crm-session.ts');

      expect(adminSession, contains('ADMIN_SESSION_SECRET'));
      expect(adminSession, contains('timingSafeEqual'));
      expect(adminSession, isNot(contains('friendoo-admin:')));
      expect(adminSession, isNot(contains('return value ===')));
      expect(adminCrmSession, contains('CRM_SESSION_SECRET is required'));
      expect(adminCrmSession, isNot(contains('friendoo-crm-change-me')));
      expect(adminCrmSession, isNot(contains('process.env.ADMIN_PASSWORD')));
      final loginRoute = _source('admin/app/api/admin/auth/login/route.ts');
      expect(loginRoute, contains('isValidAdminPassword'));
      expect(loginRoute, contains('ADMIN_SESSION_MAX_AGE_SECONDS'));
    });

    test('Admin proxy uses an Edge-compatible signed-session verifier', () {
      final proxy = _source('admin/proxy.ts');
      final edgeSession = _source('admin/lib/admin/edge-session.ts');
      final guard = _source('admin/lib/admin/guard.ts');
      final hostAction = _source('admin/lib/actions/hostActions.ts');
      final payoutAction = _source('admin/lib/actions/payoutActions.ts');

      expect(proxy, contains('export async function proxy'));
      expect(proxy, contains('isValidAdminSessionEdge'));
      expect(edgeSession, contains('crypto.subtle.importKey'));
      expect(edgeSession, isNot(contains("from 'crypto'")));
      expect(guard, contains('const cookieStore = await cookies()'));
      expect(hostAction, contains('isValidAdminSession'));
      expect(payoutAction, contains('hasAuthorizedAdminSession'));
    });

    test('CRM edge middleware verifies the signed session rather than trusting cookie presence', () {
      final source = _source('crm/proxy.ts');

      expect(source, contains('verifySessionValueForEdge'));
      expect(source, contains('export async function proxy'));
      expect(
        source,
        isNot(contains('if (!request.cookies.get(CRM_SESSION_COOKIE)?.value)')),
      );
    });

    test('profile mutations use allowlisted RPCs and never write role or ownership fields from the client', () {
      final repository = _source(
        'flutter_app/lib/features/profile/data/profile_repository.dart',
      );
      final migration = _source(
        'supabase/migrations/20260826_000028_profile_mutation_allowlist.sql',
      );

      expect(repository, contains("'update_own_profile'"));
      expect(repository, contains("'complete_initial_profile'"));
      expect(repository, isNot(contains("from('profiles').update")));
      expect(repository, isNot(contains("from('profiles').upsert")));
      expect(repository, isNot(contains("'is_host':")));
      expect(
        migration,
        contains('create or replace function public.update_own_profile'),
      );
      expect(migration, contains('where id = auth.uid()'));
      expect(migration, contains('where language is null'));
      expect(migration, isNot(contains('set role =')));
      expect(migration, isNot(contains('set is_banned =')));
      final updateStart = repository.indexOf(
        'Future<UserProfile> _updateOwnProfile',
      );
      final updateEnd = repository.indexOf(
        'Future<void> updateDisplayName',
        updateStart,
      );
      final updateBody = repository.substring(updateStart, updateEnd);
      expect(updateBody, contains('await fetchCurrentUserProfile()'));
      expect(updateBody, isNot(contains('result as Map')));
    });

    test('web portals pin the audited Next.js remediation release', () {
      for (final path in ['admin/package.json', 'crm/package.json']) {
        final package = _source(path);
        expect(package, contains('"next": "16.3.3"'));
        expect(package, contains('"eslint": "9.39.5"'));
        expect(package, contains('"eslint-config-next": "16.3.3"'));
        expect(package, contains('"lint": "eslint ."'));
        final lintConfig = _source(
          '${path.substring(0, path.length - 12)}/eslint.config.mjs',
        );
        expect(lintConfig, contains('eslint-config-next/core-web-vitals'));
        expect(lintConfig, contains('eslint-config-next/typescript'));
      }
    });

    test(
      'admin and CRM responses define baseline browser security headers',
      () {
        for (final path in ['admin/next.config.js', 'crm/next.config.mjs']) {
          final source = _source(path);
          expect(source, contains('Content-Security-Policy'));
          expect(source, contains('X-Content-Type-Options'));
          expect(source, contains('X-Frame-Options'));
          expect(source, contains('Referrer-Policy'));
          expect(source, contains('Permissions-Policy'));
        }
      },
    );

    test('CI uses immutable action references, least privilege, and runtime dependency audits', () {
      final workflow = _source('.github/workflows/web-portals.yml');

      expect(workflow, contains('permissions:'));
      expect(workflow, contains('contents: read'));
      expect(
        workflow,
        contains('actions/checkout@11d5960a326750d5838078e36cf38b85af677262'),
      );
      expect(
        workflow,
        contains('actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020'),
      );
      expect(workflow, contains('npm audit --omit=dev --audit-level=high'));
      expect(workflow, contains('npm ci --ignore-scripts'));
      expect(workflow, isNot(contains('npm rebuild --ignore-scripts=false')));
    });

    test('payment webhook processing has a durable replay ledger and security audit trail', () {
      final migration = _source(
        'supabase/migrations/20260826_000027_security_observability_and_webhook_replay.sql',
      );
      final webhook = _source('supabase/functions/cashfree-webhook/index.ts');

      expect(
        migration,
        contains('create table if not exists public.webhook_events'),
      );
      expect(migration, contains('unique (provider, event_fingerprint)'));
      expect(
        migration,
        contains('create table if not exists public.security_audit_events'),
      );
      expect(
        migration,
        contains('create or replace function public.reserve_webhook_event'),
      );
      expect(webhook, contains("rpc('reserve_webhook_event'"));
      expect(webhook, contains('readBodyLimited'));
      expect(webhook, contains('recordSecurityEvent'));
      expect(migration, contains('to service_role'));
      expect(migration, isNot(contains('to authenticated')));
    });

    test('legacy privileged RPCs and banner-ad mutations are restricted to their intended trust boundaries', () {
      final leastPrivilege = _source(
        'supabase/migrations/20260826_000030_legacy_rpc_execution_least_privilege.sql',
      );
      final bannerAds = _source(
        'supabase/migrations/20260826_000031_banner_ads_and_ad_event_authorization.sql',
      );

      expect(
        leastPrivilege,
        contains(
          'revoke all on function public.get_platform_financial_metrics() from public, anon, authenticated',
        ),
      );
      expect(
        leastPrivilege,
        contains(
          'grant execute on function public.get_platform_financial_metrics() to service_role',
        ),
      );
      expect(
        leastPrivilege,
        contains('grant execute on function public.complete_initial_profile(text, text) to authenticated, service_role'),
      );
      expect(bannerAds, contains('alter table public.banner_ads force row level security'));
      expect(bannerAds, contains('revoke insert, update, delete on public.banner_ads from anon, authenticated'));
      expect(bannerAds, contains("raise exception 'AUTHENTICATION_REQUIRED'"));
      expect(bannerAds, contains("p_event_type not in ('click', 'impression')"));
      expect(bannerAds, contains('and is_active = true'));
      expect(bannerAds, isNot(contains('email like')));
    });

    test('Backend 2 staging alert monitoring is deduplicated, forced-RLS, and excluded from client roles', () {
      final migration = _source(
        'supabase/migrations/20260827_000032_staging_security_alert_monitoring.sql',
      );

      expect(migration, contains('create table if not exists public.staging_security_alert_rules'));
      expect(migration, contains('create table if not exists public.staging_security_alerts'));
      expect(migration, contains('unique (rule_key, deduplication_key)'));
      expect(migration, contains('alter table public.staging_security_alert_rules force row level security'));
      expect(migration, contains('alter table public.staging_security_alerts force row level security'));
      expect(migration, contains('cashfree_webhook_failed'));
      expect(migration, contains('cashfree_confirm_rejected'));
      expect(migration, contains('capture_security_audit_alert'));
      expect(migration, contains('capture_webhook_failure_alert'));
      expect(migration, contains('grant select, insert, update, delete on public.staging_security_alerts to service_role'));
      expect(migration, isNot(contains('grant select, insert, update, delete on public.staging_security_alerts to authenticated')));
    });

    test('edge-function HTTP helpers reject arbitrary browser origins and oversized request bodies', () {
      final source = _source('supabase/functions/_shared/http.ts');

      expect(source, contains('allowedCorsHeaders'));
      expect(source, isNot(contains("'Access-Control-Allow-Origin': '*'")));
      expect(source, contains('readBodyLimited'));
      expect(source, contains('getReader()'));
      expect(source, contains('MAX_REQUEST_BODY_BYTES'));
      expect(source, contains("'Cache-Control': 'no-store'"));
    });

    test('legacy PayU webhook has no embedded provider credentials or loose signature fallback', () {
      final source = _source('supabase/functions/payu-webhook/index.ts');

      expect(source, contains("Deno.env.get('PAYU_MERCHANT_KEY')"));
      expect(source, contains("Deno.env.get('PAYU_MERCHANT_SALT')"));
      expect(source, isNot(contains("?? '7eMBxs'")));
      expect(source, isNot(contains("?? 'b5WvAHEHIKX35H1Kppq745Bbmo01dHRa'")));
      expect(source, contains('constantTimeEqual'));
      expect(source, contains('readBodyLimited'));
      expect(source, contains('key !== payuKey'));
    });

    test(
      'phone authentication has no fake OTP, test-phone, or client role bypass',
      () {
        final app = _source('flutter_app/lib/app/friendoo_app.dart');

        expect(app, isNot(contains("otp == '123456'")));
        expect(app, isNot(contains('7604991136')));
        expect(app, isNot(contains('8870947891')));
        expect(app, isNot(contains('Testing Host')));
        expect(app, isNot(contains('VIP Tester')));
        expect(
          app,
          contains('await _auth.verifySmsOtp(phone: fullPhone, code: otp)'),
        );
      },
    );

    test('host discovery and host settings use no fabricated host or direct client write path', () {
      final repository = _source(
        'flutter_app/lib/features/discover/data/host_repository.dart',
      );
      final migration = _source(
        'supabase/migrations/20260826_000029_host_mutation_allowlist.sql',
      );

      expect(
        repository,
        isNot(contains('00000000-0000-0000-0000-007604991136')),
      );
      expect(repository, isNot(contains('Testing Host')));
      expect(repository, isNot(contains("from('hosts').upsert")));
      expect(repository, isNot(contains("from('hosts').update")));
      expect(repository, contains("'set_own_host_availability'"));
      expect(repository, contains("'update_own_host_languages'"));
      for (final path in [
        'flutter_app/lib/features/calls/application/host_call_guard.dart',
        'flutter_app/lib/features/presence/data/presence_service.dart',
      ]) {
        final source = _source(path);
        expect(source, contains("'set_own_host_availability'"));
        expect(source, isNot(contains("from('hosts').upsert")));
      }
      expect(migration, contains("role = 'host'::public.app_role"));
      expect(
        migration,
        contains('revoke insert, update, delete on public.hosts'),
      );
      expect(migration, contains('HOST_RECORD_NOT_FOUND'));
    });

    test(
      'call lifecycle and media credentials remain server-authoritative',
      () {
        final repository = _source(
          'flutter_app/lib/features/calls/data/call_repository.dart',
        );

        expect(
          repository,
          isNot(contains('00000000-0000-0000-0000-007604991136')),
        );
        expect(repository, isNot(contains("from('calls').update")));
        expect(repository, isNot(contains('test_agora_token_')));
        expect(repository, isNot(contains('test_videosdk_token_')));
        expect(repository, isNot(contains("apiKey: 'test_key'")));
        expect(repository, contains('Unable to end the call on the server.'));

        for (final path in [
          'supabase/functions/call-initiate/index.ts',
          'supabase/functions/call-accept/index.ts',
          'supabase/functions/call-end/index.ts',
          'supabase/functions/agora-token/index.ts',
          'supabase/functions/videosdk-token/index.ts',
        ]) {
          final source = _source(path);
          expect(source, contains('allowedCorsHeaders'));
          expect(source, contains('readJsonBody'));
        }
      },
    );
  });
}
