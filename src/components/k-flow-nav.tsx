
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  Marker,
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
  Volume2
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

export default function KFlowNav() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [destination, setDestination] = useState<string>('');
    const [isNavigating, setIsNavigating] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string, durationInTraffic?: string} | null>(null);
    const [activeAlert, setActiveAlert] = useState<TrafficAlert | null>(null);
    
    // Ref for tracking GPS distance to stabilize UI
    const lastUpdatePos = useRef<{lat: number, lng: number} | null>(null);

    const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: profile } = useDoc<UserProfile>(userRef);

    const incidentsQuery = useMemoFirebase(() => query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(15)), [firestore]);
    const { data: incidents } = useCollection<EventReport>(incidentsQuery);

    // Watch location
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(newPos);
                },
                (err) => console.warn("GPS Access Denied", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // Play sound for critical alerts
    useEffect(() => {
        if (activeAlert?.type === 'red') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {}); // Browsers might block autoplay
        }
    }, [activeAlert]);

    const handleStartNavigation = async () => {
        if (!user || !profile) return;
        if (!destination) {
            toast({ title: "Destination vide", description: "Où souhaitez-vous aller à Kinshasa ?", variant: "destructive" });
            return;
        }

        if (profile.currentStarsBalance < STAR_COSTS.NAVIGATION_SESSION) {
            toast({
                title: "Solde insuffisant",
                description: `La navigation premium coûte ${STAR_COSTS.NAVIGATION_SESSION} stars.`,
                variant: "destructive",
                action: <Button asChild variant="outline" size="sm"><Link href="/mes-stars">Boutique</Link></Button>
            });
            return;
        }

        setIsUnlocking(true);
        try {
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
                    description: `Session K-Flow Nav vers ${destination}`,
                    timestamp: serverTimestamp(),
                });
            });
            
            setIsNavigating(true);
            toast({ title: "Navigation active", description: "K-Flow analyse votre itinéraire en temps réel." });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de valider la session.", variant: "destructive" });
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleDismissAlert = () => setActiveAlert(null);

    return (
        <div className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-2xl bg-slate-950 flex flex-col border border-slate-800">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                {/* Overlay Recherche & Infos */}
                <div className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                    <div className="w-full max-w-xl pointer-events-auto flex flex-col gap-3">
                        <AnimatePresence mode="wait">
                            {!isNavigating ? (
                                <motion.div 
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -50, opacity: 0 }}
                                    className="bg-white/95 backdrop-blur-2xl p-4 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                                            <NavigationIcon className="text-white h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg font-black text-slate-900 tracking-tight">K-Flow Nav</h2>
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Navigation Temps Réel • Kinshasa</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full border-amber-200">
                                            {STAR_COSTS.NAVIGATION_SESSION} ⭐
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <AutocompleteInput 
                                            value={destination} 
                                            onChange={setDestination} 
                                            onSearch={handleStartNavigation}
                                            isLoading={isUnlocking}
                                        />
                                        <Button 
                                            onClick={handleStartNavigation} 
                                            disabled={isUnlocking || !destination}
                                            className="h-12 px-6 rounded-xl font-black shadow-xl shadow-primary/30"
                                        >
                                            {isUnlocking ? <Loader2 className="animate-spin" /> : "GO"}
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ y: -100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex flex-col gap-3"
                                >
                                    {/* Trip Summary */}
                                    <div className="bg-slate-900/95 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/10 flex justify-between items-center text-white">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                                                <Navigation2 className="h-6 w-6 fill-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black leading-none">{routeInfo?.durationInTraffic || routeInfo?.duration || '--'}</p>
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">{routeInfo?.distance || '--'}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => { setIsNavigating(false); setActiveAlert(null); }} className="text-white hover:bg-white/10 rounded-full h-10 w-10">
                                            <X />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Floating Traffic Alerts */}
                        <AnimatePresence>
                            {activeAlert && (
                                <motion.div
                                    key={activeAlert.id}
                                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
                                    className={cn(
                                        "p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 flex items-center gap-4 backdrop-blur-xl relative overflow-hidden",
                                        activeAlert.type === 'red' ? "bg-red-600/95 border-red-400 text-white" :
                                        activeAlert.type === 'yellow' ? "bg-amber-500/95 border-amber-300 text-slate-950" :
                                        activeAlert.type === 'green' ? "bg-emerald-600/95 border-emerald-400 text-white" :
                                        "bg-blue-600/95 border-blue-400 text-white"
                                    )}
                                >
                                    <div className="p-3 bg-white/20 rounded-2xl shrink-0 shadow-inner">
                                        {activeAlert.type === 'red' ? <AlertOctagon className="h-7 w-7" /> :
                                         activeAlert.type === 'yellow' ? <AlertTriangle className="h-7 w-7" /> :
                                         activeAlert.type === 'green' ? <CheckCircle2 className="h-7 w-7" /> :
                                         <NavigationIcon className="h-7 w-7" />}
                                    </div>
                                    <div className="flex-1 pr-6">
                                        <p className="text-sm font-black leading-tight uppercase tracking-tight">{activeAlert.message}</p>
                                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2">
                                            <Zap className="h-3 w-3 fill-current" />
                                            Analyse K-Flow Live
                                        </p>
                                    </div>
                                    <button onClick={handleDismissAlert} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
                                        <X className="h-4 w-4" />
                                    </button>
                                    {/* Auto-dismiss progress bar */}
                                    <motion.div 
                                        className="absolute bottom-0 left-0 h-1 bg-white/30" 
                                        initial={{ width: "100%" }}
                                        animate={{ width: "0%" }}
                                        transition={{ duration: 7, ease: "linear" }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Map Display */}
                <div className="flex-1">
                    <Map
                        defaultCenter={KINSHASA_CENTER}
                        center={userLocation || KINSHASA_CENTER}
                        defaultZoom={13}
                        zoom={isNavigating ? 17 : 14}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        restriction={{
                            latLngBounds: KINSHASA_BOUNDS,
                            strictBounds: false,
                        }}
                        mapId="kflow_nav_map_v2"
                        className="w-full h-full"
                    >
                        <TrafficLayerComponent />
                        
                        {userLocation && (
                            <Marker
                                position={userLocation}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillColor: '#248eeb',
                                    fillOpacity: 1,
                                    strokeColor: 'white',
                                    strokeWeight: 4,
                                    scale: 12,
                                }}
                            />
                        )}

                        <DirectionsHandler 
                            origin={userLocation} 
                            destination={destination} 
                            isNavigating={isNavigating}
                            onRouteUpdate={setRouteInfo}
                            onAlertUpdate={setActiveAlert}
                        />
                        
                        {incidents && <IncidentMarkers incidents={incidents} />}
                    </Map>
                </div>

                {/* Bottom Navigation Control Bar */}
                <AnimatePresence>
                    {isNavigating && (
                        <motion.div 
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="absolute bottom-8 left-0 right-0 flex justify-center px-4 z-30"
                        >
                            <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-5 shadow-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-3.5 w-3.5 bg-emerald-500 rounded-full animate-ping shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none">Guidage Actif</p>
                                        <p className="text-sm font-black text-slate-800 mt-1.5 truncate max-w-[140px]">{destination}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="text-primary rounded-full hover:bg-primary/10">
                                        <Volume2 className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => { setIsNavigating(false); setActiveAlert(null); }}
                                        className="rounded-2xl font-black text-[10px] uppercase px-5 h-11 shadow-lg shadow-red-200"
                                    >
                                        Quitter
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </APIProvider>
        </div>
    );
}

