'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Пошук страв...',
}: SearchBarProps) {
  return (
    <div className="relative group">
      <Search className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors pointer-events-none",
        value ? "text-slate-600" : "text-slate-400 group-focus-within:text-slate-600"
      )} />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "pl-12 pr-12 h-12 md:h-14 text-base",
          "bg-white border-slate-200 rounded-xl",
          "shadow-sm hover:shadow transition-shadow",
          "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
          "placeholder:text-slate-400"
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 p-0 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </Button>
      )}
    </div>
  );
}
