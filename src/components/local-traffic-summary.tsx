'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  Marker,
  Circle
} from '@vis.gl/react-google-maps';
import { 
  Radar, 
  LocateFixed, 
  Star, 
  Loader2, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Waves,
  MapPin,
  Car
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { generateSpeechAction, getGoogleTrafficStatusAction } from '@/app/actions';
import { MAJOR_AXES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const GOOGLE_MAPS_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

interface TrafficProbe {
  road: string;
  status: 'FLUIDE' | 'MODÉRÉ' | 'DENSE' | 'EMBOUTEILLAGE' | 'INCONNU';
  delay: number;
  speed: number;
  distance: number; // en km du user
  coords: { lat: number, lng: number };
}

interface LocalAnalysis {
  globalScore: number;
  blocked: TrafficProbe[];
  dense: TrafficProbe[];
  fluide: TrafficProbe[];
  lastUpdated: Date;
}

// Calcul de distance (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
  const [radius, setRadius] = useState<number>(2);
  const [analysis, setAnalysis] = useState<LocalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [mapZoom, setZoom] = useState(14);
  
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
      // 1. Filtrer les axes à proximité du rayon choisi
      const nearbyAxes = MAJOR_AXES.map(axis => ({
          ...axis,
          dist: calculateDistance(location.lat, location.lng, axis.origin.lat, axis.origin.lng)
      }))
      .filter(axis => axis.dist <= radius)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 15); // Scanner max 15 axes pour la performance

      if (nearbyAxes.length === 0) {
          if (!silent) toast({ title: "Zone peu dense", description: "Aucun axe majeur détecté dans ce rayon." });
          setIsAnalyzing(false);
          setIsLoading(false);
          return;
      }

      // 2. Récupérer le statut réel via l'API Google
      const results = await getGoogleTrafficStatusAction(nearbyAxes as any);
      
      const probes: TrafficProbe[] = results.map((r, i) => ({
        road: r.road,
        status: r.status as any,
        delay: r.delay,
        speed: r.speed,
        distance: nearbyAxes[i].dist,
        coords: nearbyAxes[i].origin
      }));

      // 3. Catégorisation
      const blocked = probes.filter(p => p.status === 'EMBOUTEILLAGE' || (p.status === 'DENSE' && p.delay > 5));
      const dense = probes.filter(p => p.status === 'DENSE' || p.status === 'MODÉRÉ');
      const fluide = probes.filter(p => p.status === 'FLUIDE');

      // 4. Calcul du score local
      const avgDelay = probes.reduce((acc, p) => acc + p.delay, 0) / probes.length;
      const score = Math.max(0, 100 - (avgDelay * 12));

      const newAnalysis: LocalAnalysis = {
          globalScore: Math.round(score),
          blocked: blocked.sort((a, b) => b.delay - a.delay),
          dense: dense.sort((a, b) => b.delay - a.delay),
          fluide: fluide,
          lastUpdated: new Date()
      };

      setAnalysis(newAnalysis);

      // 5. Briefing Vocal IA (si activé)
      if (isAudioEnabled && !silent) {
        let text = `Radar actualisé. `;
        if (blocked.length > 0) {
            text += `Attention, j'ai détecté ${blocked.length} points noirs à proximité, notamment sur ${blocked[0].road}. `;
        } else if (dense.length > 0) {
            text += `Ralentissements modérés détectés. `;
        } else {
            text += `La circulation est globalement fluide autour de vous. `;
        }
        text += `L'indice de fluidité locale est de ${newAnalysis.globalScore} sur 100.`;
        
        generateSpeechAction(text).then(res => {
            if (res?.media) {
                const audio = new Audio(res.media);
                audio.play().catch(e => console.warn("Audio bloqué par le navigateur"));
            }
        });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur radar", description: "Impossible de scanner le secteur.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  }, [location, radius, user, isAudioEnabled, toast]);

  // Déclencher un scan automatique au chargement ou changement de rayon
  useEffect(() => {
    if (location && (isLoading || analysis === null)) {
        handleStartAnalysis(true);
    }
  }, [location, radius, handleStartAnalysis, isLoading, analysis]);

  const handleReCenter = () => {
    if (!location) return;
    mapRef.current?.setCenter(location);
    setZoom(15);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b121e] overflow-hidden rounded-[2.5rem] border border-slate-800 shadow-2xl relative">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        
        {/* Radar UI Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
            
            {/* Top Control Card */}
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-xl mx-auto pointer-events-auto"
            >
                <Card className="bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-4 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl relative">
                                <Radar className={cn("text-white h-5 w-5", isAnalyzing && "animate-spin")} style={{ animationDuration: '3s' }} />
                                {isAnalyzing && <span className="absolute inset-0 bg-primary/20 rounded-xl animate-ping"></span>}
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Radar Proximité</CardTitle>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Rayon de {radius}km • Kinshasa Live</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                className={cn("rounded-full h-10 w-10 transition-all", isAudioEnabled ? "text-primary bg-primary/10" : "text-slate-400 hover:bg-slate-100")}
                            >
                                {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={handleReCenter}
                                className="rounded-full h-10 w-10 border-slate-200"
                            >
                                <LocateFixed className="h-5 w-5 text-slate-600" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                                    <span>Distance de Scan</span>
                                    <span className="text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">{radius} km</span>
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
                                className="h-12 w-12 rounded-2xl shadow-xl shrink-0 bg-primary hover:bg-primary/90"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bottom Analysis Results */}
            <AnimatePresence>
                {analysis && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full max-w-4xl mx-auto pointer-events-auto"
                    >
                        <Card className="bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                                
                                {/* Score Panel */}
                                <div className="p-6 lg:p-8 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 lg:w-48 shrink-0 bg-white/5">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Indice Fluidité</p>
                                        <div className="relative inline-block">
                                            <p className={cn(
                                                "text-5xl font-black tracking-tighter",
                                                analysis.globalScore > 70 ? "text-emerald-400" : analysis.globalScore > 40 ? "text-amber-400" : "text-red-500"
                                            )}>{analysis.globalScore}</p>
                                            <span className="absolute -top-1 -right-4">
                                                {analysis.globalScore > 70 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right lg:text-center">
                                        <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] uppercase px-2 mb-2 block">
                                            {format(analysis.lastUpdated, 'HH:mm:ss')}
                                        </Badge>
                                        <div className="flex gap-1 justify-end lg:justify-center">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", analysis.globalScore > 70 ? "bg-emerald-500" : "bg-slate-700")} />
                                            <div className={cn("w-1.5 h-1.5 rounded-full", analysis.globalScore <= 70 && analysis.globalScore > 40 ? "bg-amber-500" : "bg-slate-700")} />
                                            <div className={cn("w-1.5 h-1.5 rounded-full", analysis.globalScore <= 40 ? "bg-red-500" : "bg-slate-700")} />
                                        </div>
                                    </div>
                                </div>

                                {/* Lists Panel */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
                                    
                                    {/* Points Noirs */}
                                    <div className="p-5 space-y-3">
                                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                            <AlertOctagon className="h-3 w-3" /> Points Noirs
                                        </h3>
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                                            {analysis.blocked.length > 0 ? analysis.blocked.map((p, i) => (
                                                <div key={i} className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 flex justify-between items-center group hover:bg-red-500/20 transition-colors">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-red-200 truncate">{p.road}</p>
                                                        <p className="text-[9px] text-red-400/80 font-black">+{p.delay} min • {p.speed} km/h</p>
                                                    </div>
                                                    <ArrowRight className="h-3 w-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )) : (
                                                <p className="text-[10px] text-white/20 italic text-center py-4">Aucun blocage majeur</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ralentissements */}
                                    <div className="p-5 space-y-3">
                                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <Car className="h-3 w-3" /> Ralentis
                                        </h3>
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                                            {analysis.dense.length > 0 ? analysis.dense.map((p, i) => (
                                                <div key={i} className="bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10 flex justify-between items-center">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-amber-100 truncate">{p.road}</p>
                                                        <p className="text-[9px] text-amber-500/60 font-black">+{p.delay} min • {p.speed} km/h</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-[10px] text-white/20 italic text-center py-4">Secteur dégagé</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Voies Fluides */}
                                    <div className="p-5 space-y-3">
                                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3" /> Voies Fluides
                                        </h3>
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
                                            {analysis.fluide.length > 0 ? analysis.fluide.map((p, i) => (
                                                <div key={i} className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 flex items-center gap-3">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                    <p className="text-xs font-bold text-emerald-100 truncate">{p.road}</p>
                                                </div>
                                            )) : (
                                                <p className="text-[10px] text-white/20 italic text-center py-4">Tout est bouché !</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Fullscreen Map Background */}
        <div className="flex-1 relative">
            <Map
                defaultCenter={location || { lat: -4.330, lng: 15.313 }}
                center={location}
                zoom={mapZoom}
                onZoomChanged={(e) => setZoom(e.detail.zoom)}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId="local_radar_map_dark_v2"
                className="w-full h-full"
                onCameraChanged={(e) => mapRef.current = e.map}
            >
              <TrafficLayerComponent />
              
              {location && (
                <>
                    {/* User Marker */}
                    <Marker 
                        position={location}
                        icon={{
                            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
                            fillColor: '#248eeb',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2,
                            scale: 2
                        } as any}
                    />

                    {/* Probes Visualization */}
                    {analysis?.blocked.map((p, i) => (
                        <Marker 
                            key={`blocked-${i}`}
                            position={p.coords}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillColor: '#ef4444',
                                fillOpacity: 0.8,
                                strokeColor: 'white',
                                strokeWeight: 1,
                                scale: 6
                            }}
                        />
                    ))}

                    {/* Radius Circle */}
                    <Circle 
                        center={location}
                        radius={radius * 1000}
                        strokeColor="#248eeb"
                        strokeOpacity={0.3}
                        strokeWeight={2}
                        fillColor="#248eeb"
                        fillOpacity={0.05}
                        clickable={false}
                    />
                </>
              )}
            </Map>
        </div>
      </APIProvider>
    </div>
  );
}
