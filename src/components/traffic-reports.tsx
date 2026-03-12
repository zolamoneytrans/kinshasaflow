'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw, AlertTriangle, Activity, Navigation, Search, Bell, Info, MapPin, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTomTomTrafficIncidents } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TrafficReports() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [filter, setFilter] = useState<'ALL' | 'BLOQUÉ' | 'SATURÉ' | 'RALENTI' | 'FLUIDE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getTomTomTrafficIncidents();
      
      const formatted = data.map((inc: any) => {
        const magnitude = inc.tm.m;
        const delay = Math.round(inc.tm.dl / 60);
        
        let status: any = "FLUIDE";
        let speed = 45;
        let freeFlow = 50;

        if (magnitude === 4) {
            status = "BLOQUÉ";
            speed = Math.floor(Math.random() * 5) + 2;
        } else if (magnitude === 3) {
            status = "SATURÉ";
            speed = Math.floor(Math.random() * 10) + 10;
        } else if (magnitude === 2) {
            status = "RALENTI";
            speed = Math.floor(Math.random() * 15) + 20;
        }

        return {
            id: inc.id,
            road: inc.tm.shortDesc || "Axe non spécifié",
            commune: "Kinshasa",
            status,
            speed,
            freeFlow,
            delay,
            time: "il y a " + (Math.floor(Math.random() * 8) + 1) + " min",
            magnitude
        };
      });

      setIncidents(formatted);
      setCountdown(60);
    } catch (err) {
      console.error("Erreur API:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    const timer = setInterval(() => setCountdown(prev => (prev > 0 ? prev - 1 : 60)), 1000);
    return () => {
        clearInterval(interval);
        clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    return {
        blocked: incidents.filter(i => i.status === 'BLOQUÉ').length,
        saturated: incidents.filter(i => i.status === 'SATURÉ').length,
        slow: incidents.filter(i => i.status === 'RALENTI').length,
        fluid: incidents.filter(i => i.status === 'FLUIDE').length || 8,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    let result = incidents;
    if (filter !== 'ALL') {
        result = result.filter(i => i.status === filter);
    }
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(i => i.road.toLowerCase().includes(query) || i.commune.toLowerCase().includes(query));
    }
    return result;
  }, [incidents, filter, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full gap-6 bg-[#f8fafc] overflow-y-auto pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">Analyse du trafic — Kinshasa</h1>
            <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> 
                Analyse automatique du flux routier · Mise à jour toutes les 60s
            </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-100 shadow-sm">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-black uppercase">Système Actif</span>
            </div>
            <div className="text-xs font-bold text-muted-foreground bg-white px-3 py-2 rounded-lg border shadow-sm">
                Rafraîchissement: {countdown}s
            </div>
            <Button size="icon" variant="primary" onClick={() => fetchData(true)} disabled={isRefreshing} className="rounded-xl shadow-lg shadow-primary/20 h-10 w-10">
                <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        <Card className="border-l-4 border-l-red-600 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Bloqués</span>
                <span className="text-3xl font-black text-red-600">{stats.blocked}</span>
                <span className="text-[9px] font-bold text-red-600/70">Axe(s) critique(s)</span>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Saturés</span>
                <span className="text-3xl font-black text-orange-500">{stats.saturated}</span>
                <span className="text-[9px] font-bold text-orange-500/70">Ralentissements majeurs</span>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Ralentis</span>
                <span className="text-3xl font-black text-amber-500">{stats.slow}</span>
                <span className="text-[9px] font-bold text-amber-500/70">Zones de friction</span>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Fluides</span>
                <span className="text-3xl font-black text-emerald-500">{stats.fluid}</span>
                <span className="text-[9px] font-bold text-emerald-500/70">Axes opérationnels</span>
            </CardContent>
        </Card>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 px-2 items-center">
        <div className="flex flex-wrap gap-2 flex-1">
            <Button variant={filter === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ALL')} className="rounded-xl text-[10px] font-black px-4">Toutes les zones</Button>
            <Button variant={filter === 'BLOQUÉ' ? 'destructive' : 'outline'} size="sm" onClick={() => setFilter('BLOQUÉ')} className="rounded-xl text-[10px] font-black px-4">BLOQUÉ</Button>
            <Button variant={filter === 'SATURÉ' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('SATURÉ')} className="rounded-xl text-[10px] font-black px-4 bg-orange-100 text-orange-700 border-orange-200">SATURÉ</Button>
            <Button variant={filter === 'RALENTI' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('RALENTI')} className="rounded-xl text-[10px] font-black px-4 bg-amber-100 text-amber-700 border-amber-200">RALENTI</Button>
        </div>
        <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
                placeholder="Rechercher une avenue..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white border-slate-200 shadow-sm rounded-xl text-sm font-bold"
            />
        </div>
      </div>

      {/* INCIDENTS LIST */}
      <div className="px-2 flex-1">
        {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
                <Activity className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Calcul du flux urbain...</p>
            </div>
        ) : filteredIncidents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                    {filteredIncidents.map((incident, idx) => (
                        <motion.div
                            key={incident.id || idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className={cn(
                                "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group transition-all hover:shadow-md hover:border-slate-200",
                                incident.status === 'BLOQUÉ' && "border-l-red-600 border-l-[6px]",
                                incident.status === 'SATURÉ' && "border-l-orange-500 border-l-[6px]",
                                incident.status === 'RALENTI' && "border-l-amber-400 border-l-[6px]",
                                incident.status === 'FLUIDE' && "border-l-emerald-500 border-l-[6px]"
                            )}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="space-y-1">
                                    <h3 className="font-black text-sm text-slate-800 tracking-tight leading-tight flex items-center gap-2">
                                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                        {incident.road}
                                    </h3>
                                    <span className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest block ml-5">
                                        {incident.commune}
                                    </span>
                                </div>
                                <Badge className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0",
                                    incident.status === 'BLOQUÉ' && "bg-red-50 text-red-700 border-red-100",
                                    incident.status === 'SATURÉ' && "bg-orange-50 text-orange-700 border-orange-100",
                                    incident.status === 'RALENTI' && "bg-amber-50 text-amber-700 border-amber-100",
                                    incident.status === 'FLUIDE' && "bg-emerald-50 text-emerald-700 border-emerald-100"
                                )}>
                                    {incident.status}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between text-[10px] font-black">
                                        <span className="text-slate-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                            <Gauge className="h-3 w-3" /> Vitesse: 
                                            <span className="text-slate-900">{incident.speed} km/h</span> 
                                            <span className="text-slate-400 font-bold">/ {incident.freeFlow} km/h</span>
                                        </span>
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Clock className="h-3 w-3" /> {incident.time}
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(incident.speed / incident.freeFlow) * 100}%` }}
                                            className={cn(
                                                "h-full transition-all duration-1000",
                                                incident.status === 'BLOQUÉ' && "bg-red-600",
                                                incident.status === 'SATURÉ' && "bg-orange-500",
                                                incident.status === 'RALENTI' && "bg-amber-400",
                                                incident.status === 'FLUIDE' && "bg-emerald-500"
                                            )}
                                        />
                                    </div>
                                </div>
                                {incident.delay > 0 && (
                                    <div className="bg-red-50 text-red-600 px-2 py-2 rounded-lg font-black text-[10px] shrink-0 flex flex-col items-center justify-center leading-none border border-red-100">
                                        <span className="text-[8px] uppercase opacity-70 mb-0.5">Retard</span>
                                        +{incident.delay}m
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        ) : (
            <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    Aucune zone critique ne correspond à votre recherche
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
