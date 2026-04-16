'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  Marker,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { 
  Navigation2, 
  Search, 
  Navigation as NavIcon, 
  AlertTriangle, 
  Loader2, 
  Star, 
  Zap, 
  Clock, 
  X, 
  Route as RouteIcon,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { STAR_COSTS, UserProfile, EventReport } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const GOOGLE_MAPS_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";
const KINSHASA_CENTER = { lat: -4.330, lng: 15.313 };

type AlertType = 'red' | 'yellow' | 'info';

interface KFlowAlert {
    id: string;
    type: AlertType;
    message: string;
    distance: string;
    icon: any;
}

// Fonction utilitaire pour calculer la distance entre deux points en mètres
function calculateDistance(p1: {lat: number, lng: number}, p2: {lat: number, lng: number}) {
    const R = 6371000; // Rayon de la terre en mètres
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function KFlowNav() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [routingLocation, setRoutingLocation] = useState<{lat: number, lng: number} | null>(null);
    const [destination, setDestination] = useState<string>('');
    const [isNavigating, setIsNavigating] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
    const [currentAlert, setCurrentAlert] = useState<KFlowAlert | null>(null);

    const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: profile } = useDoc<UserProfile>(userRef);

    const lastRoutingUpdateRef = useRef<number>(0);
    const lastLocationRef = useRef<{lat: number, lng: number} | null>(null);

    const eventsQuery = useMemoFirebase(() => query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(10)), [firestore]);
    const { data: incidents } = useCollection<EventReport>(eventsQuery);

    // Watch location avec filtrage de mouvement pour éviter les glitchs
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(newLoc);

                    // Logique de stabilisation : On ne met à jour l'itinéraire que si :
                    // 1. C'est la première fois
                    // 2. On a bougé de plus de 30 mètres
                    // 3. Plus de 20 secondes se sont écoulées
                    const now = Date.now();
                    const shouldUpdateRoute = !lastLocationRef.current || 
                        calculateDistance(lastLocationRef.current, newLoc) > 30 || 
                        (now - lastRoutingUpdateRef.current) > 20000;

                    if (shouldUpdateRoute) {
                        lastLocationRef.current = newLoc;
                        lastRoutingUpdateRef.current = now;
                        setRoutingLocation(newLoc);
                    }
                },
                (err) => console.warn("GPS Access Denied", err),
                { enableHighAccuracy: true, distanceFilter: 10 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    const handleStartNavigation = async () => {
        if (!user || !profile) return;
        if (!destination) {
            toast({ title: "Destination manquante", description: "Où voulez-vous aller ?", variant: "destructive" });
            return;
        }

        if (profile.currentStarsBalance < STAR_COSTS.NAVIGATION_SESSION) {
            toast({
                title: "Solde insuffisant",
                description: `Une session de navigation K-Flow Nav coûte ${STAR_COSTS.NAVIGATION_SESSION} stars.`,
                variant: "destructive",
                action: <Button asChild variant="outline" size="sm"><Link href="/mes-stars">Recharger</Link></Button>
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
            
            // On force une mise à jour immédiate de la route lors du démarrage
            setRoutingLocation(userLocation);
            setIsNavigating(true);
            toast({ title: "Navigation déverrouillée", description: "Analyse de l'itinéraire en cours..." });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de déduire les stars.", variant: "destructive" });
        } finally {
            setIsUnlocking(false);
        }
    };

    return (
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-2xl bg-slate-900 flex flex-col">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                {/* Search / Control Overlay */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
                    <AnimatePresence mode="wait">
                        {!isNavigating ? (
                            <motion.div 
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -50, opacity: 0 }}
                                className="bg-white/95 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-3 rounded-2xl">
                                        <NavIcon className="text-primary h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-black text-slate-900 leading-tight">K-Flow Nav</h2>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Navigation Temps Réel</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold px-3 py-1">
                                        {STAR_COSTS.NAVIGATION_SESSION} ⭐
                                    </Badge>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Quelle est votre destination ?" 
                                            value={destination}
                                            onChange={e => setDestination(e.target.value)}
                                            className="pl-9 h-12 rounded-xl border-none bg-slate-100 font-bold focus-visible:ring-primary"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleStartNavigation} 
                                        disabled={isUnlocking}
                                        className="h-12 px-6 rounded-xl font-black shadow-lg shadow-primary/20"
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
                                {/* Route Info */}
                                <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-500 p-3 rounded-2xl animate-pulse">
                                            <Navigation2 className="h-6 w-6 fill-white" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black">{routeInfo?.duration || '--'}</p>
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{routeInfo?.distance || '--'}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsNavigating(false)} className="text-white hover:bg-white/10 rounded-full h-10 w-10">
                                        <X />
                                    </Button>
                                </div>

                                {/* Dynamic Alert */}
                                <AnimatePresence>
                                    {currentAlert && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0, y: -20 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className={cn(
                                                "p-4 rounded-[1.5rem] shadow-2xl border-2 flex items-center gap-4",
                                                currentAlert.type === 'red' ? "bg-red-600 border-red-400 text-white" :
                                                currentAlert.type === 'yellow' ? "bg-amber-500 border-amber-300 text-slate-900" :
                                                "bg-blue-600 border-blue-400 text-white"
                                            )}
                                        >
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <currentAlert.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black leading-tight uppercase tracking-tight">{currentAlert.message}</p>
                                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">dans {currentAlert.distance}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Map Display */}
                <div className="flex-1">
                    <Map
                        defaultCenter={KINSHASA_CENTER}
                        center={userLocation || KINSHASA_CENTER}
                        defaultZoom={15}
                        zoom={isNavigating ? 17 : 15}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        mapId="kflow_nav_map"
                        className="w-full h-full"
                    >
                        <TrafficLayerComponent />
                        <DirectionsHandler 
                            origin={routingLocation} 
                            destination={destination} 
                            isNavigating={isNavigating}
                            onRouteUpdate={(info) => setRouteInfo(info)}
                            onAlertUpdate={(alert) => setCurrentAlert(alert)}
                        />
                        
                        <IncidentMarkers incidents={incidents || null} />
                    </Map>
                </div>
                
                {/* Bottom Status Bar */}
                {isNavigating && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4">
                        <div className="bg-white rounded-[2rem] p-4 shadow-2xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">GPS Actif</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setRoutingLocation({...userLocation!})}
                                className="text-primary font-black text-[10px] uppercase gap-1"
                            >
                                <Zap className="h-3 w-3 fill-primary" /> Actualiser
                            </Button>
                        </div>
                    </div>
                )}
            </APIProvider>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────

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

const IncidentMarkers = ({ incidents }: { incidents: EventReport[] | null }) => {
    const map = useMap();
    if (!map || !incidents || typeof window === 'undefined' || !(window as any).google) return null;

    const google = (window as any).google;

    return (
        <>
            {incidents.map(incident => (
                <Marker 
                    key={incident.id} 
                    position={incident.coords || KINSHASA_CENTER} 
                    icon={{
                        url: incident.severity === 'high' ? 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png' : 'https://maps.google.com/mapfiles/ms/icons/yellow-pushpin.png',
                        scaledSize: new google.maps.Size(32, 32)
                    }}
                />
            ))}
        </>
    );
};

function DirectionsHandler({ origin, destination, isNavigating, onRouteUpdate, onAlertUpdate }: { 
    origin: {lat: number, lng: number} | null, 
    destination: string, 
    isNavigating: boolean,
    onRouteUpdate: (info: {distance: string, duration: string}) => void,
    onAlertUpdate: (alert: KFlowAlert | null) => void
}) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    // Initialisation du renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;
        const renderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#248eeb',
                strokeWeight: 8,
                strokeOpacity: 0.8
            }
        });
        setDirectionsRenderer(renderer);
        return () => renderer.setMap(null);
    }, [routesLibrary, map]);

    // Calcul de l'itinéraire et gestion des alertes
    useEffect(() => {
        if (!isNavigating || !origin || !destination || !routesLibrary || !directionsRenderer) return;

        const googleGlobal = (window as any).google;
        if (!googleGlobal || !googleGlobal.maps) return;

        const timeouts: NodeJS.Timeout[] = [];
        const service = new googleGlobal.maps.DirectionsService();

        service.route({
            origin: origin,
            destination: destination,
            travelMode: googleGlobal.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
            drivingOptions: {
                departureTime: new Date(),
                trafficModel: googleGlobal.maps.TrafficModel.BEST_GUESS
            }
        }, (result: any, status: any) => {
            if (status === googleGlobal.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setDirections(result);
                const route = result.routes[0].legs[0];
                
                onRouteUpdate({
                    distance: route.distance?.text || '',
                    duration: route.duration_in_traffic?.text || route.duration?.text || ''
                });

                // Reset des alertes
                onAlertUpdate(null);

                // Simulation séquentielle des alertes IA (propre)
                const t1 = setTimeout(() => {
                    onAlertUpdate({
                        id: 'a1',
                        type: 'red',
                        message: 'Embouteillage critique détecté',
                        distance: '800 mètres',
                        icon: AlertTriangle
                    });
                }, 3000);
                timeouts.push(t1);

                const t2 = setTimeout(() => {
                    onAlertUpdate({
                        id: 'a2',
                        type: 'info',
                        message: 'Route plus rapide disponible via Boulevard',
                        distance: 'Recalcul en cours...',
                        icon: Zap
                    });
                }, 10000);
                timeouts.push(t2);

                const t3 = setTimeout(() => onAlertUpdate(null), 16000);
                timeouts.push(t3);
            }
        });

        return () => {
            timeouts.forEach(t => clearTimeout(t));
            onAlertUpdate(null);
        };
    }, [isNavigating, origin, destination, routesLibrary, directionsRenderer]); // Notez qu'on utilise 'origin' (routingLocation) stabilisé

    return null;
}