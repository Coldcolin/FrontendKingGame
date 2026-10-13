import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminSetup } from "@/components/AdminSetup";

export const metadata: Metadata = { title: "New match · DiffArena" };

export default function Page() {
  return (
    <Suspense>
      <AdminSetup />
    </Suspense>
  );
}
