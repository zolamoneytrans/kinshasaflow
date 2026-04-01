
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from "@/components/app-shell";
import { useUser, useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { AppNavigationSettings, NavFeature, navFeatures } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, LayoutGrid, CloudCheck, CloudUpload, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const FEATURE_LABELS: Record<NavFeature, string> = {
  reports: "Rapports de trafic",
  liveTraffic: "Temps Réel",
  map: "Carte du Trafic",
  assistant: "Assistant IA",
  myStars: "Mes Stars",
  report: "Signaler un incident",
  police: "Police Routière",
  routes: "État des Routes",
  announcements: "Annonces Officielles",
  logement: "Logement (RBNB)",
  transport: "Solutions de Transport",
  carRental: "Location de Véhicules",
  tourism: "Tourisme & Découverte",
  events: "Événements Communautaires",
  videos: "Vidéos Feed",
  kinshasa: "Statistiques Kinshasa",
  contact: "Contactez-nous",
  share: "Bouton Partager",
};

export default function AdminNavigationPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const isAdmin = user?.email === 'drnduwa@gmail.com';

  const settingsRef = useMemoFirebase(() => doc(firestore, 'app_settings', 'navigation'), [firestore]);
  const { data: serverSettings, isLoading } = useDoc<AppNavigationSettings>(settingsRef);

  // Sauvegarde automatique lors d'un changement
  const handleToggle = async (feature: NavFeature) => {
    if (!isAdmin || !serverSettings) return;

    const updatedSettings = {
      ...serverSettings,
      [feature]: !serverSettings[feature]
    };

    setSaveStatus('saving');
    try {
      await setDoc(settingsRef, updatedSettings);
      setSaveStatus('saved');
      // On revient à l'état idle après 2 secondes
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e: any) {
      setSaveStatus('error');
      toast({ 
        title: "Erreur de synchronisation", 
        description: "Impossible de mettre à jour le dashboard.", 
        variant: "destructive" 
      });
    }
  };

  if (!isAdmin) return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-black">Accès Réservé</h1>
        <p className="text-muted-foreground">Seul l'administrateur système peut piloter l'interface.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/50">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <LayoutGrid className="text-primary h-8 w-8" />
                Pilotage du Dashboard
              </h1>
              <p className="text-muted-foreground font-medium italic">Activez ou désactivez les boutons en temps réel pour tous les utilisateurs.</p>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 min-w-[180px] justify-center">
              <AnimatePresence mode="wait">
                {saveStatus === 'saving' && (
                  <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </motion.div>
                )}
                {saveStatus === 'saved' && (
                  <motion.div key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                    <CloudCheck className="h-4 w-4" />
                    Synchronisé
                  </motion.div>
                )}
                {(saveStatus === 'idle' || saveStatus === 'error') && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <CloudUpload className="h-4 w-4" />
                    Auto-save actif
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-white border-b border-slate-100 p-8">
              <CardTitle className="text-xl">État des fonctionnalités</CardTitle>
              <CardDescription>Les changements sont appliqués instantanément sur le dashboard des utilisateurs.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading || !serverSettings ? (
                <div className="p-20 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin h-10 w-10 text-primary" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Récupération de la config...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2">
                  {navFeatures.map((feat) => (
                    <div 
                      key={feat} 
                      className="flex items-center justify-between p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="space-y-0.5">
                        <Label htmlFor={`switch-${feat}`} className="text-base font-bold cursor-pointer group-hover:text-primary transition-colors">
                          {FEATURE_LABELS[feat]}
                        </Label>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-50">API_ID: {feat}</p>
                      </div>
                      <Switch 
                        id={`switch-${feat}`} 
                        checked={serverSettings[feat] !== false} 
                        onCheckedChange={() => handleToggle(feat)}
                        disabled={saveStatus === 'saving'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4 shadow-inner">
            <Info className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-bold text-blue-900">Comment ça marche ?</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Chaque interrupteur ci-dessus contrôle la visibilité du bouton correspondant dans le menu latéral. Si vous décochez "Assistant IA", le bouton disparaîtra immédiatement de l'écran de tous vos utilisateurs actifs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
