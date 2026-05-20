'use client';

import { DiscoverFilter } from '../../services/discoverService';
import { cn } from '../../lib/utils';

interface FilterBarProps {
  activeFilter: DiscoverFilter;
  onFilterChange: (filter: DiscoverFilter) => void;
}

const filters: DiscoverFilter[] = ['All', '18-25', '25-35', '35+', 'Hindi', '🟢 Online'];

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeFilter === filter
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
              : "bg-card border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
