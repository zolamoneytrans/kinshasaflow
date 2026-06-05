import { AppShell } from "@/components/app-shell";
import CommunityChat from "@/components/community-chat";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'K-Flow Chat - Radio Trottoir de Kinshasa',
  description: 'Échangez en direct avec la communauté kinoise. Partagez des audios, vidéos et photos sur l\'état du trafic et des routes à Kinshasa.',
};

export default function CommunityChatPage() {
  return (
    <AppShell>
      <CommunityChat />
    </AppShell>
  );
}
