'use client';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import {
  Package,
  IceCream,
  UtensilsCrossed,
  Soup,
  Pizza,
  Salad,
  CupSoda,
  ChefHat,
} from 'lucide-react';

// Map category icons
const iconMap: Record<string, React.ElementType> = {
  breakfast: ChefHat,
  lunch: UtensilsCrossed,
  dinner: UtensilsCrossed,
  soup: Soup,
  desserts: IceCream,
  'side-dish': Pizza,
  appetizer: Salad,
  beverages: CupSoda,
  salad: Salad,
  'cup-soda': CupSoda,
  cake: IceCream,
  utensils: UtensilsCrossed,
  wheat: Pizza,
};

interface CategoryNavbarProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  menuItemCounts: Record<string, number>;
}

export function CategoryNavbar({
  categories,
  activeCategory,
  onCategoryChange,
  menuItemCounts,
}: CategoryNavbarProps) {
  const totalCount = Object.values(menuItemCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white border-y border-slate-200 py-2 overflow-x-auto">
      <div className="flex gap-2 min-w-max px-4 md:px-6">
        {/* Все */}
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg border',
            'transition-colors duration-150 active:scale-[0.98]',
            'min-h-[44px]',
            activeCategory === null
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
          )}
        >
          <Package className="w-4 h-4" />
          <span className="font-medium text-sm">Все</span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            activeCategory === null ? 'bg-white/20' : 'bg-slate-100'
          )}>
            {totalCount}
          </span>
        </button>

        {/* Категорії */}
        {categories.map((category) => {
          const count = menuItemCounts[category.id] || 0;
          const isActive = activeCategory === category.id;
          const Icon = iconMap[category.icon] || Package;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border',
                'transition-colors duration-150 active:scale-[0.98]',
                'min-h-[44px]',
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{category.name}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                isActive ? 'bg-white/20' : 'bg-slate-100'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
