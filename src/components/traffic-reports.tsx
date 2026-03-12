'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Lightbulb, Loader2, RefreshCw, Map as MapIcon, AlertTriangle, Activity, CheckCircle2, Navigation } from 'lucide-react';
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
      
      // On récupère tous les incidents significatifs (Magnitude >= 2)
      // Magnitude 4 = BLOQUÉ
      // Magnitude 3 = SATURÉ
      // Magnitude 2 = RALENTI
      const filtered = data.filter((inc: any) => inc.tm.m >= 2);
      
      // Trier par magnitude (le plus grave en premier)
      const sorted = filtered.sort((a: any, b: any) => b.tm.m - a.tm.m);

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
    
    let statusText = "RALENTI";
    if (incident.tm.m === 4) statusText = "BLOQUÉ";
    else if (incident.tm.m === 3) statusText = "SATURÉ";

    try {
        const result = await getTrafficTipsAction({
            location: incident.tm.shortDesc,
            description: `Trafic ${statusText} détecté. Magnitude de navigation: ${incident.tm.m}. Retard estimé : ${Math.round(incident.tm.dl / 60)} minutes.`,
        });
        setTips(result.tips);
    } catch (error) {
        setTips(["K-Flow Assistant : Nous vous conseillons d'emprunter les axes parallèles pour contourner ce bouchon."]);
    } finally {
        setIsTipsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const blocked = incidents.filter(i => i.tm.m === 4).length;
    const saturated = incidents.filter(i => i.tm.m === 3).length;
    const slowed = incidents.filter(i => i.tm.m === 2).length;
    const totalDelay = incidents.reduce((acc, curr) => acc + curr.tm.dl, 0);
    const avgDelay = incidents.length > 0 ? Math.round(totalDelay / incidents.length / 60) : 0;
    return { blocked, saturated, slowed, avgDelay };
  }, [incidents]);

  // On affiche dans la liste uniquement SATURÉ et BLOQUÉ (Magnitude >= 3)
  const criticalIncidents = incidents.filter(i => i.tm.m >= 3);

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Synthèse du Flux Kinshasa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-destructive/10 border-destructive/20 shadow-sm">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black flex items-center gap-2 text-destructive uppercase tracking-widest">
                    <AlertTriangle className="h-4 w-4" /> Bloqué
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black">{stats.blocked}</div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Arrêt total (Mag 4)</p>
            </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/20 shadow-sm">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black flex items-center gap-2 text-accent-foreground uppercase tracking-widest">
                    <Navigation className="h-4 w-4" /> Saturé
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black">{stats.saturated}</div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Fortement ralenti (Mag 3)</p>
            </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20 shadow-sm">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black flex items-center gap-2 text-primary uppercase tracking-widest">
                    <Activity className="h-4 w-4" /> Ralenti
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black">{stats.slowed}</div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Flux dégradé (Mag 2)</p>
            </CardContent>
        </Card>
        <Card className="bg-muted/50 border-border/50 shadow-sm">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                    <Clock className="h-4 w-4" /> Retard Moyen
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black">{stats.avgDelay} min</div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Analyse globale</p>
            </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Vue Carte Navigation */}
        <Card className="flex-[1.5] overflow-hidden relative shadow-2xl border-none group">
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
            
            {/* Légende de Navigation */}
            <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-primary/10 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 bg-red-800 rounded-full animate-pulse shadow-[0_0_10px_rgba(153,27,27,0.5)]" /> 
                    <span className="text-[10px] font-black uppercase tracking-tight">BLOQUÉ (&lt;10%)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]" /> 
                    <span className="text-[10px] font-black uppercase tracking-tight">SATURÉ (10-40%)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 bg-orange-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.3)]" /> 
                    <span className="text-[10px] font-black uppercase tracking-tight">RALENTI (40-70%)</span>
                </div>
            </div>

            {/* Badge Scan en direct */}
            <div className="absolute bottom-4 left-4 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2 shadow-2xl backdrop-blur-sm">
                <Activity className="h-3 w-3 animate-pulse" />
                K-FLOW AI : SCAN KINSHASA ACTIF
            </div>
        </Card>

        {/* Liste des Points de Friction (Saturé & Bloqué uniquement) */}
        <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-2xl bg-card">
          <CardHeader className="border-b bg-muted/20 backdrop-blur-sm sticky top-0 z-10 p-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-xl font-black tracking-tighter italic">
                    <MapIcon className="text-primary h-6 w-6" />
                    POINTS CRITIQUES
                </div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Filtrage Navigation Active</span>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 hover:bg-primary/10 text-primary" onClick={() => fetchData(true)} disabled={isRefreshing}>
                <RefreshCw className={isRefreshing ? "animate-spin h-5 w-5" : "h-5 w-5"} />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
            {loading && !isRefreshing ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 py-20">
                    <div className="relative">
                        <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                        <Activity className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-foreground">Interrogation Navigation...</p>
                        <p className="text-[10px] font-bold text-muted-foreground">Synchronisation satellites TomTom</p>
                    </div>
                </div>
            ) : criticalIncidents.length > 0 ? (
              <AnimatePresence>
                {criticalIncidents.map((incident, idx) => (
                  <motion.div
                    key={incident.id || idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-5 rounded-[1.5rem] border-l-8 bg-card shadow-xl border border-transparent transition-all hover:translate-x-1 group/card ${
                        incident.tm.m === 4 ? 'border-l-red-800' : 'border-l-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                        <Badge className={`font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest ${
                            incident.tm.m === 4 ? 'bg-red-800' : 'bg-red-500'
                        }`}>
                            {incident.tm.m === 4 ? "🛑 BLOQUÉ" : "⚠️ SATURÉ"}
                        </Badge>
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-foreground flex items-center gap-1">
                                <Clock className="h-4 w-4 text-primary" /> +{Math.round(incident.tm.dl / 60)} MIN
                            </span>
                            <span className="text-[8px] font-black text-muted-foreground uppercase">Impact réel</span>
                        </div>
                    </div>
                    
                    <h3 className="font-black text-base leading-tight mb-4 uppercase tracking-tighter group-hover/card:text-primary transition-colors">
                        {incident.tm.shortDesc || "Point de congestion majeur"}
                    </h3>

                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full h-10 text-[10px] font-black uppercase tracking-widest gap-2 rounded-2xl bg-muted/50 border hover:bg-primary hover:text-white transition-all shadow-sm" 
                        onClick={() => handleGetTips(incident)}
                    >
                        <Lightbulb className="h-4 w-4 text-accent group-hover/card:text-white animate-bounce" /> 
                        Assistant IA : Comment éviter ?
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 py-20">
                    <div className="bg-success/10 p-8 rounded-full mb-6">
                        <CheckCircle2 className="w-16 h-16 text-success" />
                    </div>
                    <p className="font-black text-lg uppercase tracking-tighter text-foreground">Aucun Point Critique</p>
                    <p className="text-xs font-bold text-muted-foreground max-w-[240px] mx-auto leading-relaxed mt-2 uppercase">
                        La navigation ne détecte aucun blocage majeur sur les artères principales. Bonne route !
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Boîte de dialogue Étude Assistant IA */}
      <AlertDialog open={showTipsDialog} onOpenChange={setShowTipsDialog}>
          <AlertDialogContent className="max-w-md rounded-[2.5rem] border-primary/20 shadow-3xl overflow-hidden p-0">
              <div className="bg-primary p-8 text-white relative">
                  <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-4 font-black text-3xl tracking-tighter uppercase italic">
                          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <Lightbulb className="text-accent h-8 w-8" />
                          </div>
                          K-FLOW CO-PILOTE
                      </AlertDialogTitle>
                      <p className="text-[10px] font-black text-white/80 uppercase tracking-widest pt-2">Analyse d'évitement en temps réel</p>
                  </AlertDialogHeader>
              </div>

              <div className="p-8">
                <div className="min-h-[180px]">
                    {isTipsLoading ? (
                        <div className="flex flex-col items-center justify-center p-10 gap-8">
                            <div className="relative">
                                <Loader2 className="h-20 w-16 animate-spin text-primary" />
                                <Activity className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-black uppercase tracking-widest animate-pulse">Étude du quartier...</p>
                                <p className="text-[10px] font-bold text-muted-foreground italic">Calcul des itinéraires bis via rues adjacentes</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2 border-b border-muted pb-4">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Secteur Analysé</span>
                                <p className="text-lg font-black text-foreground uppercase leading-none tracking-tight">{selectedIncident?.tm.shortDesc}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recommandations K-Flow</span>
                                <ul className="space-y-4">
                                    {tips.map((tip, index) => (
                                        <motion.li 
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex gap-5 items-start bg-muted/30 p-5 rounded-[1.5rem] border border-transparent hover:border-primary/20 transition-all shadow-sm"
                                        >
                                            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shrink-0 shadow-lg">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm font-bold leading-relaxed text-foreground/90 italic">"{tip}"</p>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
              </div>

              <AlertDialogFooter className="p-8 bg-muted/20 border-t border-border/50">
                  <AlertDialogAction className="rounded-2xl h-14 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 w-full">
                      C'est noté, j'adapte ma route !
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
