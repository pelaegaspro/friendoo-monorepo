import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminPanelShell from '@/components/admin/AdminPanelShell'
import { ADMIN_COOKIE_NAME, isValidAdminSession, isSignInPaused } from '@/lib/admin/session'

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  if (isSignInPaused()) {
    return <AdminPanelShell>{children}</AdminPanelShell>
  }

  const cookieStore = await cookies()
  const sessionValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  if (!isValidAdminSession(sessionValue)) {
    redirect('/admin/login')
  }

  return <AdminPanelShell>{children}</AdminPanelShell>
}
