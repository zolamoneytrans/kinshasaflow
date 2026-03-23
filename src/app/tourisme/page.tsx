
'use client';

import { AppShell } from "@/components/app-shell";
import TourismPage from "@/components/tourism-page";
import { Metadata } from "next";

export default function TourismeRoute() {
  return (
    <AppShell>
      <TourismPage />
    </AppShell>
  );
}
