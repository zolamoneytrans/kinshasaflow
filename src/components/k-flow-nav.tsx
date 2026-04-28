'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  Marker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { 
  Navigation2, 
  Search, 
  AlertTriangle, 
  Loader2, 
  Star, 
  Zap, 
  X, 
  Navigation as NavigationIcon,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  Plus,
  Minus,
  LocateFixed,
  Box,
  Layers,
  Flag,
  ArrowRightLeft,
  Clock,
  ChevronRight,
  Info,
  ShieldCheck,
  TrendingUp,
  Map as MapIcon,
  Activity,
  Bug,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { STAR_COSTS, UserProfile, EventReport, WithId } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const GOOGLE_MAPS_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

const KINSHASA_BOUNDS = {
  north: -4.240,
  south: -4.516,
  west: 15.148,
  east: 15.565,
};

const KINSHASA_CENTER = { lat: -4.330, lng: 15.313 };

type TrafficAlertType = 'red' | 'yellow' | 'green' | 'info';
interface TrafficAlert {
    id: string;
    message: string;
    type: TrafficAlertType;
    distance?: string;
    timestamp: number;
}

interface RouteSummary {
    index: number;
    distance: string;
    duration: string;
    durationInTraffic: string;
    delayMinutes: number;
    isSmart: boolean;
}

interface RouteInfo {
    distance: string;
    duration: string;
    durationInTraffic?: string;
    destinationCoords?: { lat: number, lng: number };
    allRoutes?: RouteSummary[];
    result?: google.maps.DirectionsResult;
}

interface TrafficSegment {
    from: string;
    to: string;
    status: 'fluide' | 'congestionné' | 'bloqué' | 'inconnu';
    delayMinutes: number;
    distanceText: string;
    isIncident?: boolean;
    debugRatio?: number;
}

interface SummaryData {
    destination: string;
    distance: string;
    duration: string;
    delayMinutes: number;
    segments: TrafficSegment[];
    recommendation: string;
    bestRouteIndex: number;
    allRoutes?: RouteSummary[];
}

// Helper pour traduire les instructions brutes si l'API renvoie de l'anglais
const translateInstruction = (text: string) => {
    let t = text;
    const map: Record<string, string> = {
        "At the roundabout": "Au rond-point",
        "Continue onto": "Continuer sur",
        "Turn right": "Tourner à droite",
        "Turn left": "Tourner à gauche",
        "Head south": "Dirigez-vous vers le sud",
        "Head north": "Dirigez-vous vers le nord",
        "Head east": "Dirigez-vous vers l'est",
        "Head west": "Dirigez-vous vers l'ouest",
        "Merge onto": "Rejoindre",
        "Take the exit": "Prendre la sortie",
        "Keep left": "Rester à gauche",
        "Keep right": "Rester à droite",
        "Slight right": "Légèrement à droite",
        "Slight left": "Légèrement à gauche",
        "Take the 1st exit": "Prendre la 1ère sortie",
        "Take the 2nd exit": "Prendre la 2ème sortie",
        "Take the 3rd exit": "Prendre la 3ème sortie",
        "Take the 4th exit": "Prendre la 4ème sortie",
        "onto": "sur",
        "way": "voie",
        "Road": "Route",
        "Street": "Rue",
        "Blvd": "Boulevard"
    };
    Object.keys(map).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        t = t.replace(regex, map[key]);
    });
    return t;
};

/**
 * Hook personnalisé pour lisser la position GPS et calculer l'orientation
 */
