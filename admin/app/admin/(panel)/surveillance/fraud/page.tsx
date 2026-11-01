export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { format } from "date-fns";
import { AlertCircle, ShieldAlert, Fingerprint, MapPin, Repeat, Ban } from "lucide-react";

type FraudSeverity = 'low' | 'medium' | 'high' | 'critical' | 'urgent'

interface FraudAlert {
  id: string
  type: string
  title: string
  severity: FraudSeverity
  description: string
  primaryUserId: string | null
  ipAddress: string | null
  deviceFingerprint: string | null
  timestamp: Date | null
}

async function getFraudAlerts(): Promise<FraudAlert[]> {

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("fraud_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

        return (data ?? []).map((doc): FraudAlert => ({
      id: typeof doc.id === 'string' ? doc.id : '',
      type: typeof doc.alert_type === 'string' ? doc.alert_type : 'unknown',
      title: typeof doc.alert_type === 'string' ? doc.alert_type.replace(/_/g, ' ') : 'Unknown alert',
      severity: (doc.severity === 'critical' || doc.severity === 'urgent')
        ? 'critical'
        : doc.severity === 'high'
        ? 'high'
        : doc.severity === 'medium'
        ? 'medium'
        : 'low',
      description: typeof doc.resolution_note === 'string' && doc.resolution_note
        ? doc.resolution_note
        : 'Multi-account or transaction anomaly detected',
      primaryUserId: typeof doc.user_id === 'string' ? doc.user_id : null,
      ipAddress: null,
      deviceFingerprint: null,
      timestamp: typeof doc.created_at === 'string' ? new Date(doc.created_at) : null,
    })).filter((alert) => alert.id.length > 0);

    } catch (error) {
    console.warn('Unable to load fraud alerts:', error);
    return [];

  }
}

export default async function FraudSurveillancePage() {
  const alerts = await getFraudAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShieldAlert className="text-red-500" />
          Fraud & Multi-Account Surveillance
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Detection of IP sharing, device fingerprint duplicates, and financial anomalies.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.length === 0 ? (
          <div className="py-20 bg-[#181818] border border-[#242424] border-dashed rounded-3xl flex flex-col items-center justify-center text-zinc-500 text-center">
            <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
            </div>
            <p className="font-bold text-white">No active fraud alerts.</p>
            <p className="text-sm">The system is running clean.</p>
          </div>
        ) : (
                    alerts.map((alert) => (

            <div key={alert.id} className="bg-[#181818] border border-red-900/30 rounded-2xl p-6 shadow-xl flex items-start gap-6 group relative">
              <div className={`p-4 rounded-xl ${
                (alert.severity === 'high' || alert.severity === 'critical' || alert.severity === 'urgent') ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {alert.type === 'multi_account' ? <Repeat size={24} /> : 
                 alert.type === 'ip_share' ? <MapPin size={24} /> : 
                 <Fingerprint size={24} />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">{alert.title || alert.type?.replace('_', ' ')}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        (alert.severity === 'high' || alert.severity === 'critical' || alert.severity === 'urgent') ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'
                    }`}>
                        {alert.severity} Risk
                    </span>
                </div>
                
                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                    {alert.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Primary UID</p>
                        <p className="text-xs font-mono text-zinc-300">{alert.primaryUserId?.slice(0, 12) ?? 'Not recorded'}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Conflict IP</p>
                        <p className="text-xs font-mono text-zinc-300">{alert.ipAddress || 'Unknown'}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Fingerprint</p>
                        <p className="text-xs font-mono text-zinc-300 truncate">{alert.deviceFingerprint ? `${alert.deviceFingerprint.slice(0, 8)}...` : 'Not recorded'}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Timestamp</p>
                        <p className="text-xs text-zinc-300">{alert.timestamp ? format(alert.timestamp, "HH:mm, MMM d") : 'N/A'}</p>
                    </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                    <Ban size={14} /> BAN USERS
                </button>
                <button className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all">
                    Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
