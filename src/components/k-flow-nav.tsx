
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  Marker,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';
import { 
  Navigation2, 
  Search, 
  AlertTriangle, 
  Loader2, 
  Star, 
  Zap, 
  Clock, 
  X, 
  Navigation as NavigationIcon,
  ShieldAlert,
  Info,
  MapPin,
  ChevronRight,
  ChevronUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { STAR_COSTS, UserProfile, EventReport, WithId } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const GOOGLE_MAPS_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

// Limites strictes de Kinshasa pour restreindre la navigation
const KINSHASA_BOUNDS = {
  north: -4.240,
  south: -4.516,
  west: 15.148,
  east: 15.565,
};

const KINSHASA_CENTER = { lat: -4.330, lng: 15.313 };

export default function KFlowNav() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [destination, setDestination] = useState<string>('');
    const [isNavigating, setIsNavigating] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string, durationInTraffic?: string} | null>(null);
    const [currentAlert, setCurrentAlert] = useState<{message: string, type: 'red' | 'yellow' | 'info'} | null>(null);

    const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: profile } = useDoc<UserProfile>(userRef);

    const eventsQuery = useMemoFirebase(() => query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(15)), [firestore]);
    const { data: incidents } = useCollection<EventReport>(eventsQuery);

    // Watch location
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.warn("GPS Access Denied", err),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

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

    return (
        <div className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-2xl bg-slate-950 flex flex-col border border-slate-800">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                {/* Overlay Recherche & Infos */}
                <div className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                    <div className="w-full max-w-xl pointer-events-auto">
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
                                            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20 animate-pulse">
                                                <Navigation2 className="h-6 w-6 fill-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black leading-none">{routeInfo?.durationInTraffic || routeInfo?.duration || '--'}</p>
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">{routeInfo?.distance || '--'}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setIsNavigating(false)} className="text-white hover:bg-white/10 rounded-full h-10 w-10">
                                            <X />
                                        </Button>
                                    </div>

                                    {/* Smart Alert Panel */}
                                    <AnimatePresence>
                                        {currentAlert && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0, y: -20 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                className={cn(
                                                    "p-4 rounded-[1.75rem] shadow-2xl border-2 flex items-center gap-4 backdrop-blur-md",
                                                    currentAlert.type === 'red' ? "bg-red-600/90 border-red-400 text-white" :
                                                    currentAlert.type === 'yellow' ? "bg-amber-500/90 border-amber-300 text-slate-950" :
                                                    "bg-blue-600/90 border-blue-400 text-white"
                                                )}
                                            >
                                                <div className="p-3 bg-white/20 rounded-xl">
                                                    <AlertTriangle className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-black leading-tight uppercase">{currentAlert.message}</p>
                                                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Analyse K-Flow</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                        mapId="kflow_nav_map_enhanced"
                        className="w-full h-full"
                    >
                        <TrafficLayerComponent />
                        
                        {/* User Location Marker (Blue Dot) */}
                        {userLocation && (
                            <Marker
                                position={userLocation}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillColor: '#248eeb',
                                    fillOpacity: 1,
                                    strokeColor: 'white',
                                    strokeWeight: 3,
                                    scale: 10,
                                }}
                            />
                        )}

                        <DirectionsHandler 
                            origin={userLocation} 
                            destination={destination} 
                            isNavigating={isNavigating}
                            onRouteUpdate={setRouteInfo}
                            onAlertUpdate={setCurrentAlert}
                        />
                        
                        <IncidentMarkers incidents={incidents || null} />
                    </Map>
                </div>

                {/* Footer status for Nav */}
                <AnimatePresence>
                    {isNavigating && (
                        <motion.div 
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="absolute bottom-6 left-0 right-0 flex justify-center px-4 z-30"
                        >
                            <div className="w-full max-w-sm bg-white rounded-[2rem] p-4 shadow-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping" />
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">GPS Actif</p>
                                        <p className="text-xs font-bold text-slate-700 mt-1">Vers {destination}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-primary font-black text-[10px] uppercase gap-2 hover:bg-primary/5 rounded-xl px-4"
                                >
                                    <Zap className="h-3.5 w-3.5 fill-primary" /> Actualiser
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </APIProvider>
        </div>
    );
}

// ─── Composant Autocomplete ───────────────────────────────────────────────────

