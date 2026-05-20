'use client';

import { useState } from 'react';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Loader2 } from 'lucide-react';

interface PhoneInputProps {
  onSubmit: (phone: string) => Promise<void>;
  loading: boolean;
}

export function PhoneInput({ onSubmit, loading }: PhoneInputProps) {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) {
      onSubmit(`+91${phone}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
          Enter Phone Number
        </label>
        <div className="flex gap-2">
          <div className="flex items-center justify-center px-4 bg-zinc-900 rounded-2xl font-bold text-sm text-zinc-400 border border-zinc-800">
            +91
          </div>
          <Input 
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="00000 00000"
            className="flex-1 h-14 rounded-2xl bg-zinc-900 border-zinc-800 text-lg font-black tracking-widest focus:ring-purple-500"
            required
          />
        </div>
      </div>

      <Button 
        type="submit"
        disabled={phone.length !== 10 || loading}
        className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-lg font-black shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
      >
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'SEND OTP'}
      </Button>
    </form>
  );
}
