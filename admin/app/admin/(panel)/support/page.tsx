'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Headphones,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Coins,
  CreditCard,
  User,
  Radio,
  Zap,
  Inbox,
  Filter,
  Languages,
  MessageSquarePlus,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface SupportSession {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  role: 'user' | 'host';
  scenario: string;
  subject: string;
  status: 'active' | 'resolved' | 'pending';
  utr?: string;
  amount?: string;
  payoutId?: string;
  language?: string;
  lastMessage: string;
  lastMessageTime: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin' | 'bot';
  senderName: string;
  content: string;
  timestamp: string;
}

interface IncomingAlert {
  userId: string;
  name: string;
  role: string;
  language?: string;
  message: string;
  timestamp: string;
}

export default function SupportDeskPage() {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [activeSession, setActiveSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'host'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Incoming Alert Popup State
  const [incomingAlert, setIncomingAlert] = useState<IncomingAlert | null>(null);

  // AI Translation State
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});
  const [targetReplyLang, setTargetReplyLang] = useState<string>('hi');
  const [isTranslatingReply, setIsTranslatingReply] = useState<boolean>(false);

  // Direct Message Modal State (Admin outreach to user/host)
  const [showDirectOutreachModal, setShowDirectOutreachModal] = useState(false);
  const [directUserId, setDirectUserId] = useState('');
  const [directRole, setDirectRole] = useState<'user' | 'host'>('user');
  const [directLang, setDirectLang] = useState('en');
  const [directSubject, setDirectSubject] = useState('Official Account Notice');
  const [directMessage, setDirectMessage] = useState('');
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch real live tickets from Supabase database (Zero Mock Data)
  const fetchLiveTickets = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: tickets, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (ticketError) {
        console.error('Error fetching live tickets:', ticketError);
        toast.error('Could not load live support tickets');
        setIsLoading(false);
        return;
      }

      if (!tickets || tickets.length === 0) {
        setSessions([]);
        setActiveSession(null);
        setMessages([]);
        setIsLoading(false);
        return;
      }

      // Fetch corresponding user profiles
      const reporterIds = Array.from(new Set(tickets.map((t) => t.reporter_id).filter(Boolean)));
      let profileMap: Record<string, { display_name: string; phone?: string; role: string; languages?: string[] }> = {};

      if (reporterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, phone, role, preferred_languages')
          .in('id', reporterIds);

        if (profiles) {
          profiles.forEach((p) => {
            profileMap[p.id] = {
              display_name: p.display_name || 'Friendoo User',
              phone: p.phone,
              role: p.role || 'user',
              languages: p.preferred_languages,
            };
          });
        }
      }

      // Map real database rows to session model
      const liveSessions: SupportSession[] = tickets.map((t) => {
        const meta = t.metadata || {};
        const profile = profileMap[t.reporter_id];
        const role: 'user' | 'host' =
          meta.reporter_role === 'host' || profile?.role === 'host' ? 'host' : 'user';

        const name =
          meta.reporter_name || profile?.display_name || (role === 'host' ? 'Host User' : 'Caller User');
        const phone = meta.reporter_phone || profile?.phone;
        const utr = meta.utr || meta.order_id || (t.subject?.match(/\b\d{12}\b/)?.[0]);
        const payoutId = meta.payout_id || meta.payoutId;
        const amount = meta.amount_inr ? `₹${meta.amount_inr}` : meta.amount;
        const language = meta.language || (profile?.languages?.length ? profile.languages[0] : 'Tamil');

        const timeStr = new Date(t.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return {
          id: t.id,
          userId: t.reporter_id || t.id,
          name,
          phone,
          role,
          scenario: meta.scenario || t.category || 'general',
          subject: t.subject || 'Support Ticket',
          status: (t.status === 'resolved' ? 'resolved' : 'active') as 'active' | 'resolved' | 'pending',
          utr,
          amount,
          payoutId,
          language,
          lastMessage: meta.verification_error || t.subject,
          lastMessageTime: timeStr,
          createdAt: t.created_at,
        };
      });

      setSessions(liveSessions);
      if (!activeSession && liveSessions.length > 0) {
        setActiveSession(liveSessions[0]);
        setMessages([
          {
            id: `msg-${liveSessions[0].id}`,
            sender: 'user',
            senderName: liveSessions[0].name,
            content: liveSessions[0].lastMessage,
            timestamp: liveSessions[0].lastMessageTime,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load live sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession]);

  useEffect(() => {
    fetchLiveTickets();
  }, [fetchLiveTickets]);

  // Global desk channel for incoming real-time alerts across all users
  useEffect(() => {
    if (!supabase) return;
    const globalChannel = supabase.channel('support_live_desk');

    const handleIncomingAlert = (data: any) => {
      if (!data) return;

      // Pop-up Alert on Admin Screen
      setIncomingAlert({
        userId: data.userId,
        name: data.name || 'Live User',
        role: (data.role as 'user' | 'host') || 'user',
        language: data.language || 'Tamil',
        message: data.message || 'Customer requested live support.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      toast.success(`🎧 Live Support Alert: ${data.name || 'User'} (${data.language || 'Tamil'}) connected!`, {
        duration: 8000,
        icon: '🔔',
      });

      const newSession: SupportSession = {
        id: data.ticketId || `sess-${Date.now()}`,
        userId: data.userId,
        name: data.name || 'Live Caller',
        phone: data.phone,
        role: (data.role as 'user' | 'host') || 'user',
        scenario: data.scenario || 'live_support',
        subject: `Live Support Request: ${data.name || 'User'}`,
        status: 'active',
        language: data.language || 'Tamil',
        lastMessage: data.message || 'Connected to live support desk',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: data.timestamp || new Date().toISOString(),
      };

      setSessions((prev) => [newSession, ...prev.filter((s) => s.userId !== data.userId)]);
    };

    globalChannel
      .on('broadcast', { event: 'new_live_session' }, (payload) => {
        handleIncomingAlert(payload.payload);
      })
      .on('broadcast', { event: 'incoming_chat_alert' }, (payload) => {
        handleIncomingAlert(payload.payload);
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(globalChannel);
    };
  }, []);

  // Realtime subscription for live incoming broadcast messages on active user channel
  useEffect(() => {
    if (!supabase || !activeSession?.userId) return;

    const channelName = `support_live:${activeSession.userId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'user_message' }, (payload) => {
        const msg = payload.payload;
        if (msg && msg.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `user-${Date.now()}`,
              sender: 'user',
              senderName: activeSession.name,
              content: msg.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .on('broadcast', { event: 'user_attachment' }, (payload) => {
        const msg = payload.payload;
        toast.success(`📎 Attachment received from ${activeSession.name}`);
        if (msg && msg.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}`,
              sender: 'user',
              senderName: activeSession.name,
              content: msg.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .on('broadcast', { event: 'user_voice_message' }, (payload) => {
        const msg = payload.payload;
        toast(`🎙️ Voice note from ${activeSession.name}`);
        if (msg && msg.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `voice-${Date.now()}`,
              sender: 'user',
              senderName: activeSession.name,
              content: `🎙️ Voice Note: "${msg.message}"`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .on('broadcast', { event: 'critical_safety_report' }, (payload) => {
        const msg = payload.payload;
        toast.error(`🚨 Critical Safety: ${activeSession.name} reported abuse/extortion!`, {
          duration: 8000,
        });
        if (msg && msg.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `safety-${Date.now()}`,
              sender: 'user',
              senderName: activeSession.name,
              content: `🚨 ${msg.message}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .on('broadcast', { event: 'user_escalation_request' }, (payload) => {
        const msg = payload.payload;
        if (msg && msg.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `user-esc-${Date.now()}`,
              sender: 'user',
              senderName: activeSession.name,
              content: `[Human Support Escalation]: ${msg.message}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .subscribe((status) => {
        setIsLiveConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [activeSession?.userId, activeSession?.name]);

  // Send Reply directly to App
  const handleSendReply = async (textToSend?: string) => {
    const text = (textToSend || replyInput).trim();
    if (!text || !activeSession) return;

    const newMsg: ChatMessage = {
      id: `admin-${Date.now()}`,
      sender: 'admin',
      senderName: 'Friendoo Admin Support 🛡️',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyInput('');

    // Broadcast directly to user's Support Sheet in real-time
    if (supabase && activeSession.userId) {
      try {
        const channel = supabase.channel(`support_live:${activeSession.userId}`);
        await channel.send({
          type: 'broadcast',
          event: 'admin_message',
          payload: {
            message: text,
            sender: 'Friendoo Official Admin 🛡️',
            ticketId: activeSession.id,
            timestamp: new Date().toISOString(),
          },
        });
        toast.success('Delivered to user screen & notification badge in real-time');
      } catch (err) {
        console.error('Error broadcasting reply:', err);
        toast.error('Failed to broadcast to live channel');
      }
    }
  };

  // Groq AI Translation for incoming regional message
  const handleTranslateMessage = async (msgId: string, text: string) => {
    try {
      setIsTranslating((prev) => ({ ...prev, [msgId]: true }));
      const res = await fetch('/api/support/ai-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'en' }),
      });
      const data = await res.json();
      if (data.translatedText) {
        setTranslatedMessages((prev) => ({ ...prev, [msgId]: data.translatedText }));
        toast.success('Translated to English via Groq AI');
      } else {
        toast.error('Translation returned empty');
      }
    } catch (err) {
      toast.error('Failed to translate message');
    } finally {
      setIsTranslating((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  // Groq AI Translation & Send for outgoing admin message
  const handleTranslateAndSend = async () => {
    if (!replyInput.trim()) return;
    try {
      setIsTranslatingReply(true);
      const res = await fetch('/api/support/ai-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyInput.trim(), targetLang: targetReplyLang }),
      });
      const data = await res.json();
      const textToSend = data.translatedText || replyInput.trim();
      await handleSendReply(textToSend);
      toast.success(`Translated to ${data.targetLanguageName || targetReplyLang} & sent!`);
    } catch (err) {
      toast.error('Translation error, sending original text');
      await handleSendReply();
    } finally {
      setIsTranslatingReply(false);
    }
  };

  // Mark Ticket as Resolved & Broadcast to clear in-app badge
  const handleMarkResolved = async () => {
    if (!activeSession) return;
    try {
      // 1. Broadcast resolution to user's live channel to dismiss in-app badge/banner
      if (supabase && activeSession.userId) {
        const channel = supabase.channel(`support_live:${activeSession.userId}`);
        await channel.send({
          type: 'broadcast',
          event: 'ticket_resolved',
          payload: {
            ticketId: activeSession.id,
            message: 'Your inquiry has been resolved by our support team.',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 2. Update ticket status in database
      if (supabase && activeSession.id && !activeSession.id.startsWith('sess-')) {
        await supabase
          .from('support_tickets')
          .update({ status: 'resolved', updated_at: new Date().toISOString() })
          .eq('id', activeSession.id);
      }

      // 3. Update local sessions state
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, status: 'resolved' as const } : s))
      );
      setActiveSession((prev) => (prev ? { ...prev, status: 'resolved' as const } : null));

      toast.success('Issue marked as resolved! User app notification and badge dismissed.', {
        icon: '✅',
      });
    } catch (err) {
      console.error('Failed to mark resolved:', err);
      toast.error('Failed to mark resolved');
    }
  };

  // Direct Message outreach to any user or host
  const handleSendDirectOutreach = async () => {
    if (!directUserId.trim() || !directMessage.trim()) return;

    try {
      setIsSendingDirect(true);

      let finalMessage = directMessage.trim();
      if (directLang !== 'en') {
        const res = await fetch('/api/support/ai-translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: directMessage.trim(), targetLang: directLang }),
        });
        const data = await res.json();
        if (data.translatedText) {
          finalMessage = data.translatedText;
        }
      }

      // 1. Broadcast directly to target user phone
      if (supabase) {
        const channel = supabase.channel(`support_live:${directUserId.trim()}`);
        await channel.send({
          type: 'broadcast',
          event: 'admin_message',
          payload: {
            message: finalMessage,
            sender: 'Friendoo Official Admin 🛡️',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 2. Persist in support_tickets table
      let createdTicketId = `sess-${Date.now()}`;
      if (supabase) {
        try {
          const { data: insertedTicket } = await supabase
            .from('support_tickets')
            .insert({
              reporter_id: directUserId.trim(),
              category: 'admin_outreach',
              subject: directSubject.trim(),
              status: 'active',
              priority: 'high',
              metadata: {
                admin_direct_message: true,
                last_admin_message: finalMessage,
                reporter_role: directRole,
              },
            })
            .select()
            .single();

          if (insertedTicket?.id) {
            createdTicketId = insertedTicket.id;
          }
        } catch (_) {}
      }

      // 3. Add to live queue
      const newSession: SupportSession = {
        id: createdTicketId,
        userId: directUserId.trim(),
        name: `${directRole === 'host' ? 'Host' : 'User'} (${directUserId.slice(0, 8)})`,
        role: directRole,
        scenario: 'admin_outreach',
        subject: directSubject.trim(),
        status: 'active',
        lastMessage: finalMessage,
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) => [newSession, ...prev.filter((s) => s.userId !== directUserId.trim())]);
      setActiveSession(newSession);
      setMessages([
        {
          id: `admin-${Date.now()}`,
          sender: 'admin',
          senderName: 'Friendoo Admin Support 🛡️',
          content: finalMessage,
          timestamp: newSession.lastMessageTime,
        },
      ]);

      setShowDirectOutreachModal(false);
      setDirectMessage('');
      setDirectUserId('');
      toast.success('Direct message delivered to user screen & badge triggered!');
    } catch (err) {
      console.error('Error sending direct outreach:', err);
      toast.error('Failed to send direct message');
    } finally {
      setIsSendingDirect(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterRole !== 'all' && s.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.userId.toLowerCase().includes(q) ||
        (s.utr && s.utr.toLowerCase().includes(q)) ||
        (s.payoutId && s.payoutId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#091E24] border border-[#164E53]/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#2FE5A7] to-[#60CECA] flex items-center justify-center text-[#041D20] shadow-lg shadow-[#2FE5A7]/20">
            <Headphones className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">24/7 Live Support Desk</h1>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Realtime Wire
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Groq AI Translation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero mock data • Direct 1-on-1 human assistance connected to verified live users with real-time regional translation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Message / Outreach Button */}
          <button
            onClick={() => setShowDirectOutreachModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-[0.97] border border-purple-500/30 shadow-lg shadow-purple-600/20 transition-transform duration-100 ease-out"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            + Direct Message to User/Host
          </button>

          {/* Sync Button */}
          <button
            onClick={() => {
              fetchLiveTickets();
              toast.success('Live database queue synced');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 active:scale-[0.97] border border-white/10 transition-transform duration-100 ease-out"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
        </div>
      </div>

      {/* Main 2-Pane Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left: Real Live Database Queue (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl bg-[#071519]/90 border border-[#13383B] backdrop-blur-xl overflow-hidden shadow-lg">
          {/* Filter Bar */}
          <div className="p-3.5 border-b border-[#13383B] space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user, UTR, Payout ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#040D12] border border-[#164E53]/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2FE5A7]/60"
              />
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setFilterRole('all')}
                className={`flex-1 py-1 text-xs rounded-lg font-medium active:scale-[0.97] transition-all duration-100 ease-out ${
                  filterRole === 'all'
                    ? 'bg-[#2FE5A7]/15 text-[#2FE5A7] border border-[#2FE5A7]/30'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                All Queues
              </button>
              <button
                onClick={() => setFilterRole('user')}
                className={`flex-1 py-1 text-xs rounded-lg font-medium active:scale-[0.97] transition-all duration-100 ease-out ${
                  filterRole === 'user'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                Callers [USER]
              </button>
              <button
                onClick={() => setFilterRole('host')}
                className={`flex-1 py-1 text-xs rounded-lg font-medium active:scale-[0.97] transition-all duration-100 ease-out ${
                  filterRole === 'host'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                Hosts [HOST]
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#13383B]/50 p-2 space-y-1.5">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading live tickets from database...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-white">No Open Live Tickets</p>
                <p className="text-[11px] text-slate-400">
                  All live issues resolved. When a user or host requests human support in the app, their ticket will
                  stream here instantly.
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = activeSession?.id === session.id;
                const isHost = session.role === 'host';
                const isResolved = session.status === 'resolved';

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveSession(session);
                      setMessages([
                        {
                          id: `initial-${Date.now()}`,
                          sender: 'user',
                          senderName: session.name,
                          content: session.lastMessage,
                          timestamp: session.lastMessageTime,
                        },
                      ]);
                    }}
                    className={`p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-transform duration-100 ease-out ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#0C2B30] to-[#0A2226] border border-[#2FE5A7]/40 shadow-md'
                        : isResolved
                        ? 'bg-white/[0.02] opacity-60 hover:opacity-100 border border-transparent'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isHost
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black'
                              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                          }`}
                        >
                          {session.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white tracking-wide">{session.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                isHost
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {isHost ? 'HOST' : 'CALLER'}
                            </span>
                            {session.language && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/20">
                                {session.language}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {session.phone || session.userId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.lastMessageTime}
                        </span>
                        {isResolved && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-700/50 text-slate-400">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 font-medium line-clamp-1">{session.subject}</p>

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {session.utr && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                          UTR: {session.utr}
                        </span>
                      )}
                      {session.payoutId && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono">
                          ID: {session.payoutId}
                        </span>
                      )}
                      {session.amount && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 text-[10px]">
                          {session.amount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Realtime 1-on-1 Chat Terminal (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl bg-[#071519]/90 border border-[#13383B] backdrop-blur-xl overflow-hidden shadow-lg">
          {activeSession ? (
            <>
              {/* Active Chat Header */}
              <div className="p-4 border-b border-[#13383B] flex items-center justify-between bg-[#040D12]/60">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                      activeSession.role === 'host'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }`}
                  >
                    {activeSession.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-wide">{activeSession.name}</h3>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          activeSession.role === 'host'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {activeSession.role === 'host' ? 'VERIFIED HOST' : 'CALLER USER'}
                      </span>
                      {activeSession.language && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {activeSession.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium ml-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Wire
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      User ID: <code className="text-slate-300 font-mono">{activeSession.userId}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mark as Resolved Button */}
                  <button
                    onClick={handleMarkResolved}
                    disabled={activeSession.status === 'resolved'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-[0.96] transition-all duration-100 ease-out border ${
                      activeSession.status === 'resolved'
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30 shadow-md shadow-emerald-500/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {activeSession.status === 'resolved' ? 'Resolved' : 'Mark as Resolved'}
                  </button>
                </div>
              </div>

              {/* Scenario Context Card */}
              <div className="px-4 py-2.5 bg-[#0C2226] border-b border-[#13383B] flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-semibold text-white">{activeSession.subject}</span>
                  {activeSession.utr && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      UTR: {activeSession.utr}
                    </span>
                  )}
                  {activeSession.payoutId && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      Payout: {activeSession.payoutId}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Status: <span className="text-emerald-400 font-semibold uppercase">{activeSession.status}</span>
                </div>
              </div>

              {/* Live Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#040D12]/40">
                {messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 shadow-md ${
                          isAdmin
                            ? 'bg-gradient-to-r from-[#0C3830] to-[#0A2D27] text-white border border-[#2FE5A7]/40 rounded-tr-none'
                            : msg.content.startsWith('🚨')
                            ? 'bg-[#2A0E14] text-red-100 border border-red-500/50 rounded-tl-none'
                            : msg.content.startsWith('🎙️')
                            ? 'bg-[#0E2429] text-emerald-100 border border-emerald-500/40 rounded-tl-none'
                            : msg.content.includes('Attachment') || msg.content.includes('Screenshot') || msg.content.includes('Statement')
                            ? 'bg-[#15202E] text-sky-100 border border-sky-500/40 rounded-tl-none'
                            : 'bg-[#16272E] text-slate-100 border border-[#203D45] rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                          <span className={`font-bold ${isAdmin ? 'text-[#2FE5A7]' : 'text-purple-300'}`}>
                            {msg.senderName}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>

                        {msg.content.startsWith('🎙️') && (
                          <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 w-fit text-[10px] text-emerald-300 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Groq Whisper Transcribed
                          </div>
                        )}

                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {/* Inline Groq Translation for User Message */}
                        {!isAdmin && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1.5">
                            {translatedMessages[msg.id] ? (
                              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-200">
                                <span className="font-bold text-emerald-400">🌐 Groq English: </span>
                                {translatedMessages[msg.id]}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleTranslateMessage(msg.id, msg.content)}
                                disabled={isTranslating[msg.id]}
                                className="self-start flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-emerald-300 border border-emerald-500/20 font-medium active:scale-[0.96] transition-transform"
                              >
                                <Languages className="w-3 h-3" />
                                {isTranslating[msg.id] ? 'Translating...' : 'Translate to English (Groq AI)'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Fast Response Template Pills */}
              <div className="px-4 py-2 border-t border-[#13383B] bg-[#07191E] flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Quick Responses:</span>
                {activeSession.role === 'host' ? (
                  <>
                    <button
                      onClick={() =>
                        handleSendReply(
                          '🏦 Namaste! Your withdrawal has been verified with Cashfree. Bank IMPS clearance is in progress and funds will reach your account within 24 business hours.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-[0.96] border border-amber-500/20 whitespace-nowrap transition-transform duration-100 ease-out"
                    >
                      Payout Verified (24h)
                    </button>
                    <button
                      onClick={() =>
                        handleSendReply(
                          '🔍 Please verify that your UPI ID or Bank account details in Host Dashboard are active and error-free.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 active:scale-[0.96] border border-white/10 whitespace-nowrap transition-transform duration-100 ease-out"
                    >
                      Request Bank Verification
                    </button>
                    <button
                      onClick={() =>
                        handleSendReply(
                          '🛡️ The reported caller has been investigated and their calling privileges have been suspended. Your safety is our #1 priority.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 active:scale-[0.96] border border-purple-500/20 whitespace-nowrap transition-transform duration-100 ease-out"
                    >
                      Caller Suspended
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleSendReply(
                          '✅ We have verified your UTR with the payment gateway. The coins have been credited to your Friendoo wallet balance immediately!'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 active:scale-[0.96] border border-emerald-500/20 whitespace-nowrap transition-transform duration-100 ease-out"
                    >
                      UTR Verified & Coins Credited
                    </button>
                    <button
                      onClick={() =>
                        handleSendReply(
                          '🔍 UPI payments may occasionally take 5–15 minutes for bank network clearing. If coins are not added within 15 minutes, please confirm your 12-digit UTR.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 active:scale-[0.96] border border-white/10 whitespace-nowrap transition-transform duration-100 ease-out"
                    >
                      Wait 5-15m Clearance
                    </button>
                    <button
                      onClick={() =>
                        handleSendReply(
                          '📞 Your call under 15 seconds qualified for an instant refund. The deducted coins have been restored to your wallet.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 active:scale-[0.96] border border-purple-500/20 whitespace-nowrap transition-transform duration-100 ease-out"
                    >
                      Call Drop Refund Approved
                    </button>
                  </>
                )}
              </div>

              {/* Chat Input Bar with Groq Translation */}
              <div className="p-3 bg-[#040D12] border-t border-[#13383B] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  placeholder={`Send 1-on-1 reply to ${activeSession.name} on their phone...`}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                  className="flex-1 bg-[#071A20] border border-[#164E53]/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2FE5A7]/60"
                />

                <div className="flex items-center gap-2 justify-end">
                  {/* Language Selector */}
                  <select
                    value={targetReplyLang}
                    onChange={(e) => setTargetReplyLang(e.target.value)}
                    className="bg-[#071A20] text-xs text-purple-300 border border-purple-500/40 rounded-xl px-2.5 py-2.5 focus:outline-none"
                  >
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="ml">Malayalam (മലയാളം)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="mr">Marathi (मराठी)</option>
                  </select>

                  {/* AI Translate & Send Button */}
                  <button
                    onClick={handleTranslateAndSend}
                    disabled={!replyInput.trim() || isTranslatingReply}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 active:scale-[0.96] disabled:opacity-40 border border-purple-500/30 flex items-center gap-1.5 transition-all"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {isTranslatingReply ? 'Translating...' : 'AI Translate & Send'}
                  </button>

                  {/* Direct Send Button */}
                  <button
                    onClick={() => handleSendReply()}
                    disabled={!replyInput.trim()}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#2FE5A7] to-[#60CECA] text-[#041D20] hover:opacity-95 active:scale-[0.96] disabled:opacity-40 transition-all duration-100 ease-out flex items-center gap-2 shadow-lg shadow-[#2FE5A7]/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 text-slate-500">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Select a Live Support Session</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose an active session from the left queue to open the real-time 1-on-1 communication terminal with
                the user.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Incoming Chat Alert Pop-Up Modal */}
      {incomingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#091E24] border-2 border-[#2FE5A7] p-5 shadow-2xl shadow-[#2FE5A7]/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#2FE5A7] flex items-center justify-center border border-emerald-500/30">
                  <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Live Support Request</h3>
                  <span className="text-[11px] text-emerald-400 font-medium">Just tapped "Chat with Support Team"</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#2FE5A7]/20 text-[#2FE5A7] border border-[#2FE5A7]/30">
                {incomingAlert.role || 'USER'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#040D12] border border-[#164E53]/40 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Name: <strong className="text-white">{incomingAlert.name}</strong></span>
                <span>Language: <strong className="text-emerald-300">{incomingAlert.language || 'Tamil'}</strong></span>
              </div>
              <p className="text-slate-300 pt-1 italic font-medium">"{incomingAlert.message}"</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIncomingAlert(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 active:scale-[0.97]"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  const sess: SupportSession = {
                    id: `sess-${Date.now()}`,
                    userId: incomingAlert.userId,
                    name: incomingAlert.name,
                    role: incomingAlert.role as 'user' | 'host',
                    scenario: 'live_support',
                    subject: `Live Chat: ${incomingAlert.name}`,
                    status: 'active',
                    language: incomingAlert.language || 'Tamil',
                    lastMessage: incomingAlert.message,
                    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: new Date().toISOString(),
                  };
                  setSessions((prev) => [sess, ...prev.filter((s) => s.userId !== incomingAlert.userId)]);
                  setActiveSession(sess);
                  setMessages([
                    {
                      id: `msg-${Date.now()}`,
                      sender: 'user',
                      senderName: sess.name,
                      content: sess.lastMessage,
                      timestamp: sess.lastMessageTime,
                    },
                  ]);
                  setIncomingAlert(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#041D20] bg-gradient-to-r from-[#2FE5A7] to-[#60CECA] hover:opacity-95 active:scale-[0.97] shadow-lg shadow-[#2FE5A7]/20"
              >
                Open Chat Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Outreach Modal (Admin to User/Host) */}
      {showDirectOutreachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-[#091E24] border border-[#164E53] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#164E53]/40">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Direct Message to User / Host</h3>
              </div>
              <button
                onClick={() => setShowDirectOutreachModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Target User ID / Profile ID</label>
                <input
                  type="text"
                  placeholder="e.g. 11111111-0000-4000-8000-000000000001"
                  value={directUserId}
                  onChange={(e) => setDirectUserId(e.target.value)}
                  className="w-full bg-[#040D12] border border-[#164E53]/60 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Target Role</label>
                  <select
                    value={directRole}
                    onChange={(e) => setDirectRole(e.target.value as 'user' | 'host')}
                    className="w-full bg-[#040D12] border border-[#164E53]/60 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="user">Caller (User)</option>
                    <option value="host">Host</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Target Language (AI Translate)</label>
                  <select
                    value={directLang}
                    onChange={(e) => setDirectLang(e.target.value)}
                    className="w-full bg-[#040D12] border border-[#164E53]/60 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="en">English (Direct)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="ml">Malayalam (മലയാളം)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Subject / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Policy Warning / Report Follow-up / Recharge Support"
                  value={directSubject}
                  onChange={(e) => setDirectSubject(e.target.value)}
                  className="w-full bg-[#040D12] border border-[#164E53]/60 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Message (in English)</label>
                <textarea
                  rows={3}
                  placeholder="Type message in English. Groq AI will translate if regional language selected..."
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  className="w-full bg-[#040D12] border border-[#164E53]/60 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#164E53]/40">
              <button
                onClick={() => setShowDirectOutreachModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDirectOutreach}
                disabled={!directUserId.trim() || !directMessage.trim() || isSendingDirect}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-[0.97] disabled:opacity-40"
              >
                {isSendingDirect ? 'Translating & Sending...' : 'Send Message to App'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
