import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, requireCrmAuth } from "@/app/api/crm/_utils";
import { getOperationalAdminActorId, getSupabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

interface ApproveBody {
  applicationId: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireCrmAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const { applicationId } = await parseJsonBody<ApproveBody>(request);
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const actorId = getOperationalAdminActorId();

    const { data: application, error: appError } = await supabase
      .from("host_applications")
      .select("id, application_profile_id, display_name, phone, city, languages, bio, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError) throw appError;
    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const profileId = application.application_profile_id || crypto.randomUUID();
    await supabase.from("profiles").upsert({
      id: profileId,
      display_name: application.display_name,
      phone: application.phone || null,
      role: "host",
      about: application.bio || null,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("hosts").upsert({
      id: profileId,
      bio: application.bio || null,
      rate_per_audio_minute: 5,
      rate_per_video_minute: 10,
      is_available: true,
      updated_at: new Date().toISOString(),
    });

    const langs = (Array.isArray(application.languages) && application.languages.length > 0)
      ? application.languages
      : ["Tamil", "English"];
    await supabase.from("host_languages").delete().eq("host_id", profileId);
    await supabase.from("host_languages").insert(
      langs.map((l: string, idx: number) => ({
        host_id: profileId,
        language_code: l,
        is_primary: idx === 0,
      }))
    );

    await supabase.from("host_applications").update({
      status: "approved",
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", applicationId);

    return NextResponse.json({ ok: true, uid: profileId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Approval failed" }, { status: 500 });
  }
}
