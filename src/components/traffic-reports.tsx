'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Search, 
  Ban, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Navigation,
  Users,
  PlusCircle,
  MapPin,
  HelpCircle,
  Star,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getGoogleTrafficStatusAction } from '@/app/actions';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { EventReport, UserProfile, STAR_COSTS } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type TrafficStatus = 'EMBOUTEILLAGE' | 'DENSE' | 'MODÉRÉ' | 'FLUIDE' | 'INCONNU';

interface Incident {
  id: string;
  road: string;
  description: string;
  district: string;
  status: TrafficStatus;
  speed: number;
  delay: number;
  updatedAt: string;
  source: 'gps' | 'user';
  coords?: { lat: number, lng: number };
  destCoords?: { lat: number, lng: number };
}

const MAJOR_AXES = [
  { name: "Boulevard du 30 Juin", district: "Gombe", origin: { lat: -4.3050, lng: 15.3136 }, destination: { lat: -4.3176, lng: 15.2950 } },
  { name: "Échangeur de Limete", district: "Limete", origin: { lat: -4.3380, lng: 15.3620 }, destination: { lat: -4.3600, lng: 15.3850 } },
  { name: "Boulevard Lumumba (Est)", district: "Limete/Masina", origin: { lat: -4.360, lng: 15.365 }, destination: { lat: -4.400, lng: 15.440 } },
  { name: "Boulevard Lumumba (N'djili)", district: "N'djili/Masina", origin: { lat: -4.400, lng: 15.440 }, destination: { lat: -4.430, lng: 15.500 } },
  { name: "Avenue Kasa-Vubu", district: "Kalamu/Gombe", origin: { lat: -4.310, lng: 15.310 }, destination: { lat: -4.355, lng: 15.315 } },
  { name: "Route de Matadi (N1)", district: "Ngaliema", origin: { lat: -4.328, lng: 15.275 }, destination: { lat: -4.385, lng: 15.265 } },
  { name: "Avenue By-Pass", district: "Lemba/Ngaba", origin: { lat: -4.455, lng: 15.335 }, destination: { lat: -4.410, lng: 15.315 } },
  { name: "Route Mokali", district: "Kimbanseke/Masina", origin: { lat: -4.415, lng: 15.412 }, destination: { lat: -4.385, lng: 15.365 } },
  { name: "Avenue Mondjiba", district: "Ngaliema", origin: { lat: -4.315, lng: 15.285 }, destination: { lat: -4.350, lng: 15.260 } },
  { name: "Avenue Nguma", district: "Ngaliema", origin: { lat: -4.328, lng: 15.275 }, destination: { lat: -4.355, lng: 15.265 } },
];

