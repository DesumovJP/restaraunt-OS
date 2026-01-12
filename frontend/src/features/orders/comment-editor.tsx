"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Leaf,
  Flame,
  X,
  MessageSquare,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import type { ItemComment, CommentPreset, CommentVisibility } from "@/types/extended";

// Preset configurations
export const COMMENT_PRESETS: CommentPreset[] = [
  // Allergens
  {
    documentId: "preset_gluten_free",
    slug: "gluten-free",
    key: "gluten_free",
    category: "allergen",
    label: { en: "Gluten Free", uk: "Без глютену" },
    icon: "wheat-off",
    severity: "critical",
    isActive: true,
    sortOrder: 1,
  },
  {
    documentId: "preset_dairy_free",
    slug: "dairy-free",
    key: "dairy_free",
    category: "allergen",
    label: { en: "Dairy Free", uk: "Без молока" },
    icon: "milk-off",
    severity: "critical",
    isActive: true,
    sortOrder: 2,
  },
  {
    documentId: "preset_nut_free",
    slug: "nut-free",
    key: "nut_free",
    category: "allergen",
    label: { en: "Nut Free", uk: "Без горіхів" },
    icon: "ban",
    severity: "critical",
    isActive: true,
    sortOrder: 3,
  },
  {
    documentId: "preset_shellfish_free",
    slug: "shellfish-free",
    key: "shellfish_free",
    category: "allergen",
    label: { en: "No Shellfish", uk: "Без морепродуктів" },
    icon: "fish-off",
    severity: "critical",
    isActive: true,
    sortOrder: 4,
  },
  // Dietary
  {
    documentId: "preset_vegetarian",
    slug: "vegetarian",
    key: "vegetarian",
    category: "dietary",
    label: { en: "Vegetarian", uk: "Вегетаріанське" },
    icon: "leaf",
    severity: "warning",
    isActive: true,
    sortOrder: 10,
  },
  {
    documentId: "preset_vegan",
    slug: "vegan",
    key: "vegan",
    category: "dietary",
    label: { en: "Vegan", uk: "Веганське" },
    icon: "leaf",
    severity: "warning",
    isActive: true,
    sortOrder: 11,
  },
  {
    documentId: "preset_halal",
    slug: "halal",
    key: "halal",
    category: "dietary",
    label: { en: "Halal", uk: "Халяль" },
    icon: "check-circle",
    severity: "warning",
    isActive: true,
    sortOrder: 12,
  },
  {
    documentId: "preset_kosher",
    slug: "kosher",
    key: "kosher",
    category: "dietary",
    label: { en: "Kosher", uk: "Кошерне" },
    icon: "check-circle",
    severity: "warning",
    isActive: true,
    sortOrder: 13,
  },
  // Cooking preferences
  {
    documentId: "preset_spicy",
    slug: "spicy",
    key: "spicy",
    category: "modifier",
    label: { en: "Extra Spicy", uk: "Гостріше" },
    icon: "flame",
    severity: "normal",
    isActive: true,
    sortOrder: 20,
  },
  {
    documentId: "preset_mild",
    slug: "mild",
    key: "mild",
    category: "modifier",
    label: { en: "Mild", uk: "Не гостре" },
    icon: "snowflake",
    severity: "normal",
    isActive: true,
    sortOrder: 21,
  },
  {
    documentId: "preset_no_onion",
    slug: "no-onion",
    key: "no_onion",
    category: "modifier",
    label: { en: "No Onion", uk: "Без цибулі" },
    icon: "minus",
    severity: "normal",
    isActive: true,
    sortOrder: 22,
  },
  {
    documentId: "preset_no_garlic",
    slug: "no-garlic",
    key: "no_garlic",
    category: "modifier",
    label: { en: "No Garlic", uk: "Без часнику" },
    icon: "minus",
    severity: "normal",
    isActive: true,
    sortOrder: 23,
  },
  {
    documentId: "preset_well_done",
    slug: "well-done",
    key: "well_done",
    category: "modifier",
    label: { en: "Well Done", uk: "Добре просмажити" },
    icon: "flame",
    severity: "normal",
    isActive: true,
    sortOrder: 24,
  },
  {
    documentId: "preset_rare",
    slug: "rare",
    key: "rare",
    category: "modifier",
    label: { en: "Rare", uk: "З кров'ю" },
    icon: "droplet",
    severity: "normal",
    isActive: true,
    sortOrder: 25,
  },
];

