'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../src/components/ui/sheet';
import { Button } from '../../src/components/ui/button';
import { Textarea } from '../../src/components/ui/textarea';
import { safetyService } from '../../services/safetyService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUid?: string;
}

const REASONS = ['Harassment', 'Spam', 'Inappropriate content', 'Fake profile', 'Underage', 'Other'];

export function ReportSheet({ open, onOpenChange, targetUid }: ReportSheetProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const currentUid = useAuthStore(state => state.user?.uid);

  const handleSubmit = async () => {
    if (!currentUid || !targetUid || !reason) return;
    setLoading(true);
    try {
      await safetyService.reportUser(currentUid, targetUid, reason, description);
      setSubmitted(true);
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err) {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[3rem] h-[85dvh] bg-zinc-950 border-zinc-900 p-6">
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />
        
        {submitted ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="p-4 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Report Submitted</h2>
            <p className="text-zinc-500 text-sm font-medium px-8">
              Thank you for helping keep our community safe. Our team will review this report within 24 hours.
            </p>
          </div>
        ) : (
          <div className="space-y-8 flex flex-col h-full">
            <SheetHeader className="text-left">
              <SheetTitle className="text-3xl font-black text-rose-500 italic uppercase tracking-tight flex items-center gap-3">
                <AlertTriangle className="h-8 w-8" /> Report User
              </SheetTitle>
              <SheetDescription className="text-zinc-500 font-medium pt-2">
                Your report is anonymous and helps us improve community safety.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-none">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Select Reason</label>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={cn(
                        "px-5 py-3 rounded-2xl text-xs font-black border-2 transition-all",
                        reason === r 
                          ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-500"
                      )}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Detailed Description (Optional)</label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                  placeholder="Provide more context to help our team..."
                  className="rounded-2xl bg-zinc-900 border-zinc-800 min-h-[140px] resize-none focus:ring-rose-500 p-4 text-sm font-medium"
                />
                <div className="flex justify-end">
                  <span className={cn("text-[10px] font-bold", description.length > 280 ? "text-rose-500" : "text-zinc-600")}>
                    {description.length}/300
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={!reason || loading}
              className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-lg font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'SUBMIT REPORT'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
