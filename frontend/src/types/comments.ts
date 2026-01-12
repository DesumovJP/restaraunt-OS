/**
 * Comments Domain Types
 *
 * Types for item comments, presets, and visibility.
 */

// ==========================================
// COMMENTS SYSTEM
// ==========================================

export type CommentVisibility = "chef" | "waiter" | "manager" | "kitchen";

export interface ItemComment {
  text: string;
  presets: string[];
  visibility: CommentVisibility[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
}

export interface CommentHistoryEntry {
  timestamp: string;
  authorId: string;
  authorName: string;
  value: string;
  presets: string[];
}

export interface CommentPreset {
  documentId?: string;
  slug?: string;
  key: string;
  label: { uk: string; en: string };
  icon?: string;
  category: "modifier" | "allergy" | "dietary" | "allergen";
  severity?: "normal" | "warning" | "critical";
  isActive?: boolean;
  sortOrder?: number;
}

export const COMMENT_PRESETS: CommentPreset[] = [
  // Modifiers
  {
    key: "no_salt",
    label: { uk: "Без солі", en: "No salt" },
    icon: "salt-off",
    category: "modifier",
  },
  {
    key: "no_pepper",
    label: { uk: "Без перцю", en: "No pepper" },
    icon: "pepper-off",
    category: "modifier",
  },
  {
    key: "no_onion",
    label: { uk: "Без цибулі", en: "No onion" },
    icon: "ban",
    category: "modifier",
  },
  {
    key: "no_garlic",
    label: { uk: "Без часнику", en: "No garlic" },
    icon: "ban",
    category: "modifier",
  },
  {
    key: "no_lemon",
    label: { uk: "Без лимона", en: "No lemon" },
    icon: "ban",
    category: "modifier",
  },
  {
    key: "extra_spicy",
    label: { uk: "Гостріше", en: "Extra spicy" },
    icon: "flame",
    category: "modifier",
  },
  {
    key: "less_spicy",
    label: { uk: "Менш гостро", en: "Less spicy" },
    icon: "flame-off",
    category: "modifier",
  },
  {
    key: "well_done",
    label: { uk: "Добре просмажити", en: "Well done" },
    icon: "thermometer",
    category: "modifier",
  },
  {
    key: "medium",
    label: { uk: "Medium", en: "Medium" },
    icon: "thermometer",
    category: "modifier",
  },
  {
    key: "rare",
    label: { uk: "Із кров'ю", en: "Rare" },
    icon: "thermometer",
    category: "modifier",
  },
  // Allergies
  {
    key: "allergy_nuts",
    label: { uk: "Алергія: горіхи", en: "Allergy: nuts" },
    icon: "alert-triangle",
    category: "allergy",
    severity: "critical",
  },
  {
    key: "allergy_dairy",
    label: { uk: "Алергія: молочне", en: "Allergy: dairy" },
    icon: "alert-triangle",
    category: "allergy",
    severity: "critical",
  },
  {
    key: "allergy_gluten",
    label: { uk: "Алергія: глютен", en: "Allergy: gluten" },
    icon: "alert-triangle",
    category: "allergy",
    severity: "critical",
  },
  {
    key: "allergy_seafood",
    label: { uk: "Алергія: морепродукти", en: "Allergy: seafood" },
    icon: "alert-triangle",
    category: "allergy",
    severity: "critical",
  },
  {
    key: "allergy_eggs",
    label: { uk: "Алергія: яйця", en: "Allergy: eggs" },
    icon: "alert-triangle",
    category: "allergy",
    severity: "critical",
  },
  // Dietary
  {
    key: "vegetarian",
    label: { uk: "Вегетаріанське", en: "Vegetarian" },
    icon: "leaf",
    category: "dietary",
  },
  {
    key: "vegan",
    label: { uk: "Веганське", en: "Vegan" },
    icon: "sprout",
    category: "dietary",
  },
  {
    key: "halal",
    label: { uk: "Халяль", en: "Halal" },
    icon: "check",
    category: "dietary",
  },
  {
    key: "kosher",
    label: { uk: "Кошер", en: "Kosher" },
    icon: "check",
    category: "dietary",
  },
];
