
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrafficReport, STAR_COSTS, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Activity, 
  Star, 
  Loader2, 
  Search, 
  Navigation, 
  MapPin, 
  Zap,
  Info,
  ChevronDown,
  Lock
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import Link from 'next/link';

const API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

const KINSHASA_AXES = [
  { id: "30juin", name: "Boulevard du 30 Juin", coords: { lat: -4.308, lng: 15.305 }, district: "Gombe" },
  { id: "lumumba", name: "Boulevard Lumumba", coords: { lat: -4.382, lng: 15.362 }, district: "Limete/Masina" },
  { id: "liberation", name: "Av. de la Libération (24/11)", coords: { lat: -4.335, lng: 15.302 }, district: "Lingwala" },
  { id: "kasavubu", name: "Avenue Kasa-Vubu", coords: { lat: -4.345, lng: 15.312 }, district: "Kalamu" },
  { id: "bypass", name: "Avenue By-Pass", coords: { lat: -4.432, lng: 15.315 }, district: "Lemba/Ngaba" },
  { id: "matadi", name: "Route de Matadi", coords: { lat: -4.375, lng: 15.265 }, district: "Ngaliema" },
  { id: "universite", name: "Avenue de l'Université", coords: { lat: -4.395, lng: 15.318 }, district: "Makala" },
  { id: "huileries", name: "Avenue des Huileries", coords: { lat: -4.325, lng: 15.310 }, district: "Gombe/Lingwala" },
  { id: "mondjiba", name: "Avenue Mondjiba", coords: { lat: -4.328, lng: 15.275 }, district: "Ngaliema" },
  { id: "nguma", name: "Avenue Nguma", coords: { lat: -4.348, lng: 15.268 }, district: "Ngaliema" },
  { id: "tourisme", name: "Avenue du Tourisme", coords: { lat: -4.332, lng: 15.245 }, district: "Ngaliema" },
  { id: "poidslourds", name: "Av. des Poids Lourds", coords: { lat: -4.335, lng: 15.345 }, district: "Limete" },
  { id: "elengesa", name: "Avenue Elengesa", coords: { lat: -4.372, lng: 15.305 }, district: "Makala" },
  { id: "victoire", name: "Avenue Victoire", coords: { lat: -4.342, lng: 15.315 }, district: "Kalamu" },
  { id: "triomphal", name: "Boulevard Triomphal", coords: { lat: -4.338, lng: 15.302 }, district: "Kasa-Vubu" },
  { id: "justice", name: "Avenue de la Justice", coords: { lat: -4.305, lng: 15.295 }, district: "Gombe" },
  { id: "kimwenza", name: "Avenue Kimwenza", coords: { lat: -4.355, lng: 15.318 }, district: "Kalamu" },
];

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

