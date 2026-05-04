
import { AppShell } from "@/components/app-shell";
import HazardMap from "@/components/hazard-map";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Carte des Dangers - Sécurité Routière Kinshasa',
  description: 'Visualisez et signalez en temps réel les nids-de-poule, barrages routiers et zones dangereuses à Kinshasa.',
};

export default function HazardMapPage() {
  return (
    <AppShell>
      <HazardMap />
    </AppShell>
  );
}
