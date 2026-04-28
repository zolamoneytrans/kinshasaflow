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
  Map as MapIcon
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
    status: 'fluide' | 'congestionné' | 'bloqué';
    delayMinutes: number;
}

interface SummaryData {
    destination: string;
    distance: string;
    duration: string;
    delayMinutes: number;
    segments: TrafficSegment[];
    recommendation: string;
    bestRouteIndex: number;
}

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
    
    const map = useMap();

    const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: profile } = useDoc<UserProfile>(userRef);

    const incidentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(15));
    }, [firestore]);
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
        if (map && smoothLocation && autoFollow && !showSummary) {
            map.moveCamera({
                center: smoothLocation,
                heading: isNavigating && is3D ? heading : 0,
                tilt: isNavigating && is3D ? 45 : 0,
                zoom: isNavigating ? 18 : 15
            });
        }
    }, [map, smoothLocation, autoFollow, heading, isNavigating, is3D, showSummary]);

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
            // 1. Directions Calculation
            const service = new google.maps.DirectionsService();
            const result = await service.route({
                origin: smoothLocation || KINSHASA_CENTER,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: true,
                drivingOptions: { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS }
            });

            if (!result || !result.routes.length) throw new Error("Aucun itinéraire trouvé.");

            const mainRoute = result.routes[0];
            const leg = mainRoute.legs[0];
            
            // 2. Segment Analysis
            const segments: TrafficSegment[] = [];
            const steps = leg.steps;
            const stepCount = steps.length;
            
            // Analyze 3 major points of the route
            const indices = [0, Math.floor(stepCount / 2), stepCount - 1];
            const geocoder = new google.maps.Geocoder();

            for (const idx of indices) {
                const step = steps[idx];
                const dur = step.duration?.value || 1;
                const durT = step.duration_in_traffic?.value || dur;
                const ratio = durT / dur;

                let status: 'fluide' | 'congestionné' | 'bloqué' = 'fluide';
                if (ratio > 1.6) status = 'bloqué';
                else if (ratio > 1.25) status = 'congestionné';

                // Try to get a name for this segment
                let locationName = "Segment routier";
                try {
                    const geoRes = await geocoder.geocode({ location: step.start_location });
                    if (geoRes.results[0]) {
                        const addr = geoRes.results[0].address_components;
                        const sub = addr.find(c => c.types.includes('sublocality') || c.types.includes('route'));
                        if (sub) locationName = sub.long_name;
                    }
                } catch (e) {}

                segments.push({
                    from: locationName,
                    to: "", // placeholder
                    status,
                    delayMinutes: Math.max(0, Math.round((durT - dur) / 60))
                });
            }

            // 3. Recommendation Logic
            let bestIdx = 0;
            let rec = "Nous recommandons l'itinéraire standard pour sa simplicité.";
            if (result.routes.length > 1) {
                const dur0 = result.routes[0].legs[0].duration_in_traffic?.value || result.routes[0].legs[0].duration?.value || 0;
                const dur1 = result.routes[1].legs[0].duration_in_traffic?.value || result.routes[1].legs[0].duration?.value || 0;
                if (dur1 < dur0 - 120) {
                    bestIdx = 1;
                    rec = "L'itinéraire intelligent est fortement recommandé pour éviter les zones de congestion détectées.";
                }
            }

            // 4. Deduct Stars (Premium Access)
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
                delayMinutes: Math.round(((leg.duration_in_traffic?.value || leg.duration?.value || 0) - (leg.duration?.value || 0)) / 60),
                segments,
                recommendation: rec,
                bestRouteIndex: bestIdx
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
        toast({ title: "Guidage actif", description: "Suivez les instructions sur la carte." });
    };

    const handleReCenter = () => {
        if (!smoothLocation) {
            toast({ title: "GPS indisponible", variant: "destructive" });
            return;
        }
        setAutoFollow(true);
    };

    return (
        <div className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-2xl bg-slate-950 flex flex-col border border-slate-800">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                {/* Search Bar Overlay */}
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
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Analyse Trafic en Temps Réel</p>
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
                                    {isUnlocking ? <Loader2 className="animate-spin" /> : "GO"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Whiteboard Summary Overlay */}
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
                                        <Badge className="bg-white/20 border-white/30 text-white font-bold mb-2">ANALYSE DE TRAJET</Badge>
                                        <h2 className="text-3xl font-black tracking-tight leading-tight">{summaryData.destination}</h2>
                                        <div className="flex items-center gap-6 pt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Distance</span>
                                                <span className="text-xl font-black">{summaryData.distance}</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/20"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Temps Estimé</span>
                                                <span className="text-xl font-black">{summaryData.duration}</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/20"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Retard Trafic</span>
                                                <span className={cn("text-xl font-black", summaryData.delayMinutes > 5 ? "text-amber-300" : "text-emerald-300")}>
                                                    {summaryData.delayMinutes > 0 ? `+${summaryData.delayMinutes} min` : "Fluide"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" /> État des segments
                                        </h3>
                                        <div className="space-y-3">
                                            {summaryData.segments.map((seg, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-3 h-3 rounded-full shadow-sm",
                                                            seg.status === 'fluide' ? "bg-emerald-500" :
                                                            seg.status === 'congestionné' ? "bg-amber-500" : "bg-red-500"
                                                        )} />
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{seg.from}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{seg.status}</p>
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
                                            <p className="text-xs font-black text-primary uppercase tracking-widest">Recommandation K-Flow</p>
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{summaryData.recommendation}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row gap-4">
                                    <Button variant="ghost" onClick={() => setShowSummary(false)} className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex-1">
                                        Voir sur la carte
                                    </Button>
                                    <Button onClick={handleStartNavigation} className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-sm flex-[2] shadow-2xl shadow-primary/30 gap-3">
                                        <Navigation2 className="h-6 w-6 fill-current" />
                                        Démarrer la navigation
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Header Overlay */}
                {isNavigating && (
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                        <div className="w-full max-w-xl pointer-events-auto">
                            <motion.div 
                                initial={{ y: -100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/10 flex justify-between items-center text-white"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                                        <Navigation2 className="h-6 w-6 fill-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black leading-none">
                                            {routeInfo?.allRoutes?.[selectedRouteIndex]?.durationInTraffic || routeInfo?.duration || '--'}
                                        </p>
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
                                            {routeInfo?.allRoutes?.[selectedRouteIndex]?.distance || routeInfo?.distance || '--'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setIs3D(!is3D)} 
                                        className="text-white hover:bg-white/10 rounded-xl h-10 gap-2 border border-white/10"
                                    >
                                        {is3D ? <Layers className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                                        <span className="text-[10px] font-black uppercase">{is3D ? 'Mode 2D' : 'Mode 3D'}</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setIsNavigating(false); setActiveAlert(null); setShowDestInfo(false); }} className="text-white hover:bg-white/10 rounded-full h-10 w-10">
                                        <X />
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
                                            "mt-3 p-5 rounded-[2rem] shadow-2xl border-2 flex items-center gap-4 backdrop-blur-xl relative overflow-hidden",
                                            activeAlert.type === 'red' ? "bg-red-600/95 border-red-400 text-white" :
                                            activeAlert.type === 'yellow' ? "bg-amber-500/95 border-amber-300 text-slate-950" :
                                            "bg-emerald-600/95 border-emerald-400 text-white"
                                        )}
                                    >
                                        <div className="p-3 bg-white/20 rounded-2xl shrink-0 shadow-inner">
                                            {activeAlert.type === 'red' ? <AlertOctagon className="h-7 w-7" /> :
                                            activeAlert.type === 'yellow' ? <AlertTriangle className="h-7 w-7" /> :
                                            <CheckCircle2 className="h-7 w-7" />}
                                        </div>
                                        <div className="flex-1 pr-6">
                                            <p className="text-sm font-black leading-tight uppercase tracking-tight">{activeAlert.message}</p>
                                        </div>
                                        <button onClick={() => setActiveAlert(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                <div className="flex-1">
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
                        mapId="kflow_nav_map_v5"
                        className="w-full h-full"
                    >
                        <TrafficLayerComponent />
                        
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
                                    anchor: (window as any).google ? new (window as any).google.maps.Point(12, 12) : undefined
                                }}
                            />
                        )}

                        <DirectionsHandler 
                            origin={smoothLocation} 
                            destination={destination} 
                            isNavigating={isNavigating}
                            selectedRouteIndex={selectedRouteIndex}
                            onRouteUpdate={setRouteInfo}
                            onAlertUpdate={setActiveAlert}
                            onRouteSelect={setSelectedRouteIndex}
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
                                        anchor: (window as any).google ? new (window as any).google.maps.Point(12, 22) : undefined
                                    }}
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
                                                    <span className="text-slate-400 font-bold">TEMPS ESTIMÉ</span>
                                                    <span className="text-emerald-600 font-black">
                                                        {routeInfo?.allRoutes?.[selectedRouteIndex]?.durationInTraffic || routeInfo.duration}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-slate-400 font-bold">DISTANCE</span>
                                                    <span className="text-slate-700 font-black">
                                                        {routeInfo?.allRoutes?.[selectedRouteIndex]?.distance || routeInfo.distance}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </>
                        )}
                        
                        <IncidentMarkers incidents={incidents || []} />
                        {!showSummary && <MapControls onReCenter={handleReCenter} isAutoFollowing={autoFollow} />}
                    </Map>
                </div>

                <AnimatePresence>
                    {isNavigating && routeInfo?.allRoutes && routeInfo.allRoutes.length > 0 && (
                        <motion.div 
                            initial={{ y: 200 }}
                            animate={{ y: 0 }}
                            exit={{ y: 200 }}
                            className="absolute bottom-6 left-0 right-0 flex justify-center px-4 z-30 pointer-events-none"
                        >
                            <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-4 shadow-2xl border border-slate-100 flex flex-col gap-3 pointer-events-auto overflow-hidden">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <ArrowRightLeft className="h-3 w-3" />
                                        Comparaison d'itinéraires
                                    </p>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px]">TRAFIC LIVE</Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {routeInfo.allRoutes.map((route, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setSelectedRouteIndex(i)}
                                            className={cn(
                                                "flex flex-col p-4 rounded-[1.5rem] border-2 transition-all text-left relative overflow-hidden group",
                                                selectedRouteIndex === i 
                                                    ? (route.isSmart ? "border-purple-500 bg-purple-50" : "border-blue-500 bg-blue-50")
                                                    : "border-slate-100 bg-white hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2 relative z-10">
                                                <Badge className={cn(
                                                    "font-black text-[9px] uppercase px-2",
                                                    route.isSmart ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                                                )}>
                                                    {route.isSmart ? "Intelligent" : "Normal"}
                                                </Badge>
                                                {selectedRouteIndex === i && <CheckCircle2 className={cn("h-4 w-4", route.isSmart ? "text-purple-600" : "text-blue-600")} />}
                                            </div>
                                            <p className="text-xl font-black text-slate-900 leading-none relative z-10">{route.durationInTraffic}</p>
                                            <div className="flex justify-between items-center mt-1 relative z-10">
                                                <p className="text-[10px] font-bold text-slate-400">{route.distance}</p>
                                                {route.delayMinutes > 0 && (
                                                    <p className="text-[9px] font-black text-red-500">+{route.delayMinutes}m retard</p>
                                                )}
                                            </div>
                                            {route.isSmart && (
                                                <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Zap className="h-12 w-12 text-purple-600 fill-current" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </APIProvider>
        </div>
    );
}

function MapControls({ onReCenter, isAutoFollowing }: { onReCenter: () => void, isAutoFollowing: boolean }) {
    const map = useMap();
    const handleZoomIn = () => { if (map) map.setZoom((map.getZoom() || 13) + 1); };
    const handleZoomOut = () => { if (map) map.setZoom((map.getZoom() || 13) - 1); };

    return (
        <div className="absolute bottom-40 right-4 z-30 flex flex-col gap-3">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onReCenter}
                className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all",
                    isAutoFollowing ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                )}
            >
                <LocateFixed className="h-6 w-6" />
            </motion.button>

            <div className="flex flex-col rounded-2xl overflow-hidden border-2 border-slate-100 bg-white shadow-2xl">
                <button onClick={handleZoomIn} className="h-12 w-12 flex items-center justify-center text-slate-600 hover:bg-slate-50 border-b border-slate-100"><Plus className="h-6 w-6" /></button>
                <button onClick={handleZoomOut} className="h-12 w-12 flex items-center justify-center text-slate-600 hover:bg-slate-50"><Minus className="h-6 w-6" /></button>
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
                placeholder="Destination à Kinshasa..." 
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                disabled={isLoading}
                className="pl-12 h-14 rounded-2xl border-none bg-slate-100 font-bold text-slate-800 shadow-inner"
            />
        </div>
    );
}

