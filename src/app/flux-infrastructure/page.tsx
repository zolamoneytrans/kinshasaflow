
'use client';

import { AppShell } from "@/components/app-shell";
import FluxInfrastructureStats from "@/components/flux-infrastructure-stats";
import { Metadata } from "next";

export default function FluxInfrastructurePage() {
  return (
    <AppShell>
      <FluxInfrastructureStats />
    </AppShell>
  );
}
