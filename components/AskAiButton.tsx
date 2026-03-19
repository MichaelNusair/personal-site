"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AskAiButton() {
  const router = useRouter();
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={() => router.push("/chat")}>
        Ask my AI personal manager about me
      </Button>
    </div>
  );
}
