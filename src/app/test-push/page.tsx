'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFirebase, useUser } from '@/firebase';
import { collectionGroup, getDocs, query, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { sendTestPushNotificationAction } from '@/app/actions';
import { PushSubscription } from '@/lib/types';
import { Loader2, Send, ShieldAlert } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
      const subscriptionsQuery = query(collectionGroup(firestore, 'pushSubscriptions'));
      const querySnapshot = await getDocs(subscriptionsQuery);

      if (querySnapshot.empty) {
        toast({ title: "Aucun abonnement trouvé", description: "Aucun utilisateur n'est abonné aux notifications.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      let notificationsSent = 0;
      const payload = JSON.stringify({
        title: title,
        body: body,
        icon: '/icon.svg',
      });

      const expiredSubscriptionRefs = [];

      for (const doc of querySnapshot.docs) {
        const subscription = doc.data() as PushSubscription;
        const result = await sendTestPushNotificationAction(subscription, payload);
        if (result.success) {
          notificationsSent++;
        } else if (result.error === 'Subscription expired.') {
            // Collect ref of expired subscription to delete later
            expiredSubscriptionRefs.push(doc.ref);
        }
      }

      // Batch delete expired subscriptions
      for (const subRef of expiredSubscriptionRefs) {
        await deleteDoc(subRef);
      }

      if (notificationsSent > 0) {
        toast({ title: "Notification envoyée!", description: `Envoyée à ${notificationsSent} appareil(s). ${expiredSubscriptionRefs.length > 0 ? `${expiredSubscriptionRefs.length} abonnement(s) expiré(s) supprimé(s).` : ''}` });
      } else {
        toast({ title: "Échec de l'envoi", description: `Impossible d'envoyer des notifications. ${expiredSubscriptionRefs.length > 0 ? `${expiredSubscriptionRefs.length} abonnement(s) expiré(s) ont été supprimés.` : 'Vérifiez qu\'il y a des abonnements actifs.'}`, variant: "destructive" });
      }

    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({ title: "Une erreur est survenue", description: error.message || "Impossible d'envoyer les notifications.", variant: "destructive" });
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
            <CardDescription>Rédigez un message et envoyez-le à tous les utilisateurs abonnés.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la notification" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="body">Message</Label>
                    <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Contenu de la notification" disabled={isLoading} />
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSendNotification} disabled={isLoading || !title} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Envoyer la Notification
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
