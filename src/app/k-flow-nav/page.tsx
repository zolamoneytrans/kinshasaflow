
'use client';

import { AppShell } from "@/components/app-shell";
import KFlowNav from "@/components/k-flow-nav";
import { Metadata } from "next";

export default function KFlowNavPage() {
  return (
    <AppShell>
      <KFlowNav />
    </AppShell>
  );
}
