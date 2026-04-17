import { AppShell } from "@/components/app-shell";
import AssistantChat from "@/components/assistant-chat";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Assistant IA Kinshasa - Votre guide vocal pour le trafic',
  description: 'Posez vos questions sur les itinéraires de Kinshasa à notre IA. K-Flow Assistant vous répond en Français et en Lingala pour vous faire gagner du temps.',
};

export default function AssistantPage() {
  return (
    <AppShell>
      <AssistantChat />
    </AppShell>
  );
}
