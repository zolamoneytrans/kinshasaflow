'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useFirebase } from '@/firebase';
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
  coords: { lat: number, lng: number };
  distance: number;
}

interface LocalAnalysis {
  globalScore: number;
  blocked: TrafficProbe[];
  dense: TrafficProbe[];
  fluide: TrafficProbe[];
  allProbes: TrafficProbe[];
  lastUpdated: Date;
}

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

export default function LocalTrafficSummary() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radius, setRadius] = useState<number>(2);
  const [analysis, setAnalysis] = useState<LocalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isResultsVisible, setIsResultsVisible] = useState(true);
  const [selectedProbe, setSelectedProbe] = useState<TrafficProbe | null>(null);
  
  const { toast } = useToast();
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS error", err)
      );
    }
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (!location) return;
    setIsAnalyzing(true);

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
          toast({ title: "Périmètre désert", description: "Aucun axe majeur détecté dans ce rayon." });
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
        coords: nearbyAxes[i].origin,
        distance: nearbyAxes[i].dist
      }));

      const blocked = probes.filter(p => p.status === 'EMBOUTEILLAGE' || (p.status === 'DENSE' && p.delay > 5));
      const dense = probes.filter(p => p.status === 'DENSE' || p.status === 'MODÉRÉ');
      const fluide = probes.filter(p => p.status === 'FLUIDE');

      const avgDelay = probes.reduce((acc, p) => acc + p.delay, 0) / probes.length;
      const score = Math.max(0, 100 - (avgDelay * 15));

      setAnalysis({
          globalScore: Math.round(score),
          allProbes: probes,
          blocked: blocked.sort((a, b) => b.delay - a.delay),
          dense: dense.sort((a, b) => b.delay - a.delay),
          fluide: fluide,
          lastUpdated: new Date()
      });

      if (isAudioEnabled) {
        const text = `Radar local actualisé. J'ai détecté ${blocked.length} zones de blocage dans un rayon de ${radius} kilomètres.`;
        generateSpeechAction(text).then(res => {
            if (res?.media) new Audio(res.media).play().catch(e => console.warn("Audio blocked"));
        });
      }
    } catch (e) {
      toast({ title: "Erreur radar", description: "Impossible de scanner le secteur.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [location, radius, isAudioEnabled, toast]);

  useEffect(() => {
    if (location && !analysis) handleStartAnalysis();
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
    <div className="w-full h-full flex flex-col bg-[#0b121e] overflow-hidden rounded-[2rem] border border-slate-800 shadow-2xl relative">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        
        <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xl mx-auto pointer-events-auto">
                <Card className="bg-white/95 backdrop-blur-md border-none shadow-2xl rounded-2xl overflow-hidden">
                    <CardHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-xl">
                                <Radar className={cn("text-white h-5 w-5", isAnalyzing && "animate-spin")} />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Radar Local</CardTitle>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Scanner les rues alentours</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                className={cn("rounded-full h-9 w-9", isAudioEnabled ? "text-primary bg-primary/10" : "text-slate-400")}
                            >
                                {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => location && mapInstanceRef.current?.panTo(location)} className="rounded-full h-9 w-9">
                                <LocateFixed className="h-4 w-4 text-primary" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-1">
                                <Slider value={[radius]} min={0.5} max={5} step={0.5} onValueChange={(v) => setRadius(v[0])} />
                                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                                    <span>0.5 km</span>
                                    <span>Rayon: {radius} km</span>
                                    <span>5 km</span>
                                </div>
                            </div>
                            <Button onClick={handleStartAnalysis} disabled={isAnalyzing || !location} className="rounded-xl h-10 px-4 font-bold shadow-lg">
                                {isAnalyzing ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                SCAN
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <AnimatePresence>
                {analysis && (
                    <motion.div 
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: isResultsVisible ? 0 : 250, opacity: 1 }}
                        className="w-full max-w-4xl mx-auto pointer-events-auto"
                    >
                        <Card className="bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-t-3xl overflow-hidden">
                            <button 
                                onClick={() => setIsResultsVisible(!isResultsVisible)}
                                className="w-full h-8 flex items-center justify-center hover:bg-white/5 border-b border-white/5"
                            >
                                {isResultsVisible ? <ChevronDown className="text-slate-500" /> : <ChevronUp className="text-primary animate-bounce" />}
                            </button>

                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                                <div className="p-6 text-center lg:w-40 shrink-0 bg-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Fluidité</p>
                                    <p className={cn(
                                        "text-5xl font-black tracking-tighter",
                                        analysis.globalScore > 70 ? "text-emerald-400" : analysis.globalScore > 40 ? "text-amber-400" : "text-red-500"
                                    )}>{analysis.globalScore}%</p>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 h-[300px]">
                                    <div className="p-4 space-y-3 overflow-hidden flex flex-col">
                                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                            <AlertOctagon className="h-3 w-3" /> Embouteillages
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                            {analysis.blocked.map((p, i) => (
                                                <button key={i} onClick={() => { setSelectedProbe(p); mapInstanceRef.current?.panTo(p.coords); }} className="w-full text-left bg-red-500/10 p-2 rounded-xl border border-red-500/20 flex justify-between items-center group">
                                                    <div className="min-w-0"><p className="text-xs font-bold text-white truncate">{p.road}</p></div>
                                                    <ArrowRight className="h-3 w-3 text-red-500 opacity-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3 overflow-hidden flex flex-col border-x border-white/5">
                                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <Car className="h-3 w-3" /> Trafic Moyen
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                            {analysis.dense.map((p, i) => (
                                                <button key={i} onClick={() => { setSelectedProbe(p); mapInstanceRef.current?.panTo(p.coords); }} className="w-full text-left bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                                                    <p className="text-xs font-bold text-white/80 truncate">{p.road}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3 overflow-hidden flex flex-col">
                                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3" /> Voies Fluides
                                        </h3>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                            {analysis.fluide.map((p, i) => (
                                                <button key={i} onClick={() => { setSelectedProbe(p); mapInstanceRef.current?.panTo(p.coords); }} className="w-full text-left bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                                                    <p className="text-xs font-bold text-white/60 truncate">{p.road}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="flex-1 relative">
            <Map
                defaultCenter={KINSHASA_CENTER}
                center={location}
                zoom={14}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId="local_radar_live_v1"
                className="w-full h-full"
                onCameraChanged={(e) => {
                  mapInstanceRef.current = e.map;
                }}
            >
              <TrafficLayer />
              
              {location && (
                <>
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

                    <Circle 
                        center={location}
                        radius={radius * 1000}
                        strokeColor="#248eeb"
                        strokeOpacity={0.5}
                        strokeWeight={2}
                        fillColor="#248eeb"
                        fillOpacity={0.1}
                    />

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
                                scale: p.status === 'EMBOUTEILLAGE' ? 12 : 8
                            } as any}
                        />
                    ))}

                    {selectedProbe && (
                        <InfoWindow
                            position={selectedProbe.coords}
                            onCloseClick={() => setSelectedProbe(null)}
                        >
                            <div className="p-1 space-y-1">
                                <h4 className="font-bold text-sm">{selectedProbe.road}</h4>
                                <div className="flex justify-between items-center gap-4">
                                    <Badge style={{ backgroundColor: getStatusColor(selectedProbe.status) }} className="text-[9px] font-black text-white px-2">
                                        {selectedProbe.status}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-red-600">+{selectedProbe.delay} min</span>
                                </div>
                                <p className="text-[9px] text-slate-500 italic">Vitesse: {selectedProbe.speed} km/h</p>
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