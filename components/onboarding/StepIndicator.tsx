'use client';

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
        <div 
          className="h-full bg-purple-600 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-black text-zinc-500 tabular-nums uppercase tracking-widest">
        {current} / {total}
      </span>
    </div>
  );
}
