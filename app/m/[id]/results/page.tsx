import { Suspense } from "react";
import type { Metadata } from "next";
import { Results } from "@/components/Results";

export const metadata: Metadata = { title: "Results · DiffArena" };

export default function Page() {
  return (
    <Suspense>
      <Results />
    </Suspense>
  );
}