export default function TrafficReports() {
  const [navIncidents, setNavIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<TrafficStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [navTarget, setNavTarget] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [isStartingNav, setIsStartingNav] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const userReportsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(30));
  }, [firestore]);
  
  const { data: userReports } = useCollection<EventReport>(userReportsQuery);

  const fetchTrafficData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getGoogleTrafficStatusAction(MAJOR_AXES);
      setLastUpdated(new Date());
      
      const analyzedAxes: Incident[] = data.map((res, idx) => {
        const axis = MAJOR_AXES[idx];
        return {
          id: `google-${idx}`,
          road: res.road,
          description: res.status === "FLUIDE" ? "Circulation fluide" : `Retard estimé de ${res.delay} min`,
          district: axis.district,
          status: res.status as TrafficStatus,
          speed: res.speed,
          delay: res.delay,
          updatedAt: "GPS Live",
          source: 'gps',
          coords: axis.origin,
          destCoords: axis.destination
        };
      });

      setNavIncidents(analyzedAxes);
    } catch (err) {
      console.error("Traffic API Error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrafficData(); }, [fetchTrafficData]);

  const handleStartNavigation = async (target: {lat: number, lng: number, name: string}) => {
    if (!user || !profile) return;

    if (profile.currentStarsBalance < STAR_COSTS.NAVIGATION_SESSION) {
        toast({ 
            title: "Solde insuffisant", 
            description: `La navigation premium coûte ${STAR_COSTS.NAVIGATION_SESSION} stars.`, 
            variant: "destructive",
            action: <Button asChild variant="outline" size="sm"><Link href="/mes-stars">Boutique</Link></Button>
        });
        return;
    }

    setIsStartingNav(true);
    
    // Essayer de récupérer la position GPS réelle
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            await processNavPayment(target);
        },
        async (err) => {
            console.warn("GPS Access Denied, using Gombe as default origin.");
            setUserLocation({ lat: -4.308, lng: 15.305 }); // Repli sur Gombe
            await processNavPayment(target);
        },
        { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const processNavPayment = async (target: {lat: number, lng: number, name: string}) => {
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
                description: `Navigation vers : ${target.name}`,
                timestamp: serverTimestamp(),
            });
        });

        setNavTarget(target);
        toast({ title: "Navigation lancée", description: `${STAR_COSTS.NAVIGATION_SESSION} stars déduites.` });
    } catch (e) {
        toast({ title: "Erreur", description: "Impossible de traiter le paiement.", variant: "destructive" });
    } finally {
        setIsStartingNav(false);
    }
  };

  const allIncidents = useMemo(() => {
    const formattedUserReports: Incident[] = (userReports || []).map(rep => ({
        id: rep.id,
        road: rep.location,
        description: rep.description,
        district: "Citoyen",
        status: rep.severity === 'high' ? 'EMBOUTEILLAGE' : rep.severity === 'medium' ? 'DENSE' : 'MODÉRÉ',
        speed: 0, delay: 0, updatedAt: "Communauté", source: 'user'
    }));
    return [...formattedUserReports, ...navIncidents];
  }, [navIncidents, userReports]);

  const filteredIncidents = useMemo(() => {
    let result = allIncidents;
    if (filter !== 'ALL') result = result.filter(i => i.status === filter);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(i => i.road.toLowerCase().includes(q) || i.district.toLowerCase().includes(q));
    }
    return result;
  }, [allIncidents, filter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-50/50 overflow-hidden">
      
      <div className="bg-white border-b shadow-sm z-30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Navigation Live
                    <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">PREMIUM</Badge>
                </h1>
                {lastUpdated && <p className="text-[10px] font-black text-primary uppercase mt-1">Dernier flux : {format(lastUpdated, 'HH:mm:ss')}</p>}
            </div>
            
            <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 h-10 px-4 rounded-xl border-amber-200">
                    <Star className="h-4 w-4 mr-2 fill-amber-500" />
                    {profile?.currentStarsBalance || 0} Stars
                </Badge>
                <Button variant="outline" onClick={() => fetchTrafficData(true)} disabled={isRefreshing} className="rounded-xl h-10 border-2">
                    <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                    Actualiser
                </Button>
            </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                    placeholder="Filtrer un axe ou une commune..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                ) : filteredIncidents.map((incident) => (
                    <Card key={incident.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="flex">
                            <div className={cn(
                                "w-2",
                                incident.status === 'EMBOUTEILLAGE' ? "bg-red-600" :
                                incident.status === 'DENSE' ? "bg-orange-500" : "bg-emerald-500"
                            )} />
                            <CardContent className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-black text-lg text-slate-900">{incident.road}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{incident.description}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase text-primary/70">{incident.district}</Badge>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {incident.updatedAt}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Vitesse</p>
                                        <p className="font-black text-slate-800">{incident.speed || '--'} km/h</p>
                                    </div>
                                    <Button 
                                        disabled={isStartingNav}
                                        onClick={() => handleStartNavigation({
                                            lat: incident.destCoords?.lat || incident.coords?.lat || 0,
                                            lng: incident.destCoords?.lng || incident.coords?.lng || 0,
                                            name: incident.road
                                        })}
                                        className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 font-black"
                                    >
                                        {isStartingNav ? <Loader2 className="animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
                                        Naviguer
                                    </Button>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      </div>

      <Dialog open={!!navTarget} onOpenChange={(open) => !open && setNavTarget(null)}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-3xl border-none">
            <div className="flex flex-col h-full">
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                    <DialogTitle className="text-lg font-black flex items-center gap-2">
                        <Navigation className="text-primary fill-primary/20" />
                        Navigation vers {navTarget?.name}
                    </DialogTitle>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setNavTarget(null)}>
                        <X />
                    </Button>
                </div>
                <div className="flex-1 bg-slate-100 relative">
                    {navTarget && (
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${userLocation?.lat},${userLocation?.lng}&destination=${navTarget.lat},${navTarget.lng}&mode=driving`}
                        ></iframe>
                    )}
                </div>
                <div className="p-4 bg-white border-t flex justify-center">
                    <Button variant="destructive" onClick={() => setNavTarget(null)} className="rounded-xl font-bold h-12 px-8">
                        Quitter la navigation
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}