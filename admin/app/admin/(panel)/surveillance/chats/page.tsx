import { getDb } from "@/lib/firebaseAdmin";
import { format } from "date-fns";
import { MessageSquare, ShieldCheck, ShieldAlert, Clock, User } from "lucide-react";

async function getRecentMessages() {
  const db = getDb();
  // We need to fetch from all message subcollections, 
  // but for a surveillance feed, we might use a dedicated 'messages_feed' or similar.
  // For now, let's assume there's a collection or we're fetching high-level logs.
  // Let's use a mock-ready structure or fetch from a known flagged collection.
  const snapshot = await db
    .collectionGroup("messages")
    .orderBy("timestamp", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate(),
  }));
}

export default async function ChatSurveillancePage() {
  const messages = await getRecentMessages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="text-blue-500" />
          Chat Content Monitor
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Surveillance of anonymous messaging for safety and policy compliance.</p>
      </div>

      <div className="bg-[#181818] border border-[#242424] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#1d1d1d] border-b border-[#242424] flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Global Message Stream</h2>
            <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
                    <ShieldCheck size={10} /> 98% SAFE
                </span>
            </div>
        </div>
        
        <div className="divide-y divide-[#242424]">
          {messages.map((msg: any) => (
            <div key={msg.id} className="p-5 hover:bg-white/[0.01] transition-colors group relative">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded bg-zinc-800 flex items-center justify-center">
                        <User size={12} className="text-zinc-500" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono text-zinc-500 mr-2">SENDER: {msg.senderId?.slice(0, 8)}</span>
                        <span className="text-[10px] font-mono text-zinc-600">➔ RECIPIENT: {msg.receiverId?.slice(0, 8) || 'Unknown'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-600 text-[10px]">
                  <Clock size={10} />
                  {msg.timestamp ? format(msg.timestamp, "HH:mm:ss") : "N/A"}
                </div>
              </div>
              
              <div className="pl-10">
                <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                    {msg.text}
                </p>
                
                {msg.isFlagged && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-900/50 px-3 py-1.5 rounded-lg w-fit">
                        <ShieldAlert size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Flagged for Review: {msg.flagReason || 'Toxicity'}</span>
                    </div>
                )}
              </div>

              <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg shadow-lg">
                    BAN SENDER
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
