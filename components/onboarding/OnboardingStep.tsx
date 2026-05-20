'use client';

import { Input } from '../../src/components/ui/input';
import { cn } from '../../lib/utils';
import { Camera, Check } from 'lucide-react';

interface OnboardingStepProps {
  step: number;
  data: any;
  updateData: (newData: any) => void;
}

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada', 'Malayalam', 'Punjabi', 'Gujarati', 'Odia', 'Urdu'];
const INTERESTS = [
  'Cricket', 'Football', 'Gaming', 'Music', 'Movies', 'Tech', 'Cooking', 'Travel', 'Art', 'Reading',
  'Anime', 'Yoga', 'Fitness', 'Startups', 'Finance', 'Fashion', 'Photography', 'Writing', 'History', 'Politics'
];
const PREFERENCES = ['Chat buddies', 'Voice call friends', 'Study partners', 'Gaming partners', 'Local hangout'];
const AI_AVATARS = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5', 'avatar_6'];

export function OnboardingStep({ step, data, updateData }: OnboardingStepProps) {
  switch (step) {
    case 1:
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tight text-white uppercase">What's your name?</h1>
            <p className="text-zinc-500 font-medium">This is how others will see you on Friendoo.</p>
          </div>
          <Input 
            value={data.displayName}
            onChange={(e) => updateData({ displayName: e.target.value })}
            placeholder="Enter your name"
            className="h-16 rounded-2xl bg-zinc-900 border-zinc-800 text-xl font-black focus:ring-purple-500"
          />
        </div>
      );

    case 2:
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tight text-white uppercase">Tell us more</h1>
            <p className="text-zinc-500 font-medium text-sm">Your age and gender help us find better matches.</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Age</label>
              <Input 
                type="number"
                value={data.age}
                onChange={(e) => updateData({ age: parseInt(e.target.value) })}
                className="h-16 rounded-2xl bg-zinc-900 border-zinc-800 text-xl font-black focus:ring-purple-500"
                min={18}
                max={60}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Gender</label>
              <div className="flex gap-3">
                {['Male', 'Female', 'Other'].map(g => (
                  <button
                    key={g}
                    onClick={() => updateData({ gender: g })}
                    className={cn(
                      "flex-1 h-14 rounded-2xl border-2 font-black transition-all text-sm",
                      data.gender === g 
                        ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {g.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tight text-white uppercase">Location</h1>
            <p className="text-zinc-500 font-medium text-sm">Where are you from and what do you speak?</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">City</label>
              <Input 
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="e.g. Mumbai"
                className="h-16 rounded-2xl bg-zinc-900 border-zinc-800 text-xl font-black focus:ring-purple-500"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Languages (Pick at least 1)</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      const cur = data.languages || [];
                      updateData({ languages: cur.includes(lang) ? cur.filter((l: any) => l !== lang) : [...cur, lang] });
                    }}
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-black border-2 transition-all",
                      data.languages?.includes(lang) 
                        ? "bg-purple-600 border-purple-600 text-white" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    )}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 4:
      return (
        <div className="space-y-6 h-full flex flex-col">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tight text-white uppercase">Interests</h1>
            <p className="text-zinc-500 font-medium text-sm">Pick 3 to 10 things you love.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-none">
            <div className="flex flex-wrap gap-2 py-2">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => {
                    const cur = data.interests || [];
                    if (cur.includes(interest)) {
                      updateData({ interests: cur.filter((i: any) => i !== interest) });
                    } else if (cur.length < 10) {
                      updateData({ interests: [...cur, interest] });
                    }
                  }}
                  className={cn(
                    "px-5 py-3 rounded-2xl text-xs font-black border-2 transition-all",
                    data.interests?.includes(interest) 
                      ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  )}
                >
                  {interest.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 5:
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tight text-white uppercase">Friendship</h1>
            <p className="text-zinc-500 font-medium text-sm">What are you looking for here?</p>
          </div>
          <div className="space-y-4">
            {PREFERENCES.map(p => (
              <button
                key={p}
                onClick={() => updateData({ friendPreference: p })}
                className={cn(
                  "w-full h-16 px-6 rounded-2xl border-2 font-black text-left flex items-center justify-between transition-all",
                  data.friendPreference === p 
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                )}
              >
                {p.toUpperCase()}
                {data.friendPreference === p && <Check className="h-5 w-5" />}
              </button>
            ))}
          </div>
        </div>
      );

    case 6:
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tight text-white uppercase">Profile</h1>
            <p className="text-zinc-500 font-medium text-sm">Upload a photo or pick an AI avatar.</p>
          </div>
          <div className="space-y-8">
            <button className="w-full aspect-square max-w-[200px] mx-auto rounded-3xl border-4 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4 text-zinc-600 hover:border-purple-600/50 hover:bg-purple-600/5 transition-all">
              <Camera className="h-10 w-10" />
              <span className="font-black text-xs uppercase tracking-widest">Upload Photo</span>
            </button>
            
            <div className="space-y-4">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Or pick an AI Avatar</p>
              <div className="grid grid-cols-3 gap-4">
                {AI_AVATARS.map(id => (
                  <button
                    key={id}
                    onClick={() => updateData({ aiAvatarId: id })}
                    className={cn(
                      "aspect-square rounded-2xl overflow-hidden border-4 transition-all bg-zinc-900",
                      data.aiAvatarId === id ? "border-purple-600 scale-105 shadow-xl" : "border-transparent opacity-40 hover:opacity-100"
                    )}
                  >
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                       <span className="text-[10px] font-black uppercase">{id.split('_')[1]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 7:
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tight text-white uppercase">Safety</h1>
            <p className="text-zinc-500 font-medium text-sm">Control your privacy and connections.</p>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-black text-sm text-white uppercase tracking-widest">Anonymous Mode</p>
                <p className="text-[10px] text-zinc-500 font-bold">Hide your profile in Discovery.</p>
              </div>
              <button 
                onClick={() => updateData({ safety: { ...data.safety, anonymous: !data.safety.anonymous } })}
                className={cn(
                  "w-12 h-7 rounded-full transition-all relative", 
                  data.safety.anonymous ? "bg-purple-600" : "bg-zinc-800"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-5 h-5 bg-white rounded-full transition-all", 
                  data.safety.anonymous ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Who can call you?</label>
              <div className="flex gap-2">
                {['Everyone', 'Friends only'].map(c => (
                  <button
                    key={c}
                    onClick={() => updateData({ safety: { ...data.safety, calls: c } })}
                    className={cn(
                      "flex-1 h-12 rounded-xl border-2 font-black text-[10px] uppercase transition-all",
                      data.safety.calls === c 
                        ? "bg-purple-600 border-purple-600 text-white" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-2 border-purple-600/20 bg-purple-600/5 rounded-[2rem] space-y-3">
              <p className="text-[11px] leading-relaxed text-zinc-400 italic text-center font-medium">
                "I agree to follow the Friendoo community guidelines and treat everyone with respect and kindness."
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
