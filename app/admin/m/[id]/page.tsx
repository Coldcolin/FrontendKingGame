import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminLobby } from "@/components/AdminLobby";

export const metadata: Metadata = { title: "Match lobby · DiffArena" };

export default function Page() {
  return (
    <Suspense>
      <AdminLobby />
    </Suspense>
  );
}