function AutocompleteInput({ value, onChange, onSearch, isLoading }: { value: string, onChange: (v: string) => void, onSearch: () => void, isLoading: boolean }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const places = useMapsLibrary('places');

    useEffect(() => {
        if (!places || !inputRef.current) return;

        const options = {
            componentRestrictions: { country: 'cd' },
            bounds: KINSHASA_BOUNDS,
            fields: ['formatted_address', 'geometry', 'name'],
            strictBounds: true,
        };

        const autocomplete = new places.Autocomplete(inputRef.current, options);
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
                placeholder="Votre destination à Kinshasa..." 
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                disabled={isLoading}
                className="pl-12 h-14 rounded-2xl border-none bg-slate-100 font-bold text-slate-800 focus-visible:ring-primary shadow-inner"
            />
        </div>
    );
}

// ─── Gestionnaire de Trajet et de Trafic ──────────────────────────────────────

function DirectionsHandler({ origin, destination, isNavigating, onRouteUpdate, onAlertUpdate }: { 
    origin: {lat: number, lng: number} | null, 
    destination: string, 
    isNavigating: boolean,
    onRouteUpdate: (info: {distance: string, duration: string, durationInTraffic?: string}) => void,
    onAlertUpdate: (alert: {message: string, type: 'red' | 'yellow' | 'info'} | null) => void
}) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
    const { toast } = useToast();

    // Initialisation du renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;
        const renderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#248eeb',
                strokeWeight: 10,
                strokeOpacity: 0.9,
            }
        });
        setDirectionsRenderer(renderer);
        return () => renderer.setMap(null);
    }, [routesLibrary, map]);

    // Analyse du trafic et alertes
    useEffect(() => {
        if (!isNavigating || !origin || !destination || !routesLibrary || !directionsRenderer) return;

        const service = new google.maps.DirectionsService();

        const calculateRoute = () => {
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

                    // Analyse des segments de trafic
                    analyzeTrafficSegments(route, onAlertUpdate, toast);
                } else {
                    toast({ title: "Calcul impossible", description: "Vérifiez que la destination est bien à Kinshasa.", variant: "destructive" });
                }
            });
        };

        calculateRoute();
        const interval = setInterval(calculateRoute, 45000); // Mise à jour toutes les 45s
        return () => clearInterval(interval);
    }, [isNavigating, origin, destination, routesLibrary, directionsRenderer, onRouteUpdate, onAlertUpdate, toast]);

    return null;
}

// Fonction d'analyse fine du trafic sur l'itinéraire
function analyzeTrafficSegments(
    route: google.maps.DirectionsLeg, 
    onAlertUpdate: (alert: {message: string, type: 'red' | 'yellow' | 'info'} | null) => void,
    toast: any
) {
    // Calcul de l'indice de congestion
    const duration = route.duration?.value || 0;
    const trafficDuration = route.duration_in_traffic?.value || duration;
    const delayRatio = trafficDuration / duration;

    // Analyse globale immédiate
    if (delayRatio > 1.5) {
        onAlertUpdate({ message: "Embouteillage critique détecté sur votre route", type: "red" });
    } else if (delayRatio > 1.2) {
        onAlertUpdate({ message: "Circulation ralentie à venir", type: "yellow" });
    } else {
        onAlertUpdate({ message: "Circulation fluide sur votre trajet", type: "info" });
    }

    // Analyse par distance (simulée basée sur les étapes de l'itinéraire)
    let cumulativeDistance = 0;
    for (const step of route.steps) {
        cumulativeDistance += step.distance?.value || 0;
        
        // Alertes spécifiques à 1km
        if (cumulativeDistance > 800 && cumulativeDistance < 1200) {
            if (delayRatio > 1.4) {
                toast({ title: "Alerte K-Flow", description: "Route bloquée dans moins de 1 km, veuillez changer d'itinéraire." });
            }
        }
    }
}

// ─── Sous-composants Annexes ─────────────────────────────────────────────────

const TrafficLayerComponent = () => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
        return () => trafficLayer.setMap(null);
    }, [map]);
    return null;
};

const IncidentMarkers = ({ incidents }: { incidents: WithId<EventReport>[] | null }) => {
    if (!incidents || typeof window === 'undefined' || !(window as any).google) return null;

    return (
        <>
            {incidents.map((incident, idx) => (
                <Marker 
                    key={incident.id} 
                    position={(incident as any).coords || KINSHASA_CENTER} 
                    icon={{
                        url: incident.severity === 'high' ? 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png' : 'https://maps.google.com/mapfiles/ms/icons/yellow-pushpin.png',
                        scaledSize: new google.maps.Size(32, 32)
                    }}
                    title={incident.description}
                />
            ))}
        </>
    );
};
