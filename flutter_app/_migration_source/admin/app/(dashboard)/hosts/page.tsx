import { redirect } from 'next/navigation'

export default function LegacyHostsPage() {
  redirect('/admin/hosts')
}
