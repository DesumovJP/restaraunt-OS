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

          {/* Quick info */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Швидкий старт</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Офіціант:</strong> натисніть на страву для додавання в кошик</li>
              <li>• <strong>Кухня:</strong> перемикайтеся між станціями, рецептами та запланованими блюдами</li>
              <li>• <strong>Склад:</strong> скануйте QR-код для швидкого додавання товарів</li>
              <li>• <strong>Адмін:</strong> натисніть на KPI для деталізації</li>
            </ul>
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
