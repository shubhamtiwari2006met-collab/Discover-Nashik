"use client";

import Link from "next/link";
import { 
  Building2, 
  Utensils, 
  Hotel, 
  TreePine, 
  Waves, 
  Mountain, 
  Grape, 
  ShoppingBag,
  Ambulance
} from "lucide-react";
import { motion } from "framer-motion";

import { useTranslation } from "@/lib/i18n";

const categories = [
  { name: "Temples", icon: Building2, color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500" },
  { name: "Food", icon: Utensils, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500" },
  { name: "Hotels", icon: Hotel, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500" },
  { name: "Nature", icon: TreePine, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500" },
  { name: "Waterfalls", icon: Waves, color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-500" },
  { name: "Trekking", icon: Mountain, color: "bg-stone-100 text-stone-600 dark:bg-stone-900/30 dark:text-stone-500" },
  { name: "Vineyards", icon: Grape, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-500" },
  { name: "Shopping", icon: ShoppingBag, color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-500" },
  { name: "Emergency", icon: Ambulance, color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-500" },
];

export function CategoryGrid() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link key={category.name} href={`/search?category=${category.name.toLowerCase()}`}>
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 transition-all cursor-pointer h-full"
            >
              <div className={`p-3 rounded-full mb-3 ${category.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                {t(category.name)}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
