'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Loader2 } from 'lucide-react';
import { saveSubscription, saveFCMToken } from '@/lib/push';
import { useFirebase } from '@/firebase';
import { getToken, onMessage } from 'firebase/messaging';

export function NotificationPermission() {
  const { user, firestore, messaging } = useFirebase();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // 1. Detect current permission on load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, []);

  // 2. Listen for messages in FOREGROUND (App open)
  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Notification received in foreground:', payload);
        toast({
          title: payload.notification?.title || 'Kinshasa Flow',
          description: payload.notification?.body || 'Nouvelle mise à jour reçue.',
        });
      });
      return () => unsubscribe();
    }
  }, [messaging, toast]);

  const subscribeUser = async () => {
    if (!user || !messaging) return;
    
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapidKey) {
        console.warn('FCM VAPID key is missing in environment variables.');
        return;
    }

    setIsSubscribing(true);

    try {
      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;

      // STAGE 1: Save standard Web Push Subscription (for our custom Test Push page)
      try {
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey
        });
        if (sub) {
          await saveSubscription(firestore, user.uid, sub.toJSON());
          console.log('Web Push Subscription saved.');
        }
      } catch (subErr) {
        console.warn('Standard Web Push subscription failed, falling back to FCM only.', subErr);
      }

      // STAGE 2: Get FCM Token (for Firebase Console campaigns)
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        await saveFCMToken(firestore, user.uid, currentToken);
        console.log('FCM Token saved successfully.');
      }

      setPermission('granted');
      toast({ 
        title: 'Notifications activées!', 
        description: 'Vous recevrez désormais les alertes de trafic en temps réel.' 
      });
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({ 
        title: 'Erreur', 
        description: "Impossible d'activer les notifications. Vérifiez les paramètres de votre navigateur.", 
        variant: 'destructive' 
      });
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
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md my-4" role="alert">
            <p className="font-bold">Notifications bloquées</p>
            <p className="text-sm">Veuillez autoriser les notifications dans les paramètres de votre navigateur pour recevoir les alertes.</p>
        </div>
      );
  }

  return (
    <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-md my-2 flex items-center justify-between">
      <div className="pr-4">
        <p className="font-bold text-foreground">Restez informé en temps réel !</p>
        <p className="text-muted-foreground text-sm">Activez les notifications pour ne rien rater sur le trafic de Kinshasa.</p>
      </div>
      <Button onClick={handleRequestPermission} disabled={isSubscribing} className="shrink-0">
        {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
        Activer
      </Button>
    </div>
  );
}
