"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/settings?tab=profile");
  }, [router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
