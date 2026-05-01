import { AppShell } from "@/components/app-shell";
import StrategicInsights from "@/components/strategic-insights";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'K-Flow Insights - Analyse Stratégique du Trafic Kinshasa',
  description: 'Intelligence routière en temps réel. Analyse automatisée toutes les 15 minutes avec conseils IA pour optimiser vos trajets à Kinshasa.',
};

export default function InsightsPage() {
  return (
    <AppShell>
      <StrategicInsights />
    </AppShell>
  );
}
