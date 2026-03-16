
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
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getGoogleTrafficStatusAction } from '@/app/actions';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { EventReport } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

/**
 * Liste des axes majeurs de Kinshasa organisée par importance stratégique.
 * Coordonnées optimisées pour des segments de 2-10km afin de garantir la fiabilité du trafic Google.
 */
const MAJOR_AXES = [
  // CBD & TRANSIT
  { name: "Boulevard du 30 Juin", district: "Gombe", origin: { lat: -4.303, lng: 15.315 }, destination: { lat: -4.325, lng: 15.275 } },
  { name: "Boulevard Lumumba (Est)", district: "Limete/Masina", origin: { lat: -4.360, lng: 15.365 }, destination: { lat: -4.400, lng: 15.440 } },
  { name: "Boulevard Lumumba (N'djili)", district: "N'djili/Masina", origin: { lat: -4.400, lng: 15.440 }, destination: { lat: -4.430, lng: 15.500 } },
  { name: "Avenue Kasa-Vubu", district: "Kalamu/Gombe", origin: { lat: -4.310, lng: 15.310 }, destination: { lat: -4.355, lng: 15.315 } },
  
  // NORD & OUEST
  { name: "Route de Matadi (Ouest)", district: "Ngaliema", origin: { lat: -4.328, lng: 15.275 }, destination: { lat: -4.385, lng: 15.265 } },
  { name: "Avenue Mondjiba", district: "Ngaliema", origin: { lat: -4.315, lng: 15.285 }, destination: { lat: -4.350, lng: 15.260 } },
  { name: "Avenue Nguma", district: "Ngaliema", origin: { lat: -4.328, lng: 15.275 }, destination: { lat: -4.355, lng: 15.265 } },
  { name: "Avenue du Tourisme", district: "Ngaliema/Binza", origin: { lat: -4.345, lng: 15.235 }, destination: { lat: -4.328, lng: 15.275 } },
  
  // CENTRE & SUD
  { name: "Avenue de la Libération (24/11)", district: "Lingwala/Gombe", origin: { lat: -4.305, lng: 15.300 }, destination: { lat: -4.335, lng: 15.305 } },
  { name: "Avenue des Huileries", district: "Gombe/Lingwala", origin: { lat: -4.305, lng: 15.310 }, destination: { lat: -4.335, lng: 15.305 } },
  { name: "Avenue de l'Université", district: "Kalamu/UNIKIN", origin: { lat: -4.342, lng: 15.315 }, destination: { lat: -4.415, lng: 15.315 } },
  { name: "Avenue By-Pass (Sud)", district: "Lemba/Ngaba", origin: { lat: -4.455, lng: 15.335 }, destination: { lat: -4.410, lng: 15.315 } },
  
  // NOUVEAUX AXES & PERIPHERIE
  { name: "Avenue Elengesa (Nouveau)", district: "Makala/Selembao", origin: { lat: -4.342, lng: 15.315 }, destination: { lat: -4.430, lng: 15.310 } },
  { name: "Route Mokali", district: "Kimbanseke/Masina", origin: { lat: -4.415, lng: 15.412 }, destination: { lat: -4.385, lng: 15.365 } },
  { name: "Avenue des Poids Lourds", district: "Limete Industriel", origin: { lat: -4.303, lng: 15.315 }, destination: { lat: -4.335, lng: 15.345 } },
  { name: "Boulevard Triomphal", district: "Kasa-Vubu", origin: { lat: -4.335, lng: 15.305 }, destination: { lat: -4.330, lng: 15.320 } },
  { name: "Avenue Kimwenza", district: "Kalamu/Yolo", origin: { lat: -4.342, lng: 15.315 }, destination: { lat: -4.410, lng: 15.330 } },
  { name: "Avenue Landu", district: "Selembao/Ngaba", origin: { lat: -4.385, lng: 15.285 }, destination: { lat: -4.342, lng: 15.305 } },
  { name: "Avenue Bokassa", district: "Barumbu/Gombe", origin: { lat: -4.305, lng: 15.310 }, destination: { lat: -4.325, lng: 15.315 } },
  { name: "Avenue Victoire", district: "Kalamu", origin: { lat: -4.342, lng: 15.315 }, destination: { lat: -4.340, lng: 15.295 } },
];

