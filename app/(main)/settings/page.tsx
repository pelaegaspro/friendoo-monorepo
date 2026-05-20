'use client';

import { useRouter } from 'next/navigation';
import { useProfile } from '../../../hooks/useProfile';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../src/components/ui/button';
import { Switch } from '../../../src/components/ui/switch';
import { 
  ChevronRight, 
  User, 
  Shield, 
  Bell, 
  Trash2, 
  LogOut, 
  Globe, 
  Lock,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../src/components/ui/dialog';

export default function SettingsPage() {
  const router = useRouter();
  const currentUid = useAuthStore(state => state.user?.uid);
  const { profile, updateProfile } = useProfile(currentUid || '');

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      router.push('/login');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  const toggleSetting = async (key: string, value: boolean) => {
    try {
      // Handle nested keys like 'safety.anonymous'
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        const parentData = (profile as any)?.[parent] || {};
        await updateProfile({
          [parent]: {
            ...parentData,
            [child]: value
          }
        });
      } else {
        await updateProfile({ [key]: value });
      }
      toast.success('Setting updated');
    } catch (err) {
      toast.error('Failed to update setting');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background pb-24">
      <header className="px-6 py-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-500">
           <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-black italic tracking-tight text-white uppercase">Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 space-y-10 scrollbar-none">
        {/* Account Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 px-1">
            <User className="h-3 w-3" /> Account Settings
          </h2>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/profile/edit')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 transition-all border border-zinc-900"
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-zinc-200">{profile?.displayName || 'Loading...'}</span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Edit Profile Details</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-700" />
            </button>
            <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-900/30 border border-zinc-900/50 opacity-60">
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-zinc-400">Phone Number</span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{profile?.phoneNumber || 'XXXXX XXXXX'}</span>
              </div>
              <Lock className="h-4 w-4 text-zinc-700" />
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 px-1">
            <Shield className="h-3 w-3" /> Privacy & Visibility
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-900">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-zinc-200">Anonymous Mode</span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Hide from discovery feed</span>
              </div>
              <Switch 
                checked={profile?.safety?.anonymous || false} 
                onCheckedChange={(val) => toggleSetting('safety.anonymous', val)} 
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-900">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-zinc-200">Online Status</span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Show when you're active</span>
              </div>
              <Switch 
                checked={profile?.onlineStatus !== false} 
                onCheckedChange={(val) => toggleSetting('onlineStatus', val)} 
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 px-1">
            <Bell className="h-3 w-3" /> Push Notifications
          </h2>
          <div className="space-y-2">
            {['Friend Requests', 'Daily Prompts'].map(item => (
              <div key={item} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-900">
                <span className="font-bold text-sm text-zinc-200">{item}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2 px-1">
            <Trash2 className="h-3 w-3" /> Danger Zone
          </h2>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/safety')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">Manage Block List</span>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">View and unblock users</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-14 rounded-2xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 font-black uppercase text-[10px] tracking-[0.2em] px-4">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-900 rounded-[2rem] max-w-sm">
                <DialogHeader className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
                    <Trash2 className="h-6 w-6 text-rose-500" />
                  </div>
                  <DialogTitle className="text-xl font-black italic uppercase tracking-tight text-center">Are you sure?</DialogTitle>
                  <DialogDescription className="text-center text-zinc-500 font-medium">
                    This action is permanent. All your friends and wallet balance will be lost forever.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-3 mt-6">
                  <Button variant="outline" className="rounded-xl flex-1 h-12 bg-zinc-900 border-zinc-800 font-bold">CANCEL</Button>
                  <Button variant="destructive" className="rounded-xl flex-1 h-12 bg-rose-600 hover:bg-rose-700 font-bold">DELETE</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Sign Out */}
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="w-full h-16 rounded-2xl bg-zinc-900/50 text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 border border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all mt-8"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>

        <div className="text-center py-8">
          <p className="text-[10px] text-zinc-700 font-black tracking-[0.4em] uppercase">Friendoo v1.0.0 (BETA)</p>
        </div>
      </main>
    </div>
  );
}
