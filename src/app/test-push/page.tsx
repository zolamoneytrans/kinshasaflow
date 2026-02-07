'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { sendTestPushNotificationAction } from '@/app/actions';
import { PushSubscription } from '@/lib/types';
import { Loader2, Send, ShieldAlert } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function TestPushPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('Alerte de trafic Kinshasa Flow');
  const [body, setBody] = useState('');
  
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const handleSendNotification = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You must be logged in to test push notifications.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const subscriptionsRef = collection(firestore, 'users', user.uid, 'pushSubscriptions');
      const q = query(subscriptionsRef);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "Aucun abonnement trouvé", description: "Veuillez d'abord autoriser les notifications sur un appareil.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      let notificationsSent = 0;
      const payload = JSON.stringify({
        title: title,
        body: body,
        icon: '/icon.svg',
      });

      for (const doc of querySnapshot.docs) {
        const subscription = doc.data() as PushSubscription;
        const result = await sendTestPushNotificationAction(subscription, payload);
        if (result.success) {
          notificationsSent++;
        }
      }

      if (notificationsSent > 0) {
        toast({ title: "Notification envoyée!", description: `Envoyée à ${notificationsSent} appareil(s). Elle devrait arriver sous peu.` });
      } else {
        toast({ title: "Échec de l'envoi", description: "Impossible d'envoyer la notification. Veuillez vérifier la console pour les erreurs.", variant: "destructive" });
      }

    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({ title: "Une erreur est survenue", description: "Impossible d'envoyer la notification de test.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
     return (
        <AppShell>
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </AppShell>
     )
  }

  if (!isAdmin) {
    return (
        <AppShell>
            <div className="flex h-full w-full items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Accès non autorisé</AlertTitle>
                  <AlertDescription>
                    Cette page est réservée aux administrateurs de Kinshasa Flow.
                  </AlertDescription>
                </Alert>
            </div>
        </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Envoyer une Notification Push</CardTitle>
            <CardDescription>Rédigez un message pour tester le système de notification. Ceci enverra une notification à vos appareils abonnés.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la notification" disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Contenu de la notification" disabled={isLoading} />
            </div>
            <Button onClick={handleSendNotification} disabled={isLoading || !title || !body} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer la Notification
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
