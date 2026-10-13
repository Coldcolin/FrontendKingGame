import { Suspense } from "react";
import type { Metadata } from "next";
import { Spectate } from "@/components/Spectate";

export const metadata: Metadata = { title: "Watching · DiffArena" };

export default function Page() {
  return (
    <Suspense>
      <Spectate />
    </Suspense>
  );
}