const VISIBILITY_OPTIONS: { key: CommentVisibility; label: string; icon: React.ElementType }[] = [
  { key: "waiter", label: "Офіціант", icon: Eye },
  { key: "kitchen", label: "Кухня", icon: Eye },
  { key: "chef", label: "Шеф", icon: Eye },
  { key: "manager", label: "Менеджер", icon: Eye },
];

interface CommentEditorProps {
  value: ItemComment | null;
  onChange: (comment: ItemComment | null) => void;
  menuItemName: string;
  tableAllergens?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function CommentEditor({
  value,
  onChange,
  menuItemName,
  tableAllergens = [],
  isOpen,
  onClose,
}: CommentEditorProps) {
  const [text, setText] = React.useState(value?.text || "");
  const [selectedPresets, setSelectedPresets] = React.useState<string[]>(
    value?.presets || []
  );
  const [visibility, setVisibility] = React.useState<CommentVisibility[]>(
    value?.visibility || ["kitchen"]
  );

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setText(value?.text || "");
      setSelectedPresets(value?.presets || []);
      setVisibility(value?.visibility || ["kitchen"]);
    }
  }, [isOpen, value]);

  // Check for conflicts with table allergens
  const conflicts = React.useMemo(() => {
    const allergenPresets = selectedPresets.filter((key) => {
      const preset = COMMENT_PRESETS.find((p) => p.key === key);
      return preset?.category === "allergen";
    });

    // This would check against BOM/ingredients in real implementation
    return allergenPresets.filter((key) => tableAllergens.includes(key));
  }, [selectedPresets, tableAllergens]);

  const togglePreset = (key: string) => {
    setSelectedPresets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleVisibility = (key: CommentVisibility) => {
    setVisibility((prev) => {
      return prev.includes(key)
        ? prev.filter((v) => v !== key)
        : [...prev, key];
    });
  };

  const handleSave = () => {
    if (!text.trim() && selectedPresets.length === 0) {
      onChange(null);
    } else {
      onChange({
        text: text.trim(),
        presets: selectedPresets,
        visibility: visibility.length === 0 ? ["kitchen"] : visibility,
        createdAt: value?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: value?.authorId || "current_user", // Would come from auth context
        authorName: value?.authorName || "Поточний користувач",
      });
    }
    onClose();
  };

  const handleClear = () => {
    setText("");
    setSelectedPresets([]);
    setVisibility(["kitchen"]);
  };

  // Group presets by category
  const presetsByCategory = React.useMemo(() => {
    const groups: Record<string, CommentPreset[]> = {
      allergen: [],
      dietary: [],
      preference: [],
    };
    COMMENT_PRESETS.filter((p) => p.isActive).forEach((preset) => {
      groups[preset.category]?.push(preset);
    });
    return groups;
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Коментар до страви
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{menuItemName}</p>
        </DialogHeader>

        <div className="px-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Conflicts warning */}
          {conflicts.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger">
                  Увага! Конфлікт з алергенами столу
                </p>
                <p className="text-xs text-danger/80 mt-0.5">
                  Страва може містити: {conflicts.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Allergen presets */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-danger" />
              Алергени
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {presetsByCategory.allergen.map((preset) => (
                <PresetButton
                  key={preset.key}
                  preset={preset}
                  isSelected={selectedPresets.includes(preset.key)}
                  onClick={() => togglePreset(preset.key)}
                  severity="critical"
                />
              ))}
            </div>
          </div>

          {/* Dietary presets */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Leaf className="h-4 w-4 text-green-600" />
              Дієтичні
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {presetsByCategory.dietary.map((preset) => (
                <PresetButton
                  key={preset.key}
                  preset={preset}
                  isSelected={selectedPresets.includes(preset.key)}
                  onClick={() => togglePreset(preset.key)}
                  severity="warning"
                />
              ))}
            </div>
          </div>

          {/* Cooking preferences */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              Приготування
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {presetsByCategory.preference.map((preset) => (
                <PresetButton
                  key={preset.key}
                  preset={preset}
                  isSelected={selectedPresets.includes(preset.key)}
                  onClick={() => togglePreset(preset.key)}
                  severity="normal"
                />
              ))}
            </div>
          </div>

          {/* Free text */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Додатковий коментар
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введіть додаткові побажання..."
              className="w-full h-20 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {text.length}/500
            </p>
          </div>

          {/* Visibility */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              Видимість
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {VISIBILITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleVisibility(opt.key)}
                  className={cn(
                    "h-7 px-2.5 text-xs transition-all",
                    visibility.includes(opt.key) &&
                      "bg-primary/10 border-primary text-primary"
                  )}
                >
                  {visibility.includes(opt.key) ? (
                    <Eye className="h-3 w-3 mr-1" />
                  ) : (
                    <EyeOff className="h-3 w-3 mr-1" />
                  )}
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 flex-col gap-2">
          <Button onClick={handleSave} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-base font-medium rounded-xl">
            <Check className="h-4 w-4 mr-1.5" />
            Зберегти
          </Button>
          <Button variant="ghost" onClick={handleClear} className="w-full text-slate-500 hover:text-slate-700">
            Очистити все
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Preset button component
interface PresetButtonProps {
  preset: CommentPreset;
  isSelected: boolean;
  onClick: () => void;
  severity: "critical" | "warning" | "normal";
}

function PresetButton({ preset, isSelected, onClick, severity }: PresetButtonProps) {
  const severityStyles = {
    critical: isSelected
      ? "bg-danger/10 border-danger text-danger"
      : "hover:border-danger/50",
    warning: isSelected
      ? "bg-warning/10 border-warning text-warning-foreground"
      : "hover:border-warning/50",
    normal: isSelected
      ? "bg-primary/10 border-primary text-primary"
      : "hover:border-primary/50",
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 text-xs transition-all",
        severityStyles[severity]
      )}
    >
      {isSelected && <Check className="h-3 w-3 mr-1" />}
      {preset.label.uk}
    </Button>
  );
}

// Display component for showing comment badges
interface CommentDisplayProps {
  comment: ItemComment | null;
  size?: "sm" | "md";
  maxPresets?: number;
  className?: string;
}

export function CommentDisplay({
  comment,
  size = "md",
  maxPresets = 3,
  className,
}: CommentDisplayProps) {
  if (!comment || (comment.presets.length === 0 && !comment.text)) {
    return null;
  }

  const displayedPresets = comment.presets.slice(0, maxPresets);
  const remainingCount = comment.presets.length - maxPresets;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {displayedPresets.map((key) => {
        const preset = COMMENT_PRESETS.find((p) => p.key === key);
        if (!preset) return null;

        return (
          <Badge
            key={key}
            variant={preset.severity === "critical" ? "destructive" : "secondary"}
            className={cn(
              size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
            )}
          >
            {preset.label.uk}
          </Badge>
        );
      })}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          +{remainingCount}
        </Badge>
      )}
      {comment.text && (
        <span
          className={cn(
            "text-muted-foreground truncate max-w-[150px]",
            size === "sm" ? "text-[10px]" : "text-xs"
          )}
          title={comment.text}
        >
          {comment.text}
        </span>
      )}
    </div>
  );
}
