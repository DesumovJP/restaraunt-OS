"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { CookingPlanModal } from "./cooking-plan-modal";

interface DatePlannerProps {
  selectedDate: Date;
  className?: string;
}

export function DatePlanner({
  selectedDate,
  className,
}: DatePlannerProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        className={cn("gap-2 h-8 sm:h-9", className)}
        onClick={() => setIsModalOpen(true)}
        aria-label="Відкрити план приготування"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">План</span>
      </Button>

      <CookingPlanModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedDate={selectedDate}
      />
    </>
  );
}