export default function TrafficReports() {
  const [navIncidents, setNavIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<TrafficStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { firestore } = useFirebase();

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
          description: res.status === "FLUIDE" ? "Circulation fluide (Données GPS)" : 
                       res.status === "INCONNU" ? "Données de trafic indisponibles (Vérifiez la clé API)" :
                       `Retard estimé de ${res.delay} min sur ce segment`,
          district: axis.district,
          status: res.status as TrafficStatus,
          speed: res.speed,
          delay: res.delay,
          updatedAt: "Direct GPS",
          source: 'gps',
          coords: { lat: axis.origin.lat, lng: axis.origin.lng },
          destCoords: { lat: axis.destination.lat, lng: axis.destination.lng }
        };
      });

      setNavIncidents(analyzedAxes);
    } catch (err) {
      console.error("Erreur API Google Routes v2:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrafficData();
    const interval = setInterval(() => {
      fetchTrafficData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchTrafficData]);

  const allIncidents = useMemo(() => {
    const formattedUserReports: Incident[] = (userReports || [])
        .map(rep => ({
            id: rep.id ?? `user-${Math.random().toString(36).substr(2, 9)}`,
            road: rep.location,
            description: rep.description,
            district: "Citoyen",
            status: rep.severity === 'high' ? 'EMBOUTEILLAGE' 
                  : rep.severity === 'medium' ? 'DENSE' 
                  : rep.severity === 'low' ? 'MODÉRÉ'
                  : 'FLUIDE',
            speed: rep.severity === 'high' ? 8 : rep.severity === 'medium' ? 15 : 28,
            delay: rep.severity === 'high' ? 15 : rep.severity === 'medium' ? 7 : 3,
            updatedAt: "Communauté",
            source: 'user'
        }));

    return [...formattedUserReports, ...navIncidents];
  }, [navIncidents, userReports]);

  const stats = useMemo(() => ({
    blocked: allIncidents.filter(i => i.status === 'EMBOUTEILLAGE').length,
    saturated: allIncidents.filter(i => i.status === 'DENSE').length,
    slow: allIncidents.filter(i => i.status === 'MODÉRÉ').length,
    fluid: allIncidents.filter(i => i.status === 'FLUIDE').length,
    unknown: allIncidents.filter(i => i.status === 'INCONNU').length,
  }), [allIncidents]);

  const filteredIncidents = useMemo(() => {
    let result = allIncidents;
    if (filter !== 'ALL') result = result.filter(i => i.status === filter);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(i => i.road.toLowerCase().includes(q) || i.district.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
        const priority = { 'EMBOUTEILLAGE': 0, 'DENSE': 1, 'MODÉRÉ': 2, 'FLUIDE': 3, 'INCONNU': 4 };
        return priority[a.status] - priority[b.status];
    });
  }, [allIncidents, filter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#f8fafc] overflow-hidden">
      
      <div className="bg-white border-b shadow-sm z-30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Rapports Navigation
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">DIRECT</Badge>
                </h1>
                <div className="flex flex-col gap-1 mt-1">
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                        <Navigation className="h-3 w-3 text-primary" />
                        Google Routes API v2 (Segments de 2-10km)
                    </p>
                    {lastUpdated && (
                        <p className="text-[10px] font-black text-primary uppercase flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Synchronisation : {format(lastUpdated, 'HH:mm:ss')}
                        </p>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Button asChild className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 font-black">
                    <Link href="/signaler-embouteillage">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Signaler
                    </Link>
                </Button>
                <Button size="icon" variant="outline" onClick={() => fetchTrafficData(true)} disabled={isRefreshing} className="rounded-2xl h-12 w-12 border-2">
                    <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
                </Button>
            </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'EMBOUTEILLAGE', count: stats.blocked, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'DENSE', count: stats.saturated, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'MODÉRÉ', count: stats.slow, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'FLUIDE', count: stats.fluid, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'INCONNU', count: stats.unknown, icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-100' }
                ].map((kpi) => (
                    <Card key={kpi.label} className={cn(
                        "rounded-3xl border-none shadow-sm cursor-pointer transition-all active:scale-95",
                        filter === kpi.label ? "ring-2 ring-primary bg-slate-50" : "bg-white hover:shadow-md"
                    )} onClick={() => setFilter(filter === kpi.label ? 'ALL' : kpi.label as TrafficStatus)}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                                <p className="text-2xl font-black text-slate-900">{kpi.count}</p>
                            </div>
                            <div className={cn("p-2 rounded-2xl", kpi.bg)}>
                                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                    placeholder="Chercher une route ou commune..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold text-slate-800"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="rounded-3xl border-none animate-pulse h-24 shadow-sm" />
                    ))
                ) : filteredIncidents.length > 0 ? (
                    <AnimatePresence>
                        {filteredIncidents.map((incident, idx) => (
                            <motion.div 
                                key={incident.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                            >
                                <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                    <div className="flex">
                                        <div className={cn(
                                            "w-2",
                                            incident.status === 'EMBOUTEILLAGE' ? "bg-red-600" :
                                            incident.status === 'DENSE' ? "bg-orange-500" :
                                            incident.status === 'MODÉRÉ' ? "bg-amber-500" :
                                            incident.status === 'FLUIDE' ? "bg-emerald-500" : "bg-slate-300"
                                        )} />
                                        <CardContent className="p-5 flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-slate-900">{incident.road}</h3>
                                                        <SourceBadge source={incident.source} />
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium line-clamp-1">{incident.description}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-[10px] font-black uppercase text-primary/70 flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {incident.district}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {incident.updatedAt}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Vitesse</p>
                                                        <p className="font-black text-slate-800">
                                                            {incident.status === 'INCONNU' ? '--' : incident.speed} 
                                                            <span className="text-[10px] ml-0.5">km/h</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right min-w-[60px]">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Retard</p>
                                                        <p className={cn("font-black", incident.delay > 0 ? "text-red-600" : "text-emerald-600")}>
                                                            {incident.status === 'INCONNU' ? '--' : (incident.delay > 0 ? `+${incident.delay}m` : '--')}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <StatusIndicator status={incident.status} />
                                                        {incident.coords && (
                                                            <Button size="icon" variant="secondary" className="rounded-xl h-10 w-10 shadow-sm" asChild title="Naviguer vers ce point">
                                                                <a 
                                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${incident.destCoords?.lat ?? incident.coords.lat},${incident.destCoords?.lng ?? incident.coords.lng}&travelmode=driving`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <Navigation className="h-4 w-4 text-primary fill-primary/20" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="py-20 text-center text-slate-400 italic font-bold">
                        Aucun incident détecté selon vos critères.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

const SourceBadge = ({ source }: { source: 'gps' | 'user' }) => (
    <Badge variant="outline" className={cn(
        "text-[9px] font-black uppercase px-2 py-0.5 border-none flex items-center gap-1",
        source === 'gps' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
    )}>
        {source === 'gps' ? <Navigation className="h-2.5 w-2.5" /> : <Users className="h-2.5 w-2.5" />}
        {source === 'gps' ? 'GPS Nav v2' : 'Citoyen'}
    </Badge>
);

const StatusIndicator = ({ status }: { status: TrafficStatus }) => (
    <div className={cn(
        "px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider hidden sm:flex items-center justify-center min-w-[100px]",
        status === 'EMBOUTEILLAGE' ? "bg-red-100 text-red-700" :
        status === 'DENSE' ? "bg-orange-100 text-orange-700" :
        status === 'MODÉRÉ' ? "bg-amber-100 text-amber-700" :
        status === 'FLUIDE' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
    )}>
        {status === 'EMBOUTEILLAGE' ? '🔴 BLOQUÉ' : 
         status === 'DENSE' ? '🟠 DENSE' : 
         status === 'MODÉRÉ' ? '🟡 MODÉRÉ' : 
         status === 'FLUIDE' ? '🟢 FLUIDE' : '⚪ INCONNU'}
    </div>
);
