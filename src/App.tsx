import { ReactNode, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'

// Lazy load pages
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })))
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })))
const Chat = lazy(() => import('@/pages/Chat').then(m => ({ default: m.Chat })))
const ChatList = lazy(() => import('@/pages/Chat').then(m => ({ default: m.ChatList })))
const Wallet = lazy(() => import('@/pages/Wallet').then(m => ({ default: m.Wallet })))
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })))

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#7c5cff]/30 border-t-[#7c5cff] rounded-full animate-spin" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext()
  if (loading) return <PageLoader />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  )
}
