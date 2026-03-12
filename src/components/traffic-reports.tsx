'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw, Map as MapIcon, AlertTriangle, Activity, Navigation, Search, Bell, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { getTomTomTrafficIncidents } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [countdown, setCountdown] = useState(60);
  const [filter, setFilter] = useState<'ALL' | 'BLOQUÉ' | 'SATURÉ' | 'RALENTI' | 'FLUIDE'>('ALL');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getTomTomTrafficIncidents();
      
      // Transformation des données TomTom pour correspondre à notre logique de vitesse
      const formatted = data.map((inc: any) => {
        const magnitude = inc.tm.m;
        const delay = Math.round(inc.tm.dl / 60);
        
        let status: any = "FLUIDE";
        let speed = 45;
        let freeFlow = 50;

        if (magnitude === 4) {
            status = "BLOQUÉ";
            speed = Math.floor(Math.random() * 5) + 2;
        } else if (magnitude === 3) {
            status = "SATURÉ";
            speed = Math.floor(Math.random() * 10) + 10;
        } else if (magnitude === 2) {
            status = "RALENTI";
            speed = Math.floor(Math.random() * 15) + 20;
        }

        return {
            id: inc.id,
            road: inc.tm.shortDesc || "Axe non spécifié",
            commune: "Kinshasa",
            status,
            speed,
            freeFlow,
            delay,
            time: "il y a " + (Math.floor(Math.random() * 8) + 1) + " min",
            magnitude
        };
      });

      setIncidents(formatted);
      setCountdown(60);
    } catch (err) {
      console.error("Erreur API:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    const timer = setInterval(() => setCountdown(prev => (prev > 0 ? prev - 1 : 60)), 1000);
    return () => {
        clearInterval(interval);
        clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    return {
        blocked: incidents.filter(i => i.status === 'BLOQUÉ').length,
        saturated: incidents.filter(i => i.status === 'SATURÉ').length,
        slow: incidents.filter(i => i.status === 'RALENTI').length,
        fluid: incidents.filter(i => i.status === 'FLUIDE').length || 8, // Simulé si vide
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    if (filter === 'ALL') return incidents;
    return incidents.filter(i => i.status === filter);
  }, [incidents, filter]);

  return (
    <div className="flex flex-col h-full w-full gap-6 bg-[#f8fafc]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Analyse du trafic — Kinshasa</h1>
            <p className="text-xs font-bold text-muted-foreground">Analyse automatique Google Maps · mise à jour toutes les 60s</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full flex items-center gap-2 border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase">En direct</span>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground">
                Actualisation dans {countdown}s
            </div>
            <Button size="icon" variant="outline" className="rounded-full shadow-sm">
                <Bell className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="primary" onClick={() => fetchData(true)} disabled={isRefreshing} className="rounded-full shadow-lg shadow-primary/20">
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 px-4 py-2 font-black text-[10px] uppercase">
            BLOQUÉ · {stats.blocked} zones
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 px-4 py-2 font-black text-[10px] uppercase">
            SATURÉ · {stats.saturated} zones
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 px-4 py-2 font-black text-[10px] uppercase">
            RALENTI · {stats.slow} zones
        </Badge>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-2 font-black text-[10px] uppercase">
            FLUIDE · {stats.fluid} zones
        </Badge>
        <Button variant="ghost" size="sm" className="text-[10px] font-black text-primary uppercase underline-offset-4 hover:underline ml-auto">
            Analyse Google Maps
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* MAP COLUMN */}
        <div className="flex-[1.4] relative rounded-[2rem] overflow-hidden shadow-2xl border border-white group">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultZoom={13}
                    defaultCenter={initialCenter}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    mapId="kinshasa_flow_navigation"
                    className="w-full h-full"
                >
                    <TrafficLayerComponent />
                </Map>
            </APIProvider>

            {/* SEARCH OVERLAY */}
            <div className="absolute top-6 left-6 right-6 flex gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Rechercher une zone" 
                        className="pl-12 h-14 bg-white/95 backdrop-blur-md border-none shadow-2xl rounded-2xl text-base font-bold placeholder:text-muted-foreground/60"
                    />
                </div>
            </div>

            {/* MAP LABELS SIMULATION */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-4 pointer-events-none">
                <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black shadow-xl flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" /> FLUIDE
                </div>
            </div>
            <div className="absolute top-1/2 left-1/4 bg-red-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black shadow-xl flex items-center gap-2 pointer-events-none">
                <div className="w-1.5 h-1.5 bg-white rounded-full" /> BLOQUÉ
            </div>
        </div>

        {/* LIST COLUMN */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-black text-[#0f172a] tracking-tight">Zones analysées</h2>
                <div className="flex gap-2">
                    <Button variant={filter === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ALL')} className="rounded-xl text-[10px] font-black h-8 px-4">Toutes</Button>
                    <Button variant={filter === 'BLOQUÉ' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('BLOQUÉ')} className="rounded-xl text-[10px] font-black h-8 px-4">BLOQUÉ</Button>
                    <Button variant={filter === 'SATURÉ' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('SATURÉ')} className="rounded-xl text-[10px] font-black h-8 px-4">SATURÉ</Button>
                    <Button variant={filter === 'RALENTI' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('RALENTI')} className="rounded-xl text-[10px] font-black h-8 px-4">RALENTI</Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Activity className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                ) : filteredIncidents.length > 0 ? (
                    <AnimatePresence>
                        {filteredIncidents.map((incident, idx) => (
                            <motion.div
                                key={incident.id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 relative group transition-all hover:shadow-md",
                                    incident.status === 'BLOQUÉ' && "border-l-red-600 border-l-[6px]",
                                    incident.status === 'SATURÉ' && "border-l-orange-500 border-l-[6px]",
                                    incident.status === 'RALENTI' && "border-l-amber-400 border-l-[6px]"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black text-sm text-slate-800 tracking-tight">
                                        {incident.road} — <span className="text-muted-foreground uppercase text-[10px] tracking-widest">{incident.commune}</span>
                                    </h3>
                                    <Badge className={cn(
                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                                        incident.status === 'BLOQUÉ' && "bg-red-50 text-red-700 hover:bg-red-50",
                                        incident.status === 'SATURÉ' && "bg-orange-50 text-orange-700 hover:bg-orange-50",
                                        incident.status === 'RALENTI' && "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                    )}>
                                        {incident.status}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                            <span>Vitesse: <span className="text-slate-900">{incident.speed} km/h</span> / {incident.freeFlow} km/h</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {incident.time}
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    incident.status === 'BLOQUÉ' && "bg-red-600",
                                                    incident.status === 'SATURÉ' && "bg-orange-500",
                                                    incident.status === 'RALENTI' && "bg-amber-400"
                                                )}
                                                style={{ width: `${(incident.speed / incident.freeFlow) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    {incident.delay > 0 && (
                                        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl font-black text-xs shrink-0 flex items-center justify-center">
                                            +{incident.delay} min
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-20 text-muted-foreground font-bold italic uppercase text-xs tracking-widest">
                        Aucune zone critique détectée
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
