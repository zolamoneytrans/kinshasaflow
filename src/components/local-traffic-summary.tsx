
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  Marker,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { 
  Radar, 
  LocateFixed, 
  Navigation, 
  Star, 
  Loader2, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Zap,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { STAR_COSTS, UserProfile } from '@/lib/types';
import { generateSpeechAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const GOOGLE_MAPS_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

interface TrafficProbe {
  road: string;
  status: 'FLUIDE' | 'MODÉRÉ' | 'DENSE' | 'EMBOUTEILLAGE';
  delay: number;
  distance: string;
  coords: { lat: number, lng: number };
}

interface LocalAnalysis {
  globalScore: number;
  probes: TrafficProbe[];
  bestRoute: string;
  trend: 'better' | 'worse' | 'stable';
  lastUpdated: Date;
}

const TrafficLayerComponent = () => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const g = (window as any).google;
        if (!g) return;
        const layer = new g.maps.TrafficLayer();
        layer.setMap(map);
        return () => layer.setMap(null);
    }, [map]);
    return null;
};

export default function LocalTrafficSummary() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radius, setRadius] = useState<number>(1);
  const [analysis, setAnalysis] = useState<LocalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [mapZoom, setZoom] = useState(15);
  
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const mapRef = useRef<any>(null);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  // GPS Tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => toast({ title: "GPS désactivé", description: "Veuillez activer la localisation.", variant: "destructive" }),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [toast]);

  const handleStartAnalysis = useCallback(async (silent = false) => {
    if (!location || !user) return;
    if (!silent) setIsAnalyzing(true);

    try {
      const g = (window as any).google;
      if (!g) throw new Error("API non prête.");

      // On simule une analyse premium des segments via Route Service
      // Dans une version finale, on appellerait une API de proximité
      const roads = [
        "Avenue de proximité 1",
        "Boulevard principal",
        "Rue transversale",
        "Route nationale d'accès"
      ];

      const probes: TrafficProbe[] = roads.map((r, i) => {
          const statuses: ('FLUIDE' | 'MODÉRÉ' | 'DENSE' | 'EMBOUTEILLAGE')[] = ['FLUIDE', 'MODÉRÉ', 'DENSE', 'EMBOUTEILLAGE'];
          const rand = Math.floor(Math.random() * 4);
          return {
              road: r,
              status: statuses[rand],
              delay: rand * 3,
              distance: `${(Math.random() * radius).toFixed(1)} km`,
              coords: { lat: location.lat + (Math.random() - 0.5) * 0.01, lng: location.lng + (Math.random() - 0.5) * 0.01 }
          };
      });

      const avgDelay = probes.reduce((acc, p) => acc + p.delay, 0) / probes.length;
      const score = Math.max(0, 100 - (avgDelay * 10));

      const newAnalysis: LocalAnalysis = {
          globalScore: Math.round(score),
          probes: probes.sort((a, b) => a.delay - b.delay),
          bestRoute: probes[0].road,
          trend: score > 70 ? 'better' : 'worse',
          lastUpdated: new Date()
      };

      setAnalysis(newAnalysis);

      if (isAudioEnabled && !silent) {
        const text = `Analyse locale terminée. Trafic ${newAnalysis.globalScore > 70 ? 'fluide' : 'dense'} dans votre zone. L'axe ${newAnalysis.bestRoute} est le plus dégagé.`;
        generateSpeechAction(text).then(res => {
            if (res?.media) new Audio(res.media).play();
        });
      }

      if (!silent) {
        toast({ title: "Radar K-Flow actualisé", description: `Analyse terminée sur un rayon de ${radius}km.` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  }, [location, radius, user, isAudioEnabled, toast]);

  useEffect(() => {
    if (location && isLoading) handleStartAnalysis();
  }, [location, isLoading, handleStartAnalysis]);

  const handleReCenter = () => {
    if (!location) return;
    mapRef.current?.setCenter(location);
    setZoom(16);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b121e] overflow-hidden rounded-[2.5rem] border border-slate-800 shadow-2xl relative">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        
        {/* -- UI Overlay -- */}
        <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
            
            {/* Header Radar */}
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-xl mx-auto pointer-events-auto"
            >
                <Card className="bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-4 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl relative">
                                <Radar className="text-white h-5 w-5 animate-spin duration-[4000ms]" />
                                <span className="absolute inset-0 bg-primary/20 rounded-xl animate-ping"></span>
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Radar Proximité</CardTitle>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Rayon de {radius}km • Temps Réel</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                className={cn("rounded-full", isAudioEnabled ? "text-primary bg-primary/10" : "text-slate-400")}
                            >
                                {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                            </Button>
                            <Badge className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full">{profile?.currentStarsBalance || 0} ⭐</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                                    <span>Périmètre d'analyse</span>
                                    <span className="text-primary font-mono">{radius} km</span>
                                </div>
                                <Slider 
                                    value={[radius]} 
                                    min={1} 
                                    max={5} 
                                    step={0.5} 
                                    onValueChange={(v) => setRadius(v[0])}
                                    className="py-2"
                                />
                            </div>
                            <Button 
                                onClick={() => handleStartAnalysis()} 
                                disabled={isAnalyzing}
                                className="h-12 w-12 rounded-2xl shadow-xl shrink-0"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bottom Summary Panel */}
            <AnimatePresence>
                {analysis && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full max-w-3xl mx-auto pointer-events-auto"
                    >
                        <Card className="bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                                <div className="text-center space-y-2 shrink-0 md:border-r md:border-white/10 md:pr-8">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score Zone</p>
                                    <div className="relative inline-block">
                                        <p className={cn(
                                            "text-5xl font-black tracking-tighter",
                                            analysis.globalScore > 70 ? "text-emerald-400" : analysis.globalScore > 40 ? "text-amber-400" : "text-red-500"
                                        )}>{analysis.globalScore}</p>
                                        {analysis.trend === 'better' ? <TrendingUp className="absolute -top-1 -right-4 h-4 w-4 text-emerald-400" /> : <TrendingUp className="absolute -top-1 -right-4 h-4 w-4 text-red-400 rotate-90" />}
                                    </div>
                                    <Badge variant="outline" className="border-white/10 text-white/60 font-bold text-[9px] px-2 py-0.5 uppercase">{analysis.globalScore > 70 ? "Fluide" : "Congestionné"}</Badge>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">Axes à proximité</h3>
                                        <span className="text-[9px] text-white/30 font-bold flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" /> mis à jour à {format(analysis.lastUpdated, 'HH:mm:ss')}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[120px] overflow-y-auto scrollbar-none">
                                        {analysis.probes.map((probe, i) => (
                                            <div key={i} className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                                        probe.status === 'FLUIDE' ? "bg-emerald-400" : probe.status === 'MODÉRÉ' ? "bg-amber-400" : "bg-red-500"
                                                    )} />
                                                    <div>
                                                        <p className="text-xs font-bold text-white truncate max-w-[120px]">{probe.road}</p>
                                                        <p className="text-[9px] font-bold text-white/40 uppercase">{probe.distance}</p>
                                                    </div>
                                                </div>
                                                {probe.delay > 0 && <span className="text-[10px] font-black text-red-400">+{probe.delay}m</span>}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20 flex items-center justify-between group cursor-pointer hover:bg-primary/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Zap className="text-primary h-4 w-4 fill-primary" />
                                            <p className="text-[11px] font-black text-white uppercase tracking-tight">Meilleur axe : {analysis.bestRoute}</p>
                                        </div>
                                        <ArrowRight className="text-primary h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Map Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
            <button onClick={handleReCenter} className="h-12 w-12 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl flex items-center justify-center text-slate-900 active:scale-95 transition-all">
                <LocateFixed className="h-6 w-6" />
            </button>
            <div className="flex flex-col rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl overflow-hidden">
                <button onClick={() => setZoom(z => Math.min(z + 1, 21))} className="h-12 w-12 flex items-center justify-center border-b hover:bg-slate-50 active:scale-95 transition-all">
                    <Plus className="h-5 w-5" />
                </button>
                <button onClick={() => setZoom(z => Math.max(z - 1, 10))} className="h-12 w-12 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
                    <Minus className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Map View */}
        <Map
            defaultCenter={location || { lat: -4.330, lng: 15.313 }}
            center={location}
            zoom={mapZoom}
            onZoomChanged={(e) => setZoom(e.detail.zoom)}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId="local_radar_map_v1"
            className="w-full h-full"
            onCameraChanged={(e) => mapRef.current = e.map}
        >
          <TrafficLayerComponent />
          
          {location && (
            <>
                <Marker 
                    position={location}
                    icon={{
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
                        fillColor: '#248eeb',
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 2,
                        scale: 1.8,
                        anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(12, 12) : undefined
                    } as any}
                />
                <RadarCircle center={location} radius={radius * 1000} />
            </>
          )}

          {analysis?.probes.map((probe, i) => (
             <Marker 
                key={i}
                position={probe.coords}
                icon={{
                    url: probe.status === 'EMBOUTEILLAGE' ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' :
                         probe.status === 'DENSE' ? 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' :
                         'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }}
             />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}

/**
 * Overlay visuel du radar
 */
function RadarCircle({ center, radius }: { center: {lat: number, lng: number}, radius: number }) {
    const map = useMap();
    const circleRef = useRef<google.maps.Circle | null>(null);

    useEffect(() => {
        if (!map || !center) return;
        
        const g = (window as any).google;
        if (!g) return;

        if (circleRef.current) {
            circleRef.current.setCenter(center);
            circleRef.current.setRadius(radius);
        } else {
            circleRef.current = new g.maps.Circle({
                map,
                center,
                radius,
                fillColor: '#248eeb',
                fillOpacity: 0.1,
                strokeColor: '#248eeb',
                strokeWeight: 1,
                strokeOpacity: 0.3,
                clickable: false
            });
        }

        return () => {
            if (circleRef.current) {
                circleRef.current.setMap(null);
                circleRef.current = null;
            }
        };
    }, [map, center, radius]);

    return null;
}
