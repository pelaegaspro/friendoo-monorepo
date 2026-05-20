import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { M3Card, M3CardHeader, M3CardTitle, M3CardDescription, M3CardContent } from '@/components/m3/M3Card';
import { M3Button } from '@/components/m3/M3Button';
import { M3TextField, M3TextArea } from '@/components/m3/M3TextField';
import { M3Chip } from '@/components/m3/M3Chip';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { handleAppError } from '@/lib/error-handler';
import '@/styles/m3-theme.css';

const INTEREST_OPTIONS = ['Cricket', 'Baking', 'Coding', 'Anime', 'Travel', 'Music', 'Gaming', 'Fitness', 'Art', 'Tech'];

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(user ? {
    displayName: user.displayName,
    username: user.username,
    city: user.city,
    bio: user.bio,
    interests: user.interests,
  } : {
    displayName: '',
    username: '',
    city: '',
    bio: '',
    interests: [] as string[],
  });

  const { isAvailable, checking } = useUsernameCheck(formData.username, user?.username);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSave = async () => {
    if (!user || isAvailable === false) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setUser({ ...user, ...formData });
      toast.success('Profile updated!');
      navigate('/profile');
    } catch (err: any) {
      handleAppError(err, 'Saving settings');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 tracking-tight text-[var(--text-primary)] sentence-case">Settings</h1>
      
      <div className="space-y-6">
        <M3Card variant="outlined" padding="medium">
          <M3CardHeader>
            <M3CardTitle>Public profile</M3CardTitle>
            <M3CardDescription>Update how you appear to others.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent className="space-y-4">
            <M3TextField 
              label="Display name"
              value={formData.displayName}
              onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              fullWidth
            />
            <div>
              <M3TextField 
                label="User handle"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                fullWidth
                className={isAvailable === false ? 'border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]' : ''}
              />
              <div className="flex items-center gap-2 mt-2">
                {checking && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />}
                {formData.username !== user.username && !checking && isAvailable === true && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                {!checking && isAvailable === false && <XCircle className="w-4 h-4 text-[var(--md-sys-color-error)]" />}
                {isAvailable === false && (
                  <p className="text-xs text-[var(--md-sys-color-error)] font-bold uppercase tracking-tight sentence-case">Username already taken</p>
                )}
              </div>
            </div>
            <M3TextField 
              label="City"
              value={formData.city}
              onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              fullWidth
            />
            <M3TextArea
              label="Bio"
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              fullWidth
              rows={3}
            />
          </M3CardContent>
        </M3Card>

        <M3Card variant="outlined" padding="medium">
          <M3CardHeader>
            <M3CardTitle>My interests</M3CardTitle>
            <M3CardDescription>Select tags that describe your hobbies.</M3CardDescription>
          </M3CardHeader>
          <M3CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(i => (
                <M3Chip
                  key={i}
                  selected={formData.interests.includes(i)}
                  onClick={() => toggleInterest(i)}
                  variant={formData.interests.includes(i) ? 'filled' : 'outlined'}
                >
                  {i}
                </M3Chip>
              ))}
            </div>
          </M3CardContent>
        </M3Card>

        <div className="flex gap-4">
           <M3Button 
            className="flex-1 h-12" 
            onClick={handleSave}
            disabled={loading}
           >
             {loading ? 'Saving...' : 'Save changes'}
           </M3Button>
           <M3Button 
            variant="outlined" 
            className="flex-1 h-12"
            onClick={() => navigate('/profile')}
           >
             Cancel
           </M3Button>
        </div>
      </div>
    </div>
  );
}
