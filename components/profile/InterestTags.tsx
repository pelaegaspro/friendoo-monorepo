'use client';

import { Badge } from '../../src/components/ui/badge';
import { Button } from '../../src/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InterestTagsProps {
  interests: string[];
  isEditable?: boolean;
  onAdd?: () => void;
  onRemove?: (interest: string) => void;
}

export function InterestTags({ 
  interests, 
  isEditable, 
  onAdd, 
  onRemove 
}: InterestTagsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">
          Interests
        </h3>
        {isEditable && (
          <span className="text-[10px] font-bold text-zinc-600 uppercase">
            {interests.length}/10
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <Badge
            key={interest}
            variant="secondary"
            className={cn(
              "py-1.5 px-4 rounded-full text-sm font-bold transition-all",
              isEditable 
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 pr-2" 
                : "bg-zinc-800 text-zinc-300 border-none"
            )}
          >
            {interest}
            {isEditable && (
              <button
                onClick={() => onRemove?.(interest)}
                className="ml-2 p-0.5 hover:bg-purple-500/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {isEditable && interests.length < 10 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="rounded-full border-dashed border-2 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 h-9 px-4 font-bold gap-1"
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}

        {interests.length === 0 && !isEditable && (
          <p className="text-sm text-zinc-600 italic px-1">No interests added yet.</p>
        )}
      </div>
    </div>
  );
}
