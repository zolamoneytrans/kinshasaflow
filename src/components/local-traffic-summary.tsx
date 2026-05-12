'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  Marker,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { 
  Radar, 
  LocateFixed, 
  Loader2, 
  Activity, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  AlertOctagon, 
  Car, 
  CheckCircle2, 
  ArrowRight,
  Volume2,
  VolumeX,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
const KINSHASA_CENTER = { lat: -4.330, lng: 15.313 };

interface TrafficProbe {
  id: string;
  road: string;
  status: 'FLUIDE' | 'MODÉRÉ' | 'DENSE' | 'EMBOUTEILLAGE' | 'INCONNU';
  delay: number;
  speed: number;
  distance: number; 
  coords: { lat: number, lng: number };
}

interface LocalAnalysis {
  globalScore: number;
  allProbes: TrafficProbe[];
  blocked: TrafficProbe[];
  dense: TrafficProbe[];
  fluide: TrafficProbe[];
  lastUpdated: Date;
}

/**
 * Native Google Maps Circle for @vis.gl/react-google-maps
 */
function Circle(props: google.maps.CircleOptions) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle();
    }
    circleRef.current.setOptions({ ...props, map });
    return () => { if (circleRef.current) circleRef.current.setMap(null); };
  }, [map, props]);

  return null;
}

/**
 * Native Google Maps Traffic Layer
 */
const TrafficLayer = () => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    return () => trafficLayer.setMap(null);
  }, [map]);
  return null;
};

// Haversine Distance
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

