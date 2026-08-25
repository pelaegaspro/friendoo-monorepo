import AdminPanelShell from '@/components/admin/AdminPanelShell'

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminPanelShell>{children}</AdminPanelShell>
}
