'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../../../hooks/useProfile';
import { useAuthStore } from '../../../../store/authStore';
import { InterestTags } from '../../../../components/profile/InterestTags';
import { Input } from '../../../../src/components/ui/input';
import { Textarea } from '../../../../src/components/ui/textarea';
import { Button } from '../../../../src/components/ui/button';
import { ChevronLeft, Camera, X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '../../../../lib/utils';

const profileSchema = z.object({
  displayName: z.string().min(2).max(30),
  bio: z.string().max(150),
  city: z.string().min(2),
  languages: z.array(z.string()).min(1),
  interests: z.array(z.string()).min(3).max(10),
});

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada', 'Malayalam', 'Punjabi', 'Gujarati', 'Odia', 'Urdu'];

export default function EditProfilePage() {
  const router = useRouter();
  const currentUid = useAuthStore(state => state.user?.uid);
  const { profile, isLoading, updateProfile, uploadPhoto, deletePhoto } = useProfile(currentUid || '');
  
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        city: profile.city || '',
        languages: profile.languages || [],
        interests: profile.interests || [],
        photos: profile.photos || [],
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!formData || !currentUid) return;
    
    try {
      profileSchema.parse(formData);
      setIsSaving(true);
      await updateProfile(formData);
      toast.success('Profile updated successfully');
      router.back();
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUid) return;

    if ((formData.photos?.length || 0) >= 3) {
      toast.error('Maximum 3 photos allowed');
      return;
    }

    setIsUploading(true);
    try {
      await uploadPhoto(file);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-dvh bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-black italic tracking-tight text-white uppercase">
            Edit Profile
          </h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="rounded-full bg-purple-600 hover:bg-purple-700 h-10 px-6 font-bold gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      <div className="p-6 space-y-10">
        {/* Photo Management */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">
            Photos (Max 3)
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {formData.photos.map((url: string) => (
              <div key={url} className="relative w-32 h-40 flex-shrink-0 rounded-2xl overflow-hidden group">
                <img src={url} alt="Profile" className="w-full h-full object-cover" />
                <button
                  onClick={() => deletePhoto(url)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.photos.length < 3 && (
              <label className="relative w-32 h-40 flex-shrink-0 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-900/50 transition-colors text-zinc-600">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                ) : (
                  <>
                    <Camera className="h-6 w-6" />
                    <span className="text-[10px] font-bold uppercase">Add Photo</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Display Name</label>
            <Input 
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              className="bg-zinc-900 border-zinc-800 rounded-2xl h-12 px-4 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Bio</label>
            <Textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value.slice(0, 150)})}
              placeholder="Tell people about yourself..."
              className="bg-zinc-900 border-zinc-800 rounded-2xl min-h-[100px] p-4 resize-none focus:ring-purple-500"
            />
            <div className="flex justify-end">
              <span className="text-[10px] font-bold text-zinc-600">{formData.bio.length}/150</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">City</label>
            <Input 
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="bg-zinc-900 border-zinc-800 rounded-2xl h-12 px-4 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Languages</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => {
                  const current = formData.languages;
                  const next = current.includes(lang) 
                    ? current.filter((l: string) => l !== lang)
                    : [...current, lang];
                  setFormData({...formData, languages: next});
                }}
                className={cn(
                  "py-2 px-4 rounded-full text-xs font-bold transition-all border",
                  formData.languages.includes(lang)
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <InterestTags 
          interests={formData.interests} 
          isEditable 
          onRemove={(interest) => {
            setFormData({
              ...formData, 
              interests: formData.interests.filter((i: string) => i !== interest)
            });
          }}
          onAdd={() => {
            // In a real app, this would open an InterestSelector modal
            const mockInterests = ['Cricket', 'Music', 'Gaming', 'Movies', 'Travel', 'Art', 'Tech', 'Cooking'];
            const available = mockInterests.filter(i => !formData.interests.includes(i));
            if (available.length > 0) {
              setFormData({
                ...formData,
                interests: [...formData.interests, available[0]]
              });
            }
          }}
        />

        {!profile?.isHost ? (
          <div className="rounded-[28px] border border-purple-500/20 bg-gradient-to-br from-purple-600/10 via-zinc-900 to-zinc-950 p-5 shadow-lg shadow-purple-950/20">
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-purple-300">
                🎙️ Earn with Friendoo
              </p>
              <p className="text-sm text-zinc-300">
                Become a host. Earn coins for every minute of your time.
              </p>
            </div>
            <Button
              onClick={() => router.push('/apply-host')}
              className="mt-4 h-12 rounded-2xl bg-purple-600 px-5 font-bold hover:bg-purple-700"
            >
              Apply Now
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
