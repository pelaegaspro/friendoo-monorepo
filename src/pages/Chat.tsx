import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { sendMessage, subscribeMessages } from '@/lib/chatService'
import { useAuthContext } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { ReportModal } from '@/components/ReportModal'
import { ArrowLeft, Send, Flag } from 'lucide-react'
import type { ChatMessage } from '@/types'
import toast from 'react-hot-toast'

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [hostName, setHostName] = useState('')
  const [hostId, setHostId] = useState('')
  const [showReport, setShowReport] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return
    getDoc(doc(db, 'chats', chatId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const hId = data.hostId as string
        setHostId(hId)
        getDoc(doc(db, 'hosts', hId)).then((hSnap) => {
          if (hSnap.exists()) setHostName((hSnap.data().displayName as string) ?? 'Host')
        })
      }
    })
  }, [chatId])

  useEffect(() => {
    if (!chatId) return
    return subscribeMessages(chatId, (msgs) => {
      setMessages(msgs)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })
  }, [chatId])

  async function handleSend() {
    if (!text.trim() || !chatId || !user) return
    const msg = text.trim()
    setText('')
    setSending(true)
    try {
      await sendMessage(chatId, user.uid, msg)
    } catch {
      toast.error('Failed to send message')
      setText(msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-[#060810]">
        <header className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.07] bg-[#060810]/95 backdrop-blur shrink-0">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-white/10 transition">
            <ArrowLeft size={20} />
          </button>
          <span className="flex-1 font-semibold text-sm truncate">{hostName || 'Chat'}</span>
          {hostId && (
            <button
              onClick={() => setShowReport(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title="Report"
            >
              <Flag size={16} className="text-white/40" />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.map((msg) => {
            const isMine = msg.senderId === user?.uid
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-[#7c5cff] text-white rounded-br-sm'
                      : 'bg-white/[0.08] text-white/90 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-white/[0.07] bg-[#060810] flex items-center gap-3 pb-safe">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message…"
            className="flex-1 bg-white/[0.06] border border-white/[0.09] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#7c5cff]/60"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#7c5cff] flex items-center justify-center transition hover:bg-[#9375ff] disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {showReport && hostId && (
        <ReportModal
          reportedId={hostId}
          reportedAlias={hostName}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}

export function ChatList() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [chats, setChats] = useState<Array<{ id: string; hostName: string; lastMessage: string; lastMessageAt: string | null }>>([])

  useEffect(() => {
    if (!user) return
    import('@/lib/chatService').then(({ subscribeChats }) => {
      return subscribeChats(user.uid, async (rawChats) => {
        const enriched = await Promise.all(
          rawChats.map(async (c) => {
            const hSnap = await getDoc(doc(db, 'hosts', c.hostId))
            const hostName = hSnap.exists() ? ((hSnap.data().displayName as string) ?? 'Host') : 'Host'
            return { id: c.id, hostName, lastMessage: c.lastMessage, lastMessageAt: c.lastMessageAt }
          }),
        )
        setChats(enriched)
      })
    })
  }, [user])

  return (
    <Layout title="Chats">
      <div className="flex flex-col divide-y divide-white/[0.05]">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-semibold text-white/70">No conversations yet</p>
            <p className="text-white/30 text-sm mt-1">Start chatting with a host from the home feed.</p>
          </div>
        ) : (
          chats.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/chats/${c.id}`)}
              className="flex items-center gap-4 px-4 py-4 hover:bg-white/[0.04] transition text-left w-full"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7c5cff]/40 to-[#ff7ab6]/30 shrink-0 flex items-center justify-center font-bold text-sm">
                {c.hostName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{c.hostName}</p>
                <p className="text-white/40 text-xs truncate mt-0.5">{c.lastMessage || 'No messages yet'}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </Layout>
  )
}
