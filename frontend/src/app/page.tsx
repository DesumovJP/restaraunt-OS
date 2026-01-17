"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  UtensilsCrossed,
  Package,
  LayoutDashboard,
  ArrowRight,
  ChefHat,
} from "lucide-react";

const modules = [
  {
    title: "POS Офіціанта",
    description: "Прийом замовлень, меню, кошик",
    href: "/pos/waiter/tables",
    icon: ShoppingCart,
    color: "bg-primary-light text-primary",
  },
  {
    title: "Кухня",
    description: "Станції, рецепти, заплановані блюда",
    href: "/kitchen",
    icon: ChefHat,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Smart Storage",
    description: "Інвентаризація, QR-сканер, рецепти, обробка партій",
    href: "/storage",
    icon: Package,
    color: "bg-info-light text-info",
  },
  {
    title: "Дашборд адміна",
    description: "Аналітика, KPI, сповіщення",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    color: "bg-secondary-light text-secondary",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-6 text-center safe-top">
        <h1 className="text-3xl font-bold text-primary mb-2">Restaurant OS</h1>
        <p className="text-muted-foreground">
          Сучасна система управління рестораном
        </p>
      </header>

      {/* Main navigation */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Оберіть модуль</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <Link key={module.href} href={module.href as never}>
                <Card className="h-full hover:shadow-card-hover transition-all active:scale-[0.98] cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center`}
                      >
                        <module.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-3">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* Value Proposition */}
          <div className="mt-8 space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-1">Чому Restaurant OS?</h3>
              <p className="text-sm text-muted-foreground">Все, що потрібно для успішного ресторану — в одній системі</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">POS Офіціанта</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Швидке приймання замовлень з телефону або планшету</li>
                  <li>• Об'єднання столів, перенесення гостей між залами</li>
                  <li>• Інтеграція з бронюваннями та попередніми замовленнями</li>
                  <li>• Розбиття рахунку на кілька частин для компаній</li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ChefHat className="h-4 w-4 text-orange-600" />
                  </div>
                  <h4 className="font-semibold">Кухня</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Окремі екрани для кожної станції (гриль, салати, гаряче)</li>
                  <li>• Автоматичний розрахунок часу приготування страв</li>
                  <li>• Рецепти з покроковими інструкціями та розрахунком собівартості</li>
                  <li>• Планування виробництва на основі бронювань</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold">Smart Storage</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Партійний облік з контролем термінів придатності</li>
                  <li>• QR-коди для миттєвого приймання та списання</li>
                  <li>• Автоматичне списання інгредієнтів за рецептами</li>
                  <li>• Аналітика втрат та оптимізація закупівель</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <LayoutDashboard className="h-4 w-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold">Дашборд адміна</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Реальний стан ресторану в одному погляді</li>
                  <li>• Графік змін та управління персоналом</li>
                  <li>• Аналітика продуктивності кухарів та офіціантів</li>
                  <li>• Сповіщення про критичні ситуації в реальному часі</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-4 py-4 text-center text-sm text-muted-foreground safe-bottom">
        <p>Restaurant OS v0.1.0 • Mobile First • PWA Ready</p>
      </footer>
    </div>
  );
}
