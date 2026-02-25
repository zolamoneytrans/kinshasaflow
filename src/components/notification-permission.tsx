'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Loader2 } from 'lucide-react';
import { saveSubscription, saveFCMToken } from '@/lib/push';
import { useFirebase, useUser } from '@/firebase';
import { getToken } from 'firebase/messaging';

export function NotificationPermission() {
  const { user, firestore, messaging } = useFirebase();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, []);

  const subscribeUser = async () => {
    if (!user || !messaging) return;
    
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapidKey) {
        console.warn('FCM VAPID key is missing in environment variables.');
        return;
    }

    setIsSubscribing(true);

    try {
      // Ensure service worker is registered and ready
      const registration = await navigator.serviceWorker.ready;

      // 1. Get FCM Token (Standard way for Firebase Console)
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        await saveFCMToken(firestore, user.uid, currentToken);
        console.log('FCM Token generated and saved:', currentToken);
      }

      // 2. Also register standard Web Push for your custom backend tests
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey
        });
      }
      
      if (subscription) {
        await saveSubscription(firestore, user.uid, subscription.toJSON());
      }

      setPermission('granted');
      toast({ title: 'Notifications activées!', description: 'Vous recevrez désormais des alertes en temps réel.' });
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
      toast({ title: 'Erreur', description: "Impossible d'activer les notifications. Vérifiez les paramètres de votre navigateur.", variant: 'destructive' });
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
    }
  };

  if (!user || permission === 'loading' || permission === 'granted' || permission === 'unsupported') {
    return null;
  }
  
  if (permission === 'denied') {
      return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Notifications bloquées</p>
            <p>Veuillez autoriser les notifications dans les paramètres de votre navigateur pour rester informé.</p>
        </div>
      );
  }

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
