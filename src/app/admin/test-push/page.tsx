'use client';

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, collection, query, limit } from "firebase/firestore";
import { sendTestPushNotificationAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Send, AlertCircle, Smartphone, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TestPushPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSending, setIsSubmitting] = useState(false);
  const [testMessage, setTestMessage] = useState("Alerte K-Flow: Embouteillage majeur détecté sur le Boulevard du 30 Juin !");

  const isAdmin = user?.email === 'drnduwa@gmail.com';

  // Récupérer les abonnements directs (Web Push standard)
  const subsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collectionGroup(firestore, 'pushSubscriptions');
  }, [firestore, isAdmin]);

  const { data: subs, isLoading } = useCollection(subsQuery);

  // Récupérer les tokens FCM (Firebase Console)
  const tokensQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collectionGroup(firestore, 'fcmTokens');
  }, [firestore, isAdmin]);
  
  const { data: tokens, isLoading: tokensLoading } = useCollection(tokensQuery);

  const handleSendTest = async () => {
    if (!subs || subs.length === 0) {
      toast({ 
        title: "Aucune cible", 
        description: "Vous devez d'abord activer les notifications sur votre profil.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    // Envoi via Web Push direct (nécessite VAPID_PRIVATE_KEY)
    for (const sub of subs) {
      const result = await sendTestPushNotificationAction(sub as any, testMessage);
      if (result.success) successCount++;
    }

    if (successCount === 0 && subs.length > 0) {
        toast({ 
            title: "Erreur serveur", 
            description: "La clé VAPID_PRIVATE_KEY n'est pas configurée dans les variables d'environnement.",
            variant: "destructive"
        });
    } else {
        toast({ 
            title: "Pop-up envoyé !", 
            description: `${successCount} notifications expédiées avec succès.` 
        });
    }
    setIsSubmitting(false);
  };

  if (!isAdmin) return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <AlertCircle className="h-16 w-16 text-destructive/20" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Accès restreint à l'administrateur</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Smartphone className="text-primary h-8 w-8" />
                Push Engine
              </h1>
              <p className="text-muted-foreground font-medium italic">Simulez l'envoi de messages pop-up type "WhatsApp".</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
              Mode Service Worker Actif
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <StatsCard title="Cibles Web Push" value={subs?.length || 0} loading={isLoading} icon={Zap} color="bg-blue-500" />
            <StatsCard title="Tokens FCM" value={tokens?.length || 0} loading={tokensLoading} icon={Smartphone} color="bg-amber-500" />
          </div>

          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/20 p-2 rounded-xl">
                    <Bell className="text-primary h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-widest">Éditeur de Push</CardTitle>
              </div>
              <CardDescription className="text-slate-400 font-medium">Le message apparaîtra en haut de l'écran sur mobile, même si l'app est fermée.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contenu du pop-up</label>
                <textarea 
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full min-h-[120px] rounded-[1.5rem] border-2 border-slate-100 bg-slate-50 p-6 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary shadow-inner resize-none"
                  placeholder="Écrivez votre message..."
                />
              </div>

              <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                <div className="bg-primary p-2 rounded-xl text-white shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-primary uppercase tracking-widest">Infrastructure PWA</p>
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    L'application doit être <strong>installée</strong> sur l'écran d'accueil pour une fiabilité maximale en arrière-plan. Sur iOS, le mode PWA est obligatoire pour les notifications.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button 
                onClick={handleSendTest} 
                disabled={isSending || isLoading || !subs?.length} 
                className="w-full h-16 rounded-[1.5rem] text-xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isSending ? <Loader2 className="mr-3 h-8 w-8 animate-spin" /> : <Send className="mr-3 h-8 w-8" />}
                Envoyer le Pop-up
              </Button>
            </CardFooter>
          </Card>

          <div className="p-6 bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Aide Technique</p>
            <ul className="space-y-3 text-[11px] font-bold text-slate-500">
              <li className="flex gap-3"><span className="text-primary">1.</span> L'utilisateur doit cliquer sur "Autoriser" dans le bandeau bleu en haut de l'app.</li>
              <li className="flex gap-3"><span className="text-primary">2.</span> Le Service Worker enregistre un "endpoint" sécurisé dans Firestore.</li>
              <li className="flex gap-3"><span className="text-primary">3.</span> Cet outil utilise la clé privée VAPID pour réveiller le téléphone de la cible.</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatsCard({ title, value, loading, icon: Icon, color }: { title: string, value: number, loading: boolean, icon: any, color: string }) {
    return (
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-slate-900">{loading ? "..." : value}</p>
                </div>
                <div className={cn("p-4 rounded-2xl shadow-lg", color)}>
                    <Icon className="text-white h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}