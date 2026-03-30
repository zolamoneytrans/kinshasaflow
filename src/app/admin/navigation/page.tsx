
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from "@/components/app-shell";
import { useUser, useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { AppNavigationSettings, NavFeature, navFeatures } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, LayoutGrid, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<AppNavigationSettings | null>(null);

  const isAdmin = user?.email === 'drnduwa@gmail.com';

  const settingsRef = useMemoFirebase(() => doc(firestore, 'app_settings', 'navigation'), [firestore]);
  const { data: serverSettings, isLoading } = useDoc<AppNavigationSettings>(settingsRef);

  useEffect(() => {
    if (serverSettings) {
      setLocalSettings(serverSettings);
    } else if (!isLoading) {
      // Initialize default settings if doc doesn't exist
      const defaults = navFeatures.reduce((acc, feat) => ({ ...acc, [feat]: true }), {} as AppNavigationSettings);
      setLocalSettings(defaults);
    }
  }, [serverSettings, isLoading]);

  const handleToggle = (feature: NavFeature) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      [feature]: !localSettings[feature]
    });
  };

  const handleSave = async () => {
    if (!isAdmin || !localSettings) return;
    setIsSaving(true);
    try {
      await setDoc(settingsRef, localSettings);
      toast({ title: "Configuration enregistrée", description: "Le dashboard utilisateur a été mis à jour." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
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
              <p className="text-muted-foreground font-medium">Contrôlez la visibilité des boutons pour tous les utilisateurs.</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || isLoading} 
              className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Enregistrer les changements
            </Button>
          </div>

          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-white border-b border-slate-100 p-8">
              <CardTitle className="text-xl">Liste des fonctionnalités</CardTitle>
              <CardDescription>Désactivez les modules en cours de maintenance ou obsolètes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading || !localSettings ? (
                <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
              ) : (
                <div className="grid md:grid-cols-2">
                  {navFeatures.map((feat) => (
                    <div 
                      key={feat} 
                      className="flex items-center justify-between p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <Label htmlFor={`switch-${feat}`} className="text-base font-bold cursor-pointer">
                          {FEATURE_LABELS[feat]}
                        </Label>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">ID: {feat}</p>
                      </div>
                      <Switch 
                        id={`switch-${feat}`} 
                        checked={localSettings[feat]} 
                        onCheckedChange={() => handleToggle(feat)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
            <RefreshCw className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">Synchronisation Instantanée</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                Les changements prennent effet immédiatement sur les sessions des utilisateurs actifs. Aucune maintenance nécessaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
