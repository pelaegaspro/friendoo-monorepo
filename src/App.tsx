import { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { Home } from '@/pages/Home'
import { Chat, ChatList } from '@/pages/Chat'
import { Wallet } from '@/pages/Wallet'
import { Profile } from '@/pages/Profile'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext()
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#7c5cff]/30 border-t-[#7c5cff] rounded-full animate-spin" />
      </div>
    )
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/chats"
        element={
          <RequireAuth>
            <ChatList />
          </RequireAuth>
        }
      />
      <Route
        path="/chats/:chatId"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />
      <Route
        path="/wallet"
        element={
          <RequireAuth>
            <Wallet />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
