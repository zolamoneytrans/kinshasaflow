'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLiveNavigationTrafficAction } from '@/app/actions';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { EventReport } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Google Maps Configuration
const GOOGLE_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

type TrafficStatus = 'BLOQUÉ' | 'SATURÉ' | 'RALENTI' | 'FLUIDE';

interface Incident {
  id: string;
  road: string;
  description: string;
  district: string;
  status: TrafficStatus;
  speed: number;
  freeFlow: number;
  delay: number;
  updatedAt: string;
  source: 'gps' | 'user';
  coords?: { lat: number, lng: number };
}

const MAJOR_AXES = [
  { name: "Boulevard du 30 Juin", district: "Gombe", normalSpeed: 50, lat: -4.308, lng: 15.305 },
  { name: "Boulevard Lumumba", district: "Limete/Masina", normalSpeed: 60, lat: -4.382, lng: 15.362 },
  { name: "Avenue de la Libération", district: "Lingwala", normalSpeed: 45, lat: -4.335, lng: 15.302 },
  { name: "Avenue Kasa-Vubu", district: "Kalamu", normalSpeed: 40, lat: -4.345, lng: 15.312 },
  { name: "Avenue By-Pass", district: "Lemba/Ngaba", normalSpeed: 50, lat: -4.432, lng: 15.315 },
  { name: "Route de Matadi", district: "Ngaliema", normalSpeed: 45, lat: -4.375, lng: 15.265 },
  { name: "Avenue de l'Université", district: "Makala", normalSpeed: 40, lat: -4.395, lng: 15.318 },
  { name: "Avenue des Huileries", district: "Gombe/Lingwala", normalSpeed: 45, lat: -4.325, lng: 15.310 },
  { name: "Avenue Mondjiba", district: "Ngaliema", normalSpeed: 50, lat: -4.328, lng: 15.275 },
  { name: "Avenue Nguma", district: "Ngaliema", normalSpeed: 40, lat: -4.348, lng: 15.268 },
  { name: "Avenue du Tourisme", district: "Ngaliema", normalSpeed: 50, lat: -4.332, lng: 15.245 },
  { name: "Avenue de la Science", district: "Gombe", normalSpeed: 45, lat: -4.315, lng: 15.308 },
  { name: "Avenue des Poids Lourds", district: "Limete", normalSpeed: 40, lat: -4.335, lng: 15.345 },
  { name: "Avenue Luambo Makiadi", district: "Kinshasa", normalSpeed: 40, lat: -4.322, lng: 15.312 },
  { name: "Avenue Pierre Mulele", district: "Gombe", normalSpeed: 45, lat: -4.318, lng: 15.302 },
  { name: "Avenue Elengesa", district: "Makala/Ngiri-Ngiri", normalSpeed: 35, lat: -4.372, lng: 15.305 },
  { name: "Avenue Kimwenza", district: "Kalamu", normalSpeed: 35, lat: -4.355, lng: 15.318 },
  { name: "Boulevard Triomphal", district: "Kasa-Vubu", normalSpeed: 50, lat: -4.338, lng: 15.302 },
  { name: "Avenue de la Justice", district: "Gombe", normalSpeed: 40, lat: -4.305, lng: 15.295 },
  { name: "Avenue Batetela", district: "Gombe", normalSpeed: 40, lat: -4.312, lng: 15.288 },
  { name: "Avenue de l'Ozone", district: "Ngaliema", normalSpeed: 40, lat: -4.352, lng: 15.255 },
  { name: "Avenue Victoire", district: "Kalamu", normalSpeed: 35, lat: -4.342, lng: 15.315 },
];

function classifyTraffic(currentSpeed: number, freeFlowSpeed: number): TrafficStatus {
  const ratio = currentSpeed / freeFlowSpeed;
  if (ratio < 0.10) return "BLOQUÉ";
  if (ratio < 0.40) return "SATURÉ";
  if (ratio < 0.70) return "RALENTI";
  return "FLUIDE";
}

