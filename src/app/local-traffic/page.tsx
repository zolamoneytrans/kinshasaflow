
'use client';

import { AppShell } from "@/components/app-shell";
import LocalTrafficSummary from "@/components/local-traffic-summary";

export default function LocalTrafficPage() {
  return (
    <AppShell>
      <LocalTrafficSummary />
    </AppShell>
  );
}
