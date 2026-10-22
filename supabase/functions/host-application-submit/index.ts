import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  allowedCorsHeaders,
  authenticatedUser,
  error,
  json,
  readJsonBody,
  serviceClient,
} from '../_shared/http.ts';

type IncomingApplicationBody = {
  // Website form fields:
  fullName?: string;
  name?: string;
  displayName?: string;
  phone?: string;
  phoneNumber?: string;
  city?: string;
  languages?: string[] | string;
  about?: string;
  bio?: string;
  isAdult?: boolean;
  isFemale?: boolean;
  agreedToTerms?: boolean;

  // App & explicit fields:
  age?: number | string;
  payout_type?: 'upi' | 'bank';
  payoutType?: 'upi' | 'bank';
  payout_details?: {
    upi_id?: string;
    account_number?: string;
    ifsc?: string;
    account_holder_name?: string;
    bank_name?: string;
  };
  payoutDetails?: {
    upi_id?: string;
    account_number?: string;
    ifsc?: string;
    account_holder_name?: string;
    bank_name?: string;
  };
};

Deno.serve(async (request) => {
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  if (request.method !== 'POST') return error('Method not allowed', 405, responseHeaders);

  try {
    const body = await readJsonBody<IncomingApplicationBody>(request);

    // Extract name
    const rawName = (body.fullName || body.name || body.displayName || '').trim();
    if (!rawName || rawName.length < 2) {
      return error('Please enter your full name', 400, responseHeaders);
    }

    // Extract phone
    const rawPhone = (body.phone || body.phoneNumber || '').trim();

    // Extract city
    const rawCity = (body.city || '').trim();

    // Extract languages
    let languagesList: string[] = [];
    if (Array.isArray(body.languages)) {
      languagesList = body.languages.map((l) => String(l).trim()).filter(Boolean);
    } else if (typeof body.languages === 'string' && body.languages.trim()) {
      languagesList = [body.languages.trim()];
    }
    if (languagesList.length === 0) {
      languagesList = ['Hindi', 'English'];
    }

    // Extract age
    let age = Number(body.age);
    if (!age || isNaN(age)) {
      age = body.isAdult ? 22 : 24;
    }

    // Extract bio/about
    const bio = (body.about || body.bio || '').trim();

    // Extract payout details
    const payoutType = (body.payout_type || body.payoutType) === 'bank' ? 'bank' : 'upi';
    const payoutDetails = body.payout_details || body.payoutDetails || {};

    // Check optional authentication
    let profileId: string | null = null;
    try {
      const authHeader = request.headers.get('Authorization') ?? '';
      if (authHeader.startsWith('Bearer ')) {
        const user = await authenticatedUser(request);
        if (user) {
          profileId = user.id;
        }
      }
    } catch (_) {
      // public anonymous submission from website
    }

    const admin = serviceClient();

    // If not authenticated, see if a profile exists by phone number
    let finalPhone = rawPhone;
    if (profileId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('phone, display_name')
        .eq('id', profileId)
        .maybeSingle();
      if (profile?.phone && !finalPhone) {
        finalPhone = profile.phone;
      }
    } else if (finalPhone) {
      const { data: matchedProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('phone', finalPhone)
        .maybeSingle();
      if (matchedProfile?.id) {
        profileId = matchedProfile.id;
      }
    }

    const submittedPayload = {
      age,
      city: rawCity,
      payout_type: payoutType,
      payout_details: payoutDetails,
      source: profileId ? 'app' : 'website',
      raw_submission: body,
      submitted_at: new Date().toISOString(),
    };

    // Check if application already exists for this phone or profileId
    let existingAppQuery = admin.from('host_applications').select('id');
    if (profileId) {
      existingAppQuery = existingAppQuery.eq('application_profile_id', profileId);
    } else if (finalPhone) {
      existingAppQuery = existingAppQuery.eq('phone', finalPhone);
    } else {
      existingAppQuery = existingAppQuery.eq('display_name', rawName);
    }

    const { data: existingApp } = await existingAppQuery.maybeSingle();

    if (existingApp?.id) {
      const { error: updateErr } = await admin
        .from('host_applications')
        .update({
          display_name: rawName,
          phone: finalPhone || null,
          city: rawCity || null,
          languages: languagesList,
          bio,
          submitted_payload: submittedPayload,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingApp.id);

      if (updateErr) {
        console.error('host-application-submit update error:', updateErr);
      }
    } else {
      const { error: insertErr } = await admin
        .from('host_applications')
        .insert({
          application_profile_id: profileId,
          display_name: rawName,
          phone: finalPhone || null,
          city: rawCity || null,
          languages: languagesList,
          bio,
          submitted_payload: submittedPayload,
          status: 'pending',
        });

      if (insertErr) {
        console.error('host-application-submit insert error:', insertErr);
        return error('Failed to save host application. Please try again.', 500, responseHeaders);
      }
    }

    // Update display name on profile if logged in
    if (profileId) {
      await admin
        .from('profiles')
        .update({
          display_name: rawName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
    }

    return json({
      success: true,
      message: 'Application received! Our team will review your profile and contact you on WhatsApp within 48 hours.',
      status: 'pending',
    }, 200, responseHeaders);
  } catch (caught) {
    console.error('host-application-submit exception:', caught);
    return error('Unable to submit host details', 500, responseHeaders);
  }
});