export default function TrafficReports() {
  const [navIncidents, setNavIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<TrafficStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { firestore } = useFirebase();

  // 1. Fetch User Reports from Firebase
  const userReportsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(30));
  }, [firestore]);
  
  const { data: userReports } = useCollection<EventReport>(userReportsQuery);

  // 2. Fetch Navigation Data (Google/GPS Hybrid)
  const fetchNavigationData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getLiveNavigationTrafficAction();
      setLastUpdated(new Date());
      
      const analyzedAxes: Incident[] = MAJOR_AXES.map((axis, idx) => ({
        id: `nav-${idx}`,
        road: axis.name,
        description: "Données Google Navigation synchronisées",
        district: axis.district,
        status: "FLUIDE",
        speed: axis.normalSpeed,
        freeFlow: axis.normalSpeed,
        delay: 0,
        updatedAt: "Temps Réel",
        source: 'gps',
        coords: { lat: axis.lat, lng: axis.lng }
      }));

      data.forEach((inc: any) => {
        const roadName = inc.tm?.shortDesc || inc.tm?.i || "";
        const magnitude = inc.tm?.m || 0;
        const delay = Math.round((inc.tm?.dl || 0) / 60);
        
        const axisIndex = analyzedAxes.findIndex(a => 
          roadName.toLowerCase().includes(a.road.toLowerCase()) || 
          a.road.toLowerCase().includes(roadName.toLowerCase())
        );

        if (axisIndex !== -1) {
          const axis = analyzedAxes[axisIndex];
          let speedFactor = 0.85;
          if (magnitude === 4) speedFactor = 0.05;
          else if (magnitude === 3) speedFactor = 0.25;
          else if (magnitude === 2) speedFactor = 0.55;

          analyzedAxes[axisIndex] = {
            ...axis,
            description: inc.tm?.i || "Ralentissement détecté par l'algorithme Google",
            status: classifyTraffic(axis.freeFlow * speedFactor, axis.freeFlow),
            speed: Math.round(axis.freeFlow * speedFactor),
            delay: delay,
            updatedAt: "Synchronisé",
          };
        }
      });

      setNavIncidents(analyzedAxes);
    } catch (err) {
      console.error("Erreur API Navigation:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNavigationData();
  }, []);

  // 3. Combine both sources (Navigation API + Firebase Community)
  const allIncidents = useMemo(() => {
    const formattedUserReports: Incident[] = (userReports || [])
        .map(rep => ({
            id: rep.id,
            road: rep.location,
            description: rep.description,
            district: "Signalement Communauté",
            status: rep.severity === 'high' ? 'BLOQUÉ' : rep.severity === 'medium' ? 'SATURÉ' : 'RALENTI',
            speed: rep.severity === 'high' ? 5 : rep.severity === 'medium' ? 18 : 35,
            freeFlow: 50,
            delay: rep.severity === 'high' ? 45 : rep.severity === 'medium' ? 20 : 5,
            updatedAt: "Direct Citoyen",
            source: 'user'
        }));

    return [...formattedUserReports, ...navIncidents];
  }, [navIncidents, userReports]);

  const stats = useMemo(() => ({
    blocked: allIncidents.filter(i => i.status === 'BLOQUÉ').length,
    saturated: allIncidents.filter(i => i.status === 'SATURÉ').length,
    slow: allIncidents.filter(i => i.status === 'RALENTI').length,
    fluid: allIncidents.filter(i => i.status === 'FLUIDE').length,
  }), [allIncidents]);

  const filteredIncidents = useMemo(() => {
    let result = allIncidents;
    if (filter !== 'ALL') result = result.filter(i => i.status === filter);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(i => i.road.toLowerCase().includes(q) || i.district.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
        const priority = { 'BLOQUÉ': 0, 'SATURÉ': 1, 'RALENTI': 2, 'FLUIDE': 3 };
        return priority[a.status] - priority[b.status];
    });
  }, [allIncidents, filter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#f8fafc] overflow-hidden">
      
      {/* HEADER AVEC TIME REQUEST */}
      <div className="bg-white border-b shadow-sm z-30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Rapports Intégrés
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">DIRECT</Badge>
                </h1>
                <div className="flex flex-col gap-1 mt-1">
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                        <Navigation className="h-3 w-3 text-primary" />
                        Google Navigation API + Base Firebase Citoyenne
                    </p>
                    {lastUpdated && (
                        <p className="text-[10px] font-black text-primary uppercase flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Requête API Navigation envoyée à : {format(lastUpdated, 'HH:mm:ss')}
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
                <Button size="icon" variant="outline" onClick={() => fetchNavigationData(true)} disabled={isRefreshing} className="rounded-2xl h-12 w-12 border-2">
                    <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
                </Button>
            </div>
        </div>
      </div>

      {/* FILTRES KPI */}
      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'BLOQUÉ', count: stats.blocked, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'SATURÉ', count: stats.saturated, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { label: 'RALENTI', count: stats.slow, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'FLUIDE', count: stats.fluid, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((kpi) => (
                    <Card key={kpi.label} className={cn(
                        "rounded-3xl border-none shadow-sm cursor-pointer transition-all active:scale-95",
                        filter === kpi.label ? "ring-2 ring-primary bg-slate-50" : "bg-white hover:shadow-md"
                    )} onClick={() => setFilter(filter === kpi.label ? 'ALL' : kpi.label as any)}>
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
                    placeholder="Filtrer un quartier (ex: Gombe, Ngaliema)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold text-slate-800"
                />
            </div>

            {/* LISTE DES INCIDENTS FUSIONNÉS */}
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
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                    <div className="flex">
                                        <div className={cn(
                                            "w-2",
                                            incident.status === 'BLOQUÉ' ? "bg-red-600" :
                                            incident.status === 'SATURÉ' ? "bg-orange-500" :
                                            incident.status === 'RALENTI' ? "bg-amber-500" : "bg-emerald-500"
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
                                                        <p className="font-black text-slate-800">{incident.speed} <span className="text-[10px]">km/h</span></p>
                                                    </div>
                                                    <div className="text-right min-w-[60px]">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Retard</p>
                                                        <p className={cn("font-black", incident.delay > 0 ? "text-red-600" : "text-emerald-600")}>
                                                            {incident.delay > 0 ? `+${incident.delay}m` : '--'}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <StatusIndicator status={incident.status} />
                                                        {incident.coords && (
                                                            <Button size="icon" variant="secondary" className="rounded-xl h-10 w-10 shadow-sm" asChild>
                                                                <a 
                                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${incident.coords.lat},${incident.coords.lng}&travelmode=driving`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    title="Ouvrir dans Google Navigation"
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
                        Aucun incident détecté par l'API Navigation ou la communauté.
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
        {source === 'gps' ? 'Navigation API' : 'Utilisateurs'}
    </Badge>
);

const StatusIndicator = ({ status }: { status: TrafficStatus }) => (
    <div className={cn(
        "px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider hidden sm:flex items-center justify-center min-w-[80px]",
        status === 'BLOQUÉ' ? "bg-red-100 text-red-700" :
        status === 'SATURÉ' ? "bg-orange-100 text-orange-700" :
        status === 'RALENTI' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
    )}>
        {status}
    </div>
);
