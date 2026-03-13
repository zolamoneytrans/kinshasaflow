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
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTomTomTrafficIncidents } from '@/app/actions';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { EventReport } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  source: 'tomtom' | 'user';
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

  const { firestore } = useFirebase();

  const userReportsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore]);
  
  const { data: userReports } = useCollection<EventReport>(userReportsQuery);

  const fetchTomTomData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getTomTomTrafficIncidents();
      
      const analyzedAxes: Incident[] = MAJOR_AXES.map((axis, idx) => ({
        id: `axis-${idx}`,
        road: axis.name,
        description: "Flux de circulation normal",
        district: axis.district,
        status: "FLUIDE",
        speed: axis.normalSpeed,
        freeFlow: axis.normalSpeed,
        delay: 0,
        updatedAt: "À l'instant",
        source: 'tomtom'
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
            description: inc.tm?.i || "Ralentissement détecté",
            status: classifyTraffic(axis.freeFlow * speedFactor, axis.freeFlow),
            speed: Math.round(axis.freeFlow * speedFactor),
            delay: delay,
            updatedAt: "Mis à jour",
          };
        }
      });

      setTomTomIncidents(analyzedAxes);
    } catch (err) {
      console.error("Erreur TomTom:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTomTomData();
  }, []);

  const allIncidents = useMemo(() => {
    const formattedUserReports: Incident[] = (userReports || []).map(rep => ({
        id: rep.id,
        road: rep.location,
        description: rep.description,
        district: "Communauté",
        status: rep.severity === 'high' ? 'BLOQUÉ' : rep.severity === 'medium' ? 'SATURÉ' : 'RALENTI',
        speed: rep.severity === 'high' ? 5 : rep.severity === 'medium' ? 15 : 30,
        freeFlow: 50,
        delay: rep.severity === 'high' ? 45 : 15,
        updatedAt: "Signalé en direct",
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
    <div className="flex flex-col h-full w-full gap-4 md:gap-6 bg-[#f8fafc] overflow-y-auto pb-10">
      
      {/* HEADER ANALYTIQUE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-6 pt-6">
        <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Analyse du trafic
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] md:text-xs">Direct</Badge>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                Navigation GPS + Communauté · Données en temps réel
            </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl h-10 px-6 border-slate-200 bg-white shadow-sm font-bold text-slate-900 hover:bg-slate-50">
                <Link href="/signaler-embouteillage" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    Signaler un incident
                </Link>
            </Button>
            <Button size="icon" variant="outline" onClick={() => fetchTomTomData(true)} disabled={isRefreshing} className="rounded-xl h-10 w-10 border-slate-200 bg-white shadow-sm">
                <RefreshCw className={cn("h-5 w-5 text-slate-600", isRefreshing && "animate-spin")} />
            </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-4 md:px-6">
        {[
            { label: 'Bloqué', count: stats.blocked, icon: Ban, color: 'text-red-600', bg: 'bg-red-50', sub: '< 10% vitesse' },
            { label: 'Saturé', count: stats.saturated, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', sub: '10–40% vitesse' },
            { label: 'Ralenti', count: stats.slow, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', sub: '40–70% vitesse' },
            { label: 'Fluide', count: stats.fluid, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: '> 70% vitesse' }
        ].map((kpi) => (
            <Card key={kpi.label} className={cn(
                "rounded-2xl border-none shadow-sm bg-white hover:shadow-md transition-all cursor-pointer ring-2 ring-transparent",
                filter === kpi.label && "ring-primary/20 bg-slate-50"
            )} onClick={() => setFilter(kpi.label as TrafficStatus)}>
                <CardContent className="p-3 md:p-5 flex justify-between items-start">
                    <div className="space-y-0.5 md:space-y-1">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                        <p className="text-xl md:text-3xl font-black text-slate-900">{kpi.count}</p>
                        <p className="text-[8px] md:text-[10px] font-medium text-slate-400 hidden xs:block">{kpi.sub}</p>
                    </div>
                    <div className={cn("p-1.5 md:p-2.5 rounded-xl", kpi.bg)}>
                        <kpi.icon className={cn("h-4 w-4 md:h-6 md:w-6", kpi.color)} />
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* FILTRES & RECHERCHE */}
      <div className="px-4 md:px-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
            <h2 className="text-base md:text-lg font-bold text-slate-800 self-start md:self-auto">
                Zones analysées ({filteredIncidents.length})
            </h2>
            <div className="w-full md:flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Filtrer par rue ou commune..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-white border-slate-200 shadow-sm rounded-xl text-sm w-full"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                <Button 
                    variant={filter === 'ALL' ? 'default' : 'outline'} 
                    onClick={() => setFilter('ALL')}
                    className={cn("rounded-full px-4 h-8 text-[10px] font-bold whitespace-nowrap", filter === 'ALL' ? "bg-slate-900 text-white" : "bg-white text-slate-500 border-slate-200")}
                >
                    Toutes
                </Button>
                {['BLOQUÉ', 'SATURÉ', 'RALENTI'].map((f) => (
                    <Button 
                        key={f}
                        variant={filter === f ? 'default' : 'outline'} 
                        onClick={() => setFilter(f as any)}
                        className={cn("rounded-full px-4 h-8 text-[10px] font-bold whitespace-nowrap", filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-500 border-slate-200")}
                    >
                        {f}
                    </Button>
                ))}
            </div>
        </div>
      </div>

      {/* LISTE DES DONNÉES */}
      <div className="px-4 md:px-6 flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* VUE TABLEAU (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Zone / Rue</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">District / Source</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vitesse</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Retard</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mise à jour</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i} className="animate-pulse border-b border-slate-50">
                                    <td colSpan={6} className="px-6 py-6 h-16"><div className="h-4 bg-slate-100 rounded w-3/4"></div></td>
                                </tr>
                            ))
                        ) : filteredIncidents.length > 0 ? (
                            <AnimatePresence>
                                {filteredIncidents.map((incident, idx) => (
                                    <motion.tr 
                                        key={incident.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm">{incident.road}</span>
                                                <span className="text-[11px] text-slate-400 font-medium line-clamp-1">{incident.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit">
                                                    {incident.district}
                                                </span>
                                                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                                    {incident.source === 'tomtom' ? <Navigation className="h-2 w-2" /> : <Users className="h-2 w-2" />}
                                                    {incident.source === 'tomtom' ? 'GPS' : 'Communauté'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={incident.status} />
                                        </td>
                                        <td className="px-6 py-4 min-w-[140px]">
                                            <SpeedIndicator speed={incident.speed} freeFlow={incident.freeFlow} status={incident.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <DelayText delay={incident.delay} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[11px] text-slate-400 font-semibold">{incident.updatedAt}</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        ) : <EmptyState />}
                    </tbody>
                </table>
            </div>

            {/* VUE MOBILE */}
            <div className="md:hidden divide-y divide-slate-100">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 animate-pulse space-y-3">
                            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-50 rounded w-3/4"></div>
                        </div>
                    ))
                ) : filteredIncidents.length > 0 ? (
                    <AnimatePresence>
                        {filteredIncidents.map((incident, idx) => (
                            <motion.div 
                                key={incident.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="p-4 space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 text-sm leading-tight">{incident.road}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{incident.district}</span>
                                    </div>
                                    <StatusBadge status={incident.status} size="sm" />
                                </div>
                                
                                <div className="space-y-2">
                                    <SpeedIndicator speed={incident.speed} freeFlow={incident.freeFlow} status={incident.status} />
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                        <DelayText delay={incident.delay} />
                                        <span className="text-slate-400 flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" />
                                            {incident.updatedAt}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : <EmptyState />}
            </div>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status, size = 'default' }: { status: TrafficStatus, size?: 'sm' | 'default' }) => (
    <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase tracking-wider",
        size === 'sm' ? "text-[8px]" : "text-[10px]",
        status === 'BLOQUÉ' && "bg-red-50 text-red-600",
        status === 'SATURÉ' && "bg-orange-50 text-orange-500",
        status === 'RALENTI' && "bg-amber-50 text-amber-500",
        status === 'FLUIDE' && "bg-emerald-50 text-emerald-600"
    )}>
        <div className={cn(
            "rounded-full",
            size === 'sm' ? "w-1 h-1" : "w-1.5 h-1.5",
            status === 'BLOQUÉ' && "bg-red-600",
            status === 'SATURÉ' && "bg-orange-500",
            status === 'RALENTI' && "bg-amber-500",
            status === 'FLUIDE' && "bg-emerald-600"
        )} />
        {status}
    </div>
);

const SpeedIndicator = ({ speed, freeFlow, status }: { speed: number, freeFlow: number, status: TrafficStatus }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-[10px] font-black">
            <span className="text-slate-800">{speed} <span className="text-slate-400 font-bold uppercase">KM/H</span></span>
            <span className="text-slate-300">/ {freeFlow}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
                className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    status === 'BLOQUÉ' && "bg-red-600",
                    status === 'SATURÉ' && "bg-orange-500",
                    status === 'RALENTI' && "bg-amber-500",
                    status === 'FLUIDE' && "bg-emerald-500"
                )}
                style={{ width: `${Math.min((speed / freeFlow) * 100, 100)}%` }}
            />
        </div>
    </div>
);

const DelayText = ({ delay }: { delay: number }) => (
    delay > 0 ? (
        <span className="text-red-600 font-black text-xs md:text-sm">+{delay} min</span>
    ) : (
        <span className="text-slate-300 font-bold text-xs md:text-sm">--</span>
    )
);

const EmptyState = () => (
    <div className="py-20 text-center text-slate-400 italic font-medium text-sm">
        Aucune donnée ne correspond à vos critères.
    </div>
);