const StatusCard = ({ axis, verified, onVerify, isVerifying }: { axis: typeof KINSHASA_AXES[0], verified: boolean, onVerify: () => void, isVerifying: boolean }) => {
    const mockStatus = useMemo(() => {
        const statuses = ['FLUIDE', 'RALENTI', 'SATURÉ', 'BLOQUÉ'] as const;
        const index = Math.floor(Math.abs(axis.coords.lat * 10) % 4);
        return statuses[index];
    }, [axis]);

    return (
        <Card className="border-none shadow-lg bg-white overflow-hidden rounded-3xl">
            <div className={cn(
                "h-2 w-full transition-colors duration-500",
                verified ? (
                    mockStatus === 'FLUIDE' ? "bg-emerald-500" :
                    mockStatus === 'RALENTI' ? "bg-amber-500" :
                    mockStatus === 'SATURÉ' ? "bg-orange-500" : "bg-red-600"
                ) : "bg-slate-200"
            )} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{axis.name}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {axis.district} • Kinshasa
                        </p>
                    </div>
                    {verified ? (
                        <Badge className={cn(
                            "font-black px-3 py-1",
                            mockStatus === 'FLUIDE' ? "bg-emerald-100 text-emerald-700" :
                            mockStatus === 'RALENTI' ? "bg-amber-100 text-amber-700" :
                            mockStatus === 'SATURÉ' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                        )}>
                            {mockStatus}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-slate-300 border-slate-200">
                            <Lock className="h-3 w-3 mr-1" />
                            Privé
                        </Badge>
                    )}
                </div>

                <div className="relative">
                    <div className={cn(
                        "transition-all duration-700 space-y-6",
                        !verified && "blur-xl opacity-30 select-none pointer-events-none"
                    )}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vitesse Est.</p>
                                <p className="text-2xl font-black text-slate-800">
                                    {mockStatus === 'FLUIDE' ? '45' : mockStatus === 'RALENTI' ? '25' : mockStatus === 'SATURÉ' ? '12' : '4'}
                                    <span className="text-xs ml-1 font-bold text-slate-400">km/h</span>
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Retard</p>
                                <p className={cn(
                                    "text-2xl font-black",
                                    mockStatus === 'FLUIDE' ? "text-emerald-600" : "text-red-600"
                                )}>
                                    {mockStatus === 'FLUIDE' ? '--' : `+${Math.floor(Math.random() * 20) + 5}m`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Info className="h-4 w-4 text-blue-600 shrink-0" />
                            <p className="text-xs font-medium text-blue-800">
                                {mockStatus === 'FLUIDE' ? "Circulation normale signalée sur tout l'axe." : "Forte densité de véhicules à l'approche des carrefours principaux."}
                            </p>
                        </div>
                    </div>

                    {!verified && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 shadow-2xl flex flex-col items-center gap-4">
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-black text-slate-900">Information Premium</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Déverrouillez pour voir l'état réel</p>
                                </div>
                                <Button 
                                    onClick={onVerify}
                                    disabled={isVerifying}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-6 font-black shadow-xl"
                                >
                                    {isVerifying ? <Loader2 className="animate-spin mr-2" /> : <Star className="mr-2 fill-amber-400 text-amber-400" />}
                                    Voir détails ({STAR_COSTS.ROAD_VERIFY} ⭐)
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function LiveTrafficFeed() {
  const [selectedAxisId, setSelectedAxisId] = useState<string>(KINSHASA_AXES[0].id);
  const [verifiedAxes, setVerifiedAxes] = useState<Set<string>>(new Set());
  const [isVerifying, setIsVerifying] = useState(false);

  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const selectedAxis = useMemo(() => 
    KINSHASA_AXES.find(a => a.id === selectedAxisId) || KINSHASA_AXES[0]
  , [selectedAxisId]);

  const handleVerify = async () => {
    if (!user || !profile) return;

    if (profile.currentStarsBalance < STAR_COSTS.ROAD_VERIFY) {
        toast({
            title: "Stars insuffisantes",
            description: "Rechargez votre solde pour accéder aux détails.",
            variant: "destructive",
            action: <Button asChild variant="outline" size="sm"><Link href="/mes-stars">Boutique</Link></Button>
        });
        return;
    }

    setIsVerifying(true);
    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef!);
            const data = userDoc.data() as UserProfile;
            const newBalance = data.currentStarsBalance - STAR_COSTS.ROAD_VERIFY;
            
            transaction.update(userRef!, {
                currentStarsBalance: newBalance,
                totalStarsUsed: (data.totalStarsUsed || 0) + STAR_COSTS.ROAD_VERIFY
            });

            const starTransRef = doc(collection(userRef!, 'star_transactions'));
            transaction.set(starTransRef, {
                userId: user.uid,
                type: 'spent',
                starsChange: -STAR_COSTS.ROAD_VERIFY,
                balanceAfterTransaction: newBalance,
                description: `Consultation segment : ${selectedAxis.name}`,
                timestamp: serverTimestamp(),
            });
        });

        setVerifiedAxes(prev => new Set(prev).add(selectedAxisId));
        toast({ title: "Segment déverrouillé", description: "Les informations en direct sont maintenant visibles." });
    } catch (error) {
        toast({ title: "Erreur", description: "Impossible de déduire les stars.", variant: "destructive" });
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
        {/* TOP BAR / SEARCH */}
        <div className="p-4 md:p-6 bg-white border-b shadow-sm z-30">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Rechercher un axe routier</label>
                    <Select value={selectedAxisId} onValueChange={setSelectedAxisId}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-800 shadow-inner">
                            <div className="flex items-center gap-3">
                                <Search className="h-5 w-5 text-primary" />
                                <SelectValue placeholder="Choisir une route..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                            {KINSHASA_AXES.map(axis => (
                                <SelectItem key={axis.id} value={axis.id} className="h-12 font-bold cursor-pointer">
                                    {axis.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm shrink-0">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <div>
                        <p className="text-[8px] font-black uppercase text-amber-600 leading-none">Votre Solde</p>
                        <p className="text-lg font-black text-amber-700">{profile?.currentStarsBalance || 0} Stars</p>
                    </div>
                </div>
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 grid lg:grid-cols-2 gap-6 p-4 md:p-6 overflow-hidden">
            
            {/* LEFT: STATUS & REPORTS */}
            <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                <motion.div
                    key={selectedAxisId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <StatusCard 
                        axis={selectedAxis} 
                        verified={verifiedAxes.has(selectedAxisId)}
                        onVerify={handleVerify}
                        isVerifying={isVerifying}
                    />
                </motion.div>

                <Card className="border-none shadow-sm bg-white rounded-3xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Flux Communautaire
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">Poste de police signalé</p>
                                <p className="text-[10px] text-slate-500 font-medium">Près de {selectedAxis.name} • il y a 5m</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full text-xs font-bold text-primary hover:bg-primary/5">
                            Voir plus de signalements
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: MAP PREVIEW */}
            <div className="hidden lg:block h-full min-h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <APIProvider apiKey={API_KEY}>
                    <Map
                        center={selectedAxis.coords}
                        zoom={15}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        mapId="live_traffic_mini_map"
                        className="w-full h-full"
                    >
                        <TrafficLayerComponent />
                    </Map>
                </APIProvider>
            </div>
        </div>

        {/* MOBILE MAP TRIGGER */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <Button size="lg" className="rounded-full h-16 w-16 shadow-2xl" asChild>
                <Link href="/map">
                    <Navigation className="h-6 w-6" />
                </Link>
            </Button>
        </div>
    </div>
  );
}
