"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/lib/site-config";

export default function AskAiButton() {
  const router = useRouter();
  const { askAiLabel } = getSiteConfig();
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={() => router.push("/chat")}>{askAiLabel}</Button>
    </div>
  );
}
