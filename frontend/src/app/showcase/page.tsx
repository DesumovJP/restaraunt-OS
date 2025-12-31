"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/molecules/table/table";
import {
  Sparkles,
  Zap,
  Check,
  AlertTriangle,
  Info,
  ShoppingCart,
  TrendingUp,
  Users
} from "lucide-react";

/**
 * Design System Showcase
 * Premium Navy + White + Electric Blue + Glassmorphism
 *
 * Демонстрація всіх оновлених компонентів з новою дизайн-системою
 */
export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-accent-light/10">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/20 shadow-glass">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-accent" />
              <div>
                <h1 className="text-2xl font-bold text-navy-950">Restaurant OS</h1>
                <p className="text-sm text-slate-600">Premium Design System Showcase</p>
              </div>
            </div>
            <Badge variant="glass" size="lg">v2.0 Premium</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <Badge variant="accent" size="lg" className="mb-4">
            <Sparkles className="h-4 w-4" />
            New Design System
          </Badge>
          <h1 className="text-display-lg font-bold text-navy-950">
            Premium Glassmorphism
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Navy + White + Electric Blue palette з делікатними glass effects для преміального вигляду
          </p>
        </section>

        {/* Buttons Section */}
        <section>
          <Card variant="glass" padding="lg">
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>
                Всі варіанти кнопок з GPU acceleration та преміальними тінями
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Primary Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">
                    <ShoppingCart className="h-4 w-4" />
                    Default Navy
                  </Button>
                  <Button variant="accent">
                    <Zap className="h-4 w-4" />
                    Accent Blue
                  </Button>
                  <Button variant="glass">
                    <Sparkles className="h-4 w-4" />
                    Glass Effect
                  </Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Semantic Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="success">
                    <Check className="h-4 w-4" />
                    Success
                  </Button>
                  <Button variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    Warning
                  </Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="accent">Small</Button>
                  <Button size="default" variant="accent">Default</Button>
                  <Button size="lg" variant="accent">Large</Button>
                  <Button size="xl" variant="accent">Extra Large</Button>
                  <Button size="touch" variant="accent">Touch (44px)</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-navy-950 mb-2">Card Variants</h2>
            <p className="text-slate-600">Glassmorphism та solid варіанти з різними elevation рівнями</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Solid white з border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Standard card для більшості use cases.</p>
              </CardContent>
            </Card>

            <Card variant="glass" padding="md" interactive>
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Glassmorphism effect</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="glass">Interactive</Badge>
                <p className="text-slate-600 mt-2">Hover для scale effect</p>
              </CardContent>
            </Card>

            <Card variant="glassStrong" padding="md">
              <CardHeader>
                <CardTitle>Glass Strong</CardTitle>
                <CardDescription>Сильніший blur</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">85% opacity, 16px blur</p>
              </CardContent>
            </Card>

            <Card variant="elevated" padding="md">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Medium shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Для важливого контенту</p>
              </CardContent>
            </Card>

            <Card variant="floating" padding="md">
              <CardHeader>
                <CardTitle>Floating Card</CardTitle>
                <CardDescription>Large shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Максимальний elevation</p>
              </CardContent>
            </Card>

            <Card variant="glassDark" padding="md">
              <CardHeader>
                <CardTitle>Glass Dark</CardTitle>
                <CardDescription>Темний glass variant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">Для dark overlays</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* KPI Cards */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-navy-950 mb-2">KPI Dashboard Cards</h2>
            <p className="text-slate-600">Glass cards з metrics та trends</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card variant="glass" padding="lg" className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Виручка</span>
                  <ShoppingCart className="w-5 h-5 text-accent" />
                </div>
                <div className="text-3xl font-bold text-navy-950">12,450 грн</div>
                <div className="flex items-center gap-1 text-sm font-medium text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12%</span>
                </div>
              </div>
            </Card>

            <Card variant="glass" padding="lg" className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-success/5 to-transparent pointer-events-none" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Замовлення</span>
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div className="text-3xl font-bold text-navy-950">48</div>
                <Badge variant="success" size="sm">Активно</Badge>
              </div>
            </Card>

            <Card variant="glass" padding="lg" className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-warning/5 to-transparent pointer-events-none" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Гості</span>
                  <Users className="w-5 h-5 text-warning" />
                </div>
                <div className="text-3xl font-bold text-navy-950">156</div>
                <Badge variant="warning" size="sm">Peak hour</Badge>
              </div>
            </Card>

            <Card variant="glass" padding="lg" className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-info/5 to-transparent pointer-events-none" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Середній чек</span>
                  <Info className="w-5 h-5 text-info" />
                </div>
                <div className="text-3xl font-bold text-navy-950">259 грн</div>
                <div className="text-sm text-slate-600">На гостя</div>
              </div>
            </Card>
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <Card variant="glass" padding="lg">
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
              <CardDescription>Компактні індикатори статусу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Brand Colors</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default Navy</Badge>
                  <Badge variant="accent">Accent Blue</Badge>
                  <Badge variant="glass">Glass</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="outlineAccent">Outline Accent</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Semantic</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Status (Orders/Tickets)</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="new">New</Badge>
                  <Badge variant="in-progress">In Progress</Badge>
                  <Badge variant="ready">Ready</Badge>
                  <Badge variant="completed">Completed</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Priority</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="rush">Rush</Badge>
                  <Badge variant="normal">Normal</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wider">Sizes</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent" size="sm">Small</Badge>
                  <Badge variant="accent" size="default">Default</Badge>
                  <Badge variant="accent" size="lg">Large</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inputs Section */}
        <section>
          <Card variant="glass" padding="lg">
            <CardHeader>
              <CardTitle>Input Variants</CardTitle>
              <CardDescription>Форми вводу з різними стилями</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy-950">Default Input</label>
                  <Input variant="default" placeholder="Введіть текст..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy-950">Glass Input</label>
                  <Input variant="glass" placeholder="Glass effect..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy-950">Filled Input</label>
                  <Input variant="filled" placeholder="Filled variant..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy-950">Ghost Input</label>
                  <Input variant="ghost" placeholder="Minimal ghost..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy-950">Error State</label>
                  <Input variant="default" hasError placeholder="Помилка валідації" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy-950">Touch Size</label>
                  <Input inputSize="touch" placeholder="44px minimum" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dialog Section */}
        <section>
          <Card variant="glass" padding="lg">
            <CardHeader>
              <CardTitle>Dialog Component</CardTitle>
              <CardDescription>Glassmorphism modal з backdrop blur</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="accent" size="lg">
                    <Sparkles className="h-5 w-5" />
                    Відкрити Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Premium Glassmorphism Dialog</DialogTitle>
                    <DialogDescription>
                      Navy overlay з backdrop-blur + glass-strong content panel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-navy-950">
                      Цей dialog використовує нову дизайн-систему з glassmorphism effects,
                      GPU acceleration, та преміальними тінями.
                    </p>
                    <div className="flex gap-3">
                      <Badge variant="glass">Glass</Badge>
                      <Badge variant="accent">Navy + Electric Blue</Badge>
                      <Badge variant="success">Premium</Badge>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost">Скасувати</Button>
                    <Button variant="accent">Підтвердити</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>

        {/* Table Section */}
        <section>
          <Card variant="glass" padding="lg">
            <CardHeader>
              <CardTitle>Table Component</CardTitle>
              <CardDescription>Оновлені кольори Navy + Slate palette</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead sortable>Назва</TableHead>
                    <TableHead>Категорія</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead align="right" mono>Ціна</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow interactive>
                    <TableCell>Маргарита</TableCell>
                    <TableCell>Піца</TableCell>
                    <TableCell><Badge variant="success">Доступно</Badge></TableCell>
                    <TableCell align="right" mono>120 грн</TableCell>
                  </TableRow>
                  <TableRow interactive selected>
                    <TableCell>Карбонара</TableCell>
                    <TableCell>Паста</TableCell>
                    <TableCell><Badge variant="warning">Мало</Badge></TableCell>
                    <TableCell align="right" mono>180 грн</TableCell>
                  </TableRow>
                  <TableRow interactive>
                    <TableCell>Цезар</TableCell>
                    <TableCell>Салат</TableCell>
                    <TableCell><Badge variant="error">Немає</Badge></TableCell>
                    <TableCell align="right" mono>95 грн</TableCell>
                  </TableRow>
                  <TableRow interactive>
                    <TableCell>Еспресо</TableCell>
                    <TableCell>Напої</TableCell>
                    <TableCell><Badge variant="success">Доступно</Badge></TableCell>
                    <TableCell align="right" mono>35 грн</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Color Palette */}
        <section>
          <Card variant="glass" padding="lg">
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Navy + White + Electric Blue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-navy-950 mb-3">Navy Scale</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-navy-950 border-2 border-slate-200"></div>
                      <div>
                        <div className="font-mono text-sm">navy-950</div>
                        <div className="text-xs text-slate-600">#0B1B3B</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-navy-950 mb-3">Accent (Electric Blue)</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-accent border-2 border-slate-200"></div>
                      <div>
                        <div className="font-mono text-sm">accent</div>
                        <div className="text-xs text-slate-600">#3B82F6</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-navy-950 mb-3">Slate Scale</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-600 border-2 border-slate-200"></div>
                      <div>
                        <div className="font-mono text-sm">slate-600</div>
                        <div className="text-xs text-slate-600">#475569</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-base border-t border-white/20 mt-16">
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-slate-600">
            Restaurant OS Premium Design System • Navy + White + Electric Blue + Glassmorphism
          </p>
          <p className="text-sm text-slate-500 mt-2">
            GPU-optimized • Mobile-first • WCAG AA+ accessible
          </p>
        </div>
      </footer>
    </div>
  );
}
