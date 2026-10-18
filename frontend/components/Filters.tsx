"use client";

import { useRef, useEffect } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const scrollToCategory = (categoryName: string) => {
    const container = scrollContainerRef.current;
    const itemEl = itemRefs.current[categoryName];
    if (container && itemEl) {
      const containerWidth = container.clientWidth;
      const itemLeft = itemEl.offsetLeft;
      const itemWidth = itemEl.offsetWidth;
      const targetScrollLeft = itemLeft - containerWidth / 2 + itemWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }
  };

  const handleSelect = (categoryName: string) => {
    onSelectCategory(categoryName);
    scrollToCategory(categoryName);
  };

  useEffect(() => {
    scrollToCategory(selectedCategory);
  }, [selectedCategory]);

  return (
    <div ref={scrollContainerRef} className="w-full overflow-x-auto no-scrollbar pt-2 pb-1.5 px-1">
      <div className="flex gap-2 sm:gap-2.5 px-1 min-w-max">
        {categories.map(({ name, icon: Icon }, index) => (
          <motion.button
            key={name}
            ref={(el) => {
              itemRefs.current[name] = el;
            }}
            onClick={() => handleSelect(name)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035, duration: 0.25 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            className={`group relative flex h-9 sm:h-10 items-center gap-2 rounded-full border px-3.5 text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
              selectedCategory === name
                ? "border-amber-300/80 text-white shadow-[0_4px_16px_rgba(232,111,24,0.3)]"
                : "border-amber-200/80 bg-white text-[#173247] shadow-[0_2px_8px_rgba(232,111,24,0.06)] hover:border-[#e86f18] hover:shadow-[0_6px_20px_rgba(232,111,24,0.15)]"
            }`}
          >
            {selectedCategory === name && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#e86f18] to-[#f5ad45] shadow-[0_4px_16px_rgba(232,111,24,0.3)]"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
                selectedCategory === name
                  ? "bg-white/25 text-white"
                  : "bg-gradient-to-br from-[#e86f18] to-[#f5ad45] text-white shadow-xs"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="relative z-10 whitespace-nowrap">{t(name)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
