'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { saveSubscription } from '@/lib/push';
import { useFirebase, useUser } from '@/firebase';

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationPermission() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, []);

  const subscribeUser = async () => {
    if (!user) {
      toast({ title: "Vous devez être connecté", description: "Connectez-vous pour activer les notifications.", variant: "destructive" });
      return;
    }
    
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
        console.error('VAPID public key is not defined.');
        toast({ title: 'Erreur de configuration', description: 'La clé de notification est manquante.', variant: 'destructive'});
        return;
    }

    setIsSubscribing(true);

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      let subscription = await swRegistration.pushManager.getSubscription();
      if (subscription === null) {
        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }
      
      await saveSubscription(firestore, user.uid, subscription.toJSON());
      setPermission('granted');
      toast({ title: 'Notifications activées!', description: 'Vous recevrez désormais des mises à jour importantes.' });
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
      toast({ title: 'Erreur', description: "Impossible d'activer les notifications.", variant: 'destructive' });
      setPermission(Notification.permission); // reset to actual permission state
    } finally {
      setIsSubscribing(false);
    }
  };
  
  const handleRequestPermission = async () => {
    if (permission !== 'default') return;

    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);

    if (newPermission === 'granted') {
      await subscribeUser();
    } else {
      toast({ title: 'Notifications bloquées', description: 'Vous pouvez les activer plus tard dans les paramètres de votre navigateur.', variant: 'default' });
    }
  };

  if (!user || permission === 'loading' || permission === 'granted' || permission === 'unsupported') {
    return null; // Don't show anything if user not logged in, or permission already granted/unsupported
  }
  
  if (permission === 'denied') {
      return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Notifications bloquées</p>
            <p>Pour recevoir des alertes de trafic en temps réel, veuillez autoriser les notifications dans les paramètres de votre navigateur.</p>
        </div>
      );
  }

  if (permission === 'default') {
    return (
      <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-md my-2 flex items-center justify-between">
        <div>
          <p className="font-bold text-foreground">Restez informé en temps réel !</p>
          <p className="text-muted-foreground text-sm">Activez les notifications pour recevoir les alertes de trafic importantes.</p>
        </div>
        <Button onClick={handleRequestPermission} disabled={isSubscribing}>
          {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
          Activer
        </Button>
      </div>
    );
  }

  return null;
}