function useInterpolatedLocation(rawLocation: {lat: number, lng: number} | null) {
    const [smoothLocation, setSmoothLocation] = useState<{lat: number, lng: number} | null>(null);
    const [heading, setHeading] = useState(0);
    const lastPos = useRef<{lat: number, lng: number} | null>(null);
    const animationFrame = useRef<number>(0);

    useEffect(() => {
        if (!rawLocation) return;

        if (!lastPos.current) {
            setSmoothLocation(rawLocation);
            lastPos.current = rawLocation;
            return;
        }

        const g = (window as any).google;
        if (g?.maps?.geometry?.spherical) {
            const newHeading = g.maps.geometry.spherical.computeHeading(
                new g.maps.LatLng(lastPos.current.lat, lastPos.current.lng),
                new g.maps.LatLng(rawLocation.lat, rawLocation.lng)
            );
            if (Math.abs(newHeading) > 1) {
                setHeading(newHeading);
            }
        }

        let startTime: number;
        const duration = 1000;
        const startPos = { ...lastPos.current };

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            const currentLat = startPos.lat + (rawLocation.lat - startPos.lat) * progress;
            const currentLng = startPos.lng + (rawLocation.lng - startPos.lng) * progress;

            const interpolated = { lat: currentLat, lng: currentLng };
            setSmoothLocation(interpolated);
            lastPos.current = interpolated;

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            }
        };

        animationFrame.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame.current);
    }, [rawLocation]);

    return { smoothLocation, heading };
}

/**
 * Sous-composant pour gérer les mouvements de caméra
 */
function MapCameraHandler({ 
  smoothLocation, 
  autoFollow, 
  showSummary, 
  isNavigating, 
  is3D, 
  heading 
}: { 
  smoothLocation: {lat: number, lng: number} | null,
  autoFollow: boolean,
  showSummary: boolean,
  isNavigating: boolean,
  is3D: boolean,
  heading: number
}) {
    const map = useMap();

    useEffect(() => {
        if (map && smoothLocation && autoFollow && !showSummary) {
            map.moveCamera({
                center: smoothLocation,
                heading: isNavigating && is3D ? heading : 0,
                tilt: isNavigating && is3D ? 45 : 0,
                zoom: isNavigating ? 18 : 15
            });
        }
    }, [map, smoothLocation, autoFollow, heading, isNavigating, is3D, showSummary]);

    return null;
}

