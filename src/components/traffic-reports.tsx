'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrafficReport, dummyReports } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, Clock, Frown, Lightbulb, Loader2, RefreshCw, Map as MapIcon, AlertTriangle, ThermometerSnowflake, Activity } from 'lucide-react';
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

// --- Composant interne pour la couche de trafic Google ---
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

type TomTomIncident = {
    id: string;
    poi?: { name: string };
    tm: {
        shortDesc: string;
        dl: number; // delay in seconds
        m: number; // magnitude
    };
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
    setLoading(true);
    try {
      const data = await getTomTomTrafficIncidents();
      // Filtrer pour ne garder que Magnitude 3 (Saturé) et 4 (Bloqué)
      // m: 1 (inconnu/mineur), 2 (modéré), 3 (majeur), 4 (bloqué)
      const filtered = data.filter((inc: any) => inc.tm.m >= 3);
      setIncidents(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 300000); // 5 minutes
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
            description: `Embouteillage majeur détecté. Magnitude: ${incident.tm.m}, Retard: ${Math.round(incident.tm.dl / 60)} min.`,
        });
        setTips(result.tips);
    } catch (error) {
        setTips(["Conseil IA : Privilégiez les routes secondaires parallèles à cet axe."]);
    } finally {
        setIsTipsLoading(false);
    }
  };

  // Calcul des statistiques pour le dashboard
  const stats = useMemo(() => {
    const blockedCount = incidents.filter(i => i.tm.m === 4).length;
    const saturatedCount = incidents.filter(i => i.tm.m === 3).length;
    const avgDelay = incidents.length > 0 
        ? Math.round(incidents.reduce((acc, curr) => acc + curr.tm.dl, 0) / incidents.length / 60)
        : 0;
    return { blockedCount, saturatedCount, avgDelay };
  }, [incidents]);

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Dashboard de synthèse AI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" /> RUES BLOQUÉES
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black">{stats.blockedCount}</div>
            </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/20">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-accent-foreground">
                    <Activity className="h-4 w-4" /> RUES SATURÉES
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black">{stats.saturatedCount}</div>
            </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" /> RETARD MOYEN
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black">{stats.avgDelay} min</div>
            </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Section Carte */}
        <Card className="flex-[1.5] overflow-hidden relative shadow-xl border-none">
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
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md p-2 rounded-lg shadow-lg border flex items-center gap-2">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-full" /> <span className="text-[10px] font-bold">BLOQUÉ</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-full" /> <span className="text-[10px] font-bold">SATURÉ</span></div>
            </div>
        </Card>

        {/* Section Liste */}
        <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-xl">
          <CardHeader className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-black tracking-tighter">
                <MapIcon className="text-primary" />
                POINTS CHAUDS
              </div>
              <Button size="icon" variant="ghost" onClick={() => fetchData(true)} disabled={isRefreshing}>
                <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && !isRefreshing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-widest">Analyse du trafic en cours...</p>
                </div>
            ) : incidents.length > 0 ? (
              <AnimatePresence>
                {incidents.map((incident) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border-l-4 bg-card shadow-sm border transition-all hover:shadow-md ${
                        incident.tm.m === 4 ? 'border-l-destructive' : 'border-l-accent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant={incident.tm.m === 4 ? "destructive" : "default"} className="font-black">
                            {incident.tm.m === 4 ? "BLOQUÉ" : "SATURÉ"}
                        </Badge>
                        <span className="text-[10px] font-black text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {Math.round(incident.tm.dl / 60)} MIN RETARD
                        </span>
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-2 uppercase tracking-tight">{incident.tm.shortDesc}</h3>
                    <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest gap-2" onClick={() => handleGetTips(incident)}>
                        <Lightbulb className="h-3 w-3 text-accent" /> Éviter ce bouchon
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                    <Frown className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-black text-xs uppercase">Aucun blocage majeur</p>
                    <p className="text-[10px]">La circulation semble fluide sur les grands axes.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showTipsDialog} onOpenChange={setShowTipsDialog}>
          <AlertDialogContent className="max-w-md rounded-2xl">
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 font-black text-xl tracking-tighter uppercase">
                      <Lightbulb className="text-accent" />
                      CO-PILOTE K-FLOW
                  </AlertDialogTitle>
                  <div className="min-h-[100px] text-sm pt-4">
                    {isTipsLoading ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-[10px] font-bold uppercase animate-pulse">Calcul d'itinéraire bis...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase border-b pb-2">{selectedIncident?.tm.shortDesc}</p>
                            <ul className="space-y-3">
                                {tips.map((tip, index) => (
                                    <li key={index} className="flex gap-3 items-start bg-muted/50 p-3 rounded-lg border">
                                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</div>
                                        <p className="text-xs font-medium leading-relaxed">{tip}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction className="rounded-xl font-bold uppercase tracking-widest">C'est noté</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
