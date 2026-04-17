import { AppShell } from "@/components/app-shell";
import KFlowNav from "@/components/k-flow-nav";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'K-Flow Nav - GPS Intelligent et Alertes Trafic Kinshasa',
  description: 'Naviguez dans Kinshasa avec notre GPS intelligent. Alertes d\'embouteillages (Rouge/Jaune), calcul d\'itinéraire rapide et signalements communautaires en direct.',
};

export default function KFlowNavPage() {
  return (
    <AppShell>
      <KFlowNav />
    </AppShell>
  );
}
