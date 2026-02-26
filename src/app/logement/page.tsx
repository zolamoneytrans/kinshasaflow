import { AppShell } from "@/components/app-shell";
import LogementPage from "@/components/logement-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Logement de court séjour',
  description: 'Trouvez des appartements et studios meublés de type RBNB à Gombe et dans tout Kinshasa.',
};

export default function LogementRoute() {
  return (
    <AppShell>
      <LogementPage />
    </AppShell>
  );
}
