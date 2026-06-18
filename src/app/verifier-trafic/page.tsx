import { AppShell } from "@/components/app-shell";
import TrafficCheck from "@/components/traffic-check";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Vérifier le Trafic - État des rues à Kinshasa',
  description: 'Vérifiez instantanément si une avenue est bouchée ou fluide. Analyse intelligente combinant données GPS et rapports communautaires Kinois.',
};

export default function VerifierTraficPage() {
  return (
    <AppShell>
      <TrafficCheck />
    </AppShell>
  );
}
