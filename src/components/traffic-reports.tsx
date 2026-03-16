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
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTomTomTrafficIncidents } from '@/app/actions';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { EventReport } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
}

const MAJOR_AXES = [
  { name: "Boulevard du 30 Juin", district: "Gombe", normalSpeed: 50 },
  { name: "Boulevard Lumumba", district: "Limete/Masina", normalSpeed: 60 },
  { name: "Avenue de la Libération", district: "Lingwala", normalSpeed: 45 },
  { name: "Avenue Kasa-Vubu", district: "Kalamu", normalSpeed: 40 },
  { name: "Avenue By-Pass", district: "Lemba/Ngaba", normalSpeed: 50 },
  { name: "Route de Matadi", district: "Ngaliema", normalSpeed: 45 },
  { name: "Avenue de l'Université", district: "Makala", normalSpeed: 40 },
  { name: "Avenue des Huileries", district: "Gombe/Lingwala", normalSpeed: 45 },
  { name: "Avenue Mondjiba", district: "Ngaliema", normalSpeed: 50 },
  { name: "Avenue Nguma", district: "Ngaliema", normalSpeed: 40 },
  { name: "Avenue du Tourisme", district: "Ngaliema", normalSpeed: 50 },
  { name: "Avenue de la Science", district: "Gombe", normalSpeed: 45 },
  { name: "Avenue des Poids Lourds", district: "Limete", normalSpeed: 40 },
  { name: "Avenue Luambo Makiadi", district: "Kinshasa", normalSpeed: 40 },
  { name: "Avenue Pierre Mulele", district: "Gombe", normalSpeed: 45 },
  { name: "Avenue Elengesa", district: "Makala/Ngiri-Ngiri", normalSpeed: 35 },
  { name: "Avenue Kimwenza", district: "Kalamu", normalSpeed: 35 },
  { name: "Boulevard Triomphal", district: "Kasa-Vubu", normalSpeed: 50 },
  { name: "Avenue de la Justice", district: "Gombe", normalSpeed: 40 },
  { name: "Avenue Batetela", district: "Gombe", normalSpeed: 40 },
  { name: "Avenue de l'Ozone", district: "Ngaliema", normalSpeed: 40 },
  { name: "Avenue Victoire", district: "Kalamu", normalSpeed: 35 },
];

function classifyTraffic(currentSpeed: number, freeFlowSpeed: number): TrafficStatus {
  const ratio = currentSpeed / freeFlowSpeed;
  if (ratio < 0.10) return "BLOQUÉ";
  if (ratio < 0.40) return "SATURÉ";
  if (ratio < 0.70) return "RALENTI";
  return "FLUIDE";
}

export default function TrafficReports() {
  const [tomtomIncidents, setTomTomIncidents] = useState<Incident[]>([]);
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

  // 2. Fetch GPS Data from Navigation API
  const fetchTomTomData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getTomTomTrafficIncidents();
      setLastUpdated(new Date());
      
      const analyzedAxes: Incident[] = MAJOR_AXES.map((axis, idx) => ({
        id: `gps-${idx}`,
        road: axis.name,
        description: "Analyse GPS en temps réel",
        district: axis.district,
        status: "FLUIDE",
        speed: axis.normalSpeed,
        freeFlow: axis.normalSpeed,
        delay: 0,
        updatedAt: "À l'instant",
        source: 'gps'
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
            description: inc.tm?.i || "Ralentissement détecté par satellite",
            status: classifyTraffic(axis.freeFlow * speedFactor, axis.freeFlow),
            speed: Math.round(axis.freeFlow * speedFactor),
            delay: delay,
            updatedAt: "Synchronisé",
          };
        }
      });

      setTomTomIncidents(analyzedAxes);
    } catch (err) {
      console.error("Erreur Navigation API:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTomTomData();
  }, []);

  // 3. Combine both sources (GPS + Firebase)
  const allIncidents = useMemo(() => {
    const formattedUserReports: Incident[] = (userReports || [])
        .map(rep => ({
            id: rep.id,
            road: rep.location,
            description: rep.description,
            district: "Signalement Citoyen",
            status: rep.severity === 'high' ? 'BLOQUÉ' : rep.severity === 'medium' ? 'SATURÉ' : 'RALENTI',
            speed: rep.severity === 'high' ? 5 : rep.severity === 'medium' ? 18 : 35,
            freeFlow: 50,
            delay: rep.severity === 'high' ? 45 : rep.severity === 'medium' ? 20 : 5,
            updatedAt: "Direct Communauté",
            source: 'user'
        }));

    return [...formattedUserReports, ...tomtomIncidents];
  }, [tomtomIncidents, userReports]);

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
      
      {/* HEADER INTEGRÉ */}
      <div className="bg-white border-b shadow-sm z-30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Rapports Hybrides
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">LIVE</Badge>
                </h1>
                <div className="flex flex-col gap-1 mt-1">
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Navigation Google + Signalements Communautaires
                    </p>
                    {lastUpdated && (
                        <p className="text-[10px] font-black text-primary uppercase flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Dernière requête API Navigation : {format(lastUpdated, 'HH:mm:ss')}
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
                <Button size="icon" variant="outline" onClick={() => fetchTomTomData(true)} disabled={isRefreshing} className="rounded-2xl h-12 w-12 border-2">
                    <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
                </Button>
            </div>
        </div>
      </div>

      {/* FILTRES & KPI */}
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
                    placeholder="Filtrer par quartier ou avenue..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold text-slate-800"
                />
            </div>

            {/* LISTE DES INCIDENTS */}
            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className="rounded-3xl border-none animate-pulse h-24" />
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
                                                <div className="space-y-1">
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

                                                <div className="flex items-center gap-6">
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
                                                    <div className="hidden sm:block">
                                                        <StatusIndicator status={incident.status} />
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
                        Aucun incident trouvé avec ces critères.
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
        {source === 'gps' ? 'Navigation' : 'Communauté'}
    </Badge>
);

const StatusIndicator = ({ status }: { status: TrafficStatus }) => (
    <div className={cn(
        "px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider",
        status === 'BLOQUÉ' ? "bg-red-100 text-red-700" :
        status === 'SATURÉ' ? "bg-orange-100 text-orange-700" :
        status === 'RALENTI' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
    )}>
        {status}
    </div>
);
