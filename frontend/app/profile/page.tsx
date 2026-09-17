"use client";
import { useTranslation } from "@/lib/i18n";

export default function Profile() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{t("Profile")}</h1>
        <p className="text-slate-500">{t("User profile dashboard coming soon.")}</p>
      </div>
    </div>
  );
}
