import { AppShell } from "@/components/app-shell";
import CarRentalPage from "@/components/car-rental-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Location de Véhicules',
  description: 'Louez une voiture à Kinshasa au meilleur prix. Large flotte disponible : Toyota, Mercedes, Jeep et plus.',
};

export default function LocationVoitureRoute() {
  return (
    <AppShell>
      <CarRentalPage />
    </AppShell>
  );
}