// ─── Autocomplete Input Component ───────────────────────────────────────────

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
            if (place.formatted_address || place.name) {
                onChange(place.formatted_address || place.name || '');
            }
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
                className="pl-12 h-14 rounded-2xl border-none bg-slate-100 font-bold text-slate-800 focus-visible:ring-primary shadow-inner"
            />
        </div>
    );
}

// ─── Directions and Traffic Logic Handler ───────────────────────────────────

function DirectionsHandler({ origin, destination, isNavigating, onRouteUpdate, onAlertUpdate }: { 
    origin: {lat: number, lng: number} | null, 
    destination: string, 
    isNavigating: boolean,
    onRouteUpdate: (info: {distance: string, duration: string, durationInTraffic?: string}) => void,
    onAlertUpdate: (alert: TrafficAlert | null) => void
}) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const lastAlertTime = useRef<number>(0);
    const lastAlertType = useRef<TrafficAlertType | null>(null);
    const alertTimeout = useRef<NodeJS.Timeout | null>(null);

    // Initialisation du renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;
        const renderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#248eeb',
                strokeWeight: 8,
                strokeOpacity: 0.9,
            }
        });
        setDirectionsRenderer(renderer);
        return () => renderer.setMap(null);
    }, [routesLibrary, map]);

    // Analyse du trafic et alertes dynamiques
    useEffect(() => {
        if (!isNavigating || !origin || !destination || !routesLibrary || !directionsRenderer) return;

        const service = new google.maps.DirectionsService();

        const calculateAndAnalyze = () => {
            service.route({
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: true,
                drivingOptions: {
                    departureTime: new Date(),
                    trafficModel: google.maps.TrafficModel.BEST_GUESS
                }
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    directionsRenderer.setDirections(result);
                    const route = result.routes[0].legs[0];
                    
                    onRouteUpdate({
                        distance: route.distance?.text || '',
                        duration: route.duration?.text || '',
                        durationInTraffic: route.duration_in_traffic?.text
                    });

                    // Logic de déclenchement des notifications
                    const duration = route.duration?.value || 0;
                    const trafficDuration = route.duration_in_traffic?.value || duration;
                    const delayRatio = trafficDuration / duration;

                    const now = Date.now();
                    const throttleTime = 15000; // 15 sec minimum entre deux alertes du même type

                    let newAlert: TrafficAlert | null = null;

                    // 1. Détection de Route Bloquée (Critique)
                    if (delayRatio >= 1.5) {
                        newAlert = {
                            id: `red-${now}`,
                            message: "Route bloquée dans moins de 1 km, veuillez changer d’itinéraire",
                            type: 'red',
                            timestamp: now
                        };
                    } 
                    // 2. Détection de Congestion
                    else if (delayRatio >= 1.25) {
                        newAlert = {
                            id: `yellow-${now}`,
                            message: "Embouteillage détecté à 2 km devant vous",
                            type: 'yellow',
                            timestamp: now
                        };
                    }
                    // 3. Détection de Fluidité (Seulement si on sortait d'un bouchon)
                    else if (delayRatio < 1.1 && lastAlertType.current && lastAlertType.current !== 'green') {
                        newAlert = {
                            id: `green-${now}`,
                            message: "Circulation fluide à 1 km devant vous",
                            type: 'green',
                            timestamp: now
                        };
                    }

                    // Smart rules pour éviter le spam
                    if (newAlert && (newAlert.type !== lastAlertType.current || now - lastAlertTime.current > throttleTime)) {
                        onAlertUpdate(newAlert);
                        lastAlertTime.current = now;
                        lastAlertType.current = newAlert.type;

                        // Auto-dismiss logic for the nav component
                        if (alertTimeout.current) clearTimeout(alertTimeout.current);
                        alertTimeout.current = setTimeout(() => {
                            onAlertUpdate(null);
                        }, 7000);
                    }
                }
            });
        };

        calculateAndAnalyze();
        const interval = setInterval(calculateAndAnalyze, 20000); // Analyse toutes les 20s
        return () => {
            clearInterval(interval);
            if (alertTimeout.current) clearTimeout(alertTimeout.current);
        };
    }, [isNavigating, origin, destination, routesLibrary, directionsRenderer, onRouteUpdate, onAlertUpdate]);

    return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TrafficLayerComponent = () => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const layer = new google.maps.TrafficLayer();
        layer.setMap(map);
        return () => layer.setMap(null);
    }, [map]);
    return null;
};

const IncidentMarkers = ({ incidents }: { incidents: WithId<EventReport>[] }) => {
    const map = useMap();
    if (!map) return null;

    return (
        <>
            {incidents.map((incident) => (
                <Marker 
                    key={incident.id} 
                    position={(incident as any).coords || KINSHASA_CENTER} 
                    icon={{
                        url: incident.severity === 'high' ? 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png' : 'https://maps.google.com/mapfiles/ms/icons/yellow-pushpin.png',
                        scaledSize: new google.maps.Size(32, 32)
                    }}
                />
            ))}
        </>
    );
};
