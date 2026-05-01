'use client';

import { AppShell } from "@/components/app-shell";
import FluxInfrastructureStats from "@/components/flux-infrastructure-stats";

export default function FluxInfrastructurePage() {
  return (
    <AppShell>
      <FluxInfrastructureStats />
    </AppShell>
  );
}
