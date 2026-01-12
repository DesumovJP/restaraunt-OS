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
    <div className="bg-white/95 backdrop-blur-sm border-y border-slate-200/80 py-2.5 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max px-4 md:px-6">
        {/* Все */}
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border',
            'transition-all duration-200 touch-feedback',
            'min-h-[44px] shadow-sm',
            activeCategory === null
              ? 'bg-slate-900 border-slate-900 text-white shadow-slate-900/20'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md'
          )}
        >
          <Package className="w-4 h-4" />
          <span className="font-semibold text-sm">Все</span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-md font-medium',
            activeCategory === null ? 'bg-white/20' : 'bg-slate-100'
          )}>
            {totalCount}
          </span>
        </button>

        {/* Категорії */}
        {categories.map((category) => {
          const count = menuItemCounts[category.id] || 0;
          const isActive = activeCategory === category.id;
          const Icon = (category.icon && iconMap[category.icon]) || Package;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border',
                'transition-all duration-200 touch-feedback',
                'min-h-[44px] shadow-sm',
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-slate-900/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-semibold text-sm">{category.name}</span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-md font-medium',
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
