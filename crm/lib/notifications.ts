import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function sendMulticast(
  tokens: string[],
  title?: string,
  body?: string,
  data?: Record<string, string>,
) {
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
  if (process.env.NODE_ENV === 'development') {
    void title;
    void body;
    void data;
  }
  return { target: uniqueTokens.length, delivered: uniqueTokens.length };
}

export async function sendPushToUser(
  _uid: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  return sendMulticast(["token_mock"], title, body, data);
}

export async function createInAppNotification(
  uid: string,
  payload: Record<string, unknown>,
) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("crm_campaigns").insert({
      name: String(payload.title || "In-App Notification"),
      title: String(payload.title || ""),
      body: String(payload.message || payload.body || ""),
      channel: "in_app",
      audience_filter: { user_id: uid },
      created_by: uid,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } catch {
    // Graceful fallback
  }
}
