"use client";

import { motion } from "framer-motion";
import { Building2, Compass, Hotel, Utensils, Grape, Map, Users, CalendarDays, ShoppingBag, Layers } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const categories = [
  { name: "All", matches: [], icon: Compass },
  { name: "Temples & Spiritual", matches: ["Temples & Spiritual", "Temples", "Spiritual Places", "Temples & Religious Places"], icon: Building2 },
  { name: "Mountain & Treks", matches: ["Mountain & Treks", "Treks", "Trekking"], icon: Compass },
  { name: "Hotels & Stays", matches: ["Hotels & Stays", "Hotels"], icon: Hotel },
  { name: "Restaurant & Food", matches: ["Restaurant & Food", "Food & Restaurants", "Food", "Catering"], icon: Utensils },
  { name: "Wineries", matches: ["Wineries", "Vineyards"], icon: Grape },
  { name: "Tourist Spots", matches: ["Tourist Spots", "Tourist Attractions"], icon: Map },
  { name: "Shopping", matches: ["Shopping & Retail", "Shopping", "Grocery Stores"], icon: ShoppingBag },
  { name: "Services", matches: ["Services", "Travel & Transport"], icon: Layers },
  { name: "Events", matches: ["Events"], icon: CalendarDays },
];

type FiltersProps = {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export function Filters({ selectedCategory, onSelectCategory }: FiltersProps) {
  const { t } = useTranslation();
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4 px-2">
      <div className="flex gap-3 px-4 min-w-max">
        {categories.map(({ name, icon: Icon }, index) => (
          <motion.button
            key={name}
            onClick={() => onSelectCategory(name)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035, duration: 0.25 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={`group relative flex h-12 items-center gap-2 rounded-2xl border px-3.5 text-sm font-semibold transition-all ${
              selectedCategory === name
                ? "border-orange-300/60 text-white shadow-[0_0_24px_rgba(232,111,24,0.32)]"
                : "border-[#e1cfb0] text-[#536c78] hover:border-orange-300/60 hover:bg-orange-50 hover:text-[#173247]"
            }`}
          >
            {selectedCategory === name && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#e86f18] to-[#f5ad45] shadow-[0_0_30px_rgba(232,111,24,0.35)]"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-lg ${selectedCategory === name ? "bg-white/20" : "bg-orange-100 text-[#c9580f] group-hover:bg-orange-200/60"}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="relative z-10">{t(name)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