export default function LocalTrafficSummary() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radius, setRadius] = useState<number>(2);
  const [analysis, setAnalysis] = useState<LocalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isResultsVisible, setIsResultsVisible] = useState(true);
  const [selectedProbe, setSelectedProbe] = useState<TrafficProbe | null>(null);
  const [mapZoom, setZoom] = useState(14);
  
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Watch Position
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS error", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleStartAnalysis = useCallback(async (silent = false) => {
    if (!location || !user) return;
    if (!silent) setIsAnalyzing(true);

    try {
      const nearbyAxes = MAJOR_AXES.map((axis, idx) => ({
          ...axis,
          id: `local-${idx}`,
          dist: calculateDistance(location.lat, location.lng, axis.origin.lat, axis.origin.lng)
      }))
      .filter(axis => axis.dist <= radius)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 30);

      if (nearbyAxes.length === 0) {
          if (!silent) toast({ title: "Zone peu dense", description: "Aucun axe majeur détecté dans ce rayon." });
          setIsAnalyzing(false);
          return;
      }

      const results = await getGoogleTrafficStatusAction(nearbyAxes as any);
      
      const probes: TrafficProbe[] = results.map((r, i) => ({
        id: nearbyAxes[i].id,
        road: r.road,
        status: r.status as any,
        delay: r.delay,
        speed: r.speed,
        distance: nearbyAxes[i].dist,
        coords: nearbyAxes[i].origin
      }));

      const blocked = probes.filter(p => p.status === 'EMBOUTEILLAGE' || (p.status === 'DENSE' && p.delay > 5));
      const dense = probes.filter(p => p.status === 'DENSE' || p.status === 'MODÉRÉ');
      const fluide = probes.filter(p => p.status === 'FLUIDE');

      const avgDelay = probes.reduce((acc, p) => acc + p.delay, 0) / probes.length;
      const score = Math.max(0, 100 - (avgDelay * 12));

      const newAnalysis: LocalAnalysis = {
          globalScore: Math.round(score),
          allProbes: probes,
          blocked: blocked.sort((a, b) => b.delay - a.delay),
          dense: dense.sort((a, b) => b.delay - a.delay),
          fluide: fluide,
          lastUpdated: new Date()
      };

      setAnalysis(newAnalysis);
      if (!silent) setIsResultsVisible(true);

      if (isAudioEnabled && !silent) {
        let text = `Radar de proximité actif. `;
        if (blocked.length > 0) {
            text += `J'ai détecté ${blocked.length} zones de blocage sévère autour de vous. `;
        } else {
            text += `La circulation est plutôt bonne dans votre secteur. `;
        }
        generateSpeechAction(text).then(res => {
            if (res?.media) new Audio(res.media).play().catch(e => console.warn("Audio blocked"));
        });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur radar", description: "Impossible de scanner le secteur.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [location, radius, user, isAudioEnabled, toast]);

  // Trigger analysis when location is found
  useEffect(() => {
    if (location && !analysis) {
        handleStartAnalysis(true);
    }
  }, [location, analysis, handleStartAnalysis]);

  const getStatusColor = (status: TrafficProbe['status']) => {
    switch (status) {
      case 'EMBOUTEILLAGE': return '#ef4444'; 
      case 'DENSE': return '#f97316'; 
      case 'MODÉRÉ': return '#eab308'; 
      case 'FLUIDE': return '#22c55e'; 
      default: return '#94a3b8'; 
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b121e] overflow-hidden rounded-[2.5rem] border border-slate-800 shadow-2xl relative">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        
        {/* Radar UI Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
            
            {/* Top Control Card */}
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xl mx-auto pointer-events-auto">
                <Card className="bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-4 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl relative shadow-lg">
                                <Radar className={cn("text-white h-5 w-5", isAnalyzing && "animate-spin")} />
                                {isAnalyzing && <span className="absolute inset-0 bg-primary/20 rounded-xl animate-ping"></span>}
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Radar Local</CardTitle>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Périmètre: {radius} km</p>
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
                                onClick={() => { if (location) mapInstanceRef.current?.panTo(location); }}
                                className="rounded-full h-10 w-10 border-slate-200"
                            >
                                <LocateFixed className="h-5 w-5 text-primary" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-6">
                            <div className="flex-1 space-y-1">
                                <Slider 
                                    value={[radius]} 
                                    min={0.5} max={10} step={0.5} 
                                    onValueChange={(v) => setRadius(v[0])}
                                    className="py-2"
                                />
                            </div>
                            <Button 
                                onClick={() => handleStartAnalysis()} 
                                disabled={isAnalyzing || !location}
                                className="h-12 w-12 rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-all active:scale-90"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bottom Analysis Panel */}
            <AnimatePresence>
                {analysis && (
                    <motion.div 
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: isResultsVisible ? 0 : 260, opacity: 1 }}
                        className="w-full max-w-4xl mx-auto pointer-events-auto"
                    >
                        <Card className="bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-t-[3rem] overflow-hidden">
                            <button 
                                onClick={() => setIsResultsVisible(!isResultsVisible)}
                                className="w-full h-10 flex items-center justify-center hover:bg-white/5 transition-colors border-b border-white/5"
                            >
                                {isResultsVisible ? <ChevronDown className="h-6 w-6 text-slate-500" /> : <ChevronUp className="h-6 w-6 text-primary animate-bounce" />}
                            </button>

                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                                <div className="p-6 lg:p-8 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 lg:w-48 shrink-0 bg-white/5">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Score Fluidité</p>
                                        <p className={cn(
                                            "text-6xl font-black tracking-tighter leading-none",
                                            analysis.globalScore > 70 ? "text-emerald-400" : analysis.globalScore > 40 ? "text-amber-400" : "text-red-500"
                                        )}>{analysis.globalScore}%</p>
                                    </div>
                                    <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] uppercase px-2">
                                        MàJ {format(analysis.lastUpdated, 'HH:mm')}
                                    </Badge>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5 h-[340px]">
                                    {/* Column: Embouteillages */}
                                    <div className="p-5 space-y-3 overflow-hidden flex flex-col">
                                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                            <AlertOctagon className="h-3 w-3" /> Embouteillages
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                                            {analysis.blocked.length > 0 ? analysis.blocked.map((p, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => { setSelectedProbe(p); mapInstanceRef.current?.panTo(p.coords); }}
                                                    className="w-full text-left bg-red-500/10 p-3 rounded-2xl border border-red-500/20 flex justify-between items-center hover:bg-red-500/20 transition-all"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-red-200 truncate">{p.road}</p>
                                                        <p className="text-[9px] text-red-400/80 font-black">+{p.delay} min • {p.speed} km/h</p>
                                                    </div>
                                                    <ArrowRight className="h-3 w-3 text-red-500 shrink-0" />
                                                </button>
                                            )) : (
                                                <p className="text-[10px] text-white/20 italic text-center py-10">Périmètre fluide</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column: Dense */}
                                    <div className="p-5 space-y-3 overflow-hidden flex flex-col">
                                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <Car className="h-3 w-3" /> Trafic Dense
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                                            {analysis.dense.length > 0 ? analysis.dense.map((p, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => { setSelectedProbe(p); mapInstanceRef.current?.panTo(p.coords); }}
                                                    className="w-full text-left bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10 flex justify-between items-center hover:bg-amber-500/15 transition-all"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-amber-100 truncate">{p.road}</p>
                                                        <p className="text-[9px] text-amber-500/60 font-black">+{p.delay} min</p>
                                                    </div>
                                                </button>
                                            )) : (
                                                <p className="text-[10px] text-white/20 italic text-center py-10">Rien à signaler</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column: Fluide */}
                                    <div className="p-5 space-y-3 overflow-hidden flex flex-col">
                                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3" /> Voies Libres
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                                            {analysis.fluide.length > 0 ? analysis.fluide.map((p, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={() => { setSelectedProbe(p); mapInstanceRef.current?.panTo(p.coords); }}
                                                    className="w-full text-left bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 flex items-center gap-3 hover:bg-emerald-500/15 transition-all"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                                    <p className="text-xs font-bold text-emerald-100/80 truncate">{p.road}</p>
                                                </button>
                                            )) : (
                                                <p className="text-[10px] text-white/20 italic text-center py-10">Scan requis</p>
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

        {/* Map View */}
        <div className="flex-1 relative">
            <Map
                defaultCenter={location || KINSHASA_CENTER}
                center={location}
                zoom={mapZoom}
                onZoomChanged={(e) => setZoom(e.detail.zoom)}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId="local_radar_live_v10"
                className="w-full h-full"
                onCameraChanged={(e) => mapInstanceRef.current = e.map}
            >
              <TrafficLayer />
              
              {location && (
                <>
                    {/* User Position: High-vis Pin */}
                    <Marker 
                        position={location}
                        zIndex={2000}
                        icon={{
                            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
                            fillColor: '#248eeb',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2,
                            scale: 2
                        } as any}
                    />

                    {/* Scan Radar Circle */}
                    <Circle 
                        center={location}
                        radius={radius * 1000}
                        strokeColor="#248eeb"
                        strokeOpacity={0.5}
                        strokeWeight={3}
                        fillColor="#248eeb"
                        fillOpacity={0.12}
                        clickable={false}
                    />

                    {/* Analysis Markers (Road Bubbles) */}
                    {analysis?.allProbes.map((p) => (
                        <Marker 
                            key={p.id}
                            position={p.coords}
                            onClick={() => setSelectedProbe(p)}
                            zIndex={1000}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillColor: getStatusColor(p.status),
                                fillOpacity: 0.9,
                                strokeColor: 'white',
                                strokeWeight: 2,
                                scale: p.status === 'EMBOUTEILLAGE' ? 14 : 10
                            } as any}
                        />
                    ))}

                    {selectedProbe && (
                        <InfoWindow
                            position={selectedProbe.coords}
                            onCloseClick={() => setSelectedProbe(null)}
                        >
                            <div className="p-2 space-y-2 min-w-[200px]">
                                <h4 className="font-black text-slate-900 leading-tight pr-4">{selectedProbe.road}</h4>
                                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                    <Badge style={{ backgroundColor: getStatusColor(selectedProbe.status) }} className="text-[10px] font-black text-white px-2">
                                        {selectedProbe.status}
                                    </Badge>
                                    {selectedProbe.delay > 0 && (
                                      <span className="text-[11px] font-black text-red-600">+{selectedProbe.delay} min</span>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    Vitesse estimée: {selectedProbe.speed} km/h
                                </p>
                            </div>
                        </InfoWindow>
                    )}
                </>
              )}
            </Map>
        </div>
      </APIProvider>
    </div>
  );
}
