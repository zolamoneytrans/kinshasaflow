'use client';

import React, { useState } from 'react';
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, Loader2, Info, Mail, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendTestEmailAction } from '@/app/actions';

export function NotificationSender() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system_alert' as 'user_joined' | 'traffic_report' | 'video_added' | 'system_alert',
    link: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast({ title: "Champs requis", description: "Veuillez remplir au moins le titre et le message.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const notifRef = collection(firestore, 'notifications');
      await addDoc(notifRef, {
        ...formData,
        timestamp: serverTimestamp(),
        userId: user?.uid || 'admin'
      });

      toast({ title: "Notification envoyée !", description: "Le message est désormais visible sur le flux communautaire." });
      setFormData({
        title: '',
        message: '',
        type: 'system_alert',
        link: ''
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({ title: "Erreur", description: "Impossible d'envoyer la notification.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const result = await sendTestEmailAction();
      if (result.success) {
        toast({ title: "E-mail envoyé !", description: "Vérifiez la boîte drnduwa@gmail.com." });
      } else {
        toast({ title: "Échec SMTP", description: result.error || "Erreur inconnue.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erreur technique", description: "L'action serveur n'a pas répondu.", variant: "destructive" });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Bell className="text-primary h-8 w-8" />
            Centre de Diffusion
          </h1>
          <p className="text-muted-foreground font-medium">Envoyez des alertes en temps réel à tous les Kinois.</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleTestEmail} 
          disabled={isTestingEmail}
          className="rounded-xl border-2 font-bold h-11 px-6 gap-2"
        >
          {isTestingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 text-emerald-600" />}
          Diagnostiquer SMTP
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 font-bold">In-App</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs">
            Le formulaire ci-dessous publie dans le flux de notifications de l'application.
          </AlertDescription>
        </Alert>

        <Alert variant="default" className="bg-emerald-50 border-emerald-200">
          <Zap className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800 font-bold">E-mail</AlertTitle>
          <AlertDescription className="text-emerald-700 text-xs">
            Utilisez le diagnostic ci-dessus pour vérifier que Gmail autorise l'envoi d'alertes.
          </AlertDescription>
        </Alert>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-primary p-8 text-white">
          <CardTitle className="text-xl">Rédiger une alerte</CardTitle>
          <CardDescription className="text-primary-foreground/80">Soyez concis et percutant.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Titre de l'alerte</label>
              <Input 
                placeholder="Ex: Travaux sur le Blvd du 30 Juin" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Type de message</label>
              <Select 
                value={formData.type} 
                onValueChange={(v: any) => setFormData({...formData, type: v})}
              >
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_alert">Alerte Système / IA</SelectItem>
                  <SelectItem value="traffic_report">Info Trafic</SelectItem>
                  <SelectItem value="user_joined">Annonce Communauté</SelectItem>
                  <SelectItem value="video_added">Nouvelle Vidéo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Message</label>
              <Textarea 
                placeholder="Décrivez l'événement..." 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="min-h-[120px] rounded-xl border-2 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Lien optionnel (URL ou Page)</label>
              <Input 
                placeholder="Ex: /reports ou https://..." 
                value={formData.link}
                onChange={e => setFormData({...formData, link: e.target.value})}
                className="h-12 rounded-xl border-2"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Diffuser l'alerte
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
