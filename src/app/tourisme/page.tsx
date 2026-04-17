import { AppShell } from "@/components/app-shell";
import TourismPage from "@/components/tourism-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Tourisme et Excursions à Kinshasa - Découvrez la RDC',
  description: 'Explorez les meilleurs sites touristiques de Kinshasa. Safari à la N\'sele, chutes de Zongo, sanctuaire des Bonobos. Réservez vos expériences locales en ligne.',
};

export default function TourismeRoute() {
  return (
    <AppShell>
      <TourismPage />
    </AppShell>
  );
}
