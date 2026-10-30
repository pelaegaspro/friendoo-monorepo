import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { dispatchAutomationEvent } from '@/lib/automation/dispatcher';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? '').trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }

    let phone = String(body.phone ?? '').trim().replace(/\s+/g, '');
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }
    if (!phone.startsWith('+')) {
      const rawDigits = phone.replace(/\D/g, '');
      phone = rawDigits.length === 10 ? `+91${rawDigits}` : `+${rawDigits}`;
    }

    const age = Number(body.age);
    if (!age || age < 18 || age > 99) {
      return NextResponse.json({ error: 'You must be at least 18 years old to apply as a host.' }, { status: 400 });
    }

    const city = String(body.city ?? '').trim();
    if (!city) {
      return NextResponse.json({ error: 'Please enter your city.' }, { status: 400 });
    }

    const languages = Array.isArray(body.languages) && body.languages.length > 0
      ? body.languages.map((l: unknown) => String(l).trim()).filter(Boolean)
      : ['Hindi', 'English'];

    const payoutType = body.payoutType === 'bank' ? 'bank' : 'upi';
    const payoutDetails = (body.payoutDetails && typeof body.payoutDetails === 'object')
      ? body.payoutDetails as Record<string, unknown>
      : {};

    const supabase = getSupabaseAdmin();

    const submittedPayload = {
      age,
      city,
      payout_type: payoutType,
      payout_details: payoutDetails,
      source: 'website_form',
      submitted_at: new Date().toISOString(),
    };

    // Check if an existing application with this phone exists to update it or insert new
    const { data: existingApp } = await supabase
      .from('host_applications')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    let applicationId = existingApp?.id;

    if (existingApp?.id) {
      const { error: updateError } = await supabase
        .from('host_applications')
        .update({
          display_name: name,
          city,
          languages,
          bio: String(body.bio ?? '').trim(),
          submitted_payload: submittedPayload,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingApp.id);

      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('host_applications')
        .insert({
          display_name: name,
          phone,
          city,
          languages,
          bio: String(body.bio ?? '').trim(),
          submitted_payload: submittedPayload,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      applicationId = inserted.id;
    }

    // Trigger Route 1: host.applied -> Make.com -> Google Sheets (Add Row) & Gmail (Welcome Email)
    void dispatchAutomationEvent({
      event: 'host.applied',
      data: {
        applicationId: applicationId || 'unknown',
        name,
        phone,
        city,
        age,
        languages,
        bio: String(body.bio ?? '').trim(),
        payoutType,
        appliedAt: new Date().toISOString(),
        adminReviewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/hosts`,
      },
    }).catch((err) => {
      console.warn('Non-blocking automation dispatch warning:', err);
    });

    return NextResponse.json({
      ok: true,
      message: 'Host application and payout details submitted successfully!',
      applicationId,
    });
  } catch (error) {
    console.error('Website host application error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}
