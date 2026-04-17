import LiveTrafficFeed from "@/components/live-traffic-feed";
import { AppShell } from "@/components/app-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Trafic Kinshasa en Temps Réel - État des routes minute par minute',
  description: 'Suivez l\'évolution du trafic à Kinshasa en direct via Google Maps. Évitez les bouchons sur le Blvd du 30 Juin, Lumumba et Kasa-Vubu dès maintenant.',
  openGraph: {
    title: 'Trafic Kinshasa en Temps Réel',
    description: 'Consultez la carte des embouteillages de Kinshasa mise à jour chaque seconde.',
  }
};

export default function LiveTrafficPage() {
  return (
    <AppShell>
      <LiveTrafficFeed />
    </AppShell>
  );
}