export default function KFlowNav() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [rawLocation, setRawLocation] = useState<{lat: number, lng: number} | null>(null);
    const { smoothLocation, heading } = useInterpolatedLocation(rawLocation);
    const [destination, setDestination] = useState<string>('');
    const [isNavigating, setIsNavigating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [is3D, setIs3D] = useState(true);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [activeAlert, setActiveAlert] = useState<TrafficAlert | null>(null);
    const [autoFollow, setAutoFollow] = useState(true);
    const [showDestInfo, setShowDestInfo] = useState(false);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [debugMode, setDebugMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: profile } = useDoc<UserProfile>(userRef);

    const incidentsCollection = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
    const incidentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(incidentsCollection, orderBy('createdAt', 'desc'), limit(50));
    }, [firestore, incidentsCollection]);
    const { data: incidents } = useCollection<EventReport>(incidentsQuery);

    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setRawLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.warn("GPS Access Denied", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                toast({ title: "Erreur Plein Écran", description: "Votre navigateur ne supporte pas cette option.", variant: "destructive" });
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleAnalyzeRoute = async () => {
        if (!user || !profile) return;
        if (!destination) {
            toast({ title: "Destination vide", description: "Où souhaitez-vous aller ?", variant: "destructive" });
            return;
        }

        if (profile.currentStarsBalance < STAR_COSTS.NAVIGATION_SESSION) {
            toast({
                title: "Solde insuffisant",
                description: `L'analyse premium coûte ${STAR_COSTS.NAVIGATION_SESSION} stars.`,
                variant: "destructive",
                action: <Button asChild variant="outline" size="sm"><Link href="/mes-stars">Boutique</Link></Button>
            });
            return;
        }

        setIsUnlocking(true);
        setIsAnalyzing(true);

        try {
            const g = (window as any).google;
            if (!g) throw new Error("API Google Maps non chargée.");

            const service = new g.maps.DirectionsService();
            const result = await service.route({
                origin: smoothLocation || KINSHASA_CENTER,
                destination: destination,
                travelMode: g.maps.TravelMode.DRIVING,
                provideRouteAlternatives: true,
                drivingOptions: { 
                    departureTime: new Date(), 
                    trafficModel: g.maps.TrafficModel.BEST_GUESS 
                }
            });

            if (!result || !result.routes.length) throw new Error("Aucun itinéraire trouvé.");

            const mainRoute = result.routes[0];
            const leg = mainRoute.legs[0];
            
            // --- ANALYSE DE TRAFIC HAUTE PRÉCISION ---
            const legDurationTypical = leg.duration?.value || 1;
            const legDurationTraffic = leg.duration_in_traffic?.value || legDurationTypical;
            const legDistanceTotal = leg.distance?.value || 1;
            
            let blockedCount = 0;
            let congestedCount = 0;

            const rawSegments: TrafficSegment[] = leg.steps.map(step => {
                const currentDuration = step.duration?.value || 0;
                const typicalDuration = (step.distance?.value / legDistanceTotal) * legDurationTypical;
                const ratio = typicalDuration > 0 ? currentDuration / typicalDuration : 1;
                
                let status: TrafficSegment['status'] = 'fluide';
                if (ratio > 1.8) {
                    status = 'bloqué';
                    blockedCount++;
                }
                else if (ratio > 1.25) {
                    status = 'congestionné';
                    congestedCount++;
                }
                
                const rawName = step.instructions.replace(/<[^>]*>?/gm, '').split(',')[0];
                const name = translateInstruction(rawName);

                return {
                    from: name,
                    to: "",
                    status,
                    delayMinutes: Math.max(0, Math.round((currentDuration - typicalDuration) / 60)),
                    distanceText: step.distance?.text || '',
                    debugRatio: ratio
                };
            });

            const mergedSegments: TrafficSegment[] = [];
            if (rawSegments.length > 0) {
                let current = { ...rawSegments[0] };
                for (let i = 1; i < rawSegments.length; i++) {
                    const step = rawSegments[i];
                    if (step.status === current.status || (step.distanceText.includes(' m') && !step.distanceText.includes(' km'))) {
                        current.to = step.from;
                        current.delayMinutes += step.delayMinutes;
                    } else {
                        mergedSegments.push(current);
                        current = { ...step };
                    }
                }
                mergedSegments.push(current);
            }

            const globalDelay = Math.max(0, Math.round((legDurationTraffic - legDurationTypical) / 60));
            
            const summaries: RouteSummary[] = result.routes.slice(0, 2).map((r, i) => {
                const leg = r.legs[0];
                const dur = leg.duration?.value || 0;
                const durT = leg.duration_in_traffic?.value || dur;
                return {
                    index: i,
                    distance: leg.distance?.text || '',
                    duration: leg.duration?.text || '',
                    durationInTraffic: leg.duration_in_traffic?.text || leg.duration?.text || '',
                    delayMinutes: Math.max(0, Math.round((durT - dur) / 60)),
                    isSmart: i > 0 || (result.routes.length > 1 && durT < (result.routes[1]?.legs[0].duration_in_traffic?.value || Infinity))
                };
            });

            let bestIdx = 0;
            const problematicSegments = mergedSegments.filter(s => s.status !== 'fluide').length;
            const congestionPerc = Math.round((problematicSegments / mergedSegments.length) * 100);

            let rec = `Conditions excellentes : le flux est fluide sur l'ensemble de votre trajet.`;
            
            if (blockedCount > 0) {
                rec = `Flux critique : ${blockedCount} zone(s) de blocage total détectée(s). Retard estimé de ${globalDelay} min.`;
            } else if (congestedCount > 1) {
                rec = `Ralentissements détectés sur ${congestionPerc}% du parcours. Prévoyez environ ${globalDelay} min de retard.`;
            } else if (globalDelay > 2) {
                rec = `Flux modéré : quelques ralentissements mineurs (+${globalDelay} min). Itinéraire K-Flow recommandé.`;
            }

            if (result.routes.length > 1) {
                const dur0 = result.routes[0].legs[0].duration_in_traffic?.value || result.routes[0].legs[0].duration?.value || 0;
                const dur1 = result.routes[1].legs[0].duration_in_traffic?.value || result.routes[1].legs[0].duration?.value || 0;
                const gain = Math.round((dur0 - dur1) / 60);
                if (gain >= 2) {
                    bestIdx = 1;
                    rec = `Optimisation majeure : l'itinéraire K-Flow intelligent permet de gagner ${gain} min en contournant les bouchons.`;
                }
            }

            // Déduction des Stars
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef!);
                const data = userDoc.data() as UserProfile;
                const newBalance = data.currentStarsBalance - STAR_COSTS.NAVIGATION_SESSION;
                
                transaction.update(userRef!, {
                    currentStarsBalance: newBalance,
                    totalStarsUsed: (data.totalStarsUsed || 0) + STAR_COSTS.NAVIGATION_SESSION
                });

                const starTransRef = doc(collection(userRef!, 'star_transactions'));
                transaction.set(starTransRef, {
                    userId: user.uid,
                    type: 'spent',
                    starsChange: -STAR_COSTS.NAVIGATION_SESSION,
                    balanceAfterTransaction: newBalance,
                    description: `Analyse trajet : ${destination}`,
                    timestamp: serverTimestamp(),
                });
            });

            setSummaryData({
                destination,
                distance: leg.distance?.text || '--',
                duration: leg.duration_in_traffic?.text || leg.duration?.text || '--',
                delayMinutes: globalDelay,
                segments: mergedSegments.filter(s => s.status !== 'fluide' || mergedSegments.length < 5),
                recommendation: rec,
                bestRouteIndex: bestIdx,
                allRoutes: summaries
            });
            
            setSelectedRouteIndex(bestIdx);
            setShowSummary(true);

        } catch (error: any) {
            console.error(error);
            toast({ title: "Erreur d'analyse", description: error.message || "Échec de connexion aux services Google.", variant: "destructive" });
        } finally {
            setIsUnlocking(false);
            setIsAnalyzing(false);
        }
    };

    const handleStartNavigation = () => {
        setIsNavigating(true);
        setShowSummary(false);
        setAutoFollow(true);
        setIs3D(true);
        toast({ title: "Guidage actif", description: "Suivez les instructions pour naviguer dans Kinshasa." });
    };

    const handleReCenter = () => {
        if (!smoothLocation) {
            toast({ title: "GPS indisponible", variant: "destructive" });
            return;
        }
        setAutoFollow(true);
    };

    const onRouteUpdate = (info: RouteInfo) => {
        setRouteInfo(info);
    };

    const onAlertUpdate = (alert: TrafficAlert | null) => {
        setActiveAlert(alert);
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-2xl bg-slate-950 flex flex-col border border-slate-800"
        >
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="fr">
                {/* Overlay Barre de Recherche */}
                {!isNavigating && !showSummary && (
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4">
                        <motion.div 
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-full max-w-xl bg-white/95 backdrop-blur-2xl p-4 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                                    <NavigationIcon className="text-white h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">K-Flow Nav</h2>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Navigation Temps Réel Kinshasa</p>
                                </div>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full border-amber-200">
                                    {STAR_COSTS.NAVIGATION_SESSION} ⭐
                                </Badge>
                            </div>
                            
                            <div className="flex gap-2">
                                <AutocompleteInput 
                                    value={destination} 
                                    onChange={setDestination} 
                                    onSearch={handleAnalyzeRoute}
                                    isLoading={isUnlocking}
                                />
                                <Button 
                                    onClick={handleAnalyzeRoute} 
                                    disabled={isUnlocking || !destination}
                                    className="h-12 px-6 rounded-xl font-black shadow-xl shadow-primary/30"
                                >
                                    {isUnlocking ? <Loader2 className="animate-spin" /> : "ALLER"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Overlay Résumé "Whiteboard" */}
                <AnimatePresence>
                    {showSummary && summaryData && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-xl p-4 md:p-8 flex items-center justify-center"
                        >
                            <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="bg-primary p-8 text-white relative">
                                    <div className="absolute top-[-30%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                                    <button onClick={() => setShowSummary(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                                        <X className="h-6 w-6" />
                                    </button>
                                    <div className="space-y-2 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <Badge className="bg-white/20 border-white/30 text-white font-bold mb-2">SYNTHÈSE STRATÉGIQUE</Badge>
                                            <button onClick={() => setDebugMode(!debugMode)} className="text-white/20 hover:text-white transition-all"><Bug className="h-4 w-4"/></button>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">{summaryData.destination}</h2>
                                        
                                        {/* Route Selector inside Whiteboard */}
                                        {summaryData.allRoutes && summaryData.allRoutes.length > 1 && (
                                            <div className="flex gap-2 pt-4">
                                                {summaryData.allRoutes.map((route, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedRouteIndex(i)}
                                                        className={cn(
                                                            "flex-1 p-3 rounded-xl border-2 transition-all text-left relative",
                                                            selectedRouteIndex === i ? "bg-white/20 border-white" : "bg-black/10 border-white/10 hover:bg-black/20"
                                                        )}
                                                    >
                                                        <p className="text-[9px] font-black uppercase mb-1 opacity-70">{route.isSmart ? "K-Flow" : "Standard"}</p>
                                                        <p className="text-lg font-black">{route.durationInTraffic}</p>
                                                        {selectedRouteIndex === i && <CheckCircle2 className="absolute top-2 right-2 h-3 w-3" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                            <Activity className="h-4 w-4" /> État des tronçons routiers
                                        </h3>
                                        <div className="space-y-3">
                                            {summaryData.segments.map((seg, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-3 h-3 rounded-full shadow-sm",
                                                            seg.status === 'fluide' ? "bg-emerald-500" :
                                                            seg.status === 'congestionné' ? "bg-amber-500" : "bg-red-500"
                                                        )} />
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{seg.from}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                                {seg.status} • {seg.distanceText}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {seg.delayMinutes > 0 && <span className="text-xs font-black text-red-500">+{seg.delayMinutes}m</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                                        <div className="bg-primary p-2 rounded-xl text-white">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-primary uppercase tracking-widest">Conseil K-Flow</p>
                                            <p className="text-sm text-slate-700 font-bold leading-relaxed">{summaryData.recommendation}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 bg-slate-50 border-t flex flex-col sm:flex-row gap-4">
                                    <Button variant="ghost" onClick={() => setShowSummary(false)} className="h-14 md:h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex-1">
                                        Annuler
                                    </Button>
                                    <Button onClick={handleStartNavigation} className="h-14 md:h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-sm flex-[2] shadow-2xl shadow-primary/30 gap-3">
                                        <Navigation2 className="h-6 w-6 fill-current" />
                                        Démarrer Guidage
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlay Header Navigation (Slimmer) */}
                {isNavigating && (
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                        <div className="w-full max-w-xl pointer-events-auto">
                            <motion.div 
                                initial={{ y: -100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-slate-900/95 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-white/10 flex justify-between items-center text-white"
                            >
                                <div className="flex items-center gap-3 ml-2">
                                    <div className="bg-emerald-500 p-2 rounded-xl shadow-lg">
                                        <Navigation2 className="h-5 w-5 fill-white" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black leading-none">
                                            {routeInfo?.allRoutes?.[selectedRouteIndex]?.durationInTraffic || routeInfo?.duration || '--'}
                                        </p>
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
                                            {routeInfo?.allRoutes?.[selectedRouteIndex]?.distance || routeInfo?.distance || '--'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setIs3D(!is3D)} 
                                        className="text-white hover:bg-white/10 rounded-xl h-10 gap-1.5 border border-white/10"
                                    >
                                        {is3D ? <Layers className="h-3.5 w-3.5" /> : <Box className="h-3.5 w-3.5" />}
                                        <span className="text-[9px] font-black uppercase">{is3D ? '2D' : '3D'}</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setIsNavigating(false); setActiveAlert(null); setShowDestInfo(false); }} className="text-white hover:bg-white/10 rounded-full h-10 w-10">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {activeAlert && (
                                    <motion.div
                                        key={activeAlert.id}
                                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className={cn(
                                            "mt-3 p-4 rounded-[2rem] shadow-2xl border-2 flex items-center gap-3 backdrop-blur-xl relative overflow-hidden",
                                            activeAlert.type === 'red' ? "bg-red-600/95 border-red-400 text-white" :
                                            activeAlert.type === 'yellow' ? "bg-amber-500/95 border-amber-300 text-slate-950" :
                                            "bg-emerald-600/95 border-emerald-400 text-white"
                                        )}
                                    >
                                        <div className="p-2 bg-white/20 rounded-xl shrink-0">
                                            {activeAlert.type === 'red' ? <AlertOctagon className="h-6 w-6" /> :
                                            activeAlert.type === 'yellow' ? <AlertTriangle className="h-6 w-6" /> :
                                            <CheckCircle2 className="h-6 w-6" />}
                                        </div>
                                        <p className="text-xs font-black leading-tight uppercase flex-1">{activeAlert.message}</p>
                                        <button onClick={() => setActiveAlert(null)} className="opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                <div className="flex-1 relative">
                    <Map
                        defaultCenter={KINSHASA_CENTER}
                        defaultZoom={13}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        onDragstart={() => setAutoFollow(false)}
                        restriction={{
                            latLngBounds: KINSHASA_BOUNDS,
                            strictBounds: false,
                        }}
                        mapId="kflow_nav_map_v6"
                        className="w-full h-full"
                    >
                        <TrafficLayerComponent />
                        
                        <MapCameraHandler 
                          smoothLocation={smoothLocation}
                          autoFollow={autoFollow}
                          showSummary={showSummary}
                          isNavigating={isNavigating}
                          is3D={is3D}
                          heading={heading}
                        />

                        {smoothLocation && (
                            <Marker
                                position={smoothLocation}
                                icon={{
                                    path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z",
                                    fillColor: '#248eeb',
                                    fillOpacity: 1,
                                    strokeColor: 'white',
                                    strokeWeight: 2,
                                    scale: 2,
                                    rotation: heading,
                                    anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(12, 12) : { x: 12, y: 12 }
                                } as google.maps.Symbol}
                            />
                        )}

                        <DirectionsHandler 
                            origin={smoothLocation} 
                            destination={destination} 
                            isNavigating={isNavigating}
                            selectedRouteIndex={selectedRouteIndex}
                            onRouteUpdate={onRouteUpdate}
                            onAlertUpdate={onAlertUpdate}
                        />

                        {isNavigating && routeInfo?.destinationCoords && (
                            <>
                                <Marker 
                                    position={routeInfo.destinationCoords}
                                    animation={(window as any).google?.maps?.Animation?.DROP}
                                    onClick={() => setShowDestInfo(true)}
                                    icon={{
                                        path: "M14.5 2H6v20h2v-7h11l-2-6.5 2-6.5h-4.5z",
                                        fillColor: '#f59e0b',
                                        fillOpacity: 1,
                                        strokeColor: '#000000',
                                        strokeWeight: 2,
                                        scale: 1.5,
                                        anchor: (window as any).google?.maps?.Point ? new (window as any).google.maps.Point(12, 22) : { x: 12, y: 22 }
                                    } as google.maps.Symbol}
                                />
                                {showDestInfo && (
                                    <InfoWindow 
                                        position={routeInfo.destinationCoords}
                                        onCloseClick={() => setShowDestInfo(false)}
                                    >
                                        <div className="p-2 min-w-[150px]">
                                            <p className="font-black text-slate-900 border-b pb-1 mb-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                                <Flag className="h-3 w-3 text-amber-500" />
                                                Destination
                                            </p>
                                            <p className="text-sm font-bold text-slate-800 truncate mb-2">{destination}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-slate-400 font-bold uppercase">Arrivée prévue</span>
                                                    <span className="text-emerald-600 font-black">
                                                        {routeInfo?.allRoutes?.[selectedRouteIndex]?.durationInTraffic || routeInfo.duration}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </>
                        )}
                        
                        <IncidentMarkers incidents={incidents || []} />
                        
                        <MapControls 
                            onReCenter={handleReCenter} 
                            isAutoFollowing={autoFollow} 
                            toggleFullscreen={toggleFullscreen}
                            isFullscreen={isFullscreen}
                        />
                    </Map>
                </div>
            </APIProvider>
        </div>
    );
}

function MapControls({ onReCenter, isAutoFollowing, toggleFullscreen, isFullscreen }: { 
    onReCenter: () => void, 
    isAutoFollowing: boolean,
    toggleFullscreen: () => void,
    isFullscreen: boolean
}) {
    const map = useMap();
    const handleZoomIn = () => { if (map) map.setZoom((map.getZoom() || 13) + 1); };
    const handleZoomOut = () => { if (map) map.setZoom((map.getZoom() || 13) - 1); };

    return (
        <div className="absolute bottom-10 right-4 z-30 flex flex-col gap-3">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                title={isFullscreen ? "Réduire" : "Plein écran"}
                className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-2xl border-2 bg-white border-slate-100 text-slate-600 hover:bg-slate-50 transition-all"
            >
                {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
            </motion.button>

            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onReCenter}
                title="Recentrer sur ma position"
                className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all",
                    isAutoFollowing ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                )}
            >
                <LocateFixed className="h-6 w-6" />
            </motion.button>

            <div className="flex flex-col rounded-2xl overflow-hidden border-2 border-slate-100 bg-white shadow-2xl">
                <button onClick={handleZoomIn} title="Zoom avant" className="h-12 w-12 flex items-center justify-center text-slate-600 hover:bg-slate-50 border-b border-slate-100"><Plus className="h-6 w-6" /></button>
                <button onClick={handleZoomOut} title="Zoom arrière" className="h-12 w-12 flex items-center justify-center text-slate-600 hover:bg-slate-50"><Minus className="h-6 w-6" /></button>
            </div>
        </div>
    );
}

function AutocompleteInput({ value, onChange, onSearch, isLoading }: { value: string, onChange: (v: string) => void, onSearch: () => void, isLoading: boolean }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const places = useMapsLibrary('places');

    useEffect(() => {
        if (!places || !inputRef.current) return;
        const autocomplete = new places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'cd' },
            bounds: KINSHASA_BOUNDS,
            fields: ['formatted_address', 'geometry', 'name'],
            strictBounds: true,
        });
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address || place.name) onChange(place.formatted_address || place.name || '');
        });
    }, [places, onChange]);

    return (
        <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
                ref={inputRef}
                placeholder="Votre destination à Kinshasa..." 
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                disabled={isLoading}
                className="pl-12 h-14 rounded-2xl border-none bg-slate-100 font-bold text-slate-800 shadow-inner"
            />
        </div>
    );
}

function DirectionsHandler({ origin, destination, isNavigating, selectedRouteIndex, onRouteUpdate, onAlertUpdate }: { 
    origin: {lat: number; lng: number} | null, 
    destination: string, 
    isNavigating: boolean,
    selectedRouteIndex: number,
    onRouteUpdate: (info: RouteInfo) => void,
    onAlertUpdate: (alert: TrafficAlert | null) => void
}) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [renderers, setRenderers] = useState<google.maps.DirectionsRenderer[]>([]);
    const lastPosUpdate = useRef<{lat: number, lng: number} | null>(null);
    const lastAlertTime = useRef<number>(0);
    const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Init Traceurs
    useEffect(() => {
        if (!routesLibrary || !map) return;
        
        const g = (window as any).google;
        const rendererNormal = new g.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: { 
                strokeColor: '#3b82f6', 
                strokeWeight: 6, 
                strokeOpacity: 0.6,
                zIndex: 10
            }
        });

        const rendererSmart = new g.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: { 
                strokeColor: '#a855f7', 
                strokeWeight: 10, 
                strokeOpacity: 0.9,
                zIndex: 20
            }
        });

        setRenderers([rendererNormal, rendererSmart]);

        return () => {
            rendererNormal.setMap(null);
            rendererSmart.setMap(null);
        };
    }, [routesLibrary, map]);

    useEffect(() => {
        if (!isNavigating || !origin || !destination || !routesLibrary || renderers.length === 0 || !map) return;

        const g = (window as any).google;
        if (lastPosUpdate.current && g?.maps?.geometry?.spherical) {
            const dist = g.maps.geometry.spherical.computeDistanceBetween(
                new g.maps.LatLng(lastPosUpdate.current.lat, lastPosUpdate.current.lng),
                new g.maps.LatLng(origin.lat, origin.lng)
            );
            if (dist < 30) return;
        }

        const service = new g.maps.DirectionsService();
        service.route({
            origin: origin,
            destination: destination,
            travelMode: g.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            drivingOptions: { 
                departureTime: new Date(), 
                trafficModel: g?.maps?.TrafficModel?.BEST_GUESS || 'best_guess'
            }
        }, (result, status) => {
            if (status === g.maps.DirectionsStatus.OK && result) {
                const routes = result.routes;
                
                renderers.forEach((r, idx) => {
                    if (routes[idx]) {
                        r.setMap(map);
                        r.setDirections(result);
                        r.setRouteIndex(idx);
                        
                        const isSelected = selectedRouteIndex === idx;
                        r.setOptions({
                            polylineOptions: {
                                ...r.get('polylineOptions'),
                                strokeOpacity: isSelected ? 0.9 : 0.2,
                                strokeWeight: isSelected ? 12 : 6,
                                zIndex: isSelected ? 30 : 10
                            }
                        });
                    } else {
                        r.setMap(null);
                    }
                });

                const summaries: RouteSummary[] = routes.slice(0, 2).map((r, i) => {
                    const leg = r.legs[0];
                    const dur = leg.duration?.value || 0;
                    const durT = leg.duration_in_traffic?.value || dur;
                    return {
                        index: i,
                        distance: leg.distance?.text || '',
                        duration: leg.duration?.text || '',
                        durationInTraffic: leg.duration_in_traffic?.text || leg.duration?.text || '',
                        delayMinutes: Math.max(0, Math.round((durT - dur) / 60)),
                        isSmart: i > 0 || (routes.length > 1 && durT < (routes[1]?.legs[0].duration_in_traffic?.value || Infinity))
                    };
                });

                lastPosUpdate.current = origin;
                const activeLeg = routes[Math.min(selectedRouteIndex, routes.length - 1)].legs[0];
                
                onRouteUpdate({ 
                    distance: activeLeg.distance?.text || '', 
                    duration: activeLeg.duration?.text || '', 
                    durationInTraffic: activeLeg.duration_in_traffic?.text,
                    destinationCoords: {
                        lat: activeLeg.end_location.lat(),
                        lng: activeLeg.end_location.lng()
                    },
                    allRoutes: summaries,
                    result: result
                });

                // Logique d'alertes temps réel
                const now = Date.now();
                const currentStep = activeLeg.steps[0];
                const ratio = (currentStep.duration?.value || 0) / ((currentStep.distance?.value / activeLeg.distance?.value) * activeLeg.duration?.value);
                
                if (now - lastAlertTime.current > 30000) {
                    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
                    
                    let newAlert: TrafficAlert | null = null;
                    if (ratio > 1.8) {
                        newAlert = { id: `a-${now}`, message: "Route bloquée dans moins de 1 km, veuillez changer d'itinéraire", type: 'red', timestamp: now };
                    } else if (ratio > 1.3) {
                        newAlert = { id: `a-${now}`, message: "Embouteillage détecté devant vous", type: 'yellow', timestamp: now };
                    } else if (ratio < 1.1) {
                        newAlert = { id: `a-${now}`, message: "Circulation fluide sur le prochain kilomètre", type: 'green', timestamp: now };
                    }

                    if (newAlert) {
                        onAlertUpdate(newAlert);
                        lastAlertTime.current = now;
                        alertTimeoutRef.current = setTimeout(() => onAlertUpdate(null), 10000);
                    }
                }
            }
        });

        return () => { if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current); };
    }, [isNavigating, origin, destination, routesLibrary, renderers, selectedRouteIndex, onAlertUpdate, onRouteUpdate, map]);

    return null;
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

const IncidentMarkers = ({ incidents }: { incidents: WithId<EventReport>[] }) => {
    const map = useMap();
    const g = (window as any).google;
    if (!map || !g?.maps?.Size) return null;

    return (
        <>
            {incidents.map((incident) => (
                <Marker 
                    key={incident.id} 
                    position={(incident as any).coords || KINSHASA_CENTER} 
                    icon={{
                        url: incident.severity === 'high' ? 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png' : 'https://maps.google.com/mapfiles/ms/icons/yellow-pushpin.png',
                        scaledSize: new g.maps.Size(32, 32)
                    }}
                />
            ))}
        </>
    );
};
