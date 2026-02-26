import TrafficReports from "@/components/traffic-reports";
import { AppShell } from "@/components/app-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Rapports de trafic en direct',
  description: 'Consultez les derniers rapports de trafic et les embouteillages signalés par la communauté à Kinshasa.',
};

export default function ReportsPage() {
  return (
    <AppShell>
      <TrafficReports />
    </AppShell>
  );
}
