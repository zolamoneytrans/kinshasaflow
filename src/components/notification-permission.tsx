
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { saveSubscription, saveFCMToken } from '@/lib/push';
import { useFirebase } from '@/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Notification reçue au premier plan:', payload);
        toast({
          title: payload.notification?.title || 'Kinshasa Flow',
          description: payload.notification?.body || 'Mise à jour reçue.',
        });
      });
      return () => unsubscribe();
    }
  }, [messaging, toast]);

  const subscribeUser = async () => {
    if (!user || !messaging) return;
    
    // Une clé VAPID valide est requise pour éviter l'erreur "65 bytes".
    // Si la clé n'est pas définie dans .env, nous utilisons un format de secours 
    // mais le build échouera sans une clé réelle générée via web-push generate-vapid-keys.
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY || "BMv7Y_PlaceHolder_VAPID_Key_Should_Be_87_Chars_Long_For_Full_Compatibility_123456789"; 

    setIsSubscribing(true);

    try {
      // 1. Enregistrement explicite du Service Worker pour FCM
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      });
      
      console.log('Service Worker enregistré avec succès pour FCM');

      // 2. Récupération du Token FCM
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        await saveFCMToken(firestore, user.uid, currentToken);
        console.log('Token FCM enregistré avec succès.');
        
        // 3. Optionnel: Enregistrement Web Push standard (Fallback)
        try {
          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey
          });
          if (sub) {
            await saveSubscription(firestore, user.uid, sub.toJSON());
          }
        } catch (e) {
          console.warn('Standard Web Push failed, FCM active only.');
        }

        setPermission('granted');
        toast({ 
          title: 'Mode Background Actif !', 
          description: 'Vous recevrez les alertes même si l\'application est fermée.' 
        });
      }
    } catch (error) {
      console.error('Erreur d\'activation des notifications:', error);
      toast({ 
        title: 'Erreur VAPID', 
        description: "Clé VAPID invalide ou format incorrect. Vérifiez vos variables d'environnement.", 
        variant: 'destructive' 
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!user || permission === 'loading' || permission === 'granted' || permission === 'unsupported') {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl border-b-2 border-primary/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative z-40 mb-4 rounded-[2rem] mx-2 border"
    >
      <div className="flex items-center gap-5">
        <div className="bg-primary/10 p-4 rounded-[1.25rem] ring-4 ring-primary/5">
          <Bell className="text-primary h-7 w-7 animate-swing" />
        </div>
        <div>
          <p className="font-black text-slate-900 text-lg tracking-tight">Vivez Kinshasa en temps réel</p>
          <p className="text-slate-500 font-medium text-sm">Recevez des alertes pop-up sur le trafic, même en arrière-plan.</p>
        </div>
      </div>
      
      <Button 
        onClick={subscribeUser} 
        disabled={isSubscribing} 
        className="h-14 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 gap-3 text-lg transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
      >
        {isSubscribing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-5 w-5 fill-white" />
            Activer les Alertes
          </>
        )}
      </Button>
    </motion.div>
  );
}
