'use client';

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup } from "firebase/firestore";
import { sendTestPushNotificationAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Send, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
      toast({ title: "Aucune cible", description: "Aucun utilisateur n'a activé les notifications avec succès.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    for (const sub of subs) {
      // Note: This requires VAPID_PRIVATE_KEY in .env
      const result = await sendTestPushNotificationAction(sub as any, "Ceci est une notification de test de Kinshasa Flow !");
      if (result.success) successCount++;
    }

    if (successCount === 0 && subs.length > 0) {
        toast({ 
            title: "Erreur d'envoi", 
            description: "Assurez-vous que votre VAPID_PRIVATE_KEY est configurée dans le fichier .env.",
            variant: "destructive"
        });
    } else {
        toast({ 
            title: "Test terminé", 
            description: `${successCount} notifications envoyées avec succès sur ${subs.length} tentatives.` 
        });
    }
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
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration requise</AlertTitle>
                <AlertDescription>
                    Pour que cet outil fonctionne, vous devez ajouter votre <strong>Private Key</strong> (Clé privée) dans votre fichier <code>.env</code> sous le nom <code>VAPID_PRIVATE_KEY</code>.
                </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Utilisateurs avec abonnement direct :</p>
              <p className="text-2xl font-bold">{isLoading ? "Chargement..." : subs?.length || 0}</p>
            </div>

            <Button onClick={handleSendTest} disabled={isSending || isLoading || !subs?.length} className="w-full h-16 text-lg">
              {isSending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Send className="mr-2 h-6 w-6" />}
              Envoyer un message de test
            </Button>

            <div className="text-xs text-muted-foreground mt-4 space-y-2">
              <p>1. <strong>Test Push Tool</strong> : Utilise la clé privée pour envoyer un message directement via votre serveur.</p>
              <p>2. <strong>Firebase Console</strong> : Utilise les "FCM Tokens" stockés dans la base de données pour envoyer des campagnes marketing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
