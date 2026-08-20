import HostForm from '@/components/hosts/HostForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Create Host - Friendoo Admin',
}

export default function CreateHostPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/hosts" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Host</h1>
          <p className="text-gray-400">Manually onboard an expert or host into the platform.</p>
        </div>
      </div>
      
      <HostForm />
    </div>
  )
}
