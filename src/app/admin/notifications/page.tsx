
'use client';

import { AppShell } from "@/components/app-shell";
import { NotificationSender } from "@/components/admin/notification-sender";
import { useUser } from "@/firebase";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminNotificationsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return (
      <AppShell>
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!user || user.email !== 'drnduwa@gmail.com') {
    return (
      <AppShell>
        <div className="flex flex-col h-full w-full items-center justify-center gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Accès Refusé</h2>
          <p className="text-muted-foreground">Seul l'administrateur système peut envoyer des notifications globales.</p>
          <Button onClick={() => router.push('/')}>Retour à l'accueil</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto p-4 md:p-8">
        <NotificationSender />
      </div>
    </AppShell>
  );
}
