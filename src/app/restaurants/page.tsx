import { AppShell } from "@/components/app-shell";
import RestaurantsPage from "@/components/restaurants-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Restaurants & Gastronomie',
  description: 'Trouvez les meilleurs restaurants de Kinshasa par commune, note et spécialité. Naviguez facilement vers votre prochaine destination culinaire.',
};

export default function RestaurantsRoute() {
  return (
    <AppShell>
      <RestaurantsPage />
    </AppShell>
  );
}
