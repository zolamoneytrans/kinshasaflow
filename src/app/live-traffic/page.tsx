import LiveTrafficFeed from "@/components/live-traffic-feed";
import { AppShell } from "@/components/app-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Trafic en temps réel',
  description: 'Suivez l\'évolution du trafic à Kinshasa minute par minute pour planifier vos déplacements.',
};

export default function LiveTrafficPage() {
  return (
    <AppShell>
      <LiveTrafficFeed />
    </AppShell>
  );
}
