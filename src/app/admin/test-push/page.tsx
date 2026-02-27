'use client';

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup } from "firebase/firestore";
import { sendTestPushNotificationAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Send } from "lucide-react";
import { useState } from "react";

export default function TestPushPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSending, setIsSubmitting] = useState(false);

  const isAdmin = user?.email === 'drnduwa@gmail.com';

  // Only attempt to fetch if the user is authenticated and is the admin
  const subsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collectionGroup(firestore, 'pushSubscriptions');
  }, [firestore, isAdmin]);

  const { data: subs, isLoading } = useCollection(subsQuery);

  const handleSendTest = async () => {
    if (!subs || subs.length === 0) {
      toast({ title: "Aucune cible", description: "Aucun utilisateur n'a activé les notifications.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    for (const sub of subs) {
      const result = await sendTestPushNotificationAction(sub as any, "Ceci est une notification de test de Kinshasa Flow !");
      if (result.success) successCount++;
    }

    toast({ 
      title: "Test terminé", 
      description: `${successCount} notifications envoyées avec succès sur ${subs.length} tentatives.` 
    });
    setIsSubmitting(false);
  };

  if (!isAdmin) return (
    <AppShell>
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Accès restreint aux administrateurs.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell /> Test de Notifications</CardTitle>
            <CardDescription>Vérifiez que votre configuration Web Push fonctionne correctement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Utilisateurs enregistrés (Abonnements Push) :</p>
              <p className="text-2xl font-bold">{isLoading ? "Chargement..." : subs?.length || 0}</p>
            </div>

            <Button onClick={handleSendTest} disabled={isSending || isLoading || !subs?.length} className="w-full h-16 text-lg">
              {isSending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Send className="mr-2 h-6 w-6" />}
              Envoyer un message de test
            </Button>

            <div className="text-xs text-muted-foreground mt-4">
              <p>Note : Cette fonction utilise votre clé VAPID privée pour envoyer des messages via votre propre serveur. Pour utiliser le <strong>Firebase Messaging Dashboard</strong>, assurez-vous d'avoir configuré le certificat Web Push dans la console Firebase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}