'use client';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import {
  Package,
  Coffee,
  IceCream,
  UtensilsCrossed,
  Soup,
  FrenchFries,
  BowlFood,
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
  'side-dish': FrenchFries,
  appetizer: BowlFood,
  beverages: CupSoda,
  salad: Package,
  'cup-soda': CupSoda,
  cake: IceCream,
  utensils: UtensilsCrossed,
  wheat: FrenchFries,
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
  return (
    <div className="bg-white border-y border-slate-200 py-3 sm:py-4 overflow-x-auto">
      <div className="flex gap-2 sm:gap-3 min-w-max px-3 sm:px-4 md:px-6 lg:px-8">
        {/* All Items */}
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            'flex flex-col items-start gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 min-w-[140px] sm:min-w-[160px]',
            'hover:scale-105 active:scale-95',
            activeCategory === null
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-md'
          )}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="font-semibold text-sm">All Categories</span>
          </div>
          <span
            className={cn(
              'text-xs',
              activeCategory === null ? 'text-blue-100' : 'text-slate-500'
            )}
          >
            {Object.values(menuItemCounts).reduce((a, b) => a + b, 0)} Menu In Stock
          </span>
        </button>

        {/* Category Cards */}
        {categories.map((category) => {
          const count = menuItemCounts[category.id] || 0;
          const isActive = activeCategory === category.id;
          const Icon = iconMap[category.icon] || Package;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'flex flex-col items-start gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 min-w-[140px] sm:min-w-[160px]',
                'hover:scale-105 active:scale-95',
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-md'
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{category.name}</span>
              </div>
              <span
                className={cn(
                  'text-xs',
                  isActive ? 'text-blue-100' : 'text-slate-500'
                )}
              >
                {count} Menu In Stock
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
