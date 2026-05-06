import { getDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { Eye, User, Clock, Smartphone } from "lucide-react";

async function getBehaviorLogs() {
  const db = getDb();
  const snapshot = await db
    .collection("userBehaviorLogs")
    .orderBy("timestamp", "desc")
    .limit(100)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate(),
  }));
}

export default async function UserSurveillancePage() {
  const logs = await getBehaviorLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Eye className="text-purple-500" />
          User Behavior Surveillance
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Live silent tracking of all user actions across the platform.</p>
      </div>

      <div className="bg-[#181818] border border-[#242424] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242424] bg-[#1d1d1d]">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">User / Session</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Device</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                          {log.userId?.slice(0, 8)}...
                        </p>
                        <p className="text-[10px] text-zinc-600 font-mono">SID: {log.sessionId?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.eventType === 'page_view' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      log.eventType === 'button_click' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {log.eventType?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-zinc-400 max-w-xs truncate">
                      {log.metadata?.screen && (
                        <span className="text-white font-medium mr-2">Screen: {log.metadata.screen}</span>
                      )}
                      {log.metadata?.button && (
                        <span className="text-zinc-500 italic">Click: {log.metadata.button}</span>
                      )}
                      {log.metadata?.targetId && (
                        <p className="text-[10px] text-zinc-600 mt-1">Target: {log.metadata.targetId}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Smartphone size={12} />
                      <span className="text-[10px]">{log.deviceInfo?.model || 'Unknown Device'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                        <Clock size={12} className="text-zinc-500" />
                        {log.timestamp ? format(log.timestamp, "HH:mm:ss") : "N/A"}
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {log.timestamp ? format(log.timestamp, "MMM d, yyyy") : ""}
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
