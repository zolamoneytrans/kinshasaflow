import { AppShell } from "@/components/app-shell";
import TransportPage from "@/components/transport-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Abonnement Transport Travailleurs',
  description: 'Solutions de transport organisé pour les professionnels à Kinshasa. Covoiturage et navettes d\'entreprise.',
};

export default function TransportRoute() {
  return (
    <AppShell>
      <TransportPage />
    </AppShell>
  );
}