function DirectionsHandler({ origin, destination, isNavigating, selectedRouteIndex, onRouteUpdate, onAlertUpdate, onRouteSelect }: { 
    origin: {lat: number, lng: number} | null, 
    destination: string, 
    isNavigating: boolean,
    selectedRouteIndex: number,
    onRouteUpdate: (info: RouteInfo) => void,
    onAlertUpdate: (alert: TrafficAlert | null) => void,
    onRouteSelect: (idx: number) => void
}) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [renderers, setRenderers] = useState<google.maps.DirectionsRenderer[]>([]);
    const lastPosUpdate = useRef<{lat: number, lng: number} | null>(null);
    const lastAlertTime = useRef<number>(0);
    const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    // Init Renderers (Max 2 routes for comparison)
    useEffect(() => {
        if (!routesLibrary || !map) return;
        
        const rendererNormal = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: { 
                strokeColor: '#3b82f6', 
                strokeWeight: 6, 
                strokeOpacity: 0.6,
                zIndex: 10
            }
        });

        const rendererSmart = new google.maps.DirectionsRenderer({
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

        const service = new google.maps.DirectionsService();
        service.route({
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            drivingOptions: { 
                departureTime: new Date(), 
                trafficModel: g?.maps?.TrafficModel?.BEST_GUESS || 'best_guess' as any 
            }
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
                const routes = result.routes;
                
                // Update and Show Renderers
                renderers.forEach((r, idx) => {
                    if (routes[idx]) {
                        r.setMap(map); // Re-attach to map in case it was null
                        r.setDirections(result);
                        r.setRouteIndex(idx);
                        
                        // Highlight logic
                        const isSelected = selectedRouteIndex === idx;
                        r.setOptions({
                            polylineOptions: {
                                ...r.get('polylineOptions'),
                                strokeOpacity: isSelected ? 0.9 : 0.25,
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

                // Recommend Smart Route
                if (summaries.length > 1 && summaries[1].isSmart && selectedRouteIndex === 0) {
                    const gain = (routes[0].legs[0].duration_in_traffic?.value || 0) - (routes[1].legs[0].duration_in_traffic?.value || 0);
                    if (gain > 120) {
                        toast({
                            title: "Itinéraire plus rapide !",
                            description: "Un trajet intelligent est disponible pour éviter les bouchons.",
                            action: <Button variant="outline" size="sm" onClick={() => onRouteSelect(1)}>Changer</Button>
                        });
                    }
                }

                // Alert Logic
                const now = Date.now();
                const ratio = (activeLeg.duration_in_traffic?.value || 0) / (activeLeg.duration?.value || 1);
                
                if (now - lastAlertTime.current > 30000) {
                    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
                    
                    let newAlert: TrafficAlert | null = null;
                    if (ratio > 1.5) {
                        newAlert = { id: `a-${now}`, message: "Route bloquée dans moins de 1 km, veuillez changer d’itinéraire", type: 'red', timestamp: now };
                    } else if (ratio > 1.25) {
                        newAlert = { id: `a-${now}`, message: "Embouteillage détecté à 2 km devant vous", type: 'yellow', timestamp: now };
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
    }, [isNavigating, origin, destination, routesLibrary, renderers, selectedRouteIndex, onAlertUpdate, onRouteUpdate, toast, onRouteSelect, map]);

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
    if (!map || !g) return null;

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
