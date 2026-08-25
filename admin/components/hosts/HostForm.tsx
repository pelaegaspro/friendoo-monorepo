"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createHostAction } from '@/lib/actions/hostActions'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'

const formSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  phone: z.string().min(10, "Valid phone number required"),
  avatarColor: z.string().min(4, "Color is required"),
  bio: z.string().min(1, "Bio is required"),
  city: z.string().min(1, "City is required"),
  languages: z.string().min(1, "Enter languages (comma separated)"),
  expertiseTags: z.string().min(1, "Enter tags (comma separated)"),
  ratePerMinute: z.coerce.number().min(1, "Rate must be > 0"),
  gender: z.string().min(1, "Gender is required"),
  age: z.coerce.number().min(18, "Must be 18 or older")
})

type FormData = z.infer<typeof formSchema>

export default function HostForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ratePerMinute: 5,
      age: 18,
      gender: 'Female',
      avatarColor: '#3700B3'
    }
  })

  const currentAlias = watch("alias")

  const generateAlias = () => {
    const colors = ["Red", "Blue", "Green", "Gold", "Silver", "Black", "White", "Purple", "Cyan", "Magenta"]
    const animals = ["Tiger", "Lion", "Eagle", "Shark", "Wolf", "Bear", "Fox", "Hawk", "Panda", "Deer"]
    const randomAlias = `${colors[Math.floor(Math.random() * colors.length)]}${animals[Math.floor(Math.random() * animals.length)]}${Math.floor(Math.random() * 90 + 10)}`
    setValue("alias", randomAlias)
    
    const hexColors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50"]
    setValue("avatarColor", hexColors[Math.floor(Math.random() * hexColors.length)])
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    
    try {
      const payload = {
        ...data,
        languages: data.languages.split(',').map(s => s.trim()),
        expertiseTags: data.expertiseTags.split(',').map(s => s.trim())
      }
      
      const result = await createHostAction(payload as any)
      if (result.success) {
        toast.success("Host created successfully!")
        router.push('/admin/hosts')
        router.refresh()
      } else {
        setError(result.error || 'Unknown error occurred')
        toast.error("Failed to create host")
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit form')
      toast.error(err.message || 'Failed to submit form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-gray-900 text-white p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-4xl">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <h2 className="text-xl font-bold text-purple-400">Anonymous Host Creation</h2>
          <span className="text-xs bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full border border-purple-800/50">Admin Only</span>
      </div>

      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-800">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Anonymous Alias *</label>
                    <input 
                        {...register("alias")} 
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none" 
                        placeholder="e.g. BlueTiger42"
                    />
                </div>
                <button 
                    type="button"
                    onClick={generateAlias}
                    className="p-3.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-purple-400 transition-colors"
                    title="Generate Random Alias"
                >
                    <RefreshCw size={20} />
                </button>
            </div>
            {errors.alias && <span className="text-red-400 text-xs mt-1 block">{errors.alias.message}</span>}

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Avatar Base Color *</label>
                <div className="flex items-center gap-3">
                    <input 
                        type="color"
                        {...register("avatarColor")}
                        className="h-12 w-20 bg-gray-800 border border-gray-700 rounded-xl cursor-pointer p-1"
                    />
                    <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white/20"
                        style={{ backgroundColor: watch("avatarColor") }}
                    >
                        {currentAlias?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Number * (Admin records only)</label>
          <input {...register("phone")} placeholder="9876543210" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 transition-all outline-none" />
          {errors.phone && <span className="text-red-400 text-xs mt-1 block">{errors.phone.message}</span>}
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Never visible to users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">City *</label>
          <input {...register("city")} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
          {errors.city && <span className="text-red-400 text-xs mt-1 block">{errors.city.message}</span>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Gender *</label>
            <select {...register("gender")} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
            </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Anonymous Bio *</label>
        <textarea {...register("bio")} placeholder="Describe the host's personality anonymously..." className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" rows={3} />
        {errors.bio && <span className="text-red-400 text-xs mt-1 block">{errors.bio.message}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Languages * (Comma separated)</label>
          <input {...register("languages")} placeholder="Hindi, Tamil, Telugu" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Expertise Tags * (Comma separated)</label>
          <input {...register("expertiseTags")} placeholder="Friendship, Dating" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Rate per Audio Min (₹) *</label>
          <input type="number" {...register("ratePerMinute")} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Age *</label>
          <input type="number" {...register("age")} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Creating Anonymous Host...' : 'Create Host Profile'}
        </button>
      </div>
    </form>
  )
}
