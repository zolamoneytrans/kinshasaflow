'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Frown, Lightbulb, Loader2, RefreshCw, Map as MapIcon, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { getTomTomTrafficIncidents, getTrafficTipsAction } from '@/app/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';

const GOOGLE_MAPS_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";
const initialCenter = { lat: -4.330, lng: 15.313 }; // Rond-point Victoire

const TrafficLayerComponent = () => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const g = (window as any).google;
        if (!g) return;
        const trafficLayer = new g.maps.TrafficLayer();
        trafficLayer.setMap(map);
        return () => trafficLayer.setMap(null);
    }, [map]);
    return null;
};

export default function TrafficReports() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [isTipsLoading, setIsTipsLoading] = useState(false);
  const [showTipsDialog, setShowTipsDialog] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getTomTomTrafficIncidents();
      // Filtrer : Magnitude 2 (Saturé), 3 (Majeur), 4 (Bloqué)
      // On ignore Magnitude 1 (Fluide/Mineur) pour ne garder que le "bad traffic"
      const filtered = data.filter((inc: any) => inc.tm.m >= 2);
      
      // Trier par magnitude (le plus grave en premier) puis par délai
      const sorted = filtered.sort((a: any, b: any) => {
          if (b.tm.m !== a.tm.m) return b.tm.m - a.tm.m;
          return b.tm.dl - a.tm.dl;
      });

      setIncidents(sorted);
    } catch (err) {
      console.error("Erreur lors de la récupération des incidents:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 120000); // Rafraîchir toutes les 2 minutes
    return () => clearInterval(interval);
  }, []);

  const handleGetTips = async (incident: any) => {
    setSelectedIncident(incident);
    setShowTipsDialog(true);
    setIsTipsLoading(true);
    setTips([]);
    try {
        const result = await getTrafficTipsAction({
            location: incident.tm.shortDesc,
            description: `Trafic ${incident.tm.m === 4 ? 'Bloqué' : 'Saturé'} détecté. Retard estimé : ${Math.round(incident.tm.dl / 60)} minutes.`,
        });
        setTips(result.tips);
    } catch (error) {
        setTips(["Étude IA : Nous vous conseillons d'emprunter les avenues parallèles les plus proches pour contourner cet axe."]);
    } finally {
        setIsTipsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const blocked = incidents.filter(i => i.tm.m >= 3).length;
    const saturated = incidents.filter(i => i.tm.m === 2).length;
    const totalDelay = incidents.reduce((acc, curr) => acc + curr.tm.dl, 0);
    const avgDelay = incidents.length > 0 ? Math.round(totalDelay / incidents.length / 60) : 0;
    return { blocked, saturated, avgDelay };
  }, [incidents]);

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Dashboard de synthèse Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-destructive/10 border-destructive/20 shadow-sm">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black flex items-center gap-2 text-destructive uppercase tracking-widest">
                    <AlertTriangle className="h-4 w-4" /> Axes Bloqués
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black">{stats.blocked}</div>
                <p className="text-[10px] text-muted-foreground font-medium">Magnitude 3 & 4 (Rouge foncé)</p>
            </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/20 shadow-sm">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black flex items-center gap-2 text-accent-foreground uppercase tracking-widest">
                    <Activity className="h-4 w-4" /> Zones Saturées
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black">{stats.saturated}</div>
                <p className="text-[10px] text-muted-foreground font-medium">Magnitude 2 (Rouge/Orange)</p>
            </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20 shadow-sm">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black flex items-center gap-2 text-primary uppercase tracking-widest">
                    <Clock className="h-4 w-4" /> Retard Moyen
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black">{stats.avgDelay} min</div>
                <p className="text-[10px] text-muted-foreground font-medium">Basé sur {incidents.length} points analysés</p>
            </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Vue Carte Haute Précision */}
        <Card className="flex-[1.5] overflow-hidden relative shadow-xl border-none group">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultZoom={13}
                    defaultCenter={initialCenter}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    mapId="reports_traffic_map"
                    className="w-full h-full"
                >
                    <TrafficLayerComponent />
                </Map>
            </APIProvider>
            
            {/* Légende Interactive */}
            <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-primary/20 flex flex-col gap-2 transition-transform group-hover:scale-105">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-700 rounded-full animate-pulse" /> 
                    <span className="text-[10px] font-black uppercase">Bloqué (Immobile)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" /> 
                    <span className="text-[10px] font-black uppercase">Saturé (Pas de tortue)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full" /> 
                    <span className="text-[10px] font-black uppercase">Ralenti (Modéré)</span>
                </div>
            </div>

            {/* Badge IA d'étude */}
            <div className="absolute bottom-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <Activity className="h-3 w-3 animate-pulse" />
                Étude du flux en direct...
            </div>
        </Card>

        {/* Liste des Rapports de Navigation */}
        <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-xl bg-card">
          <CardHeader className="border-b bg-muted/30 backdrop-blur-sm sticky top-0 z-10 p-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-lg font-black tracking-tighter">
                    <MapIcon className="text-primary h-5 w-5" />
                    POINTS CRITIQUES
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Analyse TomTom Realtime</span>
              </div>
              <Button size="icon" variant="outline" className="rounded-full h-9 w-9" onClick={() => fetchData(true)} disabled={isRefreshing}>
                <RefreshCw className={isRefreshing ? "animate-spin h-4 w-4" : "h-4 w-4"} />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
            {loading && !isRefreshing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground py-20">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                        <Activity className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-foreground">Scan de Kinshasa...</p>
                        <p className="text-[10px] font-medium">Interrogation des satellites de navigation</p>
                    </div>
                </div>
            ) : incidents.length > 0 ? (
              <AnimatePresence>
                {incidents.map((incident, idx) => (
                  <motion.div
                    key={incident.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-2xl border-l-4 bg-card shadow-sm border transition-all hover:shadow-md group/card ${
                        incident.tm.m >= 3 ? 'border-l-destructive bg-destructive/5' : 'border-l-accent bg-accent/5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                        <Badge variant={incident.tm.m >= 3 ? "destructive" : "default"} className="font-black text-[9px] px-2 py-0.5 rounded-full">
                            {incident.tm.m >= 3 ? "🛑 BLOQUÉ" : "⚠️ SATURÉ"}
                        </Badge>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> +{Math.round(incident.tm.dl / 60)} MIN
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Retard réel</span>
                        </div>
                    </div>
                    
                    <h3 className="font-black text-sm leading-tight mb-3 uppercase tracking-tight group-hover/card:text-primary transition-colors">
                        {incident.tm.shortDesc || "Incident de circulation"}
                    </h3>

                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full h-9 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl bg-background border hover:bg-primary hover:text-white transition-all shadow-sm" 
                        onClick={() => handleGetTips(incident)}
                    >
                        <Lightbulb className="h-3.5 w-3.5 text-accent group-hover/card:text-white" /> 
                        Co-Pilote : Éviter ce bouchon
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8 py-20">
                    <div className="bg-success/10 p-6 rounded-full mb-4">
                        <CheckCircle2 className="w-12 h-12 text-success" />
                    </div>
                    <p className="font-black text-sm uppercase text-foreground">Ville fluide</p>
                    <p className="text-[10px] max-w-[200px] mx-auto leading-relaxed">
                        L'IA n'a détecté aucun blocage majeur sur les artères principales pour le moment.
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Boîte de dialogue Étude IA (Conseils) */}
      <AlertDialog open={showTipsDialog} onOpenChange={setShowTipsDialog}>
          <AlertDialogContent className="max-w-md rounded-[2rem] border-primary/20 shadow-2xl overflow-hidden p-0">
              <div className="bg-primary p-6 text-white relative">
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-3 font-black text-2xl tracking-tighter uppercase italic">
                          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Lightbulb className="text-accent h-6 w-6" />
                          </div>
                          CO-PILOTE K-FLOW
                      </AlertDialogTitle>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest pt-1">Étude d'itinéraire bis via Intelligence Artificielle</p>
                  </AlertDialogHeader>
              </div>

              <div className="p-6">
                <div className="min-h-[150px] text-sm">
                    {isTipsLoading ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-6">
                            <div className="relative">
                                <Loader2 className="h-16 w-12 animate-spin text-primary" />
                                <Activity className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black uppercase tracking-widest animate-pulse">Calcul d'évitement...</p>
                                <p className="text-[9px] text-muted-foreground italic">Etude des rues adjacentes en cours</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex flex-col gap-1 border-b pb-3">
                                <span className="text-[9px] font-black text-primary uppercase">Zone ciblée</span>
                                <p className="text-sm font-black text-foreground uppercase leading-tight">{selectedIncident?.tm.shortDesc}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <span className="text-[9px] font-black text-muted-foreground uppercase">Recommandations de l'Assistant</span>
                                <ul className="space-y-3">
                                    {tips.map((tip, index) => (
                                        <motion.li 
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex gap-4 items-start bg-muted/40 p-4 rounded-2xl border border-transparent hover:border-primary/20 transition-colors"
                                        >
                                            <div className="h-6 w-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black shrink-0 shadow-md">
                                                {index + 1}
                                            </div>
                                            <p className="text-xs font-semibold leading-relaxed text-foreground/80">{tip}</p>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
              </div>

              <AlertDialogFooter className="p-6 bg-muted/30 border-t">
                  <AlertDialogAction className="rounded-2xl h-12 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 w-full md:w-auto">
                      Compris, j'évite !
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
